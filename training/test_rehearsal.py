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

class WorkerResizeTests(unittest.TestCase):
    def test_loading_new_worker_count_preserves_weights_and_rollout_length(self):
        import tempfile
        from pathlib import Path
        from stable_baselines3.common.vec_env import DummyVecEnv
        old=DummyVecEnv([lambda:gym.make('CartPole-v1')]*4)
        new=DummyVecEnv([lambda:gym.make('CartPole-v1')]*8)
        try:
            model=PPO('MlpPolicy',old,n_steps=64,batch_size=64,device='cpu')
            with tempfile.TemporaryDirectory() as directory:
                path=Path(directory)/'model'; model.save(path)
                loaded=PPO.load(path,env=new,device='cpu')
                self.assertEqual(loaded.n_envs,8)
                self.assertEqual(loaded.n_steps,64)
                self.assertEqual(loaded.rollout_buffer.observations.shape[:2],(64,8))
                for key,value in model.policy.state_dict().items():
                    torch.testing.assert_close(value,loaded.policy.state_dict()[key])
        finally:
            old.close(); new.close()

class RejectionTests(unittest.TestCase):
    def test_rejected_action_probability_decreases_and_buffer_is_bounded(self):
        model=PPO('MlpPolicy',gym.make('CartPole-v1'),n_steps=8,batch_size=8,device='cpu',seed=123)
        model.set_logger(configure(None,[]))
        # Positive demonstrations favor action 0; the observed rejection is action 1.
        groups=[(np.ones((4,4),dtype=np.float32),np.zeros(4,dtype=np.int64))]*2
        callback=Rehearsal(groups,rejection_feedback=True)
        callback.init_callback(model); callback.on_training_start({}, {})
        callback.locals={'infos':[{'rejectedAction':1}],'new_obs':np.ones((1,4),dtype=np.float32)}
        for _ in range(300): callback._on_step()
        self.assertEqual(len(callback.rejections),256)
        x=torch.ones(1,4)
        with torch.no_grad(): before=model.policy.get_distribution(x).distribution.probs[0,1].item()
        callback.update()
        with torch.no_grad(): after=model.policy.get_distribution(x).distribution.probs[0,1].item()
        self.assertLess(after,before)
        disabled=Rehearsal(groups); disabled.locals=callback.locals; disabled._on_step()
        self.assertEqual(len(disabled.rejections),0)
        model.get_env().close()

    def test_only_unchanged_unrecorded_zero_turn_nonterminal_actions_qualify(self):
        from dungeon_pilot import rejected_without_visible_effect as rejected
        x=np.zeros(4); no_effect={'recorded':False,'turnDelta':0}
        self.assertTrue(rejected(x,x,no_effect,False))
        self.assertFalse(rejected(x,x,{'recorded':True,'turnDelta':0},False))
        self.assertFalse(rejected(x,x,{'recorded':False,'turnDelta':1},False))
        self.assertFalse(rejected(x,np.ones(4),no_effect,False))
        self.assertFalse(rejected(x,x,no_effect,True))
