"""Small, explicitly labeled behavior-cloning warm start; no simulated rollouts."""
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

from combat_pilot import ACTIONS, CURRICULA, ROTATED_ENCODER, REWARD, ROOT, SIZE


class SpacesOnlyEnv(gym.Env):
    def __init__(self):
        self.action_space=gym.spaces.Discrete(len(ACTIONS))
        self.observation_space=gym.spaces.Box(0,1,shape=(SIZE*2,),dtype=np.float32)
    def reset(self,*,seed=None,options=None):
        raise RuntimeError('Offline model construction only; no synthetic gameplay')
    def step(self,action):
        raise RuntimeError('Offline model construction only; no synthetic gameplay')


def load_demonstrations(directory):
    directory=Path(directory)
    manifest=json.loads((directory/'manifest.json').read_text())
    expected=ROTATED_ENCODER
    if manifest['encoder'] != expected or manifest['gameContract']['observationMode'] != 'player-perception':
        raise ValueError('Compatible restricted-view demonstrations required')
    curriculum=manifest.get('curriculum','starter')
    if curriculum not in CURRICULA or manifest['trainingScenarios'] != CURRICULA[curriculum]:
        raise ValueError('Keep transfer fixtures out of this warm-start dataset')
    outcomes=json.loads((directory/'outcomes.json').read_text())
    if any(row.get('scenario') not in CURRICULA[curriculum] for row in outcomes):
        raise ValueError('Episode outside the declared training curriculum')
    with np.load(directory/'demonstrations.npz',allow_pickle=False) as data:
        observations,actions,episodes=data['observations'],data['actions'],data['episode_ids']
    if observations.ndim != 2 or observations.shape[1] != SIZE*2:
        raise ValueError('Invalid observation shape')
    if actions.shape != (len(observations),) or episodes.shape != actions.shape:
        raise ValueError('Misaligned demonstration rows')
    if not np.isfinite(observations).all() or np.any((observations<0)|(observations>1)):
        raise ValueError('Invalid observation values')
    if actions.dtype.kind not in 'iu' or np.any((actions<0)|(actions>=len(ACTIONS))):
        raise ValueError('Invalid action labels')
    if episodes.dtype.kind not in 'iu' or np.any((episodes<0)|(episodes>=len(outcomes))):
        raise ValueError('Invalid episode references')
    good=np.asarray([r['status']=='cleared' and r['health']>=r['initialHealth'] for r in outcomes])
    keep=good[episodes]
    if not keep.any():
        raise ValueError('No cleared demonstrations without health loss')
    return observations[keep].astype(np.float32),actions[keep],manifest


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--epochs',type=int,default=200)
    parser.add_argument('--envs',type=int,choices=[1,2,4],default=2,
                        help='Configure the future PPO rollout worker count, not offline training parallelism')
    args=parser.parse_args()
    if not 1 <= args.epochs <= 2000:
        parser.error('Use 1..2000 epochs')
    x,y,source=load_demonstrations(args.data)
    args.out.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(4)
    env=DummyVecEnv([SpacesOnlyEnv]*args.envs)
    try:
        model=PPO('MlpPolicy',env,n_steps=256//args.envs,batch_size=64,n_epochs=4,
                  learning_rate=3e-4,gamma=0.99,seed=123,device='cpu',
                  policy_kwargs={'net_arch':[128,128]})
        inputs=torch.as_tensor(x)
        labels=torch.as_tensor(y,dtype=torch.long)
        losses=[]
        for _ in range(args.epochs):
            order=torch.randperm(len(inputs))
            total=0
            for indices in order.split(64):
                _,log_probability,_=model.policy.evaluate_actions(inputs[indices],labels[indices])
                loss=-log_probability.mean()
                model.policy.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.policy.parameters(),0.5)
                model.policy.optimizer.step()
                total += float(loss.detach())*len(indices)
            losses.append(total/len(inputs))
        assert model.num_timesteps==0
        model.save(args.out/'final')
        manifest={'encoder':source['encoder'],'reward':REWARD,'gameContract':source['gameContract'],
                  'git':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                  'execution':{'environments':args.envs,'rolloutStepsPerEnvironment':256//args.envs},
                  'trainingMode':'behavior-cloning','trainingScenarios':source['trainingScenarios'],
                  'curriculum':source.get('curriculum','starter'),
                  'teacherVersion':source['teacherVersion'],'dataset':str(args.data),
                  'datasetSha256':hashlib.sha256((args.data/'demonstrations.npz').read_bytes()).hexdigest(),
                  'epochs':args.epochs,'samples':len(x),'uniqueObservations':len(np.unique(x,axis=0)),
                  'limitation':'Only cleared, no-health-loss fixed-fixture examples. Training loss is not held-out performance.'}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        (args.out/'losses.json').write_text(json.dumps(losses))
        report={'trainingMode':'behavior-cloning','steps':0,'samples':len(x),
                'initialLoss':losses[0],'finalLoss':losses[-1]}
        (args.out/'complete.json').write_text(json.dumps(report))
        print(json.dumps(report),flush=True)
    finally:
        env.close()


if __name__=='__main__':
    main()
