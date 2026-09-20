# Deterministic lookahead and strategic intent plan

## Decision

Build a privileged deterministic simulator around Save V2, then use it for
bounded tactical lookahead. Keep Jev above that layer as a persistent strategic
goal selector. The game engine remains authoritative for legality, damage,
enemy turns, interactions, RNG, and transitions.

This divides responsibility cleanly:

```text
game rules and branch simulator -> exact action consequences
local bounded planner           -> routine tactical action
persistent intent stack         -> what the agent is trying to accomplish
Jev                              -> rare strategic choices and goal changes
learned policy                  -> improves within the same contracts over time
```

Terra should implement the phases below in order. Later phases depend on the
acceptance checks of earlier phases.

## Save and RNG audit verdict

The current save system is a credible base for branch simulation:

- Save V2 stores `Random.state` in `worldSpec.rngState`.
- Load V2 restores that state after world generation and object reconstruction.
- The fingerprint system includes RNG, player, room, entity, item, and tile
  state.
- The roundtrip validator already compares fingerprints before and after a
  save/load cycle.
- Replay state, stats, encountered enemies, visited sidepaths, inventory, and
  generated room state are included in the existing save/load path.

The audit does **not** yet prove that every arbitrary tactical state can be
forked safely. The remaining risks are:

1. `Random` and several other services are process-global statics. Two games in
   the same JavaScript realm can contaminate one another.
2. Gameplay uses asynchronous callbacks and animation/input locks. A snapshot
   taken before an action fully settles can omit a consequential callback.
3. A few `Math.random` uses remain and must be classified as cosmetic or moved
   to seeded RNG if they affect gameplay.
4. Save roundtrip equality is weaker than branch equality. We must prove that a
   simulated branch matches the live game and does not mutate it.
5. Unsupported modal interactions or transient states must fail closed rather
   than return a misleading forecast.

Do not implement lookahead by saving, acting, and restoring the visible game.
That approach can leak callbacks, global state, UI state, replay events, or
statistics across branches.

## Phase 0: certify the snapshot boundary

Extend the existing save validation rather than creating a second serializer.

### Required tests

1. **Roundtrip at tactical states**: capture, load, and compare fingerprints in
   ordinary movement, combat, a boss room, a sidepath, inventory interaction,
   vending, a ladder prompt, and after a zero-turn action.
2. **Identical fork**: load the same snapshot twice and execute the same action.
   Both outcome summaries and final fingerprints must match, including RNG.
3. **Branch-order independence**: evaluating candidate A then B must give the
   same result for B as evaluating B first, because each branch reloads the
   original snapshot.
4. **Live parity**: a simulated action and the same action taken from the same
   snapshot in a disposable visible game must settle to the same fingerprint.
5. **No live mutation**: any number of branch evaluations must leave the live
   fingerprint, RNG state, replay state, and stats unchanged.
6. **Asynchronous cases**: explicitly cover fishing, bombs, spells, spawn
   particles, pushing and chain-pushing, enemy death callbacks, ladder travel,
   menu confirmation, giant footprints, spikes, and killing the source of a
   warning before it attacks.

### Audit rule

Search every gameplay-reachable `Math.random` and `setTimeout`. Classify each as
cosmetic, captured-and-settled, or unsupported. Any gameplay-affecting random
choice must use the seeded RNG. Any consequential timer must be included in the
same readiness/settling contract used by `AgentEnvironment`.

### Initial audit inventory

The first pass found the following high-signal sites:

| Site | Current assessment | Required follow-up |
| --- | --- | --- |
| Torch/candle wall placement in `playerInputHandler.ts` | Gameplay-relevant when no facing wall is available; currently selects a wall with `Math.random`. | Replace with `Random` before trusting branch parity for this interaction. |
| Sewer layout size in `levelProgressionConfig.ts` | Safe only when generation always supplies its seeded `rand` callback. | Add a generator-level regression test; do not rely on the fallback `Math.random` during a simulation branch. |
| Key-path and sidepath logging | Cosmetic logging sample only. | No simulation impact. |
| Particles, beam jitter, damage numbers, sound selection | Cosmetic. | Exclude from fingerprints and branch scoring. |
| Fishing completion | Gameplay-relevant timer, but it holds `player.busyAnimating` until its callback resolves. | Verify a branch waits through the same readiness boundary before capture. |
| Bomb, warhammer, giant-enemy shake timers | The observed callbacks are camera/visual effects after gameplay resolution. | Confirm during live-parity tests; they must not be used as a branch-settle signal. |

This is a triage list, not a claim that every timer has been certified. The
full Phase 0 suite is still required before enabling automated lookahead.

### Exit criterion

All curated fork tests pass repeatedly. Unsupported states return a typed
`unsupported` result with a reason; they never return a guessed outcome.

## Phase 1: one-action branch simulator

Create one reusable hidden browser realm, such as a hidden iframe. It has its
own module globals, RNG state, event handlers, and game instance. Do not create
a fresh browser realm for every candidate; reset the reusable realm from the
base snapshot before every branch.

The simulator belongs behind a narrow browser-facing diagnostic API from the
start. `window.agent` can expose a read-only `simulate(...)` operation in the
teaching/developer surface, while ordinary play keeps it hidden. That preserves
the option to turn it into a player-facing "what happens if I do this?" teaching
tool later: the player UI can request candidate outcomes, render its own advice,
and still execute only through the regular action processor. The simulator must
never become a second input path or silently alter the player run.

Suggested modules:

- `src/game/agentSimulation.ts`: privileged realm lifecycle, snapshot loading,
  action execution, settling, and failure isolation.
- `src/game/agentOutcome.ts`: stable outcome schema and before/after diffing.
- `src/game/agentEnvironment.ts`: narrow privileged entry point. Do not expose
  raw saves or arbitrary state mutation to the learned policy.

Suggested request:

```ts
interface SimulationRequest {
  snapshot: SaveV2;
  actions: AgentAction[];
  maxActions: number;
}
```

Suggested response:

```ts
interface SimulationOutcome {
  status: "settled" | "terminated" | "invalid" | "unsupported" | "timeout";
  actionsExecuted: number;
  rngBefore: number;
  rngAfter: number;
  beforeHash: string;
  afterHash: string;
  playerDelta: {
    health: number;
    mana: number;
    coins: number;
    turnCount: number;
    positionChanged: boolean;
    roomChanged: boolean;
    depthChanged: boolean;
  };
  enemiesKilled: string[];
  enemiesDamaged: string[];
  entitiesSpawned: string[];
  itemsGained: string[];
  itemsLost: string[];
  threatsBefore: number;
  threatsAfter: number;
  transition: null | "room" | "sidepath" | "floor" | "death";
  reason?: string;
}
```

Use stable entity/contact IDs in summaries. Keep raw hidden state internal.

The simulator must use the normal action processor and the same readiness check
as real agent play. A player action represents the full consequence through the
next settled player decision point, including deterministic enemy responses.
That means this is not a separate enemy minimax turn.

### Exit criterion

The environment can evaluate every currently legal action from one state and
return exact, repeatable one-action consequences without changing the live run.

## Phase 2: deterministic candidate builder and tactical planner

### Current implementation boundary

The browser host now implements the Phase 2 foundation for one-action
branches: it builds legal directional candidates from the privileged operator
view, restores the same captured snapshot before every candidate, records each
settled outcome, and ranks them lexicographically by survival, health loss,
remaining threats, no-effect inputs, threat reduction, and movement progress.
It excludes locked ladders and empty solid-wall bumps while retaining normal
interactions with entities embedded in solid tiles.

The Jev collection loop uses this evaluator first when it detects an
enemy-free navigation loop. It selects only a branch that actually changes
position, causes no health loss, and exits both the repeated positions and an
immediate reversal. Jev remains the fallback when no such exact branch exists.
The public Agent Lab exposes the same primitive through **Preview legal
actions**, so the result is inspectable and can later serve a player teaching
view.

This is intentionally not yet a general multi-turn planner. Combat, forced
damage tradeoffs, persistent intents, and strategic target choice still need
the later phases below before they control the trainer.

The candidate builder owns mechanics that do not require judgment:

- enumerate legal actions and interactions;
- remove empty solid-wall inputs while preserving interactions with entities on
  solid tiles;
- suppress locked ladder traversal when its requirement is unmet;
- include fishing spots and other interactable entities on solid tiles;
- supply A* routes and distances;
- detect active or next-turn spike danger;
- detect repeated states and failed interactions;
- include zero-turn inventory/equipment actions without imposing an arbitrary
  per-turn cap.

Evaluate legal candidates at depth one first. Score outcomes lexicographically:

1. avoid death or irreversible failure;
2. avoid forced damage, accounting for threats neutralized by the action;
3. advance the active intent and its success condition;
4. remove or reduce threats, especially spawners and lethal attackers;
5. improve resources, equipment, spacing, and route access;
6. avoid recently repeated state/action transitions.

Do not assign infinite cost to damage. Sometimes taking 0.5 spike damage,
tanking one reduced hit, or moving through a warning is the correct line.
Executed outcomes supply the tradeoff instead of a blanket rule.

Deepen selectively when the top outcomes are close, danger is high, or the
one-action result leaves a forced threat. Start with beam width 3, depth 3, and
strict node/time budgets. Cache branches by snapshot hash plus action sequence.
Log why search deepened and which branch won.

### Exit criterion

On curated encounters, the planner correctly handles warning-source kills,
durable forward-only enemies, spikes, push kills, spawner pressure, and safe
navigation without a Jev call.

## Phase 3: persistent intent stack

Replace turn-by-turn motivation selection with goals that persist until their
explicit completion, failure, or invalidation.

```text
base goal:          explore or progress
strategic override: prepare, gather food, acquire key/item
tactical interrupt: fight, evade, retreat
safety interrupt:   escape immediate lethal consequence
```

Each intent frame must contain:

- stable ID and type;
- objective and target, when applicable;
- success condition;
- blocked/abandon condition;
- resume policy;
- evidence that created it;
- creation step and cooldown;
- parent intent ID.

Example:

```text
progress to floor boss
  -> prepare until edible healing >= target
      -> evade nearby sewer enemy
      -> resume prepare
  -> resume progress
```

Combat does not erase `prepare`; it temporarily interrupts it. Entering a
sidepath does not cause the agent to reconsider its purpose every turn. A ladder
loop or repeated unchanged state invalidates the current route, not the entire
goal.

### Exit criterion

The viewer shows the full intent stack and transition reason. Prepare persists
through sewer navigation, fishing, incidental combat, and return travel until
its resource threshold is met or the goal is proven blocked.

## Phase 4: move Jev to strategic event boundaries

Jev should choose among code-defined strategic alternatives. It should not pick
ordinary movement, avoid obvious warnings, steer A*, execute fishing, or manage
routine one-turn combat.

Call Jev only when:

- a base goal completes or becomes blocked;
- the agent must choose whether and how much to prepare;
- a high-value strategic tradeoff remains close after simulation;
- repeated route failure changes the available strategic evidence;
- a dangerous encounter remains ambiguous after bounded search;
- equipment/weapon choice has lasting strategic consequences and code cannot
  rank the simulated outcomes decisively.

Every Jev result must select a goal from a closed set and provide success and
abandon conditions. Cache it by a strategic-state hash and invalidate it only
after a material event. Target roughly 1-5 Jev calls per floor initially, then
measure calls per room, dollars per floor, and progress gained per call.

Retire Jev-based one-move unsticking once deterministic repetition detection is
active. Retire fixed multi-action combat commitments once bounded simulation is
trusted. Keep the current baseline as a fallback for simulator failures and
unsupported states.

### Exit criterion

Jev cost falls substantially while motivation becomes more stable. Routine
movement and combat proceed with zero Jev calls; strategic decisions remain
visible and auditable in the viewer.

## Phase 5: training integration

Record, for every decision:

- base observation and compatibility/version contract;
- legal candidates;
- one-action outcomes and any deeper branch summaries;
- active intent stack;
- baseline, planner, Jev, model, and final executed choices;
- controller/model version and confidence;
- override, rejection, or fallback reason;
- whether the label came from human, deterministic search, Jev, or policy.

Use successful planner decisions as assisted teacher labels, but keep their
provenance distinct from human demonstrations. Train auxiliary targets for
intent, threat priority, and outcome value. The learned policy can gradually
replace expensive search where held-out evaluation proves parity, while the
simulator remains the safety and evaluation oracle.

## Viewer requirements

Display:

- active intent stack and the reason for its latest transition;
- current controller (`baseline`, `planner`, `Jev`, `model`, `human`);
- candidates with one-action health, threat, kill, transition, and goal deltas;
- search depth, nodes, cache hits, and elapsed time;
- Jev calls and estimated cost for the episode;
- typed simulator failures or unsupported states;
- repetition detector state and route invalidations.

## Implementation order for Terra

1. Add Phase 0 tests and classify random/timer sites. Fix only failures that
   affect branch fidelity.
2. Implement the reusable isolated realm and one-action API.
3. Add outcome summaries and live-parity tests.
4. Route current danger preview through executed one-action outcomes while
   retaining the old preview as fallback.
5. Add depth-one selection, then bounded depth-three search.
6. Add the intent stack and viewer telemetry.
7. Restrict Jev to strategic event boundaries and add strategic caching.
8. Run fixed held-out seeds plus adversarial tactical scenarios before enabling
   planner-generated training labels.

Do not combine these into one large change. Each phase should be independently
reviewable and should preserve the ordinary player game, replay behavior, and
existing training data formats unless a versioned migration is included.
