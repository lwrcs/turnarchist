import unittest
import numpy as np

from merge_navigation_data import digest


class MergeNavigationDataTests(unittest.TestCase):
    def test_observation_digest_is_content_based(self):
        first=np.array([1,2,3],dtype=np.float32)
        second=np.array([1,2,3],dtype=np.float32)
        other=np.array([1,2,4],dtype=np.float32)
        self.assertEqual(digest(first),digest(second))
        self.assertNotEqual(digest(first),digest(other))


if __name__=='__main__': unittest.main()
