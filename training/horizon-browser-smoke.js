/* Dedicated smoke page only. Never reset a live playing/training session. */
(function (root, factory) {
  const api = factory(root, typeof module === 'object' && module.exports ? require('./horizon-smoke-session.js') : root.HorizonSmokeSession);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentHorizonSmoke = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, Sessions) {
  'use strict';
  const escape = key => String(key).replace(/~/g, '~0').replace(/\//g, '~1');
  function snapshotFacts(snapshot) {
    const wire = JSON.parse(snapshot.serialized), counts = {}, samples = [];
    function walk(node, path, depth) {
      if (depth > 140 || !Array.isArray(node)) return;
      if (node[0] === 'object' && Array.isArray(node[1])) {
        for (const pair of node[1]) if (Array.isArray(pair)) walk(pair[1], path + '/' + escape(pair[0]), depth + 1);
      } else if (node[0] === 'array' && Array.isArray(node[1])) {
        node[1].forEach((value, i) => walk(value, path + '/' + i, depth + 1));
      } else if (['undefined', 'hole', 'number'].includes(node[0])) {
        const type = node[0] === 'number' ? node[1] : node[0]; counts[type] = (counts[type] || 0) + 1;
        if (samples.length < 16) samples.push({ path, type });
      }
    }
    walk(wire.data, '', 0);
    return { schemaVersion: snapshot.schemaVersion, format: wire.format, codec: wire.codec,
      characters: snapshot.serialized.length, specialValueCounts: counts, specialValueSamples: samples };
  }
  let activeSession = null;
  async function run(live, { seed = 1, scenario = 'standard', onProgress, signal,
    caseTimeoutMs = 180000, operationTimeoutMs = 30000 } = {}) {
    if (activeSession) throw new Error('A smoke session already owns this page; reload after cancellation');
    const Core = root.AgentHorizonCore, Host = root.AgentHorizonHost;
    const report = { schemaVersion: 3, seed, scenario, pass: false, status: 'FAIL', phase: 'preflight', results: [] };
    let host, simulator, child, caught;
    const session = Sessions.create({ report, onProgress, signal, caseTimeoutMs, operationTimeoutMs,
      probe: () => ({ live: Sessions.agentStatus(live), child: Sessions.agentStatus(child) }) });
    activeSession = session;
    const op = (name, fn, budget) => session.operation(name, fn, budget);
    const restore = (snapshot, label) => op(label, () => child.restorePlanningSnapshot(snapshot.serialized));
    const step = (action, label) => op(label, () => child.stepForPlanning(action));
    session.publish();
    function checked(name, condition, details) {
      report.results.push({ name, pass: !!condition }); session.publish();
      if (!condition) { const error = new Error('FAIL: ' + name); error.code = 'PLANNING_SMOKE_ASSERTION';
        if (details) report.failedResult = details; throw error; }
    }
    try {
      if (!live || typeof live.reset !== 'function') throw new Error('Game agent not initialized');
      for (const name of ['capturePlanningSnapshot', 'restorePlanningSnapshot', 'stepForPlanning', 'getPlanningGuard', 'getPlanningCapabilities']) {
        if (typeof live[name] !== 'function') throw new Error('PLANNING_BUILD_MISMATCH: rebuild the development bundle; missing ' + name);
      }
      report.capabilities = live.getPlanningCapabilities();
      checked('snapshot v3 capability', report.capabilities.snapshotSchemaVersion === 3);
      report.phase = 'reset'; report.resetCycles = scenario === 'standard' ? 1 : 2;
      for (let i = 0; i < report.resetCycles; i++) await op('reset.' + (i + 1), () => live.reset(seed, { maxSteps: 64, scenario }));
      report.phase = 'capture-root';
      const snapshot = await op('root.capture', () => live.capturePlanningSnapshot()), before = await op('live.guard', () => Core.canonical(live.getPlanningGuard()));
      report.rootSnapshot = await op('root.describe', () => snapshotFacts(snapshot));
      const viewBefore = await op('live.observe', () => Host.viewIdentity(live.observe()));
      simulator = new root.AgentSimulationHost.IsolatedSimulator({ source: () => live });
      host = Host.create({ source: () => live, simulator, onOperation: event => {
        report.suboperation = event; session.publish();
      } });
      report.phase = 'start-simulator'; child = await op('simulator.start', () => simulator.agent());
      checked('live/child codec capabilities match', Core.canonical(child.getPlanningCapabilities()) === Core.canonical(report.capabilities));
      report.phase = 'restore-root'; await restore(snapshot, 'root.restore');
      await op('root.verify-view', () => checked('root restore matches observation and budget', Host.viewIdentity(child.observe()) === viewBefore));
      await op('root.verify-guard', () => checked('root restore preserves the lossless diagnostic guard', Core.canonical(child.getPlanningGuard()) === before));
      const directions = ['up', 'right', 'down', 'left']; let chosen = null;
      for (const direction of directions) {
        report.phase = 'find-safe-first-action'; report.actions = [{ type: 'Move', direction }];
        await restore(snapshot, 'candidate.' + direction + '.restore');
        const action = report.actions[0], first = await step(action, 'candidate.' + direction + '.step'), view = child.observe();
        if (!first.info.recorded || first.terminated || first.planning.healthLoss !== 0 || view.decision !== 'world') continue;
        const next = await op('child.capture', () => child.capturePlanningSnapshot()), firstIdentity = await op('child.view', () => Host.viewIdentity(view)), firstGuard = await op('child.guard', () => Core.canonical(child.getPlanningGuard()));
        report.phase = 'repeat-first-action';
        await restore(snapshot, 'repeat.restore'); const repeated = await step(action, 'repeat.step');
        await op('repeat.verify', () => checked('same root/action repeats metrics, observation and guard', Core.canonical(first.planning) === Core.canonical(repeated.planning) &&
          Host.viewIdentity(child.observe()) === firstIdentity && Core.canonical(child.getPlanningGuard()) === firstGuard));
        report.phase = 'restore-child'; await restore(next, 'child.restore');
        await op('child.verify', () => checked('child snapshot continues without resetting counters', Host.viewIdentity(child.observe()) === firstIdentity && Core.canonical(child.getPlanningGuard()) === firstGuard));
        for (const secondDirection of directions) {
          report.phase = 'two-action-continuation';
          const second = { type: 'Move', direction: secondDirection }; report.actions = [action, second];
          await restore(snapshot, 'parity.' + secondDirection + '.root-restore'); await step(action, 'parity.' + secondDirection + '.first');
          const uninterrupted = await step(second, 'parity.' + secondDirection + '.uninterrupted'), uninterruptedView = await op('parity.' + secondDirection + '.view', () => Host.viewIdentity(child.observe())), uninterruptedGuard = await op('parity.' + secondDirection + '.guard', () => Core.canonical(child.getPlanningGuard()));
          await restore(next, 'parity.' + secondDirection + '.child-restore'); const reloaded = await step(second, 'parity.' + secondDirection + '.reloaded');
          await op('parity.' + secondDirection + '.verify', () => checked('two-action continuation parity: ' + secondDirection, Core.canonical(uninterrupted.planning) === Core.canonical(reloaded.planning) &&
            Core.canonical(uninterrupted.info) === Core.canonical(reloaded.info) && Host.viewIdentity(child.observe()) === uninterruptedView &&
            Core.canonical(child.getPlanningGuard()) === uninterruptedGuard));
        }
        if (view.room.id === live.observe().room.id && (view.player.x !== live.observe().player.x || view.player.y !== live.observe().player.y)) {
          chosen = { kind: 'position', roomId: view.room.id, x: view.player.x, y: view.player.y, z: view.player.z }; break;
        }
      }
      if (!chosen) { report.status = 'INCONCLUSIVE'; throw new Error('No eligible safe movement fixture. Retain this result; additional seeds are separate coverage, not replacements for failed tests.'); }
      report.phase = 'plan-reachable-goal'; report.goal = chosen;
      const plan = await op('planner.reachable', () => host.plan(chosen, { maxDepth: 2, maxSimulations: 64, maxMillis: 30000 }, { signal: session.signal }), 60000);
      checked('real-game planner reaches the known reachable target', plan.status === 'GOAL_REACHED', plan);
      checked('plan reports zero gross health loss', plan.plan.healthLoss === 0);
      report.phase = 'replay-returned-plan'; simulator.dispose(); child = await op('plan-replay.simulator-restart', () => simulator.agent()); await restore(snapshot, 'plan-replay.restore');
      for (let i = 0; i < plan.plan.actions.length; i++) {
        const action = plan.plan.actions[i]; report.actions = plan.plan.actions.slice(0, i + 1);
        const result = await step(action, 'plan-replay.step.' + i);
        checked('plan replay metrics: ' + i, result.info.recorded === true && result.planning.healthLoss === plan.plan.steps[i].healthLoss &&
          result.info.turnDelta === plan.plan.steps[i].turnDelta && !result.terminated);
      }
      const reached = child.observe(); checked('returned plan replay reaches the goal', reached.room.id === chosen.roomId &&
        reached.player.x === chosen.x && reached.player.y === chosen.y && reached.player.z === chosen.z);
      report.phase = 'budget-and-cancellation'; const current = live.observe();
      const cutoffGoal = { kind: 'position', roomId: current.room.id, x: current.player.x + 100, y: current.player.y, z: current.player.z };
      const cutoff = await op('planner.zero-budget', () => host.plan(cutoffGoal, { maxSimulations: 0 }, { signal: session.signal }));
      checked('budget exhaustion is not impossibility', cutoff.status === 'SEARCH_BUDGET_EXHAUSTED', cutoff);
      const abort = new AbortController(); abort.abort();
      checked('pre-aborted query is cancelled', (await op('planner.pre-aborted', () => host.plan(cutoffGoal, {}, { signal: abort.signal }))).status === 'CANCELLED');
      report.phase = 'live-unchanged';
      await op('live.verify-unchanged', () => checked('live diagnostic guard, RNG and observation remain unchanged', Core.canonical(live.getPlanningGuard()) === before && Host.viewIdentity(live.observe()) === viewBefore));
      report.plannerStats = plan.stats; report.timing = plan.timing; report.contract = current.contract;
      report.pass = true; report.status = 'PASS'; report.phase = 'complete'; delete report.actions;
    } catch (error) { caught = error; }
    finally {
      try { if (host) host.dispose(); else if (simulator) simulator.dispose(); }
      catch (error) { if (!caught) caught = error; else report.cleanupError = Sessions.errorSummary(error); }
    }
    const result = session.finish(caught);
    // A timed-out underlying engine promise cannot be un-called. Retire the page after failure.
    if (result.pass) activeSession = null;
    return result;
  }
  return { run, snapshotFacts, status: () => activeSession?.status() || null,
    cancel: () => activeSession?.cancel() };
});
