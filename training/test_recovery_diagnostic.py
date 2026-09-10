import unittest
from recovery_diagnostic import episode_groups

class EpisodeGroupsTests(unittest.TestCase):
    def test_interventions_from_same_episode_stay_in_same_group(self):
        rows=[{'episodeSeed':1,'samples':2},{'episodeSeed':2,'samples':1},{'episodeSeed':1,'samples':1}]
        self.assertEqual(episode_groups(rows,4).tolist(),[1,1,2,1])

    def test_mismatch_and_single_episode_rejected(self):
        with self.assertRaises(ValueError): episode_groups([{'episodeSeed':1,'samples':3}],3)
        with self.assertRaises(ValueError): episode_groups([{'episodeSeed':1,'samples':1},{'episodeSeed':2,'samples':1}],3)
