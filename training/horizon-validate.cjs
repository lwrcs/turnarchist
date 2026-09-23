#!/usr/bin/env node
/* Local validation coordinator. No LLM calls, training, git mutations or browser downloads. */
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
function parseArgs(args) {
  const options = { bootstrap: false, rebuild: false, smokeOnly: false, caseTimeoutMs: 180000, operationTimeoutMs: 30000 };
  const values = { '--out': 'out', '--python': 'python', '--chromium': 'chromium', '--case-timeout-ms': 'caseTimeoutMs', '--operation-timeout-ms': 'operationTimeoutMs' };
  const flags = { '--bootstrap': 'bootstrap', '--rebuild': 'rebuild', '--smoke-only': 'smokeOnly' };
  for (let i = 0; i < args.length; i++) {
    if (flags[args[i]]) options[flags[args[i]]] = true;
    else if (values[args[i]]) { const key = values[args[i]]; if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Missing value: ' + args[i]); options[key] = args[++i]; }
    else throw new Error('Unknown option: ' + args[i]);
  }
  if (!options.out || !path.isAbsolute(options.out)) throw new Error('Use --out with a NEW absolute report.json path outside the checkout');
  options.out = path.resolve(options.out);
  if (options.out === root || options.out.startsWith(root + path.sep)) throw new Error('Validation reports must be outside the checkout');
  for (const [name, minimum, maximum] of [['caseTimeoutMs', 1000, 1800000], ['operationTimeoutMs', 1, 120000]]) {
    if (!/^\d+$/.test(String(options[name]))) throw new Error('Invalid ' + name);
    options[name] = Number(options[name]);
    if (!Number.isSafeInteger(options[name]) || options[name] < minimum || options[name] > maximum) throw new Error('Invalid ' + name);
  }
  return options;
}
function runtimeMatches(version, requirement) {
  const match = /^>=(\d+)\.(\d+)\.(\d+)\s+<(\d+)$/.exec(requirement || '');
  const actual = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match || !actual) return false;
  const [major, minor, patch] = actual.slice(1).map(Number), [lowMajor, lowMinor, lowPatch, highMajor] = match.slice(1).map(Number);
  return major < highMajor && (major > lowMajor || (major === lowMajor && (minor > lowMinor || (minor === lowMinor && patch >= lowPatch))));
}
function pythonCandidates(explicit, env = process.env) {
  if (explicit) return [[explicit]];
  const list = [];
  for (const value of [env.HORIZON_PYTHON, env.VIRTUAL_ENV && path.join(env.VIRTUAL_ENV, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
    '/private/tmp/turnarchist-horizon-validation-venv/bin/python', path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')]) {
    if (value && !list.some(item => item[0] === value)) list.push([value]);
  }
  list.push(['python3'], ['python']); if (process.platform === 'win32') list.push(['py', '-3']);
  return list;
}
function probePython(command) {
  const code = 'import sys,json,importlib.util; print(json.dumps({"version":list(sys.version_info[:3]),"executable":sys.executable,"playwright":importlib.util.find_spec("playwright") is not None}))';
  const r = cp.spawnSync(command[0], [...command.slice(1), '-c', code], { encoding: 'utf8', timeout: 10000 });
  if (r.error || r.status !== 0) return null;
  try { const info = JSON.parse(r.stdout.trim()); return info.version[0] === 3 && info.version[1] >= 10 ? { command, ...info } : null; } catch { return null; }
}
function bundleFresh(base = root) {
  const file = path.join(base, 'dist/bundle.js');
  if (!fs.existsSync(file)) return { ok: false, reason: 'missing dist/bundle.js' };
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('turnarchist-planning-snapshot-v3') || !text.includes('getPlanningCapabilities')) return { ok: false, reason: 'bundle lacks v3 reconstruction/capability markers' };
  const built = fs.statSync(file).mtimeMs;
  const newer = ['src/game/agentPlanning.ts', 'src/game/agentEnvironment.ts', 'src/globalStateManager/IdGenerator.ts'].filter(name => !fs.existsSync(path.join(base, name)) || fs.statSync(path.join(base, name)).mtimeMs > built);
  return { ok: !newer.length, reason: newer.length ? 'source newer than bundle: ' + newer.join(', ') : 'v3 markers and timestamps present' };
}
function readBrowserReport(file) {
  if (fs.statSync(file).size > 8 * 1024 * 1024) throw new Error('BROWSER_REPORT_SIZE: retain the external report; refusing an unbounded inline attachment');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function recoverBrowserReport(file) {
  const runs = [];
  for (const scenario of ['standard', 'cave']) for (const seed of [1, 2]) {
    const directory = file + '.cases/' + scenario + '-' + seed;
    let recovered = null, accepted = false;
    for (const name of ['accepted-result.json', 'result.json']) {
      try { const candidate = readBrowserReport(path.join(directory, name));
        if (candidate?.seed === seed && candidate?.scenario === scenario) { recovered = candidate; accepted = name === 'accepted-result.json'; break; } }
      catch {}
    }
    if (!recovered) {
      try { const fd = fs.openSync(path.join(directory, 'progress.jsonl'), 'r');
        try { const size = fs.fstatSync(fd).size, buffer = Buffer.alloc(Math.min(size, 1048576));
          fs.readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length));
          for (const line of buffer.toString('utf8').split('\n')) { try { const event = JSON.parse(line);
            if (event.type === 'progress' && event.report?.seed === seed && event.report?.scenario === scenario) recovered = event.report;
          } catch {} }
        } finally { fs.closeSync(fd); }
      } catch {}
    }
    if (recovered) {
      if (!accepted) recovered = { ...recovered, pass: false, status: 'FAIL', partialProgressRetained: true,
        underlyingError: recovered.error || null, error: { code: 'SMOKE_RUNNER_INCOMPLETE', message: 'Case did not receive supervisor acceptance; retained partial worker evidence' } };
      runs.push({ ...recovered, workerLog: path.join(directory, 'worker.log'), progressJournal: path.join(directory, 'progress.jsonl') });
    }
  }
  return { schemaVersion: 3, suite: 'horizon-real-browser-v3', pass: false, phase: 'coordinator-recovery', recovered: true, runs,
    error: { code: 'SMOKE_RUNNER_INCOMPLETE', message: 'Runner did not produce a complete report; partial cases are not whole-suite acceptance' } };
}
function browserCoverage(browser) {
  const required = ['standard:1', 'standard:2', 'cave:1', 'cave:2'];
  const runs = Array.isArray(browser?.runs) ? browser.runs : [];
  const missing = required.filter(key => runs.filter(run => `${run.scenario}:${run.seed}` === key && run.pass === true).length !== 1);
  return { pass: browser?.pass === true && missing.length === 0 && runs.length === required.length, required, missing, runs: runs.length };
}
function repairEvidence(base, report) {
  const files = ['src/game/agentEnvironment.ts', 'src/game/agentPlanning.ts', 'src/globalStateManager/IdGenerator.ts',
    'agent-horizon-host.js', 'agent-simulation-host.js', 'horizon-smoke.html', 'training/horizon-browser-smoke.js',
    'training/horizon-smoke-session.js', 'training/horizon_smoke.py', 'src/game/actionReadiness.ts',
    'src/game/agentMode.ts', 'src/game.ts', 'src/level/sidePathManager.ts'];
  const rootReal = fs.realpathSync(base), sources = [];
  for (const relative of files) {
    try {
      const file = fs.realpathSync(path.join(base, relative));
      if (!file.startsWith(rootReal + path.sep)) { sources.push({ path: relative, error: 'source resolves outside checkout' }); continue; }
      if (fs.statSync(file).size > 1024 * 1024) { sources.push({ path: relative, error: 'source exceeds 1 MiB evidence bound' }); continue; }
      const content = fs.readFileSync(file);
      sources.push({ path: relative, sha256: crypto.createHash('sha256').update(content).digest('hex'), content: content.toString('utf8') });
    } catch (error) { sources.push({ path: relative, error: String(error.code || error.message) }); }
  }
  const logTails = {};
  for (const [name, step] of Object.entries(report.steps || {})) {
    try {
      const fd = fs.openSync(step.log, 'r');
      try { const size = fs.fstatSync(fd).size, buffer = Buffer.alloc(Math.min(size, 16000));
        fs.readSync(fd, buffer, 0, buffer.length, Math.max(0, size - buffer.length)); logTails[name] = buffer.toString('utf8'); }
      finally { fs.closeSync(fd); }
    } catch { logTails[name] = 'Log unavailable'; }
  }
  const workerLogTails = {};
  for (const run of report.browser?.runs || []) {
    try { const buffer = fs.readFileSync(run.workerLog); workerLogTails[`${run.scenario}:${run.seed}`] = buffer.subarray(-12000).toString('utf8'); }
    catch { /* A killed worker may never have opened its log. */ }
  }
  return { format: 'horizon-repair-evidence-v2', privacy: 'Contains selected project source. Review before sharing. No environment dump, credentials, or full game snapshots are collected.',
    coordinator: report, sources, logTails, workerLogTails };
}
function main() {
  const options = parseArgs(process.argv.slice(2)), logDir = options.out + '.logs';
  if (fs.existsSync(options.out) || fs.existsSync(logDir)) throw new Error('Report or logs already exist; select a new output path');
  fs.mkdirSync(path.dirname(options.out), { recursive: true }); fs.mkdirSync(logDir);
  const report = { schemaVersion: 3, suite: 'horizon-validation-v3', pass: false, phase: 'runtime',
    root, node: process.version, steps: {}, logs: logDir, startedAt: new Date().toISOString() };
  function run(name, command, args, timeout = 180000) {
    const log = path.join(logDir, name + '.log'), fd = fs.openSync(log, 'wx'); let result;
    try { result = cp.spawnSync(command, args, { cwd: root, stdio: ['ignore', fd, fd], timeout }); }
    finally { fs.closeSync(fd); }
    const step = { pass: !result.error && result.status === 0, status: result.status, signal: result.signal, log };
    if (result.error) step.error = String(result.error.message);
    report.steps[name] = step; return step;
  }
  function requireStep(name, command, args, timeout) {
    report.phase = name; const result = run(name, command, args, timeout);
    if (!result.pass) throw new Error(name + ' failed; inspect ' + result.log); return result;
  }
  const gitRead = args => { const r = cp.spawnSync('git', args, { cwd: root, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    report.requiredNode = pkg.engines?.node; report.head = gitRead(['rev-parse', 'HEAD']); report.upstream = gitRead(['rev-parse', 'origin/master']);
    if (!runtimeMatches(process.version, report.requiredNode)) throw new Error('NODE_VERSION: use the repository-required runtime ' + report.requiredNode + '; current ' + process.version);
    if (!options.smokeOnly) {
      requireStep('unit', process.execPath, ['training/horizon-tests.cjs']);
      requireStep('typecheck', process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false', '--skipLibCheck']);
    }
    report.phase = 'bundle';
    if (options.rebuild) requireStep('watch-cycle', process.execPath, ['training/horizon-watch-once.cjs'], 210000);
    report.bundle = bundleFresh();
    if (!report.bundle.ok) throw new Error('STALE_BUNDLE: ' + report.bundle.reason + '. Let the existing watcher finish, or rerun with --rebuild after confirming no other watcher owns this checkout.');
    report.phase = 'python';
    const candidates = pythonCandidates(options.python).map(probePython).filter(Boolean);
    let python = candidates.find(candidate => candidate.playwright);
    if (!python && options.bootstrap && candidates.length) {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'turnarchist-horizon-validation-'));
      const base = candidates[0].command;
      requireStep('venv-create', base[0], [...base.slice(1), '-m', 'venv', directory]);
      const executable = path.join(directory, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
      // This version is the user's already-working validation version, not a repository dependency.
      requireStep('venv-playwright', executable, ['-m', 'pip', 'install', '--disable-pip-version-check', 'playwright==1.63.0']);
      python = probePython([executable]); report.validationVenv = directory;
    }
    if (!python?.playwright) throw new Error('PYTHON_ENV: select the existing validation Python with --python, or use --bootstrap for an isolated temporary venv. No global/repository packages changed.');
    report.python = python;
    if (!options.smokeOnly) requireStep('runner-unit', python.command[0], [...python.command.slice(1), 'training/tests/horizon_runner_tests.py'], 120000);
    const smokeOut = path.join(logDir, 'browser-smoke.json');
    const args = [...python.command.slice(1), 'training/horizon_smoke.py', '--out', smokeOut,
      '--case-timeout-ms', String(options.caseTimeoutMs), '--operation-timeout-ms', String(options.operationTimeoutMs)];
    report.validationBudgets = { caseTimeoutMs: options.caseTimeoutMs, operationTimeoutMs: options.operationTimeoutMs, hostStepTimeoutMs: 3000 };
    report.productionPerformanceCertified = false;
    if (options.chromium) args.push('--chromium', options.chromium);
    report.phase = 'browser'; run('browser', python.command[0], args, 4 * (options.caseTimeoutMs + 150000) + 60000);
    report.browserReport = smokeOut;
    try { report.browser = readBrowserReport(smokeOut); }
    catch (error) { report.browserReportError = String(error.message || error); report.browser = recoverBrowserReport(smokeOut); }
    report.browserCoverage = browserCoverage(report.browser); report.browserPass = report.browserCoverage.pass;
    if (!report.steps.browser.pass || !report.browserPass) throw new Error('BROWSER_VALIDATION: inspect ' + (report.browserReport || report.steps.browser.log));
    report.phase = 'complete';
  } catch (error) { report.error = { phase: report.phase, message: String(error.message || error) }; }
  finally {
    // Always collect final diff evidence, even when a preceding gate fails.
    run('diff-check', 'git', ['diff', '--check']); run('diff-stat', 'git', ['diff', '--stat']); run('status', 'git', ['status', '--short']);
    report.pass = !report.error && !options.smokeOnly && ['unit', 'typecheck', 'runner-unit', 'browser', 'diff-check'].every(name => report.steps[name]?.pass === true) && report.browserPass === true;
    report.status = report.error ? 'BLOCKED' : options.smokeOnly ? 'BROWSER_ONLY_CHECKED' : report.pass ? 'PASS' : 'BLOCKED';
    report.finishedAt = new Date().toISOString();
    if (!report.pass) {
      report.evidenceFile = options.out + '.evidence.json';
      try { fs.writeFileSync(report.evidenceFile, JSON.stringify(repairEvidence(root, report), null, 2) + '\n', { flag: 'wx' }); }
      catch (error) { report.evidenceError = String(error.message || error); }
    }
    fs.writeFileSync(options.out, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: report.status, pass: report.pass, phase: report.phase, report: options.out, evidence: report.evidenceFile || null, error: report.error || null }));
    process.exitCode = report.pass || (!report.error && options.smokeOnly && report.steps['diff-check'].pass) ? 0 : 1;
  }
}
module.exports = { parseArgs, runtimeMatches, pythonCandidates, probePython, bundleFresh, readBrowserReport, repairEvidence, browserCoverage, recoverBrowserReport };
if (require.main === module) { try { main(); } catch (error) { console.error(String(error.message || error)); process.exitCode = 1; } }
