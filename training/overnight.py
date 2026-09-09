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


def memory_ok():
    data={line.split(':')[0]:int(line.split()[1]) for line in Path('/proc/meminfo').read_text().splitlines()}
    return data['MemAvailable']>=512*1024 and data['SwapTotal']-data['SwapFree']<2*1024*1024


def run(args):
    root=args.root; job=root/args.name; job.mkdir(exist_ok=False)
    repo=Path(__file__).resolve().parents[1]
    revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
    state={'status':'running','deadline':args.deadline,'git':revision,'phase':'starting',
           'rounds':[],'selectedModel':str(root/'navigation-model-001/final.zip')}
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
        reference=root/'navigation-model-001-after'
        baseline=report(reference)
        best_model=Path(state['selectedModel']); best_eval=reference
        next_model=best_model
        no_gain=0
        for index,steps in enumerate([16384,32768,32768],1):
            if args.deadline-time.time()<3600:
                state['stopReason']='insufficient time for another training/evaluation round'; break
            model=root/f'{args.name}-r{index}'
            evaluation=root/f'{args.name}-r{index}-eval'
            execute(f'r{index}-train',['training/dungeon_pilot.py','--resume',next_model,'--out',model,
                                      '--envs','4','--steps',steps,'--budget','512','--eval-seeds','4'])
            execute(f'r{index}-eval',['training/dungeon_pilot.py','--evaluate',model/'final.zip','--out',evaluation,
                                     '--envs','1','--budget','512','--eval-seeds','4'])
            comparison=report(evaluation,best_eval)
            atomic_json(job/f'r{index}-report.json',comparison)
            decision=gate(baseline,comparison)
            state['rounds'].append({'round':index,'steps':steps,**decision,'results':comparison['policies']})
            if decision['regression']:
                state['stopReason']='regression gate; reference preserved'; save(); break
            next_model=model/'final.zip'
            if decision['advance']:
                best_model=model/'final.zip'; best_eval=evaluation; baseline=comparison; no_gain=0
                state['selectedModel']=str(best_model)
            else: no_gain+=1
            save()
            if no_gain>=2:
                state['stopReason']='two rounds without qualifying gain'; break
        # These extra four seeds were not used for the continuation gates.
        if best_eval!=reference and args.deadline-time.time()>=3600:
            audits=[]
            for label,model in [('reference',root/'navigation-model-001/final.zip'),('candidate',best_model)]:
                out=root/f'{args.name}-audit-{label}'
                execute('audit-'+label,['training/dungeon_pilot.py','--evaluate',model,'--out',out,
                                        '--envs','1','--budget','512','--eval-seeds','8'])
                audits.append(out)
            result={}
            for mode in ['deterministic','sampled','random']:
                result[mode]={label:summary(json.loads((path/f'{mode}-evaluation.json').read_text())[4:])
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
    run(p.parse_args())
