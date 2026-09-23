'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../agent-horizon-core.js');
function graph(edges, extra = {}) {
  return { namespace: 'test-v1', key: state => state,
    actions: state => (edges[state] ?? []).map((_, index) => ({ index })),
    step: async (state, action) => {
      const raw = edges[state][action.index], e = typeof raw === 'string' ? { to: raw } : raw;
      return { kind: 'ok', state: e.to, healthLoss: e.loss ?? 0, turnDelta: e.turns ?? 1,
        terminal: e.terminal ?? false, truncated: e.truncated ?? false, truncationReason: e.reason ?? null };
    }, isGoal: (state, goal) => state === goal, ...extra };
}
const run = (adapter, options = {}, rest = {}) => C.search({ root: 'S', goal: 'G', adapter, options, ...rest });
test('shortest safe path, not merely first suggested path', async () => {
  const r = await run(graph({ S: ['A', 'B'], A: ['C'], C: ['G'], B: ['G'] }));
  assert.equal(r.status, 'GOAL_REACHED'); assert.equal(r.plan.decisions, 2); assert.equal(r.solutionOptimal, true);
});
test('backtracking changes hazard phase; opposite-direction moves are not pruned', async () => {
  const adapter = { namespace: 'phase-4', key: s => `${s.x}:${s.phase}`,
    actions: s => [{ dx: 1 }, { dx: -1 }].filter(a => s.x + a.dx >= 0 && s.x + a.dx <= 2),
    step: async (s, a) => { const next = { x: s.x + a.dx, phase: (s.phase + 1) % 4 };
      return { kind: 'ok', state: next, healthLoss: next.x === 2 && next.phase === 2 ? 1 : 0, turnDelta: 1, terminal: false, truncated: false }; },
    isGoal: s => s.x === 2, rankFrontier: s => 2 - s.x };
  const root = Object.freeze({ x: 0, phase: 0 });
  const r = await C.search({ root, adapter, goal: null });
  assert.equal(r.status, 'GOAL_REACHED'); assert.deepEqual(r.plan.actions.map(a => a.dx), [1, -1, 1, 1]);
  assert.deepEqual(root, { x: 0, phase: 0 });
});
test('equivalent states merge rather than expanding all paths', async () => {
  const r = await run(graph({ S: ['A', 'B'], A: ['X'], B: ['X'], X: ['S'] }));
  assert.equal(r.status, 'NO_SOLUTION_WITHIN_HORIZON'); assert.ok(r.stats.merged >= 2); assert.equal(r.stats.expanded, 4);
});
test('damage is not silently netted against healing', async () => {
  const r = await run(graph({ S: [{ to: 'G', loss: 1, netHealth: 0 }] }));
  assert.equal(r.status, 'NO_SOLUTION_WITHIN_HORIZON'); assert.equal(r.stats.unsafe, 1);
});
test('dead goal is not a successful goal', async () => {
  const r = await run(graph({ S: [{ to: 'G', terminal: true }] }));
  assert.equal(r.status, 'NO_SOLUTION_WITHIN_HORIZON'); assert.equal(r.stats.terminal, 1);
});
test('horizon produces only a prefix, not a long-term safety claim', async () => {
  const r = await run(graph({ S: ['A'], A: ['B'], B: [{ to: 'G', loss: 1 }] }, { rankFrontier: s => s === 'B' ? 0 : 1 }), { maxDepth: 2 });
  assert.equal(r.status, 'SAFE_PREFIX_FOUND'); assert.equal(r.plan, null); assert.equal(r.prefix.reachedGoal, false); assert.equal(r.prefix.decisions, 2);
});
test('simulation cap is exact and distinct from a negative proof', async () => {
  const r = await run(graph({ S: ['A', 'B'], A: ['G'] }), { maxSimulations: 1 });
  assert.equal(r.status, 'SEARCH_BUDGET_EXHAUSTED'); assert.equal(r.stopReason, 'simulations'); assert.equal(r.stats.simulations, 1);
});
test('an incumbent goal survives a later compute cutoff without an optimality claim', async () => {
  const r = await run(graph({ S: ['G', 'A'] }), { maxSimulations: 1 });
  assert.equal(r.status, 'GOAL_REACHED'); assert.equal(r.solutionOptimal, false); assert.equal(r.stopReason, 'simulations');
});
test('expansion cap and zero depth', async () => {
  const a = graph({ S: ['A'], A: ['G'] });
  const r = await run(a, { maxExpanded: 0 }); assert.equal(r.stopReason, 'expansions'); assert.equal(r.stats.simulations, 0);
  const s = await run(a, { maxDepth: 0 }); assert.equal(s.status, 'NO_SOLUTION_WITHIN_HORIZON'); assert.equal(s.stopReason, 'action-horizon');
});
test('goal on last environment-budget action is valid; truncation is not death', async () => {
  const r = await run(graph({ S: [{ to: 'G', truncated: true, reason: 'action-budget' }] }));
  assert.equal(r.status, 'GOAL_REACHED');
  const s = await run(graph({ S: [{ to: 'A', truncated: true, reason: 'action-budget' }] }));
  assert.equal(s.status, 'SEARCH_BUDGET_EXHAUSTED'); assert.equal(s.stopReason, 'environment-action-budget');
});
test('non-budget truncation is unsupported, not a negative solution proof', async () => {
  const r = await run(graph({ S: [{ to: 'A', truncated: true, reason: 'failure' }] }));
  assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.equal(r.prefix, null);
});
test('unrecorded/rejected transitions do not become nodes', async () => {
  const r = await run(graph({ S: ['A'] }, { step: async () => ({ kind: 'rejected' }) }));
  assert.equal(r.stats.rejected, 1); assert.equal(r.stats.retainedNodes, 1);
});
test('malformed/missing health metric is fail-closed', async () => {
  const r = await run(graph({ S: ['G'] }, { step: async () => ({ kind: 'ok', state: 'G', terminal: false, truncated: false, turnDelta: 1 }) }));
  assert.equal(r.status, 'SIMULATION_UNSUPPORTED'); assert.equal(r.plan, null);
});
test('unsupported outcomes, exceptions, and duplicate actions fail closed', async () => {
  for (const extra of [ { step: async () => ({ kind: 'unsupported', reason: 'save-failed' }) },
    { step: async () => { throw new Error('broken'); } }, { actions: () => [{ a: 1 }, { a: 1 }] } ]) {
    const r = await run(graph({ S: ['A'] }, extra)); assert.equal(r.status, 'SIMULATION_UNSUPPORTED');
  }
});
test('reopening a state with more remaining horizon reuses cached transitions', async () => {
  const r = await run(graph({ S: ['A', 'B'], A: ['C'], C: ['X'], X: ['Y'], Y: ['G'], B: ['X'] }, {
    heuristic: s => s === 'B' ? 100 : 0, heuristicAdmissible: false,
  }), { maxDepth: 4, heuristic: 'adapter' });
  assert.equal(r.status, 'GOAL_REACHED'); assert.equal(r.plan.decisions, 4); assert.ok(r.stats.cacheHits >= 1); assert.equal(r.solutionOptimal, false);
});
test('state key includes goal evidence when success depends on the arriving edge', async () => {
  const r = await run(graph({ S: ['A', 'B'], A: ['X'], B: ['X'] }, {
    isGoal: (s, _, t) => s === 'X' && t?.from === 'B',
  })); assert.equal(r.status, 'GOAL_REACHED');
});
test('one decision can consume zero or multiple world turns', async () => {
  const r = await run(graph({ S: [{ to: 'A', turns: 0 }], A: [{ to: 'G', turns: 3 }] }));
  assert.equal(r.plan.decisions, 2); assert.equal(r.plan.worldTurns, 3);
});
test('goal at root needs no simulation', async () => {
  const r = await run(graph({}), {}, { goal: 'S' }); assert.equal(r.status, 'GOAL_REACHED'); assert.equal(r.plan.decisions, 0);
});
test('memory and node caps stop before retaining excess state', async () => {
  const r = await run(graph({ S: ['A'] }), { maxNodes: 1 }); assert.equal(r.stopReason, 'nodes'); assert.equal(r.stats.retainedNodes, 1);
  const s = await run(graph({ S: ['A'] }), { maxBytes: 1 }); assert.equal(s.stopReason, 'accounted-bytes'); assert.equal(s.stats.retainedNodes, 0);
});
test('cancellation before and during simulation releases the adapter', async () => {
  for (const before of [true, false]) {
    const controller = new AbortController(); let aborted = 0;
    if (before) controller.abort();
    const adapter = graph({ S: ['G'] }, { step: async () => { controller.abort(); return new Promise(() => {}); }, abort: () => aborted++ });
    const r = await run(adapter, {}, { signal: controller.signal });
    assert.equal(r.status, 'CANCELLED'); assert.equal(r.plan, null); assert.equal(aborted, 1);
  }
});
test('wall-clock deadline interrupts an asynchronous operation', async () => {
  const r = await run(graph({ S: ['G'] }, { step: async () => new Promise(() => {}) }), { maxMillis: 15 });
  assert.equal(r.status, 'SEARCH_BUDGET_EXHAUSTED'); assert.equal(r.stopReason, 'wall-clock');
});
test('explicit bounded-settlement adapter retains a completed goal edge past search cutoff', async () => {
  let clock=0;
  const adapter=graph({S:['G']},{settlePastDeadline:true,step:async()=>{
    await new Promise(resolve=>setTimeout(resolve,20));
    return {kind:'ok',state:'G',healthLoss:0,turnDelta:1,terminal:false,truncated:false};
  }});
  const r=await run(adapter,{maxMillis:5});
  assert.equal(r.status,'GOAL_REACHED');assert.equal(r.stopReason,'wall-clock');
  assert.equal(r.plan.decisions,1);assert.equal(r.solutionOptimal,false);
});
test('invalid configuration rejected before simulation; no prototype option keys', async () => {
  for (const options of [{ maxDepth: -1 }, { maxDepth: 65 }, { mystery: 3 }, { toString: 2 }]) {
    await assert.rejects(run(graph({}), options), TypeError);
  }
});
test('bounded LRU respects entry/byte caps and access order', () => {
  const cache = new C.BoundedCache(2, 10);
  cache.set('a', 1, 4); cache.set('b', 2, 4); cache.get('a'); cache.set('c', 3, 4);
  assert.equal(cache.get('b'), undefined); assert.equal(cache.get('a'), 1); assert.equal(cache.bytes, 8);
  cache.set('huge', 4, 100); assert.equal(cache.get('huge'), undefined); cache.trim(3); assert.equal(cache.bytes, 0);
});
test('canonical state keys preserve phase/RNG differences and ignore object key order', () => {
  assert.equal(C.canonical({ b: 2, a: 1 }), C.canonical({ a: 1, b: 2 }));
  assert.notEqual(C.canonical({ x: 1, rng: 2 }), C.canonical({ x: 1, rng: 3 }));
  assert.throws(() => C.canonical({ damage: NaN }));
});
test('no cross-query cache leakage', async () => {
  let calls = 0; const a = graph({ S: ['G'] }); const step = a.step; a.step = (...args) => { calls++; return step(...args); };
  await run(a); await run(a); assert.equal(calls, 2);
});
test('200 seeded finite graphs agree with an independent bounded BFS oracle', async () => {
  let seed = 1927; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let trial = 0; trial < 200; trial++) {
    const edges = {}, names = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    for (const name of names) edges[name] = Array.from({ length: Math.floor(random() * 5) }, () => ({ to: names[Math.floor(random() * names.length)], loss: random() < 0.25 ? 1 : 0 }));
    const maxDepth = Math.floor(random() * 7), queue = [['S', 0]], seen = new Set(['S']); let expected = null;
    while (queue.length) { const [state, depth] = queue.shift(); if (state === 'G') { expected = depth; break; } if (depth >= maxDepth) continue;
      for (const edge of edges[state]) if (!edge.loss && !seen.has(edge.to)) { seen.add(edge.to); queue.push([edge.to, depth + 1]); } }
    const r = await run(graph(edges), { maxDepth });
    assert.equal(r.status === 'GOAL_REACHED', expected !== null, `trial ${trial}`);
    if (expected !== null) assert.equal(r.plan.decisions, expected, `trial ${trial}`);
  }
});
test('asynchronous or non-boolean safety policies cannot accidentally admit an edge', async () => {
  const r = await run(graph({ S: ['G'] }), {}, { policy: { id: 'bad-policy', accepts: async () => false } });
  assert.equal(r.status, 'SIMULATION_UNSUPPORTED');
});
