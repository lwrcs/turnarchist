import copy
import unittest
import numpy as np
from teaching_data import History, convert, reserved_seeds, validate_seed
from dungeon_pilot import ExplorationMemory, navigation_features
from combat_pilot import encode, rotate_features
from test_dungeon_pilot import view


class TeachingTests(unittest.TestCase):
    def state(self):
        v=view();v.update(schemaVersion=7,observationMode='player-perception',contract={})
        v['player']['maxHealth']=v['player']['health'];v.setdefault('inventory',[])
        return v

    def test_history_matches_training_encoder_and_rotation(self):
        before=self.state();after=copy.deepcopy(before);after['player']['x']+=1
        for rotation in range(4):
            h=History(before,rotation);mem=ExplorationMemory(before,0)
            mem.observe(before,after,0,False,{'type':'Move','direction':'right'})
            record={'seq':1,'before':before,'after':after,'action':{'type':'Move','direction':'right'},'decisionEnd':True}
            h.advance(record)
            expected=np.concatenate([rotate_features(encode(before),rotation),rotate_features(encode(after),rotation),mem.features(after,rotation),navigation_features(after,rotation,mem.used_passages)])
            np.testing.assert_array_equal(expected,h.observation())
            with self.assertRaises(ValueError):h.advance(record)

    def test_human_import_preserves_history_and_excludes_agent_labels(self):
        before=self.state();after=copy.deepcopy(before);after['player']['x']+=1
        record={'seq':1,'before':before,'after':after,'action':{'type':'Move','direction':'right'},'decisionEnd':True,'source':'human','segment':1,'info':{'recorded':True}}
        data={'schemaVersion':1,'meta':{'seed':123,'initial':before,'contract':{},'rotation':1,'protocol':'starter','perceptionView':'restricted-grid'},'records':[record]}
        x,y,report=convert(data);self.assertEqual(y,[0]);self.assertEqual(len(x),1)
        data['meta']['excludedSegments']=[1];self.assertEqual(convert(data)[1],[])
        data['meta']['seed']=next(iter(reserved_seeds()))
        with self.assertRaises(ValueError):convert(data)

    def test_reserved_seed_and_diagnostic_observation_rejected(self):
        for s in reserved_seeds():
            with self.assertRaises(ValueError):validate_seed(s)
        v=self.state();v['observationMode']='diagnostic-current-room'
        with self.assertRaises(ValueError):History(v)
