"""Transport/process tests. No real browser, game, package installation, or network."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('horizon_runner',Path(__file__).resolve().parents[1]/'horizon_smoke.py')
runner=importlib.util.module_from_spec(spec);spec.loader.exec_module(runner)

class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='h13-runner-test-');self.root=Path(self.temp.name)
        self.request={'seed':1,'scenario':'cave','caseTimeoutMs':100,'supervisorGraceSeconds':3,
                      'journal':str(self.root/'progress.jsonl'),'result':str(self.root/'result.json')}
    def tearDown(self):self.temp.cleanup()
    def worker(self,body):
        code='import json,time,sys;from pathlib import Path;r=json.loads(Path(sys.argv[1]).read_text());'+body
        return runner.execute_case(self.request,self.root,[sys.executable,'-c',code,str(self.root/'request.json')])
    def event(self):
        return {'type':'progress','report':{'seed':1,'scenario':'cave','pass':False,'phase':'two-action-continuation',
                                          'operation':{'name':'parity.down.child-restore'},'results':[{'name':'root restore','pass':True}]}}
    def test_output_is_exclusive(self):
        file=self.root/'out';runner.write_new(file,{'x':1})
        with self.assertRaises(FileExistsError):runner.write_new(file,{'x':2})
        self.assertEqual(json.loads(file.read_text()),{'x':1})
    def test_nonfinite_diagnostics_are_valid_report_json(self):
        text=json.dumps(runner.json_safe({'v':float('inf')}),allow_nan=False);self.assertIn('diagnosticNumber',text)
    def test_partial_last_journal_line_retains_previous_checkpoint(self):
        f=self.root/'journal';f.write_text(json.dumps(self.event())+'\n{"broken')
        self.assertEqual(runner.read_latest(f)['operation']['name'],'parity.down.child-restore')
    def test_missing_journal(self):self.assertIsNone(runner.read_latest(self.root/'missing'))
    def test_timeout_preserves_checks_but_never_success(self):
        old={**self.event()['report'],'pass':True,'error':{'code':'prior'}}
        r=runner.timeout_result(1,'cave','TIMEOUT',old)
        self.assertFalse(r['pass']);self.assertTrue(r['results'][0]['pass']);self.assertEqual(r['underlyingError']['code'],'prior')
    def test_explicit_browser_path_with_spaces(self):
        f=self.root/'chrome with spaces';f.write_text('fixture');self.assertEqual(runner.find_browser(str(f)),str(f.resolve()))
    def test_invalid_explicit_browser(self):
        with self.assertRaisesRegex(RuntimeError,'BROWSER_NOT_FOUND'):runner.find_browser(str(self.root/'missing'))
    def test_successful_worker(self):
        r=self.worker("Path(r['result']).write_text(json.dumps({'seed':1,'scenario':'cave','pass':True}))")
        self.assertTrue(r['pass']);self.assertEqual(r['workerExitCode'],0)
    def test_nonzero_exit_invalidates_even_successful_worker_report(self):
        r=self.worker("Path(r['result']).write_text(json.dumps({'seed':1,'scenario':'cave','pass':True}));sys.exit(7)")
        self.assertFalse(r['pass']);self.assertEqual(r['error']['code'],'SMOKE_WORKER_EXIT')
    def test_process_watchdog_retains_progress(self):
        event=json.dumps(self.event())+'\n'
        r=self.worker("Path(r['journal']).write_text("+repr(event)+");time.sleep(30)")
        self.assertFalse(r['pass']);self.assertEqual(r['error']['code'],'SMOKE_WORKER_TIMEOUT');self.assertTrue(r['results'][0]['pass'])
    def test_teardown_timeout_preserves_original_case_failure(self):
        body="Path(r['result']).write_text(json.dumps({'seed':1,'scenario':'cave','pass':False,'error':{'code':'PLANNING_FINGERPRINT_MISMATCH'}}));time.sleep(30)"
        r=self.worker(body);self.assertEqual(r['error']['code'],'PLANNING_FINGERPRINT_MISMATCH');self.assertEqual(r['teardownError']['code'],'SMOKE_WORKER_TIMEOUT')
    def test_malformed_worker_result(self):
        r=self.worker("Path(r['result']).write_text('broken')");self.assertFalse(r['pass']);self.assertEqual(r['error']['code'],'SMOKE_WORKER_EXIT')
    def test_wrong_case_cannot_claim_success(self):
        r=self.worker("Path(r['result']).write_text(json.dumps({'seed':999,'scenario':'cave','pass':True}))")
        self.assertFalse(r['pass']);self.assertEqual(r['seed'],1)
    def test_nonboolean_success_is_not_accepted(self):
        r=self.worker("Path(r['result']).write_text(json.dumps({'seed':1,'scenario':'cave','pass':'true'}))")
        self.assertFalse(r['pass'])

if __name__=='__main__':unittest.main(verbosity=2)
