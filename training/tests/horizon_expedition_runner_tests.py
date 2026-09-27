"""Tests the actual-game launcher without launching or claiming a game run."""
import importlib.util,json,sys,tempfile,unittest,io,contextlib
from pathlib import Path
from unittest.mock import patch,MagicMock
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'training'))
import horizon_expedition_smoke as m
class RunnerTests(unittest.TestCase):
 def invoke(self,out,*args,result=None):
  server=MagicMock();server.server_address=('127.0.0.1',32100)
  with patch.object(sys,'argv',['test','--out',str(out),*args]),patch.object(m,'ThreadingHTTPServer',return_value=server),patch.object(m.threading,'Thread'),patch.object(m.supervisor,'execute_case',return_value=result or {'pass':True}) as call:
   with contextlib.redirect_stdout(io.StringIO()):status=m.main()
  return status,call
 def test_defaults_reference_and_original_worker_deadlines(self):
  with tempfile.TemporaryDirectory() as d:
   status,call=self.invoke(Path(d)/'r.json');q=call.call_args.args[0];self.assertEqual(status,0);self.assertIn('driver=reference',q['url']);self.assertEqual(q['caseTimeoutMs'],180000);self.assertEqual(q['operationTimeoutMs'],30000)
 def test_route_first_and_requested_seeds_forwarded_exactly(self):
  with tempfile.TemporaryDirectory() as d:
   status,call=self.invoke(Path(d)/'r.json','--mode','route-first','--seeds','1','15');self.assertEqual(status,0);self.assertEqual([x.args[0]['seed'] for x in call.call_args_list],[1,15]);self.assertIn('driver=route-first',call.call_args.args[0]['url'])
 def test_error_case_never_marked_pass_and_writes_evidence(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)/'r.json';status,_=self.invoke(out,result={'pass':False,'error':{'code':'DIVERGENCE'}});self.assertEqual(status,1);data=json.loads(Path(str(out)+'.evidence.json').read_text());self.assertEqual(data['report']['runs'][0]['error']['code'],'DIVERGENCE');self.assertFalse(data['report']['pass'])
 def test_existing_output_not_overwritten(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)/'r.json';out.write_text('keep');
   with self.assertRaises(SystemExit):self.invoke(out)
   self.assertEqual(out.read_text(),'keep')
 def test_duplicate_or_negative_seeds_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaises(SystemExit):self.invoke(Path(d)/'r.json','--seeds','1','1')
   with self.assertRaises(SystemExit):self.invoke(Path(d)/'r2.json','--seeds','-1')
 def test_failure_evidence_contains_only_the_explicit_source_allowlist(self):
  with tempfile.TemporaryDirectory() as d:
   out=Path(d)/'r.json';self.invoke(out,result={'pass':False});data=json.loads(Path(str(out)+'.evidence.json').read_text());allowed={'agent-horizon-host.js','agent-horizon-controller.js','agent-horizon-world.js','agent-horizon-driver.js','agent-horizon-expedition.js','training/horizon-expedition-smoke.js'};self.assertTrue({s['path'] for s in data['sources']}<=allowed)
if __name__=='__main__':unittest.main()
