import unittest

import numpy as np

from subset_navigation_data import reservoir_indices, uniform_reservoir_indices


class SubsetNavigationDataTests(unittest.TestCase):
    def test_quota_is_per_seed_and_action(self):
        seeds = np.array([7, 7, 7, 8, 8, 8, 8])
        actions = np.array([0, 0, 1, 0, 1, 1, 1])
        indices = reservoir_indices(seeds, actions, quota=1, rng=np.random.default_rng(3))
        selected = [(int(seeds[index]), int(actions[index])) for index in indices]
        self.assertEqual(set(selected), {(7, 0), (7, 1), (8, 0), (8, 1)})

    def test_quota_bounds_every_bucket(self):
        seeds = np.array([1] * 20)
        actions = np.array([2] * 20)
        indices = reservoir_indices(seeds, actions, quota=4, rng=np.random.default_rng(3))
        self.assertEqual(len(indices), 4)
        self.assertEqual(len(set(indices.tolist())), 4)

    def test_uniform_reservoir_has_requested_size(self):
        indices = uniform_reservoir_indices(100, quota=7, rng=np.random.default_rng(3))
        self.assertEqual(len(indices), 7)
        self.assertEqual(len(set(indices.tolist())), 7)
        self.assertTrue(np.all((0 <= indices) & (indices < 100)))


if __name__ == '__main__':
    unittest.main()
