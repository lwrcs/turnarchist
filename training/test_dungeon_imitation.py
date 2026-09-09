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
