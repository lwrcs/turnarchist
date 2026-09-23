'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { IdGenerator: ID, readIdGeneratorSnapshot, ID_GENERATOR_SNAPSHOT_FORMAT: FORMAT } = require(process.env.HORIZON_ID_MODULE);
const P = require(process.env.HORIZON_HEALTH_MODULE);
const clone = value => JSON.parse(JSON.stringify(value));
function isolatedRealm() {
  const context = vm.createContext({ console, structuredClone, setTimeout, clearTimeout, performance });
  const cache = new Map(), base = path.dirname(path.dirname(process.env.HORIZON_LIFECYCLE_MODULE));
  function load(file) {
    file = path.resolve(file); if (!file.endsWith('.js')) file += '.js';
    if (!file.startsWith(base + path.sep)) throw new Error('Fixture require escaped compilation directory');
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const factory = vm.runInContext('(function(module,exports,require){\n' + fs.readFileSync(file, 'utf8') + '\n})', context, { filename: file });
    factory(module, module.exports, specifier => load(path.resolve(path.dirname(file), specifier)));
    return module.exports;
  }
  const api = load(process.env.HORIZON_LIFECYCLE_MODULE);
  return { ...api, planning: load(process.env.HORIZON_HEALTH_MODULE) };
}
const guard = agent => JSON.stringify(agent.getPlanningGuard());
const move = direction => ({ type: 'Move', direction });

test('allocator capture is detached, read-only, and lossless above Number.MAX_SAFE_INTEGER', () => {
  ID.restoreSimulationState({ format: FORMAT, next: '900719925474099312345', reserved: ['old'] });
  const before = ID.captureSimulationState(), roundtrip = clone(before);
  assert.equal(ID.generate('R'), 'R-' + BigInt(before.next).toString(36));
  assert.equal(before.next, '900719925474099312345'); assert.deepEqual(before.reserved, ['old']);
  ID.restoreSimulationState(roundtrip); assert.deepEqual(ID.captureSimulationState(), before);
});
test('allocator replay restores collisions as well as its next counter', () => {
  ID.resetForTest(); ID.reserve('R-1'); ID.reserve('R-2'); const origin = ID.captureSimulationState();
  const expected = [ID.generate('R'), ID.generate('EN'), ID.generate('T'), ID.generate()]; const frontier = ID.captureSimulationState();
  ID.clearRegistryForLoad(); for (let i = 0; i < 70; i++) ID.generate('garbage');
  ID.restoreSimulationState(clone(origin));
  assert.deepEqual([ID.generate('R'), ID.generate('EN'), ID.generate('T'), ID.generate()], expected);
  assert.equal(expected[0], 'R-3'); assert.deepEqual(ID.captureSimulationState(), frontier);
  assert.throws(() => ID.reserve(expected[0]), /Duplicate/);
});
test('invalid allocator restore is atomic and does not coerce strings/numbers', () => {
  ID.resetForTest(); ID.generate('R'); const before = ID.captureSimulationState();
  for (const bad of [null, {}, { ...before, next: 2 }, { ...before, next: '0' }, { ...before, next: '-1' },
    { ...before, next: '01' }, { ...before, next: '1e4' }, { ...before, next: '9'.repeat(81) },
    { ...before, format: 'future' }, { ...before, extra: 1 }, { ...before, reserved: ['z', 'a'] },
    { ...before, reserved: ['a', 'a'] }, { ...before, reserved: [''] }, { ...before, reserved: [1] },
    { ...before, reserved: new Array(1) }, { ...before, reserved: ['x'.repeat(513)] }]) {
    assert.throws(() => ID.restoreSimulationState(bad), e => e.code === 'PLANNING_ID_STATE_INVALID');
    assert.deepEqual(ID.captureSimulationState(), before);
  }
});
test('allocator DTO validators never invoke accessors', () => {
  let reads = 0; const value = { format: FORMAT, next: '1', reserved: [] };
  Object.defineProperty(value, 'next', { enumerable: true, get() { reads++; return '1'; } });
  assert.throws(() => readIdGeneratorSnapshot(value), /Accessors/); assert.equal(reads, 0);
  const ids = []; Object.defineProperty(ids, 0, { enumerable: true, get() { reads++; return 'R-1'; } });
  assert.throws(() => readIdGeneratorSnapshot({ format: FORMAT, next: '1', reserved: ids }), /accessor/); assert.equal(reads, 0);
});
test('existing generate, reserve, clear-for-load and reset semantics are retained', () => {
  ID.resetForTest(); assert.equal(ID.generate('R'), 'R-1'); ID.reserve('arbitrary-id');
  ID.clearRegistryForLoad(); assert.equal(ID.isReserved('R-1'), false); assert.equal(ID.generate('L'), 'L-2');
  ID.resetForTest(); assert.equal(ID.generate(), '1');
});

for (const scenario of ['cave', 'forest', 'combat-fixture']) {
  test('source-extracted lifecycle restores ' + scenario + ' across unequal realm allocation histories', async () => {
    const liveRealm = isolatedRealm(), childRealm = isolatedRealm(); childRealm.simulationMode(true);
    for (let i = 0; i < 19; i++) liveRealm.IdGenerator.generate('before-live');
    for (let i = 0; i < 123; i++) childRealm.IdGenerator.generate('before-child');
    const live = new liveRealm.LifecycleHarness(), child = new childRealm.LifecycleHarness();
    await live.reset(2, { scenario, maxSteps: 64 });
    const snapshot = live.capturePlanningSnapshot(), origin = guard(live), view = liveRealm.planning.planningJson(live.observe());
    const data = liveRealm.planning.parsePlanningEnvelope(snapshot.serialized);
    assert.equal(liveRealm.planning.planningJson(data.reconstruction.origin), liveRealm.planning.planningJson(live.game.sandboxEntry));
    assert.ok(BigInt(data.reconstruction.frontier.next) > BigInt(data.reconstruction.origin.next));
    await child.restorePlanningSnapshot(snapshot.serialized);
    assert.equal(guard(child), origin); assert.equal(childRealm.planning.planningJson(child.observe()), view);
    assert.equal(child.game.validateReferences(), true); assert.equal(guard(live), origin);
  });
}
test('regression reproduces the original roomPathId failure without origin restoration', async () => {
  const left = isolatedRealm(), right = isolatedRealm(); right.simulationMode(true);
  const live = new left.LifecycleHarness(), child = new right.LifecycleHarness();
  for (let i = 0; i < 75; i++) right.IdGenerator.generate('drift');
  await live.reset(1, { scenario: 'cave', maxSteps: 64 });
  const envelope = left.planning.parsePlanningEnvelope(live.capturePlanningSnapshot().serialized);
  // This is the old reconstruction route, intentionally omitting the new origin argument.
  await child.restoreSimulationSnapshot(envelope.inner.serialized);
  const actual = right.planning.parsePlanningEnvelope(child.capturePlanningSnapshot().serialized);
  assert.throws(() => P.assertPlanningEqual(envelope.fingerprint, actual.fingerprint, 'PLANNING_FINGERPRINT_MISMATCH', '/fingerprint'),
    e => e.path === '/fingerprint/playerFingerprints/0/roomPathId');
  // The repair must satisfy the unchanged comparison, not waive room identifiers.
  await child.restorePlanningSnapshot(live.capturePlanningSnapshot().serialized);
  assert.equal(guard(child), guard(live));
});
test('twelve branch backtracks preserve child continuation, spawned IDs and parent/child room links', async () => {
  const source = isolatedRealm(), worker = isolatedRealm(); worker.simulationMode(true);
  const live = new source.LifecycleHarness(), child = new worker.LifecycleHarness();
  await live.reset(1, { scenario: 'cave', maxSteps: 64 });
  const root = live.capturePlanningSnapshot(), liveGuard = guard(live);
  await child.restorePlanningSnapshot(root.serialized); await child.stepForPlanning(move('right'));
  const next = child.capturePlanningSnapshot(), firstGuard = guard(child);
  await child.stepForPlanning(move('down')); const expected = guard(child);
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < i; j++) worker.IdGenerator.generate('noise');
    await child.restorePlanningSnapshot(root.serialized); await child.stepForPlanning(move('right'));
    assert.equal(guard(child), firstGuard);
    await child.restorePlanningSnapshot(next.serialized); assert.equal(child.steps, 1);
    await child.stepForPlanning(move('down')); assert.equal(guard(child), expected); assert.equal(child.steps, 2);
    assert.equal(child.game.validateReferences(), true); assert.equal(guard(live), liveGuard);
  }
});
test('a live repeated reset captures a new origin rather than reusing the prior run', async () => {
  const a = isolatedRealm(), b = isolatedRealm(); b.simulationMode(true);
  const live = new a.LifecycleHarness(), child = new b.LifecycleHarness();
  await live.reset(1, { scenario: 'cave' }); const first = live.capturePlanningSnapshot();
  await live.reset(1, { scenario: 'cave' }); const second = live.capturePlanningSnapshot();
  const x = a.planning.parsePlanningEnvelope(first.serialized), y = a.planning.parsePlanningEnvelope(second.serialized);
  assert.notEqual(x.reconstruction.origin.next, y.reconstruction.origin.next);
  await child.restorePlanningSnapshot(first.serialized); const oldGuard = guard(child);
  await child.restorePlanningSnapshot(second.serialized); assert.equal(guard(child), guard(live)); assert.notEqual(guard(child), oldGuard);
  await child.restorePlanningSnapshot(first.serialized); assert.equal(guard(child), oldGuard);
});
test('forged frontier is detected, never assigned over the reconstructed allocator', async () => {
  const a = isolatedRealm(), b = isolatedRealm(); b.simulationMode(true);
  const live = new a.LifecycleHarness(), child = new b.LifecycleHarness(); await live.reset(1, { scenario: 'cave' });
  const data = a.planning.parsePlanningEnvelope(live.capturePlanningSnapshot().serialized);
  const legitimateNext = data.reconstruction.frontier.next;
  data.reconstruction.frontier.next = (BigInt(legitimateNext) + 13n).toString();
  await assert.rejects(child.restorePlanningSnapshot(a.planning.serializePlanningEnvelope(data)),
    e => e.code === 'PLANNING_ALLOCATOR_MISMATCH' && e.path === '/reconstruction/frontier/next');
  assert.equal(b.IdGenerator.captureSimulationState().next, legitimateNext);
});
test('forged origin is not repaired by copying expected room IDs into the world', async () => {
  const a = isolatedRealm(), b = isolatedRealm(); b.simulationMode(true);
  const live = new a.LifecycleHarness(), child = new b.LifecycleHarness(); await live.reset(1, { scenario: 'cave' });
  const data = a.planning.parsePlanningEnvelope(live.capturePlanningSnapshot().serialized);
  data.reconstruction.origin.next = (BigInt(data.reconstruction.origin.next) + 19n).toString();
  await assert.rejects(child.restorePlanningSnapshot(a.planning.serializePlanningEnvelope(data)), e => e.code === 'PLANNING_FINGERPRINT_MISMATCH');
});
test('diagnostic replay metadata and missing provenance fail before any world or allocator mutation', async () => {
  const a = isolatedRealm(), b = isolatedRealm(); b.simulationMode(true);
  const live = new a.LifecycleHarness(), child = new b.LifecycleHarness(); await live.reset(1, { scenario: 'cave' });
  const data = a.planning.parsePlanningEnvelope(live.capturePlanningSnapshot().serialized), before = b.IdGenerator.captureSimulationState();
  for (const bad of [{ ...data, reconstruction: null }, { ...data, reconstruction: undefined }, { ...data, inner: { ...data.inner,
    serialized: JSON.stringify({ format: 'diagnostic-sandbox-replay-v1', seed: 99, scenario: 'cave', actions: [], maxSteps: 1000 }) } }]) {
    const forged = JSON.stringify({ format: a.planning.PLANNING_FORMAT, codec: a.planning.PLANNING_CODEC, data: a.planning.planningEncode(bad) });
    await assert.rejects(child.restorePlanningSnapshot(forged), e => ['PLANNING_RECONSTRUCTION_INVALID', 'PLANNING_REPLAY_METADATA_INVALID'].includes(e.code));
    assert.equal(P.planningJson(b.IdGenerator.captureSimulationState()), P.planningJson(before));
  }
  live.planningSandboxOrigin = null;
  assert.throws(() => live.capturePlanningSnapshot(), e => e.code === 'PLANNING_ID_ORIGIN_MISSING');
});
test('visible realm cannot restore a planning snapshot or allocator origin through simulation API', async () => {
  const a = isolatedRealm(); const live = new a.LifecycleHarness(); await live.reset(1, { scenario: 'cave' });
  const snapshot = live.capturePlanningSnapshot(), data = a.planning.parsePlanningEnvelope(snapshot.serialized), before = guard(live);
  await assert.rejects(live.restorePlanningSnapshot(snapshot.serialized), /isolated simulator/);
  await assert.rejects(live.restoreSimulationSnapshot(data.inner.serialized, data.reconstruction.origin), /isolated simulator/);
  assert.equal(guard(live), before);
});
test('standard planning capture restores the live frontier for later dynamic identities', async () => {
  const { EngineHarness } = require(process.env.HORIZON_ENGINE_MODULE), env = new EngineHarness();
  const snap = env.capturePlanningSnapshot(), data=P.parsePlanningEnvelope(snap.serialized);
  assert.equal(data.reconstruction, null); const frontier=data.runtime.allocatorContinuation;
  ID.generate('unrelated'); await env.restorePlanningSnapshot(snap.serialized);
  assert.deepEqual(ID.captureSimulationState(), frontier);
});
