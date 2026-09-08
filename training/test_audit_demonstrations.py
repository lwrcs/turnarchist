import unittest
from audit_demonstrations import summarize_choices


class AuditTests(unittest.TestCase):
    def test_confident_wrong_choice_is_identified_even_when_mean_agreement_is_high(self):
        rows=[[0.9,0.025,0.025,0.025,0.025]]*3+[[0.01,0.96,0.01,0.01,0.01]]
        result=summarize_choices(rows,[0,0,0,0])
        self.assertEqual(result['teacherActionAgreement'],0.75)
        self.assertEqual(result['disagreementIndices'],[3])
        self.assertGreater(result['meanTeacherNegativeLogLikelihood'],1)

    def test_invalid_distribution_is_rejected(self):
        with self.assertRaises(ValueError):
            summarize_choices([[1,1,1,1,1]],[0])
        with self.assertRaises(ValueError):
            summarize_choices([[1,0,0,0,0]],[5])


if __name__=='__main__':
    unittest.main()
