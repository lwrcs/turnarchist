import unittest

from collect_teacher import local_action
from combat_pilot import ACTIONS, world_action


class TeacherActionTests(unittest.TestCase):
    def test_teacher_actions_roundtrip_through_every_view(self):
        for rotation in range(4):
            for world,action in enumerate(ACTIONS):
                self.assertEqual(world_action(local_action(action,rotation),rotation),world)

    def test_unsupported_actions_fail_instead_of_becoming_wait(self):
        for action in [{'type':'Wait'},None,{'type':'UseItem','slotIndex':0},{'type':'Move','direction':'diagonal'}]:
            with self.assertRaises(ValueError):
                local_action(action,0)


if __name__=='__main__':
    unittest.main()
