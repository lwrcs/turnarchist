import copy
from collections import deque
import unittest
import numpy as np
import torch
from combat_pilot import CombatEnv, encode, SIZE, evaluate, rotate_features, world_action


class EncodingTests(unittest.TestCase):
    def view(self):
        return {'observationMode':'player-perception','schemaVersion':6,
                'player':{'x':12,'y':12,'health':2},'inventory':[],
                'room':{'tiles':[], 'entities':[], 'hitWarnings':[]}}

    def test_diagnostic_rejected(self):
        v=self.view(); v['observationMode']='diagnostic-current-room'
        with self.assertRaises(ValueError): encode(v)

    def test_giant_footprint_and_label_independence(self):
        v=self.view()
        v['room']['entities']=[{'x':13,'y':12,'appearance':'identified','width':2,'height':2,'isEnemy':True,'health':3,'kind':'BigSkull'}]
        encoded=encode(v)
        self.assertEqual(encoded.shape,(SIZE,))
        self.assertEqual(encoded[:-5].reshape(13,13,12)[:,:,5].sum(),4)
        v['room']['entities'][0]['kind']='EntirelyNewEnemy'
        np.testing.assert_array_equal(encoded,encode(v))

    def test_unknown_health_distinct_from_zero(self):
        v=self.view(); v['room']['entities']=[{'x':13,'y':12,'appearance':'identified','health':None}]
        unknown=encode(v)
        v['room']['entities'][0]['health']=0
        self.assertFalse(np.array_equal(unknown,encode(v)))

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
                features[:-5].reshape(13,13,12)[6+dy,6+dx,5]=1
                transformed=rotate_features(features,turns)[:-5].reshape(13,13,12)
                local=(world-turns)%4
                lx,ly=offsets[local]
                self.assertEqual(transformed[6+ly,6+lx,5],1)
                self.assertEqual(world_action(local,turns),world)
            self.assertEqual(world_action(4,turns),4)
    def test_roundtrip_preserves_features(self):
        original=np.arange(SIZE,dtype=np.float32)
        np.testing.assert_array_equal(original,rotate_features(rotate_features(original,1),3))


class EvaluationTests(unittest.TestCase):
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
