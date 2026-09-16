"""Curate productive programmed-baseline runs into a leakage-safe dataset.

The baseline is intentionally recorded as a teacher, not treated as proof that
the learned policy can complete a dungeon.  Long no-risk room loops are useful
diagnostics, but are harmful labels: they massively overrepresent two opposing
directions.  This tool keeps only episodes that reached a deeper floor or
actually explored a substantial part of the dungeon.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from dungeon_pilot import ENCODER, HELPER, REWARD, seed_plan


def useful(outcome):
    """Keep progress; reject bounded safe loops regardless of their length."""
    return outcome['maxDepth'] > outcome['initialDepth'] or outcome['roomsVisited'] >= 6


def source_rows(paths):
    for path in paths:
        manifest = json.loads((path / 'manifest.json').read_text())
        if manifest.get('controller') != 'programmed-baseline' or manifest.get('seedPool') != 'training':
            raise ValueError(f'{path} is not a training-only baseline collection')
        outcomes = json.loads((path / 'outcomes.json').read_text())
        with np.load(path / 'demonstrations.npz', allow_pickle=False) as data:
            observations = data['observations']
            actions = data['actions']
            episode_ids = data['episode_ids']
        if observations.ndim != 2 or actions.shape != (len(observations),) or episode_ids.shape != actions.shape:
            raise ValueError(f'{path} has malformed demonstrations')
        if not np.isfinite(observations).all() or np.any((observations < 0) | (observations > 1)):
            raise ValueError(f'{path} has invalid observations')
        if np.any((actions < 0) | (actions >= 4)) or np.any((episode_ids < 0) | (episode_ids >= len(outcomes))):
            raise ValueError(f'{path} has invalid action provenance')
        for episode_id, outcome in enumerate(outcomes):
            # `DungeonEnv.episode_seed` is the declared pool seed, whereas the
            # browser game seed is drawn from it.  Preserve the former because
            # it defines the training/held-out split.
            episode_seed = int(outcome['episodeSeed'])
            if episode_seed not in set(seed_plan('training', 64)):
                raise ValueError(f'{path} episode is outside the training pool')
            mask = episode_ids == episode_id
            yield path, manifest, outcome, observations[mask], actions[mask], episode_seed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, nargs='+', required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--contract-manifest', type=Path, required=True,
                        help='Current compatible dungeon checkpoint manifest')
    args = parser.parse_args()
    if args.out.exists():
        parser.error('Output already exists')
    chosen = [row for row in source_rows(args.sources) if useful(row[2])]
    if len(chosen) < 2:
        raise ValueError('Need meaningful trajectories from at least two training seeds')
    seeds = [row[5] for row in chosen]
    if len(seeds) != len(set(seeds)):
        raise ValueError('A selected episode seed appears more than once')
    observations = np.concatenate([row[3] for row in chosen]).astype(np.float32)
    actions = np.concatenate([row[4] for row in chosen]).astype(np.int64)
    episode_seeds = np.concatenate([np.full(len(row[4]), row[5], dtype=np.uint32) for row in chosen])
    rotations = np.concatenate([np.full(len(row[4]), int(row[2]['rotation']), dtype=np.uint8) for row in chosen])
    if len(observations) == 0:
        raise ValueError('No directional labels in selected trajectories')
    args.out.mkdir(parents=True)
    np.savez_compressed(args.out / 'demonstrations.npz', observations=observations, actions=actions,
                        episodeSeeds=episode_seeds, rotations=rotations)
    reference = json.loads(args.contract_manifest.read_text())
    if reference.get('encoder') != ENCODER or reference.get('helper') != HELPER or reference.get('reward') != REWARD:
        raise ValueError('Contract reference does not match the current dungeon encoder')
    if not reference.get('gameContract'):
        raise ValueError('Contract reference lacks a browser game contract')
    manifest = {
        'encoder': ENCODER, 'reward': REWARD, 'helper': HELPER,
        'gameContract': reference['gameContract'],
        'trainingSeeds': seeds, 'samples': len(actions),
        'selection': 'Kept only training-pool baseline episodes that reached deeper than their starting floor or visited at least six rooms. Excluded bounded safe loops even when their raw action count was large.',
        'teacher': 'programmed-baseline',
        'sourceArtifacts': [{'path': str(row[0]), 'sha256': hashlib.sha256((row[0] / 'demonstrations.npz').read_bytes()).hexdigest()} for row in chosen],
        'episodeOutcomes': [{key: row[2][key] for key in ('episodeSeed', 'status', 'roomsVisited', 'positionsVisited', 'maxDepth', 'initialDepth', 'health', 'healthLost', 'steps')} for row in chosen],
        'contractReference': str(args.contract_manifest),
        'contractLimitation': 'Older source collections predate contract serialization; this dataset pins the matching current checkpoint contract and preserves all source hashes.',
    }
    (args.out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    (args.out / 'complete.json').write_text(json.dumps({
        'episodes': len(chosen), 'samples': len(actions),
        'actionCounts': np.bincount(actions, minlength=4).tolist(),
        'uniqueObservations': int(len(np.unique(observations, axis=0))),
    }, indent=2))
    print(json.dumps(json.loads((args.out / 'complete.json').read_text())), flush=True)


if __name__ == '__main__':
    main()
