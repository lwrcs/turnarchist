/* Optional route-first driver. Proposals are cheap; EVERY admitted edge still uses the real adapter. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports)
        module.exports = factory(require('./agent-horizon-core.js'), require('./agent-horizon-world.js'));
    else
        root.AgentHorizonDriver = factory(root.AgentHorizonCore, root.AgentHorizonWorld);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core, World) {
    'use strict';
    const clone = v => JSON.parse(JSON.stringify(v)), clock = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
    const point = s => ({
        roomId: s.view.room.id, depth: s.view.room.depth, x: s.view.player.x, y: s.view.player.y, z: s.view.player.z, health: s.view.player.health
    });
    function buildRoute(root, goal, geometry, maxDepth) {
        if (!geometry || geometry.roomId !== root.view.room.id || maxDepth < 1)
            return null;
        if (root.view.decision === 'ladder' && goal.kind === 'exit' && root.view.player.x === goal.x && root.view.player.y === goal.y)
            return [{ action: { type: 'LadderConfirm' }, expected: null }];
        if (root.view.decision !== 'world')
            return null;
        const grid = World.spatial(root.view, geometry, { maxExpanded: 8192 }), path = grid.pathTo(goal.x, goal.y);
        if (!path || !path.length)
            return null;
        return path.slice(0, maxDepth).map(n => ({ action: { type: 'Move', direction: n.direction }, expected: { x: n.x, y: n.y, z: n.z } }));
    }
    function createProfiler({ capacity = 64 } = {}) {
        if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1024)
            throw new TypeError('Invalid profile capacity');
        let queries = [], operations = [], droppedOperations = 0;
        function operation(e) {
            if (e.status !== 'complete' && e.status !== 'failed')
                return;
            operations.push({ phase: String(e.phase).slice(0, 80), status: e.status, elapsedMs: Number.isFinite(e.elapsedMs) ? e.elapsedMs : 0 });
            if (operations.length > 1024) {
                operations.shift();
                droppedOperations++;
            }
        }
        function record(result) {
            queries.push(clone(result));
            if (queries.length > capacity)
                queries.shift();
        }
        function snapshot() {
            const values = queries.map(q => q.elapsedMs).sort((a, b) => a - b), stages = {};
            for (const e of operations) {
                const s = stages[e.phase] || (stages[e.phase] = { count: 0, milliseconds: 0, failed: 0 });
                s.count++;
                s.milliseconds += e.elapsedMs;
                if (e.status === 'failed')
                    s.failed++;
            }
            return {
                format: 'horizon-profile-v1', queries: clone(queries), stages, percentilesMs: { p50: values.length ? values[Math.ceil(values.length * .5) - 1] : null, p95: values.length ? values[Math.ceil(values.length * .95) - 1] : null }, droppedOperations
            };
        }
        return Object.freeze({ operation, record, snapshot });
    }
    function createTrace({ maxEvents = 4096, maxBytes = 2 * 1024 * 1024 } = {}) {
        if (!Number.isSafeInteger(maxEvents) || maxEvents < 1 || maxEvents > 50000 || !Number.isSafeInteger(maxBytes) || maxBytes < 256 || maxBytes > 16000000)
            throw new TypeError('Invalid trace limits');
        let query = 0, sequence = 0, events = [], bytes = 0, dropped = 0, status = 'IDLE', started = 0;
        function emit(e) {
            const event = {
                query, sequence: ++sequence, atMs: Math.round((clock() - started) * 1000) / 1000, ...clone(e)
            }, n = JSON.stringify(event).length * 2;
            if (events.length >= maxEvents || bytes + n > maxBytes) {
                dropped++;
                return;
            }
            Object.freeze(event);
            events.push(event);
            bytes += n;
        }
        function begin(origin, goal) {
            query++;
            sequence = 0;
            events = [];
            bytes = 0;
            dropped = 0;
            status = 'SEARCHING';
            started = clock();
            emit({
                type: 'root', nodeId: 0, parentId: null, point: origin, goal
            });
            return query;
        }
        function finish(result) {
            status = result.status;
            emit({ type: 'finished', status: result.status, reason: result.stopReason });
        }
        return Object.freeze({
            begin, emit, finish, summary: () => ({
                format: 'horizon-branch-trace-v1', query, status, count: events.length, dropped, accountedBytes: bytes, complete: dropped === 0
            }), snapshot: () => ({
                format: 'horizon-branch-trace-v1', query, status, elapsedMs: clock() - started, events: events.map(clone), dropped, accountedBytes: bytes, complete: dropped === 0
            }), readSince: (q, seq) => ({
                query, reset: q !== query, status, dropped, events: events.filter(e => q !== query || e.sequence > seq).map(clone)
            })
        });
    }
    function create({ geometry, mode = 'reference', trace = null, profiler = null } = {}) {
        if (!['reference', 'route-first'].includes(mode) || typeof geometry !== 'function')
            throw new TypeError('Driver needs a geometry provider and an explicit mode');
        return async function search(request) {
            const { root, goal, signal } = request, config = Core.optionsFor(request.options || {}), started = clock();
            let nextId = 1;
            const nodes = new WeakMap([[root, { id: 0, depth: 0 }]]), original = request.adapter;
            if (trace)
                trace.begin(point(root), clone(goal));
            const wrapped = { ...original, async step(state, action, control) {
                    const parent = nodes.get(state) || { id: nextId++, depth: 0 }, start = clock();
                    if (!nodes.has(state))
                        nodes.set(state, parent);
                    let edge;
                    try {
                        edge = await original.step(state, action, control);
                    }
                    catch (error) {
                        trace?.emit({
                            type: 'edge', nodeId: nextId++, parentId: parent.id, depth: parent.depth + 1, from: point(state), to: null, action, outcome: 'error', code: String(error.code || 'SIMULATOR_ERROR'), elapsedMs: clock() - start
                        });
                        throw error;
                    }
                    const id = nextId++;
                    if (edge?.state && typeof edge.state === 'object')
                        nodes.set(edge.state, { id, depth: parent.depth + 1 });
                    trace?.emit({
                        type: 'edge', nodeId: id, parentId: parent.id, depth: parent.depth + 1, from: point(state), to: edge?.state?.view ? point(edge.state) : null, action,
                        outcome: edge?.kind !== 'ok' ? edge?.kind || 'malformed' : edge.healthLoss > 0 ? 'damage-pruned' : edge.terminal ? 'terminal' : 'safe', healthLoss: edge?.healthLoss ?? null, turnDelta: edge?.turnDelta ?? null, truncated: edge?.truncated === true, elapsedMs: clock() - start
                    });
                    return edge;
                } };
            let result;
            try {
                result = mode === 'route-first' ? await routeFirst({ ...request, adapter: wrapped, options: config }, geometry) : await Core.search({ ...request, adapter: wrapped });
            }
            catch (error) {
                original.abort?.();
                result = {
                    schemaVersion: 1, plannerVersion: Core.VERSION, status: signal?.aborted ? 'CANCELLED' : 'SIMULATION_UNSUPPORTED', stopReason: String(error.message || error), error: Core.errorSummary(error), policy: 'zero-gross-health-loss-v1', plan: null, prefix: null, stats: null
                };
            }
            trace?.finish(result);
            profiler?.record({
                mode, status: result.status, elapsedMs: clock() - started, simulations: result.stats?.simulations ?? null, routeSimulations: result.driver?.routeSimulations ?? 0, fallback: result.driver?.fallback ?? false
            });
            return result;
        };
    }
    async function routeFirst(request, getGeometry) {
        const { root, adapter, goal, signal, options: config } = request, start = clock(), deadline = config.maxMillis ? Date.now() + config.maxMillis : Infinity;
        // No alternate policy can silently pass through this zero-loss-only shortcut.
        if (request.policy && request.policy !== Core.ZERO_HEALTH_LOSS)
            return Core.search(request);
        let route = buildRoute(root, goal, getGeometry(), config.maxDepth);
        if (!route || !config.maxSimulations || !config.maxExpanded || !config.maxNodes || !config.maxBytes)
            return Core.search(request);
        const stats = {
            expanded: 0, simulations: 0, generated: 0, merged: 0, rejected: 0, unsafe: 0, terminal: 0, truncated: 0, cacheHits: 0, cacheEvictions: 0, retainedNodes: 1, retainedBytes: 0, peakAccountedBytes: 0, maxDepthSeen: 0, elapsedMs: 0
        };
        const estimate = s => {
            const n = adapter.estimateBytes ? adapter.estimateBytes(s) : Core.canonical(s).length * 2;
            if (!Number.isSafeInteger(n) || n < 0)
                throw new Error('Invalid adapter byte estimate');
            return n + 256;
        };
        const rootBytes = estimate(root);
        stats.retainedBytes = rootBytes;
        stats.peakAccountedBytes = rootBytes;
        if (rootBytes > config.maxBytes)
            return Core.search(request);
        let current = root, steps = [], lastTransition = null, fallbackReason = null;
        const aborted = () => signal?.aborted === true;
        const cutoff = () => Date.now() >= deadline || stats.simulations >= config.maxSimulations || stats.expanded >= config.maxExpanded || stats.retainedNodes >= config.maxNodes;
        async function call(fn, allowSettlement = false) {
            if (aborted())
                throw Object.assign(new Error('abort-signal'), { code: 'HORIZON_DRIVER_ABORT' });
            let listener, timer;
            const expire = () => Object.assign(new Error('route-wall-clock'), { code: 'HORIZON_DRIVER_CUTOFF' });
            if (!allowSettlement && Date.now() >= deadline)
                throw expire();
            try {
                const value = await Promise.race([Promise.resolve().then(() => {
                        if (aborted())
                            throw new Error('abort-signal');
                        return fn();
                    }), new Promise((_, reject) => {
                        if (!allowSettlement && Number.isFinite(deadline))
                            timer = setTimeout(() => reject(expire()), Math.max(0, deadline - Date.now()));
                        if (signal) {
                            listener = () => reject(Object.assign(new Error('abort-signal'), { code: 'HORIZON_DRIVER_ABORT' }));
                            signal.addEventListener('abort', listener, { once: true });
                        }
                    })]);
                if (aborted())
                    throw Object.assign(new Error('abort-signal'), { code: 'HORIZON_DRIVER_ABORT' });
                if (!allowSettlement && Date.now() >= deadline)
                    throw expire();
                return value;
            }
            finally {
                clearTimeout(timer);
                if (listener)
                    signal.removeEventListener('abort', listener);
            }
        }
        function plan(reached) {
            return steps.length ? {
                actions: steps.map(s => clone(s.action)), steps: clone(steps), decisions: steps.length, worldTurns: steps.reduce((n, s) => n + s.turnDelta, 0), healthLoss: 0, reachedGoal: reached, terminal: adapter.describe ? clone(adapter.describe(current)) : null
            } : null;
        }
        function finish(status, reason, reached = false) {
            stats.elapsedMs = clock() - start;
            return {
                schemaVersion: 1, plannerVersion: Core.VERSION, namespace: adapter.namespace, status, stopReason: reason, policy: 'zero-gross-health-loss-v1', options: config, solutionOptimal: false, plan: reached ? plan(true) : null, prefix: !reached && !['CANCELLED', 'SIMULATION_UNSUPPORTED'].includes(status) ? plan(false) : null, stats: { ...stats }, driver: { mode: 'route-first', routeSimulations: stats.simulations, fallback: false }, guarantee: 'Every returned edge was evaluated. No safety claim beyond the returned prefix.'
            };
        }
        try {
            for (let i = 0; i < route.length; i++) {
                if (aborted()) {
                    adapter.abort?.();
                    return finish('CANCELLED', 'abort-signal');
                }
                if (cutoff())
                    return finish('SEARCH_BUDGET_EXHAUSTED', 'route-budget');
                const proposal = route[i], actions = await call(() => adapter.actions(current, goal));
                if (!Array.isArray(actions))
                    throw new Error('actions must return an array');
                if (!actions.some(a => Core.canonical(a) === Core.canonical(proposal.action))) {
                    fallbackReason = 'proposal-not-legal';
                    break;
                }
                stats.expanded++;
                stats.simulations++;
                const edge = await call(() => adapter.step(current, clone(proposal.action), { signal, deadline }), adapter.settlePastDeadline === true);
                if (!edge || !['ok', 'rejected', 'unsupported'].includes(edge.kind))
                    throw new Error('Malformed transition');
                if (edge.kind === 'unsupported')
                    throw new Error(String(edge.reason || 'Unsupported transition'));
                if (edge.kind === 'rejected') {
                    stats.rejected++;
                    fallbackReason = 'proposal-rejected';
                    break;
                }
                if (!Number.isFinite(edge.healthLoss) || edge.healthLoss < 0 || !Number.isSafeInteger(edge.turnDelta) || edge.turnDelta < 0 || typeof edge.terminal !== 'boolean' || typeof edge.truncated !== 'boolean')
                    throw new Error('Incomplete transition safety metrics');
                stats.generated++;
                if (edge.terminal) {
                    stats.terminal++;
                    fallbackReason = 'proposal-terminal';
                    break;
                }
                if (edge.truncated && edge.truncationReason !== 'action-budget')
                    throw new Error('Non-budget truncation');
                if (edge.healthLoss !== 0) {
                    stats.unsafe++;
                    fallbackReason = 'proposal-unsafe';
                    break;
                }
                const bytes = rootBytes + estimate(current) + estimate(edge.state) + steps.length * 256;
                if (bytes > config.maxBytes)
                    return finish('SEARCH_BUDGET_EXHAUSTED', 'route-accounted-bytes');
                stats.peakAccountedBytes = Math.max(stats.peakAccountedBytes, bytes);
                stats.retainedBytes = rootBytes + estimate(edge.state) + steps.length * 256;
                lastTransition = { from: current, action: proposal.action, edge };
                current = edge.state;
                steps.push({ action: clone(proposal.action), healthLoss: 0, turnDelta: edge.turnDelta });
                stats.retainedNodes++;
                stats.maxDepthSeen = steps.length;
                const reached = await call(() => adapter.isGoal(current, goal, lastTransition), adapter.settlePastDeadline === true);
                if (typeof reached !== 'boolean')
                    throw new Error('isGoal must return boolean');
                if (reached)
                    return finish('GOAL_REACHED', 'verified-spatial-route', true);
                if (edge.truncated) {
                    stats.truncated++;
                    return finish('SEARCH_BUDGET_EXHAUSTED', 'environment-action-budget');
                }
                if (proposal.expected && (current.view.player.x !== proposal.expected.x || current.view.player.y !== proposal.expected.y || current.view.player.z !== proposal.expected.z || current.view.room.id !== goal.roomId)) {
                    fallbackReason = 'proposal-resolved-differently';
                    break;
                }
                // A real ladder confirmation is an extra decision, not a geometric/free action.
                if (i === route.length - 1 && current.view.decision === 'ladder' && goal.kind === 'exit' && current.view.player.x === goal.x && current.view.player.y === goal.y && steps.length < config.maxDepth)
                    route.push({ action: { type: 'LadderConfirm' }, expected: null });
            }
            if (!fallbackReason)
                return finish(cutoff() ? 'SEARCH_BUDGET_EXHAUSTED' : 'SAFE_PREFIX_FOUND', cutoff() ? 'route-budget' : 'verified-route-horizon');
            if (aborted()) {
                adapter.abort?.();
                return finish('CANCELLED', 'abort-signal');
            }
            if (cutoff())
                return finish('SEARCH_BUDGET_EXHAUSTED', 'route-budget');
            const retainedPrefix = plan(false);
            const spent = { ...stats }, elapsed = Date.now() - (deadline === Infinity ? Date.now() : deadline - config.maxMillis);
            // Drop route-only state references before the independent root search. Accounting remains cumulative.
            current = root;
            lastTransition = null;
            const remaining = {
                ...config, maxSimulations: config.maxSimulations - spent.simulations, maxExpanded: config.maxExpanded - spent.expanded, maxNodes: config.maxNodes - spent.retainedNodes,
                maxMillis: config.maxMillis ? Math.max(1, config.maxMillis - Math.max(0, elapsed)) : 0
            };
            const result = await Core.search({ ...request, options: remaining });
            if (result.stats) {
                for (const k of ['expanded', 'simulations', 'generated', 'merged', 'rejected', 'unsafe', 'terminal', 'truncated', 'cacheHits', 'cacheEvictions', 'retainedNodes'])
                    result.stats[k] += spent[k];
                result.stats.peakAccountedBytes = Math.max(result.stats.peakAccountedBytes, spent.peakAccountedBytes);
                result.stats.maxDepthSeen = Math.max(result.stats.maxDepthSeen, spent.maxDepthSeen);
                result.stats.elapsedMs = clock() - start;
            }
            if (!result.plan && !result.prefix && retainedPrefix && !['CANCELLED', 'SIMULATION_UNSUPPORTED'].includes(result.status))
                result.prefix = retainedPrefix;
            return {
                ...result, options: config, solutionOptimal: false, driver: {
                    mode: 'route-first', routeSimulations: spent.simulations, fallback: true, fallbackReason
                }
            };
        }
        catch (error) {
            adapter.abort?.();
            return { ...finish(aborted() ? 'CANCELLED' : error.code === 'HORIZON_DRIVER_CUTOFF' ? 'SEARCH_BUDGET_EXHAUSTED' : 'SIMULATION_UNSUPPORTED', String(error.message || error)), error: Core.errorSummary(error) };
        }
    }
    return {
        buildRoute, createProfiler, createTrace, create, routeFirst
    };
});
