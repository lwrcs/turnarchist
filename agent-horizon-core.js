/* Deterministic, simulator-independent bounded search. No game or model calls. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentHorizonCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 'horizon-core-v1.1';
  const DEFAULTS = Object.freeze({
    maxDepth: 5, maxSimulations: 256, maxExpanded: 256, maxNodes: 1024,
    maxBytes: 32 * 1024 * 1024, maxCacheEntries: 128,
    maxCacheBytes: 8 * 1024 * 1024, maxMillis: 0, heuristic: 'zero',
  });
  function canonical(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    }
    throw new TypeError('Expected finite JSON data');
  }
  function errorSummary(error) {
    const result = { name: String(error?.name || 'Error'), message: String(error?.message || error).slice(0, 4096) };
    for (const key of ['code', 'path']) if (typeof error?.[key] === 'string') result[key] = error[key].slice(0, 2048);
    if (error?.details && typeof error.details === 'object') {
      result.details = {};
      for (const key of ['expected', 'actual', 'phase']) if (typeof error.details[key] === 'string') result.details[key] = error.details[key].slice(0, 2048);
    }
    return result;
  }
  const copy = value => JSON.parse(canonical(value));
  class Heap {
    constructor(compare) { this.items = []; this.compare = compare; }
    get size() { return this.items.length; }
    push(value) {
      const a = this.items; let i = a.length; a.push(value);
      while (i) { const p = (i - 1) >> 1; if (this.compare(a[p], value) <= 0) break; a[i] = a[p]; i = p; }
      a[i] = value;
    }
    pop() {
      const a = this.items, first = a[0], last = a.pop();
      if (a.length) {
        let i = 0;
        while (i * 2 + 1 < a.length) {
          let c = i * 2 + 1;
          if (c + 1 < a.length && this.compare(a[c + 1], a[c]) < 0) c++;
          if (this.compare(last, a[c]) <= 0) break;
          a[i] = a[c]; i = c;
        }
        a[i] = last;
      }
      return first;
    }
  }
  class BoundedCache {
    constructor(entries, bytes) { this.limit = entries; this.byteLimit = bytes; this.map = new Map(); this.bytes = 0; this.evictions = 0; }
    get(key) {
      const entry = this.map.get(key);
      if (!entry) return undefined;
      this.map.delete(key); this.map.set(key, entry); return entry.value;
    }
    trim(bytes = this.byteLimit) {
      while (this.map.size && (this.bytes > bytes || this.map.size > this.limit)) {
        const key = this.map.keys().next().value, entry = this.map.get(key);
        this.map.delete(key); this.bytes -= entry.bytes; this.evictions++;
      }
    }
    set(key, value, bytes, available = this.byteLimit) {
      const limit = Math.max(0, Math.min(available, this.byteLimit));
      if (!this.limit || bytes > limit) return;
      const previous = this.map.get(key);
      if (previous) { this.map.delete(key); this.bytes -= previous.bytes; }
      this.map.set(key, { value, bytes }); this.bytes += bytes; this.trim(limit);
    }
  }
  function optionsFor(input) {
    for (const key of Object.keys(input)) if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) throw new TypeError('Unknown option: ' + key);
    const result = { ...DEFAULTS, ...input };
    for (const key of Object.keys(DEFAULTS).filter(k => k !== 'heuristic')) {
      if (!Number.isSafeInteger(result[key]) || result[key] < 0) throw new TypeError(key + ' must be a nonnegative safe integer');
    }
    if (result.maxDepth > 64) throw new TypeError('maxDepth must be <= 64');
    if (!['zero', 'adapter'].includes(result.heuristic)) throw new TypeError('heuristic must be zero or adapter');
    return result;
  }
  const ZERO_HEALTH_LOSS = Object.freeze({
    id: 'zero-gross-health-loss-v1',
    accepts: edge => edge.healthLoss === 0,
  });
  class Stop extends Error { constructor(status, reason) { super(reason); this.status = status; this.reason = reason; } }
  /**
   * Adapter: namespace, key, actions, step, isGoal; optional heuristic,
   * rankFrontier, describe, estimateBytes, abort. State objects are immutable.
   * Edges: {kind:'ok', state, healthLoss, turnDelta, terminal, truncated,
   * truncationReason}; or {kind:'rejected'|'unsupported', reason}.
   * Unit cost = ONE DECISION, including zero-world-turn actions.
   */
  async function search({ root, adapter, goal, options = {}, policy = ZERO_HEALTH_LOSS, signal } = {}) {
    const config = optionsFor(options);
    if (!adapter || typeof adapter.namespace !== 'string' || !adapter.namespace) throw new TypeError('Adapter namespace required');
    for (const key of ['key', 'actions', 'step', 'isGoal']) if (typeof adapter[key] !== 'function') throw new TypeError('Missing adapter.' + key);
    if (!policy || typeof policy.id !== 'string' || typeof policy.accepts !== 'function') throw new TypeError('Named safety policy required');
    if (config.heuristic === 'adapter' && typeof adapter.heuristic !== 'function') throw new TypeError('Missing adapter heuristic');
    const started = Date.now(), deadline = config.maxMillis ? started + config.maxMillis : Infinity;
    const stats = { expanded: 0, simulations: 0, generated: 0, merged: 0, rejected: 0,
      unsafe: 0, terminal: 0, truncated: 0, cacheHits: 0, cacheEvictions: 0,
      retainedNodes: 0, retainedBytes: 0, peakAccountedBytes: 0, maxDepthSeen: 0, elapsedMs: 0 };
    const cache = new BoundedCache(config.maxCacheEntries, config.maxCacheBytes);
    const open = new Heap((a, b) => a.f - b.f || a.depth - b.depth || a.order - b.order);
    const best = new Map();
    let sequence = 0, bestPrefix = null, incumbent = null, hitHorizon = false, hitEnvironmentBudget = false;
    const certified = config.heuristic === 'zero' || adapter.heuristicAdmissible === true;
    const check = () => {
      if (signal?.aborted) throw new Stop('CANCELLED', 'abort-signal');
      if (Date.now() >= deadline) throw new Stop('SEARCH_BUDGET_EXHAUSTED', 'wall-clock');
    };
    async function call(fn, allowSettlementPastDeadline = false) {
      if (allowSettlementPastDeadline) {
        if (signal?.aborted) throw new Stop('CANCELLED', 'abort-signal');
      } else check();
      let timer = null, abortListener = null;
      const stopped = new Promise((_, reject) => {
        if (!allowSettlementPastDeadline && Number.isFinite(deadline)) timer = setTimeout(() => reject(new Stop('SEARCH_BUDGET_EXHAUSTED', 'wall-clock')), Math.max(0, deadline - Date.now()));
        if (signal) { abortListener = () => reject(new Stop('CANCELLED', 'abort-signal')); signal.addEventListener('abort', abortListener, { once: true }); }
      });
      try {
        const result = await Promise.race([Promise.resolve().then(fn), stopped]);
        if (!allowSettlementPastDeadline) check();
        return result;
      }
      finally { if (timer !== null) clearTimeout(timer); if (abortListener) signal.removeEventListener('abort', abortListener); }
    }
    function makePlan(node) {
      if (!node) return null;
      const steps = []; let cursor = node, loss = 0, turns = 0;
      while (cursor.parent) {
        const edge = cursor.edge; loss += edge.healthLoss; turns += edge.turnDelta;
        steps.push({ action: copy(cursor.action), healthLoss: edge.healthLoss, turnDelta: edge.turnDelta }); cursor = cursor.parent;
      }
      steps.reverse();
      return { actions: steps.map(s => s.action), steps, decisions: node.depth,
        worldTurns: turns, healthLoss: loss, reachedGoal: node.goal,
        terminal: adapter.describe ? copy(adapter.describe(node.state)) : null };
    }
    function finish(status, reason, node = null, optimal = false) {
      // A found goal is still a valid plan at a compute cutoff, but not a proven optimum.
      if (!node && incumbent && status === 'SEARCH_BUDGET_EXHAUSTED') { status = 'GOAL_REACHED'; node = incumbent; optimal = false; }
      stats.cacheEvictions = cache.evictions; stats.elapsedMs = Date.now() - started;
      return { schemaVersion: 1, plannerVersion: VERSION, namespace: adapter.namespace,
        status, stopReason: reason, policy: policy.id, options: config,
        solutionOptimal: status === 'GOAL_REACHED' && optimal,
        plan: status === 'GOAL_REACHED' ? makePlan(node) : null,
        prefix: status !== 'GOAL_REACHED' && !['SIMULATION_UNSUPPORTED', 'CANCELLED'].includes(status) ? makePlan(bestPrefix) : null,
        guarantee: 'Evaluated prefix only; no safety claim after its last action.', stats: { ...stats } };
    }
    const estimate = state => {
      const n = adapter.estimateBytes ? adapter.estimateBytes(state) : canonical(state).length * 2;
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Invalid adapter byte estimate'); return n;
    };
    function add(state, parent, action, edge, goalReached) {
      const depth = parent ? parent.depth + 1 : 0;
      const identity = adapter.key(state);
      if (typeof identity !== 'string' || !identity) throw new Error('Empty/non-string state key');
      const key = canonical([identity, goalReached]);
      if ((best.get(key) ?? Infinity) <= depth) { stats.merged++; return null; }
      const bytes = estimate(state) + key.length * 2 + 256;
      if (stats.retainedNodes >= config.maxNodes) throw new Stop('SEARCH_BUDGET_EXHAUSTED', 'nodes');
      if (stats.retainedBytes + bytes > config.maxBytes) throw new Stop('SEARCH_BUDGET_EXHAUSTED', 'accounted-bytes');
      const h = goalReached || config.heuristic === 'zero' ? 0 : adapter.heuristic(state, goal);
      if (!Number.isFinite(h) || h < 0) throw new Error('Heuristic must be finite and nonnegative');
      const node = { state, identity, key, parent, action, edge, depth, goal: goalReached, f: depth + h, order: sequence++ };
      stats.retainedBytes += bytes; stats.retainedNodes++; stats.maxDepthSeen = Math.max(stats.maxDepthSeen, depth);
      cache.trim(Math.max(0, config.maxBytes - stats.retainedBytes));
      stats.peakAccountedBytes = Math.max(stats.peakAccountedBytes, stats.retainedBytes + cache.bytes);
      best.set(key, depth); open.push(node);
      if (depth && !goalReached) {
        node.rank = adapter.rankFrontier ? adapter.rankFrontier(state, goal) : 0;
        if (!Number.isFinite(node.rank)) throw new Error('Frontier rank must be finite');
        if (!bestPrefix || node.rank < bestPrefix.rank || (node.rank === bestPrefix.rank && node.depth < bestPrefix.depth)) bestPrefix = node;
      }
      if (goalReached && (!incumbent || node.depth < incumbent.depth)) incumbent = node;
      return node;
    }
    try {
      check();
      const rootGoal = await call(() => adapter.isGoal(root, goal, null));
      if (typeof rootGoal !== 'boolean') throw new Error('isGoal must return boolean');
      add(root, null, null, null, rootGoal);
      while (open.size) {
        check(); const node = open.pop();
        if (best.get(node.key) !== node.depth) continue;
        if (node.goal) return finish('GOAL_REACHED', 'goal-popped', node, certified);
        if (node.edge?.truncated) { hitEnvironmentBudget = true; continue; }
        if (node.depth >= config.maxDepth) { hitHorizon = true; continue; }
        if (stats.expanded >= config.maxExpanded) throw new Stop('SEARCH_BUDGET_EXHAUSTED', 'expansions');
        stats.expanded++;
        const actions = await call(() => adapter.actions(node.state, goal));
        if (!Array.isArray(actions)) throw new Error('actions must return an array');
        const actionKeys = new Set();
        for (const action of actions) {
          check(); const actionKey = canonical(action);
          if (actionKeys.has(actionKey)) throw new Error('Duplicate action from adapter');
          actionKeys.add(actionKey);
          const cacheKey = canonical([adapter.namespace, node.identity, actionKey]);
          let edge = cache.get(cacheKey);
          if (edge !== undefined) stats.cacheHits++;
          else {
            if (stats.simulations >= config.maxSimulations) throw new Stop('SEARCH_BUDGET_EXHAUSTED', 'simulations');
            stats.simulations++;
            edge = await call(() => adapter.step(node.state, copy(action), { signal, deadline }), adapter.settlePastDeadline === true);
            if (!edge || !['ok', 'rejected', 'unsupported'].includes(edge.kind)) throw new Error('Malformed transition');
            if (edge.kind === 'unsupported') throw new Stop('SIMULATION_UNSUPPORTED', String(edge.reason || 'unsupported-transition'));
            const cacheBytes = cacheKey.length * 2 + (edge.kind === 'ok' ? estimate(edge.state) : 256);
            cache.set(cacheKey, edge, cacheBytes, Math.max(0, config.maxBytes - stats.retainedBytes));
            stats.peakAccountedBytes = Math.max(stats.peakAccountedBytes, stats.retainedBytes + cache.bytes);
          }
          if (edge.kind === 'rejected') { stats.rejected++; continue; }
          if (!Number.isFinite(edge.healthLoss) || edge.healthLoss < 0 || !Number.isSafeInteger(edge.turnDelta) || edge.turnDelta < 0 ||
              typeof edge.terminal !== 'boolean' || typeof edge.truncated !== 'boolean') throw new Error('Incomplete transition safety metrics');
          stats.generated++;
          if (edge.terminal) { stats.terminal++; continue; }
          if (edge.truncated && edge.truncationReason !== 'action-budget') throw new Stop('SIMULATION_UNSUPPORTED', 'non-budget-truncation');
          const accepted = policy.accepts(edge, node.state, action);
          if (typeof accepted !== 'boolean') throw new Error('Safety policy must return a boolean synchronously');
          if (!accepted) { stats.unsafe++; continue; }
          const reached = await call(() => adapter.isGoal(edge.state, goal, { from: node.state, action, edge }), adapter.settlePastDeadline === true);
          if (typeof reached !== 'boolean') throw new Error('isGoal must return boolean');
          if (edge.truncated) stats.truncated++;
          add(edge.state, node, action, edge, reached);
        }
      }
      if (hitEnvironmentBudget) return finish('SEARCH_BUDGET_EXHAUSTED', 'environment-action-budget');
      if (hitHorizon && bestPrefix) return finish('SAFE_PREFIX_FOUND', 'action-horizon');
      return finish('NO_SOLUTION_WITHIN_HORIZON', hitHorizon ? 'action-horizon' : 'reachable-graph-exhausted');
    } catch (error) {
      try { adapter.abort?.(); } catch { /* Retiring an isolated worker is best-effort. */ }
      if (error instanceof Stop) return finish(error.status, error.reason);
      return { ...finish('SIMULATION_UNSUPPORTED', String(error?.message || error)), error: errorSummary(error) };
    }
  }
  return { VERSION, DEFAULTS, ZERO_HEALTH_LOSS, canonical, errorSummary, optionsFor, search, BoundedCache };
});
