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
