/* Read-only branch rendering. Never creates a Player, entity, item, RNG call, or game action. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports)
        module.exports = api;
    else
        root.AgentHorizonGhosts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    function pose(event, time, { moveMs = 160, holdMs = 600, fadeMs = 420 } = {}) {
        if (event.type !== 'edge' || !event.from)
            return null;
        const age = time - event.atMs;
        if (age < 0)
            return null;
        const damage = typeof event.healthLoss === 'number' && event.healthLoss > 0;
        const rejected = !event.to || !['safe', 'damage-pruned', 'terminal'].includes(event.outcome);
        const duration = moveMs + (damage ? 0 : holdMs) + fadeMs;
        if (age >= duration)
            return null;
        const t = clamp(age / moveMs, 0, 1), ease = t * t * (3 - 2 * t), to = event.to || event.from;
        const sameRoom = event.from.roomId === to.roomId && event.from.depth === to.depth && event.from.z === to.z;
        const x = sameRoom ? event.from.x + (to.x - event.from.x) * ease : event.from.x;
        const y = sameRoom ? event.from.y + (to.y - event.from.y) * ease : event.from.y;
        const fade = clamp((age - moveMs - (damage ? 0 : holdMs)) / fadeMs, 0, 1);
        return {
            x, y, z: event.from.z, roomId: event.from.roomId, depth: event.from.depth, alpha: (damage ? .65 : .38) * (1 - fade), hurt: damage && age >= moveMs,
            rejected, exit: !sameRoom, nodeId: event.nodeId, parentId: event.parentId, direction: event.action?.direction || 'down', from: event.from, to: sameRoom ? to : event.from
        };
    }
    function create({ trace, getView, canvas = null, maxGhosts = 256, fps = 20, drawSprite = null, document: doc = typeof document !== 'undefined' ? document : null } = {}) {
        if (!trace?.readSince || typeof getView !== 'function' || !Number.isSafeInteger(maxGhosts) || maxGhosts < 1 || maxGhosts > 2048 || !Number.isFinite(fps) || fps < 1 || fps > 60)
            throw new TypeError('Invalid ghost renderer');
        let ownCanvas = false, query = 0, seq = 0, events = [], base = 0, paused = false, playTime = 0, lastTime = 0, raf = null, disposed = false, enabled = true, rendered = 0, dropped = 0, spriteCache = new Map(), currentSheet = null, lastError = null;
        const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
        const rafFn = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : null, cancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : () => {
        };
        function poll() {
            const delta = trace.readSince(query, seq);
            if (delta.reset) {
                query = delta.query;
                seq = 0;
                events = [];
                base = now();
                playTime = 0;
            }
            for (const e of delta.events) {
                seq = Math.max(seq, e.sequence);
                if (e.type === 'edge')
                    events.push(e);
            }
            dropped = delta.dropped;
        }
        function sprite(sheet, tileSize, row, hurt) {
            if (currentSheet !== sheet) {
                spriteCache.clear();
                currentSheet = sheet;
            }
            const key = tileSize + ':' + row + ':' + hurt;
            if (spriteCache.has(key))
                return spriteCache.get(key);
            if (!doc || !sheet?.complete || !sheet.naturalWidth)
                return null;
            const c = doc.createElement('canvas');
            c.width = tileSize;
            c.height = tileSize * 2;
            const ctx = c.getContext('2d');
            ctx.drawImage(sheet, 0, row * tileSize, tileSize, tileSize * 2, 0, 0, c.width, c.height);
            if (hurt) {
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = '#ef3f45';
                ctx.fillRect(0, 0, c.width, c.height);
            }
            spriteCache.set(key, c);
            return c;
        }
        function draw(at = now()) {
            poll();
            const view = getView();
            if (!view) {
                if (canvas) {
                    const context = canvas.getContext('2d');
                    context.setTransform(1, 0, 0, 1, 0, 0);
                    context.clearRect(0, 0, canvas.width, canvas.height);
                }
                rendered = 0;
                return;
            }
            if (canvas && canvas === view.canvas)
                throw new Error('Ghosts require a separate overlay, not the gameplay canvas');
            if (!canvas && view.canvas && doc) {
                canvas = doc.createElement('canvas');
                canvas.id = 'horizon-ghost-overlay';
                canvas.setAttribute('aria-hidden', 'true');
                canvas.style.cssText = 'position:fixed;pointer-events:none;z-index:9;image-rendering:pixelated';
                doc.body.appendChild(canvas);
                ownCanvas = true;
            }
            if (!canvas)
                return;
            const ctx = canvas.getContext('2d');
            if (view.canvas && ownCanvas) {
                const r = view.canvas.getBoundingClientRect();
                canvas.style.left = r.left + 'px';
                canvas.style.top = r.top + 'px';
                canvas.style.width = r.width + 'px';
                canvas.style.height = r.height + 'px';
                if (canvas.width !== view.canvas.width)
                    canvas.width = view.canvas.width;
                if (canvas.height !== view.canvas.height)
                    canvas.height = view.canvas.height;
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            rendered = 0;
            if (!enabled || view.hidden || view.ageMs > 500 || !Array.isArray(view.matrix) || view.matrix.length !== 6)
                return;
            const t = paused ? playTime : at - base;
            ctx.save();
            ctx.setTransform(...view.matrix);
            ctx.imageSmoothingEnabled = false;
            const ts = view.tileSize, poses = events.map(e => pose(e, t)).filter(p => p && p.roomId === view.roomId && p.depth === view.depth && p.z === view.z).slice(-maxGhosts);
            for (const p of poses) {
                ctx.globalAlpha = p.alpha;
                ctx.strokeStyle = p.hurt ? '#ef3f45' : p.rejected ? '#819096' : '#b7ddda';
                ctx.lineWidth = Math.max(.5, ts * .035);
                ctx.beginPath();
                ctx.moveTo((p.from.x + .5) * ts, (p.from.y + .5) * ts);
                ctx.lineTo((p.x + .5) * ts, (p.y + .5) * ts);
                ctx.stroke();
                if (drawSprite) {
                    ctx.save();
                    try {
                        drawSprite(ctx, p, view);
                    }
                    finally {
                        ctx.restore();
                    }
                }
                else {
                    const tile = sprite(view.sheet, ts, view.directionRows?.[p.direction] ?? 0, p.hurt);
                    if (tile)
                        ctx.drawImage(tile, Math.round(p.x * ts), Math.round((p.y - 1.45) * ts), ts, ts * 2);
                    else {
                        ctx.fillStyle = p.hurt ? '#ef3f45' : '#b7ddda';
                        ctx.fillRect((p.x + .28) * ts, (p.y - .65) * ts, ts * .44, ts * 1.2);
                        ctx.fillRect((p.x + .2) * ts, (p.y - 1.05) * ts, ts * .6, ts * .5);
                    }
                }
                if (p.rejected) {
                    ctx.beginPath();
                    ctx.moveTo(p.x * ts, p.y * ts);
                    ctx.lineTo((p.x + 1) * ts, (p.y + 1) * ts);
                    ctx.moveTo((p.x + 1) * ts, p.y * ts);
                    ctx.lineTo(p.x * ts, (p.y + 1) * ts);
                    ctx.stroke();
                }
                rendered++;
            }
            ctx.restore();
            ctx.globalAlpha = 1;
        }
        function frame(t) {
            if (disposed)
                return;
            if (t - lastTime >= 1000 / fps) {
                lastTime = t;
                try {
                    draw(t);
                }
                catch (error) {
                    enabled = false;
                    lastError = String(error.message || error).slice(0, 256);
                }
            }
            raf = rafFn?.(frame);
        }
        function start() {
            if (disposed || raf !== null || !rafFn)
                return;
            base = now();
            raf = rafFn(frame);
        }
        return Object.freeze({
            start, draw, setEnabled(v) {
                enabled = v === true;
            }, pause(v = true) {
                if (v && !paused)
                    playTime = now() - base;
                if (!v && paused)
                    base = now() - playTime;
                paused = v;
            }, seek(ms) {
                playTime = Math.max(0, Number(ms) || 0);
                paused = true;
                draw();
            }, replay() {
                playTime = 0;
                base = now();
                paused = false;
            }, stats: () => ({
                query, rendered, retainedEdges: events.length, dropped, enabled, paused, lastError
            }), dispose() {
                disposed = true;
                if (raf !== null)
                    cancel(raf);
                raf = null;
                if (ownCanvas)
                    canvas?.remove();
                spriteCache.clear();
                events = [];
            }
        });
    }
    return { pose, create };
});
