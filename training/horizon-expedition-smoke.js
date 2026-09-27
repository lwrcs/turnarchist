/* Dedicated validation page only. The existing independent browser supervisor owns the deadline. */
(function (root) {
    'use strict';
    async function run(live, { seed = 1, scenario = 'standard', onProgress = () => {
    } } = {}) {
        const Core = root.AgentHorizonCore, Host = root.AgentHorizonHost;
        const report = {
            schemaVersion: 1, suite: 'horizon-expedition-browser-v1', seed, scenario,
            actualGame: true, pass: false, status: 'RUNNING', phase: 'reset', results: [], modes: []
        };
        let expedition = null, benchmarkHost = null;
        const progress = () => onProgress(JSON.parse(JSON.stringify(report)));
        const checked = (name, condition) => {
            report.results.push({ name, pass: condition === true });
            progress();
            if (condition !== true)
                throw new Error('EXPEDITION_SMOKE_ASSERTION: ' + name);
        };
        try {
            progress();
            for (const method of ['inspectHorizonIntent', 'stepForHorizon', 'getHorizonGhostView', 'setHorizonGhostView']) {
                if (typeof live[method] !== 'function')
                    throw new Error('Rebuild both realms: missing ' + method);
            }
            await live.reset(seed, { scenario, maxSteps: 1000 });
            const initial = live.observe(), before = Core.canonical(live.getPlanningGuard());
            const ledger = root.AgentHorizonWorld.createLedger({ episodeId: 'smoke-' + scenario + '-' + seed });
            const director = root.AgentHorizonWorld.createDirector({ ledger });
            const input = { view: initial, geometry: live.inspectHorizonIntent(), provenance: 'live' };
            director.observe(input);
            const proposal = director.select(input);
            checked('a code-generated explicit local objective exists', !!proposal?.goal);
            // Compare the two strategies on the SAME untouched live root and matching budgets.
            for (const mode of ['reference', 'route-first']) {
                report.phase = 'paired-query-' + mode;
                progress();
                const profiler = root.AgentHorizonDriver.createProfiler();
                const searchDriver = root.AgentHorizonDriver.create({ mode, geometry: () => live.inspectHorizonIntent(), profiler });
                benchmarkHost = Host.create({ source: () => live, searchDriver, onOperation: profiler.operation });
                const result = await benchmarkHost.planForExecution(proposal.goal, {
                    maxDepth: 5, maxSimulations: 128, maxExpanded: 128, maxNodes: 512, maxMillis: 2000, heuristic: 'adapter'
                });
                report.modes.push({
                    mode, goal: proposal.goal, status: result.status, stats: result.stats, timing: result.timing,
                    driver: result.driver || null, profile: profiler.snapshot()
                });
                checked(mode + ' query leaves the live guard unchanged', Core.canonical(live.getPlanningGuard()) === before);
                checked(mode + ' result is not a restoration or contract failure', !['SIMULATION_UNSUPPORTED', 'INVALID_REQUEST', 'BUSY', 'CANCELLED'].includes(result.status));
                if (result.execution)
                    checked(mode + ' first-edge evidence measures zero gross loss', result.execution.healthLoss === 0);
                benchmarkHost.dispose();
                benchmarkHost = null;
            }
            report.phase = 'ghost-presentation';
            progress();
            live.setHorizonGhostView(true);
            await new Promise(resolve => setTimeout(resolve, 100));
            const projection = live.getHorizonGhostView();
            checked('visible renderer exposes an actual camera projection', !!projection && projection.matrix.length === 6 &&
                projection.matrix.every(Number.isFinite) && !!projection.canvas && projection.roomId === initial.room.id);
            live.setHorizonGhostView(false);
            checked('presentation opt-in does not alter the live guard', Core.canonical(live.getPlanningGuard()) === before);
            const mode = new URLSearchParams(root.location.search).get('driver') || 'reference';
            checked('explicit supported execution driver', ['reference', 'route-first'].includes(mode));
            report.executionMode = mode;
            let startRoom = initial.room.id, enteredSecond = false, actedInSecond = false, liveActions = 0;
            expedition = root.AgentHorizonExpedition.create({
                source: () => live,
                episodeId: 'live-smoke-' + scenario + '-' + seed, mode, onEvent(snapshot, event, extra) {
                    if (event.type === 'executed') {
                        liveActions++;
                        if (event.from.roomId !== startRoom && event.to.roomId === event.from.roomId && event.parity === true)
                            actedInSecond = true;
                        if (event.to.roomId !== startRoom)
                            enteredSecond = true;
                        if (enteredSecond && actedInSecond)
                            expedition.stop('acceptance-milestone');
                    }
                    report.phase = 'live-' + event.type;
                    report.live = {
                        state: snapshot.state, reason: snapshot.reason, counters: snapshot.counters,
                        error: snapshot.error, lastTransition: snapshot.lastTransition, intent: extra.intent,
                        lastPlan: snapshot.lastPlan ? { status: snapshot.lastPlan.status, stopReason: snapshot.lastPlan.stopReason } : null
                    };
                    progress();
                }
            });
            for (let session = 0; session < 4 && !actedInSecond; session++) {
                report.session = session + 1;
                const result = await expedition.start();
                if (result.intentError)
                    throw new Error('Intent ledger failed: ' + JSON.stringify(result.intentError));
                if (result.state === 'BLOCKED' || result.quarantined)
                    throw Object.assign(new Error(result.reason), result.error || {});
                if (!actedInSecond && result.counters.verifiedActions === 0)
                    break;
            }
            checked('ordinary verified actions entered another room', enteredSecond);
            checked('a verified zero-loss action executed INSIDE the second room', actedInSecond);
            checked('world ledger includes at least two actually observed rooms', expedition.ledger.summary().roomCount >= 2);
            checked('world action count equals actual verified commits, not simulation count', expedition.ledger.summary().actions === liveActions);
            const exports = expedition.exportData();
            report.profile = exports.profile;
            report.world = expedition.ledger.summary();
            report.trace = expedition.trace.summary();
            checked('trace has bounded real simulation edge data', report.trace.count > 0 && report.trace.accountedBytes <= 2 * 1024 * 1024);
            const finalGuard = Core.canonical(live.getPlanningGuard());
            expedition.stop('post-validation-stop');
            await new Promise(resolve => setTimeout(resolve, 50));
            checked('stopping starts no further live action', Core.canonical(live.getPlanningGuard()) === finalGuard);
            report.pass = true;
            report.status = 'PASS';
            report.phase = 'complete';
            progress();
        }
        catch (error) {
            report.error = Core.errorSummary(error);
            report.status = 'FAIL';
            progress();
        }
        finally {
            benchmarkHost?.dispose();
            expedition?.dispose();
        }
        return report;
    }
    root.AgentHorizonSmoke = { run };
})(globalThis);
