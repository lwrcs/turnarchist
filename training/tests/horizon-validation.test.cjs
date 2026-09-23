'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), cp = require('node:child_process');
const V = require('../horizon-validate.cjs'), Smoke = require('../horizon-browser-smoke.js'), P = require(process.env.HORIZON_HEALTH_MODULE);
test('Node engine gate matches the reported supported interval exactly', () => {
  assert.equal(V.runtimeMatches('v22.23.2', '>=22.23.2 <23'), true);
  for (const version of ['v22.23.1', 'v22.16.0', 'v23.0.0', 'v20.99.9']) assert.equal(V.runtimeMatches(version, '>=22.23.2 <23'), false);
  assert.equal(V.runtimeMatches('v22.24.0', '>=22.23.2 <23'), true);
  assert.equal(V.runtimeMatches('v22.24.0', 'an unknown engine contract'), false);
});
test('validation CLI rejects ambiguous or relative output and unknown flags', () => {
  for (const args of [[], ['--out'], ['--out', 'report.json'], ['--guess'], ['--out', path.resolve(__dirname, 'report.json')]]) assert.throws(() => V.parseArgs(args));
  assert.equal(V.parseArgs(['--out', path.join(os.tmpdir(), 'horizon-report.json'), '--bootstrap']).bootstrap, true);
});
test('an explicit Python path with spaces is one argument, not shell code', () => {
  assert.deepEqual(V.pythonCandidates('/tmp/has spaces/bin/python'), [['/tmp/has spaces/bin/python']]);
});
test('bundle preflight detects missing files, stale markers and stale source timestamps', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-bundle-test-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(V.bundleFresh(root).ok, false); fs.mkdirSync(path.join(root, 'dist')); fs.mkdirSync(path.join(root, 'src/game'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/globalStateManager'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/globalStateManager/IdGenerator.ts'), 'checkpoint');
  const bundle = path.join(root, 'dist/bundle.js'); fs.writeFileSync(bundle, 'old'); assert.equal(V.bundleFresh(root).ok, false);
  for (const name of ['agentPlanning.ts', 'agentEnvironment.ts']) fs.writeFileSync(path.join(root, 'src/game', name), 'fixture');
  fs.writeFileSync(bundle, 'turnarchist-planning-snapshot-v3 getPlanningCapabilities'); fs.utimesSync(bundle, 100, 100); assert.equal(V.bundleFresh(root).ok, false);
  fs.utimesSync(bundle, new Date(Date.now() + 1000), new Date(Date.now() + 1000)); assert.equal(V.bundleFresh(root).ok, true);
});
test('snapshot diagnostics retain special-value paths, not whole game state', () => {
  const wire = { format: P.PLANNING_FORMAT, codec: P.PLANNING_CODEC, data: P.planningEncode({ fingerprint: { optional: undefined, limit: Infinity } }) };
  const facts = Smoke.snapshotFacts({ schemaVersion: 3, serialized: JSON.stringify(wire) });
  assert.equal(facts.specialValueCounts.undefined, 1); assert.equal(facts.specialValueCounts['+Infinity'], 1);
  assert.deepEqual(facts.specialValueSamples[0], { path: '/fingerprint/limit', type: '+Infinity' });
  assert.ok(!Object.hasOwn(facts, 'serialized'));
});
test('coordinator writes a blocked report and final diff evidence after a preflight failure', t => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-report-test-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const root = path.join(parent, 'checkout'), output = path.join(parent, 'result.json');
  fs.mkdirSync(path.join(root, 'training'), { recursive: true });
  fs.copyFileSync(path.resolve(__dirname, '../horizon-validate.cjs'), path.join(root, 'training/horizon-validate.cjs'));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ engines: { node: 'unsupported-fixture-contract' } }));
  const init = cp.spawnSync('git', ['init', root], { encoding: 'utf8' });
  assert.equal(init.status, 0, init.stderr);
  const result = cp.spawnSync(process.execPath, [path.join(root, 'training/horizon-validate.cjs'), '--out', output], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(report.status, 'BLOCKED'); assert.equal(report.pass, false); assert.equal(report.error.phase, 'runtime');
  for (const name of ['diff-check', 'diff-stat', 'status']) { assert.equal(report.steps[name].pass, true); assert.ok(fs.existsSync(report.steps[name].log)); }
  assert.equal(report.steps.unit, undefined); // Preflight did not spend work on a doomed test run.
});

test('coordinator embeds actual browser case details instead of only a local pathname', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-inline-report-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'browser.json'), expected = { pass: false, runs: [{ scenario: 'standard', seed: 1, pass: true },
    { scenario: 'cave', seed: 2, pass: false, error: { code: 'PLANNING_FINGERPRINT_MISMATCH', path: '/fingerprint/playerFingerprints/0/roomPathId', details: { expected: 'R-1', actual: 'R-2' } } }] };
  fs.writeFileSync(file, JSON.stringify(expected)); assert.deepEqual(V.readBrowserReport(file), expected);
});
test('failure evidence contains selected source and bounded log tails, not arbitrary files', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'horizon-evidence-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'src/game'), { recursive: true }); fs.writeFileSync(path.join(dir, 'src/game/agentPlanning.ts'), 'fixture source');
  fs.writeFileSync(path.join(dir, 'secrets.env'), 'DO_NOT_COPY'); const log = path.join(dir, 'log'); fs.writeFileSync(log, 'X'.repeat(20000) + 'END');
  const evidence = V.repairEvidence(dir, { pass: false, steps: { browser: { log } }, browser: { runs: [{ pass: false }] } });
  assert.equal(evidence.sources.find(x => x.path === 'src/game/agentPlanning.ts').content, 'fixture source');
  assert.ok(!JSON.stringify(evidence).includes('DO_NOT_COPY')); assert.ok(evidence.logTails.browser.length <= 16000); assert.ok(evidence.logTails.browser.endsWith('END'));
});

test('actual-game acceptance requires all four original cases, not only passing standard cases', () => {
  const runs = ['standard', 'cave'].flatMap(scenario => [1, 2].map(seed => ({ scenario, seed, pass: true })));
  assert.equal(V.browserCoverage({ pass: true, runs }).pass, true);
  for (const candidate of [{ pass: true, runs: runs.slice(0, 2) }, { pass: true, runs: [] },
    { pass: true, runs: [...runs, runs[0]] }, { pass: false, runs }, { pass: true, runs: runs.map((r, i) => i === 3 ? { ...r, pass: false } : r) }]) {
    assert.equal(V.browserCoverage(candidate).pass, false);
  }
});
