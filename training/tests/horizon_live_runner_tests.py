"""Unit tests for the additional live suite. They do not claim actual-game coverage."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import horizon_live_smoke as live

class Server:
    server_address=('127.0.0.1',12345)
    def __init__(self,*args,**kwargs):pass
    def serve_forever(self):pass
    def shutdown(self):pass
    def server_close(self):pass

class LiveRunnerTests(unittest.TestCase):
    def invoke(self,out,extra=(),result=None):
        argv=['horizon_live_smoke.py','--out',str(out),*extra]
        if result is None:result=lambda req,_:{'seed':req['seed'],'scenario':req['scenario'],'pass':True,'status':'PASS'}
        with patch.object(sys,'argv',argv),patch.object(live,'ThreadingHTTPServer',Server),patch.object(live.supervisor,'execute_case',side_effect=result) as call,contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):
            code=live.main()
        return code,call
    def test_defaults_are_explicit_standard_one_not_broad_certification(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json';code,call=self.invoke(out);data=json.loads(out.read_text())
            self.assertEqual(code,0);self.assertEqual(data['coverage'],{'seeds':[1],'scenarios':['standard']});self.assertEqual(call.call_count,1)
    def test_any_requested_failure_fails_total_report(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json';code,_=self.invoke(out,['--seeds','1','2','--scenarios','standard','cave'],lambda req,_:{'seed':req['seed'],'scenario':req['scenario'],'pass':req['scenario']!='cave'})
            self.assertEqual(code,1);self.assertEqual(len(json.loads(out.read_text())['runs']),4)
    def test_defaults_do_not_raise_original_worker_deadlines(self):
        with tempfile.TemporaryDirectory() as d:
            code,call=self.invoke(Path(d)/'r.json');req=call.call_args.args[0]
            self.assertEqual(req['caseTimeoutMs'],180000);self.assertEqual(req['operationTimeoutMs'],30000);self.assertTrue(req['url'].endswith('/horizon-live-validation.html'))
    def test_multi_room_is_explicit_and_retains_original_deadlines(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json';code,call=self.invoke(out,['--multi-room','--seeds','1','15'])
            self.assertEqual(code,0);self.assertEqual(call.call_count,2)
            self.assertEqual(json.loads(out.read_text())['suite'],'horizon-rooms-browser-v1')
            for entry in call.call_args_list:
                req=entry.args[0];self.assertTrue(req['url'].endswith('/horizon-room-validation.html'))
                self.assertEqual(req['caseTimeoutMs'],180000);self.assertEqual(req['operationTimeoutMs'],30000)
    def test_multi_room_failure_is_not_substituted_with_initial_room_success(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json';code,_=self.invoke(out,['--multi-room'],lambda req,_:{'pass':False,'error':{'code':'PLANNING_OBSERVATION_MISMATCH'}})
            self.assertEqual(code,1);self.assertFalse(json.loads(out.read_text())['pass'])
    def test_existing_output_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json';out.write_text('keep')
            with self.assertRaises(SystemExit):self.invoke(out)
            self.assertEqual(out.read_text(),'keep')
    def test_bad_or_duplicate_seeds_reject_without_workers(self):
        for extra in [['--seeds','-1'],['--seeds','1','1'],['--scenarios','cave','cave']]:
            with tempfile.TemporaryDirectory() as d,self.assertRaises(SystemExit):self.invoke(Path(d)/'r.json',extra)
    def test_worker_exception_is_retained_in_failure_report(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'r.json'
            def fail(*_):raise RuntimeError('worker-boom')
            code,_=self.invoke(out,result=fail);self.assertEqual(code,1);self.assertEqual(json.loads(out.read_text())['error']['message'],'worker-boom')
    def test_relative_output_is_rejected(self):
        with self.assertRaises(SystemExit):self.invoke(Path('relative-report.json'))

if __name__=='__main__':unittest.main()
