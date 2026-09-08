import copy
import unittest
import numpy as np
from combat_pilot import encode, SIZE, evaluate


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

class EvaluationTests(unittest.TestCase):
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
