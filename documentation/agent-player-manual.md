# Turnarchist: operating manual for an AI player

Manual version 3 · verified against commit `4bb93be2`, perception schema 10 and
privileged demonstration-operator schema 1.
Read once before playing. Keep [the turn checklist](agent-player-quickstart.md)
in working context. Live observations and explicit user corrections override this
manual when mechanics change. These instructions guide a chat model operating the
game; they do not train or update the installed gameplay policy.

## Mission and boundaries

Play a legitimate recorded run, survive, and progress through the dungeon. Useful
preparation and retreat are part of play. Do not optimize for recording length or
invent an exploration quota. Preserve deaths, mistakes, interruptions, and coaching
honestly. A successful-looking run is not automatically good training data.

This protocol collects competent demonstrations from a reasoning model; it is not
an evaluation of the model's ability to reconstruct a grid from darkness. Use the
privileged current-room operator view described below. Keep Game view visible for
the spectator. The privilege ends at the current room: never inspect future rooms,
RNG results, seed generation, saves, or mutable live objects. Do not spawn enemies,
change health, reset a bad fight, or call the game action processor directly. Every
game action still goes through recorded teaching controls. Report suspected defects;
ask before fixing newly discovered ones unless the user already authorized that fix.

## Start and recording setup

1. Open `http://localhost:8000/teach.html`. Preserve an existing run; do not reload
   or replace it without exporting it first.
2. Select **Record my play**, **Starter skills**, and a fresh seed accepted by the
   page. The seed registry reserves evaluation seeds; never bypass that check.
   For a user-authorized unrestricted run, use **Normal first-floor run** instead.
3. Start one run, retain **Game** view, then **Activate human controls**. Click the
   game board once if it is not already focused and require the page to report
   **Keyboard active · arrows / WASD**. This enables recorded manual input even
   though a chat model is operating it.
4. Read the inspector. Require `selected.state === "human"`,
   `selected.inputOwner === true`, `selected.busy === false`, and a ready,
   nonterminal observation before acting. Focus loss pauses controls; reactivate
   explicitly. A paused page is not a pathfinding failure.
5. Record the session ID, seed, schema/build contract, actual chat model and effort
   if known, manual version, and starting action count in a companion run note.
   Use `unknown` for an unavailable model identity; do not infer it from behavior.

**Provenance limitation:** manual-control actions currently export as `actor:
"human"`; the policy named by the page is the configured baseline/checkpoint,
not necessarily the chat model pressing the buttons. Keep the raw export intact.
Create a same-stem `.operator.json` companion using the template below, with
`actualController: "chat-model"` and `trainingEligible: false`. This companion is
not automatically consumed by the current importer. Exclude these recordings from
human-only ingestion until provenance is reconciled and the run is reviewed.

## Observe and operate

The read-only interface is `window.teachingInspector()`. Its JSON is also mirrored
in `#teaching-inspector-state`. Use a browser tool's documented, permitted method
to read it; do not invent tool APIs. The inspector exposes two deliberately separate
views:

- `selected.observation` is the restricted policy observation saved in every action.
- `selected.operator` is the privileged, complete current-room view used by the
  chat-model operator. It exposes all current tiles, doors, entities, items, active
  warnings, hazards, damage traits, room rules, and four directional consequence
  forecasts without lighting or occlusion.

`teachingOperatorPath(targetX, targetY, options)` runs read-only A* in the current
room and returns both tile steps and recorded Move actions. By default it avoids
solid tiles, collidable entities, active warnings, and damaging spawn/projectile
markers. Set `allowOccupiedTarget: true` only when deliberately routing adjacent to
or into an interactable target. `teachingInspectObject(id)` returns the object's
explicit traits, footprint, description, and known mechanics. These functions do
not act, reveal future rooms, or predict RNG.

Common door, ladder, and ground-item routes are precomputed in
`selected.operator.pathfinding.pointsOfInterest`, so an isolated browser reader
does not need access to page globals for ordinary exploration.

If these interfaces cannot be read, stop for interface help rather than silently
switching to screenshot-only play. The operator view is assistance metadata, never
a replacement for the restricted `before` and `after` observations in the export.

Use keyboard input for every action that has a keyboard binding. Keep the game board
focused and send keys to it without scrolling to or clicking the teaching page's
direction and item-action buttons. Those built-in buttons are a fallback only when
a supported keyboard action cannot be delivered after refocusing the board. Setup,
pause, export, and run-management buttons are session controls rather than gameplay
inputs and may still be used when required.

For gameplay without a keyboard binding, interact with the visible game surface:
click a ranged target, click inventory source and target items, or drag an item.
Do not substitute an internal simulation call. `availableActions` lists directions
and menu choices; it is not a complete inventory-action list and does not certify
that a move is safe. Inventory state supplies additional actions.

| Input | Meaning and precaution |
| --- | --- |
| Arrows or WASD | Move, or attack/interact in that direction. Into an enemy means attack without advancing into its tile, including a killing blow. Prefer arrows for unambiguous automated input. |
| I | Open or close inventory; close it before keyboard movement. The teaching wrapper returns focus to the board. |
| Numbers 1–9 | Use slots 0–8. These are actions, not harmless selection shortcuts. |
| Space | Contextual: confirms a ladder, buys from a vending machine, dismisses an ordinary prompt, begins use-on targeting for the selected item, or uses the selected quickbar item. Verify the current decision or selected slot first. Never use it as a generic wait. |
| Escape | Dismiss a vending machine or ordinary interaction. In ordinary world state it pauses teaching controls, so reactivate and refocus before continuing. |
| Visible game-surface click/drag | Target ranged attacks, complete item-on-item use, reorder, or drop when no recorded keyboard binding exists. Verify source and target first. |
| Teaching-page Pause / End run / Save current | Pause controls / end play / export. These are separate session operations, not world actions. |

Do not use the teaching page's arrow buttons for routine movement or its item-action
forms for routine inventory play. If a keyboard input produces no acknowledged
record after the board is focused and the run is ready, refocus once and retry once.
Then stop and diagnose focus, input ownership, menus, and availability instead of
switching silently to page buttons or repeating the key.

Read a fresh settled observation after every consequential input. Compare action
count, turn count, room, position, health, inventory and threats. An acknowledged
action can consume zero world turns; an attack can change state without moving.
Do not repeat inputs just because position did not change. During transitions,
wait for readiness and updated room/depth before moving again.

Use `operator.tactical.moves` before a dangerous decision. Its damage figures are
calculated from currently active warnings and hazards. They describe the present
state rather than hidden future movement. When a warning is under the player, kill
its source only when `killsBeforeEnemyResponse` is true, or leave the warned tile.
Killing one source neutralizes only that source. Enemy `combat.currentDamage`
(falling back to `baseDamage`) makes different threats directly comparable; the
forecast is explicitly before equipped defenses, and null remains unknown.

## Coordinates, information and memory

Up is `(x,y-1)`, right `(x+1,y)`, down `(x,y+1)`, left `(x-1,y)`.
Use `(room ID,x,y,z)` as a location, not coordinates alone. Adjacent rooms can
share the rendered doorway coordinate while actual arrival is offset. Use observed
connections and the resulting position after crossing; never guess an inverse link.

An entity occupies every tile in its width × height footprint starting at its
top-left anchor. A 2×2 giant occupies four attack/collision tiles. Use stable
contact IDs to track individuals. Missing/null traits mean unknown, not zero.
Remembered identity does not give current hidden health or facing. Unidentified
contacts are potential blockers/threats. Equip a light when permitted and useful.

Maintain a short scratch record: current objective, known exits and their states,
unexplored branches, last 6–10 outcomes, and a proposed combat escape tile.
Keep the full export separate from this small decision summary.

## Combat decision order

1. **Resolve menus and readiness first.** Never interpret a menu as world movement.
2. **Prepare free survival actions.** Under the selected protocol, use needed food,
   potions or equipment whose observed cost is zero before spending a threatened
   turn. Fish currently heals 1. Avoid wasting excess healing when survival allows,
   but do not die conserving food. Read live item traits instead of hardcoding costs.
3. **List all hazards on your actual post-action tile.** Dangerous hostile warnings,
   active traps and spawn markers matter. Fading-out warnings are safe remnants;
   fading-in warnings are dangerous unless their source is disabled/dead. Use the
   explicit `dangerous` field on schema 10. Absence of warnings is not proof that
   a hidden enemy or pending spawn is harmless.
4. **Check a finish before dodging.** A known lethal attack can cancel that enemy's
   warnings before its response. Use a known attack pattern and
   `minimumAttackDamage >= combat.killDamageThreshold`, with current identified
   state. Base damage or species name alone is insufficient. Cancel only that
   source's threat; other enemies/traps/spawns still resolve. Ordinary attacks leave
   you where you started, so check that tile, not the enemy's tile.
5. **Otherwise dodge to space with a follow-up exit.** Consider all enemy footprints
   and overlapping warnings. Prefer room to maneuver over a corner. A push or
   obstacle interaction may leave you in place; do not assume it escapes danger.
6. **Before a nonlethal side hit, plan the following dodge.** If there is no safe
   continuation, reposition, retreat, heal or prepare the route first.

Forward-only means an enemy must spend a turn changing direction before attacking
in the new direction. Enemies without that trait do not need that turn. Against
forward-only enemies: approach → leave the warned lane → let them advance/turn →
hit from a safe side → inspect → repeat. This is a decision pattern, not an input
macro. Giants can cover one of your apparent dodge directions with their other
body tile. If the target survives your hit, the newly facing enemy can threaten
you next; a one-hit target and a many-hit target require different plans.

Headless skeletons remain alive and may recover. Lack of warnings makes them less
urgent than an attacking enemy, but finish them when safe. Do not assume every
first skeleton hit kills. Nearby enemies can hurt each other; use this only when
the geometry and subsequent state support it, never as a guaranteed hidden outcome.

Pushables can be tactical tools. Inspect the whole line: a push needs room for the
chain, and crushing behavior depends on occupants. Crates and barrels share traits;
do not infer mechanics solely from their names. Cross-shaped gravestones can spawn
skeletons when struck; avoid hitting them as casual route clearing. Breakable
obstacles can open real routes, but clearing them during danger requires a plan.

## Exploration, preparation and progression

Choose a reachable unvisited doorway or useful frontier. Use shortest paths through
known traversable space (A* if available), treating solids, full enemy footprints,
hazards and occupied doorways appropriately. A path through a breakable requires
an explicit attack and re-observation, not a movement shortcut.

Boss rooms require every enemy in that room to die before progression unlocks.
`operator.room.progressBlockedByEnemies` states this explicitly. Side paths are
optional resource branches and contain food; search them when healing or supplies
justify the detour, then return to the main path. A room with `enemyFree: true` and
no active damage markers permits the complete safe portion of an A* route to be
queued. Stop the batch before a door, ladder, push, attack, or other interaction,
and abort it on any room change, menu, failed input, health change, new enemy, or
new hazard. There is no arbitrary step limit for empty-room travel.

The locked starting-room tunnel is an end-to-start shortcut unlocked from the far
side. Mark it deferred and pursue another exit. Backtrack from explored dead ends
to the nearest known unfinished branch. Do not oscillate through a used door just
because crossing it appears attractive. After two unsuccessful identical inputs
or an unexplained repeated position cycle, stop that sequence and reconsider the
room graph, blocker, readiness and objective. Combat setup can legitimately revisit
tiles, so judge actual effects as well as movement.

Collect useful food and permitted upgrades; there is no reward for ignoring them.
Starter skills retains the starting weapon/loadout except food use; choose Normal
when demonstrating equipment upgrades, smithing, rings, spells or broader preparation.
Inventory presence alone enables fishing with a rod; it has no selected/equipped
state. Fishing advances the world, so first make the area safe. Use a modest stated
food target and resume progression; do not fish indefinitely to pad demonstrations.

Assess a boss entrance before committing: health, boss distance, clutter, other
enemies and escape room. Low health can still be workable in open terrain, while a
cluttered entrance can justify retreat and preparation. Some layouts/loadouts may
be unwinnable. Do not insist every death proves a reasoning error.

Inspect rewards before leaving cleared rooms. Floor transitions do not heal.
Unexpected health gain requires checking item use and recording; it is not a new
rule. Spawn markers may remain dangerous after a spawner dies. Rats had a fixed
flee-through-player defect; log any further untelegraphed damage with before/after
evidence rather than assuming the entire class is now guaranteed safe.

## Efficient execution and help

Use the compact operator view for routine decisions. Take screenshots at milestones
or discrepancies. In an explicitly enemy-free room, queue the safe A* route as one
tool operation only if each key is still serialized by the page and the sequence
halts at the conditions above. Otherwise move one step at a time. Never batch combat
inputs blindly.

Keep reasoning to a brief action justification plus expected result. At a difficult
fight, enumerate at most the few legal options and the next response; ask for help
if none has a defensible continuation. State position, threats, options, and the
specific uncertainty. Do not ask for coaching on every safe step. When coached,
record the affected action range and resume independent play as soon as unstuck.

## Finish, verify, and review

End on death, user request, session budget, or an unresolved interface fault.
Export periodically and before reload; after ending, export once more so the final
events are included. The local save endpoint requires `training/local_server.py`;
a plain static server cannot save to the data folder. If save fails, use Download
backup and verify the resulting file. A download request is not proof of a saved file.
Confirm session ID, nonempty records and final action count; never hand-reconstruct
missing gameplay. Browser recovery can export acknowledged records but does not
restore a playable run, and a recovered export may lack the separate game replay.

Create `<recording-stem>.operator.json` beside the verified export:

```json
{
  "schemaVersion": 1,
  "sessionId": "COPY_FROM_INSPECTOR",
  "recordingFile": "EXACT_EXPORT_FILENAME.json",
  "actualController": "chat-model",
  "model": "unknown",
  "effort": "unknown",
  "manualVersion": 3,
  "operatorObservationSchema": 1,
  "observationSchema": 10,
  "protocol": "starter",
  "trainingEligible": false,
  "reviewStatus": "pending-provenance-and-gameplay-review",
  "coachedActionRanges": [],
  "visuallyAssistedActionRanges": [],
  "outcome": "death-or-stopped-or-budget-or-error",
  "notes": []
}
```

Replace placeholders with verified values. Action ranges refer to exported `seq`
values; retain uncertainty if exact boundaries were not observed. Summarize depth,
progress, damage/death causes, coaching and export location. Add new experiential
findings to `agent-play-experience.md`, distinguishing observations, hypotheses,
user corrections and known bugs. Do not overwrite corrected mechanics with an
earlier inference.

Pilot before bulk collection: compare a few uncoached runs with and without this
manual on matched non-evaluation seeds, in separate comparison-only sessions. Measure
survival/progression, loops, avoidable damage, interventions and tool/usage cost.
Keep failures. Do not call manual-guided play “expert” until reviewed. Split future
training and validation by whole seed/session, and retain model/manual provenance.
