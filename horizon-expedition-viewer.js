/* Separate opt-in page. Existing horizon-live.html and ordinary evaluators are untouched. */
(function () {
    'use strict';
    const $ = id => document.getElementById(id), frame = $('game'), source = () => frame.contentWindow?.agent;
    let expedition = null, ghosts = null, busy = false, initialized = false, serial = 0, last = null;
    const configIds = ['seed', 'scenario', 'max-actions', 'depth', 'max-sims', 'driver', 'clear-rooms'];
    const integer = id => {
        const x = Number($(id).value);
        if (!Number.isSafeInteger(x))
            throw new Error('Invalid ' + id);
        return x;
    };
    function controls() {
        configIds.forEach(id => $(id).disabled = busy);
        $('initialize').disabled = busy;
        $('run').disabled = $('single').disabled = busy || !initialized || last?.quarantined === true;
        $('stop').disabled = !busy;
        $('export').disabled = !expedition;
        $('replay').disabled = !ghosts;
        $('retry').disabled = busy || !expedition;
    }
    function update(report, event, extra) {
        last = report;
        window.horizonExpeditionResult = report;
        $('state').textContent = report.state;
        $('reason').textContent = report.error ? JSON.stringify(report.error) : report.reason || event.type;
        $('actions').textContent = report.counters.verifiedActions;
        $('simulations').textContent = report.counters.simulations;
        $('loss').textContent = report.counters.grossHealthLoss;
        const intent = extra.intent;
        $('rooms').textContent = intent.world.roomCount;
        $('objective').textContent = intent.objective ? intent.objective.motivation + ' · ' + intent.objective.label : 'No committed objective';
        $('goal').textContent = report.goal ? `${report.goal.kind}: ${report.goal.roomId} (${report.goal.x}, ${report.goal.y}, ${report.goal.z})` : '—';
        $('world').textContent = JSON.stringify({
            rooms: intent.world.roomCount, passages: intent.world.passageCount, knownTiles: intent.world.knownTiles, discoveryDepth: intent.world.discoveryStack.length, status: intent.diagnostic?.reason || 'observed', deferred: intent.deferred.length
        }, null, 2);
        const profile = expedition?.profiler.snapshot();
        $('profile').textContent = JSON.stringify(profile ? { lastQuery: profile.queries.at(-1) || null, stages: profile.stages } : null, null, 2);
        $('events').textContent = report.events.slice(-40).map(e => `${e.sequence} ${e.type} ${e.reason || e.state || ''}`).join('\n');
        controls();
    }
    function load(url) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                frame.onload = null;
                reject(new Error('Game navigation timed out'));
            }, 15000);
            frame.onload = () => {
                clearTimeout(timer);
                frame.onload = null;
                resolve();
            };
            frame.src = url;
        });
    }
    $('initialize').onclick = async () => {
        if (busy)
            return;
        busy = true;
        initialized = false;
        last = null;
        ghosts?.dispose();
        ghosts = null;
        expedition?.dispose();
        expedition = null;
        controls();
        $('state').textContent = 'Initializing';
        try {
            const seed = integer('seed');
            if (seed < 0 || seed > 0xffffffff)
                throw new Error('Seed out of range');
            await load('./play.html?agent=1&horizonViewer=1&expedition=' + ++serial);
            const end = performance.now() + 15000;
            while (!source()) {
                if (performance.now() >= end)
                    throw new Error('Agent startup timed out');
                await new Promise(r => setTimeout(r, 25));
            }
            await source().reset(seed, { scenario: $('scenario').value, maxSteps: 1000 });
            expedition = AgentHorizonExpedition.create({
                source, episodeId: 'viewer-episode-' + serial, mode: $('driver').value, directorOptions: { clearRooms: $('clear-rooms').checked }, options: { maxActions: integer('max-actions') }, planOptions: { maxDepth: integer('depth'), maxSimulations: integer('max-sims') }, onEvent: update
            });
            source().setHorizonGhostView($('ghosts').checked);
            ghosts = AgentHorizonGhosts.create({ trace: expedition.trace, getView: () => source()?.getHorizonGhostView(), document: frame.contentDocument });
            ghosts.setEnabled($('ghosts').checked);
            ghosts.start();
            initialized = true;
            $('state').textContent = 'Ready';
            $('reason').textContent = 'New episode initialized; intent persists across Run and One action. Initialization settings stay fixed for this episode.';
            window.horizonExpedition = expedition;
        }
        catch (e) {
            $('state').textContent = 'Blocked';
            $('reason').textContent = String(e.message || e);
        }
        finally {
            busy = false;
            controls();
        }
    };
    async function run(singleAction) {
        if (busy || !initialized)
            return;
        busy = true;
        controls();
        try {
            last = await expedition.start({ singleAction });
            if (last.intentError) {
                $('state').textContent = 'Blocked';
                $('reason').textContent = JSON.stringify(last.intentError);
            }
        }
        catch (e) {
            $('state').textContent = 'Blocked';
            $('reason').textContent = String(e.message || e);
        }
        finally {
            busy = false;
            controls();
        }
    }
    $('run').onclick = () => run(false);
    $('single').onclick = () => run(true);
    $('stop').onclick = () => expedition?.stop('viewer-stop');
    $('replay').onclick = () => ghosts?.replay();
    $('ghosts').onchange = () => {
        ghosts?.setEnabled($('ghosts').checked);
        source()?.setHorizonGhostView?.($('ghosts').checked);
    };
    $('retry').onclick = () => {
        if (busy || !expedition)
            return;
        expedition.director.retryDeferred();
        $('reason').textContent = 'Deferred objectives released explicitly. Press Run to request new safe plans.';
    };
    $('export').onclick = () => {
        if (!expedition)
            return;
        const url = URL.createObjectURL(new Blob([JSON.stringify(expedition.exportData(), null, 2)], { type: 'application/json' })), a = document.createElement('a');
        a.href = url;
        a.download = 'horizon-expedition-report.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    window.addEventListener('pagehide', () => {
        ghosts?.dispose();
        expedition?.dispose();
    });
    controls();
})();
