import unittest
import numpy as np

from merge_navigation_data import digest,unique_indices


class MergeNavigationDataTests(unittest.TestCase):
    def test_observation_digest_is_content_based(self):
        first=np.array([1,2,3],dtype=np.float32)
        second=np.array([1,2,3],dtype=np.float32)
        other=np.array([1,2,4],dtype=np.float32)
        self.assertEqual(digest(first),digest(second))
        self.assertNotEqual(digest(first),digest(other))

    def test_unique_indices_preserve_first_provenance_row(self):
        observations=np.asarray([[1,2],[3,4],[1,2],[5,6],[3,4]],dtype=np.float32)
        np.testing.assert_array_equal(unique_indices(observations),[0,1,3])


if __name__=='__main__': unittest.main()
