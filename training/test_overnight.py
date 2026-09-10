import copy
import unittest
from overnight import gate


class GateTests(unittest.TestCase):
    def baseline(self):
        row={'deaths':0,'meanHealthLost':0,'meanRoomsVisited':2,'meanPositionsVisited':20,
             'maximumDepth':0,'reachedDeeperFloor':0}
        return {'policies':{'deterministic':copy.deepcopy(row),'sampled':copy.deepcopy(row)}}
    def test_more_positions_alone_does_not_promote(self):
        a=self.baseline(); b=copy.deepcopy(a)
        b['policies']['sampled']['meanPositionsVisited']=100
        self.assertFalse(gate(a,b)['advance'])
    def test_progress_with_damage_regression_is_rejected(self):
        a=self.baseline(); b=copy.deepcopy(a)
        b['policies']['sampled'].update(meanRoomsVisited=4,meanHealthLost=2)
        self.assertTrue(gate(a,b)['regression'])
        self.assertFalse(gate(a,b)['advance'])
    def test_room_gain_without_regression_can_continue(self):
        a=self.baseline(); b=copy.deepcopy(a)
        b['policies']['sampled']['meanRoomsVisited']=3
        self.assertTrue(gate(a,b)['advance'])

class ControllerTests(unittest.TestCase):
    def run_guard(self, remaining, free):
        import argparse
        import json
        from pathlib import Path
        import tempfile
        import time
        from unittest.mock import patch
        import overnight
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            args=argparse.Namespace(root=root,name='test',deadline=time.time()+remaining)
            with patch.object(overnight,'report',return_value=GateTests().baseline()), \
                 patch.object(overnight.subprocess,'check_output',return_value='test-revision'), \
                 patch.object(overnight.subprocess,'Popen') as spawn, \
                 patch.object(overnight.shutil,'disk_usage',return_value=argparse.Namespace(free=free)):
                if free==0 and remaining>3600:
                    with self.assertRaisesRegex(RuntimeError,'free disk'): overnight.run(args)
                else: overnight.run(args)
                spawn.assert_not_called()
            return json.loads((root/'test/status.json').read_text())

    def test_expired_deadline_never_starts_training(self):
        result=self.run_guard(-1,10*1024**3)
        self.assertEqual(result['status'],'complete')
        self.assertEqual(result['rounds'],[])

    def test_low_disk_stops_and_preserves_reference(self):
        result=self.run_guard(7200,0)
        self.assertEqual(result['status'],'stopped')
        self.assertTrue(result['selectedModel'].endswith('navigation-model-001/final.zip'))

class AdaptiveTests(unittest.TestCase):
    def test_regression_rolls_back_with_smaller_updates(self):
        from overnight import adaptive_retry
        retry,rate=adaptive_retry(1e-5,{'regression':True},0)
        self.assertTrue(retry)
        self.assertEqual(rate,5e-6)

    def test_neutral_patience_and_minimum(self):
        from overnight import adaptive_retry
        self.assertEqual(adaptive_retry(1e-5,{'regression':False},1),(False,1e-5))
        self.assertEqual(adaptive_retry(1e-5,{'regression':False},2),(True,5e-6))
        self.assertEqual(adaptive_retry(1.25e-6,{'regression':True},0),(True,1.25e-6))


if __name__=='__main__': unittest.main()


class DiagnosticTests(unittest.TestCase):
    def test_evaluation_only_never_trains_or_promotes(self):
        import argparse,json,tempfile,time
        from pathlib import Path
        from unittest.mock import patch,MagicMock
        import overnight
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); reference=root/'reference'; reference.mkdir()
            (reference/'manifest.json').write_text(json.dumps({'budget':512,'heldOutSeeds':list(range(16))}))
            args=argparse.Namespace(root=root,name='diagnostic',deadline=time.time()+7200,
                source_model=root/'preserved.zip',source_evaluation=reference,evaluation_only=root/'comparison.zip')
            proc=MagicMock(); proc.poll.return_value=0; proc.returncode=0; proc.pid=123456
            with patch.object(overnight.subprocess,'check_output',return_value='revision'), \
                 patch.object(overnight.subprocess,'Popen',return_value=proc) as spawn, \
                 patch.object(overnight,'memory_ok',return_value=True), \
                 patch.object(overnight.shutil,'disk_usage',return_value=argparse.Namespace(free=10*1024**3)), \
                 patch.object(overnight.os,'killpg'), patch.object(overnight,'report',return_value={}):
                overnight.run(args)
            command=spawn.call_args.args[0]
            self.assertIn('--evaluate',command)
            self.assertNotIn('--resume',command)
            self.assertEqual(command[command.index('--eval-seeds')+1],'16')
            state=json.loads((root/'diagnostic/status.json').read_text())
            self.assertEqual(state['selectedModel'],str(root/'preserved.zip'))
            self.assertEqual(state['rounds'],[])
            self.assertEqual(state['status'],'complete')
