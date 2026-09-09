from pathlib import Path
import tempfile
import unittest

import torch
from stable_baselines3 import PPO

from combat_pilot import optimization_overrides, CURRICULA, HELD_OUT
from imitate import SpacesOnlyEnv


class OptimizationTests(unittest.TestCase):
    def test_resume_overrides_change_schedule_without_reinitializing_weights(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'model.zip'
            model=PPO('MlpPolicy',SpacesOnlyEnv(),n_steps=4,batch_size=4,seed=123,device='cpu')
            model.save(path)
            resumed=PPO.load(path,device='cpu',**optimization_overrides(3e-5,0.01,0.01))
            self.assertAlmostEqual(resumed.lr_schedule(1),3e-5)
            self.assertAlmostEqual(resumed.ent_coef,0.01)
            self.assertAlmostEqual(resumed.target_kl,0.01)
            for before,after in zip(model.policy.parameters(),resumed.policy.parameters()):
                self.assertTrue(torch.equal(before,after))

    def test_invalid_settings_fail_and_omitted_settings_are_preserved(self):
        self.assertEqual(optimization_overrides(),{})
        for values in [(0,None,None),(float('nan'),None,None),(None,-1,None),(None,None,0),
                       (None,float('inf'),None)]:
            with self.assertRaises(ValueError): optimization_overrides(*values)

    def test_terrain_curriculum_retains_duels_and_labels_new_stress_cases(self):
        self.assertEqual(CURRICULA['terrain-combat'],CURRICULA['open-combat']+HELD_OUT['open-combat'])
        self.assertFalse(set(CURRICULA['terrain-combat']) & set(HELD_OUT['terrain-combat']))


if __name__=='__main__':
    unittest.main()
