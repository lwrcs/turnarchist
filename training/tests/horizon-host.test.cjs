'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Host = require('../../agent-horizon-host.js');
const clone = value => JSON.parse(JSON.stringify(value));
function fixture({ effect, restore, maxSteps = 20, startupDelay = 0, settlementTimeoutMs = 50 } = {}) {
  const initial = { seed: 1, scenario: 'standard', steps: 0, maxSteps, ready: true,
    terminated: false, truncated: false, truncationReason: null, failure: null,
    contract: { version: 1 }, player: { x: 0, y: 0, z: 0, health: 5, turnCount: 0 },
    room: { id: 'A', depth: 0, entities: [], tiles: [] }, inventory: [], decision: 'world',
    selectionChoices: null, vendingMachine: null };
  function agent() {
    return { getPlanningCapabilities() { return { snapshotSchemaVersion: 3, format: 'turnarchist-planning-snapshot-v3' }; }, view: clone(initial), observe() { return clone(this.view); },
      getPlanningGuard() { return { steps: this.view.steps, player: clone(this.view.player) }; },
      capturePlanningSnapshot() { return { schemaVersion: 3, source: 'privileged-horizon-snapshot', serialized: JSON.stringify(this.view) }; },
      async restorePlanningSnapshot(serialized) { this.view = JSON.parse(serialized); if (restore) await restore(this); return this.observe(); },
      async stepForPlanning(action) {
        const before = this.observe(); let recorded = false, loss = 0, turns = 0;
        if (action.type === 'Move' && action.direction === 'right' && this.view.player.x < 2) { this.view.player.x++; recorded = true; turns = 1; }
        if (action.type === 'Move' && action.direction === 'left' && this.view.player.x > 0) { this.view.player.x--; recorded = true; turns = 1; }
        if (action.type === 'LadderConfirm' && this.view.decision === 'ladder') { this.view.room.id = 'B'; this.view.decision = 'world'; recorded = true; }
        this.view.steps++; this.view.player.turnCount += turns;
        this.view.truncated = this.view.steps >= this.view.maxSteps;
        this.view.truncationReason = this.view.truncated ? 'action-budget' : null;
        const result = { terminated: false, truncated: this.view.truncated,
          planning: { schemaVersion: 1, metric: 'gross-health-decrease-v1', healthLoss: loss },
          info: { recorded, turnDelta: turns } };
        if (effect) await effect(this, action, result, before);
        return result;
      },
    };
  }
  const live = agent(), child = agent(); let disposals = 0;
  const source = () => live;
  const simulator = { source, pending: null, agent: async () => {
    if (startupDelay) await new Promise(resolve => setTimeout(resolve, startupDelay));
    return child;
  }, dispose: () => disposals++ };
  const host = Host.create({ source, simulator, stepTimeoutMs: 50, settlementTimeoutMs });
  const goal = { kind: 'position', roomId: 'A', x: 2, y: 0 };
  return { live, child, simulator, host, goal, disposals: () => disposals };
}
test('actual-API adapter continues snapshots and leaves live state untouched', async () => {
  const f = fixture(), before = f.live.observe(); const r = await f.host.plan(f.goal);
  assert.equal(r.status, 'GOAL_REACHED'); assert.equal(r.plan.decisions, 2);
  assert.deepEqual(r.plan.actions, [{ type: 'Move', direction: 'right' }, { type: 'Move', direction: 'right' }]);
  assert.deepEqual(f.live.observe(), before); assert.equal(f.simulator.pending, null); assert.equal(r.assistance, 'privileged-oracle-advisory');
  assert.ok(r.stats.rejected > 0); assert.ok(!JSON.stringify(r).includes('privileged-horizon-snapshot'));
  assert.ok(r.candidateLedger.some(e=>e.outcome==='safe-edge'&&e.action.direction==='right'));
  assert.ok(r.candidateLedger.some(e=>e.outcome==='rejected'&&e.reason==='unrecorded-no-op'));
  assert.ok(r.candidateLedger.every(e=>!('snapshot' in e)));
});
test('execution simulator startup is outside the search wall-clock budget', async () => {
  const f = fixture({ startupDelay: 20 }); f.goal.x = 1;
  const r = await f.host.planForExecution(f.goal, { maxMillis: 8, maxSimulations: 1, maxExpanded: 1 });
  assert.equal(r.status, 'GOAL_REACHED');
  assert.equal(r.plan.actions[0].direction, 'right');
  assert.ok(r.timing.startupMs >= 15);
  assert.ok(r.candidateLedger.some(entry => entry.outcome === 'safe-edge'));
});
test('execution root restore is outside the search wall-clock budget', async () => {
  let restores = 0;
  const f = fixture({ restore: async () => { restores++; await new Promise(resolve => setTimeout(resolve, 20)); } });
  f.goal.x = 1;
  const r = await f.host.planForExecution(f.goal, { maxMillis: 8, maxSimulations: 1, maxExpanded: 1 });
  assert.equal(r.status, 'GOAL_REACHED');
  assert.equal(r.plan.actions[0].direction, 'right');
  assert.equal(restores, 1);
  assert.ok(r.candidateLedger.some(entry => entry.outcome === 'safe-edge'));
});
test('adapter refuses a restore that loses decision counters', async () => {
  const f = fixture({ restore: child => { child.view.steps = 0; } });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.match(r.stopReason, /Restored branch/); assert.ok(f.disposals() > 0);
});
test('missing metric never falls back to net HP', async () => {
  const f = fixture({ effect: (_, __, result) => { delete result.planning; } });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.equal(r.plan, null);
});
test('damage followed by healing is rejected by gross-loss metric', async () => {
  const f = fixture({ effect: (child, _, result) => { if (result.info.recorded) result.planning.healthLoss = 1; child.view.player.health = 5; } });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'NO_SOLUTION_WITHIN_HORIZON'); assert.equal(r.stats.unsafe, 1);
});
test('concurrent live changes invalidate the whole query', async () => {
  let f; f = fixture({ effect: () => { f.live.view.player.health--; } });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.match(r.stopReason, /Live game changed/); assert.equal(r.plan, null);
});
test('unsupported decision mode is unknown, not unsolvable', async () => {
  const f = fixture(); f.live.view.decision = 'selection';
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED');
});
test('old bundles are rejected with rebuild instruction', async () => {
  const f = fixture(); delete f.live.capturePlanningSnapshot;
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.match(r.stopReason, /Rebuild required/);
});
test('preview mutex is shared; reentrant plan cannot acquire it', async () => {
  const f = fixture(); f.simulator.pending = Promise.resolve();
  assert.equal((await f.host.plan(f.goal)).status, 'BUSY'); f.simulator.pending = null;
  const first = f.host.plan(f.goal), second = await f.host.plan(f.goal);
  assert.equal(second.status, 'BUSY'); await first; assert.equal(f.simulator.pending, null);
});
test('unrecorded state changes are not accepted as safe branches', async () => {
  const f = fixture({ effect: (child, _, result) => { child.view.player.health = 4; result.info.recorded = false; } });
  assert.equal((await f.host.plan(f.goal)).status, 'SIMULATION_UNSUPPORTED');
});
test('one-step environment budget permits a reached goal', async () => {
  const f = fixture({ maxSteps: 1 }); f.goal.x = 1;
  assert.equal((await f.host.plan(f.goal)).status, 'GOAL_REACHED');
});
test('invalid goal and options fail before any simulator work', async () => {
  const f = fixture();
  assert.equal((await f.host.plan({ ...f.goal, roomId: 'B' })).status, 'INVALID_REQUEST');
  assert.equal((await f.host.plan(f.goal, { unknown: 1 })).status, 'INVALID_REQUEST');
});
test('cancelled planning retires the frame and releases its mutex', async () => {
  const f = fixture({ effect: () => new Promise(() => {}) });
  const task = f.host.plan(f.goal); setTimeout(() => f.host.cancel(), 5);
  const r = await task; assert.equal(r.status, 'CANCELLED'); assert.equal(f.simulator.pending, null); assert.ok(f.disposals() > 0);
});
test('operation timeouts fail closed and dispose the worker', async () => {
  const f = fixture({ effect: () => new Promise(() => {}) });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.match(r.stopReason, /timed out/); assert.ok(f.disposals() > 0);
});
test('ladder generation uses the bounded settlement window without relaxing ordinary steps', async () => {
  const f = fixture({ settlementTimeoutMs: 120, effect: async (_,action) => {
    if (action.type === 'LadderConfirm') await new Promise(resolve => setTimeout(resolve,70));
  }});
  f.child.view.decision='ladder'; f.live.view.decision='ladder';
  const goal={kind:'exit',roomId:'A',x:0,y:0,z:0,targetRoomId:'B'};
  const r=await f.host.plan(goal,{maxDepth:1,maxSimulations:2});
  assert.equal(r.status,'GOAL_REACHED');assert.equal(r.plan.actions[0].type,'LadderConfirm');
});
test('exit success is tied to origin, target tile, and optional destination', () => {
  const from = { view: { room: { id: 'A', depth: 0 }, player: { x: 2, y: 3, z: 0 } } };
  const to = { view: { room: { id: 'B', depth: 0 }, player: { x: 8, y: 9, z: 0 } } };
  const goal = { kind: 'exit', roomId: 'A', x: 3, y: 3, z: 0, targetRoomId: 'B' };
  assert.equal(Host.goalReached(to, goal, { from, action: { type: 'Move', direction: 'right' } }), true);
  assert.equal(Host.goalReached(to, goal, { from, action: { type: 'Move', direction: 'left' } }), false);
  assert.equal(Host.goalReached(to, { ...goal, targetRoomId: 'C' }, { from, action: { type: 'Move', direction: 'right' } }), false);
  assert.equal(Host.goalReached(to, goal, null), false);
});
test('ladder goal uses real confirmation; no invented Wait', () => {
  const from = { view: { room: { id: 'A', depth: 0 }, player: { x: 3, y: 3, z: 0 }, decision: 'ladder' } };
  const to = { view: { room: { id: 'B', depth: 1 }, player: { x: 0, y: 0, z: 0 } } };
  const goal = { kind: 'exit', roomId: 'A', x: 3, y: 3, z: 0, targetDepth: 1 };
  assert.equal(Host.goalReached(to, goal, { from, action: { type: 'LadderConfirm' } }), true);
  assert.deepEqual(Host.actionsFor(from, goal).map(a => a.type), ['LadderConfirm', 'LadderCancel']);
  assert.ok(!Host.actionsFor({ view: { ...from.view, decision: 'world' } }, goal).some(a => a.type === 'Wait'));
});
test('world actions evaluate goal-directed moves first without removing any legal direction', () => {
  const state={view:{room:{id:'A'},player:{x:0,y:0,z:0},decision:'world'}};
  const actions=Host.actionsFor(state,{kind:'position',roomId:'A',x:1,y:1,z:0});
  assert.deepEqual(actions.map(a=>a.direction),['down','right','up','left']);
  assert.equal(new Set(actions.map(a=>a.direction)).size,4);
  assert.equal(Host.actionsFor(state,{kind:'position',roomId:'A',x:4,y:1,z:0})[0].direction,'right');
});
test('same method names with different capabilities still reject a stale child bundle', async () => {
  const f = fixture(); f.child.getPlanningCapabilities = () => ({ snapshotSchemaVersion: 1 });
  const r = await f.host.plan(f.goal); assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.match(r.stopReason, /PLANNING_BUILD_MISMATCH/);
});
test('structured field diagnostics survive the simulator and search boundary', async () => {
  const f = fixture({ restore: () => { const e = new Error('bad fingerprint'); e.code = 'PLANNING_FINGERPRINT_MISMATCH'; e.path = '/fingerprint/room'; e.details = { expected: 'a', actual: 'b' }; throw e; } });
  const r = await f.host.plan(f.goal); assert.equal(r.error.code, 'PLANNING_FINGERPRINT_MISMATCH'); assert.equal(r.error.path, '/fingerprint/room');
});
