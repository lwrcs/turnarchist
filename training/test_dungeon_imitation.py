import json
from pathlib import Path
import tempfile
import unittest
import numpy as np
from dungeon_imitation import (navigation_example,exploration_example,planner_state_example,
                               load_navigation,load_navigation_provenance,split_navigation_seeds)
from dungeon_pilot import ENCODER,REWARD,HELPER,OBS_SIZE,seed_plan
from test_dungeon_pilot import view


class NavigationTests(unittest.TestCase):
    def test_keeps_frontier_steps_but_not_fallback_wall_bumps_or_combat(self):
        before=view(); after=view(1)
        transition={'controller':'planner','action':{'type':'Move','direction':'right'},'recorded':True}
        self.assertTrue(navigation_example(before,after,transition))
        transition['controller']='teacher'
        self.assertFalse(navigation_example(before,after,transition))
        transition['controller']='planner'
        self.assertFalse(navigation_example(before,before,transition))
        before['room']['entities']=[{'appearance':'unidentified'}]
        self.assertFalse(navigation_example(before,after,transition))
        before['room']['entities']=[]; before['room']['hitWarnings']=[{'hostile':True}]
        self.assertFalse(navigation_example(before,after,transition))

    def test_dagger_keeps_calm_teacher_labeled_state_before_a_learner_detour(self):
        before={'decision':'world','room':{'entities':[],'hitWarnings':[]}}
        self.assertTrue(planner_state_example(before))
        before['room']['hitWarnings']=[{'hostile':True,'dangerous':True}]
        self.assertFalse(planner_state_example(before))

    def test_exploration_keeps_safe_first_visits_but_not_baseline_loops(self):
        before=view(); after=view(1)
        transition={'controller':'teacher','action':{'type':'Move','direction':'right'},'recorded':True}
        self.assertTrue(exploration_example(before,after,transition,{('a',0,0)}))
        self.assertFalse(exploration_example(before,after,transition,{('a',0,0),('a',1,0)}))
        after['room']['entities']=[{'isEnemy':True}]
        self.assertFalse(exploration_example(before,after,transition,{('a',0,0)}))

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


class CollectionSeedTests(unittest.TestCase):
    def test_new_collection_excludes_original_and_held_out_seeds(self):
        from dungeon_imitation import training_seed_slice
        old=training_seed_slice(0,16); new=training_seed_slice(16,48)
        self.assertEqual(old+new,seed_plan('training',64))
        self.assertFalse(set(old)&set(new))
        self.assertFalse(set(new)&set(seed_plan('held-out',32)))
        for start,count in [(-1,16),(16,49),(0,0)]:
            with self.assertRaises(ValueError): training_seed_slice(start,count)


class ProvenanceTests(unittest.TestCase):
    def test_seed_split_is_reproducible_and_has_no_episode_leakage(self):
        episode_seeds=np.asarray([11,11,22,22,33,44,44],dtype=np.uint32)
        a=split_navigation_seeds(episode_seeds)
        b=split_navigation_seeds(episode_seeds)
        self.assertTrue(np.array_equal(a[0],b[0]))
        self.assertTrue(np.array_equal(a[1],b[1]))
        self.assertFalse(set(a[2])&set(a[3]))
        for seed in set(episode_seeds):
            rows=episode_seeds==seed
            self.assertTrue(a[0][rows].all() or a[1][rows].all())

    def test_provenance_is_required_for_fitting_loader(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)
            manifest={'encoder':ENCODER,'reward':REWARD,'helper':HELPER,
                      'trainingSeeds':seed_plan('training',2)}
            (path/'manifest.json').write_text(json.dumps(manifest))
            (path/'complete.json').write_text('{}')
            np.savez(path/'demonstrations.npz',observations=np.zeros((2,OBS_SIZE)),actions=np.array([0,1]))
            with self.assertRaisesRegex(ValueError,'lacks sample provenance'):
                load_navigation_provenance(path)
