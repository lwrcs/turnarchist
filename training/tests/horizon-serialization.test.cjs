'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm');
const P = require(process.env.HORIZON_HEALTH_MODULE);
const { EngineHarness } = require(process.env.HORIZON_ENGINE_MODULE);
const roundtrip = x => P.planningDecode(JSON.parse(P.planningJson(x)));
const oldJson = value => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(oldJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + oldJson(value[key])).join(',') + '}';
  throw new Error('Planning data must be finite JSON');
};
test('regression: old capture drops undefined while old restore rejects the raw fingerprint', () => {
  const fingerprint = { roomFingerprints: [{ items: [{ groundedNoAnimate: undefined }] }] };
  assert.doesNotThrow(() => oldJson(JSON.parse(JSON.stringify(fingerprint))));
  assert.throws(() => oldJson(fingerprint), /finite JSON/);
  assert.deepEqual(roundtrip(fingerprint), fingerprint);
});
for (const [name, value] of [['undefined', undefined], ['positive infinity', Infinity], ['negative infinity', -Infinity], ['NaN', NaN], ['negative zero', -0]]) {
  test('diagnostic codec preserves ' + name, () => { assert.ok(Object.is(roundtrip(value), value)); });
}
test('absence, undefined, null, sparse holes, and string-shaped sentinels have distinct keys', () => {
  const values = [{}, { a: undefined }, { a: null }, [undefined], [null], new Array(1), ['undefined'], ['hole'], ['number', 'NaN'], NaN, null];
  assert.equal(new Set(values.map(P.planningJson)).size, values.length);
  for (const value of values) assert.deepEqual(roundtrip(value), value);
});
test('canonical records ignore insertion order but preserve key presence', () => {
  assert.equal(P.planningJson({ b: undefined, a: 1 }), P.planningJson({ a: 1, b: undefined }));
  assert.notEqual(P.planningJson({ a: 1 }), P.planningJson({ a: 1, b: undefined }));
});
test('arrays, keys containing slashes, Unicode, and nested special values round-trip', () => {
  const value = { '/~': [undefined, Infinity, -Infinity, NaN, -0, { café: '🥔' }], empty: [] };
  assert.deepEqual(roundtrip(value), value);
});
test('cross-realm plain records are accepted', () => {
  const foreign = vm.runInNewContext('({ a: undefined, b: [Infinity, -0] })');
  assert.equal(P.planningJson(foreign), P.planningJson({ a: undefined, b: [Infinity, -0] }));
});
test('null-prototype records and __proto__ keys cannot pollute prototypes', () => {
  const value = Object.create(null); value.__proto__ = { polluted: true }; value.a = undefined;
  const decoded = roundtrip(value);
  assert.equal(Object.getPrototypeOf(decoded), Object.prototype); assert.equal({}.polluted, undefined);
  assert.ok(Object.hasOwn(decoded, '__proto__')); assert.equal(decoded.__proto__.polluted, true);
});
for (const [label, make] of [
  ['cycles', () => { const x = {}; x.self = x; return x; }],
  ['function', () => ({ fn() {} })], ['symbol value', () => ({ x: Symbol('x') })],
  ['symbol key', () => ({ [Symbol('x')]: 1 })], ['bigint', () => ({ x: 1n })],
  ['date', () => new Date(0)], ['map', () => new Map()], ['set', () => new Set()], ['typed array', () => new Uint8Array(2)],
  ['class instance', () => new (class Example { constructor() { this.a = 1; } })()],
  ['named array property', () => Object.assign([1], { extra: 2 })],
]) test('rejects unsupported ' + label + ' with a path/code', () => {
  assert.throws(() => P.planningEncode(make()), error => error.code === 'PLANNING_DATA_UNSUPPORTED' && typeof error.path === 'string');
});
test('getters and toJSON are never invoked', () => {
  let calls = 0;
  const getter = {}; Object.defineProperty(getter, 'secret', { enumerable: true, get() { calls++; return 3; } });
  assert.throws(() => P.planningEncode(getter), /accessor/); assert.equal(calls, 0);
  assert.throws(() => P.planningEncode({ toJSON() { calls++; return {}; } }), /function/); assert.equal(calls, 0);
});
test('deeply nested input and oversized sparse arrays fail explicitly', () => {
  let value = null; for (let i = 0; i < 140; i++) value = [value];
  assert.throws(() => P.planningEncode(value), /structural/);
  assert.throws(() => P.planningEncode(new Array(250001)), /structural/);
});
test('decode rejects malformed tags, unsorted/duplicate keys, raw overflow and misplaced holes', () => {
  for (const value of [{}, ['unknown'], ['number', 'Infinity'], ['hole'], ['undefined', 1], ['array', 'bad'],
    ['object', [['z', 1], ['a', 2]]], ['object', [['a', 1], ['a', 2]]], Infinity, -0]) {
    assert.throws(() => P.planningDecode(value));
  }
});
test('mismatch diagnostics identify the exact raw field including escaped JSON pointer', () => {
  assert.throws(() => P.assertPlanningEqual({ 'a/b': { '~x': 1 } }, { 'a/b': { '~x': 2 } }, 'TEST', '/fingerprint'),
    e => e.code === 'TEST' && e.path === '/fingerprint/a~1b/~0x' && e.details.expected === '1' && e.details.actual === '2');
});
test('missing keys are not silently equal to present undefined values', () => {
  assert.throws(() => P.assertPlanningEqual({ a: undefined }, {}, 'TEST', ''), /Key missing/);
});
test('envelope preserves diagnostic values, runtime history and guard across actual inserted methods', async () => {
  const a = new EngineHarness(); a.game.fingerprint.optional = undefined;
  a.game.fingerprint.limit = Infinity; a.game.fingerprint.invalidDiagnostic = NaN; a.game.fingerprint.z = -0;
  a.recentTransitions = [{ step: 7, optional: undefined }];
  const before = structuredClone(a.game.fingerprint), guard = a.getPlanningGuard(), snapshot = a.capturePlanningSnapshot();
  assert.equal(snapshot.schemaVersion, 3);
  await a.restorePlanningSnapshot(snapshot.serialized);
  assert.deepEqual(a.game.fingerprint, before); assert.deepEqual(a.getPlanningGuard(), guard);
  assert.ok(Object.hasOwn(a.recentTransitions[0], 'optional'));
});
test('v3 continuation preserves accumulated perception contact ids and their frontier', async () => {
  const a = new EngineHarness();
  a.contacts.set('enemy-old', { id: 'c7', step: 6, x: 12, y: 4, previous: { step: 5, x: 11, y: 4 } });
  a.nextContactKey = 3;
  const snapshot = a.capturePlanningSnapshot();
  a.contacts.clear(); a.contacts.set('wrong', { id: 'c1', step: 7, x: 0, y: 0 }); a.nextContactKey = 0;
  await a.restorePlanningSnapshot(snapshot.serialized);
  assert.deepEqual([...a.contacts], [['enemy-old', { id: 'c7', step: 6, x: 12, y: 4, previous: { step: 5, x: 11, y: 4 } }]]);
  assert.equal(a.nextContactKey, 3);
});
test('v3 fingerprint gate catches a lossy underlying engine restore instead of hiding it', async () => {
  const a = new EngineHarness(); a.game.fingerprint.optional = undefined;
  const snapshot = a.capturePlanningSnapshot(); a.lossyRestore = true;
  await assert.rejects(a.restorePlanningSnapshot(snapshot.serialized), e => e.code === 'PLANNING_FINGERPRINT_MISMATCH' && e.path === '/fingerprint/optional');
});
test('guards distinguish different non-finite diagnostics', () => {
  const a = new EngineHarness(); a.game.fingerprint.limit = Infinity; const before = a.getPlanningGuard();
  a.game.fingerprint.limit = -Infinity; assert.notDeepEqual(a.getPlanningGuard(), before);
});
test('legacy snapshots fail with a recapture instruction rather than guessed migration', () => {
  assert.throws(() => P.parsePlanningEnvelope(JSON.stringify({ format: 'turnarchist-planning-snapshot-v1' })), /recapture a v3 snapshot/);
});
test('non-finite runtime budgets are invalid even though diagnostic sentinels are supported', () => {
  const a = new EngineHarness(), value = P.parsePlanningEnvelope(a.capturePlanningSnapshot().serialized);
  for (const key of ['seed', 'steps', 'maxSteps']) {
    const changed = structuredClone(value); changed.runtime[key] = Infinity;
    assert.throws(() => P.serializePlanningEnvelope(changed), /PLANNING_ENVELOPE_INVALID/);
  }
});
test('health remains finite-only: diagnostic codec does not authorize invalid player health', async () => {
  await assert.rejects(P.withGrossHealthLoss({ health: Infinity }, async () => {}), /numeric health/);
});
test('seeded round trips preserve 500 mixed diagnostic trees', () => {
  let seed = 746391; const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  const leaves = [undefined, null, true, false, NaN, Infinity, -Infinity, -0, 0, 7, 'undefined', '__proto__', '/~'];
  const make = depth => {
    if (!depth || random(3) === 0) return leaves[random(leaves.length)];
    if (random(2)) { const a = new Array(random(5)); for (let i = 0; i < a.length; i++) if (random(4)) a[i] = make(depth - 1); return a; }
    const o = {}; for (let i = 0, n = random(5); i < n; i++) o['k' + random(10)] = make(depth - 1); return o;
  };
  for (let i = 0; i < 500; i++) { const x = make(5); assert.deepEqual(roundtrip(x), x); assert.equal(P.planningJson(roundtrip(x)), P.planningJson(x)); }
});
