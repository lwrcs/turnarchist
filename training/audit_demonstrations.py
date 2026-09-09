"""Measure retention of teacher choices; this is not a gameplay evaluation."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from stable_baselines3 import PPO

from imitate import load_demonstrations
from combat_pilot import ACTIONS


def summarize_choices(probabilities, labels):
    probabilities=np.asarray(probabilities)
    labels=np.asarray(labels)
    if probabilities.shape != (len(labels),len(ACTIONS)) or not len(labels):
        raise ValueError('Expected nonempty pilot-action probabilities and aligned labels')
    if labels.dtype.kind not in 'iu' or np.any((labels<0)|(labels>=len(ACTIONS))):
        raise ValueError('Invalid teacher action labels')
    if not np.isfinite(probabilities).all() or np.any(probabilities<0) or not np.allclose(probabilities.sum(axis=1),1):
        raise ValueError('Invalid action probabilities')
    selected=probabilities[np.arange(len(labels)),labels]
    agreed=probabilities.argmax(axis=1)==labels
    return {'samples':len(labels),'teacherActionAgreement':float(agreed.mean()),
            'meanTeacherActionProbability':float(selected.mean()),
            'meanTeacherNegativeLogLikelihood':float(-np.log(np.maximum(selected,1e-30)).mean()),
            'disagreementIndices':np.flatnonzero(~agreed).tolist()}


def audit(checkpoint, data):
    checkpoint,data=Path(checkpoint),Path(data)
    observations,labels,dataset=load_demonstrations(data)
    manifest=json.loads((checkpoint.parent/'manifest.json').read_text())
    for key in ('encoder','gameContract'):
        if manifest[key]!=dataset[key]:
            raise ValueError('Demonstration audit incompatible: '+key)
    torch.set_num_threads(2)
    model=PPO.load(checkpoint,device='cpu')
    model.policy.set_training_mode(False)
    with torch.no_grad():
        probabilities=np.concatenate([
            model.policy.get_distribution(torch.as_tensor(batch)).distribution.probs.cpu().numpy()
            for batch in np.array_split(observations,max(1,(len(observations)+255)//256))])
    # Deduplicate observation/action pairs so repeated views/seeds do not inflate
    # the weight of common examples. Conflicting labels remain separate pairs.
    _,indices=np.unique(np.column_stack((observations,labels)),axis=0,return_index=True)
    outcomes=json.loads((data/'outcomes.json').read_text())
    with np.load(data/'demonstrations.npz',allow_pickle=False) as raw:
        episode_ids=raw['episode_ids']
    accepted=np.asarray([r['status']=='cleared' and r['health']>=r['initialHealth'] for r in outcomes])
    retained_indices=np.flatnonzero(accepted[episode_ids])
    disagreements=[]
    for index in np.flatnonzero(probabilities.argmax(axis=1)!=labels):
        original=int(retained_indices[index])
        episode=int(episode_ids[original])
        row=outcomes[episode]
        disagreements.append({'datasetRow':original,'episode':episode,'scenario':row['scenario'],
                              'rotation':row.get('rotation'),
                              'decision':int((episode_ids[:original]==episode).sum())+1,
                              'teacherAction':int(labels[index]),
                              'policyAction':int(probabilities[index].argmax()),
                              'teacherActionProbability':float(probabilities[index,labels[index]])})
    return {'checkpoint':str(checkpoint),'checkpointSha256':hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
            'dataset':str(data),'datasetSha256':hashlib.sha256((data/'demonstrations.npz').read_bytes()).hexdigest(),
            'gameContract':manifest['gameContract'],'trainingSteps':model.num_timesteps,
            'allSamples':summarize_choices(probabilities,labels),
            'uniqueObservationActionPairs':summarize_choices(probabilities[indices],labels[indices]),
            'disagreements':disagreements,
            'limitation':'Agreement with retained teacher examples only. Disagreement can be a valid alternative action; this does not measure gameplay success or generalization.'}


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--checkpoint',type=Path,required=True)
    parser.add_argument('--data',type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(audit(args.checkpoint,args.data),indent=2))
