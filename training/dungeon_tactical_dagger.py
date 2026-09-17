"""Collect tactical teacher corrections at safe learner-visited training states."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from stable_baselines3 import PPO

from combat_pilot import ACTIONS,ROOT,encode,rotate_features
from dungeon_baseline import outcome
from dungeon_pilot import (DungeonEnv,ENCODER,REWARD,HELPER,policy_action,
                           rejected_without_visible_effect,shield_assessment,
                           tactical_view,world_direction,seed_plan)
from select_baseline_dungeon_data import evenly_spaced_rows


def validate_model(path,contract):
    manifest=json.loads((path.parent/'manifest.json').read_text())
    expected_values=[('encoder',ENCODER),('reward',REWARD),('helper',HELPER)]
    if contract is not None: expected_values.append(('gameContract',contract))
    for key,expected in expected_values:
        if manifest.get(key)!=expected: raise ValueError('Tactical learner contract mismatch: '+key)
    return manifest


def collect_episode(env,model,episode_seed,cap,expected_contract):
    observation,_=env.reset(options={'episodeSeed':episode_seed})
    if env.contract!=expected_contract:
        raise ValueError('Tactical learner contract mismatch: gameContract')
    if not env.page.evaluate('() => typeof AgentBaseline !== "undefined"'):
        env.page.add_script_tag(path=str(ROOT/'agent-baseline.js'))
    env.page.evaluate('() => { window.tacticalTeacher = new AgentBaseline.Policy(); }')
    rows=[]; labels=[]; rejected={}; decisions=0
    accepted=interventions=rejected_actions=0
    initial_health=env.view['player']['health']
    while decisions<env.budget:
        before=env.view; key=observation.tobytes()
        teacher=env.page.evaluate('(view) => window.tacticalTeacher.choose(view)',before)
        if teacher is None:
            result=outcome(env,'teacher-no-action',decisions); break
        teacher_local=(next((i for i,row in enumerate(ACTIONS)
                             if row['direction']==teacher.get('direction')),None)
                       if teacher.get('type')=='Move' else None)
        if teacher_local is not None: teacher_local=(teacher_local-env.rotation)%len(ACTIONS)
        tactical=before['decision']=='world' and tactical_view(before)
        if tactical and teacher_local is not None:
            rows.append(observation.copy()); labels.append(teacher_local)
        executed=teacher; controller='baseline-intervention'
        candidate=None
        if tactical:
            candidate=policy_action(model,observation,True,rejected.get(key,()))
            if candidate is not None:
                direction=world_direction(candidate,env.rotation)
                operator=env.page.evaluate('() => window.agent.inspectOperator()')
                safe,_=shield_assessment(operator,direction,teacher,False)
                if safe:
                    executed={'type':'Move','direction':direction}
                    controller='dagger-learner'; accepted+=1
                else: interventions+=1
            else: interventions+=1
        reward,dead,truncated=env.execute(executed,controller)
        env.total_reward+=reward
        env.frames.append(rotate_features(encode(env.view),env.rotation))
        decisions+=1
        env.page.evaluate('''([before,action,after,turnDelta]) =>
            window.tacticalTeacher.feedback(before,action,after,{turnDelta})''',
            [before,executed,env.view,env.trace[-1]['turnDelta']])
        next_observation=env.observation()
        if controller=='dagger-learner' and rejected_without_visible_effect(
                observation,next_observation,env.trace[-1],dead or truncated):
            rejected.setdefault(key,set()).add(int(candidate)); rejected_actions+=1
        observation=next_observation
        if dead or truncated:
            result=outcome(env,'dead' if dead else 'budget-incomplete',decisions); break
    else: result=outcome(env,'budget-incomplete',decisions)
    result.update({'initialHealth':initial_health,'teacherLabels':len(labels),
                   'learnerAccepted':accepted,'teacherInterventions':interventions,
                   'learnerRejectedActions':rejected_actions})
    if rows:
        selected_x,selected_y=evenly_spaced_rows(np.asarray(rows,dtype=np.float32),
                                                 np.asarray(labels,dtype=np.int64),cap)
    else:
        selected_x=np.empty((0,env.observation_space.shape[0]),dtype=np.float32)
        selected_y=np.empty(0,dtype=np.int64)
    result['selectedLabels']=len(selected_y)
    return selected_x,selected_y,result


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--seed-start',type=int,default=0)
    parser.add_argument('--seeds',type=int,default=16)
    parser.add_argument('--budget',type=int,default=768)
    parser.add_argument('--per-episode-cap',type=int,default=192)
    args=parser.parse_args()
    if args.out.exists(): parser.error('Output already exists')
    if not 0<=args.seed_start<64 or not 1<=args.seeds<=64-args.seed_start:
        parser.error('Seed slice must stay within the 64-seed training pool')
    if not 1<=args.budget<=10000 or not 16<=args.per_episode_cap<=2048:
        parser.error('Invalid budget or per-episode cap')
    args.out.mkdir(parents=True)
    env=DungeonEnv(args.out/'evaluation',budget=args.budget)
    env.phase='dungeon-tactical-dagger-collection'
    try:
        # The live browser contract is populated by reset, so validate its
        # static parts now and compare gameContract at each episode boundary.
        source=validate_model(args.model,None)
        model=PPO.load(args.model,device='cpu')
        seeds=seed_plan('training',64)[args.seed_start:args.seed_start+args.seeds]
        xs=[];ys=[];example_seeds=[];rotations=[];outcomes=[]
        for seed in seeds:
            x,y,result=collect_episode(env,model,seed,args.per_episode_cap,source['gameContract'])
            xs.append(x);ys.append(y)
            example_seeds.append(np.full(len(y),seed,dtype=np.uint32))
            rotations.append(np.full(len(y),result['rotation'],dtype=np.uint8))
            outcomes.append(result)
            print(json.dumps({key:result[key] for key in ('episodeSeed','status','roomsVisited','maxDepth','teacherLabels','selectedLabels','learnerAccepted','teacherInterventions')}),flush=True)
        observations=np.concatenate(xs);actions=np.concatenate(ys)
        if not len(actions): raise RuntimeError('No tactical correction labels collected')
        np.savez_compressed(args.out/'demonstrations.npz',observations=observations,actions=actions,
                            episodeSeeds=np.concatenate(example_seeds),rotations=np.concatenate(rotations))
        manifest={key:source[key] for key in ('encoder','reward','helper','gameContract')}
        manifest.update({'trainingSeeds':seeds,'samples':len(actions),
            'selection':'Teacher tactical labels at states visited by a deterministic learner permitted to take only zero-predicted-damage actions; rejected identical-state actions are cached.',
            'dagger':{'version':1,'model':str(args.model),'modelSha256':hashlib.sha256(args.model.read_bytes()).hexdigest(),
                      'learnerBoundary':'tactical states, preview-safe moves only','teacher':'restricted-perception programmed baseline'},
            'perEpisodeCap':args.per_episode_cap})
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'outcomes.json').write_text(json.dumps(outcomes,indent=2))
        complete={'episodes':len(outcomes),'samples':len(actions),
                  'actionCounts':np.bincount(actions,minlength=4).tolist(),
                  'learnerAccepted':sum(row['learnerAccepted'] for row in outcomes),
                  'teacherInterventions':sum(row['teacherInterventions'] for row in outcomes),
                  'learnerRejectedActions':sum(row['learnerRejectedActions'] for row in outcomes)}
        (args.out/'complete.json').write_text(json.dumps(complete,indent=2))
        print(json.dumps(complete),flush=True)
    finally: env.close()


if __name__=='__main__': main()
