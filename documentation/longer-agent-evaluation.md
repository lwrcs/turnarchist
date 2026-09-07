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
