# Longer programmed-agent evaluation — 2026-09-06

Browser lab, 250 decisions per seed, default vision. Runs were allowed to finish
without interruption. Budget exhaustion is incomplete, not victory. No learned
model was trained. Policy source is versioned separately from the game bundle.

## Checkpoint control (explore-combat-v2)

| Seed | Outcome | Decisions | Turns | Positions visited |
| --- | --- | ---: | ---: | ---: |
| 123 | unsupported-decision | 53 | 47 | 24 |
| 456 | budget-incomplete | 250 | 243 | 162 |
| 789 | budget-incomplete | 250 | 239 | 57 |

## Route planning and dismissible interactions (intermediate v3)

This batch started before the doorway guards and tunnel descriptors were added.
All six seeds exhausted their decision budgets with health 2 and no execution error.

| Seed | Turns | Positions visited | Rooms visited | Decisions since new position |
| --- | ---: | ---: | ---: | ---: |
| 123 | 167 | 33 | 2 | 182 |
| 456 | 245 | 223 | 3 | 0 |
| 789 | 188 | 20 | 2 | 223 |
| 321 | 247 | 236 | 3 | 0 |
| 654 | 240 | 188 | 4 | 0 |
| 987 | 246 | 236 | 3 | 0 |

## Tunnel descriptors and doorway guards (v4)

All three seeds exhausted 250 decisions with health 2 and no execution error.

| Seed | Turns | Positions visited | Rooms visited | Decisions since new position |
| --- | ---: | ---: | ---: | ---: |
| 123 | 43 | 30 | 2 | 211 |
| 456 | 245 | 223 | 3 | 0 |
| 789 | 22 | 20 | 2 | 229 |

Seed 456 explores more positions than the control. Seeds 123 and 789 still loop:
the final five actions alternate directions with zero turn advancement. Therefore
this is not evidence of reliable progression or improved performance on all seeds.
The next policy work should address repeated passage crossings and unproductive
routes, using the existing stale-position metric. Do not force a game turn to fix
this: legitimate zero-turn preparation remains allowed.

The doorway regression suite separately exercises occupied source, destination,
and arrival tiles, entity footprints/layers, tunnel unlocking sides, player movement,
and direct room-change calls. The full suite passed 77 tests; TypeScript checking
with skipLibCheck and the Webpack build passed. These tests establish runtime
blocking; they do not establish that the vending-machine generation bug is fixed.

## Passage scoring regression follow-up

Intermediate v5 removed the unvisited/frontier reward floor from used passages.
At the same 250-decision cap: seed 123 died at decision 189 (182 turns, 44 positions),
seed 456 reached 184 positions (245 turns), and seed 789 reached 43 positions
(247 turns). The old zero-turn door oscillation was absent from the final traces,
but seed 789 alternated between adjacent floor cells for ordinary turns. This
exposed a second scoring issue: even negative-scoring routes could override local
exploration. Version v6 requires a positive route score before taking that route.
Neither change adds a turn cap, forced wait, or permanent prohibition on backtracking.

Version v6 produced the same three-seed results as v5. Inspecting seed 789's
restricted snapshot showed alternate visible paths while the agent reversed
direction between (18,8) and (18,9). Version v7 adds destination commitment to
prevent per-step goal switching, released on arrival, crossing, or an unavailable
safe route. It retains breadth-first shortest-path search on known passable tiles.

## Persistent goals and breakable obstacles

V7 (persistent goals only), 250 decisions per seed:

| Seed | Outcome | Decisions | Turns | Positions | Rooms | Stale decisions |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 789 | budget-incomplete | 250 | 245 | 49 | 3 | 138 |
| 123 | dead | 189 | 182 | 44 | 2 | 60 |
| 456 | budget-incomplete | 250 | 245 | 183 | 3 | 0 |

User observation identified breakable objects as another route obstruction. V8
uses weighted shortest-path search with estimated destruction effort, retaining
goal commitment. Targeted seed 789 retest: 250 decisions, 244 turns, 181 positions,
4 rooms, health 2, zero decisions since a new position. The final trace advances
through new coordinates rather than oscillating. Outcome remains budget-incomplete.
Seeds 123 and 456 have not been reevaluated with v8, so survival/generalization
improvement is not established. All initiated batches finished without interruption.

Validation: 82 tests passed, including passage reward, exhausted goal fallback,
goal commitment/release, breakable obstruction, and weighted detour cases. Only
standalone policy/lab references changed; the game bundle and contracts are unchanged.
