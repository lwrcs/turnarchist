# Performance: measure rebuilding before changing language

## Shipped optimization

The current host restores complete branch snapshots, constructs observations and guards, and captures continuations. Its `loadedIdentity` cursor already avoids restoration when continuing the exact state currently loaded in the child. The optional **route-first** driver exploits that existing mechanism rather than pretending JavaScript is intrinsically too slow.

One shared BFS proposes a path to the explicit local goal. The driver evaluates that sequence with the **same real adapter**, preserving legal-action checks, zero gross loss, continuation, and first-edge execution evidence. No empty-room certificate, predicted trap period, simplified enemy model, or synthetic Wait is used. A simple four-action corridor can thus be evaluated as one loaded sequence instead of evaluating/restoring siblings at every depth.

A rejection, damage, terminal state, or unexpected movement redirects to the ordinary bounded search from the same root with remaining cumulative simulations, expansions, nodes and wall-clock allocation. A restoration/metric/contract failure is not a fallback opportunity: it fails closed. Only actual verified prefix steps can be returned. An admitted step retains the existing host's settlement contract; the query cutoff does not abandon its outcome. The total session and individual operation timeouts remain unchanged.

Route-first is not optimal and is not guaranteed to improve every query. A bad proposal spends some budget before fallback. Compare useful solved objectives, verified real progress, regressions and time—not just raw simulation throughput. The original `plan()` remains unchanged and the separate viewer defaults to **reference**. `planForExecution()` accepts the optional strategy hook.

Repeated root/action evaluation during fallback reuses accounting for the same stored first-edge proof. If the repeated proof differs, `HORIZON_REPEAT_EDGE_DIVERGED` stops the query. A mismatch is never overwritten to make the new strategy pass.

## Measured here (synthetic, not a Turnarchist benchmark)

A controlled four-step corridor with the current host/controller contracts produced:

| Strategy | Actual adapter simulations | Restores | First-edge witness |
|---|---:|---:|---|
| Reference | 16 | 16 | Canonically identical |
| Route-first | 4 | 1 | Canonically identical |

The live source was unchanged in both cases. This measures reduced operation counts, **not a claim of 4× or 16× real-game wall-clock speedup**. See `evidence/operation-count-benchmark.json`.

The actual-game runner performs paired queries on one untouched root and one explicit local goal, matching the current depth/simulation/expansion/node/time budgets. It records both results even when heuristic choices differ. Full simulation/observation parity remains mandatory; missing progress does not become success.

## Profiling supplied

The optional host instrumentation measures startup, root restore, branch restore, step, snapshot capture plus key construction, and guard validation. The bounded profiler retains 64 query summaries and 1,024 operation records, including p50/p95 and dropped-operation accounting. Stage totals are over the retained operation window, which may differ from the query-summary window; they are diagnostic, not a complete lifetime accounting ledger.

The driver's query duration begins after the host's existing execution warm-up. Startup/root restoration remain visible in stage totals and are charged to the live session. Do not compare driver duration alone with full live action latency. For architecture decisions record fresh/warm worker, build/settings, seed, scene, exact root, goal, mode, budgets, verified outcome, simulation count, memory and wall-clock stage timings. Use repeated paired cases, including doors, trap phases, fights, spawn/resource interactions and already discovered divergence fixtures.

Trace export includes summaries, not full snapshots per node. The ledger uses lightweight summaries for strategic routing instead of copying entire world geometry for every selection. Neither change strips fields from the mechanical state key or safety guard.

## i7-12700K / RTX 3080 Ti

The 12700K has 8 performance cores plus 4 efficiency cores, 20 hardware threads. There is parallel capacity to investigate, but the current same-origin iframe simulator calls a DOM-coupled game in the browser's main-thread environment. More iframes or `Promise.all` are not a reliable CPU-parallel search design. Workers can run on other threads but cannot directly use `window`/DOM APIs. Moving this exact bundle into a Worker therefore requires a simulation boundary, not one extra keyword.

Recommended next work, in order:

1. Use the supplied paired profiler to identify the dominant cost on the actual machine. If restoration/capture/guard work dominates, parallelizing expensive copies is not the first fix.
2. Build a versioned compact **mutable gameplay checkpoint** over shared immutable level geometry; keep every gameplay-relevant timer, RNG stream, identity/link and pending effect. Do not reuse player-save assumptions for simulator completeness. The existing snapshot backend remains the parity oracle.
3. Separate gameplay advancement from wall-clock/presentation/DOM dependencies. Preserve gameplay-relevant lighting, attack phases and delayed effects even when rendering is disabled. Headless is not equivalent to “skip anything visual-looking.”
4. Place that backend behind the current adapter in a bounded Worker pool. Start benchmarks with **2, then 4 workers**, not 20 full renderers. Give every worker independent mutable state and a versioned root/query/job identity; stale/cancelled results cannot dispatch. Charge all work to one global budget and merge in a deterministic order for reproducibility. Test cancellation, backpressure and worker retirement.
5. Only after demonstrated equivalence consider certified phase-aware empty-room solving or cross-query subtree reuse. Position/turn modulo a guessed trap period is not a valid universal tactical key.

A separate browser-process simulation pool is another later option that preserves DOM support, but has startup, memory and messaging costs. It is **not included** here. Neither are Worker threads, SharedArrayBuffer, GPU search, WebAssembly, a compact simulator, or neural inference. The RTX card does not execute ordinary branch-heavy JavaScript automatically; its potential future use is batched learned-policy/value inference or a deliberately GPU-oriented simulator, not an assumed acceleration of this object graph.

## Source references

Primary references consulted: Intel's i7-12700K specifications; MDN's Web Workers guide; the HTML Standard's agent/event-loop model. Exact URLs are recorded as code data in `SOURCE_REFERENCES.json`. Repository-specific conclusions derive from the inspected committed host and engine and must be remeasured on the working checkout.
