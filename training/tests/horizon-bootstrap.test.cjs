/* The lifecycle under test is extracted from installed AgentEnvironment.ts.
 * World mechanics are synthetic. These tests isolate boot/reconstruction ordering;
 * they do not substitute for the four actual-game smoke cases. */
'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
function realm() {
  const context = vm.createContext({ console, structuredClone, setTimeout, clearTimeout, performance });
  const cache = new Map(), base = path.dirname(path.dirname(process.env.HORIZON_LIFECYCLE_MODULE));
  function load(file) {
    file = path.resolve(file); if (!file.endsWith('.js')) file += '.js';
    if (!file.startsWith(base + path.sep)) throw new Error('Fixture escaped compilation directory');
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    vm.runInContext('(function(module,exports,require){\n' + fs.readFileSync(file, 'utf8') + '\n})', context, { filename: file })(
      module, module.exports, specifier => load(path.resolve(path.dirname(file), specifier)));
    return module.exports;
  }
  return { ...load(process.env.HORIZON_LIFECYCLE_MODULE), planning: load(process.env.HORIZON_HEALTH_MODULE) };
}
const guard = agent => JSON.stringify(agent.getPlanningGuard());
const move = direction => ({ type: 'Move', direction });
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
async function source(scenario = 'cave', seed = 2) {
  const r = realm(), live = new r.LifecycleHarness();
  // Matches the smoke suite's repeated diagnostic reset, without copying its state.
  await live.reset(seed, { scenario, maxSteps: 64 });
  await live.reset(seed, { scenario, maxSteps: 64 });
  return { r, live, snapshot: live.capturePlanningSnapshot(), before: guard(live) };
}
function pendingBoot(child, r) {
  let resolve, reject, done = false;
  const completion = new Promise((yes, no) => { resolve = yes; reject = no; });
  child.game.pending = completion;
  const events = [], originalNew = child.game.newGame.bind(child.game);
  child.game.newGame = seed => { events.push(done ? 'new-after-boot' : 'new-during-boot'); originalNew(seed); };
  return { events, release() {
    if (done) return; done = true; events.push('boot-finished');
    // These are old-world allocations. Correct restoration rewinds only afterward.
    for (let i = 0; i < 23; i++) r.IdGenerator.generate('bootstrap');
    resolve();
  }, fail(error) { done = true; reject(error); } };
}

test('diagnostic restore waits for pending bootstrap before newGame or allocator restoration', { timeout: 2000 }, async () => {
  const s = await source(), r = realm(); r.simulationMode(true);
  const child = new r.LifecycleHarness(), boot = pendingBoot(child, r);
  const before = r.planning.planningJson(r.IdGenerator.captureSimulationState());
  const restoring = child.restorePlanningSnapshot(s.snapshot.serialized);
  // Attach a handler immediately so an old implementation's rejected comparison is observed.
  const settled = restoring.then(value => ({ value }), error => ({ error }));
  let premature;
  try {
    await flush(); premature = [...boot.events];
    assert.equal(child.busy, true, 'restore must own the episode while waiting');
    assert.equal(r.planning.planningJson(r.IdGenerator.captureSimulationState()), before, 'no replacement before bootstrap settles');
  } finally { boot.release(); await settled; }
  assert.deepEqual(premature, []);
  const outcome = await settled; if (outcome.error) throw outcome.error;
  assert.deepEqual(boot.events, ['boot-finished', 'new-after-boot']);
  assert.equal(guard(child), s.before); assert.equal(child.game.validateReferences(), true);
});

for (const scenario of ['cave', 'forest', 'combat-fixture']) for (const seed of [1, 2]) {
  test(`fresh ${scenario} seed ${seed}: old-world callbacks cannot allocate between staging and descent`, { timeout: 2000 }, async () => {
    const s = await source(scenario, seed), r = realm(); r.simulationMode(true);
    const child = new r.LifecycleHarness(); let overlap = false, late = false;
    // The boot generation is in flight when the public agent becomes callable.
    child.game.pending = Promise.resolve();
    const originalNew = child.game.newGame.bind(child.game), originalStart = child.game.startSandbox.bind(child.game);
    child.game.newGame = value => { overlap = child.game.pending !== null; originalNew(value); };
    child.game.startSandbox = (...args) => {
      originalStart(...args);
      // Controlled scheduling of a stale generation continuation. It uses the real
      // allocator and executes only when another generation was started over it.
      if (overlap) { late = true; for (let i = 0; i < 31 + seed; i++) r.IdGenerator.generate('late-boot'); }
    };
    await child.restorePlanningSnapshot(s.snapshot.serialized);
    assert.equal(overlap, false); assert.equal(late, false);
    assert.equal(guard(child), s.before); assert.equal(child.game.validateReferences(), true);
    assert.equal(guard(s.live), s.before);
  });
}

test('fresh replacement child restores root then child continuation after a warmed planner realm', { timeout: 2000 }, async () => {
  const s = await source(), warm = realm(); warm.simulationMode(true);
  const old = new warm.LifecycleHarness(); await old.restorePlanningSnapshot(s.snapshot.serialized);
  await old.stepForPlanning(move('right')); const next = old.capturePlanningSnapshot();
  await old.stepForPlanning(move('down')); const expected = guard(old);
  const fresh = realm(); fresh.simulationMode(true); const child = new fresh.LifecycleHarness();
  const boot = pendingBoot(child, fresh), restoring = child.restorePlanningSnapshot(s.snapshot.serialized);
  const result = restoring.then(value => ({ value }), error => ({ error }));
  await flush(); const premature = [...boot.events]; boot.release();
  const outcome = await result; if (outcome.error) throw outcome.error;
  assert.deepEqual(premature, []); assert.equal(guard(child), s.before);
  await child.restorePlanningSnapshot(next.serialized); assert.equal(child.steps, 1);
  await child.stepForPlanning(move('down'));
  assert.equal(guard(child), expected); assert.equal(child.steps, 2);
  assert.equal(child.game.validateReferences(), true); assert.equal(guard(s.live), s.before);
});

test('overlapping restore is rejected while the first restore owns bootstrap settling', { timeout: 2000 }, async () => {
  const s = await source(), r = realm(); r.simulationMode(true);
  const child = new r.LifecycleHarness(), boot = pendingBoot(child, r);
  const first = child.restorePlanningSnapshot(s.snapshot.serialized);
  const result = first.then(value => ({ value }), error => ({ error }));
  try { await assert.rejects(child.restorePlanningSnapshot(s.snapshot.serialized), /idle healthy|Busy/); }
  finally { boot.release(); }
  const outcome = await result; if (outcome.error) throw outcome.error;
  assert.equal(guard(child), s.before);
});

test('failed bootstrap aborts before replacing a world or rewinding the allocator', { timeout: 2000 }, async () => {
  const s = await source(), r = realm(); r.simulationMode(true);
  const child = new r.LifecycleHarness(), boot = pendingBoot(child, r);
  const before = r.planning.planningJson(r.IdGenerator.captureSimulationState());
  const restoring = child.restorePlanningSnapshot(s.snapshot.serialized);
  const rejected = assert.rejects(restoring, /fixture bootstrap failed/);
  boot.fail(new Error('fixture bootstrap failed')); await rejected;
  assert.deepEqual(boot.events, []);
  assert.equal(r.planning.planningJson(r.IdGenerator.captureSimulationState()), before);
});

test('bootstrap readiness timeout is not retried or converted into a successful restore', async () => {
  const s = await source(), r = realm(); r.simulationMode(true);
  const child = new r.LifecycleHarness(); let generations = 0;
  child.game.newGame = () => { generations++; };
  child.settle = async () => { throw new Error('fixture existing readiness timeout'); };
  const before = r.planning.planningJson(r.IdGenerator.captureSimulationState());
  await assert.rejects(child.restorePlanningSnapshot(s.snapshot.serialized), /existing readiness timeout/);
  assert.equal(generations, 0); assert.equal(r.planning.planningJson(r.IdGenerator.captureSimulationState()), before);
});

test('invalid diagnostic scenario fails before invoking the new readiness barrier', async () => {
  const r = realm(); r.simulationMode(true); const child = new r.LifecycleHarness(); let waits = 0;
  child.settle = async () => { waits++; };
  await assert.rejects(child.restoreDiagnosticSandbox(1, 'unknown', [], 64), /Invalid diagnostic/);
  assert.equal(waits, 0);
});
