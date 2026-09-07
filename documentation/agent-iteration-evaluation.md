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
