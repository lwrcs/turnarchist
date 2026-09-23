# Horizon v1.2 status note

Phase-one integration repair now records diagnostic allocator provenance and verifies replayed allocator state, rather than assuming seed+actions determine process-local IDs. Standard seeds 1/2 passed in the user's v1.1 run; v1.2's actual-game acceptance remains the full local gate. See `03_REPAIR_V12.md` for scope. No later implementation phase is included.

# Horizon: implementation roadmap

**Design date:** September 21, 2026. **Delivered:** phase 1 plus repairs through v1.2; later phases remain plans.

## Objective and invariants

Give a learned agent a reusable planning service: it selects an explicit goal; the service searches simulated futures and returns a plan, a bounded prefix, or an honest failure/cutoff. Search distinct decision-relevant states, not paths or coordinates alone. Reaching a tile at a different hazard phase, with different enemy intent, resources or RNG, is a different state unless equivalence has been demonstrated.

Phase 1 optimizes the number of **decisions**, not distance or elapsed world turns. A zero-world-turn action still uses one decision. No synthetic Wait is introduced. Search backtracking restores an isolated snapshot; it does not move the visible player backward. Actually walking backward remains a legal candidate when it changes timing.

Never equate a missing solution inside a horizon or compute budget with global impossibility. Never infer an empty room is mechanically static from enemy count alone. Never let privileged snapshots silently become learner inputs. Never substitute an oracle action into PPO as though the original policy sampled it.

## Module boundaries

| Component | Responsibility | Swappable independently |
|---|---|---|
| Search core | Queue, duplicate detection, budgets, cache, status and metrics | Search strategy and admissible guidance |
| Game adapter | Legal candidate enumeration and authoritative transition execution | Browser snapshots, compact simulator, phase graph |
| State identity | Encode future-relevant state under an explicit version | Conservative serialized identity; later certified reductions |
| Objective | Decide whether a position or transition satisfies the request | Navigation, interaction, combat, strategic goals |
| Safety policy | Admit/reject edges using complete transition metrics | Zero health loss; later constrained resource tradeoffs |
| Frontier evaluator | Rank unresolved safe prefixes | Distance, tactical evaluator, learned value |
| Controller | Choose goals and explicitly execute/revalidate plans | Human, scripted, learned policy; not phase 1 |
| Teacher/data boundary | Export versioned demonstrations without information leakage | Offline imitation, expert iteration; not phase 1 |

Maintain namespace/version separation between transition caches, goal-dependent values and controller history. Cache mechanics only under matching rules/settings/state representation. A navigation “visited tile” penalty is not a tactical transposition key.

## Phase 1 — trusted bounded navigation oracle

**Delivered:** a pure bounded search module, real-API browser adapter, privileged continuation envelope, isolated gross-health-loss measurement, reversible application, tests and a fresh-profile browser smoke runner.

The browser adapter searches the current room, with position goals or one explicit exit transition. Four directional actions are authoritative engine inputs, so they may walk, attack, push or interact. It handles supported ladder/dismissal decisions through real actions, not invented waits. It does not enumerate spells, purchases, inventory actions or arbitrary selection menus. A result is relative to this action subset.

Every branch uses the actual engine, including enemies and hazards. There is no empty-room shortcut yet. The tool never executes a visible action and does not wire itself into the existing preview ranking or training loop. The default is zero gross health decrease, not a universal game-playing objective. Keys, equipment durability and other resources may still change during real directional interactions.

State identity is deliberately conservative: the complete serialized continuation payload, including runtime counters, RNG-bearing inner snapshot, metadata and diagnostic history. This can miss many valid merges. It does not invent state equivalence based on a small fingerprint or position. The core's compact synthetic-state tests demonstrate deduplication; they do not claim that the current Save V2 adapter already achieves phase-graph efficiency.

**Exit gate:** all packet tests, full-repository typecheck and real-browser standard/sandbox parity tests pass. Add real trap timing, spawn-on-interaction and door/ladder fixtures before using this as a dataset oracle. Record Git identity, rule contract and budgets with benchmark results. A build/runtime dependency or unsupported state is a blocked gate, not a gameplay defeat.

### Phase 1 repair gate — preserve data before optimizing

Repair v1.1 separates the diagnostic-value wire codec from the game's existing save format. All diagnostic containers are tagged, preserving optional values and numeric sentinels without weakening finite player-health/runtime validation. Versioned capability negotiation detects stale/mixed bundles; field-level errors distinguish unsupported data from actual restore divergence. Contract fixtures must retain raw diagnostic values rather than JSON-normalizing them before tests. The browser suite now replays the returned plan and emits failure-phase evidence.

Do not equate fixing this wrapper with proving Save V2 complete for every state. Close actual-game continuation parity first. Promote each newly discovered serializer/state omission into a deterministic regression corpus. Keep dataset production disabled until relevant trap, spawn, transition and resource fixtures pass. A future compact backend must satisfy this same adapter/metric contract before performance comparisons count.

## Phase 2 — speed and certified simple-room planning

First profile startup, restoration, stepping, observation construction and snapshot capture. Compare useful solved goals per unit of compute, not only previews per second. Current Save V2 capture/reload and sandbox replay may dominate; do not optimize neural inference before measuring those costs.

Build a compact, versioned simulation-state backend with shared immutable geometry and explicit mutable gameplay data. Include RNG, enemy phases, projectiles and pending spawns, status timers, interaction state, doors, movable objects and relevant resources. Keep ordinary save compatibility separate from complete simulation checkpoint semantics. Test direct two-/multi-action execution against capture→restore continuation after each action. Canonicalize only fields demonstrated irrelevant to transitions and the objective. Never strip all timestamps, counters or entity IDs by name alone.

Once correctness is established, add three automatically selected modes:

* **Static certified room:** ordinary pathfinding; route validation and event boundaries remain authoritative. Absence of enemies is insufficient certification.
* **Scheduled certified room:** position plus an adequate hazard-clock state. Derive the schedule from mechanics, including per-trap offsets. Include additional changing effects or decline compression. No free waiting assumption.
* **General state:** full simulator fallback before an interaction can spawn enemies, alter geometry or change the validity of the simple-room certificate.

A hypothetical 400-tile room with one sufficient four-phase clock has at most 1,600 position/phase pairs. That is an illustration of state compression, not a measurement or an asserted Turnarchist turn period. Safe-interval planning becomes interesting for long, irregular safe windows; a small explicit phase graph is simpler initially.

Add root advancement and subtree reuse only after the actual successor matches the predicted one under the same state contract. Invalidate on resets, rules/settings changes, unmodelled effects or mismatches. Keep bounded caches and expose hit rate/eviction metrics. Apply/undo is an optional later backend, not a reason to omit callbacks, RNG or object lifecycle from restoration.

**Exit gate:** parity across a diverse fixed-seed suite, no live-state drift, measured speed/memory improvements, identical solved/unsolved results versus the trusted backend within matching budgets. Benchmark simplified-state reductions separately from faster implementation of the same state graph.

## Phase 3 — tactical objectives and resource tradeoffs

Add richer legal actions and explicit interaction/combat objectives. Replace the binary zero-loss constraint only through named, versioned policies. Suitable modes include strict no-loss, capped health cost, constrained survival/resources, or lexicographic priorities. Do not hide a health/time/resource exchange rate inside an unexplained score.

Keep gross health loss, healing, shield consumption, consumables, durability and currency changes separate. The phase-1 health write observer is isolated diagnostic instrumentation; an engine-native event/metric provider should replace it once coverage is audited. Missing metric coverage must stay unknown.

If optimizing a cost other than decisions while retaining an action horizon, use nondominated labels such as `(decisions used, health cost, resource state, path cost)`. A cheaper arrival can have too little remaining horizon, so a single “lowest scalar cost” entry is then insufficient.

Add event-aware horizon extensions near unresolved attacks/spawns/trap events, but bound the extra work. A safe prefix is not proof its terminal position remains recoverable. Keep the original destination in frontier evaluation so short horizons do not reward aimless local safety. Adaptive budgeting should be evaluated for decision improvement, not just longer computation.

**Exit gate:** damage-necessary escapes, cheap-damage/expensive-consumable alternatives, delayed-loss traps, pushed entities, spawn interactions and different horizons have explicit regression cases. Compare against zero-loss navigation and one-step previews under equal simulation budgets.

## Phase 4 — teacher, student and execution integration

Keep three modes distinct: advisory oracle, explicitly assisted controller, and unaided learned policy. Save the assistance mode in every evaluation result. Begin with offline demonstrations and model/search disagreement states. Preserve multiple equally good first actions rather than declaring every unselected action wrong.

Dataset records should contain learner-legal observation/history, goal, permitted teacher information, search configuration, result/cutoff, chosen action(s), realized transitions, contract/Git identity and verified outcome. Keep full snapshots and oracle diagnostics in separate privileged artifacts. A student cannot be assumed to reproduce a choice that depends on information it does not observe.

For multi-action commands, define reward accumulation, duration and discounting explicitly. For PPO, do not silently replace sampled actions; use a consistent behavior policy/training method or separate offline imitation. Evaluate the student without the oracle separately from the assisted system. Separate scenario/layout variation from repeated seeds or rotated views of one fixed encounter.

Only then add policy/value guidance to search: retain authoritative mechanics, and learn which branches deserve attention or how to rank unresolved leaves. A learned confidence estimate controls effort; it is not a safety proof.

**Exit gate:** reproducible unaided/assisted evaluations, zero hidden-state leakage into the learner contract, valid training accounting, and improvement over scripted/search-only baselines at matched compute.

## Phase 5 — room-level solving and strategic composition

For finite manageable room graphs, compute a reachability/safety atlas by backward traversal of recorded transitions. Mark incomplete graph regions unknown. A state outside a proven goal-reachable set is not proven losing unless the relevant graph/actions were explored exhaustively.

Compile rooms into alternative entrance→exit outcomes, preserving sufficient entry/exit conditions: phase, resources, object/enemy state and persistent changes. Keep Pareto alternatives for speed, health and loot. Let a dungeon planner search these room outcomes rather than every footstep. Avoid declaring summaries reusable when their entry conditions differ.

Safety shielding can reject a move proven to destroy a specified recoverability property. “Never take damage” is not a suitable universal shield; some good plans must spend health. Explicitly define the property and what evidence constitutes a proof.

## Phase 6 — automated discovery and compute allocation

Use the solver to find minimal policy counterexamples and generate a targeted curriculum. Retain the failing state, mistake, improved continuation and nearby variations. Keep generated fixtures separate from held-out evaluations.

Compare small- and large-budget searches to train a compute allocator. Explore room symmetries only with a mechanics-preserving transformation and correctly transformed actions/state. Consider proof-carrying plans, cached tactical motifs, distributed search and exact small-encounter tablebases after state identity and restoration are reliable. These are separate experiments behind the adapter/objective interfaces, not prerequisites for useful navigation.

## Experiment ledger and stop rules

For each experiment record code/rule/state-key versions, scenario/seed/layout identity, assistance mode, action subset, goal, budgets, solved goals, decisions/world turns, gross health/resource costs, simulations, distinct states, merges/cache hits, retained memory estimate, timings and mismatches. Compare at equal compute and keep cutoff/unsupported/death categories separate.

Stop an experiment on live mutation, restoration mismatch, unexplained nondeterminism, missing metric coverage or contract drift. Never convert infrastructure failure into a death reward or a proof of no solution. Do not modify the code used by an active training run.

## Source baseline

Repair v1.1 rechecked upstream `master` at `7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb` through GitHub, including the agent environment, fingerprint producer, contract/settings, package scripts and repository build instructions. The reported local HEAD `129f49f7854896ffde2ce3fbfb8a0aebdbaa8461` was not available remotely; working-tree compatibility is checked by the installer, without pulling/rebasing. See the v1.2 packet's `02_VALIDATION.md` for local test evidence and remaining actual-game gates. No full-game performance results or completed later phases are claimed.

## Allocator optimization seam after parity

The isolated allocator memento is now versioned and separate from search. Measure repeated registry copies before optimizing; a tested origin-plus-delta encoding can reduce repeated data without omitting collision reservations. Such a change must preserve allocation transcripts and continuation parity before enabling state/cache compression.
