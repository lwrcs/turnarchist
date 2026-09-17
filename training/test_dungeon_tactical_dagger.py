import unittest

from dungeon_pilot import shield_assessment


class TacticalDaggerTests(unittest.TestCase):
    def test_preview_boundary_allows_safe_teacher_disagreement_but_not_damage(self):
        operator={'tactical':{'moves':[
            {'direction':'left','consequence':{'knownIncomingDamageBeforeDefense':0,'unknownDamageSources':0}},
            {'direction':'right','consequence':{'knownIncomingDamageBeforeDefense':.5,'unknownDamageSources':0}},
        ]}}
        teacher={'type':'Move','direction':'up'}
        self.assertEqual(shield_assessment(operator,'left',teacher,False),(True,'safe-preview'))
        self.assertEqual(shield_assessment(operator,'right',teacher,False),(False,'known-damage'))


if __name__=='__main__': unittest.main()
