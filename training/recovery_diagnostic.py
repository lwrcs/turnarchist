"""Offline recovery learnability probe. Never saves or promotes model weights."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.logger import configure as logger
from dungeon_imitation import load_navigation
from imitate import load_demonstrations
from dungeon_pilot import ENCODER, REWARD, HELPER, OBS_SIZE
from rehearsal import Rehearsal


def episode_groups(recoveries, count):
    groups=[]
    for row in recoveries:
        if not isinstance(row['samples'],int) or row['samples']<0:
            raise ValueError('Invalid recovery sample count')
        groups.extend([row['episodeSeed']]*row['samples'])
    if len(groups)!=count or len(set(groups))<2:
        raise ValueError('Recovery rows must match and span multiple episodes')
    return np.asarray(groups,dtype=np.int64)


def metrics(model,x,y):
    with torch.no_grad():
        distribution=model.policy.get_distribution(torch.as_tensor(x,device=model.device))
        logp=distribution.log_prob(torch.as_tensor(y,device=model.device))
        return {'samples':len(y),'accuracy':float((distribution.distribution.probs.argmax(1).cpu().numpy()==y).mean()),
                'crossEntropy':float(-logp.mean()),'labelProbability':float(logp.exp().mean())}


def run(args):
    args.out.mkdir(exist_ok=False,parents=True)
    torch.set_num_threads(4)
    rx,ry,recovery=load_navigation(args.recovery)
    nx,ny,nav=load_navigation(args.navigation)
    cx,cy,combat=load_demonstrations(args.combat)
    source=json.loads((args.model.parent/'manifest.json').read_text())
    if not recovery.get('recovery'): raise ValueError('Not a recovery dataset')
    if any(m['gameContract']!=source['gameContract'] for m in [recovery,nav,combat]):
        raise ValueError('Game contract mismatch')
    for key,value in [('encoder',ENCODER),('reward',REWARD),('helper',HELPER)]:
        if source[key]!=value: raise ValueError('Source contract mismatch: '+key)
    cx=np.pad(cx,((0,0),(0,OBS_SIZE-cx.shape[1])))
    groups=episode_groups(json.loads((args.recovery/'recoveries.json').read_text()),len(ry))
    result={'source':str(args.model),'sourceSha256':hashlib.sha256(args.model.read_bytes()).hexdigest(),
            'method':'leave one recovery episode out; in-memory SGD rehearsal only; fixed update checkpoints',
            'limitation':'Three-episode demonstration diagnostic, not unassisted gameplay or combat retention.',
            'folds':[]}
    for episode in sorted(set(groups.tolist())):
        train=groups!=episode; test=~train
        model=PPO.load(args.model,device='cpu'); model.set_logger(logger(None,[]))
        callback=Rehearsal([(nx,ny),(cx,cy)],recovery=(rx[train],ry[train]))
        callback.init_callback(model); callback.on_training_start({}, {})
        fold={'heldOutEpisode':episode,'measurements':[]}
        for step in range(args.updates+1):
            if step in {0,100,500,args.updates}:
                row={'updates':step,'trainRecovery':metrics(model,rx[train],ry[train]),
                     'heldOutRecovery':metrics(model,rx[test],ry[test]),
                     'navigation':metrics(model,nx,ny),'combat':metrics(model,cx,cy)}
                fold['measurements'].append(row)
                print(json.dumps({'episode':episode,**row}),flush=True)
            if step<args.updates: callback.update()
        result['folds'].append(fold)
        (args.out/'report.json').write_text(json.dumps(result,indent=2))
    (args.out/'complete.json').write_text(json.dumps({'folds':len(result['folds']),'updatesPerFold':args.updates}))


if __name__=='__main__':
    p=argparse.ArgumentParser()
    for name in ['model','navigation','combat','recovery','out']: p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--updates',type=int,choices=[100,500,2000],default=2000)
    run(p.parse_args())
