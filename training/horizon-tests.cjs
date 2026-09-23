/* Deterministic local verification. Does not invoke npm install, an LLM, or a game build. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const root = path.resolve(__dirname, '..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'turnarchist-horizon-'));
const cli = process.argv.slice(2);
let emit = null;
try {
  if (cli.length) {
    if (cli.length !== 2 || cli[0] !== '--emit-fixtures' || !path.isAbsolute(cli[1])) throw new Error('Usage: horizon-tests.cjs [--emit-fixtures NEW_ABSOLUTE_DIRECTORY]');
    emit = path.resolve(cli[1]);
    if (emit === root || emit.startsWith(root + path.sep) || fs.existsSync(emit)) throw new Error('Fixture output must be a new directory outside the checkout');
  }
  const localTsc = path.join(root, 'node_modules/typescript/bin/tsc');
  const installed = path.join(root, 'src/game/agentEnvironment.ts');
  let methods;
  if (fs.existsSync(installed)) {
    const text = fs.readFileSync(installed, 'utf8').replace(/\r\n/g, '\n');
    const start = text.indexOf('  /** Versioned privileged continuation;');
    const end = text.indexOf('  getUiLayout()', start);
    if (start < 0 || end < 0) throw new Error('Installed planning methods not found');
    methods = text.slice(start, end);
  } else { throw new Error('Required src/game/agentEnvironment.ts is missing; do not substitute a synthetic production source'); }

  const dir = path.join(temporary, 'game'); fs.mkdirSync(dir);
  const globalDir = path.join(temporary, 'globalStateManager'); fs.mkdirSync(globalDir);
  const allocator = path.join(globalDir, 'IdGenerator.ts');
  fs.copyFileSync(path.join(root, 'src/globalStateManager/IdGenerator.ts'), allocator);
  const helper = path.join(dir, 'agentPlanning.ts'), harness = path.join(dir, 'EngineHarness.ts');
  fs.copyFileSync(path.join(root, 'src/game/agentPlanning.ts'), helper);
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningWarnings.ts'), path.join(dir, 'agentPlanningWarnings.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningInteraction.ts'), path.join(dir, 'agentPlanningInteraction.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningPaths.ts'), path.join(dir, 'agentPlanningPaths.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningEmptyLoot.ts'), path.join(dir, 'agentPlanningEmptyLoot.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningAttachedLoot.ts'), path.join(dir, 'agentPlanningAttachedLoot.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningResources.ts'), path.join(dir, 'agentPlanningResources.ts'));
  fs.copyFileSync(path.join(root, 'src/game/agentPlanningSpawners.ts'), path.join(dir, 'agentPlanningSpawners.ts'));
  fs.writeFileSync(harness, fs.readFileSync(path.join(__dirname, 'tests/horizon-engine-harness.txt'), 'utf8').replace('/*__METHODS__*/', methods));
  const tsRoot = fs.existsSync(localTsc) ? path.join(root, 'node_modules/typescript') :
    path.join(cp.execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim(), 'typescript');
  const ts = require(tsRoot);
  console.log('Harness compiler: TypeScript ' + ts.version);
  const source = ts.createSourceFile('agentEnvironment.ts', fs.readFileSync(installed, 'utf8'), ts.ScriptTarget.Latest, true);
  const cls = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'AgentEnvironment');
  if (!cls) throw new Error('AgentEnvironment class missing');
  const methodNames = ['captureSimulationSnapshot', 'restoreSimulationSnapshot', 'restoreDiagnosticSandbox', 'reset'];
  const lifecycle = methodNames.map(name => {
    const matches = cls.members.filter(member => member.name?.getText(source) === name);
    if (matches.length !== 1) throw new Error('Missing/duplicate lifecycle method ' + name);
    return matches[0].getText(source);
  }).join('\n');
  const lifecycleFile = path.join(dir, 'LifecycleHarness.ts');
  fs.writeFileSync(lifecycleFile, fs.readFileSync(path.join(__dirname, 'tests/horizon-lifecycle-harness.txt'), 'utf8')
    .replace('/*__METHODS__*/', methods).replace('/*__LIFECYCLE__*/', lifecycle));
  const liveNames = ['inspectHorizonRoom', 'horizonDispatch', 'stepForHorizon', 'getHorizonExecutionCapabilities', 'assertHorizonDispatch',
    'step', 'exclusive', 'getPlanningGuard', 'planningGuardValue', 'planningContext'];
  const liveMethods = liveNames.map(name => {
    const entries = cls.members.filter(member => member.name?.getText(source) === name);
    if (entries.length !== 1) throw new Error('Missing live execution method: ' + name);
    return entries[0].getText(source);
  }).join('\n');
  const liveFile = path.join(dir, 'LiveHarness.ts');
  fs.writeFileSync(liveFile, fs.readFileSync(path.join(__dirname, 'tests/horizon-live-harness.txt'), 'utf8').replace('/*__LIVE_METHODS__*/', liveMethods));
  const config = path.join(temporary, 'tsconfig.json');
  fs.writeFileSync(config, JSON.stringify({ compilerOptions: { strict: true, target: 'ES2020', module: 'commonjs',
    lib: ['ES2020', 'DOM'], types: [], typeRoots: [], skipLibCheck: true, outDir: temporary }, files: [helper, harness, allocator, lifecycleFile, liveFile] }));
  const args = ['--project', config];
  const compilation = fs.existsSync(localTsc)
    ? cp.spawnSync(process.execPath, [localTsc, ...args], { stdio: 'inherit' })
    : cp.spawnSync(process.platform === 'win32' ? 'tsc.cmd' : 'tsc', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (compilation.error || compilation.status !== 0) throw new Error('Local TypeScript compiler required; compilation failed. No automatic installation was attempted.');
  if (emit) {
    fs.cpSync(temporary, emit, { recursive: true, errorOnExist: true, force: false });
    console.log(JSON.stringify({ status: 'SYNTHETIC_FIXTURES_COMPILED_NOT_TESTED', output: emit, typescript: ts.version }));
  } else {
  const tests = fs.readdirSync(path.join(__dirname, 'tests')).filter(name => /^horizon-.*\.test\.cjs$/.test(name)).sort().map(name => path.join(__dirname, 'tests', name));
  const result = cp.spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit', env: { ...process.env,
    HORIZON_PATH_CACHE_MODULE: path.join(temporary, 'game/agentPlanningPaths.js'),
    HORIZON_SPAWNER_MODULE: path.join(temporary, 'game/agentPlanningSpawners.js'),
    HORIZON_EMPTY_LOOT_MODULE: path.join(temporary, 'game/agentPlanningEmptyLoot.js'),
    HORIZON_ATTACHED_LOOT_MODULE: path.join(temporary, 'game/agentPlanningAttachedLoot.js'),
    HORIZON_INTERACTION_MODULE: path.join(temporary, 'game/agentPlanningInteraction.js'), HORIZON_WARNING_MODULE: path.join(temporary, 'game/agentPlanningWarnings.js'), HORIZON_LIVE_MODULE: path.join(temporary, 'game/LiveHarness.js'), HORIZON_HEALTH_MODULE: path.join(temporary, 'game/agentPlanning.js'), HORIZON_ENGINE_MODULE: path.join(temporary, 'game/EngineHarness.js'), HORIZON_ID_MODULE: path.join(temporary, 'globalStateManager/IdGenerator.js'), HORIZON_LIFECYCLE_MODULE: path.join(temporary, 'game/LifecycleHarness.js') } });
  process.exitCode = result.status ?? 1;
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { fs.rmSync(temporary, { recursive: true, force: true }); }
