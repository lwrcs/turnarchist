"""Navigation demonstrations from restricted perception, with combat rehearsal."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess

import gymnasium as gym
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv

from combat_pilot import ROOT,SIZE,ROTATED_ENCODER
from dungeon_pilot import (DungeonEnv,ENCODER,REWARD,HELPER,OBS_SIZE,seed_plan,
                           initialize_from_combat,initialize_spatial,planner_action)
from imitate import load_demonstrations


def navigation_example(before,after,transition):
    """Keep only successful actions explicitly following the frontier hint.

    The baseline remains useful to survive combat while gathering a run, but its
    local fallback can walk harmless squares forever when it cannot see a door.
    Treating those steps as navigation demonstrations taught the policy that
    looping was the desired response.  The planner is the actual navigation
    teacher, so keep its safe route steps and discard the fallback's rows.
    """
    return (transition['controller']=='planner' and transition['action']['type']=='Move'
            and transition['recorded'] and before['decision']=='world'
            and not any(e.get('isEnemy') or e.get('appearance')=='unidentified' for e in before['room']['entities'])
            and not any(w.get('hostile') and w.get('dangerous', True)
                        for w in before['room']['hitWarnings'])
            and after['player']['health']>=before['player']['health']
            and (before['room']['id'],before['player']['x'],before['player']['y']) !=
                (after['room']['id'],after['player']['x'],after['player']['y']))


def exploration_example(before,after,transition,seen_positions):
    """Keep a teacher exploration move only when it safely reaches new ground.

    The baseline is deliberately excluded from ordinary navigation data because
    it can harmlessly cycle when no frontier hint is visible.  Its first visits
    are different: they add demonstrable exploration coverage without encoding
    a back-and-forth loop as the desired policy.
    """
    destination=(after['room']['id'],after['player']['x'],after['player']['y'])
    return (transition['controller']=='teacher' and transition['action']['type']=='Move'
            and transition['recorded'] and before['decision']=='world'
            and not any(e.get('isEnemy') or e.get('appearance')=='unidentified' for e in before['room']['entities'])
            and not any(w.get('hostile') and w.get('dangerous', True)
                        for w in before['room']['hitWarnings'])
            and not any(e.get('isEnemy') or e.get('appearance')=='unidentified' for e in after['room']['entities'])
            and after['player']['health']>=before['player']['health']
            and destination not in seen_positions)


def planner_state_example(before):
    """A calm state for which the bounded A* teacher supplied a direction.

    DAgger labels the state before the learner acts, including a harmless wall
    bump or detour. Requiring a successful learner move would recreate the
    original covariate-shift failure: only tidy teacher-route states remain.
    """
    return (before['decision']=='world'
            and not any(e.get('isEnemy') or e.get('appearance')=='unidentified'
                        for e in before['room']['entities'])
            and not any(w.get('hostile') and w.get('dangerous', True)
                        for w in before['room']['hitWarnings']))


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
    xs,ys,example_seeds,example_rotations,outcomes=[],[],[],[],[]
    collection_seeds=training_seed_slice(getattr(args,'seed_start',0),args.seeds)
    recovery_model=getattr(args,'recovery_model',None)
    dagger_model=getattr(args,'dagger_model',None)
    include_teacher_exploration=getattr(args,'include_teacher_exploration',False)
    recoveries=[]
    try:
        torch.set_num_threads(4)
        learner_path=dagger_model or recovery_model
        learner=PPO.load(learner_path,device='cpu') if learner_path else None
        source=json.loads((learner_path.parent/'manifest.json').read_text()) if learner_path else None
        for episode_seed in collection_seeds:
            obs,_=env.reset(options={'episodeSeed':episode_seed})
            if source:
                for key,expected in [('encoder',ENCODER),('reward',REWARD),('helper',HELPER),('gameContract',env.contract)]:
                    if source[key]!=expected: raise ValueError('Recovery checkpoint mismatch: '+key)
            recovery_left=0; recovery=None
            seen_positions={(env.view['room']['id'],env.view['player']['x'],env.view['player']['y'])}
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
                # In a calm room, demonstrate following the same bounded A*
                # frontier hint supplied to the learner.  Combat and all cases
                # without a safe route retain the conservative baseline policy.
                planner=env.plan.get('active')
                action=({'type':'Move','direction':env.plan['direction']}
                        if planner else env.page.evaluate('(view) => navigationTeacher.choose(view)',before))
                if learner is not None and not recovery_left and doorway_cycle(env.trace):
                    recovery_left=16
                    recovery={'episodeSeed':episode_seed,'triggerAction':env.game_actions,
                              'loopPositions':[[t['room'],t['x'],t['y']] for t in env.trace[-2:]],
                              'escaped':False,'samples':0,'teacherSteps':0}
                    recoveries.append(recovery)
                # DAgger only exposes the learner to calm, planner-covered
                # navigation. The established teacher keeps combat and all
                # unsupported situations out of this navigation dataset.
                teaching=(not planner) if dagger_model else (learner is None or recovery_left>0)
                env.controller=('planner' if teaching and planner else 'teacher') if teaching else 'learner'
                label=planner_action(env) if dagger_model and planner else None
                if dagger_model and planner:
                    local,_=learner.predict(obs,deterministic=True)
                    action={'type':'Move','direction':['up','right','down','left'][(int(local)+env.rotation)%4]}
                elif not teaching:
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
                if dagger_model and label is not None and planner_state_example(before):
                    xs.append(obs.copy()); ys.append(label)
                    example_seeds.append(episode_seed); example_rotations.append(env.rotation)
                    if recovery_left: recovery['samples']+=1
                elif transitions:
                    transition=transitions[0]
                    keep=(include_teacher_exploration and
                          exploration_example(*transition,seen_positions))
                    keep |= navigation_example(*transition)
                    if keep:
                        xs.append(obs.copy()); ys.append(local)
                        example_seeds.append(episode_seed); example_rotations.append(env.rotation)
                        if recovery_left: recovery['samples']+=1
                    seen_positions.add((transition[1]['room']['id'],transition[1]['player']['x'],transition[1]['player']['y']))
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
        np.savez_compressed(args.out/'demonstrations.npz',observations=np.asarray(xs,dtype=np.float32),
                           actions=np.asarray(ys,dtype=np.int64),
                           episodeSeeds=np.asarray(example_seeds,dtype=np.uint32),
                           rotations=np.asarray(example_rotations,dtype=np.uint8))
        manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,'gameContract':env.contract,
                  'trainingSeeds':collection_seeds,'samples':len(xs),
                  'teacherSha256':hashlib.sha256((ROOT/'agent-baseline.js').read_bytes()).hexdigest(),
                  'selection':('Recorded, changed-position, threat-free directional steps that followed the safe A* frontier hint; '
                               'baseline fallback steps are excluded.' if not include_teacher_exploration else
                               'Safe A* frontier steps plus threat-free baseline moves that reached a first-visited tile; '
                               'baseline revisits are excluded to avoid teaching cycles.')}
        if recovery_model:
            manifest['recovery']={'version':1,'source':str(recovery_model),
                'sourceSha256':hashlib.sha256(recovery_model.read_bytes()).hexdigest(),
                'trigger':'six recorded zero-turn learner moves alternating two rooms',
                'teacherStepsPerIntervention':16,'teacherHistory':'choose each learner decision; feedback on all executed actions',
                'limitation':'Assisted collection, not unassisted evaluation; escaped means left the two loop positions'}
        if dagger_model:
            manifest['dagger']={'version':1,'source':str(dagger_model),
                'sourceSha256':hashlib.sha256(dagger_model.read_bytes()).hexdigest(),
                'learnerControl':'Deterministic learner actions only while bounded A* is active in a calm room.',
                'label':'Teacher A* action at the learner-visited pre-action state, including harmless rejected moves and detours.',
                'purpose':'Collect recovery labels for states absent from teacher-only trajectories.'}
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


def load_navigation_provenance(path):
    """Load sample-level seed provenance required for leakage-free validation."""
    x,y,manifest=load_navigation(path)
    with np.load(path/'demonstrations.npz',allow_pickle=False) as data:
        if 'episodeSeeds' not in data or 'rotations' not in data:
            raise ValueError('Navigation dataset lacks sample provenance; recollect it before fitting')
        episode_seeds=data['episodeSeeds']; rotations=data['rotations']
    if episode_seeds.shape!=(len(x),) or rotations.shape!=(len(x),):
        raise ValueError('Invalid navigation provenance shapes')
    if not set(map(int,episode_seeds))<=set(manifest['trainingSeeds']):
        raise ValueError('Navigation sample seed is absent from its manifest')
    if np.any(rotations>3): raise ValueError('Invalid navigation rotation')
    return x,y,episode_seeds.astype(np.uint32),rotations.astype(np.uint8),manifest


def split_navigation_seeds(episode_seeds,validation_fraction=.2):
    """Split whole procedural episodes, never individual rows, reproducibly."""
    unique=sorted(set(map(int,episode_seeds)),
                  key=lambda seed:hashlib.sha256(f'turnarchist-navigation-validation:{seed}'.encode()).digest())
    if len(unique)<2: raise ValueError('Navigation fitting requires examples from at least two episode seeds')
    validation_count=max(1,min(len(unique)-1,round(len(unique)*validation_fraction)))
    validation=set(unique[:validation_count])
    validation_mask=np.asarray([int(seed) in validation for seed in episode_seeds],dtype=bool)
    return ~validation_mask,validation_mask,sorted(set(unique)-validation),sorted(validation)


def policy_metrics(model,x,y,batch_size=512):
    losses=[]; correct=0
    with torch.no_grad():
        for start in range(0,len(x),batch_size):
            inputs=torch.as_tensor(x[start:start+batch_size],dtype=torch.float32)
            labels=torch.as_tensor(y[start:start+batch_size],dtype=torch.long)
            distribution=model.policy.get_distribution(inputs)
            logp=distribution.log_prob(labels)
            losses.append(float(-logp.sum()))
            correct+=int((distribution.distribution.probs.argmax(dim=1)==labels).sum())
    return {'loss':sum(losses)/len(x),'accuracy':correct/len(x)}


def bounded_unique_observations(observations):
    """Exact row cardinality without materializing a giant sorted copy of x."""
    return len({hashlib.blake2b(np.ascontiguousarray(row).tobytes(), digest_size=16).digest()
                for row in observations})


class Spaces(gym.Env):
    def __init__(self):
        self.action_space=gym.spaces.Discrete(4)
        self.observation_space=gym.spaces.Box(0,1,shape=(OBS_SIZE,),dtype=np.float32)


def fit(args):
    x,y,episode_seeds,rotations,source=load_navigation_provenance(args.data)
    train_mask,validation_mask,training_seeds,validation_seeds=split_navigation_seeds(episode_seeds)
    train_x,train_y=x[train_mask],y[train_mask]
    validation_x,validation_y=x[validation_mask],y[validation_mask]
    combat_x,combat_y,combat=load_demonstrations(args.combat_data)
    checkpoint=json.loads((args.from_combat.parent/'manifest.json').read_text())
    if source['gameContract']!=combat['gameContract'] or source['gameContract']!=checkpoint['gameContract']:
        raise ValueError('Game contracts differ')
    if checkpoint['encoder']!=ROTATED_ENCODER: raise ValueError('Legal rotated combat checkpoint required')
    combat_x=np.pad(combat_x,((0,0),(0,OBS_SIZE-SIZE*2)))
    torch.set_num_threads(4)
    # The spatial policy is created from scratch.  Its initialization must be
    # part of the experiment contract, otherwise a candidate comparison also
    # compares accidental PyTorch RNG state from earlier processes.
    torch.manual_seed(args.seed)
    env=DummyVecEnv([Spaces]*args.envs)
    try:
        model=(initialize_spatial(env,args.envs,args.architecture=='spatial-local',seed=args.seed)
               if args.architecture.startswith('spatial')
               else initialize_from_combat(args.from_combat,checkpoint,env,args.envs))
        for group in model.policy.optimizer.param_groups:
            group['lr']=args.imitation_learning_rate
        groups=[(torch.as_tensor(a),torch.as_tensor(b,dtype=torch.long))
                for a,b in [(train_x,train_y),(combat_x,combat_y)]]
        rng=np.random.default_rng(123)
        pretrain_history=[]
        if args.combat_pretrain_updates:
            model.save(args.out/'untrained')
            combat_inputs,combat_labels=groups[1]
            for update in range(1,args.combat_pretrain_updates+1):
                indices=rng.integers(len(combat_inputs),size=args.combat_batch)
                _,logp,_=model.policy.evaluate_actions(combat_inputs[indices],combat_labels[indices])
                loss=-logp.mean()
                model.policy.optimizer.zero_grad(); loss.backward()
                torch.nn.utils.clip_grad_norm_(model.policy.parameters(),.5)
                model.policy.optimizer.step()
                if update%25==0 or update==args.combat_pretrain_updates:
                    pretrain_history.append({'update':update,'combat':policy_metrics(model,combat_x,combat_y)})
        model.save(args.out/'initial')
        losses=[]
        validation_history=[]
        initial_navigation=policy_metrics(model,validation_x,validation_y)
        initial_combat=policy_metrics(model,combat_x,combat_y)
        # A fresh spatial extractor must learn the combat rehearsal before it
        # can reach an absolute 99% score.  Select against its own post-warmup
        # agreement instead: this preserves combat competence while avoiding a
        # rejection caused solely by initialization speed.
        combat_floor=max(0,initial_combat['accuracy']-.01)
        initial_eligible=initial_combat['accuracy']>=combat_floor
        best_state=({key:value.detach().cpu().clone() for key,value in model.policy.state_dict().items()}
                    if initial_eligible else None)
        best_score=((initial_navigation['accuracy'],initial_combat['accuracy'])
                    if initial_eligible else (-1,-1))
        best_update=0; stale_checks=0; check_interval=25; patience=10
        # Balanced sampling keeps numerous navigation rows from swamping combat.
        for update in range(1,args.updates+1):
            inputs=[]; labels=[]
            for (a,b),batch_size in zip(groups,[32,args.combat_batch]):
                indices=rng.integers(len(a),size=batch_size)
                inputs.append(a[indices]); labels.append(b[indices])
            _,logp,_=model.policy.evaluate_actions(torch.cat(inputs),torch.cat(labels))
            loss=-logp.mean()
            model.policy.optimizer.zero_grad(); loss.backward()
            torch.nn.utils.clip_grad_norm_(model.policy.parameters(),.5)
            model.policy.optimizer.step()
            losses.append(float(loss.detach()))
            if update%check_interval==0 or update==args.updates:
                navigation=policy_metrics(model,validation_x,validation_y)
                combat_metric=policy_metrics(model,combat_x,combat_y)
                row={'update':update,'navigation':navigation,'combat':combat_metric}
                validation_history.append(row)
                score=(navigation['accuracy'],combat_metric['accuracy'])
                if combat_metric['accuracy']>=combat_floor and score>best_score:
                    best_score=score; best_update=update; stale_checks=0
                    best_state={key:value.detach().cpu().clone() for key,value in model.policy.state_dict().items()}
                elif best_state is not None:
                    stale_checks+=1
                if best_state is not None and stale_checks>=patience: break
        updates_completed=len(losses)
        model.save(args.out/'last')
        if best_state is None:
            (args.out/'losses.json').write_text(json.dumps(losses))
            (args.out/'validation.json').write_text(json.dumps({'initialNavigation':initial_navigation,
                'initialCombat':initial_combat,'combatPretraining':pretrain_history,
                'checks':validation_history},indent=2))
            (args.out/'failure.json').write_text(json.dumps({
                'reason':'No checkpoint reached required combat agreement',
                'combatFloor':combat_floor,'updatesCompleted':updates_completed,
                'last':validation_history[-1]},indent=2))
            raise RuntimeError('No checkpoint reached the required combat agreement; last checkpoint preserved')
        model.policy.load_state_dict(best_state)
        model.save(args.out/'final')
        manifest={**source,'task':'procedural-dungeon','trainingMode':'navigation-imitation-with-combat-rehearsal',
                  'git':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                  'execution':{'environments':args.envs,'rolloutStepsPerEnvironment':256//args.envs},
                  'sourceCheckpoint':{'path':str(args.from_combat),'sha256':hashlib.sha256(args.from_combat.read_bytes()).hexdigest()},
                  'datasets':{str(p):hashlib.sha256((p/'demonstrations.npz').read_bytes()).hexdigest() for p in [args.data,args.combat_data]},
                  'updatesRequested':args.updates,'updatesCompleted':updates_completed,'bestUpdate':best_update,
                  'architecture':args.architecture,
                  'combatPretrainUpdates':args.combat_pretrain_updates,
                  'imitationLearningRate':args.imitation_learning_rate,
                  'randomSeed':args.seed,
                  'navigationSamples':len(x),'navigationTrainingSamples':len(train_x),
                  'navigationValidationSamples':len(validation_x),'combatSamples':len(combat_x),
                  'navigationTrainingSeeds':training_seeds,'navigationValidationSeeds':validation_seeds,
                  'navigationActionCounts':np.bincount(y,minlength=4).tolist(),
                  'navigationUniqueObservations':bounded_unique_observations(x),
                  'batchComposition':f'32 navigation + {args.combat_batch} combat samples, sampled with replacement',
                  'checkpointSelection':'Best seed-held-out navigation accuracy, then combat agreement, retaining the earliest tie; combat agreement may fall at most one percentage point. Checked every 25 updates with patience 10.',
                  'limitation':'Imitation only; no PPO experience. Offline validation selects a checkpoint but does not replace held-out dungeon evaluation.'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'losses.json').write_text(json.dumps(losses))
        (args.out/'validation.json').write_text(json.dumps({'initialNavigation':initial_navigation,
            'initialCombat':initial_combat,'combatPretraining':pretrain_history,
            'checks':validation_history},indent=2))
        final_navigation=policy_metrics(model,validation_x,validation_y)
        final_combat=policy_metrics(model,combat_x,combat_y)
        result={'trainingSteps':model.num_timesteps,'updatesRequested':args.updates,
                'updatesCompleted':updates_completed,'bestUpdate':best_update,
                'initialLoss':losses[0],'lastLoss':losses[-1],
                'initialValidation':initial_navigation,'selectedValidation':final_navigation,
                'initialCombat':initial_combat,'selectedCombat':final_combat}
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
    parser.add_argument('--dagger-model',type=Path,help='Collect bounded-A* labels at calm states visited by this learner')
    parser.add_argument('--include-teacher-exploration',action='store_true',
                        help='Also record safe baseline moves that reach a first-visited tile')
    parser.add_argument('--envs',type=int,choices=[1,2,4],default=2)
    parser.add_argument('--updates',type=int,default=2000)
    parser.add_argument('--architecture',choices=['inherited-mlp','spatial','spatial-local'],default='inherited-mlp')
    parser.add_argument('--combat-batch',type=int,choices=[32,64,96,128],default=32)
    parser.add_argument('--combat-pretrain-updates',type=int,default=0)
    parser.add_argument('--imitation-learning-rate',type=float,default=3e-5)
    parser.add_argument('--seed',type=int,default=123,
                        help='PyTorch initialization seed for reproducible fit candidates')
    args=parser.parse_args()
    if (not 1<=args.seeds<=64 or not 1<=args.budget<=10000 or not 1<=args.updates<=10000
            or not 0<=args.combat_pretrain_updates<=10000
            or not 0<=args.seed<2**31
            or not math.isfinite(args.imitation_learning_rate)
            or not 0<args.imitation_learning_rate<=1e-2): parser.error('Invalid experiment bounds')
    if args.mode=='collect' and (args.seed_start<0 or args.seed_start+args.seeds>64): parser.error('Collection seed range exceeds training pool')
    if (args.recovery_model or args.dagger_model) and args.mode!='collect': parser.error('Recovery and DAgger models are collection only')
    if args.include_teacher_exploration and args.mode!='collect': parser.error('Teacher exploration is collection only')
    if args.recovery_model and args.dagger_model: parser.error('Choose either recovery collection or DAgger collection')
    if args.mode=='fit' and not all([args.data,args.combat_data,args.from_combat]): parser.error('Fit requires both datasets and a combat checkpoint')
    args.out.mkdir(parents=True,exist_ok=False)
    (collect if args.mode=='collect' else fit)(args)
