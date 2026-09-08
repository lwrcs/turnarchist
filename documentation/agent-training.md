# Playtesting agent and training

Development starts on the macOS laptop. Larger simulation batches and training
will run on the Windows 10 desktop (12700K, 32 GB RAM, RTX 3080 Ti). WSL and the
training runtime are not configured or confirmed yet. Use repository-relative
paths and portable commands; the two Git clones have different absolute paths.

## Target milestone

One command runs a programmed policy across seeds and writes outcomes, failure
traces, and replay files. Reuse actual gameplay and action execution rather than
maintain a second simulator. Expose reset(seed), observe(), and step(action),
where step resolves gameplay consequences before returning. Exclude developer
commands, restart, and internal replay events from the policy's choices.

## First implementation slice

SpellBeam arrival and expiry now advance through advanceSimulationEffects(game,
delta), independently of drawing. Delta is measured in 60 Hz frames. The browser
calls this before drawing with its existing animation-speed/underwater scaling.
Arrival callbacks execute synchronously during simulation advancement; they no
longer require setTimeout. Effects created by callbacks start on the next frame.
Finished replay worlds remain frozen.

This is a prerequisite, not a complete headless interface. Room turns, movement
cooldowns, level transitions, input, and initialization still depend on browser
state or wall time. Other projectile classes still need auditing. A future driver
must own the simulation clock and finish pending gameplay before returning an
observation; merely disabling rendering is not sufficient. Validate browser and
headless traces against each other before using generated data for training.

## Browser agent interface (observations v4, actions v2)

With the local server running on port 8000, open
`http://localhost:8000/agent.html` for the agent lab. It embeds a separate game
at `play.html?agent=1`. The normal play URL still behaves as before. The lab
provides reset, movement, wait, ladder choices, observation inspection, replay
download, and a smoke check. It does not start a learned or programmed policy.

Once game resources finish loading, the agent game exposes `window.agent`:

```js
const initial = await window.agent.reset(123, { maxSteps: 1000 });
const before = window.agent.observe();
const result = await window.agent.step({ type: "Move", direction: "up" });
// result: { observation, terminated, truncated, info: { recorded, predictedTurnCost, turnDelta } }
const replayEnvelope = window.agent.exportReplay();
```

This example runs in the game frame's console. In the lab's top-level console,
use `document.getElementById('game').contentWindow.agent` instead.

Supported actions are Move (up/down/left/right), Wait, LadderConfirm,
LadderCancel, UseItem (slotIndex), UseItemOn (fromSlot/toSlot), MoveItem
(fromSlot/toSlot), DropItem (slotIndex), and SelectOption (index). Move maps to an adjacent Directional action in the real action
processor; it can attack, interact, push, or move using existing game rules.
Inventory actions use the existing action processor. Targeted tools such as the
hammer require UseItemOn; UseItem on these is rejected to avoid hidden two-click
cursor state. Invalid/empty slots and disabled menu choices are rejected without
spending an agent decision. Spellcasting and ranged targeting are not yet exposed
to the policy. A screen message requires a ladder choice when on a DownLadder;
Crafting selection menus report selection and detached selectionChoices with
index, label, enabled and turnCost. SelectOption invokes the same enabled menu
callback as a human click, including the recorded SmithRecipe action and menu
close. A raw SmithRecipe action is not accepted by the agent. Cancel closes the
menu without recording a gameplay action. Other modals report unsupported-modal. Invalid actions are rejected without
executing them. Action legality beyond these checks is decided by the game:
wall bumps consume the agent step budget but do not claim a recorded action.

Steps wait for level readiness, the computer turn, busy animation, push lock,
camera animation, and movement cooldown. Calls cannot overlap. Death is
terminated; reaching maxSteps is a resumable truncation with
`truncationReason: "action-budget"`. maxSteps counts attempted decisions, not game
turns, and there is no per-turn decision cap. Call `agent.extendBudget(1000)` to
permit another 1,000 decisions in the same run. This runner operation preserves
world state, inventory, combo phases, replay, seed, and history; it never inserts
Wait or advances enemies. The lab has the same continuation control. Reaching a
budget is incomplete evaluation, not a death or evidence of an unwinnable seed.
A future runner must resume unfinished work or report it as incomplete; a budget
pause must never trigger a forced game turn. Invalid/no-op decisions still count
to keep a stuck policy bounded. Extensions reject busy, failed, and dead runs. A timeout or execution exception
rejects the operation and marks the environment failed/truncated. Reload the
agent tab after these failures rather than resetting over potentially pending
callbacks. A normal terminal/truncated episode can be reset. Observations are
detached JSON-compatible values; ready is false during an operation or after an
budget is exhausted. Call observe only between awaited steps when collecting data.

Observations are explicitly diagnostic-current-room: tiles, entities, and ground
items include hidden information and all z layers in the current room. They do
not implement player visibility or exploration memory. Entities now expose stable
per-instance IDs (for tracking within a run), health/max health, footprint,
interaction flags, and available base combat traits. Items expose available base
damage, range, cooldown, mana cost, durability, knockback, diagonal capability,
and skill requirements. These are base stats, not final damage predictions.
Hit warnings expose target/source coordinates, source ID/layer when known, and
hostile/direction-only flags. Missing traits are null, never a fabricated zero.
Generic attack footprints, movement periods, and attack countdowns are not yet
available; their fields explicitly remain null. Runtime class names are debug
labels, not a stable model vocabulary. Do not train or score a player-like policy
on these diagnostic observations.

The last eight completed decisions include before/after tactical snapshots of
player, enemies/objects, and warnings in recentTransitions. This bounded history
is cleared by reset and supports future temporal policies; it is not a learned
memory or an automatic online weight update. It is not a full demonstration
dataset. Longer dependencies may require recurrent state or exploration memory.

Agent mode blocks DOM gameplay inputs and run-save reads, writes, and deletion,
and suppresses ordinary game-stat submissions. Settings and other local progress
stores are still shared with the browser profile; use a separate browser profile
for large experiments. No demonstration uploads are performed. Replay exports
include source/mode labels, settings, timing flags, terminal status, history, and the
existing replay payload. The replay payload is `envelope.replay`; this wrapper
is not itself the old replay file format. Exports are debugging artifacts until
replay compatibility and source-build retention are formalized.

Every observation/export contains a contract with observation/action versions,
observation mode, game version, the Webpack compilation hash, and an identity for
exposed runtime settings. The hash changes with bundled changes, including
uncommitted edits; it is not a Git revision or a changelog, and excludes resources
loaded outside the bundle. Unbundled execution reports a null build ID.
`agent.contract()` returns the current contract. Save it as `trainedOn` in future
checkpoint manifests. `agent.checkCompatibility(trainedOn)` reports incompatible
schemas/modes separately from build/settings drift and recommends evaluation for
any mismatch or unknown build. This is an advisory check; no checkpoint loader
exists yet. Matching metadata does not certify policy performance.

Validation: Node tests cover action mapping, settled enemy responses, invalid
actions, overlapping operations, wall bumps, death, budgets, timeout failure,
ladder decisions, detached outputs, and save/stat isolation. The browser smoke
check performs four cardinal moves plus a wait (verified on seeds 123 and 456), checks the replay
action count and history, verifies build/schema identity, and compares initial
player/tiles after a same-seed reset. This
does not establish deterministic full-run parity or fairness.

Next: expand the action/observation contract, add an exploration/combat baseline
and seed-batch runner, then replace browser/wall-clock dependencies for Node.

## Adaptation and future training requirements

Expose traits from gameplay's own data instead of maintaining agent-only tables
of enemy/weapon stats. New subclasses sharing those fields work without a new
species lookup. New mechanics still require corresponding features, actions,
and tests. A shared, read-only attack footprint/rule descriptor should eventually
serve gameplay, UI previews, and agent observations; do not duplicate imperative
weaponMove implementations in the observation adapter.

Keep debug names, run IDs, build IDs, and source IDs out of the learned numeric
features except where IDs are needed for temporal association. Preserve unknown
value masks when encoding nulls. Diagnostic-only traits/hidden world data must
not silently enter a player-visible policy. Exposing a secret behavior phase or
exact attack timer is a deliberate information advantage unless the UI already
reveals it. Prefer actual telegraphs plus temporal observations for player-like
evaluation; published enemy rules may be a separately documented input mode.

Training should vary health, damage, range, cooldowns and supported behavior
parameters within valid game configurations. Merely exposing a numeric feature
does not guarantee the policy uses it when that feature never varies in training.
Hold out seeds, trait combinations, and some content families to measure transfer.
Test both unchanged and changed rules, and measure recovery after fine-tuning,
not just initial failure. A frozen policy can condition decisions on new inputs,
but it cannot update its weights or reliably understand new mechanics by itself.

Preserve source builds, checkpoint lineage, training configuration, seed splits,
and evaluation reports. On a build change, inspect the source/rule diff and add
targeted regression scenarios. Natural-language patch notes can guide this
workflow; a small numeric policy does not automatically read or understand them.
Do not replay old seeds using new rules and assume the reconstructed transitions
still match the original demonstrations.

For updates, compare continued training with a fresh baseline; retain earlier
checkpoints and a curated mix of still-valid examples. Avoid mixing incompatible
old/new transitions without rules metadata. Early stopping, diverse tasks, and
retraining remain options if adaptation stalls; no architecture guarantees
lifelong plasticity. Research background: [Procgen generalization benchmark](https://proceedings.mlr.press/v119/cobbe20a.html)
and [loss of plasticity in continual RL](https://arxiv.org/abs/2303.07507).

## Demonstration collection

Use the existing server to collect seeds and replay actions, then reconstruct
observations for training with the corresponding game build. This collection
endpoint has not been implemented. Capture:

- Run ID, seed, game/build version and replay format version.
- Gameplay settings and developer-mode/assisted-run flags.
- Actions, completion status, depth/progression, death cause, and turn count.
- Data source (human, programmed policy, learned policy) and policy version.
- Replay validation status and, eventually, pre-action player observations.

Keep source builds or a compatibility strategy: a seed alone does not reproduce
a run after generation or gameplay rules change. Uploaded outcomes are unverified
until replayed. Validate payloads and bound upload size; use idempotent run IDs.
Inspect existing server schema and analytics before choosing storage and batching.

Rank/filter demonstrations at training time rather than automatically discarding
short runs. Strong play can lose on difficult seeds; weak runs can contain useful
decisions and failure evidence. Compare performance across seeds and keep held-out
evaluation seeds separate. Split related runs to avoid train/evaluation leakage.

Begin with a programmed exploration/combat baseline, then imitation from human
and baseline demonstrations, followed by correction examples and optional RL.
Keep player-visible observations and remembered exploration separate from full
world diagnostic observations. Repeated policy failures do not prove hard locks;
combine varied policies with structural progression/reachability checks.

Large datasets and checkpoints should have separate artifact storage rather than
being committed to the source repository. Record the code revision and training
configuration with each checkpoint.


## Turn-cost contract (first slice)

Every step reports actual `info.turnDelta`, independently of attempted decisions
and replay recording. `agent.describeAction(action)` and
`info.predictedTurnCost` report a pre-action cost where known: Wait is 1;
Move and ladder choices remain null because their resolution is contextual.
Item traits include `successfulAttackTurnCost`: ordinary daggers expose 1, dual
daggers expose their current first-hit 0 / second-hit 1 directly from gameplay.
A miss does not consume the dual dagger's free hit. Each pair has its own phase;
inventory turn ticks reset it. This conditional successful-hit cost is not a
promise that a directional action will attack. Other weapons currently report
null pending their rule audit.

Regression tests exercise 100 consecutive zero-turn decisions with budget
pause/continuation and the actual DualDagger.weaponMove implementation with a
fixture room. These do not yet exercise the full crafting/equipment UI or a
complete dagger-to-other-weapon inventory combo. Shared gameplay lighting/visibility remains a subsequent implementation slice.


## Inventory and crafting actions

Observations now include stack counts, targeted-use flags, direct-use turn cost,
armor/equipment state, and a separate activeWeapon flag. The lab accepts action
JSON and has an inventory smoke check that unequips/re-equips across a budget
pause and moves the weapon between slots without advancing turns.

Costs come from read-only methods on gameplay items, not agent name tables.
Audited food/potions and scroll inscription expose zero direct-use cost; equipment
reflects current equipped state and the EQUIP_USES_TURN setting (weapons use their
existing free toggle rule). Hammer use on iron/gold ore or bars and iron recipe
choices expose zero cost, as does adding spellbook pages. Other target effects,
drop hooks, and unaudited mechanics may report null. These are cost descriptors,
not guarantees of success: materials, skill, cooldown and other gameplay gates
still apply. Every completed step reports the actual turnDelta.

Tests run production inventory methods and crafting/menu/item rules with fixture
storage and rendering, covering ore smelting, enabled recipe choices, armor
crafting/equipping, healing, a budget pause with the menu open, slot validation,
prototype recipe rejection, cancellation, and equipment cost setting changes.
This is not yet full browser replay parity for every inventory item.

## Shared lighting and restricted perception

`src/lighting/gameplayLighting.ts` contains the numerical ray traversal, linear
RGB conversion, mixing/clipping and inverse-luminance calculation. The browser
Room delegates to it. It has no browser, camera, timer or game-class dependencies.
The existing 2.2 gamma and ray sampling are intentionally preserved; this is not
a color-science correction or a scalar approximation. Tests compare buffers,
colors and inverse luminance exactly with a frozen pre-extraction oracle across
mixed sources, clipping, zero radius, wall/entity blockers, layer overrides and
uncasting. Rats still read room.vis with their original cached sampling and timing;
no rat behavior rule or cache was changed.

Occupied rooms now update lighting regardless of camera visibility or a source's
screen position. Opaque entity footprints are collected across the room. This is
an intentional gameplay correction: off-camera light/blockers can now affect
values that previously depended on zoom. Unoccupied-room rendering updates retain
their existing screen gate. Large-room performance and long replay parity across
this change still need evaluation. Lighting scheduling, source collection, door
lights, and the local active-z choice remain in Room; this is not a complete Node
simulation driver or a per-layer multiplayer lighting redesign.

`agent.perceive()` (also the lab's Perceive button) returns a separate restricted
snapshot, labeled player-perception with schema 6. `observe()` and `step()` still
return explicitly diagnostic observations. Do not feed those full observations
or their history to a restricted policy. The diagnostic compatibility helper
currently checks the diagnostic contract; preserve the perception contract AND
vision configuration separately for a future perception-policy loader.

Configure vision at reset:

```js
await agent.reset(123, {
  maxSteps: 1000,
  vision: {range: 12, identificationBrightness: 0.08},
});
const visible = agent.perceive();
```

These are provisional tuning defaults, independent of zoom: Euclidean distance
from the player's tile, supercover line of sight with blocked corners, and
brightness = clamp(1 - room.vis). Tile walls/layer overrides and opaque entities
use gameplay's blocking rules. The blocking target tile's near face is visible.
Entities are checked at their anchor tile and current layer; partial visibility
of larger footprints is not implemented. Identified entities use the existing
trait projection. In darkness enemies expose only an anonymous position, while
other objects/items require the identification brightness. Hostile arrows and nearby non-directional X warnings remain visible in darkness, matching their above-shade rendering. Warning
source coordinates/IDs are always omitted. Unknown light samples count as dark.
Tiles below the identification threshold have no type label. Own inventory and
menu choices remain available.

Perception includes no seed, full-room bounds, diagnostic history, or automatic
memory. When an enemy darkens, its identity/stats disappear again; a future policy
may remember previous observations itself. This initial contract requires visual
tuning against the game and a broader information audit before treating it as a
validated player-equivalent benchmark. In particular, large-enemy anchor sampling and unseen content need further playtesting.


## Lighting inspection lab

The Scenario selector supports Standard, Forest sandbox and Cave sandbox. Reset
creates a seeded sandbox with the existing sidepath generator and enters it via
the ladder choice. Sandbox exports include scenario and diagnosticSandbox=true;
they are not ordinary progression runs and require the same preset to reproduce.
The policy action whitelist still excludes commands and direct teleportation.

Inspect lighting performs three warmup updates then 20 timed updateLighting calls
in the current room, reporting median/p95/max milliseconds and one perception
sample. It recomputes lighting and invalidates its render caches, without issuing
a game action. These are synchronous update timings, not total-frame or total-turn
latency. The diagnostic canvas shows raw RGB light, blockers, perceived contacts
and player position, with a threshold sweep at 4%, 8% and 16%. It deliberately
contains full-room information and is never a policy input. Reports are also
available as window.lastLightingReport in the parent lab for debugging.

Perceive accepts an optional validated vision override for comparisons without
changing the episode's saved defaults. The default remains range 12 / brightness
8%. Initial forest and cave checks did not justify changing it. A rendering audit
found that warning arrows bypass shading; shared warningVisibility logic now keeps
those arrows observable in darkness while retaining the agent's range/LOS/layer
limits and omitting hidden source identity/coordinates.


## Programmed baseline and multi-seed evaluation

Open `/agent.html`, enter comma-separated Batch seeds and a Decisions per seed
budget, then Run baseline batch. Stop batch requests cancellation after the
current action has settled. Export batch downloads the outcomes, last 32
restricted before/after snapshots per seed, and full replay envelopes as JSON.
The latest report is also in `window.lastBatchReport` in the parent lab. One
parent-console call runs the same runner:

```js
await new AgentBatch.Runner(document.getElementById('game').contentWindow.agent)
  .run({seeds: [123, 456, 789], decisions: 100});
```

The browser must stay open. This is not the future Node/WSL training driver.
`agent-baseline.js` and `agent-batch.js` also export CommonJS modules for unit tests.
Reports include policy version and policy factory source because these standalone
scripts are not covered by the game's Webpack hash. Preserve game source/assets
separately with reports; a replay envelope alone is not a frozen executable build.

The policy receives only `perceive()` snapshots and recorded/turnDelta feedback.
Diagnostic step observations and replay exports never enter the policy. Perception
schema 6 includes visible tile solidity/door/exit and tunnel traversal traits and an opaque room identifier
for visit tracking. Dark tile traits remain null. Inventory healing metadata is
currently implemented for mushrooms and shares the item's actual healing value.
The baseline plans weighted shortest routes through remembered, previously observed tiles,
uses visits and passage crossings to prioritize exploration, avoids temporarily
failed directions and warning tiles, approaches adjacent enemies, eats known
healing items, and confirms ladders. It dismisses ordinary interactions and cancels
crafting menus. It does not yet choose upgrades, craft, cast spells, solve resource
requirements, or learn weights. Long combat and progression performance remain
unproven. Reports include rooms visited and decisions since reaching a new position.
Passage scores use crossing history instead of the ordinary unvisited/frontier
reward: crossing lands beyond a door, so standing-position visits cannot measure
its use. Goal utility must remain positive to override local exploration; travel distance
ranks eligible goals but cannot make a distant unexplored destination ineligible.
Repeatedly visited goals eventually stop attracting the policy. Backtracking remains available
through the local fallback policy. Observed non-enemy blockers are remembered
through occlusion, updated when seen at a new position, and removed when their
previous location is visibly clear. Enemy positions are not frozen into that
obstacle memory. A chosen route destination persists until
arrival, a passage crossing, or loss of a safe path. This prevents nearby competing
goals from reversing the chosen direction every step; enemy combat still takes
priority over routing. Identified non-enemy breakable objects are traversable plans
with estimated extra clearing effort from health and active-weapon base damage.
The policy executes ordinary Move/attack actions and replans after each observed
result; unknown objects and indestructible colliders remain blocked. The estimate
is not a promise of damage or an exact action count. Weighted search uses Dijkstra
rather than unweighted breadth-first search; no unseen geometry is supplied.

Diagnostic observation schema is now 6, perception schema 6, and action schema 3.
The recorded zero-turn DismissInteraction action closes ordinary screen messages,
vending interfaces, and context menus; ladder and selection actions remain distinct.
Visible tunnel doors expose whether they are unlocked and can be unlocked from the
current side. Locked tunnels are exit-to-start shortcuts unlocked from the exit side;
the policy skips them when approached from the locked start side.

Door traversal checks physical occupancy at the source doorway, linked doorway,
and destination arrival tile before moving the player or changing rooms. Living
collidable entity footprints on the player layer block passage. Blocked attempts
show a game message and log [door-traversal-blocked] with room, tile, and occupant
identifiers. This runtime guard does not fix the separate generation bug that can
place vending machines in doorways.

Outcomes distinguish dead, budget-incomplete, unsupported-decision, cancelled,
and error. No outcome claims victory or proves a seed unwinnable. Budgets count
decisions independently of turns. Advancing to the next seed resets an incomplete
run deliberately for bounded evaluation; its replay and trace remain in the
report. The last run remains in the environment. Continue last run adds the requested
number of decisions while preserving the live policy, obstacle/visit memory, trace,
metrics and replay. It accepts budget-incomplete or cancelled runs, rejects deaths
and errors, and checks that visible state and replay history are unchanged.
Reloading the page loses this live runner; restoring policy memory from a saved
report is not yet supported. Unstarted seeds from a cancelled batch do not run
automatically when continuing its last episode.
Timeout/execution errors stop the whole batch rather than resetting over pending
callbacks. Only one batch per Runner can execute at a time. Snapshots are bounded;
replay actions remain complete within the run budget.


## Combat previews and evaluation diagnostics

Restricted warnings include a source ID only while that source is identified in
current perception. Coordinates of a hidden source remain excluded. A supported
adjacent attack exposes a minimum damage value and a supported target exposes a
kill threshold. The baseline can disregard that source's warnings for a confirmed
killing blow, while preserving every other known warning. Unsupported/custom
attack or damage handlers report unknown; base damage alone is not a guarantee.
The first supported attack preview is the dagger's ordinary adjacent strike.

Attack commands use the existing directional adapter, but resolve as attacks:
the player stays in place even when the target dies. Walking onto that tile takes
a subsequent action. Pushes are evaluated separately and can move the player when
the visible chain has space. Uncertain pushes cannot be treated as guaranteed
escapes from an under-player warning. Entity footprints and chain-pushability are
used rather than class-name rules.

Inspect batch trace displays the final 32 restricted transitions for Trace seed.
Policy goal/reason is captured before each action. Batch report schema 4 includes
health lost, longest stale-position streak, and zero-turn counts/streaks. These
metrics never force a Wait or interrupt a legitimate sequence of free actions.


Continuation records each run's effective decision budget and a resumption history.
The original batch budget remains metadata for the initial run. Report comparison
uses the per-run budget when present, so an extended run is not silently compared
against a shorter evaluation. Extending a run never injects a Wait or resets the seed.

## Backtracking between rooms

The baseline remembers directed door connections only after crossing those doors.
It does not infer reverse links from nearby doors or read hidden room topology.
When weighted local routing has no useful goal, it searches those learned links
for a room with remembered unfinished work, then routes to a reachable first door.
Intermediate rooms may be exhausted; graph cycles are visited once per search.
Remembered blocked passages and locked start-side tunnel doors are excluded.

Local exploration and combat retain priority. Work estimates are refreshed on
revisiting each room, so they are a memory of prior observations, not a guarantee
that a distant objective remains reachable. Traces identify these choices with
reason `backtrack` and a target room. This is navigation scaffolding for the
programmed baseline, not a learned policy or an omniscient map solver.


## Return ladders and routing explanations

Perception schema 6 identifies upward ladders as exits and exposes visible
ladder direction and unlocked state through traversal traits. Darkness still
redacts these fields. The baseline defers upward exits until local exploration
is exhausted; locked upward exits are not planned as usable routes. Both direct
ladder crossings and confirmed descents teach directed room connections, so a
previously used return ladder can participate in backtracking to remembered work.
A room change at identical coordinates is progress, not a failed movement edge.

Policy traces now include a bounded navigation explanation: known/reachable tile
counts, whether a local goal exists, known passages and their reachability,
observed blockers and traversal traits, learned destinations, and remembered work.
This is derived from restricted observation memory. It does not reveal hidden
room geometry or prove that an exhausted state is unwinnable.

## Combat retreat space

While the player's current tile is threatened, the baseline compares visible
follow-up escape space between equally safe walking retreats before applying
ordinary visit preferences. A follow-up tile must be known clear, outside current
warnings, and outside every observed entity's occupied footprint; the tile being
fled is excluded. Doors, ladders, breakables, and unknown tiles are not assumed to
be immediate follow-up escapes. This is a preference for maneuvering space, not
simulation of future enemy movement or a guarantee of safety.

Giant enemies use their full observed width/height rectangle for occupancy and
combat decisions. Regression tests exercise all four tiles of a 2x2 target through
the actual Player.tryMove, dagger attack, weapon target lookup, and Entity.pointIn
methods: each directional attack hits once, stays in place, and kills before the
room response when sufficient damage is dealt. Nonlethal attacks retain the
under-player warning; a confirmed kill removes only that source's threat.

## Focused combat testbed

Choose a `Combat:` entry in the agent lab's Scenario selector, then use Reset run
for manual actions or Run baseline batch for policy evaluation. The presets are
skeleton, zombie, giant skeleton, giant zombie, a three-skeleton group, and spawner.
Batch runs honor the selected scenario; select Standard to evaluate natural seeds.

Combat testbed version 1 is a 25x25 room with perimeter walls and a 23x23 open
interior. The player starts at (12,12). Single enemies start at (13,12); the group
uses (13,9), (13,12), and (13,15). Enemy construction uses the EnemyTypeMap registry
behind `/spawn`, with fixed placement and validation of the whole footprint.
A white room light uses the normal numerical lighting engine. Health, inventory,
turn rules and enemy behavior are unchanged. Preset data lives in
`src/game/combatTestbed.ts`; bump its version when changing encounter geometry.

Setup happens at reset, outside the policy action space. Restricted perception
still follows range, line-of-sight and brightness rules. Diagnostic observations
and replay envelopes include the versioned encounter layout; replay envelopes
remain marked diagnosticSandbox. These are testbed recordings, not standard-run
replays or automatically successful demonstrations. Full standalone sandbox replay
restoration is not added by this change. Batch reports include scenario, and the
comparison tool rejects comparisons across different scenarios. Budget exhaustion
still means incomplete; a cleared combat encounter has its own runner outcome.


## Encounter completion

Batch report schema 4 adds `encounter-cleared`. In combat testbeds only, the
supervisor checks the settled room after each action for live enemies and live
projectiles (including pending enemy spawns). A living player with neither
remaining clears the encounter; death takes priority, and a clear on the final
allowed decision takes priority over budget exhaustion. Natural-seed runs never
receive a clear from an empty room. This is an encounter result, not a game win.

The clear signal is returned in step info and the diagnostic replay envelope.
It is not added to restricted perception or passed to policy feedback, which
receives only recorded/turnDelta. The runner stops without injecting another
move or Wait, preserves the final action/replay, and cannot resume a cleared run.
The comparison tool counts clears separately from deaths and incomplete budgets.
