"""Navigation demonstrations from restricted perception, with combat rehearsal."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import gymnasium as gym
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

from combat_pilot import ROOT,SIZE,ROTATED_ENCODER
from dungeon_pilot import DungeonEnv,ENCODER,REWARD,HELPER,OBS_SIZE,seed_plan,initialize_from_combat
from imitate import load_demonstrations


def navigation_example(before,after,transition):
    """Keep successful, threat-free directional navigation, including crossings."""
    return (transition['controller']=='teacher' and transition['action']['type']=='Move'
            and transition['recorded'] and before['decision']=='world'
            and not any(e.get('isEnemy') or e.get('appearance')=='unidentified' for e in before['room']['entities'])
            and not any(w.get('hostile') for w in before['room']['hitWarnings'])
            and after['player']['health']>=before['player']['health']
            and (before['room']['id'],before['player']['x'],before['player']['y']) !=
                (after['room']['id'],after['player']['x'],after['player']['y']))


def doorway_cycle(trace):
    """Six successful moves alternating two rooms; a collection trigger, not a mask."""
    tail=trace[-6:]
    if len(tail)!=6 or any(t['controller']!='learner' or t['action']['type']!='Move'
                          or not t['recorded'] or t['turnDelta']!=0 for t in tail): return False
    positions=[(t['room'],t['x'],t['y']) for t in tail]
    return (positions[0][0]!=positions[1][0] and
            all(p==positions[i%2] for i,p in enumerate(positions)))


def training_seed_slice(start,count):
    if start<0 or count<1 or start+count>64:
        raise ValueError('Collection seed range must stay within 64 training seeds')
    return seed_plan('training',64)[start:start+count]


def collect(args):
    env=DungeonEnv(args.out,budget=args.budget)
    env.controller='teacher'
    env.phase='dungeon-navigation-demonstration'
    xs,ys,outcomes=[],[],[]
    collection_seeds=training_seed_slice(getattr(args,'seed_start',0),args.seeds)
    recovery_model=getattr(args,'recovery_model',None)
    recoveries=[]
    try:
        torch.set_num_threads(4)
        learner=PPO.load(recovery_model,device='cpu') if recovery_model else None
        source=json.loads((recovery_model.parent/'manifest.json').read_text()) if recovery_model else None
        for episode_seed in collection_seeds:
            obs,_=env.reset(options={'episodeSeed':episode_seed})
            if source:
                for key,expected in [('encoder',ENCODER),('reward',REWARD),('helper',HELPER),('gameContract',env.contract)]:
                    if source[key]!=expected: raise ValueError('Recovery checkpoint mismatch: '+key)
            recovery_left=0; recovery=None
            if not env.page.evaluate('() => typeof AgentBaseline !== "undefined"'):
                env.page.add_script_tag(path=str(ROOT/'agent-baseline.js'))
            env.page.evaluate('() => {window.navigationTeacher=new AgentBaseline.Policy()}')
            def feedback(before,action,after,result):
                env.page.evaluate('''([before,action,after,info]) => navigationTeacher.feedback(before,action,after,info)''',
                                  [before,action,after,{'recorded':result['recorded'],'turnDelta':result['turnDelta']}])
            env.transition_callback=feedback
            start=len(xs)
            while True:
                before=env.view
                # Always observe/choose once, even when the learner controls this step.
                # Feedback below follows the executed action, never the proposed one.
                action=env.page.evaluate('(view) => navigationTeacher.choose(view)',before)
                if learner is not None and not recovery_left and doorway_cycle(env.trace):
                    recovery_left=16
                    recovery={'episodeSeed':episode_seed,'triggerAction':env.game_actions,
                              'loopPositions':[[t['room'],t['x'],t['y']] for t in env.trace[-2:]],
                              'escaped':False,'samples':0,'teacherSteps':0}
                    recoveries.append(recovery)
                teaching=learner is None or recovery_left>0
                env.controller='teacher' if teaching else 'learner'
                if not teaching:
                    local,_=learner.predict(obs,deterministic=True)
                    action={'type':'Move','direction':['up','right','down','left'][(int(local)+env.rotation)%4]}
                if action is None:
                    outcomes.append({'seed':env.game_seed,'episodeSeed':episode_seed,'status':'teacher-unsupported',
                                     'samples':len(xs)-start,'roomsVisited':len(env.memory.rooms)})
                    break
                if action['type']!='Move':
                    raise RuntimeError('Helper should handle non-directional decisions between learner steps')
                local=(['up','right','down','left'].index(action['direction'])-env.rotation)%4
                transitions=[]
                def observed_feedback(b,a,n,r):
                    transitions.append((b,n,{'controller':env.controller if a['type']=='Move' else 'helper',
                                              'action':a,'recorded':r['recorded']}))
                    feedback(b,a,n,r)
                env.transition_callback=observed_feedback
                next_obs,_,done,truncated,info=env.step(local)
                if transitions and navigation_example(*transitions[0]):
                    xs.append(obs.copy()); ys.append(local)
                    if recovery_left: recovery['samples']+=1
                if recovery_left:
                    recovery_left-=1; recovery['teacherSteps']+=1
                    position=[env.view['room']['id'],env.view['player']['x'],env.view['player']['y']]
                    recovery['escaped'] |= position not in recovery['loopPositions']
                obs=next_obs
                if done or truncated:
                    outcomes.append({**info,'samples':len(xs)-start})
                    break
            print(json.dumps(outcomes[-1]),flush=True)
            (args.out/'recoveries.json').write_text(json.dumps(recoveries,indent=2))
            (args.out/'outcomes.json').write_text(json.dumps(outcomes,indent=2))
        (args.out/'recoveries.json').write_text(json.dumps(recoveries,indent=2))
        (args.out/'outcomes.json').write_text(json.dumps(outcomes,indent=2))
        if not xs: raise RuntimeError('No navigation examples collected; diagnostic outcomes preserved')
        np.savez_compressed(args.out/'demonstrations.npz',observations=np.asarray(xs,dtype=np.float32),actions=np.asarray(ys,dtype=np.int64))
        manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,'gameContract':env.contract,
                  'trainingSeeds':collection_seeds,'samples':len(xs),
                  'teacherSha256':hashlib.sha256((ROOT/'agent-baseline.js').read_bytes()).hexdigest(),
                  'selection':'Recorded, changed-position directional actions without perceived threats or damage. Not whole successful runs.'}
        if recovery_model:
            manifest['recovery']={'version':1,'source':str(recovery_model),
                'sourceSha256':hashlib.sha256(recovery_model.read_bytes()).hexdigest(),
                'trigger':'six recorded zero-turn learner moves alternating two rooms',
                'teacherStepsPerIntervention':16,'teacherHistory':'choose each learner decision; feedback on all executed actions',
                'limitation':'Assisted collection, not unassisted evaluation; escaped means left the two loop positions'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'outcomes.json').write_text(json.dumps(outcomes,indent=2))
        (args.out/'complete.json').write_text(json.dumps({'episodes':len(outcomes),'samples':len(xs)}))
    finally: env.close()


def load_navigation(path):
    manifest=json.loads((path/'manifest.json').read_text())
    if manifest['encoder']!=ENCODER or manifest['helper']!=HELPER or manifest['reward']!=REWARD:
        raise ValueError('Navigation contract mismatch')
    seeds=manifest['trainingSeeds']
    if manifest.get('humanDemonstrations'):
        from teaching_data import validate_seed
        provenance=manifest['humanDemonstrations']
        if not seeds or provenance.get('version')!=1 or provenance.get('perceptionView')!='restricted-grid' or provenance.get('protocol')!='starter':
            raise ValueError('Invalid human training provenance')
        for seed in seeds: validate_seed(seed)
    elif not seeds or not set(seeds)<=set(seed_plan('training',64)): raise ValueError('Dataset includes non-training seeds')
    if not (path/'complete.json').exists(): raise ValueError('Incomplete navigation collection')
    with np.load(path/'demonstrations.npz',allow_pickle=False) as data:
        x,y=data['observations'],data['actions']
    if x.ndim!=2 or x.shape[1]!=OBS_SIZE or not len(x) or y.shape!=(len(x),): raise ValueError('Invalid navigation shapes')
    if not np.isfinite(x).all() or np.any((x<0)|(x>1)): raise ValueError('Invalid navigation features')
    if y.dtype.kind not in 'iu' or np.any((y<0)|(y>=4)): raise ValueError('Invalid navigation action')
    return x.astype(np.float32),y,manifest


class Spaces(gym.Env):
    def __init__(self):
        self.action_space=gym.spaces.Discrete(4)
        self.observation_space=gym.spaces.Box(0,1,shape=(OBS_SIZE,),dtype=np.float32)


def fit(args):
    x,y,source=load_navigation(args.data)
    combat_x,combat_y,combat=load_demonstrations(args.combat_data)
    checkpoint=json.loads((args.from_combat.parent/'manifest.json').read_text())
    if source['gameContract']!=combat['gameContract'] or source['gameContract']!=checkpoint['gameContract']:
        raise ValueError('Game contracts differ')
    if checkpoint['encoder']!=ROTATED_ENCODER: raise ValueError('Legal rotated combat checkpoint required')
    combat_x=np.pad(combat_x,((0,0),(0,OBS_SIZE-SIZE*2)))
    torch.set_num_threads(4)
    env=DummyVecEnv([Spaces]*args.envs)
    try:
        model=initialize_from_combat(args.from_combat,checkpoint,env,args.envs)
        model.save(args.out/'initial')
        groups=[(torch.as_tensor(a),torch.as_tensor(b,dtype=torch.long)) for a,b in [(x,y),(combat_x,combat_y)]]
        rng=np.random.default_rng(123)
        losses=[]
        # Balanced sampling keeps numerous navigation rows from swamping combat.
        for _ in range(args.updates):
            inputs=[]; labels=[]
            for a,b in groups:
                indices=rng.integers(len(a),size=32)
                inputs.append(a[indices]); labels.append(b[indices])
            _,logp,_=model.policy.evaluate_actions(torch.cat(inputs),torch.cat(labels))
            loss=-logp.mean()
            model.policy.optimizer.zero_grad(); loss.backward()
            torch.nn.utils.clip_grad_norm_(model.policy.parameters(),.5)
            model.policy.optimizer.step()
            losses.append(float(loss.detach()))
        model.save(args.out/'final')
        manifest={**source,'task':'procedural-dungeon','trainingMode':'navigation-imitation-with-combat-rehearsal',
                  'git':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                  'execution':{'environments':args.envs,'rolloutStepsPerEnvironment':256//args.envs},
                  'sourceCheckpoint':{'path':str(args.from_combat),'sha256':hashlib.sha256(args.from_combat.read_bytes()).hexdigest()},
                  'datasets':{str(p):hashlib.sha256((p/'demonstrations.npz').read_bytes()).hexdigest() for p in [args.data,args.combat_data]},
                  'updates':args.updates,'navigationSamples':len(x),'combatSamples':len(combat_x),
                  'batchComposition':'32 navigation + 32 combat samples, sampled with replacement',
                  'limitation':'Imitation only; no PPO experience. Evaluate initial/final on held-out seeds before reinforcement learning.'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'losses.json').write_text(json.dumps(losses))
        result={'trainingSteps':model.num_timesteps,'updates':args.updates,'initialLoss':losses[0],'finalLoss':losses[-1]}
        (args.out/'complete.json').write_text(json.dumps(result))
        print(json.dumps(result),flush=True)
    finally: env.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('mode',choices=['collect','fit'])
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--seeds',type=int,default=16)
    parser.add_argument('--seed-start',type=int,default=0)
    parser.add_argument('--budget',type=int,default=256)
    parser.add_argument('--data',type=Path)
    parser.add_argument('--combat-data',type=Path)
    parser.add_argument('--from-combat',type=Path)
    parser.add_argument('--recovery-model',type=Path,help='Collect teacher recoveries after deterministic learner doorway cycles')
    parser.add_argument('--envs',type=int,choices=[1,2,4],default=2)
    parser.add_argument('--updates',type=int,default=2000)
    args=parser.parse_args()
    if not 1<=args.seeds<=64 or not 1<=args.budget<=10000 or not 1<=args.updates<=10000: parser.error('Invalid experiment bounds')
    if args.mode=='collect' and (args.seed_start<0 or args.seed_start+args.seeds>64): parser.error('Collection seed range exceeds training pool')
    if args.recovery_model and args.mode!='collect': parser.error('Recovery model is collection only')
    if args.mode=='fit' and not all([args.data,args.combat_data,args.from_combat]): parser.error('Fit requires both datasets and a combat checkpoint')
    args.out.mkdir(parents=True,exist_ok=False)
    (collect if args.mode=='collect' else fit)(args)
