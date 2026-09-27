/* Episode-local knowledge. Only real observations/verified live transitions enter this ledger. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports)
        module.exports = api;
    else
        root.AgentHorizonWorld = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const VERSION = 'horizon-world-v1', DIRS = [[0, -1, 'up'], [1, 0, 'right'], [0, 1, 'down'], [-1, 0, 'left']];
    const copy = v => JSON.parse(JSON.stringify(v));
    const stable = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    const cell = (x, y, z = 0) => JSON.stringify([x, y, z]);
    const goalKey = g => JSON.stringify([g.kind, g.roomId, g.x, g.y, g.z]);
    const exit = t => t.isDoor === true || t.exit === true;
    const usable = t => exit(t) && (t.traversal?.unlocked !== false || t.traversal?.unlockableFromHere === true || t.traversal?.unlockFromHere === true);
    const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    const roomKey = (view) => JSON.stringify([view.room.depth, view.room.id]);
    const positive = (x, min, max, name) => {
        if (!Number.isSafeInteger(x) || x < min || x > max)
            throw new TypeError('Invalid ' + name);
        return x;
    };
    function freeze(v) {
        if (v && typeof v === 'object' && !Object.isFrozen(v)) {
            Object.freeze(v);
            Object.values(v).forEach(freeze);
        }
        return v;
    }
    /** Shared BFS for ordinary goals; occupied interaction targets get a separate bounded probe. */
    function spatial(view, geometry, { maxExpanded = 8192, allowTarget = null } = {}) {
        const z = view.player.z, tiles = new Map(geometry.tiles.filter(t => t.z === z).map(t => [cell(t.x, t.y, z), t]));
        const occupied = new Set();
        for (const e of geometry.occupied || []) {
            if (!Number.isSafeInteger(e.x) || !Number.isSafeInteger(e.y) || !Number.isSafeInteger(e.width) || !Number.isSafeInteger(e.height) || e.width < 1 || e.height < 1 || e.width * e.height > 20000)
                throw new TypeError('Invalid occupied footprint');
            if (e.z !== z)
                continue;
            for (let dx = 0; dx < e.width; dx++)
                for (let dy = 0; dy < e.height; dy++)
                    occupied.add(cell(e.x + dx, e.y + dy, z));
        }
        const start = cell(view.player.x, view.player.y, z), nodes = new Map([[start, {
                    x: view.player.x, y: view.player.y, z, d: 0, parent: null, direction: null
                }]]), queue = [start];
        let cursor = 0;
        while (cursor < queue.length && cursor < maxExpanded) {
            const k = queue[cursor++], n = nodes.get(k);
            for (const [dx, dy, direction] of DIRS) {
                const x = n.x + dx, y = n.y + dy, nk = cell(x, y, z), t = tiles.get(nk);
                if (!t || nodes.has(nk))
                    continue;
                const target = allowTarget && allowTarget.x === x && allowTarget.y === y;
                if ((t.solid !== false && !usable(t)) || occupied.has(nk) && !target)
                    continue;
                nodes.set(nk, {
                    x, y, z, d: n.d + 1, parent: k, direction
                });
                if (!exit(t) && !target)
                    queue.push(nk);
            }
        }
        const pathTo = (x, y) => {
            let n = nodes.get(cell(x, y, z));
            if (!n)
                return null;
            const path = [];
            while (n.parent !== null) {
                path.push(n);
                n = nodes.get(n.parent);
            }
            return path.reverse();
        };
        return {
            nodes, tiles, occupied, pathTo, expanded: cursor, cutOff: cursor < queue.length
        };
    }
    function createLedger({ episodeId, maxRooms = 512, maxTiles = 250000, maxPassages = 8192, maxOpportunities = 32768 } = {}) {
        if (typeof episodeId !== 'string' || !episodeId || episodeId.length > 256)
            throw new TypeError('Explicit episodeId required');
        [[maxRooms, 1, 4096, 'maxRooms'], [maxTiles, 1, 1000000, 'maxTiles'], [maxPassages, 1, 32768, 'maxPassages'], [maxOpportunities, 1, 100000, 'maxOpportunities']].forEach(a => positive(...a));
        const rooms = new Map(), passages = new Map();
        let context = null, last = null, revision = 0, actionCount = 0, totalTiles = 0, stack = [], lastObservation = null;
        const fail = message => {
            throw Object.assign(new Error(message), { code: 'HORIZON_LEDGER_INVALID' });
        };
        function observe({ view, geometry, transition = null, provenance = 'live' } = {}) {
            if (provenance !== 'live')
                fail('Hypothetical branches cannot update world knowledge');
            if (!view?.room || !view.player || !geometry || geometry.schemaVersion !== 1 || geometry.roomId !== view.room.id || !Array.isArray(geometry.tiles))
                fail('Current-room observation and geometry required');
            if (!Number.isSafeInteger(view.steps) || view.steps < 0 || !Number.isSafeInteger(view.room.depth) || typeof view.room.id !== 'string' || !view.room.id || !Number.isSafeInteger(view.player.x) || !Number.isSafeInteger(view.player.y) || !Number.isFinite(view.player.z))
                fail('Invalid live observation');
            const ctx = stable({ seed: view.seed, scenario: view.scenario, contract: view.contract });
            if (context !== null && ctx !== context)
                fail('Episode/build/settings changed: create a fresh ledger');
            if (last && view.steps < last.steps)
                fail('Reset detected: create a fresh ledger even for the same seed');
            const rk = roomKey(view), g = copy(geometry), v = copy(view);
            for (const t of g.tiles)
                if (!Number.isSafeInteger(t.x) || !Number.isSafeInteger(t.y) || !Number.isFinite(t.z) || typeof t.solid !== 'boolean')
                    fail('Invalid geometry tile');
            if (new Set(g.tiles.map(t => cell(t.x, t.y, t.z))).size !== g.tiles.length)
                fail('Duplicate geometry tile');
            for (const t of g.tiles) {
                if (t.destination != null && (typeof t.destination.roomId !== 'string' || !t.destination.roomId || !Number.isSafeInteger(t.destination.depth)))
                    fail('Invalid directed destination');
                const p = passages.get(rk + '|' + cell(t.x, t.y, t.z));
                if (t.destination && p?.traversals && p.to !== JSON.stringify([t.destination.depth, t.destination.roomId]))
                    fail('Confirmed passage destination changed');
            }
            const previous = rooms.get(rk), newTiles = previous ? g.tiles.filter(t => !previous.tiles.has(cell(t.x, t.y, t.z))).length : g.tiles.length;
            if (!previous && rooms.size >= maxRooms || totalTiles + newTiles > maxTiles)
                fail('Ledger capacity reached; no silent eviction of exploration history');
            const portals = g.tiles.filter(exit), newPassages = portals.filter(t => !passages.has(rk + '|' + cell(t.x, t.y, t.z))).length;
            const observedObjects = [...(v.room.entities || []), ...(v.room.items || [])];
            const heights = new Map((g.objectHeights || []).map(row => [row.id, row.z]));
            const newOpportunityIds = new Set(observedObjects.filter(e => typeof e.id === 'string').map(e => e.id));
            const existingOpportunities = [...rooms.values()].reduce((n, r) => n + r.opportunities.size, 0);
            const addedOpportunities = [...newOpportunityIds].filter(id => !previous?.opportunities.has(id)).length;
            if (passages.size + newPassages > maxPassages || existingOpportunities + addedOpportunities > maxOpportunities)
                fail('Ledger graph/opportunity capacity reached');
            let departure = null;
            if (transition) {
                if (transition.parity !== true || transition.recorded !== true || transition.healthLoss !== 0 || !last || transition.from?.roomId !== last.roomId ||
                    transition.from.x !== last.x || transition.from.y !== last.y || transition.from.z !== last.z || transition.to?.roomId !== v.room.id || transition.to.x !== v.player.x || transition.to.y !== v.player.y || transition.to.z !== v.player.z || v.steps !== last.steps + 1)
                    fail('Transition is not the next verified live edge');
                if (last.key !== rk) {
                    const a = transition.action, delta = DIRS.find(d => d[2] === a?.direction), x = a?.type === 'Move' && delta ? last.x + delta[0] : last.x, y = a?.type === 'Move' && delta ? last.y + delta[1] : last.y;
                    if (a?.type !== 'Move' && a?.type !== 'LadderConfirm')
                        fail('Unattributed room transition');
                    departure = passages.get(last.key + '|' + cell(x, y, last.z));
                    if (!departure)
                        fail('Room transition did not originate at an observed passage');
                    if (departure.to && departure.to !== rk)
                        fail('A passage changed destination without a new observed link');
                }
            }
            // All externally supplied fields are validated before committing knowledge.
            context = ctx;
            let r = previous;
            if (!r) {
                r = {
                    key: rk, id: v.room.id, depth: v.room.depth, pathId: g.room?.pathId ?? null, firstSeenStep: v.steps, lastSeenStep: v.steps, tiles: new Map(), visited: new Set(), opportunities: new Map(), contentVersion: 0, topologyVersion: 0, coverageVersion: 0, complete: false, contentSignature: null, geometrySignature: null, entryStep: v.steps
                };
                rooms.set(rk, r);
            }
            const full = g.coverage === 'full-current-room';
            r.complete = full;
            r.lastSeenStep = v.steps;
            r.pathId = g.room?.pathId ?? r.pathId;
            r.bossRoom = g.room?.bossRoom === true;
            r.progressBlockedByEnemies = g.room?.progressBlockedByEnemies === true;
            const geoSignature = stable(g.tiles.map(t => ({
                x: t.x, y: t.y, z: t.z, solid: t.solid, isDoor: t.isDoor === true, exit: t.exit === true, traversal: t.traversal ?? null, destination: t.destination ?? null
            })).sort((a, b) => compareText(stable(a), stable(b))));
            if (geoSignature !== r.geometrySignature) {
                r.geometrySignature = geoSignature;
                r.topologyVersion++;
            }
            for (const t of g.tiles) {
                const k = cell(t.x, t.y, t.z);
                if (!r.tiles.has(k)) {
                    totalTiles++;
                    r.coverageVersion++;
                }
                r.tiles.set(k, t);
            }
            const vk = cell(v.player.x, v.player.y, v.player.z);
            if (!r.visited.has(vk)) {
                r.visited.add(vk);
                r.coverageVersion++;
            }
            const present = new Set();
            for (const e of observedObjects) {
                if (typeof e.id !== 'string' || !e.id)
                    continue;
                present.add(e.id);
                const old = r.opportunities.get(e.id), kind = e.isEnemy === true ? 'enemy' : (v.room.items || []).some(i => i.id === e.id) ? 'item' : e.resource ? 'resource' : e.spawner ? 'spawner' : null;
                if (!kind)
                    continue;
                r.opportunities.set(e.id, {
                    id: e.id, kind, x: e.x, y: e.y, z: Number.isFinite(e.z) ? e.z : Number.isFinite(heights.get(e.id)) ? heights.get(e.id) : null, width: e.width ?? 1, height: e.height ?? 1, health: e.health ?? null, healingAmount: e.healingAmount ?? null, categories: e.categories || [], resource: e.resource ?? null, collidable: e.collidable ?? false, destroyable: e.destroyable === true, interactable: e.interactable === true, status: e.resource?.available === false ? 'depleted' : 'present', firstSeenStep: old?.firstSeenStep ?? v.steps, lastSeenStep: v.steps
                });
            }
            if (full)
                for (const [id, o] of r.opportunities)
                    if (!present.has(id) && o.status === 'present')
                        r.opportunities.set(id, { ...o, status: 'absent', lastSeenStep: v.steps });
            // Last-known observations outside the current room are not asserted current.
            const contentSignature = stable({
                entities: v.room.entities || [], items: v.room.items || [], warnings: v.room.hitWarnings || [], hazards: g.hazards || [], topologyVersion: r.topologyVersion
            });
            if (contentSignature !== r.contentSignature) {
                r.contentSignature = contentSignature;
                r.contentVersion++;
            }
            for (const t of portals) {
                const pk = rk + '|' + cell(t.x, t.y, t.z), p = passages.get(pk) || {
                    id: pk, from: rk, to: null, traversals: 0, lastTraversedStep: null, evidence: 'observed-portal', arrivalCandidate: false
                };
                p.x = t.x;
                p.y = t.y;
                p.z = t.z;
                p.kind = t.isDoor ? 'door' : 'ladder';
                p.usable = usable(t);
                p.traversal = t.traversal ?? null;
                p.present = true;
                if (t.destination && typeof t.destination.roomId === 'string' && Number.isSafeInteger(t.destination.depth)) {
                    const to = JSON.stringify([t.destination.depth, t.destination.roomId]);
                    p.to = to;
                    if (!p.traversals)
                        p.evidence = 'observed-directed-link';
                }
                passages.set(pk, p);
            }
            if (full)
                for (const p of passages.values())
                    if (p.from === rk && !portals.some(t => p.x === t.x && p.y === t.y && p.z === t.z)) {
                        p.present = false;
                        p.usable = false;
                    }
            if (departure) {
                departure.to = rk;
                departure.evidence = 'verified-live-traversal';
                departure.traversals++;
                departure.lastTraversedStep = v.steps;
                for (const p of passages.values())
                    if (p.from === rk && p.z === v.player.z && Math.abs(p.x - v.player.x) + Math.abs(p.y - v.player.y) <= 1)
                        p.arrivalCandidate = true;
                const ancestor = stack.indexOf(rk);
                if (ancestor >= 0)
                    stack = stack.slice(0, ancestor + 1);
                else
                    stack.push(rk);
            }
            else if (!last)
                stack = [rk];
            else if (last.key !== rk)
                stack = [rk];
            if (transition)
                actionCount++;
            const sig = stable({
                step: v.steps, rk, player: v.player, topology: r.topologyVersion, content: r.contentVersion, coverage: r.coverageVersion
            });
            if (sig !== lastObservation) {
                revision++;
                lastObservation = sig;
            }
            last = {
                key: rk, roomId: v.room.id, steps: v.steps, x: v.player.x, y: v.player.y, z: v.player.z
            };
            return summary();
        }
        function summary() {
            return {
                version: VERSION, episodeId, revision, actions: actionCount, roomCount: rooms.size, passageCount: passages.size, knownTiles: totalTiles, currentRoom: last?.key ?? null, discoveryStack: [...stack], knowledgeMode: 'live-current-room-oracle'
            };
        }
        function exportData() {
            return freeze({
                ...summary(), context, last: copy(last), rooms: [...rooms.values()].map(r => ({
                    ...r, tiles: [...r.tiles.values()], visited: [...r.visited].sort(), opportunities: [...r.opportunities.values()].sort((a, b) => compareText(a.id, b.id))
                })).sort((a, b) => compareText(a.key, b.key)), passages: [...passages.values()].map(copy).sort((a, b) => compareText(a.id, b.id))
            });
        }
        // Read-only, detached projections. No mutable engine or ledger objects leave the module.
        const getRoom = k => {
            const r = rooms.get(k);
            return r ? copy({
                ...r, tiles: [...r.tiles.values()], visited: [...r.visited], opportunities: [...r.opportunities.values()]
            }) : null;
        };
        function info(r, includeTiles = false) {
            return copy({
                key: r.key, id: r.id, depth: r.depth, pathId: r.pathId, firstSeenStep: r.firstSeenStep, lastSeenStep: r.lastSeenStep, contentVersion: r.contentVersion, topologyVersion: r.topologyVersion, coverageVersion: r.coverageVersion, complete: r.complete, bossRoom: r.bossRoom, progressBlockedByEnemies: r.progressBlockedByEnemies, opportunities: [...r.opportunities.values()], tiles: includeTiles ? [...r.tiles.values()] : []
            });
        }
        return Object.freeze({
            observe, summary, exportData, room: getRoom, roomInfo: (key, includeTiles = false) => rooms.has(key) ? info(rooms.get(key), includeTiles) : null, summaries: () => [...rooms.values()].map(r => info(r)), rooms: () => [...rooms.keys()].sort().map(getRoom), passages: () => [...passages.values()].map(copy).sort((a, b) => compareText(a.id, b.id))
        });
    }
    function createDirector({ ledger, radius = 5, maxExpanded = 8192, collectItems = true, clearRooms = false, maxDeferred = 512, cooldownActions = 8 } = {}) {
        if (!ledger?.observe)
            throw new TypeError('World ledger required');
        positive(radius, 1, 32, 'radius');
        positive(maxExpanded, 1, 20000, 'maxExpanded');
        positive(maxDeferred, 1, 4096, 'maxDeferred');
        positive(cooldownActions, 1, 1000, 'cooldownActions');
        let objective = null, diagnostic = null, latest = null, proposalSerial = 0, offered = null, preferredId = null;
        const deferred = new Map();
        function rankItems(r, v) {
            return r.opportunities.filter(o => o.status === 'present' && o.kind === 'item' && o.z === v.player.z && (collectItems || o.healingAmount > 0 && v.player.health < v.player.maxHealth));
        }
        function proposals({ view, geometry, excluded = [] }) {
            const meta = ledger.summary(), r = ledger.roomInfo(roomKey(view), geometry.coverage !== 'full-current-room');
            if (!r)
                throw new Error('Observe the live state before selection');
            const grid = spatial(view, geometry, { maxExpanded }), excludedSet = new Set(excluded), out = [], allPassages = ledger.passages(), knownRooms = new Map(ledger.summaries().map(r => [r.key, r])), knownTiles = new Set(r.tiles.map(t => cell(t.x, t.y, t.z)));
            const isDeferred = (id, room) => {
                const d = deferred.get(id);
                return d && d.version === room.contentVersion + ':' + room.topologyVersion && meta.actions < d.until;
            };
            const add = (motivation, id, target, priority, label, targetRoom = r, route = null) => {
                if (isDeferred(id, targetRoom))
                    return;
                let path = route || grid.pathTo(target.x, target.y);
                if (!path)
                    return;
                let goal;
                if (!path.length) {
                    if (target.kind !== 'exit' || view.decision !== 'ladder')
                        return;
                    goal = {
                        kind: 'exit', roomId: r.id, x: target.x, y: target.y, z: view.player.z
                    };
                }
                else {
                    const p = path[Math.min(radius, path.length) - 1];
                    goal = {
                        kind: path.length <= radius ? target.kind : 'position', roomId: r.id, x: p.x, y: p.y, z: view.player.z
                    };
                }
                if (excludedSet.has(goalKey(goal)))
                    return;
                out.push({
                    id, motivation, targetRoom: targetRoom.key, target: copy(target), goal, priority, distance: path.length, label, version: targetRoom.contentVersion + ':' + targetRoom.topologyVersion
                });
            };
            const threat = (view.room.hitWarnings || []).some(w => w.dangerous === true && w.hostile !== false && w.x === view.player.x && w.y === view.player.y);
            if (threat)
                for (const [dx, dy] of DIRS) {
                    const x = view.player.x + dx, y = view.player.y + dy, t = grid.tiles.get(cell(x, y, view.player.z));
                    if (t && !exit(t))
                        add('ESCAPE', 'escape:' + r.key + ':' + cell(x, y, view.player.z), { kind: 'position', x, y }, 0, 'Leave the threatened tile; Horizon still verifies it');
                }
            const local = allPassages.filter(p => p.from === r.key && p.present);
            for (const o of rankItems(r, view)) {
                const need = o.healingAmount > 0 && view.player.health < view.player.maxHealth;
                add('COLLECT_RESOURCE', 'item:' + r.key + ':' + o.id, {
                    kind: 'position', x: o.x, y: o.y, entityId: o.id
                }, need ? 10 : 35, need ? 'Acquire observed healing' : 'Acquire an observed item');
            }
            for (const o of r.opportunities.filter(o => o.kind === 'resource' && o.status === 'present' && o.z === view.player.z && o.destroyable === true)) {
                const resourceGrid = spatial(view, geometry, { maxExpanded, allowTarget: o });
                add('COLLECT_RESOURCE', 'resource:' + r.key + ':' + o.id, {
                    kind: 'position', x: o.x, y: o.y, entityId: o.id
                }, 37, 'Resolve an observed breakable resource through verified directional actions', r, resourceGrid.pathTo(o.x, o.y));
            }
            const enemies = r.opportunities.filter(o => o.kind === 'enemy' && o.status === 'present' && o.z === view.player.z);
            if (clearRooms || r.progressBlockedByEnemies)
                for (const o of enemies) {
                    if (!Number.isSafeInteger(o.x) || !Number.isSafeInteger(o.y))
                        continue;
                    // Approach a concrete occupied tile. Directional combat still occurs only in the real planner.
                    const combatGrid = spatial(view, geometry, { maxExpanded, allowTarget: o });
                    add(r.bossRoom ? 'BOSS_PROGRESS' : 'CLEAR_ROOM', 'enemy:' + r.key + ':' + o.id, {
                        kind: 'position', x: o.x, y: o.y, entityId: o.id
                    }, r.progressBlockedByEnemies ? 20 : 45, 'Resolve the observed enemy through verified directional actions', r, combatGrid.pathTo(o.x, o.y));
                }
            if (geometry.coverage !== 'full-current-room')
                for (const n of grid.nodes.values()) {
                    if (!n.d || exit(grid.tiles.get(cell(n.x, n.y, n.z))))
                        continue;
                    if (DIRS.some(([dx, dy]) => !knownTiles.has(cell(n.x + dx, n.y + dy, n.z))))
                        add('EXPLORE_REGION', 'frontier:' + r.key + ':' + cell(n.x, n.y, n.z), { kind: 'position', x: n.x, y: n.y }, 30, 'Inspect an observed frontier');
                }
            for (const p of local.filter(p => p.usable && (!p.to || !knownRooms.get(p.to)))) {
                const progression = p.kind === 'ladder' && p.traversal?.direction === 'down' && p.traversal?.sidePath !== true;
                add(progression ? 'ADVANCE_FLOOR' : 'FOLLOW_NEW_PASSAGE', 'passage:' + p.id, { kind: 'exit', x: p.x, y: p.y }, p.arrivalCandidate ? 80 : progression ? 65 : 40, p.arrivalCandidate ? 'Resolve a possible return passage after local exploration' : 'Explore a not-yet-visited passage');
            }
            // Route to unfinished known rooms using directed, observed links only. Never invent a reverse edge.
            const routes = new Map([[r.key, []]]), queue = [r.key];
            for (let cursor = 0; cursor < queue.length && cursor < 512; cursor++) {
                const from = queue[cursor];
                for (const p of allPassages.filter(p => p.from === from && p.present && p.usable && p.to && knownRooms.get(p.to))) {
                    if (routes.has(p.to))
                        continue;
                    routes.set(p.to, [...routes.get(from), p]);
                    queue.push(p.to);
                }
            }
            for (const [key, path] of routes) {
                if (!path.length)
                    continue;
                const rr = knownRooms.get(key);
                const unfinished = allPassages.some(p => p.from === key && p.present && p.usable && (!p.to || !knownRooms.get(p.to))) || rr.opportunities.some(o => o.status === 'present' && (o.kind === 'item' && collectItems || o.kind === 'enemy' && rr.progressBlockedByEnemies));
                if (unfinished) {
                    const p = path[0];
                    add('EXPLORE_REGION', 'region:' + key, { kind: 'exit', x: p.x, y: p.y }, 50 + path.length, 'Continue toward unfinished observed region', rr);
                }
            }
            const parent = meta.discoveryStack.length > 1 ? meta.discoveryStack[meta.discoveryStack.length - 2] : null;
            const parentRoute = parent && routes.get(parent);
            if (parentRoute?.length) {
                const p = parentRoute[0];
                add('BACKTRACK', 'backtrack:' + r.key + ':' + parent, { kind: 'exit', x: p.x, y: p.y }, 90, 'Return toward the discovery parent after actionable local opportunities', r);
            }
            out.sort((a, b) => a.priority - b.priority || a.distance - b.distance || compareText(a.id, b.id));
            // Distinguish temporarily deferred/locked content from an actual lack of known work.
            diagnostic = {
                revision: meta.revision, knownRooms: meta.roomCount, candidates: out.length, searchCutOff: grid.cutOff, expanded: grid.expanded, lockedPassages: local.filter(p => !p.usable && p.present).length,
                unresolved: r.opportunities.filter(o => o.status === 'present').length, reason: out.length ? 'objectives-available' : grid.cutOff ? 'SPATIAL_BUDGET_EXHAUSTED' : 'NO_ACTIONABLE_KNOWN_OBJECTIVE'
            };
            return out;
        }
        function observe(input) {
            ledger.observe(input);
            latest = { view: copy(input.view), geometry: copy(input.geometry) };
        }
        function select(input) {
            latest = { view: copy(input.view), geometry: copy(input.geometry) };
            const choices = proposals(input), meta = ledger.summary();
            let chosen = preferredId && choices.find(c => c.id === preferredId);
            preferredId = null;
            const incumbent = objective && choices.find(c => c.id === objective.id);
            if (!chosen)
                chosen = incumbent && (!choices.length || incumbent.priority <= choices[0].priority) ? incumbent : choices[0];
            objective = chosen ? copy(chosen) : null;
            offered = null;
            return chosen ? {
                goal: chosen.goal, label: chosen.motivation + ' · ' + chosen.label, objective: { id: chosen.id, motivation: chosen.motivation, targetRoom: chosen.targetRoom }, basis: 'persistent-live-world-intent-not-safety', revision: meta.revision
            } : null;
        }
        select.shouldReselect = ({ view, goal }) => {
            if (preferredId)
                return true;
            if (!objective)
                return false;
            if (!latest || latest.view.steps !== view.steps)
                return false;
            const choices = proposals({ ...latest, excluded: [] });
            const incumbent = choices.find(c => c.id === objective.id);
            return !incumbent || stable(incumbent.target) !== stable(objective.target) || choices[0]?.priority < objective.priority;
        };
        function feedback(event) {
            if (event?.type === 'no-safe-prefix' && objective) {
                if (deferred.size >= maxDeferred)
                    deferred.delete(deferred.keys().next().value);
                deferred.set(objective.id, { version: objective.version, until: ledger.summary().actions + cooldownActions, status: 'deferred-not-impossible' });
                objective = null;
                offered = null;
            }
        }
        function offer() {
            if (!latest)
                throw new Error('No real observation');
            const candidates = proposals({ ...latest, excluded: [] }).slice(0, 64), meta = ledger.summary();
            offered = {
                token: meta.episodeId + ':' + meta.revision + ':' + (++proposalSerial), revision: meta.revision, episodeId: meta.episodeId, candidates
            };
            return freeze(copy({
                format: 'horizon-objective-offer-v1', token: offered.token, revision: offered.revision, episodeId: offered.episodeId, knowledgeMode: meta.knowledgeMode, summary: {
                    rooms: meta.roomCount, passages: meta.passageCount, currentRoom: meta.currentRoom, currentMotivation: objective?.motivation ?? null
                }, candidates: candidates.map(c => ({
                    id: c.id, motivation: c.motivation, distance: c.distance, priority: c.priority, label: c.label
                }))
            }));
        }
        function accept({ token, objectiveId } = {}) {
            if (!offered || token !== offered.token || offered.revision !== ledger.summary().revision || !offered.candidates.some(c => c.id === objectiveId))
                return false;
            preferredId = objectiveId;
            offered = null;
            return true;
        }
        return Object.freeze({
            select, observe, feedback, offer, accept, retryDeferred() {
                deferred.clear();
                objective = null;
                offered = null;
                preferredId = null;
            }, snapshot: () => copy({
                objective, diagnostic, deferred: [...deferred].map(([id, v]) => ({ id, ...v })), world: ledger.summary()
            })
        });
    }
    return {
        VERSION, DIRS, cell, goalKey, roomKey, usable, spatial, createLedger, createDirector
    };
});
