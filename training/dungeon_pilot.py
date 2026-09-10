"""Procedural dungeon pilot: learned directions, explicit limited interaction helper."""
import argparse
from collections import Counter
import functools
import hashlib
import json
from pathlib import Path
import subprocess
import time

import gymnasium as gym
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv, SubprocVecEnv

from combat_pilot import ACTIONS, CombatEnv, Checkpoints, ROOT, ROTATED_ENCODER, SIZE, encode, rotate_features, world_action

ENCODER = {**ROTATED_ENCODER, 'version': 6, 'task': 'procedural-dungeon',
           'memory': '169 player-relative arrival-count cells, clipped at 8, rotated with view',
           'navigation': ['visible-door','visible-down-stairs','visible-up-stairs','known-locked-passage','unlock-from-here','previously-crossed-passage']}
REWARD = {'version': 1, 'task': 'procedural-dungeon', 'newTile': .02,
          'newRoom': .5, 'newMaximumDepth': 5, 'healthLost': -3,
          'death': -10, 'attemptedGameAction': -.01}
HELPER = {'version': 1, 'actions': ['confirm-ladder', 'dismiss-interaction', 'cancel-selection', 'zero-turn-healing'],
          'limitation': 'No learned inventory, crafting, spell use, or equipment selection'}
OBS_SIZE = SIZE*2 + 169*7


def seed_plan(namespace, count):
    return [int.from_bytes(hashlib.sha256(f'turnarchist-dungeon-v1:{namespace}:{i}'.encode()).digest()[:4], 'big')
            for i in range(count)]


def actual_seed(seed):
    rng=np.random.default_rng(seed)
    rng.integers(4)  # Same rotation draw as CombatEnv.reset.
    return int(rng.integers(0,2**31))


def helper_action(view):
    decision=view['decision']
    if decision == 'dismissable-interaction': return {'type':'DismissInteraction'}
    if decision == 'ladder': return {'type':'LadderConfirm'}
    if decision == 'selection':
        cancel=next((o for o in view.get('selectionChoices',[]) if o.get('enabled') and o.get('label')=='Cancel'),None)
        return {'type':'SelectOption','index':cancel['index']} if cancel else None
    if decision != 'world': return None
    if view['player']['health'] < view['player']['maxHealth']:
        food=next((i for i in view['inventory'] if i and (i.get('healingAmount') or 0)>0
                   and not i.get('canUseOnOther') and i.get('useTurnCost')==0),None)
        if food: return {'type':'UseItem','slotIndex':food['slot']}
    return None


def navigation_features(view,rotation,used=()):
    grid=np.zeros((13,13,6),dtype=np.float32)
    px,py=view['player']['x'],view['player']['y']
    for tile in view['room']['tiles']:
        x,y=int(tile['x']-px+6),int(tile['y']-py+6)
        if not (0<=x<13 and 0<=y<13): continue
        traversal=tile.get('traversal') or {}
        door=tile.get('isDoor') is True
        stairs=tile.get('exit') is True
        grid[y,x]=[door,stairs and traversal.get('direction')=='down',
                   stairs and traversal.get('direction')=='up',
                   (door or stairs) and traversal.get('unlocked') is False,
                   (door or stairs) and traversal.get('unlockFromHere') is True,
                   (view['room']['id'],tile['x'],tile['y']) in used]
    return np.rot90(grid,rotation,axes=(0,1)).ravel().copy()


class ExplorationMemory:
    def __init__(self, view, depth):
        self.visits=Counter({self.position(view):1})
        self.rooms={view['room']['id']}
        self.max_depth=depth
        self.initial_depth=depth
        self.used_passages=set()

    @staticmethod
    def position(view):
        return (view['room']['id'],view['player']['x'],view['player']['y'])

    def observe(self, before, after, depth, dead, action=None):
        if action and before['room']['id']!=after['room']['id']:
            x,y=before['player']['x'],before['player']['y']
            if action['type']=='Move':
                dx,dy={'up':(0,-1),'right':(1,0),'down':(0,1),'left':(-1,0)}[action['direction']]
                x+=dx; y+=dy
            if action['type'] in ('Move','LadderConfirm') and any(
                    t['x']==x and t['y']==y and (t.get('isDoor') is True or t.get('exit') is True)
                    for t in before['room']['tiles']):
                self.used_passages.add((before['room']['id'],x,y))
        position=self.position(after)
        new_tile=position not in self.visits
        new_room=after['room']['id'] not in self.rooms
        depth_gain=max(0,depth-self.max_depth)
        if position != self.position(before): self.visits[position]+=1
        self.rooms.add(after['room']['id'])
        self.max_depth=max(self.max_depth,depth)
        loss=max(0,before['player']['health']-after['player']['health'])
        return (REWARD['attemptedGameAction'] + REWARD['newTile']*new_tile
                + REWARD['newRoom']*new_room + REWARD['newMaximumDepth']*depth_gain
                + REWARD['healthLost']*loss + REWARD['death']*dead)

    def features(self, view, rotation):
        grid=np.zeros((13,13),dtype=np.float32)
        room,px,py=self.position(view)
        for (scope,x,y),count in self.visits.items():
            if scope==room and abs(x-px)<=6 and abs(y-py)<=6:
                grid[y-py+6,x-px+6]=min(count/8,1)
        return np.rot90(grid,rotation).ravel().copy()


class DungeonEnv(CombatEnv):
    def __init__(self,out,budget=512,seeds=None,offset=0):
        super().__init__(out,budget=budget,rotate_frames=True,scenarios=['standard'])
        self.observation_space=gym.spaces.Box(0,1,shape=(OBS_SIZE,),dtype=np.float32)
        self.seeds=seeds or seed_plan('training',64)
        self.offset=offset

    def observation(self):
        return np.concatenate((*self.frames,self.memory.features(self.view,self.rotation),navigation_features(self.view,self.rotation,self.memory.used_passages)))

    def reset(self,*,seed=None,options=None):
        # Training cycles a declared pool, independent of episode duration.
        chosen=(options or {}).get('episodeSeed',self.seeds[(self.episode+self.offset)%len(self.seeds)])
        super().reset(seed=int(chosen),options={'scenario':'standard'})
        self.episode_seed=int(chosen)
        # Depth is outcome/reward supervision only, never a policy feature.
        depth=self.page.evaluate('() => window.agent.observe().room.depth')
        self.memory=ExplorationMemory(self.view,depth)
        self.game_actions=0
        self.assisted_actions=0
        self.world_turns=0
        self.health_lost=0
        self.stop_reason=None
        self.started=time.perf_counter()
        if self.view['decision']!='world': raise RuntimeError('Dungeon reset did not yield a world decision')
        return self.observation(),{}

    def execute(self,action,controller):
        before=self.view
        result=self.page.evaluate('''async action => {
            const result=await window.agent.step(action);
            return {view:window.agent.perceive(),terminated:result.terminated,
                    truncated:result.truncated,depth:result.observation.room.depth,
                    recorded:result.info.recorded,turnDelta:result.info.turnDelta};
        }''',action)
        self.view=result['view']
        reward=self.memory.observe(before,self.view,result['depth'],result['terminated'],action)
        self.game_actions+=1
        self.assisted_actions+=int(controller=='helper')
        self.world_turns+=result['turnDelta']
        self.health_lost+=max(0,before['player']['health']-self.view['player']['health'])
        self.trace.append({'controller':controller,'action':action,'recorded':result['recorded'],
                           'turnDelta':result['turnDelta'],'room':self.view['room']['id'],
                           'x':self.view['player']['x'],'y':self.view['player']['y'],
                           'health':self.view['player']['health'],'reward':reward})
        self.trace=self.trace[-64:]
        callback=getattr(self,'transition_callback',None)
        if callback: callback(before,action,self.view,result)
        return reward,bool(result['terminated']),bool(result['truncated'])

    def step(self,action):
        if self.stop_reason: raise RuntimeError('Episode ended; reset required')
        if self.view['decision']!='world': raise RuntimeError('Learner only supports world decisions')
        reward,done,truncated=self.execute(ACTIONS[world_action(action,self.rotation)],getattr(self,'controller','learner'))
        self.steps+=1
        # No per-turn limit or forced tick: every helper action consumes the same
        # total episode decision budget as a directional action.
        while not (done or truncated):
            assist=helper_action(self.view)
            if assist is None:
                if self.view['decision']!='world':
                    self.stop_reason='unsupported-decision'
                    truncated=True
                break
            extra,done,truncated=self.execute(assist,'helper')
            reward+=extra
        self.frames.append(rotate_features(encode(self.view),self.rotation))
        self.total_reward+=reward
        info={}
        if done or truncated:
            self.stop_reason='dead' if done else self.stop_reason or 'budget-incomplete'
            info={'phase':self.phase,'seed':self.game_seed,'episodeSeed':self.episode_seed,
                  'rotation':self.rotation,'status':self.stop_reason,'steps':self.steps,
                  'gameActions':self.game_actions,'helperActions':self.assisted_actions,
                  'worldTurns':self.world_turns,'roomsVisited':len(self.memory.rooms),
                  'positionsVisited':len(self.memory.visits),'maxDepth':self.memory.max_depth,
                  'initialDepth':self.memory.initial_depth,'health':self.view['player']['health'],
                  'healthLost':self.health_lost,'reward':self.total_reward,
                  'seconds':time.perf_counter()-self.started}
            with (self.out/'episodes.jsonl').open('a') as f: f.write(json.dumps(info)+'\n')
            replay=self.page.evaluate('() => window.agent.exportReplay()')
            (self.out/'latest-replay.json').write_text(json.dumps(replay))
        return self.observation(),reward,done,truncated,info


def transfer_actor(target,source):
    """Copy combat actor, zero new memory inputs; value head/optimizer stay fresh."""
    weights=target.policy.state_dict()
    for name,value in source.policy.state_dict().items():
        if not name.startswith(('mlp_extractor.policy_net.','action_net.')): continue
        if name=='mlp_extractor.policy_net.0.weight':
            if value.shape[1]!=SIZE*2 or weights[name].shape[1]!=OBS_SIZE:
                raise ValueError('Unexpected combat-to-dungeon input dimensions')
            expanded=torch.zeros_like(weights[name])
            expanded[:,:SIZE*2]=value
            weights[name]=expanded
        elif weights[name].shape==value.shape: weights[name]=value.clone()
        else: raise ValueError('Incompatible actor architecture: '+name)
    target.policy.load_state_dict(weights)


def make_env(out,budget,seeds,offset):
    torch.set_num_threads(1)
    env=DungeonEnv(out,budget=budget,seeds=seeds,offset=offset)
    env.phase='dungeon-training'
    return Monitor(env)


def evaluate_dungeons(env,model,seeds,deterministic=True):
    rows=[]
    with torch.random.fork_rng(devices=[]):
        torch.manual_seed(987)
        rng=np.random.default_rng(987)
        env.phase='dungeon-random-evaluation' if model is None else 'dungeon-deterministic-evaluation' if deterministic else 'dungeon-sampled-evaluation'
        for seed in seeds:
            obs,_=env.reset(options={'episodeSeed':seed})
            while True:
                action=int(rng.integers(4)) if model is None else int(model.predict(obs,deterministic=deterministic)[0])
                obs,_,done,truncated,info=env.step(action)
                if done or truncated:
                    rows.append({**info,'trace':list(env.trace)})
                    print(json.dumps({'evaluationEpisode':len(rows),**info}),flush=True)
                    break
    return rows


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--from-combat',type=Path)
    mode.add_argument('--evaluate',type=Path)
    mode.add_argument('--resume',type=Path)
    mode.add_argument('--benchmark',action='store_true')
    parser.add_argument('--steps',type=int,default=2048)
    parser.add_argument('--budget',type=int,default=512)
    parser.add_argument('--envs',type=int,choices=[1,2,4,8],default=2)
    parser.add_argument('--eval-seeds',type=int,default=8)
    parser.add_argument('--learning-rate',type=float,help='Explicit training override; recorded in manifest')
    parser.add_argument('--rehearsal-navigation',type=Path)
    parser.add_argument('--rehearsal-combat',type=Path)
    args=parser.parse_args()
    if args.envs==8 and not args.benchmark:
        parser.error('Eight workers currently supported only for throughput benchmarking')
    if bool(args.rehearsal_navigation)!=bool(args.rehearsal_combat) or (args.rehearsal_navigation and not (args.resume or args.from_combat)):
        parser.error('Both rehearsal datasets are required and only supported for training')
    if args.learning_rate is not None and (not 0<args.learning_rate<=.001 or not (args.resume or args.from_combat)):
        parser.error('Learning rate must be in (0, .001] and used only for training')
    if not 1<=args.steps<=1000000 or not 1<=args.budget<=10000 or not 1<=args.eval_seeds<=32:
        parser.error('Use 1..1000000 steps, 1..10000 budget, 1..32 evaluation seeds')
    args.out.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(4)
    train_seeds=seed_plan('training',64)
    test_seeds=seed_plan('held-out',args.eval_seeds)
    assert not set(map(actual_seed,train_seeds)) & set(map(actual_seed,test_seeds))
    factories=[functools.partial(make_env,args.out/f'worker-{i}',args.budget,train_seeds,i*17) for i in range(args.envs)]
    env=None
    start=time.perf_counter()
    try:
        env=DummyVecEnv(factories) if args.envs==1 else SubprocVecEnv(factories,start_method='spawn')
        env.reset()
        contracts=env.get_attr('contract')
        if any(c!=contracts[0] for c in contracts): raise RuntimeError('Worker contracts differ')
        manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,'gameContract':contracts[0],
                  'git':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                  'task':'procedural-dungeon','budget':args.budget,'trainingSeeds':train_seeds,
                  'heldOutSeeds':test_seeds,'execution':{'environments':args.envs,'rolloutStepsPerEnvironment':256//args.envs},
                  'limitation':'Directional learner with explicit helper. A budget survivor is not a dungeon win. Rewards and actor transfer differ from combat training.'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        ready=time.perf_counter()
        if args.benchmark:
            env.set_attr('phase','dungeon-throughput-benchmark')
            rng=np.random.default_rng(321)
            for _ in range((args.steps+args.envs-1)//args.envs):
                obs,reward,_,_=env.step(rng.integers(4,size=args.envs))
                if not np.isfinite(obs).all() or not np.isfinite(reward).all(): raise RuntimeError('Nonfinite transition')
            decisions=((args.steps+args.envs-1)//args.envs)*args.envs
            report={'mode':'benchmark','decisions':decisions,'envs':args.envs,
                    'startupSeconds':ready-start,'collectionSeconds':time.perf_counter()-ready}
            report['decisionsPerSecond']=decisions/report['collectionSeconds']
        else:
            source_path=args.from_combat or args.resume or args.evaluate
            source_manifest=json.loads((source_path.parent/'manifest.json').read_text())
            if source_manifest['gameContract']!=manifest['gameContract']: raise ValueError('Source game contract differs')
            manifest['sourceCheckpoint']={'path':str(source_path),'sha256':hashlib.sha256(source_path.read_bytes()).hexdigest()}
            if args.from_combat or args.resume:
                if args.resume:
                    for key in ('encoder','reward','helper'):
                        if source_manifest[key]!=manifest[key]: raise ValueError('Incompatible dungeon '+key)
                    if source_manifest['execution']['environments']!=args.envs:
                        raise ValueError('Resume requires original worker count')
                    model=PPO.load(source_path,env=env,device='cpu')
                    manifest['initialization']='resume dungeon weights and optimizer; fresh episodes and rollout'
                else:
                    model=initialize_from_combat(source_path,source_manifest,env,args.envs)
                    manifest['initialization']='combat actor copied; memory columns zero; fresh value head and optimizer'
                if args.learning_rate is not None:
                    override_learning_rate(model,args.learning_rate)
                manifest['optimizationOverrides']={'learningRate':args.learning_rate}
                manifest['optimization']={'learningRateAtStart':float(model.lr_schedule(1.0)),
                                          'gamma':model.gamma,'entropyCoefficient':float(model.ent_coef),
                                          'targetKL':model.target_kl,'epochs':model.n_epochs}
                callbacks=[Checkpoints(args.out)]
                if args.rehearsal_navigation:
                    from rehearsal import configure
                    practice,manifest['rehearsal']=configure(args.rehearsal_navigation,args.rehearsal_combat,manifest['gameContract'])
                    callbacks.append(practice)
                model.save(args.out/'initial')
                (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
                model.learn(total_timesteps=args.steps,reset_num_timesteps=not bool(args.resume),callback=callbacks)
                model.save(args.out/'final')
                report={'mode':'dungeon-training','steps':model.num_timesteps,
                        'trainingSeconds':time.perf_counter()-ready}
            else:
                for key in ('encoder','reward','helper'):
                    if source_manifest[key]!=manifest[key]: raise ValueError('Incompatible dungeon '+key)
                model=PPO.load(source_path,device='cpu')
                (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
                env.close(); env=None
                evaluation=DungeonEnv(args.out/'evaluation',budget=args.budget)
                try:
                    before=model.num_timesteps
                    for name,policy,deterministic in [('random',None,True),('deterministic',model,True),('sampled',model,False)]:
                        rows=evaluate_dungeons(evaluation,policy,test_seeds,deterministic)
                        (args.out/f'{name}-evaluation.json').write_text(json.dumps(rows,indent=2))
                    assert model.num_timesteps==before
                    report={'mode':'dungeon-evaluation','trainingSteps':before,'episodes':3*len(test_seeds)}
                finally: evaluation.close()
        report['totalSeconds']=time.perf_counter()-start
        (args.out/'complete.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report),flush=True)
    finally:
        if env is not None: env.close()


def override_learning_rate(model,rate):
    if not 0<rate<=.001: raise ValueError('Invalid training learning rate')
    model.learning_rate=rate
    model._setup_lr_schedule()
    for group in model.policy.optimizer.param_groups: group['lr']=rate


def initialize_from_combat(source_path,source_manifest,env,workers):
    if source_manifest['encoder']!=ROTATED_ENCODER:
        raise ValueError('Four-action rotated combat model required')
    model=PPO('MlpPolicy',env,n_steps=256//workers,batch_size=64,n_epochs=4,
              learning_rate=3e-5,ent_coef=.01,target_kl=.01,seed=123,device='cpu',
              policy_kwargs={'net_arch':[128,128]},verbose=1)
    source=PPO.load(source_path,device='cpu')
    transfer_actor(model,source)
    return model


if __name__=='__main__': main()
