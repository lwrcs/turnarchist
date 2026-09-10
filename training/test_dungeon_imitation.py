import json
from pathlib import Path
import tempfile
import unittest
import numpy as np
from dungeon_imitation import navigation_example,load_navigation
from dungeon_pilot import ENCODER,REWARD,HELPER,OBS_SIZE,seed_plan
from test_dungeon_pilot import view


class NavigationTests(unittest.TestCase):
    def test_keeps_crossings_but_not_wall_bumps_or_combat(self):
        before=view(); after=view(1)
        transition={'controller':'teacher','action':{'type':'Move','direction':'right'},'recorded':True}
        self.assertTrue(navigation_example(before,after,transition))
        self.assertFalse(navigation_example(before,before,transition))
        before['room']['entities']=[{'appearance':'unidentified'}]
        self.assertFalse(navigation_example(before,after,transition))
        before['room']['entities']=[]; before['room']['hitWarnings']=[{'hostile':True}]
        self.assertFalse(navigation_example(before,after,transition))

    def test_dataset_requires_training_seeds_and_four_legal_actions(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)
            manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,'trainingSeeds':seed_plan('held-out',1)}
            (path/'manifest.json').write_text(json.dumps(manifest))
            (path/'complete.json').write_text('{}')
            np.savez(path/'demonstrations.npz',observations=np.zeros((1,OBS_SIZE)),actions=np.array([0]))
            with self.assertRaisesRegex(ValueError,'non-training'): load_navigation(path)
            manifest['trainingSeeds']=seed_plan('training',1)
            (path/'manifest.json').write_text(json.dumps(manifest))
            np.savez(path/'demonstrations.npz',observations=np.zeros((1,OBS_SIZE)),actions=np.array([4]))
            with self.assertRaisesRegex(ValueError,'action'): load_navigation(path)


if __name__=='__main__': unittest.main()


class DoorwayCycleTests(unittest.TestCase):
    def trace(self):
        return [{'controller':'learner','action':{'type':'Move'},'recorded':True,'turnDelta':0,
                 'room':'A' if i%2==0 else 'B','x':i%2,'y':2} for i in range(6)]

    def test_repeated_crossing_is_detected_but_single_retreat_is_not(self):
        from dungeon_imitation import doorway_cycle
        self.assertTrue(doorway_cycle(self.trace()))
        self.assertFalse(doorway_cycle(self.trace()[:2]))

    def test_attacks_walls_helpers_and_same_room_motion_do_not_trigger(self):
        from dungeon_imitation import doorway_cycle
        for key,value in [('recorded',False),('turnDelta',1),('controller','teacher')]:
            trace=self.trace(); trace[-1][key]=value
            self.assertFalse(doorway_cycle(trace))
        trace=self.trace()
        for t in trace: t['room']='A'
        self.assertFalse(doorway_cycle(trace))
        trace=self.trace(); trace[-1]['x']=99
        self.assertFalse(doorway_cycle(trace))
