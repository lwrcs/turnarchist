"""Small browser-backed PPO pilot. No diagnostic observation enters the policy."""
import argparse
from collections import deque
import functools
import hashlib
import http.server
import json
import math
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
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import SubprocVecEnv

ROOT = pathlib.Path(__file__).resolve().parents[1]
ACTIONS = [{'type': 'Move', 'direction': d} for d in ('up', 'right', 'down', 'left')]
ACTION_SCHEMA = 5
SCENARIOS = ['combat-skull', 'combat-zombie', 'combat-armoredzombie-alert']
TRANSFER = ['combat-bigskull-alert', 'combat-bigzombie-alert']
CURRICULA = {'starter': SCENARIOS,
             'forward': SCENARIOS + ['combat-armoredskull-alert'] + TRANSFER}
HELD_OUT = {'starter': TRANSFER,
            'forward': ['combat-armoredskull','combat-armoredzombie','combat-bigskull','combat-bigzombie']}
CURRICULA['open-combat'] = CURRICULA['forward'] + HELD_OUT['forward']
HELD_OUT['open-combat'] = ['combat-giant-pocket','combat-skull-choke']
CURRICULA['terrain-combat'] = CURRICULA['open-combat'] + HELD_OUT['open-combat']
HELD_OUT['terrain-combat'] = ['combat-giant-clutter','combat-armored-clutter']
GRID=25
CENTER=12
SPAWN_TYPES=('pawn','crab','frog','zombie','skull','energywizard','charge','rook','bishop','armoredzombie','bigskull','queen','knight','bigknight','firewizard','armoredskull','mummy','spider','bigfrog','beetle','king','boltcaster','earthwizard','chessknight','giantfrog','worm')
TRAIT_START=29+len(SPAWN_TYPES)+1
ITEM_CATEGORIES=('equippable','usable','use-on','weapon','armor','shield')
ROOM_TYPES=('START','DUNGEON','BOSS','BIGDUNGEON','TREASURE','FOUNTAIN','COFFIN','GRASS','PUZZLE','KEYROOM','CHESSBOARD','MAZE','CORRIDOR','SPIKECORRIDOR','UPLADDER','DOWNLADDER','SHOP','BIGCAVE','CAVE','SPAWNER','ROPEHOLE','ROPECAVE','TUTORIAL','GRAVEYARD','FOREST','ROPEUP','GEMCAVE')
# Entity semantics (6), ground categories (6), inventory categories (6),
# terrain memory (1), depth known/value (2), environments (16), room types (+unknown).
CONTEXT_START=TRAIT_START+19
CHANNELS=CONTEXT_START+2+16+len(ROOM_TYPES)+1
ENCODER = {'version': 8, 'radius': CENTER, 'channels': CHANNELS, 'frames': 2, 'actions': ACTIONS,
           'itemCategories':list(ITEM_CATEGORIES),'roomTypes':list(ROOM_TYPES),
           'memory':'recognized contacts and terrain; hidden health/facing unknown',
           'perceptionSchema':10,'spawnerTypes':list(SPAWN_TYPES), 'contacts':'observed displacement and elapsed decisions',
           'view':'25x19 rectangle padded to 25x25 for rotation'}
ROTATED_ENCODER = {**ENCODER,'version':9,'coordinateRotation':'random-quarter-turn-per-episode'}
REWARD = {'version': 1, 'clear': 10, 'death': -10, 'health_lost': -3, 'decision': -0.01}
SIZE = GRID * GRID * CHANNELS + 5
BROWSER_RECYCLE_EPISODES = 64


def optimization_overrides(learning_rate=None, entropy_coefficient=None, target_kl=None):
    values={'learning_rate':learning_rate,'ent_coef':entropy_coefficient,'target_kl':target_kl}
    for name,value in values.items():
        if value is not None and (not math.isfinite(value) or value<0 or (name!='ent_coef' and value==0)):
            raise ValueError('Invalid optimization setting: '+name)
    return {name:value for name,value in values.items() if value is not None}


def visible_rooms(view):
    return [*view.get('visibleRooms',[]),view['room']]


def encode(view):
    if view.get('observationMode') != 'player-perception' or view.get('schemaVersion') != 10:
        raise ValueError('Restricted perception v10 required')
    grid = np.zeros((GRID, GRID, CHANNELS), dtype=np.float32)
    px, py = view['player']['x'], view['player']['y']
    def cell(x, y):
        x, y = int(x-px+CENTER), int(y-py+CENTER)
        return grid[y, x] if 0 <= x < GRID and 0 <= y < GRID else None
    rooms=visible_rooms(view)
    for tile in [t for room in rooms for t in room['tiles']]:
        c = cell(tile['x'], tile['y'])
        if c is not None:
            c[0] = 1
            c[1] = float(tile.get('solid') is not None)
            c[2] = float(tile.get('solid') is True)
    for tile in view['room']['tiles']:
        c=cell(tile['x'],tile['y'])
        if c is not None:c[28]=1
    for ent in [e for room in rooms for e in room['entities']]:
        identified = ent.get('appearance') == 'identified'
        width = int(ent.get('width') or 1) if identified else 1
        height = int(ent.get('height') or 1) if identified else 1
        for dx in range(width):
            for dy in range(height):
                c = cell(ent['x']+dx, ent['y']+dy)
                if c is None:
                    continue
                # Current-room contacts take precedence at shared boundary coordinates.
                c[3:11]=0;c[12:23]=0;c[27]=0;c[29:TRAIT_START+6]=0
                c[3] = 1  # A visible entity/contact occupies this cell.
                c[4] = float(identified)
                c[TRAIT_START:TRAIT_START+6]=[
                    ent.get('knowledge')=='remembered',
                    identified and ent.get('forwardOnlyAttack') is not None,
                    identified and ent.get('forwardOnlyAttack') is True,
                    identified and ent.get('isBoss') is not None,
                    identified and ent.get('isBoss') is True,
                    identified and ent.get('knowledge')!='remembered']
                c[5] = float(identified and ent.get('isEnemy') is True)
                c[6] = float(identified and ent.get('collidable') is True)
                if identified and ent.get('health') is not None:
                    c[7] = 1
                    c[8] = np.clip(ent['health']/10, 0, 1)
                threshold = (ent.get('combat') or {}).get('killDamageThreshold')
                if identified and threshold is not None:
                    c[9] = 1
                    c[10] = np.clip(threshold/10, 0, 1)
                if identified:
                    c[12:16]=[ent.get(k) is True for k in ('pushable','chainPushable','destroyable','interactable')]
                    facing=ent.get('facing')
                    if facing:c[16:19]=[1,(facing['dx']+1)/2,(facing['dy']+1)/2]
                    spawner=ent.get('spawner')
                    if spawner:
                        c[27]=1
                        kind=spawner.get('enemyType');index=SPAWN_TYPES.index(kind) if kind in SPAWN_TYPES else len(SPAWN_TYPES)
                        c[29+index]=1
                tracking=ent.get('tracking')
                if tracking:c[19:23]=[1,np.clip(tracking['dx']/GRID/2+.5,0,1),np.clip(tracking['dy']/GRID/2+.5,0,1),min(tracking['stepsSinceSeen']/8,1)]
    for room in rooms:
        context=room.get('context') or {}
        for tile in room['tiles']:
            c=cell(tile['x'],tile['y'])
            if c is None:continue
            c[TRAIT_START+18:]=0
            c[TRAIT_START+18]=tile.get('knowledge')=='remembered'
            depth=context.get('depth')
            if depth is not None:c[CONTEXT_START:CONTEXT_START+2]=[1,np.clip((depth+10)/100,0,1)]
            environment=context.get('environment')
            if environment is not None:c[CONTEXT_START+2+(environment if isinstance(environment,int) and 0<=environment<15 else 15)]=1
            kind=context.get('roomType')
            if kind is not None:c[CONTEXT_START+18+(ROOM_TYPES.index(kind) if kind in ROOM_TYPES else len(ROOM_TYPES))]=1
        for hazard in room.get('hazards',[]):
            c=cell(hazard['x'],hazard['y'])
            if c is not None and hazard.get('kind')=='enemy-spawn':c[23:25]=[1,np.clip(hazard['damage']/10,0,1)]
        for item in room.get('items',[]):
            c=cell(item['x'],item['y'])
            if c is not None:
                c[25:27]=[1,item.get('appearance')=='identified']
                if item.get('appearance')=='identified':
                    c[TRAIT_START+6:TRAIT_START+12]=np.maximum(c[TRAIT_START+6:TRAIT_START+12],[kind in item.get('categories',[]) for kind in ITEM_CATEGORIES])
    player_cell=cell(px,py)
    for item in view['inventory']:
        if item:
            player_cell[TRAIT_START+12:TRAIT_START+18]=np.maximum(player_cell[TRAIT_START+12:TRAIT_START+18],[kind in item.get('categories',[]) for kind in ITEM_CATEGORIES])
    for warning in [w for room in rooms for w in room['hitWarnings']]:
        c = cell(warning['x'], warning['y'])
        if c is not None and warning.get('hostile') and warning.get('dangerous', True):
            c[11] = 1
    weapon = next((i['traits'] for i in view['inventory'] if i and i.get('activeWeapon')), {})
    damage = weapon.get('minimumAttackDamage')
    scalar = [np.clip(view['player']['health']/10, 0, 1), float(damage is not None),
              np.clip((damage or 0)/10, 0, 1), float(weapon.get('attackPattern') == 'adjacent-cardinal'),
              float(np.clip(weapon.get('successfulAttackTurnCost') or 0, 0, 1))]
    return np.concatenate((grid.ravel(), np.asarray(scalar, dtype=np.float32)))


def rotate_features(features, turns):
    grid = np.rot90(features[:-5].reshape(GRID, GRID, CHANNELS), turns, axes=(0,1)).copy()
    for known,x,y in [(16,17,18),(19,20,21)]:
        mask=grid[:,:,known]>0
        for _ in range(turns%4):
            old_x=grid[:,:,x].copy();grid[:,:,x][mask]=grid[:,:,y][mask];grid[:,:,y][mask]=1-old_x[mask]
    return np.concatenate((grid.ravel(), features[-5:]))


def world_action(action, turns):
    if int(action)!=action or not 0 <= int(action) < len(ACTIONS):
        raise ValueError('Unsupported pilot action; unrestricted Wait is not gameplay')
    return (int(action) + turns) % 4


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class CombatEnv(gym.Env):
    def __init__(self, out, budget=64, rotate_frames=False, scenarios=None):
        self.out = pathlib.Path(out)
        self.out.mkdir(parents=True, exist_ok=True)
        self.action_space = gym.spaces.Discrete(len(ACTIONS))
        self.observation_space = gym.spaces.Box(0, 1, shape=(SIZE*2,), dtype=np.float32)
        self.budget = budget
        self.rotate_frames = rotate_frames
        self.rotation = 0
        self.episode = 0
        self.phase = 'unassigned'
        self.scenarios = list(SCENARIOS if scenarios is None else scenarios)
        self.contract = None
        self.frames = deque(maxlen=2)
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(headless=True, args=['--disable-background-timer-throttling'])
        self._open_game_page()

    def _open_game_page(self):
        """Discard accumulated game/browser state only between complete episodes."""
        if getattr(self,'context',None) is not None:
            self.context.close()
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
        if self.episode and self.episode % BROWSER_RECYCLE_EPISODES == 0:
            self._open_game_page()
        super().reset(seed=seed)
        scenario = (options or {}).get('scenario', self.scenarios[self.episode % len(self.scenarios)])
        self.rotation = int(self.np_random.integers(4)) if self.rotate_frames else 0
        game_seed = int(self.np_random.integers(0, 2**31))
        if 'rotation' in (options or {}):
            rotation = options['rotation']
            if not self.rotate_frames or rotation not in range(4):
                raise ValueError('Explicit rotation requires rotated frames and a quarter-turn in 0..3')
            self.rotation = int(rotation)
        view = self.page.evaluate('''async ([seed, scenario, budget]) => {
            await window.agent.reset(seed, {scenario, maxSteps:budget});
            return window.agent.perceive();
        }''', [game_seed, scenario, self.budget])
        if view['contract'].get('actionSchemaVersion') != ACTION_SCHEMA:
            raise RuntimeError(
                f'Agent action schema {ACTION_SCHEMA} required; rebuild the game and trainer from the same revision'
            )
        if self.contract is not None and view['contract'] != self.contract:
            raise RuntimeError('Game contract changed during run')
        self.contract = view['contract']
        self.view = view
        self.initial_health = view['player']['health']
        self.frames.clear()
        self.frames.extend([rotate_features(encode(view), self.rotation)] * 2)
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
                    truncated:result.truncated, cleared:result.info.encounterCleared,
                    recorded:result.info.recorded, turnDelta:result.info.turnDelta};
        }''', ACTIONS[world_action(action, self.rotation)])
        next_view = result['view']
        # Only health change and the encounter result supervise reward. Disappearing
        # enemies are not kills: leaving vision cannot earn reward.
        reward = -0.01 - 3*max(0, self.view['player']['health']-next_view['player']['health'])
        dead, clear = result['terminated'], result['cleared']
        reward += -10 if dead else 10 if clear else 0
        self.frames.append(rotate_features(encode(next_view), self.rotation))
        self.trace.append({'action': int(action), 'x':next_view['player']['x'], 'y':next_view['player']['y'],
                           'worldAction':world_action(action,self.rotation), 'health': next_view['player']['health'], 'reward': reward,
                           'recorded':result['recorded'], 'turnDelta':result['turnDelta']})
        self.view = next_view
        self.steps += 1
        self.total_reward += reward
        done = bool(dead or clear)
        truncated = bool(result['truncated'] and not done)
        info = {}
        if done or truncated:
            outcome = 'dead' if dead else 'cleared' if clear else 'budget-incomplete'
            record = {'phase':self.phase,'scenario': self.scenario, 'seed': self.game_seed, 'rotation':self.rotation, 'status': outcome,
                      'steps': self.steps, 'reward': self.total_reward, 'health': next_view['player']['health'],
                      'initialHealth':self.initial_health}
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


def make_training_env(out, rotate_frames, scenarios):
    torch.set_num_threads(1)
    env = CombatEnv(out, rotate_frames=rotate_frames, scenarios=scenarios)
    env.phase = 'training'
    return Monitor(env)


def evaluate(env, policy, scenarios, seed=987, repeats=1, all_rotations=False, deterministic=True):
    # CPU policies use torch's global sampler. Reproducible evaluation must not
    # advance the training RNG or depend on earlier evaluations' action counts.
    with torch.random.fork_rng(devices=[]):
        torch.manual_seed(seed)
        phase = getattr(env,'phase','unassigned')
        env.phase = 'random-evaluation' if policy is None else 'deterministic-evaluation' if deterministic else 'sampled-evaluation'
        try:
            return _evaluate(env, policy, scenarios, seed, repeats, all_rotations, deterministic)
        finally:
            env.phase = phase


def _evaluate(env, policy, scenarios, seed, repeats, all_rotations, deterministic):
    records = []
    rng = np.random.default_rng(seed)
    # Episode seeds must not depend on how many random actions previous episodes used.
    # Key seeds by fixture and repeat so adding a curriculum fixture does not
    # change the shared encounters in a before/after checkpoint comparison.
    plan = [(scenario, int.from_bytes(hashlib.sha256(f'{seed}:{repeat}:{scenario}'.encode()).digest()[:4],'big') % (2**31))
            for repeat in range(repeats) for scenario in scenarios]
    plan = [(scenario, episode_seed, rotation) for scenario, episode_seed in plan
            for rotation in (range(4) if all_rotations else [None])]
    for scenario, episode_seed, rotation in plan:
        options = {'scenario': scenario}
        if rotation is not None:
            options['rotation'] = rotation
        obs, _ = env.reset(seed=episode_seed, options=options)
        while True:
            action = int(rng.integers(len(ACTIONS))) if policy is None else int(policy.predict(obs, deterministic=deterministic)[0])
            obs, _, done, truncated, info = env.step(action)
            if done or truncated:
                records.append({**info, 'trace':list(getattr(env, 'trace', []))})
                break
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=pathlib.Path, required=True)
    parser.add_argument('--steps', type=int, default=2048)
    parser.add_argument('--envs', type=int, choices=[1,2,4], default=1)
    parser.add_argument('--curriculum',choices=list(CURRICULA),default='starter')
    parser.add_argument('--learning-rate',type=float,help='Explicit learning-rate override for training/resumption')
    parser.add_argument('--entropy-coefficient',type=float,help='Explicit PPO exploration-bonus coefficient')
    parser.add_argument('--target-kl',type=float,help='Set the approximate-KL early-stopping target for PPO updates')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--resume', type=pathlib.Path)
    mode.add_argument('--evaluate', type=pathlib.Path)
    parser.add_argument('--eval-repeats', type=int, default=1)
    parser.add_argument('--smoke', action='store_true')
    parser.add_argument('--rotate-frames', action='store_true')
    parser.add_argument('--eval-all-rotations', action='store_true',
                        help='Evaluate each seed in all four views; requires --evaluate and --rotate-frames')
    parser.add_argument('--eval-stochastic', action='store_true',
                        help='Also evaluate sampled policy actions; requires --evaluate')
    args = parser.parse_args()
    try:
        overrides=optimization_overrides(args.learning_rate,args.entropy_coefficient,args.target_kl)
    except ValueError as error:
        parser.error(str(error))
    if overrides and (args.evaluate or args.smoke):
        parser.error('Optimization overrides apply only to training')
    if args.eval_repeats < 1 or args.eval_repeats > 100 or args.steps < 1:
        parser.error('Use positive steps and 1..100 evaluation repeats')
    if args.eval_all_rotations and not (args.evaluate and args.rotate_frames):
        parser.error('--eval-all-rotations requires --evaluate and --rotate-frames')
    if args.eval_stochastic and not args.evaluate:
        parser.error('--eval-stochastic requires --evaluate')
    if args.envs != 1 and (args.evaluate or args.smoke):
        parser.error('--envs applies to training; evaluation and smoke use one environment')
    if not args.smoke and (args.out/'manifest.json').exists():
        parser.error('Output already contains a run; choose a new directory')
    torch.set_num_threads(4)
    scenarios = CURRICULA[args.curriculum]
    transfer = HELD_OUT[args.curriculum]
    env = CombatEnv(args.out, budget=64, rotate_frames=args.rotate_frames, scenarios=scenarios)
    parallel_env = None
    try:
        env.reset(seed=123)
        manifest = {'encoder': (ROTATED_ENCODER if args.rotate_frames else ENCODER), 'reward': REWARD, 'gameContract': env.contract,
                    'git': subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                    'curriculum':args.curriculum,'trainingScenarios': scenarios, 'transferScenarios': transfer,
                    'stressScenarios':transfer if args.curriculum in ('open-combat','terrain-combat') else [],
                    'optimizationOverrides':overrides,
                    'torch': torch.__version__, 'budget': 64,
                    'execution': {'environments':args.envs, 'rolloutStepsPerEnvironment':256//args.envs,
                                  'browserRecycleEpisodes':BROWSER_RECYCLE_EPISODES},
                    'evaluation': {'repeats':args.eval_repeats, 'allRotations':args.eval_all_rotations,
                                   'includeStochastic':args.eval_stochastic,'planVersion':2}}
        checkpoint = args.resume or args.evaluate
        if checkpoint:
            old = json.loads((checkpoint.parent/'manifest.json').read_text())
            manifest['sourceCheckpoint'] = {'path':str(checkpoint),
                'sha256':hashlib.sha256(checkpoint.read_bytes()).hexdigest(),
                'curriculum':old.get('curriculum','starter'),'git':old.get('git')}
            for key in ('encoder', 'reward', 'gameContract'):
                if old[key] != manifest[key]:
                    raise ValueError('Checkpoint incompatible: '+key)
            if args.resume and old.get('execution',{}).get('environments',1) != args.envs:
                raise ValueError('Resume requires the original number of training environments')
            if args.evaluate and old.get('curriculum','starter') != args.curriculum:
                raise ValueError('Evaluation must specify the checkpoint curriculum to label held-out fixtures correctly')
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
            evaluation_scenarios = scenarios + transfer
            random_results = evaluate(env, None, evaluation_scenarios, repeats=args.eval_repeats, all_rotations=args.eval_all_rotations)
            results = evaluate(env, model, evaluation_scenarios, repeats=args.eval_repeats, all_rotations=args.eval_all_rotations)
            assert model.num_timesteps == before
            (args.out/'random-evaluation.json').write_text(json.dumps(random_results, indent=2))
            (args.out/'evaluation.json').write_text(json.dumps(results, indent=2))
            if args.eval_stochastic:
                sampled = evaluate(env, model, evaluation_scenarios, repeats=args.eval_repeats,
                                   all_rotations=args.eval_all_rotations, deterministic=False)
                (args.out/'stochastic-evaluation.json').write_text(json.dumps(sampled, indent=2))
                assert model.num_timesteps == before
            (args.out/'complete.json').write_text(json.dumps({'mode':'evaluation-only', 'checkpoint':str(args.evaluate), 'trainingSteps':before, 'time':time.time()}))
            print('Checkpoint evaluation completed without learning updates', flush=True)
            return
        baseline = evaluate(env, None, scenarios)
        (args.out/'random-evaluation.json').write_text(json.dumps(baseline, indent=2))
        training_env = env
        env.phase = 'training'
        if args.envs > 1:
            parallel_env = SubprocVecEnv([
                functools.partial(make_training_env,args.out/f'worker-{i}',args.rotate_frames,scenarios)
                for i in range(args.envs)],start_method='spawn')
            parallel_env.seed(123)
            parallel_env.reset()
            if any(contract != env.contract for contract in parallel_env.get_attr('contract')):
                raise RuntimeError('Game contracts differ between training workers')
            training_env = parallel_env
        fresh_options={'learning_rate':3e-4,**overrides}
        model = PPO.load(args.resume, env=training_env, device='cpu',**overrides) if args.resume else PPO(
            'MlpPolicy', training_env, n_steps=256//args.envs, batch_size=64, n_epochs=4,
            gamma=0.99, seed=123, device='cpu',**fresh_options,
            policy_kwargs={'net_arch':[128,128]}, verbose=1)
        manifest['optimization']={'learningRateAtStart':float(model.lr_schedule(1.0)),
                                  'entropyCoefficient':float(model.ent_coef),'targetKL':model.target_kl}
        (args.out/'manifest.json').write_text(json.dumps(manifest,indent=2))
        # CPU is deliberate for this small MLP; GPU availability was tested separately.
        model.learn(total_timesteps=args.steps, reset_num_timesteps=not bool(args.resume), callback=Checkpoints(args.out))
        model.save(args.out/'final')
        if parallel_env is not None:
            parallel_env.close()
            parallel_env = None
        results = evaluate(env, model, scenarios + transfer)
        (args.out/'evaluation.json').write_text(json.dumps(results, indent=2))
        (args.out/'complete.json').write_text(json.dumps({'steps':model.num_timesteps, 'time':time.time()}))
        print('Pilot completed', flush=True)
    finally:
        if parallel_env is not None:
            parallel_env.close()
        env.close()

if __name__ == '__main__':
    main()
