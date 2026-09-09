from collections import deque
import tempfile
from pathlib import Path
import unittest

import gymnasium as gym
import numpy as np
from stable_baselines3 import PPO
import torch

from combat_pilot import SIZE, encode
from dungeon_pilot import (DungeonEnv, ExplorationMemory, helper_action, seed_plan, actual_seed,
                           OBS_SIZE, transfer_actor, navigation_features)


def view(x=0,y=0,room='a',health=2):
    return {'observationMode':'player-perception','schemaVersion':6,
            'decision':'world','player':{'x':x,'y':y,'z':0,'health':health,'maxHealth':2},
            'inventory':[], 'room':{'id':room,'tiles':[],'entities':[],'hitWarnings':[]}}


class DungeonTests(unittest.TestCase):
    def test_seed_pools_do_not_overlap_after_game_seed_conversion(self):
        train=seed_plan('training',64); test=seed_plan('held-out',32)
        self.assertEqual(train,seed_plan('training',64))
        self.assertFalse(set(map(actual_seed,train)) & set(map(actual_seed,test)))

    def test_no_repeat_exploration_reward_for_backtracking_or_floor_farming(self):
        a=view(); b=view(1); c=view(0,room='b')
        memory=ExplorationMemory(a,0)
        self.assertAlmostEqual(memory.observe(a,b,0,False),.01)
        self.assertAlmostEqual(memory.observe(b,a,0,False),-.01)
        self.assertAlmostEqual(memory.observe(a,c,1,False),5.51)
        memory.observe(c,a,0,False)
        self.assertAlmostEqual(memory.observe(a,c,1,False),-.01)
        self.assertEqual(len(memory.rooms),2)

    def test_vertical_animation_is_not_a_new_exploration_tile(self):
        a=view(); b=view(); b['player']['z']=.5
        memory=ExplorationMemory(a,0)
        self.assertAlmostEqual(memory.observe(a,b,0,False),-.01)
        self.assertEqual(len(memory.visits),1)

    def test_enemy_disappearance_is_not_a_kill_reward(self):
        a=view(); a['room']['entities']=[{'isEnemy':True,'x':4,'y':0}]
        b=view()
        memory=ExplorationMemory(a,0)
        self.assertAlmostEqual(memory.observe(a,b,0,False),-.01)

    def test_memory_rotates_and_is_room_local(self):
        a=view(); b=view(1)
        memory=ExplorationMemory(a,0)
        memory.observe(a,b,0,False)
        grid=memory.features(a,1).reshape(13,13)
        self.assertEqual(grid[5,6],1/8)
        self.assertEqual(memory.features(view(room='unknown'),0).sum(),0)

    def test_navigation_marks_only_exposed_passages_and_rotates(self):
        a=view()
        a['room']['tiles']=[{'x':1,'y':0,'isDoor':True,'traversal':{'unlocked':False}},
                            {'x':0,'y':1,'exit':True,'traversal':{'direction':'down'}},
                            {'x':-1,'y':0,'kind':None,'isDoor':None,'exit':None}]
        grid=navigation_features(a,1).reshape(13,13,6)
        np.testing.assert_array_equal(grid[5,6],[1,0,0,1,0,0])
        np.testing.assert_array_equal(grid[6,7],[0,1,0,0,0,0])
        self.assertEqual(grid[7,6].sum(),0)

    def test_passage_memory_requires_actual_observed_crossing(self):
        a=view(); a['room']['tiles']=[{'x':1,'y':0,'isDoor':True,'traversal':{'unlockFromHere':True}}]
        b=view(room='b'); memory=ExplorationMemory(a,0)
        memory.observe(a,a,0,False,{'type':'Move','direction':'right'})
        self.assertFalse(memory.used_passages)
        memory.observe(a,b,0,False,{'type':'Move','direction':'right'})
        grid=navigation_features(a,0,memory.used_passages).reshape(13,13,6)
        self.assertEqual(grid[6,7,4],1)
        self.assertEqual(grid[6,7,5],1)
        self.assertNotIn(('b',1,0),memory.used_passages)

    def test_helper_only_uses_supported_metadata_and_never_waits(self):
        a=view(health=1)
        a['inventory']=[{'slot':2,'healingAmount':1,'useTurnCost':1},
                        {'slot':3,'healingAmount':1,'useTurnCost':0,'canUseOnOther':True},
                        {'slot':4,'healingAmount':1,'useTurnCost':0}]
        self.assertEqual(helper_action(a),{'type':'UseItem','slotIndex':4})
        a['player']['health']=2
        self.assertIsNone(helper_action(a))
        a['decision']='ladder'
        self.assertEqual(helper_action(a),{'type':'LadderConfirm'})
        a['decision']='unsupported-modal'
        self.assertIsNone(helper_action(a))

    def test_helper_actions_share_budget_and_do_not_become_learner_actions(self):
        with tempfile.TemporaryDirectory() as directory:
            env=object.__new__(DungeonEnv)
            env.out=Path(directory); env.view=view(); env.frames=deque([encode(env.view)]*2,maxlen=2)
            env.memory=ExplorationMemory(env.view,0); env.rotation=0; env.trace=[]
            env.steps=env.total_reward=env.game_actions=env.assisted_actions=env.world_turns=env.health_lost=0
            env.stop_reason=None; env.started=0; env.phase='test'; env.game_seed=1; env.episode_seed=2
            calls=[]
            class Page:
                def evaluate(self,script,action=None):
                    if action is None: return {'actions':calls}
                    calls.append(action)
                    after=view(health=1)
                    after['inventory']=[{'slot':0,'healingAmount':1,'useTurnCost':0}]
                    return {'view':after,'terminated':False,'truncated':len(calls)==3,
                            'depth':0,'recorded':True,'turnDelta':int(len(calls)==1)}
            env.page=Page()
            obs,reward,done,truncated,info=env.step(1)
            self.assertFalse(done); self.assertTrue(truncated)
            self.assertEqual(info['status'],'budget-incomplete')
            self.assertEqual(info['steps'],1); self.assertEqual(info['gameActions'],3)
            self.assertEqual(info['helperActions'],2)
            self.assertEqual(obs.shape,(OBS_SIZE,))
            self.assertEqual([x['controller'] for x in env.trace],['learner','helper','helper'])

    def test_actor_transfer_preserves_logits_for_any_new_memory_and_keeps_new_value_head(self):
        class Space(gym.Env):
            def __init__(self,size):
                self.action_space=gym.spaces.Discrete(4)
                self.observation_space=gym.spaces.Box(0,1,shape=(size,),dtype=np.float32)
        source=PPO('MlpPolicy',Space(SIZE*2),n_steps=8,batch_size=8,device='cpu',
                   policy_kwargs={'net_arch':[128,128]},seed=1)
        target=PPO('MlpPolicy',Space(OBS_SIZE),n_steps=8,batch_size=8,device='cpu',
                   policy_kwargs={'net_arch':[128,128]},seed=2)
        value_before=target.policy.value_net.weight.detach().clone()
        transfer_actor(target,source)
        old=torch.rand(3,SIZE*2)
        new=torch.cat([old,torch.rand(3,OBS_SIZE-SIZE*2)],dim=1)
        with torch.no_grad():
            torch.testing.assert_close(source.policy.get_distribution(old).distribution.logits,
                                       target.policy.get_distribution(new).distribution.logits)
        torch.testing.assert_close(value_before,target.policy.value_net.weight)
        self.assertEqual(target.num_timesteps,0)


if __name__=='__main__': unittest.main()
