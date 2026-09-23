'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
if (!process.env.HORIZON_ENGINE_MODULE) throw new Error('Use node training/horizon-tests.cjs');
const P = require(process.env.HORIZON_HEALTH_MODULE);
const { EngineHarness, simulationMode } = require(process.env.HORIZON_ENGINE_MODULE);
test('installed continuation methods preserve budget, scenario, vision and recent history', async () => {
  const a = new EngineHarness(); a.scenario = 'cave'; const before = JSON.parse(JSON.stringify(a.observe())); const snapshot = a.capturePlanningSnapshot();
  a.steps = 0; a.maxSteps = 100; a.scenario = 'forest'; await a.restorePlanningSnapshot(snapshot.serialized);
  assert.deepEqual(a.observe(), before);
});
test('returning from a sandbox to a standard snapshot clears stale scenario', async () => {
  const a = new EngineHarness(), snapshot = a.capturePlanningSnapshot(); a.scenario = 'cave';
  await a.restorePlanningSnapshot(snapshot.serialized); assert.equal(a.scenario, 'standard');
});
test('snapshot fingerprint mismatch and forged scenario are rejected', async () => {
  for (const edit of [v => { v.fingerprint.rngState++; }, v => { v.runtime.scenario = 'forest'; }]) {
    const a = new EngineHarness(), value = P.parsePlanningEnvelope(a.capturePlanningSnapshot().serialized); edit(value);
    await assert.rejects(async () => a.restorePlanningSnapshot(P.serializePlanningEnvelope(value)));
  }
});
test('contract/settings mismatches do not silently approximate a branch', async () => {
  const a = new EngineHarness(), value = P.parsePlanningEnvelope(a.capturePlanningSnapshot().serialized); value.context.settings.fixture = false;
  await assert.rejects(a.restorePlanningSnapshot(P.serializePlanningEnvelope(value)), /PLANNING_CONTEXT_MISMATCH/);
});
test('planning step wraps ordinary step and reports gross loss despite net-zero HP', async () => {
  const a = new EngineHarness(), result = await a.stepForPlanning({ type: 'Move' });
  assert.equal(result.planning.healthLoss, 1); assert.equal(a.body.health, 5); assert.equal(a.steps, 8);
});
test('privileged restoring and stepping are prohibited in the visible realm', async () => {
  const a = new EngineHarness(), snapshot = a.capturePlanningSnapshot(); simulationMode(false);
  try { await assert.rejects(a.restorePlanningSnapshot(snapshot.serialized)); await assert.rejects(a.stepForPlanning({ type: 'Move' })); }
  finally { simulationMode(true); }
});
test('busy and poisoned episodes cannot start a planning step', async () => {
  const a = new EngineHarness(); a.busy = true; await assert.rejects(a.stepForPlanning({ type: 'Move' }));
  a.busy = false; a.failure = 'timed out'; await assert.rejects(a.stepForPlanning({ type: 'Move' }));
});
