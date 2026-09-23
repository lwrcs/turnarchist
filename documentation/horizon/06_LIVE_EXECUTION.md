# Horizon Live v0.1 — bounded, opt-in execution

## Scope and sequencing

This stage adds the requested live controller/viewer ahead of the roadmap's compact-state optimizations. It is a **privileged-oracle-assisted controller**, not a trained policy, a PPO modification, or completion of the later roadmap phases. The user's latest reported actual-game pass covers the dedicated planner smoke on **standard seed 1**. It is not evidence that every seed/scenario or the new live controller passes.

The dedicated entry is `horizon-live.html`, served from the existing checkout. It embeds `play.html?agent=1`, **without** `simulator=1`, and owns a separate hidden planning simulator. It never imports into `agent.html`, ordinary evaluation, or training. No run starts on page load. Initialize deliberately creates/resets a dedicated game. Run, One verified action, and Stop are explicit controls. The iframe is a read-only viewer: an input shield, `inert`, and disabled pointer/focus input keep manual play out of this execution session.

## Modules

| Module | Responsibility |
|---|---|
| `agent-horizon-core.js` | Existing bounded search and zero-loss policy. Unchanged. |
| `agent-horizon-host.js` | Existing `plan()` plus additive `planForExecution()`, retaining evaluated first-edge evidence. |
| `agent-horizon-controller.js` | Ownership, explicit goals, query/execute loop, budgets, cancellation, invalidation, verification, bounded diagnostics. |
| `agent-horizon-goals.js` | Swappable deterministic spatial goal selector; does not choose executable actions or certify safety. |
| `AgentEnvironment.inspectHorizonRoom()` | Read-only tile/traversal/occupancy facts without `inspectOperator()`'s repeated POI A* queries. |
| `AgentEnvironment.stepForHorizon()` | Opt-in instrumentation around **ordinary `step()`**, with a final dispatch-time guard. |
| `horizon-live.html`, CSS and viewer JS | Visible ordinary game, explicit/manual goal map, counters, trace and JSON export. |
| `training/horizon-live-smoke.js`, `horizon_live_smoke.py` | Additional real-game live-execution gate using the existing independent process supervisor. |

The existing snapshot codec, snapshot **v3**, allocator, fingerprint comparisons, simulation-only restore/step APIs, ordinary evaluator and action processor remain intact. Existing `plan()` results do not acquire execution tokens or change assistance labels.

## Exact loop contract

1. Acquire an exclusive controller lease for the source agent. Initialization, budget extension and training are not implicit loop operations.
2. Select an explicit position or exit goal in the current room, or retain the current goal. Manual goals remain fixed after ordinary state invalidations; leaving their origin without satisfying them stops rather than silently selecting an automatic goal.
3. Capture source identity, the **complete existing lossless guard**, and `Host.viewIdentity`. Request `planForExecution(goal, options, {signal})`.
4. Accept only `GOAL_REACHED` with a valid plan, or `SAFE_PREFIX_FOUND`, `SEARCH_BUDGET_EXHAUSTED`, or `NO_SOLUTION_WITHIN_HORIZON` with a nonempty, fully evaluated safe prefix. Every action/step must agree; every gross-loss metric must be present and exactly zero. Missing evidence, unknown statuses, unsupported simulation and cancellation never authorize movement.
5. Match the returned first action to its first-edge witness: root guard, root observation identity, exact action, zero gross loss, turn delta, and predicted successor guard/observation. Evidence comes from the actual evaluated root edge; it requires **no additional simulation/replay**.
6. Recheck cancellation, source/build/episode and the complete root state. Submit **one** action to `stepForHorizon`, which wraps the same ordinary `step()` used elsewhere. No synthetic Wait, raw position assignment, simulator snapshot restoration into the live world, hidden retry or replay of a planned suffix is permitted.
7. Inside ordinary `step()`, after settling and ordinary validation, and immediately before its existing action processor, recheck the permit's player reference, guard, observation, cancellation and remaining dispatch deadline. Rejection uses the existing non-poisoning action-rejection mechanism. Ordinary calls without a permit follow their previous path.
8. Await the admitted action, including after a stop request. Count **every downward live health assignment**, not net HP. Compare recording/termination/turn metrics and both full successor identities with the witness. On parity, retain small telemetry and discard the suffix. Replan from the actual new state.

The first-edge witness is an internal same-origin interface, **not a cryptographic authorization scheme or a sandbox for untrusted code**. A caller with arbitrary access to the game can already change it. `stepForHorizon` enforces the precondition/measurement boundary; the controller checks that the planner actually supplied the safety evidence.

## Bounds and efficiency

Default controller budgets: 16 settled action calls, 32 planner queries, 4,096 total simulations, 60,000 ms elapsed, 4 state invalidations, 3 failed goals, and 8 consecutive actions without geometric progress toward the current goal. A stopped run makes no claim of global impossibility. Timing-adjustment moves are legal; bounded stagnation is an operational cutoff, not a change to game rules.

Default query settings are explicit: depth 5, 128 simulations, 128 expanded states, 512 retained nodes, a 2,000 ms core search cutoff, and the existing optional `adapter` heuristic. These are **controller-specific settings**; existing search defaults, host operation timeout, and ordinary evaluation limits are not changed. Remaining session simulations cap each query. Missing statistics consume the requested query allowance conservatively.

For execution queries, one quarter of the requested `maxBytes`, capped at 8 MiB, is reserved for first-edge evidence; the remainder goes to the unchanged core search. Evidence allocation exceeding this budget fails closed. Accounting is conservative string/state accounting, not a hard JavaScript heap limit. Ordinary advisory queries do not allocate this evidence or reserve this memory. Snapshot guards/observations already required by the host are reused; only first-edge evidence is returned, not an entire state tree.

The default 120 ms interval allows watching ordinary animations. Session/dispatch deadlines are checked after synchronous work as well as by timers. JavaScript cannot preempt an infinite same-thread function; hard renderer-failure supervision remains in the external validation runner. Custom synchronous goal selectors must be bounded. No controller should share its planner instance with an unrelated active consumer; the default constructs a dedicated one.

## Goals

The default selector uses bounded spatial BFS, not action previews: at most 2,048 expanded positions, local waypoint radius 5. It prefers less-visited choices, then accessible traversal routes, and otherwise selects a nearby waypoint. Longer known routes are reduced to an explicit local waypoint. It does not route through an exit into an unobserved room. Occupied cells are treated as spatial blockers for this automatic navigation heuristic; manual goals may still lead the real planner to attack/interact through ordinary directional actions.

This selector is not a dungeon-solving policy and cannot establish that a goal is safe or impossible. Hazards, enemies, interaction spawns, timing and resources remain the simulator's responsibility. A collider/trap does not get a cheap safety exemption. Tile visitation is controller history only, **never** a replacement for the planner's state key. Failed-goal exclusions are cleared after a verified state advance or invalidation; failure at one hazard phase does not permanently blacklist a tile.

Swap the synchronous selector via `create({selector})`. It receives detached `view`, `geometry`, bounded-run `visits`, and `excluded` goal keys, returning `{goal,label}` or null. Supply a manual goal to `start({goal})` to bypass automatic selection. Non-world supported decisions are handled by the existing planner action subset; there is no new buying, spell, equipment or free-wait action.

## API

Load base simulation host, Horizon core/host, goals, and controller in that order.

```js
const source = () => document.getElementById('game').contentWindow.agent;
const controller = AgentHorizonController.create({
  source,
  options: { maxActions: 16, intervalMs: 120 },
  planOptions: { maxDepth: 5, maxSimulations: 128 },
  onEvent(report, event) { /* detached, bounded diagnostics; no snapshot tokens */ }
});
await controller.start(); // explicit local-goal loop on an already initialized dedicated game
// Alternatives: start({goal: {kind:'position',roomId,x,y,z}}), start({singleAction:true})
controller.stop('operator-stop');
const report = controller.snapshot();
controller.dispose();
```

`start()` refuses reentrancy or another controller's lease. One verified action is an action cap, not an entire plan. Controller options are validated; unknown fields and unbounded/invalid time settings are rejected. An observer callback cannot alter internal report objects; exceptions in observers are isolated. No model/API calls are introduced.

Host addition: `planForExecution(goal, options, {signal})`. A nonempty returned sequence has `execution` with schema 1, source `horizon-first-edge-v1`, metric `gross-health-decrease-v1`, exact action/turn delta/zero loss, rootGuard/rootView and afterGuard/afterView strings. These are privileged, potentially large values: do not place them in learner observations or persistent viewer traces.

Engine addition: `stepForHorizon(action,{guard,view,signal?,maxDispatchDelayMs?})`. Live-only. `getHorizonExecutionCapabilities()` reports version 1, ordinary-agent-step mode, dispatch-guard-v1, and before-dispatch-or-after-settlement cancellation. The full `getPlanningCapabilities()` remains unchanged.

## Stop, invalidation and failure semantics

**Before dispatch:** stale state discards the result and replans within the invalidation/query/time limits. A changed agent object, seed/scenario reset, backwards step count or contract/settings change stops. Cancellation prevents dispatch, including cancellation during ordinary settling. No action-budget increment is manufactured for a rejected permit.

**After dispatch:** an already admitted action is not undoable. Stop prevents subsequent actions but its settlement and metric checks still run. Real health loss, missing metric coverage, player replacement, unrecorded action, turn mismatch, or successor disagreement blocks the run. Neither HP nor world state is rolled back to hide the failure. A safe simulation prediction is conditional on model/snapshot coverage; unexpected real damage can be detected only after it happens.

**Unknown live timeout or execution failure:** quarantine the controller/source lease and require a fresh frame. Do not let another controller proceed while a timed-out action might still settle. The viewer's Initialize button creates that fresh frame. A completed mismatch or safety violation is also quarantined until reset. A blocked unsupported query that never admitted an action is not a game defeat.

Reports distinguish dispatch attempts, settled actions, verified actions, queries, simulations, goals, failures, invalidations and measured action-attributed gross loss. Last transition includes source/destination player facts, recording, turn delta and parity. Post-execution mismatches preserve a bounded field-addressable diagnostic. The bounded diff is **only explanatory**; equality decisions still use complete identities. Logs retain 120 events by default, count evictions, and exclude full snapshots and guard strings. Export is a privileged diagnostic report, not a training trajectory.

## Validation and deferred work

Run the existing full coordinator without removing any cases, then the additional live smoke. The new smoke deliberately advances only its dedicated game: three witnessed ordinary actions, repeated replanning, all parity/zero-loss/counter checks, and cancellation without mutation. Default coverage is explicitly standard seed 1. Additional seeds/scenarios are separate declared coverage, not substitutions for failing ones. Its Python supervisor uses the existing 180,000/30,000 ms case/operation values and an independent worker process; no timeout escalation is included. Failures write a self-contained `.evidence.json` with selected source and bounded reports.

This stage does not implement batching, compact-state compression, guaranteed recovery past the horizon, room tablebases, learned goals, demonstrations, training or PPO action replacement. Cross-query/subtree reuse remains deferred until live parity coverage is adequate. The next useful experiment is matched-budget benchmarking of this single-edge controller across representative traps, spawns, transitions and encounter states—not increasing limits to conceal mismatches.
