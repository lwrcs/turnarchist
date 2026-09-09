import json
from pathlib import Path
import tempfile
import unittest
from dungeon_report import report,summary


class ReportTests(unittest.TestCase):
    def row(self):
        return {'seed':1,'rotation':0,'status':'budget-incomplete','maxDepth':0,'initialDepth':0,
                'roomsVisited':2,'positionsVisited':12,'healthLost':0,'gameActions':32,'helperActions':2}

    def test_survivor_is_incomplete_not_victory(self):
        result=summary([self.row()])
        self.assertEqual(result['budgetIncomplete'],1)
        self.assertEqual(result['reachedDeeperFloor'],0)
        self.assertNotIn('wins',result)

    def test_mismatched_budget_rejected_before_comparison(self):
        with tempfile.TemporaryDirectory() as temp:
            a,b=Path(temp)/'a',Path(temp)/'b'
            a.mkdir(); b.mkdir()
            data={k:1 for k in ['encoder','reward','helper','gameContract','budget','heldOutSeeds']}
            (a/'manifest.json').write_text(json.dumps(data))
            data['budget']=2
            (b/'manifest.json').write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError,'budget'): report(a,b)

    def test_damage_increase_counts_as_regression(self):
        with tempfile.TemporaryDirectory() as temp:
            a,b=Path(temp)/'a',Path(temp)/'b'
            a.mkdir(); b.mkdir()
            manifest={k:1 for k in ['encoder','reward','helper','gameContract','budget','heldOutSeeds']}
            for path in [a,b]: (path/'manifest.json').write_text(json.dumps(manifest))
            for name in ['random','deterministic','sampled']:
                (a/f'{name}-evaluation.json').write_text(json.dumps([self.row()]))
                row=self.row(); row['healthLost']=1
                (b/f'{name}-evaluation.json').write_text(json.dumps([row]))
            result=report(b,a)
            self.assertEqual(result['policies']['deterministic']['paired']['healthLost']['worsened'],1)


if __name__=='__main__': unittest.main()
