import unittest
import gymnasium as gym
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.logger import configure
from rehearsal import Rehearsal


class RehearsalTests(unittest.TestCase):
    def model(self):
        return PPO('MlpPolicy',gym.make('CartPole-v1'),n_steps=8,batch_size=8,n_epochs=1,device='cpu',seed=123)

    def groups(self):
        return [(np.ones((4,4),dtype=np.float32),np.zeros(4,dtype=np.int64))]*2

    def test_practice_improves_demo_likelihood_without_value_update(self):
        model=self.model(); model.set_logger(configure(None,[]))
        callback=Rehearsal(self.groups()); callback.init_callback(model); callback.on_training_start({}, {})
        x=torch.ones(4,4); y=torch.zeros(4,dtype=torch.long)
        with torch.no_grad():
            before=model.policy.get_distribution(x).log_prob(y).mean().item()
            value=model.policy.predict_values(x).clone()
        callback.update()
        with torch.no_grad():
            after=model.policy.get_distribution(x).log_prob(y).mean().item()
            torch.testing.assert_close(value,model.policy.predict_values(x),rtol=0,atol=0)
        self.assertGreater(after,before)
        self.assertEqual(len(model.policy.optimizer.state),0)
        model.get_env().close()

    def test_no_practice_before_first_rollout_and_two_updates_for_three_rollouts(self):
        model=self.model(); callback=Rehearsal(self.groups())
        try:
            model.learn(total_timesteps=24,callback=callback)
            self.assertEqual(callback.updates,2)
            self.assertEqual(model.num_timesteps,24)
        finally: model.get_env().close()
