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
            Path(d,'stochastic-evaluation.json').write_text(json.dumps([b]))
            self.assertTrue(compare(d)['matchedStochasticPlan'])
            self.assertEqual(compare(d)['stochastic']['combat-zombie']['cleared'],1)
    def test_unknown_outcomes_are_not_silently_dropped(self):
        self.assertEqual(summarize([self.row('error')])['combat-zombie']['otherOutcomes'],{'error':1})
    def test_rotation_specific_failure_is_visible(self):
        good,bad=self.row('cleared'),self.row()
        good['rotation'],bad['rotation']=0,1
        result=summarize([good,bad])['combat-zombie']
        self.assertEqual(result['outcomesByRotation'],{0:{'cleared':1},1:{'budget-incomplete':1}})
    def test_stationary_attack_is_not_counted_as_unrecorded(self):
        row=self.row()
        row['trace']=[{'action':1,'x':2,'y':3,'recorded':True,'turnDelta':1},
                      {'action':1,'x':2,'y':3,'recorded':False,'turnDelta':0},
                      {'action':1,'x':2,'y':3}]
        result=summarize([row])['combat-zombie']
        self.assertEqual(result['unrecordedDecisions'],1)
        self.assertEqual(result['recordingStatusKnown'],2)
        self.assertEqual(result['worldTurns'],1)
        self.assertEqual(result['turnDeltaKnown'],2)
    def test_health_preservation_requires_known_starting_health(self):
        a,b=self.row('cleared'),self.row('cleared')
        a.update(initialHealth=2,health=2)
        b.update(initialHealth=2,health=1)
        result=summarize([a,b])['combat-zombie']
        self.assertEqual(result['healthPreservingClears'],1)
        self.assertEqual(result['clearHealthComparisonKnown'],2)
        del b['initialHealth']
        self.assertIsNone(summarize([a,b])['combat-zombie']['healthPreservingClears'])

if __name__=='__main__': unittest.main()
