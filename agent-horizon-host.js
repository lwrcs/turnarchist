/* Privileged, advisory-only adapter for Turnarchist's isolated simulator. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./agent-horizon-core.js'), () => require('./agent-simulation-host.js'));
  } else root.AgentHorizonHost = factory(root.AgentHorizonCore, () => root.AgentSimulationHost);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, getBase) {
  'use strict';
  const DIRECTIONS = Object.freeze({ up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] });
  const clone = value => JSON.parse(JSON.stringify(value));
  function failure(status, reason) {
    return { schemaVersion: 1, plannerVersion: Core.VERSION, status, stopReason: reason,
      assistance: 'privileged-oracle-advisory', solutionOptimal: false, plan: null, prefix: null, stats: null };
  }
  function validateGoal(input, view) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Goal must be an object');
    const goal = clone(input), allowed = ['kind', 'roomId', 'x', 'y', 'z', 'targetRoomId', 'targetDepth'];
    if (Object.keys(goal).some(key => !allowed.includes(key)) || !['position', 'exit'].includes(goal.kind) ||
        typeof goal.roomId !== 'string' || !goal.roomId || goal.roomId !== view.room.id ||
        !Number.isSafeInteger(goal.x) || !Number.isSafeInteger(goal.y)) throw new TypeError('Goal must name a tile in the current origin room');
    if (goal.z === undefined) goal.z = view.player.z;
    if (!Number.isFinite(goal.z)) throw new TypeError('Goal z must be finite');
    if ('targetRoomId' in goal && (goal.kind !== 'exit' || typeof goal.targetRoomId !== 'string' || !goal.targetRoomId)) throw new TypeError('Invalid targetRoomId');
    if ('targetDepth' in goal && (goal.kind !== 'exit' || !Number.isSafeInteger(goal.targetDepth))) throw new TypeError('Invalid targetDepth');
    return Object.freeze(goal);
  }
  function viewIdentity(view) {
    // Exclude UI readiness and diagnostic history, not physical/player state.
    const keys = ['seed', 'scenario', 'steps', 'maxSteps', 'contract', 'player', 'room', 'inventory',
      'decision', 'selectionChoices', 'vendingMachine', 'terminated', 'truncated', 'failure'];
    const result = {};
    for (const key of keys) if (view[key] !== undefined) result[key] = view[key];
    return Core.canonical(result);
  }
  /** Compare the unchanged identity projection, reporting the first exact differing field. */
  function assertViewIdentity(expected, actual, phase = 'restore') {
    const leftText = viewIdentity(expected), rightText = viewIdentity(actual);
    if (leftText === rightText) return;
    const left = JSON.parse(leftText), right = JSON.parse(rightText);
    const escape = key => String(key).replace(/~/g, '~0').replace(/\//g, '~1');
    const describe = value => value === undefined ? '<missing>' : Core.canonical(value).slice(0, 512);
    function difference(a, b, path) {
      if (Object.is(a, b)) return null;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return { path, a, b };
      if (Array.isArray(a) && a.length !== b.length) return { path: path + '/length', a: a.length, b: b.length };
      for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
        const at = path + '/' + escape(key);
        if (Object.prototype.hasOwnProperty.call(a, key) !== Object.prototype.hasOwnProperty.call(b, key)) return { path: at, a: a[key], b: b[key] };
        const found = difference(a[key], b[key], at); if (found) return found;
      }
      return null;
    }
    const d = difference(left, right, '/observation') || { path: '/observation', a: left, b: right };
    const error = new Error('PLANNING_OBSERVATION_MISMATCH at ' + d.path + ': Restored branch observation mismatch');
    error.name = 'PlanningObservationError'; error.code = 'PLANNING_OBSERVATION_MISMATCH'; error.path = d.path;
    error.details = { expected: describe(d.a), actual: describe(d.b), phase };
    throw error;
  }
  function summary(view) {
    return { player: clone(view.player), room: { id: view.room.id, depth: view.room.depth }, decision: view.decision };
  }
  function goalReached(state, goal, transition) {
    const view = state.view;
    if (goal.kind === 'position') return view.room.id === goal.roomId &&
      view.player.x === goal.x && view.player.y === goal.y && view.player.z === goal.z;
    if (!transition || transition.from.view.room.id !== goal.roomId) return false;
    const before = transition.from.view, action = transition.action;
    if (view.room.id === goal.roomId && view.room.depth === before.room.depth) return false;
    if ('targetRoomId' in goal && view.room.id !== goal.targetRoomId) return false;
    if ('targetDepth' in goal && view.room.depth !== goal.targetDepth) return false;
    if (before.player.z !== goal.z) return false;
    if (action.type === 'LadderConfirm') return before.player.x === goal.x && before.player.y === goal.y;
    const delta = action.type === 'Move' ? DIRECTIONS[action.direction] : null;
    return !!delta && before.player.x + delta[0] === goal.x && before.player.y + delta[1] === goal.y;
  }
  function actionsFor(state, goal) {
    const view = state.view;
    // This phase searches the origin room and a single successful exit, not the dungeon.
    if (view.room.id !== goal.roomId || view.terminated || view.truncated) return [];
    switch (view.decision) {
      case 'world': {
        // Branch restoration is intentionally exact but can be expensive in a populated
        // room. Evaluate moves that reduce distance to the requested tile first so a
        // bounded search does not spend its whole wall-clock budget on moves away from
        // the goal. This changes ordering only; all four legal requests remain present.
        const dx = goal.x - view.player.x, dy = goal.y - view.player.y;
        const verticalFirst = Math.abs(dy) >= Math.abs(dx);
        return Object.entries(DIRECTIONS).map(([direction, [mx, my]], order) => ({
          action: { type: 'Move', direction },
          distance: Math.abs(view.player.x + mx - goal.x) + Math.abs(view.player.y + my - goal.y),
          axis: verticalFirst ? (my === 0 ? 1 : 0) : (mx === 0 ? 1 : 0), order,
        })).sort((a,b) => a.distance-b.distance || a.axis-b.axis || a.order-b.order).map(entry => entry.action);
      }
      case 'ladder': return [{ type: 'LadderConfirm' }, { type: 'LadderCancel' }];
      case 'vending': case 'dismissable-interaction': return [{ type: 'DismissInteraction' }];
      default: throw new Error('Unsupported planning decision: ' + view.decision);
    }
  }
  /** Reuse an existing IsolatedSimulator to share its preview mutex and iframe. */
  function create({ source, simulator, createFrame, stepTimeoutMs = 3000, settlementTimeoutMs = 15000, onOperation } = {}) {
    if (!Core) throw new Error('Load agent-horizon-core.js first');
    if (onOperation !== undefined && typeof onOperation !== 'function') throw new TypeError('onOperation must be a function');
    if (typeof source !== 'function') throw new TypeError('source must return the live window.agent');
    if (!Number.isSafeInteger(stepTimeoutMs) || stepTimeoutMs < 1 || stepTimeoutMs > 60000) throw new TypeError('Invalid stepTimeoutMs');
    if (!Number.isSafeInteger(settlementTimeoutMs) || settlementTimeoutMs < stepTimeoutMs || settlementTimeoutMs > 60000) throw new TypeError('Invalid settlementTimeoutMs');
    if (!simulator) {
      const Base = getBase();
      if (!Base?.IsolatedSimulator) throw new Error('Load agent-simulation-host.js before creating the host');
      simulator = new Base.IsolatedSimulator({ source, createFrame });
    }
    let controller = null, lastFailureReproduction = null;
    function rememberRestoreFailure(current, goal, action, error, actualView) {
      // Retained locally only, on failure. The viewer includes it only on explicit export.
      const record = { format: 'horizon-restore-reproduction-v1', phase: 'branch.restore',
        snapshot: current.snapshot, expectedView: current.view, actualView: actualView || null,
        goal, candidateAction: action, error: Core.errorSummary(error),
        stack: typeof error?.stack === 'string' ? error.stack.slice(0,6000) : null };
      const text = JSON.stringify(record);
      lastFailureReproduction = text.length <= 2 * 1024 * 1024 ? text : JSON.stringify({
        format: record.format, omitted: 'reproduction exceeds 2 MiB character cap',
        characters: text.length, error: record.error });
    }
    const monotonic = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
    function notify(event) {
      // Opt-in instrumentation cannot change planning state or suppress a simulator error.
      if (onOperation) { try { onOperation(Object.freeze({ ...event })); } catch {} }
    }
    async function bounded(operation, signal, milliseconds = stepTimeoutMs, phase = 'operation') {
      if (signal.aborted) throw new Error('Planning cancelled');
      const started = monotonic(); let timer, onAbort;
      const timedOut = () => {
        const error = new Error('Planning simulator operation timed out: ' + phase);
        error.code = 'PLANNING_OPERATION_TIMEOUT'; error.path = '/simulator/' + phase;
        error.details = { operation: phase, budgetMs: milliseconds, elapsedMs: Math.round(monotonic() - started) };
        return error;
      };
      notify({ phase, status: 'started', budgetMs: milliseconds });
      const stop = new Promise((_, reject) => {
        timer = setTimeout(() => reject(timedOut()), milliseconds);
        onAbort = () => reject(new Error('Planning cancelled'));
        signal.addEventListener('abort', onAbort, { once: true });
      });
      try {
        const result = await Promise.race([Promise.resolve().then(() => {
          if (signal.aborted) throw new Error('Planning cancelled'); return operation();
        }), stop]);
        if (signal.aborted) throw new Error('Planning cancelled');
        // Promise continuations run before overdue timer tasks after a synchronous long task.
        if (monotonic() - started >= milliseconds) throw timedOut();
        notify({ phase, status: 'complete', budgetMs: milliseconds, elapsedMs: Math.round(monotonic() - started) });
        return result;
      } catch (error) {
        notify({ phase, status: 'failed', budgetMs: milliseconds, elapsedMs: Math.round(monotonic() - started), code: String(error?.code || 'SIMULATOR_ERROR') });
        throw error;
      } finally { clearTimeout(timer); signal.removeEventListener('abort', onAbort); }
    }
    async function runPlan(inputGoal, options = {}, { signal } = {}, forExecution = false) {
      try { Core.optionsFor(options); } catch (error) { return failure('INVALID_REQUEST', String(error.message)); }
      if (simulator.pending) return failure('BUSY', 'Another preview or horizon search owns this simulator');
      lastFailureReproduction = null;
      const own = new AbortController(); controller = own;
      const abort = () => own.abort();
      if (signal?.aborted) own.abort();
      signal?.addEventListener('abort', abort, { once: true });
      const task = Promise.resolve().then(async () => {
        if (own.signal.aborted) return failure('CANCELLED', 'abort-signal');
        const live = source();
        for (const method of ['observe', 'capturePlanningSnapshot', 'getPlanningGuard', 'getPlanningCapabilities']) {
          if (typeof live?.[method] !== 'function') return failure('SIMULATION_UNSUPPORTED', 'Rebuild required: missing live agent.' + method);
        }
        if (simulator.source && simulator.source() !== live) return failure('INVALID_REQUEST', 'Simulator and planner must share the same live agent');
        const liveBefore = clone(live.observe());
        if (liveBefore.terminated || liveBefore.truncated || liveBefore.ready !== true) return failure('SIMULATION_UNSUPPORTED', 'Live episode must be initialized, ready, and within its decision budget');
        let goal;
        try { goal = validateGoal(inputGoal, liveBefore); }
        catch (error) { return failure('INVALID_REQUEST', String(error.message)); }
        const guard = Core.canonical(live.getPlanningGuard()), visible = viewIdentity(liveBefore);
        const unchanged = () => {
          if (source() !== live || Core.canonical(live.getPlanningGuard()) !== guard || viewIdentity(live.observe()) !== visible) {
            throw new Error('Live game changed during planning; discard this query');
          }
        };
        const state = agent => {
          const view = clone(agent.observe()), snapshot = clone(agent.capturePlanningSnapshot());
          if (snapshot.schemaVersion !== 3 || snapshot.source !== 'privileged-horizon-snapshot' || typeof snapshot.serialized !== 'string') throw new Error('Unsupported planning snapshot');
          // Conservative identity: NO removal of RNG, counters, metadata, or history.
          return { view, snapshot, identity: Core.canonical(JSON.parse(snapshot.serialized)) };
        };
        const capabilities = Core.canonical(live.getPlanningCapabilities());
        if (live.getPlanningCapabilities().snapshotSchemaVersion !== 3) throw new Error('PLANNING_BUILD_MISMATCH: rebuild the live game to snapshot v3');
        const root = state(live); unchanged();
        // Opt-in first-edge evidence. Ordinary advisory calls allocate none of this.
        const firstEdges = forExecution ? new Map() : null;
        const requested = Core.optionsFor(options);
        const evidenceBudget = forExecution ? Math.min(8 * 1024 * 1024, Math.floor(requested.maxBytes / 4)) : 0;
        let evidenceBytes = 0;
        const timing = { startupMs: 0, restoreMs: 0, stepMs: 0, captureMs: 0 };
        // Bounded diagnostic ledger: enough to explain why candidates were admitted or
        // discarded, without retaining snapshots or hidden game state.
        const candidateLedger = [];
        const recordCandidate = entry => {
          if (candidateLedger.length < 128) candidateLedger.push(clone(entry));
        };
        let child = null, loadedIdentity = null;
        async function readyChild() {
          if (child) return child;
          const start = Date.now();
          child = await bounded(() => simulator.agent(), own.signal, 15000, 'startup');
          timing.startupMs += Date.now() - start;
          for (const method of ['restorePlanningSnapshot', 'capturePlanningSnapshot', 'stepForPlanning', 'observe', 'getPlanningCapabilities']) {
            if (typeof child?.[method] !== 'function') throw new Error('Rebuild required: missing simulator agent.' + method);
          }
          if (Core.canonical(child.getPlanningCapabilities()) !== capabilities) throw new Error('PLANNING_BUILD_MISMATCH: live and simulator capabilities differ; rebuild and reload both realms');
          return child;
        }
        const adapter = {
          namespace: 'turnarchist-savev2-or-sandbox/horizon-v3',
          // Candidate settlement has its own strict operation timeout. Let an
          // already-admitted action finish so presentation/level-transition
          // settlement can produce a verified edge at the query cutoff.
          settlePastDeadline: true,
          key: current => current.identity,
          estimateBytes: current => current.identity.length * 2 + (current.snapshot?.serialized.length ?? 0) * 2 + JSON.stringify(current.view).length * 2,
          describe: current => summary(current.view),
          actions: actionsFor,
          isGoal: goalReached,
          // Ordering only. Teleports/knockback/multi-tile actions make Manhattan
          // inadmissible in general; never label this optional search optimal.
          heuristicAdmissible: false,
          heuristic: (current, target) => Math.abs(current.view.player.x - target.x) + Math.abs(current.view.player.y - target.y),
          rankFrontier: (current, target) => current.view.room.id === target.roomId
            ? Math.abs(current.view.player.x - target.x) + Math.abs(current.view.player.y - target.y) : 1e9,
          abort: () => { simulator.dispose(); child = null; },
          async step(current, action) {
            unchanged();
            const agent = await readyChild();
            const diagnostic = { action: clone(action), from: summary(current.view).player };
            let start = Date.now();
            let restoredView = null;
            try {
              if (loadedIdentity !== current.identity) {
                await bounded(() => agent.restorePlanningSnapshot(current.snapshot.serialized), own.signal, stepTimeoutMs, 'restore');
                restoredView = clone(agent.observe());
                assertViewIdentity(current.view, restoredView, 'branch.restore');
                loadedIdentity = current.identity;
              }
            } catch (error) {
              loadedIdentity = null;
              recordCandidate({ ...diagnostic, outcome: 'restore-error', error: Core.errorSummary(error) });
              rememberRestoreFailure(current, goal, action, error, restoredView);
              throw error;
            }
            timing.restoreMs += Date.now() - start;
            let result;
            start = Date.now();
            try { result = await bounded(() => agent.stepForPlanning(clone(action)), own.signal,
              action.type === 'LadderConfirm' ? settlementTimeoutMs : stepTimeoutMs, 'step'); }
            catch (error) {
              loadedIdentity = null;
              unchanged();
              if (error?.code === 'AGENT_ACTION_REJECTED') {
                recordCandidate({ ...diagnostic, outcome: 'rejected', reason: String(error.message).slice(0,256) });
                return { kind: 'rejected', reason: String(error.message) };
              }
              recordCandidate({ ...diagnostic, outcome: 'step-error', error: Core.errorSummary(error) });
              throw error;
            }
            timing.stepMs += Date.now() - start;
            const view = clone(agent.observe()); unchanged();
            if (result.planning?.schemaVersion !== 1 || result.planning?.metric !== 'gross-health-decrease-v1' ||
                !Number.isFinite(result.planning.healthLoss) || result.planning.healthLoss < 0) throw new Error('Gross health-loss metric missing or invalid');
            const healthLoss = result.planning.healthLoss;
            if (result.info?.recorded !== true) {
              // No-op requests consume a diagnostic step but are not replayable
              // branches. A changed unrecorded action is unknown, NOT harmless.
              const physical = value => Core.canonical({ player: value.player, room: value.room, inventory: value.inventory, decision: value.decision });
              if (healthLoss !== 0 || physical(view) !== physical(current.view)) throw new Error('Unrecorded action changed game state');
              recordCandidate({ ...diagnostic, outcome: 'rejected', reason: 'unrecorded-no-op',
                to: summary(view).player, healthLoss, recorded: false, turnDelta: result.info?.turnDelta ?? null });
              loadedIdentity = null;
              return { kind: 'rejected', reason: 'unrecorded-no-op' };
            }
            start = Date.now();
            // Unsafe/dead branches cannot be expanded under this host's fixed
            // zero-loss policy. Do not require a save of an already dead player.
            const next = !result.terminated && healthLoss === 0 ? state(agent)
              : { view, snapshot: null, identity: Core.canonical(['discarded', view]) };
            loadedIdentity = !result.terminated && healthLoss === 0 ? next.identity : null;
            timing.captureMs += Date.now() - start; unchanged();
            if (firstEdges && current === root && !result.terminated && healthLoss === 0) {
              const key = Core.canonical(action);
              const proof = { action: clone(action), afterGuard: Core.canonical(agent.getPlanningGuard()),
                afterView: viewIdentity(view), healthLoss, turnDelta: result.info.turnDelta };
              const bytes = Core.canonical(proof).length * 2 + 128;
              if (evidenceBytes + bytes > evidenceBudget) {
                const error = new Error('First-edge evidence exceeds its reserved memory budget');
                error.code = 'HORIZON_EVIDENCE_BUDGET'; throw error;
              }
              firstEdges.set(key, proof); evidenceBytes += bytes;
            }
            recordCandidate({ ...diagnostic, outcome: result.terminated ? 'terminal' : healthLoss > 0 ? 'unsafe-health-loss' : 'safe-edge',
              to: summary(view).player, healthLoss, recorded: true, turnDelta: result.info.turnDelta,
              truncated: result.truncated === true });
            return { kind: 'ok', state: next, healthLoss, turnDelta: result.info.turnDelta,
              terminal: result.terminated === true, truncated: result.truncated === true,
              truncationReason: view.truncationReason ?? null };
          },
        };
        // The live viewer promises that simulator startup is outside the per-query
        // search cutoff.  Warm the execution worker before Core starts its wall
        // clock; restores and candidate steps remain charged to the search.
        if (forExecution) {
          const agent = await readyChild(); unchanged();
          const start = Date.now(); let restoredView = null;
          try {
            await bounded(() => agent.restorePlanningSnapshot(root.snapshot.serialized), own.signal, stepTimeoutMs, 'root-restore');
            restoredView = clone(agent.observe());
            assertViewIdentity(root.view, restoredView, 'root.restore');
            loadedIdentity = root.identity;
          } catch (error) {
            loadedIdentity = null;
            rememberRestoreFailure(root, goal, null, error, restoredView);
            throw error;
          }
          timing.restoreMs += Date.now() - start; unchanged();
        }
        const searchOptions = forExecution ? { ...options, maxBytes: requested.maxBytes - evidenceBudget } : options;
        const result = await Core.search({ root, adapter, goal, options: searchOptions, signal: own.signal });
        unchanged();
        const output = { ...result, assistance: 'privileged-oracle-advisory', goal, timing,
          candidateLedger: clone(candidateLedger), candidateLedgerTruncated: candidateLedger.length >= 128,
          origin: summary(liveBefore), context: clone(liveBefore.contract ?? null) };
        if (forExecution) {
          const sequence = result.status === 'GOAL_REACHED' ? result.plan : result.prefix;
          const first = sequence?.actions?.[0];
          const proof = first && firstEdges.get(Core.canonical(first));
          output.execution = proof ? { schemaVersion: 1, source: 'horizon-first-edge-v1',
            metric: 'gross-health-decrease-v1', rootGuard: guard, rootView: visible, ...proof } : null;
          output.executionAccounting = { evidenceBytes, evidenceBudget, totalMaxBytes: requested.maxBytes };
          if (first && !proof) throw Object.assign(new Error('No evaluated first-edge evidence for returned action'), { code: 'HORIZON_EVIDENCE_MISSING' });
        }
        return output;
      });
      simulator.pending = task;
      try { return await task; }
      catch (error) {
        simulator.dispose();
        return { ...failure(own.signal.aborted ? 'CANCELLED' : 'SIMULATION_UNSUPPORTED', String(error?.message || error)), error: Core.errorSummary(error) };
      } finally {
        if (simulator.pending === task) simulator.pending = null;
        if (controller === own) controller = null;
        signal?.removeEventListener('abort', abort);
      }
    }
    return Object.freeze({ plan: (goal, options, control) => runPlan(goal, options, control, false),
      planForExecution: (goal, options, control) => runPlan(goal, options, control, true),
      failureReproduction: () => lastFailureReproduction ? JSON.parse(lastFailureReproduction) : null,
      cancel: () => controller?.abort(),
      dispose: () => { controller?.abort(); simulator.dispose(); } });
  }
  return { create, validateGoal, viewIdentity, assertViewIdentity, goalReached, actionsFor };
});
