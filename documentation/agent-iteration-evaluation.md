# Agent iteration evaluation — 2026-09-06 evening

500 decisions per seed, browser backend, default vision. Budget exhaustion is
incomplete, not victory. These are programmed policies, not trained checkpoints.
The observer's initial game build is c8cedddd4aab91238b18 for v8/v9.

## Baseline v8

| Seed | Outcome | Decisions | Turns | Positions | Rooms | Health | Stale decisions at end |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 123 | dead | 128 | 125 | 43 | 2 | 0 | 4 |
| 456 | budget-incomplete | 500 | 493 | 284 | 4 | 2 | 132 |
| 789 | budget-incomplete | 500 | 494 | 359 | 4 | 2 | 49 |
| 321 | budget-incomplete | 500 | 497 | 402 | 3 | 2 | 46 |
| 654 | budget-incomplete | 500 | 493 | 269 | 4 | 2 | 162 |
| 987 | budget-incomplete | 500 | 497 | 321 | 3 | 2 | 72 |

## Warning-aware v9 (intermediate)

| Seed | Outcome | Decisions | Turns | Positions | Rooms | Health | Stale decisions at end |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 123 | dead | 125 | 122 | 41 | 2 | 0 | 2 |
| 456 | budget-incomplete | 500 | 490 | 285 | 4 | 1 | 116 |
| 789 | budget-incomplete | 500 | 494 | 360 | 4 | 2 | 43 |

The trace exposed a push assumption: at (1,23), attacking/pushing a crate to the
left did not move the player off a hostile warning. Current warning handling must
consider whether a command actually moves the player. Conversely, a killing blow
can remove its source's pending attack before the room ticks.

## Contract additions and safeguards

Diagnostic schema 6 / perception schema 5 adds visible-source warning identity,
known kill-damage thresholds and an adjacent attack damage lower bound. The initial
supported weapon descriptor is the dagger. Standard entity/enemy damage handlers
and the three skull handlers expose thresholds; custom damage/death handlers
return unknown. Handler identity checks reject overridden pipelines rather than
assuming that new enemy code preserves old semantics. Unknown sources stay hidden.

Push-chain membership is exposed as a live trait. A visible clear tail through
known chain-pushable single-tile entities can establish a push route. Unknown
space, complex footprints, and crush-tail cases remain uncertain; an empty escape
is preferred when available. Attacks never imply subsequent movement into a
cleared tile. No game turn is forced to end a preparation sequence.

The batch trace viewer exposes the last 32 restricted snapshots for a chosen seed.
Report schema 2 adds health lost, maximum stale-position streak, zero-turn count
and longest zero-turn streak. Those are diagnostics, not automatic stop criteria.

## Killing-blow support v10 and push-chain support v11

V10 used game build 5ffb6badd9f1eb3e161b. All six seeds survived the 500-decision
budget at health 2, with measured health loss 0. Results remain incomplete.

| Seed | Turns | Positions | Rooms | Maximum stale streak |
| --- | ---: | ---: | ---: | ---: |
| 123 | 478 | 45 | 2 | 361 |
| 456 | 493 | 284 | 4 | 130 |
| 789 | 494 | 359 | 4 | 49 |
| 321 | 497 | 402 | 3 | 46 |
| 654 | 493 | 269 | 4 | 162 |
| 987 | 497 | 321 | 3 | 80 |

V11 used game build 7434f4d1d838f61e35e0, with push-chain traits and stricter custom
handler guards. Seeds 123/456/789 all survived 500 decisions at health 2, health
loss 0. Positions visited were 45/284/359; maximum stale streaks were 353/132/49.
Seed 123's trace revealed a remembered tile but forgotten vending-machine blocker:
the machine alternated in/out of sight and the route repeatedly targeted its tile.
This remains a navigation problem even though the player now survives.

Validation at this checkpoint: 99 tests passed, TypeScript check with skipLibCheck
passed, Webpack compiled, and browser smoke passed with the dagger's adjacent
pattern and minimum damage present. No active evaluation was interrupted. Report
comparison CLI is documented in agent-report-comparison.md.

## Fresh seeds and continuation validation

V12's fresh-seed check used a 300-decision budget and build
7434f4d1d838f61e35e0. All runs were budget-incomplete and were reaching new positions
at the end; these results do not establish winning play.

| Seed | Turns | Positions | Rooms | Health | Health lost | Maximum stale streak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 101 | 290 | 97 | 4 | 1 | 1 | 111 |
| 202 | 286 | 128 | 6 | 2 | 0 | 75 |
| 303 | 295 | 240 | 3 | 2 | 0 | 38 |

The continuation browser check ran seed 123 for 20 decisions (18 turns, 20 replay
actions), then continued the same episode to 40 decisions (38 turns, 40 replay
actions). A manual Wait after extending the environment's budget caused a later
continuation request to be rejected as changed game state. Unit tests also compare
split and uninterrupted action sequences, and reject changed replay histories.
Final verification: 107 tests passed and JavaScript syntax checks passed. The game
bundle remains the tested build above; navigation and runner changes are standalone.

## Final six-seed navigation comparison (v12)

Same game build/settings as v11, 500 decisions per seed. All six runs survived
at health 2 with measured health loss 0. Each outcome is budget-incomplete.

| Seed | Turns | Positions | Rooms | Final stale streak | Maximum stale streak |
| --- | ---: | ---: | ---: | ---: | ---: |
| 123 | 488 | 45 | 2 | 353 | 353 |
| 456 | 493 | 284 | 4 | 132 | 132 |
| 789 | 494 | 362 | 4 | 25 | 47 |
| 321 | 497 | 402 | 3 | 46 | 46 |
| 654 | 493 | 269 | 4 | 162 | 162 |
| 987 | 497 | 325 | 3 | 100 | 100 |

Obstacle memory and distant-goal eligibility pass their regression tests, but
these changes did not eliminate late-run stalls. Position counts improved slightly
on 789 and 987; the maximum stall grew on 987. Seed 123 still has only 45 visited
positions, despite surviving. Do not present the navigation changes as a universal
performance improvement or label stalled survivors as good training examples.

Next investigation: room-level backtracking when local goals are exhausted,
distinguishing a route blocked by generated objects from an unsupported resource
requirement, then longer combat/inventory scenarios. Training-data selection should
consider exploration and stalled intervals alongside survival. No learned policy
was trained in this iteration.

## Room backtracking investigation

The first prototype (v13) also marked an inferred return door as already used.
That changed early exploration: seed 456 and seed 654 both died at decision 38,
where v12 had survived 500 decisions. Seed 123 survived but still visited only
45 positions. All three used the same build/settings and 500-decision budget.
This prototype is not the selected baseline.

V14 retains prior local door rewards and learns each directed connection only
from an observed crossing. Backtracking is a fallback after local goals are
exhausted. It can search through exhausted intermediate rooms for remembered
work, while retaining local path, threat, obstacle, and tunnel constraints.
No reverse connection is inferred from an adjacent door. Unit coverage includes
dead ends, graph cycles, ambiguous arrival doors, non-door transitions, local-goal
priority, threatened departures, and remembered blocked or locked passages.

### Final v14 comparison

All six seeds survived 500 decisions at health 2, with measured health loss 0.
All outcomes are budget-incomplete. Each contract and vision configuration exactly
matched the corresponding v12 report (build 7434f4d1d838f61e35e0).

| Seed | Turns | Positions | Rooms | Final stale streak | Maximum stale streak |
| --- | ---: | ---: | ---: | ---: | ---: |
| 123 | 488 | 45 | 2 | 411 | 411 |
| 456 | 493 | 283 | 4 | 172 | 172 |
| 789 | 494 | 362 | 4 | 32 | 36 |
| 321 | 497 | 402 | 3 | 46 | 46 |
| 654 | 493 | 269 | 4 | 162 | 162 |
| 987 | 497 | 325 | 3 | 100 | 100 |

This validates survival parity in this sample, not an overall exploration gain.
Seed 456 visited one fewer position; the other position and room counts matched
v12. The maximum stale streak shortened from 47 to 36 on 789, and lengthened on
123 and 456. Stale streaks alone cannot distinguish earlier exhaustion of the
same territory from worse routing. The last 32 transitions on 123 and 456 still
show local wandering with no selected goal, not an active backtracking loop.
Room backtracking is now available but does not resolve these stalls.

Verification: 116 tests passed; JavaScript syntax and diff whitespace checks
passed. Both prototype and final browser reports were exported through the lab.
The server on port 8000 was left running, and no active batch was interrupted.
Next investigation should explain why no useful goal remains in these exhausted
states: inspect remembered reachable passages, resource/interaction requirements,
and frontiers that need more than ordinary movement before changing route scores.

## Return-ladder investigation (September 8)

V15 added routing explanations without changing action selection. At 400 decisions,
seed 123 had 45 visited positions and seed 456 had 283. Seed 123 remembered an
indestructible object occupying doorway (3,19), plus a reachable used doorway
leading to territory with no remembered work. Seed 456 remembered zero passages
in its side area. Diagnostic inspection identified an UpLadder at (106,113):
perception classified only DownLadder as an exit, so the return route had been
omitted from navigation. This is distinct from the vending-machine generation bug.

V16 exposes upward-ladder exit/direction/unlocked traits under perception schema 6.
It explores locally before using an upward exit, and records both confirmed
descents and direct return crossings as connections. Regression coverage also
prevents identical-coordinate room transitions from being blacklisted as failed
moves. Diagnostics and action schema remain 6 and 3 respectively.

Two targeted browser runs used build 205607bbd2bab9fb10c1 and a 500-decision budget:

| Seed | Outcome | Decisions | Turns | Positions | Rooms | Health lost | Maximum stale streak |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 456 | dead | 447 | 432 | 341 | 5 | 2.5 | 15 |
| 654 | dead | 462 | 447 | 312 | 5 | 2 | 27 |

Both progressed beyond the old four-room stalls (v14: 283/269 positions, maximum
stale streaks 172/162). Build and perception schema changed, so this is a targeted
behavioral verification, not a contract-identical policy comparison. Earlier
survival in exhausted areas did not establish combat ability: both newly advancing
runs died. Seed 456's final trace shows a directional attack into a 2x2 BigSkullEnemy
while the player's current tile remained threatened. Do not label these runs as
successful training examples or claim an overall survival improvement.

Validation: 121 tests pass, TypeScript --noEmit --skipLibCheck passes, Webpack
build succeeds, and whitespace/syntax checks pass. Diagnostic and final reports
were exported. Port 8000 was found stopped at the start of this session and was
restored; it remains running. No active evaluation was interrupted.

Next: combat decisions around large footprints, constrained escape routes, and
resource use after returning from side areas. The vending-machine placement bug
remains a separate generation fix; the agent correctly refuses that occupied door.

## Giant combat audit and starter-seed screening

The combat audit confirmed that the actual player/weapon target lookup uses
Entity.pointIn across the full 2x2 footprint. Tests now exercise hits at all four
tiles, verifying one damage application and no simultaneous player movement, for
both lethal and nonlethal hits. No giant-specific targeting patch was necessary.

V17 adds a limited preference for visible follow-up escape space between equally
safe retreats. The focused synthetic wall-pocket regression passes; the complete
boss encounters remain unsolved. At the same build, observation contract and
500-decision budget, both results exactly matched v16: seed 456 died at decision
447 (341 positions, 5 rooms), and seed 654 died at 462 (312 positions, 5 rooms).
Do not claim this rule fixes either death. In the real 456 trace, the alternative
retreat is also constrained, unlike the simpler synthetic regression layout.

Per user guidance, giant skeleton/zombie encounters should remain hard regression
cases rather than defining the initial training curriculum. Screen fresh seeds
for useful early exploration and low damage/stalling. A short screening result
is a provisional curriculum candidate, not proof of an easy complete level, no
bosses, or a winning demonstration. Keep harder cases represented in later
evaluation to avoid optimizing solely for forgiving layouts.

### Provisional starter seeds

V17, build 205607bbd2bab9fb10c1, perception schema 6, range 12 and brightness
cutoff 0.08. All outcomes below are budget-incomplete after 200 decisions.

| Seed | Turns | Positions | Rooms | Final health | Health lost | Maximum stale streak |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 101 | 192 | 154 | 4 | 1.5 | 0.5 | 7 |
| 202 | 188 | 126 | 6 | 2 | 0 | 12 |
| 303 | 195 | 180 | 3 | 2 | 0 | 2 |
| 404 | 193 | 169 | 4 | 2 | 0 | 8 |
| 505 | 188 | 115 | 6 | 1.5 | 0.5 | 10 |
| 606 | 193 | 178 | 4 | 2 | 0 | 6 |

Prioritize 303 and 606 for longer validation because they combine full health,
substantial explored territory, and low stale streaks. Add 404 and 202 for variety;
202 traverses more rooms but covers fewer unique positions in this budget. These
are candidate starts under the current policy, not certified boss-free layouts.
Keep 456 and 654 as the hard combat regression set. No learned model was trained.

Final validation for this iteration: 123 tests passed and JavaScript syntax and
whitespace checks passed. The game bundle was unchanged. Both combat and starter
reports were exported; completed browser runs were retained for inspection.

## Longer starter validation

V17, unchanged build 205607bbd2bab9fb10c1, perception schema 6, range 12,
brightness cutoff 0.08. Both runs had an effective 800-decision budget. Seed 606
continued its original 200-decision episode with 600 additional decisions, retaining
policy memory and replay history. Seed 303 ran independently from reset.

| Seed | Outcome | Decisions | Turns | Positions | Rooms | Final health | Health lost | Maximum stale streak |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 303 | dead | 797 | 767 | 537 | 11 | 0 | 2.5 | 22 |
| 606 | dead | 529 | 512 | 404 | 6 | 0 | 2 | 39 |

303 is the stronger provisional starter: it reaches substantially more territory
with a short maximum stale streak, but it did not survive the full budget. Its
final trace contains multiple SkullEnemies and a Spawner; the fatal attack leaves
the player on a tile threatened by multiple sources. This is a useful ordinary
crowd-combat regression in addition to the giant-boss tests. It is not evidence
that the entire seed is boss-free.

606 remained at health 2 until decision 528, then lost one health on each of the
last two decisions. The late encounter includes BigZombieEnemy. Keep its opening
as a candidate for shorter episodes, but do not classify the whole seed as a
forgiving layout. Total measured health loss can exceed starting health when
healing occurs or a hit overkills; it is not a remaining-health calculation.

Neither long episode should be labeled a win or a fully successful demonstration.
The existing 200-decision screens remain short opening checks. 202 and 404 have
not received longer validation in this iteration. Keep 456 and 654 as hard giant
combat regressions, and use 303 as the leading candidate for initial short-episode
curriculum work while retaining its later spawner encounter as a separate test.

Both reports were exported and their completed tabs retained for inspection.
No game or policy code changed, no active episode was interrupted, and port 8000
remained running. No tests were rerun for this evaluation-only documentation update.

## Focused combat testbed verification

Added six versioned combat presets in a 25x25 enclosed starting room. Browser
validation caught that more distant initial placements allowed exploration to
avoid the encounter; final version 1 starts a duel adjacent to the player while
retaining ample retreat space. Group positions remain separated.

Final build 5526a71636d0e582e5f7: combat-bigskull, seed 123, 12 decisions completed
at health 2. The restricted trace confirms actual combat: action 1 attacks right
and reduces giant health 4 to 3; action 2 moves up; action 3 attacks down and
reduces giant health 3 to 2. This is setup/interaction verification, not a claim
that the baseline reliably defeats giants. The report was exported.

A browser reset of combat-skull-pack confirmed a 25x25 room and exactly three
SkullEnemies at (13,9), (13,12), and (13,15). That preset was left ready in the lab.
129 tests pass, including all preset geometries and reset repeatability through
the actual setup method, full-footprint collision validation, environment export
metadata, batch scenario propagation, and scenario-aware report comparison.
TypeScript and Webpack checks pass. No active run was interrupted; port 8000
remains running. Existing normal-seed reports remain a separate evaluation set.

## Encounter-cleared outcomes and open-arena baseline

Batch schema 4 now distinguishes encounter-cleared from death and budget
exhaustion. The supervisor waits for settled combat with no live enemies or
projectiles, including pending spawn animations. Natural runs cannot clear by
emptying a room; the outcome signal does not enter policy observations/feedback.

Build 026087f1572a1d06d98e, unchanged policy explore-combat-v17, testbed version 1,
150-decision limits:

| Preset | Seeds | Outcome | Decisions each | Final health | Health lost |
| --- | --- | --- | ---: | ---: | ---: |
| Skeleton group | 123, 456, 789 | encounter-cleared | 53 | 2 | 0 |
| Giant skeleton | 123 | encounter-cleared | 15 | 2 | 0 |
| Spawner | 123 | encounter-cleared | 10 | 2 | 0 |

All trials stopped on completion without an extra movement or Wait. Repeated
seeds use the same preset geometry; they establish repeatability, not independent
layout coverage. The baseline policy was not changed or trained in this step.
It already handles these open-room encounters, so these results do not establish
improved natural-run survival. Next use constrained arena layouts with obstacles
and multiple simultaneous threats to reproduce the room-level deaths.

Validation: 134 tests pass, TypeScript and Webpack checks pass, and syntax/whitespace
checks pass. Regression tests cover pending spawns/projectiles, non-combat empty
rooms, death precedence, clear at the budget boundary, replay preservation, refusal
to resume cleared runs, and report clear counts. Reports were exported and the
completed trials retained. No active evaluation was interrupted.

## Obstacle encounters and giant telegraph correction

Testbed version 2 adds a giant wall pocket and a skeleton choke point, each with
real walls/bushes and an initially walkable escape. The browser startup check
caught a circular import caused by eager Bush loading; loading it at setup time
resolved the issue before final evaluation.

The pocket revealed a game warning bug: the giant's initial default warning
covered only one tile of its two-tile attack edge. V17 stepped onto the unmarked
neighbor and took damage. Default 2x2 forward telegraphs now cover both edge tiles
in all four directions, while explicit origins and inactive-enemy suppression
remain intact. This changes visible warnings, not attack footprints or damage.

| Build / policy | Giant pocket | Skeleton choke point |
| --- | --- | --- |
| 107fe1539e3af00ed02c / v17, before telegraph fix | cleared in 9, lost 1 health | cleared in 8, no damage |
| 4d680b42b99811a973e9 / v17, corrected telegraphs | cleared in 5, lost 1 health | cleared in 8, no damage |
| 4d680b42b99811a973e9 / v18, retreat tie-breaker | cleared in 5, no damage | cleared in 8, no damage |

These are seed 123, 150-decision budgets. The two corrected-build trials provide
a matched policy comparison: with equal immediate safety and equal follow-up
space, v18 prefers leaving the current lane of the visible warning source. The
pocket's damage was eliminated without changing the enemy or player stats.

Natural seed 456 was also compared at a 500-decision budget on the corrected
build, with identical observation/settings contracts. V17 died at decision 447;
v18 died at 448. Both explored 341 positions across 5 rooms and lost 2.5 measured
health. This is not a meaningful survival improvement: the remaining natural-room
trap is unresolved despite the isolated pocket improvement.

Final validation: 137 tests pass, TypeScript and Webpack checks pass, and syntax/
whitespace checks pass. Tests cover all-direction full-width warning generation,
asleep/unconscious suppression, source-aware retreat selection, occupied giant
footprints, and a walkable exit from both obstacle layouts. All completed reports
were exported; the wall-pocket preset was left ready. No active run was interrupted,
and port 8000 remained running.

### Armored combat checks — September 8

Build `ed64962d56570c30b5f2`, baseline `explore-combat-v18`, combat testbed v3.
Added armored skeleton/zombie presets and removed armored skeleton's alert-timer
attack suppression after a surviving front hit. Seed 123, 40-decision cap:
armored skeleton cleared in 4 decisions at 2 health; armored zombie cleared in 2
at 2 health. These are initially sleeping open-room smoke checks, not evidence of
mastery of already-alert frontal encounters. Policy behavior is unchanged.

Validation: 141 tests, with the testbed export version expectation updated and
its 21-test environment suite rerun successfully; TypeScript and development
bundle pass. Front retaliation in all four directions, side-hit turning,
sleep wake-up, optional hit-stun, headless recovery and finishing are covered.
Normal play startup was also checked in the browser without errors.

### Already-alert forward-only duels — September 8

Build `668a27bb0c7c5c3cfcdc`, baseline `explore-combat-v19`, testbed v4.
Seed 123, 40-decision cap, same starting health and equipment for each:

| Encounter | Decisions to clear | Final health | Health lost |
| --- | ---: | ---: | ---: |
| Alert armored skeleton | 5 | 2 | 0 |
| Alert armored zombie | 3 | 2 | 0 |
| Alert giant skeleton | 9 | 2 | 0 |
| Alert giant zombie | 6 | 2 | 0 |

All began awake and facing the player's tile. Giant warnings cover the adjacent
left tile as well, exercising the footprint-dependent dodge. One policy handles
all four; no species-specific attack script was added. V19 prioritizes a
confirmed finish at equal risk over exploration incentives. A regression test
checks a safely killable, warning-free target despite a heavily visited target
tile and a nearby exit, and checks that another enemy's warning prevents that
stationary finish.

These are fixed open-room duels, not a natural boss-room success claim or a
controlled v18-versus-v19 improvement measurement. Next coverage should combine
clutter, other threats, entrance positioning and retreat opportunities.
