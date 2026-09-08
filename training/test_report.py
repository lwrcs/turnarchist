import json
from pathlib import Path
import tempfile
import unittest
from report import compare, summarize

class ReportTests(unittest.TestCase):
    def row(self,status='budget-incomplete'):
        return {'scenario':'combat-zombie','seed':1,'status':status,'steps':64,
                'trace':[{'action':1,'x':2,'y':3}]*64}
    def test_full_health_or_stationary_does_not_make_timeout_success(self):
        result=summarize([self.row()])['combat-zombie']
        self.assertEqual(result['cleared'],0)
        self.assertEqual(result['budgetIncomplete'],1)
        self.assertEqual(result['dominantActionFraction'],1)
        self.assertEqual(result['distinctPositions'],[1])
    def test_mismatched_plan_is_explicit(self):
        with tempfile.TemporaryDirectory() as d:
            a,b=self.row(),self.row('cleared'); b['seed']=2
            Path(d,'random-evaluation.json').write_text(json.dumps([a]))
            Path(d,'evaluation.json').write_text(json.dumps([b]))
            self.assertFalse(compare(d)['matchedEpisodePlan'])
            b['seed']=1
            Path(d,'evaluation.json').write_text(json.dumps([b]))
            self.assertTrue(compare(d)['matchedEpisodePlan'])
    def test_unknown_outcomes_are_not_silently_dropped(self):
        self.assertEqual(summarize([self.row('error')])['combat-zombie']['otherOutcomes'],{'error':1})

if __name__=='__main__': unittest.main()
