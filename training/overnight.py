"""Bounded local PPO/evaluation cycle. No LLM calls, cloud, or notifications."""
import argparse
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

from dungeon_report import report,summary


def gate(before,after):
    reasons=[]; improved=False
    for mode in ['deterministic','sampled']:
        a,b=before['policies'][mode],after['policies'][mode]
        if b.get('unsupported',0)>a.get('unsupported',0): reasons.append(mode+': unsupported decisions')
        if b['deaths']>a['deaths']+1: reasons.append(mode+': increased deaths')
        if b['meanHealthLost']>a['meanHealthLost']+1: reasons.append(mode+': increased damage')
        if b['meanRoomsVisited']<a['meanRoomsVisited']*.8: reasons.append(mode+': room regression')
        if b['meanPositionsVisited']<a['meanPositionsVisited']*.75: reasons.append(mode+': exploration regression')
        if b['maximumDepth']<a['maximumDepth']: reasons.append(mode+': depth regression')
        improved |= (b['meanRoomsVisited']>=a['meanRoomsVisited']+.25
                     or b['reachedDeeperFloor']>a['reachedDeeperFloor']
                     or (b['meanHealthLost']<=a['meanHealthLost']-.25
                         and b['meanRoomsVisited']>=a['meanRoomsVisited']))
    return {'regression':bool(reasons),'advance':bool(improved and not reasons),'reasons':reasons}


def atomic_json(path,data):
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data,indent=2)); temporary.replace(path)


def adaptive_retry(rate,decision,no_gain):
    """Rollback and reduce update size after regression or two neutral rounds."""
    retry=decision['regression'] or no_gain>=2
    return retry, max(1.25e-6,rate/2) if retry else rate


def memory_ok():
    data={line.split(':')[0]:int(line.split()[1]) for line in Path('/proc/meminfo').read_text().splitlines()}
    return data['MemAvailable']>=512*1024 and data['SwapTotal']-data['SwapFree']<2*1024*1024


def run(args):
    root=args.root; job=root/args.name; job.mkdir(exist_ok=False)
    repo=Path(__file__).resolve().parents[1]
    revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
    state={'status':'running','deadline':args.deadline,'git':revision,'phase':'starting',
           'rounds':[],'selectedModel':str(getattr(args,'source_model',None) or root/'navigation-model-001/final.zip')}
    workers=getattr(args,'workers',4)
    adaptive=getattr(args,'adaptive',False)
    rehearsal=getattr(args,'rehearsal',False)
    state['rehearsal']=rehearsal
    state['adaptive']=adaptive
    rate=getattr(args,'learning_rate',1e-5)
    def save():
        state['updatedAt']=time.time(); atomic_json(job/'status.json',state)
    def execute(label,arguments):
        if time.time()>=args.deadline or (job/'STOP').exists(): raise RuntimeError('time limit or requested stop')
        if shutil.disk_usage(root).free<3*1024**3: raise RuntimeError('less than 3 GiB free disk')
        if not memory_ok(): raise RuntimeError('memory pressure before stage')
        if subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()!=revision:
            raise RuntimeError('checkout revision changed')
        state['phase']=label; state['stageStartedAt']=time.time(); save()
        with (job/(label+'.log')).open('w') as log:
            proc=subprocess.Popen([sys.executable,*map(str,arguments)],cwd=repo,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
            state['childPid']=proc.pid; save()
            try:
                while proc.poll() is None:
                    if time.time()>=args.deadline or (job/'STOP').exists(): raise RuntimeError('time limit or requested stop')
                    if not memory_ok(): raise RuntimeError('memory pressure')
                    if shutil.disk_usage(root).free<3*1024**3: raise RuntimeError('less than 3 GiB free disk')
                    try: proc.wait(timeout=10)
                    except subprocess.TimeoutExpired: pass
                if proc.returncode: raise RuntimeError(label+' failed: '+str(proc.returncode))
            finally:
                # Descendants may outlive a failed Python parent. This session belongs
                # exclusively to this stage, so clean its process group in either case.
                try: os.killpg(proc.pid,signal.SIGTERM)
                except ProcessLookupError: pass
                try: proc.wait(timeout=10)
                except subprocess.TimeoutExpired: pass
                try: os.killpg(proc.pid,signal.SIGKILL)
                except ProcessLookupError: pass
                proc.wait()
                state.pop('childPid',None); save()
    try:
        reference=getattr(args,'source_evaluation',None) or root/'navigation-model-001-after'
        if getattr(args,'collect_recovery',None):
            execute('recovery-collect',['training/dungeon_imitation.py','collect',
                    '--recovery-model',args.collect_recovery,'--out',root/f'{args.name}-data',
                    '--seeds',getattr(args,'collection_seeds',16),'--seed-start',getattr(args,'collection_start',0),'--budget','512'])
            state.update(status='complete',phase='finished',stopReason='recovery collection only; model unchanged')
            save(); return
        if getattr(args,'evaluation_only',None):
            # Reuse the reference's exact episode count; report checks all contracts
            # and seed/rotation pairs. This path never trains or selects a new model.
            manifest=json.loads((reference/'manifest.json').read_text())
            evaluation=root/f'{args.name}-eval'
            execute('diagnostic-eval',['training/dungeon_pilot.py','--evaluate',args.evaluation_only,
                    '--out',evaluation,'--envs','1','--budget',manifest['budget'],
                    '--eval-seeds',len(manifest['heldOutSeeds'])])
            atomic_json(job/'diagnostic-report.json',report(evaluation,reference))
            state.update(status='complete',phase='finished',stopReason='evaluation only; no model promotion')
            save(); return
        baseline=report(reference)
        best_model=Path(state['selectedModel']); best_eval=reference
        next_model=best_model
        no_gain=0
        for index,steps in enumerate((([16384]+[32768]*5) if adaptive else [16384,32768,32768])[:getattr(args,'max_rounds',6)],1):
            if args.deadline-time.time()<3600:
                state['stopReason']='insufficient time for another training/evaluation round'; break
            model=root/f'{args.name}-r{index}'
            evaluation=root/f'{args.name}-r{index}-eval'
            execute(f'r{index}-train',['training/dungeon_pilot.py','--resume',next_model,'--out',model,
                                      '--envs',workers,'--reconfigure-workers','--steps',steps,'--budget','512','--eval-seeds','4']
                    + (['--learning-rate',rate] if adaptive else [])
                    + (['--rehearsal-navigation',root/'navigation-data-001',
                        '--rehearsal-combat',root/'teacher-legal-open-001'] if rehearsal else [])
                    + (['--rejection-feedback'] if getattr(args,'rejection_feedback',False) else [])
                    + (['--rehearsal-recovery',args.recovery_data] if getattr(args,'recovery_data',None) else []))
            execute(f'r{index}-eval',['training/dungeon_pilot.py','--evaluate',model/'final.zip','--out',evaluation,
                                     '--envs','1','--budget','512','--eval-seeds','4'])
            comparison=report(evaluation,best_eval)
            atomic_json(job/f'r{index}-report.json',comparison)
            decision=gate(baseline,comparison)
            state['rounds'].append({'round':index,'steps':steps,'learningRateOverride':rate if adaptive else None,
                                    **decision,'results':comparison['policies']})
            if decision['regression']:
                if adaptive:
                    if rate<=1.25e-6:
                        state['stopReason']='regression at minimum learning rate; needs diagnosis'; save(); break
                    _,rate=adaptive_retry(rate,decision,no_gain)
                    next_model=best_model; no_gain=0; save(); continue
                state['stopReason']='regression gate; reference preserved'; save(); break
            next_model=model/'final.zip'
            if decision['advance']:
                best_model=model/'final.zip'; best_eval=evaluation; baseline=comparison; no_gain=0
                state['selectedModel']=str(best_model)
            else: no_gain+=1
            save()
            if no_gain>=2:
                if adaptive:
                    if rate<=1.25e-6:
                        state['stopReason']='no gain at minimum learning rate; needs diagnosis'; break
                    _,rate=adaptive_retry(rate,decision,no_gain)
                    next_model=best_model; no_gain=0; continue
                state['stopReason']='two rounds without qualifying gain'; break
        # These extra four seeds were not used for the continuation gates.
        if best_eval!=reference and args.deadline-time.time()>=3600:
            audits=[]
            audit_start=getattr(args,'audit_start',None)
            if audit_start is None: audit_start=8 if rehearsal else 4
            audit_count=8 if rehearsal else 4
            state['auditSeedStart']=audit_start
            for label,model in [('reference',getattr(args,'source_model',None) or root/'navigation-model-001/final.zip'),('candidate',best_model)]:
                out=root/f'{args.name}-audit-{label}'
                execute('audit-'+label,['training/dungeon_pilot.py','--evaluate',model,'--out',out,
                                        '--envs','1','--budget','512','--eval-seeds',audit_start+audit_count])
                audits.append(out)
            result={}
            for mode in ['deterministic','sampled','random']:
                result[mode]={label:summary(json.loads((path/f'{mode}-evaluation.json').read_text())[audit_start:])
                              for label,path in zip(['reference','candidate'],audits)}
            atomic_json(job/'reserve-seed-audit.json',result)
            state['reserveAudit']='reserve-seed-audit.json'
        state['status']='complete'
        state.setdefault('stopReason','bounded experiment sequence finished')
        state['phase']='finished'; save()
    except Exception as error:
        state['status']='stopped'; state['stopReason']=str(error); save()
        raise


if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--root',type=Path,required=True)
    p.add_argument('--name',required=True)
    p.add_argument('--deadline',type=float,required=True)
    p.add_argument('--adaptive',action='store_true',help='Up to six trials, rolling back and lowering learning rate on regression')
    p.add_argument('--rehearsal',action='store_true',help='Balanced navigation/combat rehearsal between PPO rollouts; eight new audit seeds')
    p.add_argument('--max-rounds',type=int,choices=range(1,7),default=6)
    p.add_argument('--recovery-data',type=Path)
    p.add_argument('--workers',type=int,choices=[4,8],default=4)
    p.add_argument('--source-model',type=Path)
    p.add_argument('--source-evaluation',type=Path)
    p.add_argument('--learning-rate',type=float,default=1e-5)
    p.add_argument('--audit-start',type=int,choices=range(4,25))
    p.add_argument('--rejection-feedback',action='store_true')
    p.add_argument('--collection-seeds',type=int,choices=range(1,65),default=16)
    p.add_argument('--collection-start',type=int,choices=range(64),default=0)
    p.add_argument('--collect-recovery',type=Path,help='Collect teacher recovery examples on training seeds without fitting a model')
    p.add_argument('--evaluation-only',type=Path,help='Evaluate this model against the supplied reference; never train or promote')
    args=p.parse_args()
    if args.collection_start+args.collection_seeds>64: p.error('Collection range exceeds training seed pool')
    if args.evaluation_only and args.collect_recovery: p.error('Choose evaluation or collection, not both')
    if args.evaluation_only and not args.source_evaluation: p.error('Evaluation only requires an explicit source model/evaluation')
    if args.recovery_data and not args.rehearsal: p.error('Recovery data requires rehearsal')
    if args.rejection_feedback and not args.rehearsal: p.error('Rejection feedback requires rehearsal')
    if bool(args.source_model)!=bool(args.source_evaluation): p.error('Source model and evaluation must be supplied together')
    if not 1.25e-6<=args.learning_rate<=.001: p.error('Learning rate outside bounded range')
    run(args)
