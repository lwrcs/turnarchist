'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
if (!process.env.HORIZON_HEALTH_MODULE) throw new Error('Use node training/horizon-tests.cjs to compile the metric helper first');
const P = require(process.env.HORIZON_HEALTH_MODULE);
test('gross health monitor counts damage even when net health is unchanged', async () => {
  const player = { health: 5 }; const descriptor = Object.getOwnPropertyDescriptor(player, 'health');
  const r = await P.withGrossHealthLoss(player, async () => { player.health -= 1; player.health += 1; return 'ok'; });
  assert.equal(r.healthLoss, 1); assert.equal(r.result, 'ok'); assert.deepEqual(Object.getOwnPropertyDescriptor(player, 'health'), descriptor);
});
test('multiple decreases count; increases do not cancel earlier losses', async () => {
  const player = { health: 5 };
  const r = await P.withGrossHealthLoss(player, async () => { player.health = 7; player.health = 6; await Promise.resolve(); player.health = 4; });
  assert.equal(r.healthLoss, 3); assert.equal(player.health, 4); assert.equal(Object.getOwnPropertyDescriptor(player, 'health').value, 4);
});
test('exception cleanup restores an ordinary property with final gameplay value', async () => {
  const player = { health: 5 };
  await assert.rejects(P.withGrossHealthLoss(player, async () => { player.health = 4; throw new Error('action failed'); }));
  assert.equal(Object.getOwnPropertyDescriptor(player, 'health').value, 4);
});
test('unknown/accessor/frozen/inherited health fields are rejected', async () => {
  const examples = [{}, Object.freeze({ health: 5 }), Object.create({ health: 5 }), { get health() { return 5; } }];
  for (const player of examples) await assert.rejects(P.withGrossHealthLoss(player, async () => {}));
});
test('nonfinite assignments and descriptor replacement invalidate metrics', async () => {
  await assert.rejects(P.withGrossHealthLoss({ health: NaN }, async () => {}));
  const player = { health: 5 };
  await assert.rejects(P.withGrossHealthLoss(player, async () => { player.health = NaN; }));
  assert.ok(Number.isNaN(Object.getOwnPropertyDescriptor(player, 'health').value));
  const other = { health: 5 };
  await assert.rejects(P.withGrossHealthLoss(other, async () => { Object.defineProperty(other, 'health', { value: 4, writable: true, configurable: true }); }));
});
function envelope() { return { format: P.PLANNING_FORMAT, reconstruction: null, inner: { schemaVersion: 1, source: 'privileged-agent-snapshot', createdAtStep: 2, serialized: '{}' },
  runtime: { seed: 1, scenario: 'standard', steps: 2, maxSteps: 10, vision: {}, recentTransitions: [] }, context: {}, fingerprint: {} }; }
test('planning envelope preserves counters and enforces consistency', () => {
  const value = envelope(); assert.deepEqual(P.parsePlanningEnvelope(P.serializePlanningEnvelope(value)), value);
  value.runtime.steps = 3; assert.throws(() => P.parsePlanningEnvelope(P.serializePlanningEnvelope(value)));
});
test('oversized/invalid/schema-drift snapshots are refused', () => {
  for (const text of ['', '{}', JSON.stringify({ ...envelope(), format: 'v2' })]) assert.throws(() => P.parsePlanningEnvelope(text));
  const value = envelope(); value.runtime.steps = 20; value.inner.createdAtStep = 20; assert.throws(() => P.parsePlanningEnvelope(P.serializePlanningEnvelope(value)));
});
