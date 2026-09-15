"""Merge compatible navigation demonstration datasets without losing provenance."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from dungeon_imitation import load_navigation_provenance


def digest(observation):
    return hashlib.sha256(observation.tobytes()).digest()


def merge(paths):
    loaded=[(*load_navigation_provenance(path),path) for path in paths]
    first_manifest=loaded[0][4]
    contract_keys=('encoder','reward','helper','gameContract')
    for *_,manifest,path in loaded[1:]:
        for key in contract_keys:
            if manifest[key]!=first_manifest[key]:
                raise ValueError(f'Navigation contract mismatch for {path}: {key}')
    labels={}
    for observations,actions,*_ in loaded:
        for observation,action in zip(observations,actions):
            labels.setdefault(digest(observation),set()).add(int(action))
    conflicts=sum(len(values)>1 for values in labels.values())
    if conflicts:
        raise ValueError(f'Cannot merge {conflicts} observations with conflicting action labels')
    observations=np.concatenate([row[0] for row in loaded])
    actions=np.concatenate([row[1] for row in loaded])
    seeds=np.concatenate([row[2] for row in loaded])
    rotations=np.concatenate([row[3] for row in loaded])
    return observations,actions,seeds,rotations,first_manifest,{
        'sources':[str(row[5]) for row in loaded],
        'sourceSamples':[int(len(row[1])) for row in loaded],
        'uniqueObservations':int(len(labels)),
        'duplicateRows':int(len(actions)-len(labels)),
        'conflictingLabels':conflicts,
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('data',type=Path,nargs='+')
    args=parser.parse_args()
    if len(args.data)<2: parser.error('Provide at least two datasets')
    if args.out.exists(): parser.error('Output directory already exists')
    observations,actions,seeds,rotations,manifest,report=merge(args.data)
    args.out.mkdir(parents=True)
    np.savez_compressed(args.out/'demonstrations.npz',observations=observations,
                        actions=actions,episodeSeeds=seeds,rotations=rotations)
    source_hashes={str(path):hashlib.sha256((path/'demonstrations.npz').read_bytes()).hexdigest()
                   for path in args.data}
    merged={key:manifest[key] for key in ('encoder','reward','helper','gameContract')}
    merged.update({'trainingSeeds':sorted(set(map(int,seeds))),'samples':int(len(actions)),
                   'selection':'Provenance-preserving merge of compatible DAgger navigation datasets.',
                   'mergedNavigationDatasets':source_hashes,'merge':report})
    (args.out/'manifest.json').write_text(json.dumps(merged,indent=2))
    (args.out/'complete.json').write_text(json.dumps({'samples':int(len(actions)),**report},indent=2))
    print(json.dumps({'samples':int(len(actions)),**report}),flush=True)


if __name__=='__main__': main()
