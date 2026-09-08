import json
from pathlib import Path
import tempfile
import unittest
from report import compare, compare_checkpoints, summarize

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
    def test_checkpoint_comparison_excludes_unmatched_encounters(self):
        with tempfile.TemporaryDirectory() as directory:
            before,after=Path(directory)/'before',Path(directory)/'after'
            before.mkdir(); after.mkdir()
            a,b=self.row('cleared'),self.row('dead')
            a['health'],b['health']=2,0
            extra={**b,'seed':99}
            (before/'evaluation.json').write_text(json.dumps([a]))
            (after/'evaluation.json').write_text(json.dumps([b,extra]))
            result=compare_checkpoints(before,after)
            self.assertEqual(result['matchedEpisodes'],1)
            self.assertEqual(result['unmatchedAfter'],1)
            self.assertEqual(result['scenarios']['combat-zombie']['outcomeTransitions'],{'cleared -> dead':1})
            self.assertEqual(result['scenarios']['combat-zombie']['meanRemainingHealthChange'],-2)
            (after/'evaluation.json').write_text(json.dumps([b,b]))
            with self.assertRaises(ValueError): compare_checkpoints(before,after)

    def test_positive_mean_does_not_hide_individual_health_regression(self):
        with tempfile.TemporaryDirectory() as directory:
            before,after=Path(directory)/'before',Path(directory)/'after'
            before.mkdir(); after.mkdir()
            rows=[{**self.row('cleared'),'seed':1,'health':2},
                  {**self.row('cleared'),'seed':2,'health':0.5}]
            changed=[{**rows[0],'health':1.5},{**rows[1],'health':2}]
            (before/'evaluation.json').write_text(json.dumps(rows))
            (after/'evaluation.json').write_text(json.dumps(changed))
            result=compare_checkpoints(before,after)['scenarios']['combat-zombie']
            self.assertGreater(result['meanRemainingHealthChange'],0)
            self.assertEqual(result['healthWorsened'],1)
            self.assertEqual(result['healthImproved'],1)
            self.assertEqual(result['regressions'][0]['seed'],1)
            for folder,contract in [(before,{'version':1}),(after,{'version':2})]:
                (folder/'manifest.json').write_text(json.dumps({'gameContract':contract}))
            with self.assertRaisesRegex(ValueError,'different game contracts'):
                compare_checkpoints(before,after)

if __name__=='__main__': unittest.main()
