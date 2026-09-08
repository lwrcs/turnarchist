import json
from pathlib import Path
import tempfile
import unittest

import numpy as np

from combat_pilot import CURRICULA, ENCODER, SCENARIOS, SIZE
from imitate import load_demonstrations


class DemonstrationTests(unittest.TestCase):
    def write_data(self,path):
        manifest={'encoder':{**ENCODER,'version':2,'coordinateRotation':'random-quarter-turn-per-episode'},
                  'gameContract':{'observationMode':'player-perception'},'trainingScenarios':SCENARIOS}
        (path/'manifest.json').write_text(json.dumps(manifest))
        (path/'outcomes.json').write_text(json.dumps([
            {'scenario':SCENARIOS[0],'status':'cleared','initialHealth':2,'health':2},
            {'scenario':SCENARIOS[0],'status':'cleared','initialHealth':2,'health':1},
            {'scenario':SCENARIOS[0],'status':'budget-incomplete','initialHealth':2,'health':2}]))
        np.savez(path/'demonstrations.npz',observations=np.zeros((3,SIZE*2),dtype=np.float32),
                 actions=np.array([1,2,3]),episode_ids=np.array([0,1,2]))
    def test_damage_trades_and_timeouts_are_not_positive_examples(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)
            self.write_data(path)
            x,y,_=load_demonstrations(path)
            self.assertEqual(len(x),1)
            self.assertEqual(y.tolist(),[1])
    def test_invalid_action_labels_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)
            self.write_data(path)
            np.savez(path/'demonstrations.npz',observations=np.zeros((1,SIZE*2),dtype=np.float32),
                     actions=np.array([9]),episode_ids=np.array([0]))
            with self.assertRaises(ValueError): load_demonstrations(path)
    def test_transfer_data_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)
            self.write_data(path)
            manifest=json.loads((path/'manifest.json').read_text())
            manifest['trainingScenarios']=SCENARIOS+['combat-bigskull-alert']
            (path/'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaises(ValueError): load_demonstrations(path)
    def test_declared_forward_curriculum_is_supported(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)
            self.write_data(path)
            manifest=json.loads((path/'manifest.json').read_text())
            manifest.update(curriculum='forward',trainingScenarios=CURRICULA['forward'])
            (path/'manifest.json').write_text(json.dumps(manifest))
            self.assertEqual(len(load_demonstrations(path)[0]),1)
    def test_hidden_transfer_episode_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)
            self.write_data(path)
            outcomes=json.loads((path/'outcomes.json').read_text())
            outcomes[0]['scenario']='combat-bigskull-alert'
            (path/'outcomes.json').write_text(json.dumps(outcomes))
            with self.assertRaises(ValueError): load_demonstrations(path)


if __name__=='__main__': unittest.main()
