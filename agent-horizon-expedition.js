/* Opt-in composition; the existing verified controller remains the only live dispatcher. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports)
        module.exports = factory(require('./agent-horizon-world.js'), require('./agent-horizon-driver.js'), require('./agent-horizon-host.js'), require('./agent-horizon-controller.js'));
    else
        root.AgentHorizonExpedition = factory(root.AgentHorizonWorld, root.AgentHorizonDriver, root.AgentHorizonHost, root.AgentHorizonController);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (World, Driver, Host, Controller) {
    'use strict';
    function create({ source, episodeId, mode = 'reference', directorOptions = {}, options = {}, planOptions = {}, onEvent = () => {
    }, simulator } = {}) {
        if (typeof source !== 'function')
            throw new TypeError('source must be a function');
        if (Host.searchDriverVersion !== 1 || Controller.intentPreemptionVersion !== 1)
            throw new Error('HORIZON_EXPEDITION_SCRIPT_MISMATCH: reload patched host/controller scripts');
        const live = source();
        if (typeof live?.inspectHorizonIntent !== 'function')
            throw new Error('HORIZON_INTENT_BUILD_MISMATCH: rebuild the new read-only intent API');
        const ledger = World.createLedger({ episodeId }), director = World.createDirector({ ledger, ...directorOptions }), trace = Driver.createTrace(), profiler = Driver.createProfiler();
        let controller, closed = false, fatal = null;
        function observe(transition = null) {
            if (source() !== live)
                throw new Error('Episode source changed; create a fresh expedition');
            director.observe({
                view: live.observe(), geometry: live.inspectHorizonIntent(), transition, provenance: 'live'
            });
        }
        observe();
        const driver = Driver.create({
            mode, geometry: () => live.inspectHorizonIntent(), trace, profiler
        });
        const planner = Host.create({
            source, simulator, searchDriver: driver, onOperation: profiler.operation
        });
        const selector = input => director.select({ ...input, geometry: live.inspectHorizonIntent() });
        selector.shouldReselect = director.select.shouldReselect;
        controller = Controller.create({
            source, planner, selector, options, planOptions, onEvent(report, event) {
                try {
                    if (event.type === 'started')
                        observe();
                    if (event.type === 'executed')
                        observe(event);
                    director.feedback(event);
                }
                catch (error) {
                    fatal = { code: error.code || 'HORIZON_INTENT_ERROR', message: String(error.message || error) };
                    controller.stop('intent-ledger-failed');
                }
                try {
                    onEvent(report, event, { intent: director.snapshot(), profile: profiler.snapshot(), trace: trace.summary() });
                }
                catch (_) {
                }
            }
        });
        return Object.freeze({
            ledger, director, trace, profiler, start: async (request) => {
                if (closed || fatal)
                    throw new Error(fatal?.message || 'Expedition closed');
                const r = await controller.start(request);
                return { ...r, intent: director.snapshot(), intentError: fatal };
            }, stop: r => controller.stop(r), get running() {
                return controller.running;
            }, snapshot: () => ({ ...controller.snapshot(), intent: director.snapshot(), intentError: fatal }),
            exportData: () => ({
                format: 'horizon-expedition-export-v1', privacy: 'Privileged real-world ledger and hypothetical trace; not a learner trajectory.', report: controller.snapshot(), world: ledger.exportData(), intent: director.snapshot(), trace: trace.snapshot(), profile: profiler.snapshot(), reproduction: planner.failureReproduction?.() || null
            }),
            dispose() {
                closed = true;
                controller.dispose();
                planner.dispose();
            }
        });
    }
    return { create };
});
