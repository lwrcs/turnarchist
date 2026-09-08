"""Bounded real-game throughput benchmark; never trains or changes game timing."""
import argparse
from functools import partial
import json
from pathlib import Path
import time

import numpy as np
import torch
from stable_baselines3.common.vec_env import DummyVecEnv, SubprocVecEnv

from combat_pilot import CombatEnv


def make_env(out):
    torch.set_num_threads(1)
    env=CombatEnv(out, rotate_frames=True)
    env.phase='throughput-benchmark'
    return env


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--envs',type=int,choices=[1,2,4],default=1)
    parser.add_argument('--steps',type=int,default=128)
    args=parser.parse_args()
    if not 1 <= args.steps <= 8192:
        parser.error('Use 1..8192 total decisions for this bounded benchmark')
    args.out.mkdir(parents=True,exist_ok=False)
    start=time.perf_counter()
    factories=[partial(make_env,args.out/f'worker-{i}') for i in range(args.envs)]
    env=(DummyVecEnv(factories) if args.envs==1 else
         SubprocVecEnv(factories,start_method='spawn'))
    try:
        env.seed(321)
        env.reset()
        contracts=env.get_attr('contract')
        if any(c != contracts[0] for c in contracts):
            raise RuntimeError('Game contracts differ between workers')
        ready=time.perf_counter()
        rng=np.random.default_rng(321)
        decisions=0
        episodes=0
        while decisions < args.steps:
            observations,rewards,dones,infos=env.step(rng.integers(5,size=args.envs))
            if not np.isfinite(observations).all() or not np.isfinite(rewards).all():
                raise RuntimeError('Non-finite environment output')
            decisions += args.envs
            episodes += int(dones.sum())
        elapsed=time.perf_counter()-ready
        report={'envs':args.envs,'decisions':decisions,'episodes':episodes,
                'startupSeconds':ready-start,'collectionSeconds':elapsed,
                'decisionsPerSecond':decisions/elapsed,'gameContract':contracts[0],
                'limitation':'Random actions, short sample; timing is not training performance.'}
        (args.out/'complete.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report,indent=2),flush=True)
    finally:
        env.close()


if __name__=='__main__':
    main()
