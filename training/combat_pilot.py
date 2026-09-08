"""Small browser-backed PPO pilot. No diagnostic observation enters the policy."""
import argparse
from collections import deque
import functools
import http.server
import json
import pathlib
import subprocess
import threading
import time
from urllib.parse import urlparse

import gymnasium as gym
import numpy as np
from playwright.sync_api import sync_playwright
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback

ROOT = pathlib.Path(__file__).resolve().parents[1]
ACTIONS = [{'type': 'Move', 'direction': d} for d in ('up', 'right', 'down', 'left')] + [{'type': 'Wait'}]
SCENARIOS = ['combat-skull', 'combat-zombie', 'combat-armoredzombie-alert']
TRANSFER = ['combat-bigskull-alert', 'combat-bigzombie-alert']
ENCODER = {'version': 1, 'radius': 6, 'channels': 12, 'frames': 2, 'actions': ACTIONS}
REWARD = {'version': 1, 'clear': 10, 'death': -10, 'health_lost': -3, 'decision': -0.01}
SIZE = 13 * 13 * 12 + 5


def encode(view):
    if view.get('observationMode') != 'player-perception' or view.get('schemaVersion') != 6:
        raise ValueError('Restricted perception v6 required')
    grid = np.zeros((13, 13, 12), dtype=np.float32)
    px, py = view['player']['x'], view['player']['y']
    def cell(x, y):
        x, y = int(x-px+6), int(y-py+6)
        return grid[y, x] if 0 <= x < 13 and 0 <= y < 13 else None
    for tile in view['room']['tiles']:
        c = cell(tile['x'], tile['y'])
        if c is not None:
            c[0] = 1
            c[1] = float(tile.get('solid') is not None)
            c[2] = float(tile.get('solid') is True)
    for ent in view['room']['entities']:
        identified = ent.get('appearance') == 'identified'
        width = int(ent.get('width') or 1) if identified else 1
        height = int(ent.get('height') or 1) if identified else 1
        for dx in range(width):
            for dy in range(height):
                c = cell(ent['x']+dx, ent['y']+dy)
                if c is None:
                    continue
                c[3] = 1  # A visible entity/contact occupies this cell.
                c[4] = float(identified)
                c[5] = float(ent.get('isEnemy') is True or not identified)
                c[6] = float(ent.get('collidable') is True)
                if identified and ent.get('health') is not None:
                    c[7] = 1
                    c[8] = np.clip(ent['health']/10, 0, 1)
                threshold = (ent.get('combat') or {}).get('killDamageThreshold')
                if identified and threshold is not None:
                    c[9] = 1
                    c[10] = np.clip(threshold/10, 0, 1)
    for warning in view['room']['hitWarnings']:
        c = cell(warning['x'], warning['y'])
        if c is not None and warning.get('hostile'):
            c[11] = 1
    weapon = next((i['traits'] for i in view['inventory'] if i and i.get('activeWeapon')), {})
    damage = weapon.get('minimumAttackDamage')
    scalar = [np.clip(view['player']['health']/10, 0, 1), float(damage is not None),
              np.clip((damage or 0)/10, 0, 1), float(weapon.get('attackPattern') == 'adjacent-cardinal'),
              float(np.clip(weapon.get('successfulAttackTurnCost') or 0, 0, 1))]
    return np.concatenate((grid.ravel(), np.asarray(scalar, dtype=np.float32)))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class CombatEnv(gym.Env):
    def __init__(self, out, budget=64):
        self.out = pathlib.Path(out)
        self.out.mkdir(parents=True, exist_ok=True)
        self.action_space = gym.spaces.Discrete(len(ACTIONS))
        self.observation_space = gym.spaces.Box(0, 1, shape=(SIZE*2,), dtype=np.float32)
        self.budget = budget
        self.episode = 0
        self.contract = None
        self.frames = deque(maxlen=2)
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(headless=True, args=['--disable-background-timer-throttling'])
        self.context = self.browser.new_context(viewport={'width': 960, 'height': 720}, service_workers='block')
        port = self.server.server_address[1]
        self.context.route('**/*', lambda route: route.continue_() if urlparse(route.request.url).netloc == f'127.0.0.1:{port}' else route.abort())
        self.page = self.context.new_page()
        self.page.set_default_timeout(60000)
        self.page.on('requestfailed', lambda request: print('REQUEST FAILED:', request.url, request.failure, flush=True))
        self.page.on('console', lambda message: print('BROWSER:', message.text, flush=True) if message.type == 'error' else None)
        self.page.on('pageerror', lambda error: print('GAME ERROR:', str(error), flush=True))
        self.page.on('response', lambda response: print('HTTP ERROR:', response.status, response.url, flush=True) if response.status >= 400 else None)
        self.page.goto(f'http://127.0.0.1:{port}/play.html?agent=1', wait_until='domcontentloaded')
        try:
            self.page.wait_for_function('() => !!window.agent', timeout=120000)
        except Exception:
            self.page.screenshot(path=str(self.out/'startup-failure.png'))
            print('RESOURCE STATUS:', self.page.evaluate('() => performance.getEntriesByType("resource").map(r => [r.name,r.responseStatus])'), flush=True)
            self.close()
            raise

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        scenario = (options or {}).get('scenario', SCENARIOS[self.episode % len(SCENARIOS)])
        game_seed = int(self.np_random.integers(0, 2**31))
        view = self.page.evaluate('''async ([seed, scenario, budget]) => {
            await window.agent.reset(seed, {scenario, maxSteps:budget});
            return window.agent.perceive();
        }''', [game_seed, scenario, self.budget])
        if self.contract is not None and view['contract'] != self.contract:
            raise RuntimeError('Game contract changed during run')
        self.contract = view['contract']
        self.view = view
        self.frames.clear()
        self.frames.extend([encode(view), encode(view)])
        self.trace = []
        self.total_reward = 0
        self.steps = 0
        self.scenario, self.game_seed = scenario, game_seed
        self.episode += 1
        return np.concatenate(self.frames), {}

    def step(self, action):
        if self.view['decision'] != 'world':
            raise RuntimeError('Pilot only supports world decisions; expand action schema before continuing')
        result = self.page.evaluate('''async action => {
            const result = await window.agent.step(action);
            return {view:window.agent.perceive(), terminated:result.terminated,
                    truncated:result.truncated, cleared:result.info.encounterCleared};
        }''', ACTIONS[int(action)])
        next_view = result['view']
        # Only health change and the encounter result supervise reward. Disappearing
        # enemies are not kills: leaving vision cannot earn reward.
        reward = -0.01 - 3*max(0, self.view['player']['health']-next_view['player']['health'])
        dead, clear = result['terminated'], result['cleared']
        reward += -10 if dead else 10 if clear else 0
        self.frames.append(encode(next_view))
        self.trace.append({'action': int(action), 'health': next_view['player']['health'], 'reward': reward})
        self.view = next_view
        self.steps += 1
        self.total_reward += reward
        done = bool(dead or clear)
        truncated = bool(result['truncated'] and not done)
        info = {}
        if done or truncated:
            outcome = 'dead' if dead else 'cleared' if clear else 'budget-incomplete'
            record = {'scenario': self.scenario, 'seed': self.game_seed, 'status': outcome,
                      'steps': self.steps, 'reward': self.total_reward, 'health': next_view['player']['health']}
            info.update(record)
            with (self.out/'episodes.jsonl').open('a') as f:
                f.write(json.dumps(record)+'\n')
            # One latest replay is bounded storage, including failed/incomplete runs.
            replay = self.page.evaluate('() => window.agent.exportReplay()')
            (self.out/'latest-replay.json').write_text(json.dumps(replay))
        return np.concatenate(self.frames), reward, done, truncated, info

    def close(self):
        self.browser.close()
        self.pw.stop()
        self.server.shutdown()
        self.server.server_close()


class Checkpoints(BaseCallback):
    def __init__(self, out):
        super().__init__()
        self.out = out
    def _on_step(self):
        if self.num_timesteps % 256 == 0:
            self.model.save(self.out/'checkpoint-tmp')
            (self.out/'checkpoint-tmp.zip').replace(self.out/'checkpoint.zip')
            (self.out/'progress.json').write_text(json.dumps({'steps': self.num_timesteps, 'time': time.time()}))
        return True


def evaluate(env, policy, scenarios, seed=987, repeats=1):
    records = []
    rng = np.random.default_rng(seed)
    # Episode seeds must not depend on how many random actions previous episodes used.
    plan_rng = np.random.default_rng(seed)
    plan = [(scenario, int(plan_rng.integers(0, 2**31)))
            for _ in range(repeats) for scenario in scenarios]
    for scenario, episode_seed in plan:
        obs, _ = env.reset(seed=episode_seed, options={'scenario': scenario})
        while True:
            action = int(rng.integers(5)) if policy is None else int(policy.predict(obs, deterministic=True)[0])
            obs, _, done, truncated, info = env.step(action)
            if done or truncated:
                records.append(info)
                break
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=pathlib.Path, required=True)
    parser.add_argument('--steps', type=int, default=2048)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--resume', type=pathlib.Path)
    mode.add_argument('--evaluate', type=pathlib.Path)
    parser.add_argument('--eval-repeats', type=int, default=1)
    parser.add_argument('--smoke', action='store_true')
    args = parser.parse_args()
    if args.eval_repeats < 1 or args.eval_repeats > 100 or args.steps < 1:
        parser.error('Use positive steps and 1..100 evaluation repeats')
    if not args.smoke and (args.out/'manifest.json').exists():
        parser.error('Output already contains a run; choose a new directory')
    torch.set_num_threads(4)
    env = CombatEnv(args.out, budget=64)
    try:
        env.reset(seed=123)
        manifest = {'encoder': ENCODER, 'reward': REWARD, 'gameContract': env.contract,
                    'git': subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                    'trainingScenarios': SCENARIOS, 'transferScenarios': TRANSFER,
                    'torch': torch.__version__, 'budget': 64}
        checkpoint = args.resume or args.evaluate
        if checkpoint:
            old = json.loads((checkpoint.parent/'manifest.json').read_text())
            for key in ('encoder', 'reward', 'gameContract'):
                if old[key] != manifest[key]:
                    raise ValueError('Checkpoint incompatible: '+key)
        (args.out/'manifest.json').write_text(json.dumps(manifest, indent=2))
        if args.smoke:
            for action in [1, 2, 3, 0]:
                _, _, done, truncated, _ = env.step(action)
                if done or truncated:
                    env.reset(seed=123)
            print('Real game reset/step/restricted observation smoke passed', flush=True)
            return
        if args.evaluate:
            model = PPO.load(args.evaluate, env=env, device='cpu')
            before = model.num_timesteps
            scenarios = SCENARIOS + TRANSFER
            random_results = evaluate(env, None, scenarios, repeats=args.eval_repeats)
            results = evaluate(env, model, scenarios, repeats=args.eval_repeats)
            assert model.num_timesteps == before
            (args.out/'random-evaluation.json').write_text(json.dumps(random_results, indent=2))
            (args.out/'evaluation.json').write_text(json.dumps(results, indent=2))
            (args.out/'complete.json').write_text(json.dumps({'mode':'evaluation-only', 'checkpoint':str(args.evaluate), 'trainingSteps':before, 'time':time.time()}))
            print('Checkpoint evaluation completed without learning updates', flush=True)
            return
        baseline = evaluate(env, None, SCENARIOS)
        (args.out/'random-evaluation.json').write_text(json.dumps(baseline, indent=2))
        model = PPO.load(args.resume, env=env, device='cpu') if args.resume else PPO(
            'MlpPolicy', env, n_steps=256, batch_size=64, n_epochs=4,
            learning_rate=3e-4, gamma=0.99, seed=123, device='cpu',
            policy_kwargs={'net_arch':[128,128]}, verbose=1)
        # CPU is deliberate for this small MLP; GPU availability was tested separately.
        model.learn(total_timesteps=args.steps, reset_num_timesteps=not bool(args.resume), callback=Checkpoints(args.out))
        model.save(args.out/'final')
        results = evaluate(env, model, SCENARIOS + TRANSFER)
        (args.out/'evaluation.json').write_text(json.dumps(results, indent=2))
        (args.out/'complete.json').write_text(json.dumps({'steps':model.num_timesteps, 'time':time.time()}))
        print('Pilot completed', flush=True)
    finally:
        env.close()

if __name__ == '__main__':
    main()
