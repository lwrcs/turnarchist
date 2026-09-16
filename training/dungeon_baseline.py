"""Evaluate and collect the restricted-perception programmed dungeon baseline.

This is an evidence step before treating the baseline's combat decisions as
training labels.  It uses the same browser-backed DungeonEnv as learned-policy
evaluation and records the controller separately from learned actions.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from combat_pilot import ACTIONS, ROOT, encode, rotate_features
from dungeon_pilot import DungeonEnv, ENCODER, HELPER, REWARD, seed_plan, tactical_view


def local_action(action, rotation):
    if action.get('type') != 'Move' or action.get('direction') not in [row['direction'] for row in ACTIONS]:
        return None
    return ([row['direction'] for row in ACTIONS].index(action['direction']) - rotation) % len(ACTIONS)


def outcome(env, status, decisions):
    return {
        'phase': env.phase, 'seed': env.game_seed, 'episodeSeed': env.episode_seed,
        'rotation': env.rotation, 'status': status, 'steps': decisions,
        'gameActions': env.game_actions, 'helperActions': env.assisted_actions,
        'navigatorActions': env.navigator_actions, 'worldTurns': env.world_turns,
        'roomsVisited': len(env.memory.rooms), 'positionsVisited': len(env.memory.visits),
        'maxDepth': env.memory.max_depth, 'initialDepth': env.memory.initial_depth,
        'health': env.view['player']['health'], 'healthLost': env.health_lost,
        'rejectedActions': env.rejected_actions,
        'maxConsecutiveRejected': env.max_consecutive_rejected,
        'trace': list(env.trace),
    }


def run_episode(env, seed, episode_id, collect):
    env.reset(options={'episodeSeed': seed})
    if not env.page.evaluate('() => typeof AgentBaseline !== "undefined"'):
        env.page.add_script_tag(path=str(ROOT / 'agent-baseline.js'))
    env.page.evaluate('() => { window.dungeonBaseline = new AgentBaseline.Policy(); }')
    initial_health = env.view['player']['health']
    decisions = 0
    while decisions < env.budget:
        before = env.view
        observation = env.observation().copy()
        action = env.page.evaluate('(view) => window.dungeonBaseline.choose(view)', before)
        if action is None:
            row = outcome(env, 'baseline-no-action', decisions)
            row['initialHealth'] = initial_health
            return row
        local = local_action(action, env.rotation)
        if local is not None:
            collect['observations'].append(observation)
            collect['actions'].append(local)
            collect['episode_ids'].append(episode_id)
            collect['planner_active'].append(bool(env.plan.get('active')))
            collect['tactical_state'].append(tactical_view(before))
        reward, dead, truncated = env.execute(action, 'baseline')
        env.total_reward += reward
        env.frames.append(rotate_features(encode(env.view), env.rotation))
        decisions += 1
        env.page.evaluate('''([before, action, after, turnDelta]) =>
            window.dungeonBaseline.feedback(before, action, after, {turnDelta})''',
            [before, action, env.view, env.trace[-1]['turnDelta']])
        if dead or truncated:
            row = outcome(env, 'dead' if dead else 'budget-incomplete', decisions)
            row['initialHealth'] = initial_health
            return row
    row = outcome(env, 'budget-incomplete', decisions)
    row['initialHealth'] = initial_health
    return row


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--seeds', type=int, default=8)
    parser.add_argument('--seed-start', type=int, default=0)
    parser.add_argument('--budget', type=int, default=2048)
    parser.add_argument('--pool', choices=['training', 'held-out'], default='held-out')
    args = parser.parse_args()
    pool_size = 64 if args.pool == 'training' else 32
    if not 1 <= args.seeds <= pool_size or not 0 <= args.seed_start <= pool_size - args.seeds:
        parser.error('Seed slice exceeds the declared pool')
    if not 1 <= args.budget <= 10000:
        parser.error('Budget must be in 1..10000')
    args.out.mkdir(parents=True, exist_ok=False)
    seeds = seed_plan(args.pool, pool_size)[args.seed_start:args.seed_start + args.seeds]
    env = DungeonEnv(args.out / 'evaluation', budget=args.budget)
    env.phase = 'dungeon-baseline-evaluation'
    collect = {'observations': [], 'actions': [], 'episode_ids': [],
               'planner_active': [], 'tactical_state': []}
    try:
        env.page.add_script_tag(path=str(ROOT / 'agent-baseline.js'))
        rows = [run_episode(env, seed, index, collect) for index, seed in enumerate(seeds)]
        np.savez_compressed(args.out / 'demonstrations.npz',
                            observations=np.asarray(collect['observations'], dtype=np.float32),
                            actions=np.asarray(collect['actions'], dtype=np.int64),
                            episode_ids=np.asarray(collect['episode_ids'], dtype=np.int64),
                            planner_active=np.asarray(collect['planner_active'], dtype=np.bool_),
                            tactical_state=np.asarray(collect['tactical_state'], dtype=np.bool_))
        (args.out / 'outcomes.json').write_text(json.dumps(rows, indent=2))
        manifest = {
            'controller': 'programmed-baseline',
            'teacherVersion': env.page.evaluate('() => AgentBaseline.Policy.version'),
            'teacherSha256': hashlib.sha256((ROOT / 'agent-baseline.js').read_bytes()).hexdigest(),
            'seedPool': args.pool, 'trainingSeeds': seeds, 'episodeSeeds': seeds, 'budget': args.budget,
            'encoder': ENCODER, 'reward': REWARD, 'helper': HELPER, 'gameContract': env.contract,
            'samples': len(collect['actions']), 'episodes': len(rows),
            'labelBoundary': 'Directional actions selected through restricted player perception; sample-level planner and tactical-state flags distinguish runtime responsibility.',
        }
        (args.out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
        (args.out / 'complete.json').write_text(json.dumps({
            'episodes': len(rows), 'samples': len(collect['actions']),
            'cleared': sum(row['status'] not in {'dead', 'budget-incomplete', 'baseline-no-action'} for row in rows),
            'dead': sum(row['status'] == 'dead' for row in rows),
        }, indent=2))
        print(json.dumps({'episodes': len(rows), 'samples': len(collect['actions']),
                          'dead': sum(row['status'] == 'dead' for row in rows)}), flush=True)
    finally:
        env.close()


if __name__ == '__main__':
    main()
