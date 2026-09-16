"""Build a memory-bounded, action-balanced subset of navigation data.

The datasets are loaded one at a time.  That matters on the training desktop:
two full browser-observation arrays plus a concatenated copy can exceed RAM.
Sampling each source independently also prevents a later DAgger pass from
silently overwhelming the recovery data that taught the policy to explore.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np


CONTRACT_KEYS = ('encoder', 'reward', 'helper', 'gameContract')


def validate_manifests(paths):
    manifests = [json.loads((path / 'manifest.json').read_text()) for path in paths]
    first = manifests[0]
    for path, manifest in zip(paths[1:], manifests[1:]):
        for key in CONTRACT_KEYS:
            if manifest[key] != first[key]:
                raise ValueError(f'Navigation contract mismatch for {path}: {key}')
    return first


def reservoir_indices(seeds, actions, quota, rng):
    """Return up to ``quota`` randomized rows for every seed/action pair."""
    reservoirs = {}
    seen = {}
    for index, (seed, action) in enumerate(zip(seeds, actions)):
        key = (int(seed), int(action))
        count = seen.get(key, 0) + 1
        seen[key] = count
        rows = reservoirs.setdefault(key, [])
        if len(rows) < quota:
            rows.append(index)
        else:
            replacement = int(rng.integers(count))
            if replacement < quota:
                rows[replacement] = index
    return np.asarray([index for rows in reservoirs.values() for index in rows], dtype=np.int64)


def uniform_reservoir_indices(length, quota, rng):
    """Choose a reproducible uniform sample without a second full-size copy."""
    if quota >= length:
        return np.arange(length, dtype=np.int64)
    rows = np.arange(quota, dtype=np.int64)
    for index in range(quota, length):
        replacement = int(rng.integers(index + 1))
        if replacement < quota:
            rows[replacement] = index
    return rows


def collect(paths, quota, seed, source_samples=None):
    rng = np.random.default_rng(seed)
    selected = []
    report = []
    for path in paths:
        with np.load(path / 'demonstrations.npz', allow_pickle=False) as data:
            observations = data['observations']
            actions = data['actions']
            episode_seeds = data['episodeSeeds']
            rotations = data['rotations']
            indices = (uniform_reservoir_indices(len(actions), source_samples[len(report)], rng)
                       if source_samples is not None
                       else reservoir_indices(episode_seeds, actions, quota, rng))
            selected.append((
                observations[indices].copy(), actions[indices].copy(),
                episode_seeds[indices].copy(), rotations[indices].copy(),
            ))
            values, counts = np.unique(actions[indices], return_counts=True)
            report.append({
                'path': str(path), 'sourceSamples': int(len(actions)),
                'selectedSamples': int(len(indices)),
                'selectedActions': dict(zip(map(str, values.tolist()), map(int, counts.tolist()))),
            })
    return tuple(np.concatenate([part[column] for part in selected]) for column in range(4)), report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--samples-per-seed-action', type=int, default=8)
    parser.add_argument('--source-samples', type=int, nargs='+',
                        help='A conservative uniform sample count for each source, preserving source mix.')
    parser.add_argument('--seed', type=int, default=123)
    parser.add_argument('data', type=Path, nargs='+')
    args = parser.parse_args()
    if len(args.data) < 2:
        parser.error('Provide at least two navigation datasets')
    if args.samples_per_seed_action < 1:
        parser.error('--samples-per-seed-action must be positive')
    if args.source_samples and (len(args.source_samples) != len(args.data) or min(args.source_samples) < 1):
        parser.error('--source-samples needs one positive count for every source')
    if args.out.exists():
        parser.error('Output directory already exists')
    manifest = validate_manifests(args.data)
    (observations, actions, episode_seeds, rotations), report = collect(
        args.data, args.samples_per_seed_action, args.seed, args.source_samples,
    )
    args.out.mkdir(parents=True)
    np.savez_compressed(args.out / 'demonstrations.npz', observations=observations,
                        actions=actions, episodeSeeds=episode_seeds, rotations=rotations)
    values, counts = np.unique(actions, return_counts=True)
    source_hashes = {
        str(path): hashlib.sha256((path / 'demonstrations.npz').read_bytes()).hexdigest()
        for path in args.data
    }
    output = {key: manifest[key] for key in CONTRACT_KEYS}
    output.update({
        'trainingSeeds': sorted(set(map(int, episode_seeds))),
        'samples': int(len(actions)),
        'selection': ('Uniform per-source reservoir sampling preserving source mix.'
                      if args.source_samples else
                      'Per-source reservoir sampling balanced by episode seed and local action.'),
        'samplesPerSeedAction': args.samples_per_seed_action,
        'sourceSamplesRequested': args.source_samples,
        'selectionSeed': args.seed,
        'sourceNavigationDatasets': source_hashes,
        'sources': report,
        'selectedActions': dict(zip(map(str, values.tolist()), map(int, counts.tolist()))),
    })
    (args.out / 'manifest.json').write_text(json.dumps(output, indent=2))
    (args.out / 'complete.json').write_text(json.dumps({
        'samples': int(len(actions)), 'selectedActions': output['selectedActions'], 'sources': report,
    }, indent=2))
    print(json.dumps({'samples': int(len(actions)), 'selectedActions': output['selectedActions']}), flush=True)


if __name__ == '__main__':
    main()
