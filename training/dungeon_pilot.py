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
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor
from stable_baselines3.common.vec_env import DummyVecEnv, SubprocVecEnv

from combat_pilot import (ACTIONS,CombatEnv,Checkpoints,ROOT,ROTATED_ENCODER,SIZE,GRID,CENTER,
                          CHANNELS,visible_rooms,encode,rotate_features,world_action)

ENCODER = {**ROTATED_ENCODER, 'version': 11, 'task': 'procedural-dungeon',
           'memory': '625 player-relative arrival-count cells, clipped at 8, rotated with view',
           'navigation': ['visible-door','visible-down-stairs','visible-up-stairs','known-locked-passage','unlock-from-here','previously-crossed-passage','visible-spike-trap','spikes-active','spikes-warning','known-door-link','arrival-dx','arrival-dy'],
           'planner': 'six rotated A* frontier-hint features; only a safe current-room route to an untraversed, unlocked passage'}
REWARD = {'version': 1, 'task': 'procedural-dungeon', 'newTile': .02,
          'newRoom': .5, 'newMaximumDepth': 5, 'healthLost': -3,
          'death': -10, 'attemptedGameAction': -.01}
HELPER = {'version': 2, 'actions': ['confirm-ladder', 'dismiss-interaction', 'dismiss-vending', 'cancel-selection', 'zero-turn-healing'],
          'limitation': 'Vending purchases and other inventory, crafting, spell, or equipment choices require human data and a wider learned action schema'}
PLANNER_SIZE = 6
OBS_SIZE = SIZE*2 + GRID*GRID*13 + PLANNER_SIZE


def spatial_observation_parts(observations):
    batch=len(observations); grids=[]; scalars=[]; offset=0
    grid_values=GRID*GRID*CHANNELS
    for _ in range(2):
        frame=observations[:,offset:offset+SIZE]; offset+=SIZE
        grids.append(frame[:,:grid_values].reshape(batch,GRID,GRID,CHANNELS).permute(0,3,1,2))
        scalars.append(frame[:,grid_values:])
    memory=observations[:,offset:offset+GRID*GRID].reshape(batch,1,GRID,GRID); offset+=GRID*GRID
    navigation=observations[:,offset:offset+GRID*GRID*12].reshape(batch,GRID,GRID,12).permute(0,3,1,2)
    offset+=GRID*GRID*12
    planner=observations[:,offset:offset+PLANNER_SIZE]
    return torch.cat([*grids,memory,navigation],dim=1),torch.cat([*scalars,planner],dim=1)


class SpatialDungeonExtractor(BaseFeaturesExtractor):
    """Preserve the grid structure instead of connecting 159k cells densely."""
    def __init__(self,observation_space,features_dim=128):
        super().__init__(observation_space,features_dim)
        spatial_channels=CHANNELS*2+13
        self.convolution=torch.nn.Sequential(
            torch.nn.Conv2d(spatial_channels,32,3,stride=2,padding=1),torch.nn.ReLU(),
            torch.nn.Conv2d(32,64,3,stride=2,padding=1),torch.nn.ReLU(),
            torch.nn.Conv2d(64,64,3,stride=2,padding=1),torch.nn.ReLU(),torch.nn.Flatten())
        self.projection=torch.nn.Sequential(torch.nn.Linear(64*4*4+10+PLANNER_SIZE,features_dim),torch.nn.ReLU())

    def forward(self,observations):
        spatial,scalars=spatial_observation_parts(observations)
        return self.projection(torch.cat([self.convolution(spatial),scalars],dim=1))


class SpatialDungeonExtractorV2(BaseFeaturesExtractor):
    """Combine global context with an exact high-resolution 9x9 player crop."""
    def __init__(self,observation_space,features_dim=128):
        super().__init__(observation_space,features_dim)
        spatial_channels=CHANNELS*2+13
        self.global_convolution=torch.nn.Sequential(
            torch.nn.Conv2d(spatial_channels,32,3,stride=2,padding=1),torch.nn.ReLU(),
            torch.nn.Conv2d(32,64,3,stride=2,padding=1),torch.nn.ReLU(),
            torch.nn.Conv2d(64,64,3,stride=2,padding=1),torch.nn.ReLU(),torch.nn.Flatten())
        self.local_channels=torch.nn.Sequential(torch.nn.Conv2d(spatial_channels,24,1),torch.nn.ReLU())
        self.projection=torch.nn.Sequential(
            torch.nn.Linear(64*4*4+24*9*9+10+PLANNER_SIZE,features_dim),torch.nn.ReLU())

    def forward(self,observations):
        spatial,scalars=spatial_observation_parts(observations)
        local=self.local_channels(spatial)[:,:,CENTER-4:CENTER+5,CENTER-4:CENTER+5].flatten(1)
        return self.projection(torch.cat([self.global_convolution(spatial),local,scalars],dim=1))


def rejected_without_visible_effect(before,after,transition,terminal):
    return (not terminal and not transition['recorded'] and transition['turnDelta']==0
            and np.array_equal(before,after))


def policy_action(model,observation,deterministic,rejected=()):
    """Choose from the policy while excluding moves rejected in this exact state."""
    rejected={int(action) for action in rejected}
    if not rejected:
        return int(model.predict(observation,deterministic=deterministic)[0])
    available=[action for action in range(len(ACTIONS)) if action not in rejected]
    if not available:
        return None
    with torch.no_grad():
        tensor,_=model.policy.obs_to_tensor(observation)
        probabilities=model.policy.get_distribution(tensor).distribution.probs[0].detach().cpu()
    allowed=probabilities[available]
    if deterministic:
        return available[int(torch.argmax(allowed))]
    total=float(allowed.sum())
    if not np.isfinite(total) or total<=0:
        allowed=torch.ones(len(available),dtype=torch.float32)
    return available[int(torch.multinomial(allowed,1))]


def policy_confidence(model,observation):
    """Maximum action probability for confidence-gated intervention."""
    with torch.no_grad():
        tensor,_=model.policy.obs_to_tensor(observation)
        probabilities=model.policy.get_distribution(tensor).distribution.probs[0]
    return float(probabilities.max().detach().cpu())


def planner_action(env):
    """Return the safe A* hint in the policy's rotated action frame."""
    plan=getattr(env,'plan',{})
    if not plan.get('active'): return None
    directions=[action['direction'] for action in ACTIONS]
    return (directions.index(plan['direction'])-env.rotation)%len(ACTIONS)


def tactical_view(view):
    """Whether learned control is required instead of navigation scaffolding."""
    return (any(entity.get('isEnemy') or entity.get('appearance') == 'unidentified'
                for entity in view['room']['entities'])
            or any(warning.get('hostile') and warning.get('dangerous', True)
                   for warning in view['room']['hitWarnings'])
            or any((tile.get('hazard') or {}).get('active') or (tile.get('hazard') or {}).get('warning')
                   for tile in view['room']['tiles']))


def world_direction(action,rotation):
    """Translate a rotated policy action into the direction the game receives."""
    return ACTIONS[world_action(int(action),rotation)]['direction']


def shield_assessment(operator,direction,baseline):
    """Fail closed unless a learned move is immediately safe and teacher-approved.

    The operator preview is authoritative only for the current enemy response.  It
    cannot prove that a different safe-looking position remains strategically
    sound on later turns, so initial deployment also requires baseline consensus.
    """
    move=next((row for row in operator.get('tactical',{}).get('moves',[])
               if row.get('direction')==direction),None)
    if move is None: return False,'missing-preview'
    consequence=move.get('consequence') or {}
    if consequence.get('unknownDamageSources',0): return False,'unknown-damage'
    if (consequence.get('knownIncomingDamageBeforeDefense') or 0)>0: return False,'known-damage'
    if not baseline or baseline.get('type')!='Move': return False,'missing-baseline'
    if baseline.get('direction')!=direction: return False,'baseline-disagreement'
    return True,'safe-baseline-consensus'


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
    if decision == 'vending': return {'type':'DismissInteraction'}
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
    grid=np.zeros((GRID,GRID,12),dtype=np.float32)
    px,py=view['player']['x'],view['player']['y']
    for room,tile in [(room,tile) for room in visible_rooms(view) for tile in room['tiles']]:
        x,y=int(tile['x']-px+CENTER),int(tile['y']-py+CENTER)
        if not (0<=x<GRID and 0<=y<GRID): continue
        traversal=tile.get('traversal') or {}
        door=tile.get('isDoor') is True
        stairs=tile.get('exit') is True
        hazard=tile.get('hazard') or {}
        spikes=tile.get('kind')=='SpikeTrap'
        link=next((c for c in room.get('connections',[]) if c['from']['x']==tile['x'] and c['from']['y']==tile['y']),None)
        grid[y,x]=[door,stairs and traversal.get('direction')=='down',
                   stairs and traversal.get('direction')=='up',
                   (door or stairs) and traversal.get('unlocked') is False,
                   (door or stairs) and traversal.get('unlockFromHere') is True,
                   (room['id'],tile['x'],tile['y']) in used,
                   spikes,spikes and hazard.get('active') is True,spikes and hazard.get('warning') is True,
                   bool(link),np.clip((link['to']['x']-tile['x'])/GRID/2+.5,0,1) if link else 0,
                   np.clip((link['to']['y']-tile['y'])/GRID/2+.5,0,1) if link else 0]
    grid=np.rot90(grid,rotation,axes=(0,1)).copy();mask=grid[:,:,9]>0
    for _ in range(rotation%4):
        old_x=grid[:,:,10].copy();grid[:,:,10][mask]=grid[:,:,11][mask];grid[:,:,11][mask]=1-old_x[mask]
    return grid.ravel()


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
                # `connections` is present only after a real crossing.  Mark the
                # paired arrival too: otherwise a new room treats its return door
                # as unexplored and a shortest-path policy bounces straight back.
                link=next((c for c in before['room'].get('connections',[])
                           if c.get('from',{}).get('x')==x and c.get('from',{}).get('y')==y),None)
                if link and link.get('to',{}).get('roomId')==after['room']['id']:
                    self.used_passages.add((after['room']['id'],link['to']['x'],link['to']['y']))
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
        grid=np.zeros((GRID,GRID),dtype=np.float32)
        room,px,py=self.position(view)
        for (scope,x,y),count in self.visits.items():
            if scope in {r['id'] for r in visible_rooms(view)} and abs(x-px)<=CENTER and abs(y-py)<=CENTER:
                grid[y-py+CENTER,x-px+CENTER]=min(count/8,1)
        return np.rot90(grid,rotation).ravel().copy()


class DungeonEnv(CombatEnv):
    def __init__(self,out,budget=512,seeds=None,offset=0):
        super().__init__(out,budget=budget,rotate_frames=True,scenarios=['standard'])
        self.observation_space=gym.spaces.Box(0,1,shape=(OBS_SIZE,),dtype=np.float32)
        self.seeds=seeds or seed_plan('training',64)
        self.offset=offset

    def observation(self):
        return np.concatenate((*self.frames,self.memory.features(self.view,self.rotation),
                               navigation_features(self.view,self.rotation,self.memory.used_passages),
                               self.plan_features()))

    def refresh_plan(self):
        """Ask the game's read-only A* helper for one safe frontier direction.

        This is deliberately narrow: it reveals no future rooms or RNG, and it
        switches off whenever the current room has enemies or active hazards.
        The learned policy still chooses combat and every world action; the hint
        prevents a tiny local field of view from turning empty-room navigation
        into an unlearnable, repeated square walk.
        """
        used=[list(v) for v in self.memory.used_passages]
        self.plan=self.page.evaluate('''used => {
          const operator=window.agent.inspectOperator();
          const danger=operator.room.enemyCount>0 || operator.room.warnings.some(w=>w.hostile&&w.dangerous) ||
            operator.room.hazards.some(h=>h.damage>0);
          if(operator.decision!=="world" || danger)return {active:false};
          const usedSet=new Set(used.map(v=>`${v[0]}:${v[1]},${v[2]}`));
          const tileAt=new Map(operator.room.tiles.map(t=>[`${t.x},${t.y}`,t]));
          const candidates=operator.pathfinding.pointsOfInterest.filter(point=>{
            const tile=tileAt.get(`${point.x},${point.y}`), traversal=tile?.traversal??{};
            return point.route?.reachable && point.route.actions.length && traversal.unlocked!==false &&
              !usedSet.has(`${operator.room.id}:${point.x},${point.y}`);
          }).sort((a,b)=>a.route.actions.length-b.route.actions.length ||
            (a.kind==="door"?-1:1)-(b.kind==="door"?-1:1));
          const goal=candidates[0];
          if(!goal)return {active:false};
          return {active:true,direction:goal.route.actions[0].direction,
            distance:Math.min(goal.route.actions.length,100),kind:goal.kind};
        }''',used)

    def plan_features(self):
        values=np.zeros(PLANNER_SIZE,dtype=np.float32)
        plan=getattr(self,'plan',{})
        if not plan.get('active'): return values
        directions=['up','right','down','left']
        world=directions.index(plan['direction'])
        local=(world-self.rotation)%4
        values[local]=1
        values[4]=min(float(plan['distance'])/100,1)
        values[5]=float(plan.get('kind')=='ladder')
        return values

    def reset(self,*,seed=None,options=None):
        # Training cycles a declared pool, independent of episode duration.
        # Procedural rooms retain substantial browser-side state.  Recycling
        # between small batches keeps collection from accumulating enough state
        # to push WSL into swap or hang during the final browser shutdown.
        if self.episode and self.episode % 8 == 0:
            self._open_game_page()
        chosen=(options or {}).get('episodeSeed',self.seeds[(self.episode+self.offset)%len(self.seeds)])
        super().reset(seed=int(chosen),options={'scenario':'standard'})
        self.episode_seed=int(chosen)
        # Depth is outcome/reward supervision only, never a policy feature.
        depth=self.page.evaluate('() => window.agent.observe().room.depth')
        self.memory=ExplorationMemory(self.view,depth)
        self.refresh_plan()
        self.game_actions=0
        self.assisted_actions=0
        self.navigator_actions=0
        self.world_turns=0
        self.health_lost=0
        self.rejected_actions=0
        self.consecutive_rejected=0
        self.max_consecutive_rejected=0
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
        self.refresh_plan()
        self.game_actions+=1
        self.assisted_actions+=int(controller=='helper')
        self.navigator_actions+=int(controller=='navigator')
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
        before_observation=self.observation()
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
        observation=self.observation()
        last=self.trace[-1]
        rejected=rejected_without_visible_effect(before_observation,observation,last,done or truncated)
        if rejected:
            self.rejected_actions+=1
            self.consecutive_rejected+=1
            self.max_consecutive_rejected=max(self.max_consecutive_rejected,self.consecutive_rejected)
        else:
            self.consecutive_rejected=0
        if done or truncated:
            self.stop_reason='dead' if done else self.stop_reason or 'budget-incomplete'
            info={'phase':self.phase,'seed':self.game_seed,'episodeSeed':self.episode_seed,
                  'rotation':self.rotation,'status':self.stop_reason,'steps':self.steps,
                  'gameActions':self.game_actions,'helperActions':self.assisted_actions,
                  'navigatorActions':self.navigator_actions,
                  'worldTurns':self.world_turns,'roomsVisited':len(self.memory.rooms),
                  'positionsVisited':len(self.memory.visits),'maxDepth':self.memory.max_depth,
                  'initialDepth':self.memory.initial_depth,'health':self.view['player']['health'],
                  'healthLost':self.health_lost,'reward':self.total_reward,
                  'rejectedActions':self.rejected_actions,
                  'maxConsecutiveRejected':self.max_consecutive_rejected,
                  'seconds':time.perf_counter()-self.started}
            with (self.out/'episodes.jsonl').open('a') as f: f.write(json.dumps(info)+'\n')
            replay=self.page.evaluate('() => window.agent.exportReplay()')
            (self.out/'latest-replay.json').write_text(json.dumps(replay))
        if rejected:
            info['rejectedAction']=int(action)
        return observation,reward,done,truncated,info


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


def evaluate_dungeons(env,model,seeds,deterministic=True,filter_rejected=False,planner_assist=False,
                      baseline_fallback=False,model_confidence=0,safety_shield=False):
    rows=[]
    with torch.random.fork_rng(devices=[]):
        torch.manual_seed(987)
        rng=np.random.default_rng(987)
        label='random' if model is None else ('deterministic' if deterministic else 'sampled')
        if filter_rejected: label='filtered-'+label
        if planner_assist: label='planner-'+label
        if baseline_fallback: label='hybrid-'+label
        if safety_shield: label='shielded-'+label
        env.phase='dungeon-'+label+'-evaluation'
        if baseline_fallback:
            env.transition_callback=lambda before,action,after,result: env.page.evaluate(
                '''([before,action,after,info]) => navigationFallback.feedback(before,action,after,info)''',
                [before,action,after,{'recorded':result['recorded'],'turnDelta':result['turnDelta']}])
        for seed in seeds:
            obs,_=env.reset(options={'episodeSeed':seed})
            if baseline_fallback:
                # DungeonEnv deliberately recycles the browser page periodically.
                # Install the fallback on the current page after every reset.
                env.page.add_script_tag(path=str(ROOT/'agent-baseline.js'))
                env.page.evaluate('() => { window.navigationFallback = new AgentBaseline.Policy(); }')
            rejected={}
            learner_decisions=0; fallback_decisions=0
            shield_accepted=0; shield_rejected=Counter()
            while True:
                key=obs.tobytes()
                planned=planner_action(env) if planner_assist else None
                if planned is not None and planned not in rejected.get(key,()):
                    action=planned
                    env.controller='navigator'
                elif baseline_fallback and safety_shield and tactical_view(env.view) and model is not None:
                    if filter_rejected:
                        candidate=policy_action(model,obs,deterministic,rejected.get(key,()))
                    else:
                        candidate=int(model.predict(obs,deterministic=deterministic)[0])
                    fallback=env.page.evaluate('(view) => navigationFallback.choose(view)',env.view)
                    direction=world_direction(candidate,env.rotation) if candidate is not None else None
                    operator=env.page.evaluate('() => window.agent.inspectOperator()')
                    accepted,reason=shield_assessment(operator,direction,fallback)
                    if accepted:
                        action=candidate; env.controller='shielded-learner'
                        learner_decisions+=1; shield_accepted+=1
                    elif fallback and fallback.get('type')=='Move':
                        world=[row['direction'] for row in ACTIONS].index(fallback['direction'])
                        action=(world-env.rotation)%len(ACTIONS)
                        env.controller='baseline-fallback'
                        fallback_decisions+=1; shield_rejected[reason]+=1
                    else:
                        action=candidate; env.controller='learner-unshielded-no-fallback'
                        learner_decisions+=1; shield_rejected[reason]+=1
                elif baseline_fallback and (not tactical_view(env.view) or
                        (model is not None and policy_confidence(model,obs)<model_confidence)):
                    fallback=env.page.evaluate('(view) => navigationFallback.choose(view)',env.view)
                    if fallback and fallback.get('type')=='Move':
                        world=[row['direction'] for row in ACTIONS].index(fallback['direction'])
                        action=(world-env.rotation)%len(ACTIONS)
                        env.controller='baseline-fallback'
                        fallback_decisions+=1
                    elif model is None:
                        action=int(rng.integers(4))
                        env.controller='learner'
                        learner_decisions+=1
                    elif filter_rejected:
                        action=policy_action(model,obs,deterministic,rejected.get(key,()))
                        env.controller='learner'
                        learner_decisions+=1
                    else:
                        action=int(model.predict(obs,deterministic=deterministic)[0])
                        env.controller='learner'
                        learner_decisions+=1
                elif model is None:
                    action=int(rng.integers(4))
                    env.controller='learner'
                    learner_decisions+=1
                elif filter_rejected:
                    action=policy_action(model,obs,deterministic,rejected.get(key,()))
                    env.controller='learner'
                    learner_decisions+=1
                else:
                    action=int(model.predict(obs,deterministic=deterministic)[0])
                    env.controller='learner'
                    learner_decisions+=1
                if action is None:
                    # All four directions were rejected without changing anything.
                    # Re-open the raw choice so the environment budget still owns
                    # episode termination and the failure stays visible in metrics.
                    action=int(model.predict(obs,deterministic=deterministic)[0])
                next_obs,_,done,truncated,info=env.step(action)
                if filter_rejected and info.get('rejectedAction') is not None:
                    rejected.setdefault(key,set()).add(int(info['rejectedAction']))
                obs=next_obs
                if done or truncated:
                    if filter_rejected: info['actionFilter']='identical-observation rejection cache'
                    if planner_assist: info['navigationAssist']='safe current-room A* frontier route'
                    if baseline_fallback:
                        info['navigationFallback']='restricted-perception programmed baseline outside tactical states and below the confidence threshold'
                        info['modelConfidenceThreshold']=model_confidence
                        info['learnerDecisions']=learner_decisions
                        info['fallbackDecisions']=fallback_decisions
                    if safety_shield:
                        info['safetyShield']='zero-known-damage, zero-unknown-damage, and restricted-perception baseline consensus'
                        info['shieldAcceptedDecisions']=shield_accepted
                        info['shieldRejectedDecisions']=dict(shield_rejected)
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
    parser.add_argument('--eval-seed-start',type=int,default=0)
    parser.add_argument('--evaluation-set',choices=['standard','deterministic','sampled','planner','all'],default='standard',
                        help='Policy families to evaluate; planner results are always labeled as assisted')
    parser.add_argument('--baseline-fallback',action='store_true',
                        help='During evaluation, use the restricted-perception baseline when no tactical state or A* route is active')
    parser.add_argument('--model-confidence',type=float,default=0,
                        help='With baseline fallback, defer tactical states below this maximum action probability')
    parser.add_argument('--safety-shield',action='store_true',
                        help='Require damage-safe baseline consensus before a learned tactical move executes')
    parser.add_argument('--learning-rate',type=float,help='Explicit training override; recorded in manifest')
    parser.add_argument('--rehearsal-navigation',type=Path)
    parser.add_argument('--rehearsal-combat',type=Path)
    parser.add_argument('--rehearsal-recovery',type=Path)
    parser.add_argument('--rehearsal-rate',type=float,default=.001)
    parser.add_argument('--rejection-feedback',action='store_true')
    parser.add_argument('--reconfigure-workers',action='store_true',help='Explicitly resume with a new worker count and fresh rollouts')
    parser.add_argument('--archive-interval',type=int,choices=[0,256,512,1024],default=0,
                        help='Preserve milestone checkpoints during bounded training')
    args=parser.parse_args()
    if args.rehearsal_recovery and not args.rehearsal_navigation: parser.error('Recovery requires original navigation and combat rehearsal')
    if args.rejection_feedback and not args.rehearsal_navigation: parser.error('Rejection feedback requires rehearsal datasets')
    if args.reconfigure_workers and not args.resume:
        parser.error('Worker reconfiguration requires --resume')
    if not 0<=args.model_confidence<=1 or (args.model_confidence and not args.baseline_fallback):
        parser.error('Model confidence must be in [0,1] and requires baseline fallback')
    if args.safety_shield and not args.baseline_fallback:
        parser.error('Safety shield requires baseline fallback')
    if bool(args.rehearsal_navigation)!=bool(args.rehearsal_combat) or (args.rehearsal_navigation and not (args.resume or args.from_combat)):
        parser.error('Both rehearsal datasets are required and only supported for training')
    if (not 0<args.rehearsal_rate<=.001) or (args.rehearsal_rate!=.001 and not args.rehearsal_navigation):
        parser.error('Rehearsal rate must be in (0, .001] and requires rehearsal datasets when overridden')
    if args.learning_rate is not None and (not 0<args.learning_rate<=.001 or not (args.resume or args.from_combat)):
        parser.error('Learning rate must be in (0, .001] and used only for training')
    if not 1<=args.steps<=1000000 or not 1<=args.budget<=10000 or not 1<=args.eval_seeds<=32:
        parser.error('Use 1..1000000 steps, 1..10000 budget, 1..32 evaluation seeds')
    if args.eval_seed_start<0 or args.eval_seed_start+args.eval_seeds>32:
        parser.error('Held-out evaluation slice must stay within 32 seeds')
    args.out.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(4)
    train_seeds=seed_plan('training',64)
    test_seeds=seed_plan('held-out',32)[args.eval_seed_start:args.eval_seed_start+args.eval_seeds]
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
        if args.evaluate:
            manifest['evaluationScaffolding']={'baselineFallback':args.baseline_fallback,
                'modelConfidenceThreshold':args.model_confidence,
                'safetyShield':args.safety_shield,
                'boundary':'Restricted-perception programmed baseline controls calm states where bounded A* has no route. The optional shield requires immediate damage safety and baseline consensus for learned tactical moves.'}
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
                    if source_manifest['execution']['environments']!=args.envs and not args.reconfigure_workers:
                        raise ValueError('Resume requires original worker count')
                    model=PPO.load(source_path,env=env,device='cpu')
                    manifest['execution']={'environments':model.n_envs,'rolloutStepsPerEnvironment':model.n_steps,
                                           'rolloutBatchSize':model.n_envs*model.n_steps,
                                           'workerReconfigurationRequested':args.reconfigure_workers}
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
                callbacks=[Checkpoints(args.out,args.archive_interval or None)]
                manifest['archiveInterval']=args.archive_interval or None
                if args.rehearsal_navigation:
                    from rehearsal import configure
                    practice,manifest['rehearsal']=configure(
                        args.rehearsal_navigation,args.rehearsal_combat,manifest['gameContract'],
                        args.rejection_feedback,args.rehearsal_recovery,args.rehearsal_rate)
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
                    standard=[('random',None,True,False,False),('deterministic',model,True,False,False),
                              ('sampled',model,False,False,False),
                              ('filtered-deterministic',model,True,True,False),
                              ('filtered-sampled',model,False,True,False)]
                    planner=[('planner-filtered-deterministic',model,True,True,True),
                             ('planner-filtered-sampled',model,False,True,True)]
                    sampled=[standard[0],standard[2],standard[4]]
                    policies={'standard':standard,'deterministic':[standard[1]],'sampled':sampled,'planner':planner,
                              'all':standard+planner}[args.evaluation_set]
                    for name,policy,deterministic,filtered,planner in policies:
                        rows=evaluate_dungeons(evaluation,policy,test_seeds,deterministic,filtered,planner,
                                               args.baseline_fallback,args.model_confidence,args.safety_shield)
                        (args.out/f'{name}-evaluation.json').write_text(json.dumps(rows,indent=2))
                    assert model.num_timesteps==before
                    report={'mode':'dungeon-evaluation','trainingSteps':before,'episodes':len(policies)*len(test_seeds)}
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


def initialize_spatial(env,workers,local_detail=False):
    extractor=SpatialDungeonExtractorV2 if local_detail else SpatialDungeonExtractor
    return PPO('MlpPolicy',env,n_steps=256//workers,batch_size=64,n_epochs=4,
               learning_rate=3e-5,ent_coef=.01,target_kl=.01,seed=123,device='cpu',
               policy_kwargs={'features_extractor_class':extractor,
                              'features_extractor_kwargs':{'features_dim':128},
                              'net_arch':{'pi':[128],'vf':[128]}},verbose=1)


if __name__=='__main__': main()
