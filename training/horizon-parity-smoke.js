/* Dedicated real-browser continuation check. It only advances this page's test game. */
(function (root) {
  'use strict';
  const Core = root.AgentHorizonCore, Host = root.AgentHorizonHost;
  const directions = ['up', 'right', 'down', 'left'];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const escaped = key => String(key).replace(/~/g, '~0').replace(/\//g, '~1');
  function firstDifference(expected, actual, path) {
    if (Object.is(expected, actual)) return null;
    if (!expected || !actual || typeof expected !== 'object' || typeof actual !== 'object' ||
        Array.isArray(expected) !== Array.isArray(actual)) return { path, expected, actual };
    if (Array.isArray(expected) && expected.length !== actual.length)
      return { path: path + '/length', expected: expected.length, actual: actual.length };
    for (const key of [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()) {
      const at = path + '/' + escaped(key);
      if (own(expected, key) !== own(actual, key)) return { path: at, expected: expected[key], actual: actual[key] };
      const difference = firstDifference(expected[key], actual[key], at);
      if (difference) return difference;
    }
    return null;
  }
  function assertSame(expected, actual, phase, path) {
    const left = Core.canonical(expected), right = Core.canonical(actual);
    if (left === right) return;
    const difference = firstDifference(JSON.parse(left), JSON.parse(right), path);
    const error = new Error('Continuation mismatch at ' + difference.path);
    error.code = 'HORIZON_CONTINUATION_MISMATCH'; error.path = difference.path;
    const describe = value => value === undefined ? '<missing>' : Core.canonical(value).slice(0, 512);
    error.details = { phase, expected: describe(difference.expected), actual: describe(difference.actual) };
    throw error;
  }
  function eligible(result, view, before) {
    return result.info?.recorded === true && result.info.turnDelta > 0 &&
      result.planning?.healthLoss === 0 && !result.terminated &&
      view.decision === 'world' && view.room.id === before.room.id &&
      (view.player.x !== before.player.x || view.player.y !== before.player.y);
  }
  async function run(live, { seed = 1, scenario = 'standard', onProgress,
    caseTimeoutMs = 180000, operationTimeoutMs = 30000 } = {}) {
    const report = { schemaVersion: 1, suite: 'horizon-planning-continuation-browser-v1', seed, scenario,
      actualGame: true, pass: false, status: 'FAIL', phase: 'preflight', results: [] };
    let simulator, child, caught;
    const session = root.HorizonSmokeSession.create({ report, onProgress, caseTimeoutMs, operationTimeoutMs,
      probe: () => ({ live: root.HorizonSmokeSession.agentStatus(live),
        child: root.HorizonSmokeSession.agentStatus(child) }) });
    const op = (name, fn) => session.operation(name, fn);
    function checked(name, fn) {
      fn(); report.results.push({ name, pass: true }); session.publish();
    }
    try {
      if (!live || !['reset', 'step', 'observe', 'capturePlanningSnapshot', 'getPlanningGuard'].every(name =>
        typeof live[name] === 'function')) throw new Error('Game agent lacks the planning continuation contract');
      report.phase = 'reset'; await op('live.reset', () => live.reset(seed, { scenario, maxSteps: 64 }));
      const rootView = live.observe(), rootGuard = live.getPlanningGuard();
      const rootSnapshot = await op('root.capture', () => live.capturePlanningSnapshot());
      simulator = new root.AgentSimulationHost.IsolatedSimulator({ source: () => live });
      child = await op('simulator.start', () => simulator.agent());
      await op('root.restore', () => child.restorePlanningSnapshot(rootSnapshot.serialized));
      checked('root observation', () => Host.assertViewIdentity(rootView, child.observe(), 'root'));
      checked('root guard', () => assertSame(rootGuard, child.getPlanningGuard(), 'root', '/guard'));

      async function chooseAction(snapshot, before, label) {
        for (const direction of directions) {
          await op(label + '.' + direction + '.restore', () => child.restorePlanningSnapshot(snapshot.serialized));
          const action = { type: 'Move', direction };
          const result = await op(label + '.' + direction + '.trial', () => child.stepForPlanning(action));
          const view = child.observe();
          if (eligible(result, view, before)) return { action, result, view, guard: child.getPlanningGuard() };
        }
        const error = new Error('No safe recorded movement in the fixed direction set');
        error.code = 'HORIZON_CONTINUATION_NO_FIXTURE'; error.path = '/' + label;
        throw error;
      }
      report.phase = 'first-action';
      const first = await chooseAction(rootSnapshot, rootView, 'first');
      report.actions = [first.action];
      checked('simulator did not advance live game', () => {
        Host.assertViewIdentity(rootView, live.observe(), 'simulator-isolation');
        assertSame(rootGuard, live.getPlanningGuard(), 'simulator-isolation', '/guard');
      });
      const liveFirst = await op('first.live-step', () => live.step(first.action));
      checked('first action result', () => assertSame(first.result.info, liveFirst.info, 'first', '/info'));
      checked('first action observation', () => Host.assertViewIdentity(first.view, live.observe(), 'first'));
      checked('first action guard', () => assertSame(first.guard, live.getPlanningGuard(), 'first', '/guard'));

      report.phase = 'continuation';
      const continuationView = live.observe(), continuationGuard = live.getPlanningGuard();
      const continuation = await op('continuation.capture', () => live.capturePlanningSnapshot());
      await op('continuation.restore', () => child.restorePlanningSnapshot(continuation.serialized));
      checked('restored observation', () => Host.assertViewIdentity(continuationView, child.observe(), 'continuation-restore'));
      checked('restored guard', () => assertSame(continuationGuard, child.getPlanningGuard(), 'continuation-restore', '/guard'));
      const second = await chooseAction(continuation, continuationView, 'second');
      report.actions.push(second.action);
      await op('second.repeat-restore', () => child.restorePlanningSnapshot(continuation.serialized));
      const repeated = await op('second.repeat-step', () => child.stepForPlanning(second.action));
      checked('restored next action result', () => assertSame(second.result.info, repeated.info, 'repeated-second', '/info'));
      checked('restored next action observation', () => Host.assertViewIdentity(second.view, child.observe(), 'repeated-second'));
      checked('restored next action guard', () => assertSame(second.guard, child.getPlanningGuard(), 'repeated-second', '/guard'));
      checked('simulator still did not advance live game', () => {
        Host.assertViewIdentity(continuationView, live.observe(), 'simulator-isolation');
        assertSame(continuationGuard, live.getPlanningGuard(), 'simulator-isolation', '/guard');
      });
      const liveSecond = await op('second.live-step', () => live.step(second.action));
      checked('next live action result', () => assertSame(second.result.info, liveSecond.info, 'live-second', '/info'));
      checked('next live action observation', () => Host.assertViewIdentity(second.view, live.observe(), 'live-second'));
      checked('next live action guard', () => assertSame(second.guard, live.getPlanningGuard(), 'live-second', '/guard'));
      report.coverage = { recordedActions: 2, snapshotRestores: 2, scenario,
        firstTurnDelta: liveFirst.info.turnDelta, nextTurnDelta: liveSecond.info.turnDelta };
      report.pass = true; report.status = 'PASS'; report.phase = 'complete';
    } catch (error) { caught = error; }
    finally { try { simulator?.dispose(); } catch (error) { if (!caught) caught = error; } }
    return session.finish(caught);
  }
  root.AgentHorizonSmoke = { run };
})(globalThis);
