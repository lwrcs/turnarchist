# Horizon phase 1 v1.2: implementation contract

**Status:** implementation supplied; isolated tests passed; full-checkout compilation and actual-game smoke gates remain mandatory. This is an advisory, privileged planner, not a PPO controller. Application instructions are in the packet's `00_APPLY_WITH_CODEX.md`.

## Delivered boundary

Search for a zero-gross-health-loss sequence from the current state to a position in the current room, or through a specified exit. Simulate each candidate using the existing isolated game instance and real `step()` rules. Never execute the returned sequence on the live player. Ordinary previews and training behavior remain unchanged. The installed `horizon-smoke.html` is the dedicated entry point for validation; this packet does not modify existing training or preview pages to call the new API automatically.

Modules are separate by responsibility:

| Module | Responsibility |
|---|---|
| `agent-horizon-core.js` | Generic bounded best-first search, state dominance, transition cache, result semantics |
| `agent-horizon-host.js` | Turnarchist adapter, goal/action rules, existing simulator mutex, live-state guards |
| `src/game/agentPlanning.ts` | Versioned continuation envelope and isolated gross-health-loss instrumentation |
| Planning and diagnostic lifecycle hooks in `src/game/agentEnvironment.ts` | Capture/restore/guard/step methods using existing gameplay APIs |
| `training/horizon-tests.cjs` and `training/tests/horizon-*` | Standalone algorithm and typed adapter-contract regression suite |
| `horizon-smoke.html`, `training/horizon-browser-smoke.js`, `training/horizon_smoke.py` | Fresh-browser, real-engine smoke gate |

No runtime package dependency is added. Node's test runner and the already installed TypeScript compiler run the unit suite. The browser runner reuses an existing Python Playwright environment and installed Chrome/Chromium. Optional bootstrap creates a temporary external venv, never a repository dependency or browser download. `training/horizon-validate.cjs` coordinates checks/reports; `horizon-watch-once.cjs` runs one polling development-watch cycle only when explicitly requested.

## Browser API

Load these scripts, in order, in a same-origin host page:

```html
<script src="./agent-simulation-host.js"></script>
<script src="./agent-horizon-core.js"></script>
<script src="./agent-horizon-host.js"></script>
```

The following example runs in the supplied `horizon-smoke.html` after its test game is initialized. It intentionally asks for the player's current position, so it is a runnable API check rather than an invented destination:

```js
const source = () => document.getElementById('game').contentWindow.agent;
const planner = AgentHorizonHost.create({ source });
const view = source().observe();
const result = await planner.plan({
  kind: 'position', roomId: view.room.id,
  x: view.player.x, y: view.player.y, z: view.player.z,
}, { maxDepth: 5, maxSimulations: 256 });
console.log(result);
planner.dispose();
```

`create({ source, simulator?, createFrame?, stepTimeoutMs? })` returns `{ plan, cancel, dispose }`. `source` must return the live `window.agent`. Supplying an existing `IsolatedSimulator` shares that preview instance's `pending` mutex and iframe; both must refer to the same live agent. Without one, the host constructs the existing simulator class. `stepTimeoutMs` defaults to 3000, accepts integers 1–60000, and governs individual restore/step operations. Simulator startup has a separate 15000 ms timeout.

`plan(goal, options = {}, { signal } = {})` returns a promise of a structured result. One query owns the simulator at a time; overlap returns `BUSY`. `cancel()` aborts the current query. `dispose()` aborts and retires the simulator, including a shared simulator supplied by the caller. Do not dispose a shared host while another component is using it.

### Goal definitions

Position: `{ kind: 'position', roomId, x, y, z? }`. Room must be the root's current room; x/y must be safe integers. z defaults to the root player's z and must be finite. Success means those coordinates actually appear in the simulated observation. It does not imply a door transition or a dismissed modal.

Exit: `{ kind: 'exit', roomId, x, y, z?, targetRoomId?, targetDepth? }`. x/y identify the origin-room exit tile. Success requires an actual room or depth transition caused by a Move aimed at that adjacent tile, or a LadderConfirm while on it. Optional destination fields further constrain success. The planner does not explore subsequent rooms or infer success merely from standing beside a door. An unsupported exit mechanic produces no fabricated route; adding other interaction patterns is a later adapter change.

Unknown goal/option fields are rejected. All coordinates and room identities must come from the initialized game, not a guessed display label.

### Action set

In `world`, enumerate Move up/right/down/left in that deterministic order; a directional action can walk, attack, or interact under real rules. In `ladder`, enumerate LadderConfirm then LadderCancel. In `vending` or `dismissable-interaction`, only DismissInteraction. Other decision modes are unsupported. There is no synthetic Wait, purchase, item use, arbitrary selection, or spell action in this phase.

Every attempted transition goes through real `step()`. An unrecorded action is discarded only when its observed physical state and measured health are unchanged; an unrecorded state-changing action fails the query closed. Directional actions may still consume keys or durability: this host constrains health, not all resources.

## Search options and costs

| Option | Default | Meaning |
|---|---:|---|
| `maxDepth` | 5 | Number of decisions, including zero-world-turn decisions; maximum 64 |
| `maxSimulations` | 256 | New adapter transition calls; cache hits do not consume this counter |
| `maxExpanded` | 256 | States whose action lists are expanded |
| `maxNodes` | 1024 | Cumulative admitted nodes retained for search and parent chains |
| `maxBytes` | 33554432 | Accounted state/key/cache bytes; not a hard JavaScript heap limit |
| `maxCacheEntries` | 128 | Per-query LRU transition cache capacity; zero disables storage |
| `maxCacheBytes` | 8388608 | Cache accounting bound, also constrained by remaining maxBytes |
| `maxMillis` | 0 | Optional core-search wall-clock cutoff; zero disables it |
| `heuristic` | `zero` | `zero` or `adapter` |

Numeric options must be nonnegative safe integers. Node/expansion/simulation limits of zero are valid immediate cutoffs. Defaults are starting configurations, not measured performance claims. Root snapshot capture precedes the core timer. Synchronous game/JSON operations cannot be interrupted mid-call, so maxMillis is not a hard end-to-end service deadline. An individual simulator timeout is reported as unsupported rather than silently assuming a safe transition.

Search cost is one per decision, **not world turns, geometric distance, damage, or a weighted resource score**. Default h=0 is uniform-cost search. The optional host heuristic is Manhattan ordering; it is not certified admissible because gameplay can move multiple tiles or teleport. `solutionOptimal` therefore remains false with that host heuristic. Frontier ranking affects which bounded prefix is returned, not a safety proof or the default queue priority.

State dominance retains the shallowest arrival at an equivalent state, allowing a later shallower arrival to reopen a state with more horizon remaining. Backtracking is not forbidden. Goal-arrival evidence is included in the dominance identity to avoid merging a successful exit edge with an unrelated arrival. Transition keys include the adapter namespace, state identity, and canonical action. Cached transitions are goal/policy-independent within a query; there is no cross-query cache in phase 1.

## State and continuation correctness

`capturePlanningSnapshot()` wraps the existing privileged Save V2 or sandbox-replay snapshot. The envelope stores seed, scenario, steps, maxSteps, vision, recent transitions, contract/settings, and the existing engine fingerprint. `restorePlanningSnapshot()` is simulator-only: validate envelope/context, restore using the existing method, verify seed/scenario, restore decision-budget metadata, and verify the fingerprint. Standard restore's old counter reset is not allowed to give every branch a fresh episode budget. Sandbox scenarios are rebuilt through the existing replay path.

Host identity is the entire canonical serialized planning envelope. It deliberately does not discard RNG, history, counters, or metadata. This is conservative and can miss many equivalent futures, particularly with replay histories; compact phase-aware equivalence is **not implemented**. Do not claim empty-room state compression from the generic graph tests.

Before/after simulation, compare live source identity, a fingerprint/context/counter guard, and diagnostic observation. Restored children must also match their parent observation. Any detected divergence or unsupported restore rejects the query. These checks rely on existing serialization/fingerprint coverage; real-engine differential tests remain necessary. They are not a proof that every unseen entity type is serializable.

### Diagnostic wire contract v3

The outer planning snapshot is `{schemaVersion: 3, source: "privileged-horizon-snapshot", serialized}`. Serialized JSON contains `{format: "turnarchist-planning-snapshot-v3", codec: "tagged-planning-data-v1", data}`. `data` is a reversible tagged DTO tree, **not a normalization of raw JavaScript values**. Decoding yields the logical envelope (inner snapshot, runtime, context, fingerprint, reconstruction). The inner simulation snapshot stays schema 1 and retains its existing game Save V2 or diagnostic replay encoding unchanged.

For own enumerable plain-record fields and ordinary arrays, the codec preserves present undefined versus absence, holes versus elements, null, NaN, ±Infinity and −0. Every object/array container is tagged, preventing ordinary tag-looking game data from colliding with codec tags. Record keys are sorted; `__proto__` is defined as data, not used as a prototype setter. Cross-realm plain records and null-prototype records are supported. Prototype identity and shared-reference identity are not part of the DTO value contract. Cycles, functions, symbols, accessors, class instances and named array properties are unsupported; getters/toJSON are not used to obtain DTO values. This is not a universal game-object serializer.

Limits: outer serialized text 24,000,000 characters, inner text 20,000,000, depth 128, 250,000 visited diagnostic values. Size failure is unsupported, not truncation. Required seed/step/maxSteps metadata and measured player health must remain finite and valid; diagnostic sentinel support does not make infinite player HP legal.

`getPlanningCapabilities()` returns snapshotSchemaVersion, format, codec, healthMetric and reconstruction format; host and child must agree before use. `getPlanningGuard()` returns an opaque encoded JSON-safe tree. Never interpret it as the old raw fingerprint object. The host's state namespace changes to `turnarchist-savev2-or-sandbox/horizon-v3`; old continuation snapshots/caches are intentionally incompatible and must be recaptured. Neither v1 nor v2 planning snapshots are migrated; rebuild and reset/recapture.

The helper exposes `planningEncode`, `planningDecode`, `planningJson`, `serializePlanningEnvelope`, `parsePlanningEnvelope` and `assertPlanningEqual`. The latter returns normally only on equal DTO values or throws `PlanningDataError` with `code`, JSON-pointer `path`, and bounded expected/actual details. Runtime/context/fingerprint mismatches have distinct codes. The core/host preserve structured error diagnostics on unsupported results instead of discarding them. Logs report first differing fields, not whole privileged snapshots.

## Safety metric

`stepForPlanning()` temporarily observes assignments to the isolated player's own health property while ordinary `step()` runs. Every downward assignment contributes to `healthLoss`; healing does not cancel preceding losses. The original property descriptor, with final health, is restored in `finally`. The ordinary live step is untouched.

This is **gross health decrease**, not an audited engine-native damage-event stream. It conservatively includes health costs and downward clamps. It does not measure shield absorption, equipment wear, keys, status effects, or delayed damage after the final action. An inherited, accessor, frozen, nonnumeric, or replaced health descriptor, nonfinite writes, or a replaced player object makes the transition unsupported. There is no net-HP fallback.

The Turnarchist host fixes policy to `zero-gross-health-loss-v1`; losing or terminal branches are discarded. A final action may reach the goal exactly at the environment decision budget, but a truncated branch cannot be expanded. Other truncation reasons fail closed.

## Result semantics

Successful core results include `schemaVersion`, `plannerVersion`, `namespace`, `status`, `stopReason`, `policy`, `options`, `solutionOptimal`, `plan`, `prefix`, `guarantee`, and `stats`. Host adds `assistance: 'privileged-oracle-advisory'`, goal, origin, context, and startup/restore/step/capture timings. Early host failures return a smaller envelope with null plan/prefix/stats; consumers must branch on status, not assume stats exist.

| Status | Interpretation |
|---|---|
| `GOAL_REACHED` | A simulated acceptable sequence reaches the goal. Inspect stopReason/solutionOptimal. |
| `SAFE_PREFIX_FOUND` | Horizon reached; a tested prefix exists, but the goal was not found. |
| `NO_SOLUTION_WITHIN_HORIZON` | Search found no goal under its action set and horizon; not a global impossibility proof. |
| `SEARCH_BUDGET_EXHAUSTED` | Compute/accounted-memory or environment action budget stopped search. May carry a prefix. |
| `SIMULATION_UNSUPPORTED` | Missing methods/metrics, divergence, unknown decision state, timeout, or other simulation failure. No plan/prefix. |
| `CANCELLED` | Aborted query. No plan/prefix. |
| `INVALID_REQUEST` / `BUSY` | Host validation failure / another operation owns the simulator. |

If a goal was generated before a compute cutoff, the result can be GOAL_REACHED with a budget stopReason and `solutionOptimal: false`. An unsupported transition never converts an earlier candidate into a success. Plans contain actions, per-action loss/turn deltas, decision count, total world turns and health loss, reachedGoal, and a terminal-position summary; no huge continuation snapshots are sent to the model. The `terminal` summary field is a final-state description, not a claim that the episode ended.

No prefix guarantees safety beyond its last simulated decision. A goal-reaching plan is optimal only when the admissible search has established that result within the supplied action set/objective and no cutoff undermines it. Position/phase-only blacklist caches or persistent horizon-failure labels must not be added.

## Experiment extension seam

The generic core accepts `{ root, adapter, goal, options, policy?, signal? }`. Required adapter fields: nonempty namespace and functions key(state), actions(state,goal), step(state,action,context), isGoal(state,goal,transition). `context` includes signal/deadline. Optional: estimateBytes, describe, heuristic, heuristicAdmissible, rankFrontier, abort. Callers own immutable JSON-compatible states; do not mutate parents. `isGoal` must return boolean, byte estimates nonnegative integers, heuristics/ranks finite, and named policy accepts() a synchronous boolean.

Edges are `{ kind: 'ok', state, healthLoss, turnDelta, terminal, truncated, truncationReason }`, or `{ kind: 'rejected'|'unsupported', reason }`. The namespace must change when rules, state schema or adapter semantics change. Keys must preserve all distinctions affecting transitions, goal, policy and future cost. All supplied edges use unit decision cost. Richer costs require a separate tested search/label strategy, not merely a new policy that hides resource tradeoffs.

Keep alternate adapters/policies in separate modules and run the existing tests plus experiment-specific differential fixtures. No mutation of PPO action records, learned observations, rewards, or existing episode control is authorized by this packet.

## Repair/application and validation tooling

The v1.2 packet's `apply.cjs` upgrades an already-applied v1.1 installation using receipt-verified three-way baselines. It preserves nonconflicting local edits, including the TypeScript 4.9 Wire cast. Overlapping local ID work creates an external review bundle and makes no checkout writes until explicitly resolved. It verifies payload/base hashes and records durable preimages before writing. It does not edit package.json, tsconfig, or lockfiles; the earlier watcher correction remains in place. Apply only the new packet, not a rollback/reapplication of prior packets. See `00_APPLY_WITH_CODEX.md` and `03_RECOVERY.md` in the packet for exact commands.

`horizon-tests.cjs` compiles the exact inserted continuation methods with a synthetic engine fixture. Its temporary config isolates ambient types and retains source checking. The full repository is separately checked with the installed TypeScript and `--noEmit --incremental false --skipLibCheck`. The standalone suite is not full-game compilation.

`horizon-validate.cjs` checks the Node engine contract, unit suite, full project sources, bundle markers/timestamps, Python/browser setup, four actual-game smoke cases and final diff evidence. All steps have local log files; the report distinguishes PASS/BLOCKED/BROWSER_ONLY_CHECKED. `--bootstrap` and `--rebuild` are explicit operations. No LLM/API calls or training are started by these tools.

Each real-browser case uses fresh browser storage and records capability, diagnostic special-value paths, root/continuation parity, direct versus restored actions, returned-plan replay, budget/cancellation results and unchanged live state. Failure retains phase and error. INCONCLUSIVE fixture coverage is not accepted as pass. The separate packet-only browser identity fixture exercises the compiled diagnostic lifecycle across two browser realms, including allocator provenance; it explicitly does not load the full Turnarchist game.

## Diagnostic reconstruction in v1.2

See `03_REPAIR_V12.md` for the exact origin/frontier allocator contract. Diagnostic resets record a read-only pre-construction allocator checkpoint; isolated replay restores it at the same construction boundary and checks both the original fingerprint and the replayed frontier. Standard Save V2 uses `reconstruction: null` and never restores an allocator origin. ID allocation APIs and envelope validation are independently testable. No equality fields are removed. The coordinator now embeds all four case results and emits self-contained failure evidence.
