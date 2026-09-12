import copy
from collections import deque
import unittest
from unittest.mock import Mock
import numpy as np
import torch
from combat_pilot import CombatEnv, encode, SIZE, GRID, CENTER, CHANNELS, TRAIT_START, CONTEXT_START, evaluate, rotate_features, world_action, BROWSER_RECYCLE_EPISODES


class EncodingTests(unittest.TestCase):
    def view(self):
        return {'observationMode':'player-perception','schemaVersion':10,
                'player':{'x':12,'y':12,'health':2},'inventory':[],
                'room':{'tiles':[], 'entities':[], 'hitWarnings':[]}}

    def test_diagnostic_rejected(self):
        v=self.view(); v['observationMode']='diagnostic-current-room'
        with self.assertRaises(ValueError): encode(v)

    def test_shared_traits_memory_categories_and_context_reach_policy(self):
        v=self.view()
        v['room']['tiles']=[{'x':12,'y':12,'knowledge':'remembered'}]
        v['room']['context']={'depth':-1,'environment':2,'roomType':'FOREST'}
        v['room']['entities']=[{'x':13,'y':12,'appearance':'identified','knowledge':'remembered','forwardOnlyAttack':True,'isBoss':True}]
        v['room']['items']=[{'x':12,'y':12,'appearance':'identified','categories':['equippable','weapon']}]
        v['inventory']=[{'categories':['usable']}]
        grid=encode(v)[:-5].reshape(GRID,GRID,CHANNELS)
        np.testing.assert_array_equal(grid[CENTER,CENTER+1,TRAIT_START:TRAIT_START+6],[1,1,1,1,1,0])
        self.assertEqual(grid[CENTER,CENTER,TRAIT_START+6],1)
        self.assertEqual(grid[CENTER,CENTER,TRAIT_START+13],1)
        self.assertEqual(grid[CENTER,CENTER,TRAIT_START+18],1)
        self.assertAlmostEqual(grid[CENTER,CENTER,CONTEXT_START+1],.09)

    def test_giant_footprint_and_label_independence(self):
        v=self.view()
        v['room']['entities']=[{'x':13,'y':12,'appearance':'identified','width':2,'height':2,'isEnemy':True,'health':3,'kind':'BigSkull'}]
        encoded=encode(v)
        self.assertEqual(encoded.shape,(SIZE,))
        self.assertEqual(encoded[:-5].reshape(GRID,GRID,CHANNELS)[:,:,5].sum(),4)
        v['room']['entities'][0]['kind']='EntirelyNewEnemy'
        np.testing.assert_array_equal(encoded,encode(v))

    def test_unknown_health_distinct_from_zero(self):
        v=self.view(); v['room']['entities']=[{'x':13,'y':12,'appearance':'identified','health':None}]
        unknown=encode(v)
        v['room']['entities'][0]['health']=0
        self.assertFalse(np.array_equal(unknown,encode(v)))

    def test_facing_and_contact_displacement_rotate_with_the_board(self):
        v=self.view();v['room']['entities']=[{'x':12,'y':12,'appearance':'identified','facing':{'dx':1,'dy':0},'tracking':{'dx':1,'dy':0,'stepsSinceSeen':1}}]
        grid=rotate_features(encode(v),1)[:-5].reshape(GRID,GRID,CHANNELS)
        np.testing.assert_allclose(grid[CENTER,CENTER,16:19],[1,.5,0])
        np.testing.assert_allclose(grid[CENTER,CENTER,19:23],[1,.5,.5-1/GRID/2,1/8])

    def test_spawner_variants_spawn_hazards_and_neighboring_entities_are_encoded(self):
        v=self.view();v['room']['entities']=[{'x':12,'y':12,'appearance':'identified','spawner':{'enemyType':'skull'}}]
        skull=encode(v);v['room']['entities'][0]['spawner']['enemyType']='zombie';self.assertFalse(np.array_equal(skull,encode(v)))
        v['visibleRooms']=[{'id':'neighbor','tiles':[],'entities':[],'hitWarnings':[], 'hazards':[{'x':20,'y':12,'kind':'enemy-spawn','damage':.5}]}]
        grid=encode(v)[:-5].reshape(GRID,GRID,CHANNELS)
        np.testing.assert_allclose(grid[CENTER,CENTER+8,23:25],[1,.05])

    def test_anonymous_does_not_gain_hidden_body_or_health(self):
        v=self.view(); v['room']['entities']=[{'x':13,'y':12,'appearance':'unidentified'}]
        encoded=encode(v)
        v['room']['entities'][0].update(width=2,height=2,health=10)
        np.testing.assert_array_equal(encoded,encode(v))

class RotationTests(unittest.TestCase):
    def test_each_action_points_to_rotated_target(self):
        offsets=[(0,-1),(1,0),(0,1),(-1,0)]
        for turns in range(4):
            for world, (dx,dy) in enumerate(offsets):
                features=np.zeros(SIZE,dtype=np.float32)
                features[:-5].reshape(GRID,GRID,CHANNELS)[CENTER+dy,CENTER+dx,5]=1
                transformed=rotate_features(features,turns)[:-5].reshape(GRID,GRID,CHANNELS)
                local=(world-turns)%4
                lx,ly=offsets[local]
                self.assertEqual(transformed[CENTER+ly,CENTER+lx,5],1)
                self.assertEqual(world_action(local,turns),world)
            with self.assertRaises(ValueError): world_action(4,turns)
    def test_roundtrip_preserves_features(self):
        original=np.arange(SIZE,dtype=np.float32)
        np.testing.assert_array_equal(original,rotate_features(rotate_features(original,1),3))


class EvaluationTests(unittest.TestCase):
    def test_browser_recycle_keeps_seeded_reset_and_clears_frame_history(self):
        env=object.__new__(CombatEnv)
        env.episode=BROWSER_RECYCLE_EPISODES-1
        env.scenarios=['combat-skull']
        env.rotate_frames=True
        env.frames=deque(maxlen=2)
        env.contract=None
        env.budget=64
        view=EncodingTests().view()
        view['contract']={'actionSchemaVersion':4}
        env.page=Mock()
        env.page.evaluate.return_value=view
        env._open_game_page=Mock()
        first,_=env.reset(seed=123)
        game_seed=env.game_seed
        env._open_game_page.assert_not_called()
        env.frames.append(np.ones(SIZE))
        second,_=env.reset(seed=123)
        env._open_game_page.assert_called_once()
        self.assertEqual(game_seed,env.game_seed)
        np.testing.assert_array_equal(first,second)

    def test_shared_fixture_seeds_survive_curriculum_expansion(self):
        class Env:
            def __init__(self): self.plan=[]
            def reset(self,*,seed,options):
                self.plan.append((options['scenario'],seed))
                return np.zeros(1),{}
            def step(self,action): return np.zeros(1),0,True,False,{}
        before,after=Env(),Env()
        evaluate(before,None,['a','b'],repeats=3)
        evaluate(after,None,['new','b','a','extra'],repeats=3)
        self.assertEqual(sorted(before.plan),sorted(p for p in after.plan if p[0] in ['a','b']))

    def test_sampled_evaluation_is_repeatable_and_preserves_torch_rng(self):
        class Env:
            def __init__(self): self.actions=[]; self.phase='training'
            def reset(self, *, seed, options): return np.zeros(1),{}
            def step(self, action):
                self.actions.append(action)
                return np.zeros(1),0,True,False,{}
        class Policy:
            def predict(self, obs, deterministic):
                self.deterministic=deterministic
                return torch.randint(5,()).item(),None
        policy=Policy()
        a,b=Env(),Env()
        state=torch.random.get_rng_state().clone()
        evaluate(a,policy,['a'],repeats=20,deterministic=False)
        self.assertFalse(policy.deterministic)
        self.assertEqual(a.phase,'training')
        self.assertTrue(torch.equal(state,torch.random.get_rng_state()))
        evaluate(b,policy,['a'],repeats=20,deterministic=False)
        self.assertEqual(a.actions,b.actions)

    def test_execution_diagnostics_do_not_enter_policy_or_reward(self):
        view=EncodingTests().view()
        view['decision']='world'
        results=[]
        for recorded,turns in [(False,0),(True,1)]:
            env=object.__new__(CombatEnv)
            env.view=copy.deepcopy(view)
            env.rotation=0
            env.frames=deque([encode(view)]*2,maxlen=2)
            env.trace=[]
            env.steps=0
            env.total_reward=0
            class Page:
                def evaluate(self,script,action):
                    return {'view':copy.deepcopy(view),'terminated':False,'truncated':False,
                            'cleared':False,'recorded':recorded,'turnDelta':turns}
            env.page=Page()
            results.append(env.step(1))
            self.assertEqual(env.trace[0]['recorded'],recorded)
            self.assertEqual(env.trace[0]['turnDelta'],turns)
        np.testing.assert_array_equal(results[0][0],results[1][0])
        self.assertEqual(results[0][1:],results[1][1:])

    def test_all_rotations_share_seed_and_cover_each_view(self):
        class Env:
            def __init__(self): self.plan = []
            def reset(self, *, seed, options):
                self.plan.append((options['scenario'], seed, options['rotation']))
                return np.zeros(1), {}
            def step(self, action):
                return np.zeros(1), 0, True, False, {}
        env = Env()
        evaluate(env, None, ['a', 'b'], repeats=2, all_rotations=True)
        self.assertEqual(len(env.plan), 16)
        for start in range(0,16,4):
            group = env.plan[start:start+4]
            self.assertEqual(len({(scenario,seed) for scenario,seed,_ in group}),1)
            self.assertEqual([rotation for _,_,rotation in group],list(range(4)))

    def test_seed_plan_independent_of_episode_length(self):
        class Env:
            def __init__(self, length): self.length, self.seeds = length, []
            def reset(self, *, seed, options):
                self.seeds.append((seed, options['scenario']))
                self.steps = 0
                return np.zeros(1), {}
            def step(self, action):
                self.steps += 1
                return np.zeros(1), 0, self.steps == self.length, False, {}
        short, long = Env(1), Env(7)
        evaluate(short, None, ['a','b'], repeats=3)
        evaluate(long, None, ['a','b'], repeats=3)
        self.assertEqual(short.seeds, long.seeds)
        self.assertEqual(len(short.seeds), 6)

if __name__=='__main__': unittest.main()
