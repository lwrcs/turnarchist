# DAgger navigation cycle 001

## Decision

`navigation-dagger-fit-001/final.zip` is the new experimental navigation
baseline. It replaces `navigation-spatial-005/final.zip` for subsequent
navigation work, but remains an experimental policy rather than a production
game agent.

This cycle deliberately did not use PPO. The preceding bounded RL cycle
reduced rejected actions but made the agent less safe. The replacement data
collection process lets the current spatial policy act only in calm rooms where
the game's bounded A* helper has a safe frontier route, then stores the A*
direction at the policy's own pre-action state. The conservative baseline
continues to handle threats and interactions.

## Data and offline gate

- `navigation-dagger-001`: 5,253 labeled states across all 64 training seeds.
- `navigation-dagger-fit-001`: spatial-local imitation with 2,000 combat
  pretraining updates and 96 combat samples per mixed batch.
- Selected checkpoint: update 200.
- Seed-held-out navigation-label accuracy: 38.0%.
- Combat agreement: 99.07%, passing the 99% gate.

## Independent gameplay results

All results use stochastic sampled actions and the same bounded 256-action
episode budget. Death counts include rows whose status is `dead`.

| Held-out seeds | Policy | Rooms | Positions | Deaths | Health lost | Rejected actions | Longest rejected streak |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 12–15 | spatial-005 | 2.50 | 28.50 | 2 | 1.375 | 259.75 | 61.25 |
| 12–15 | dagger-fit-001 | 3.25 | 36.50 | 2 | 1.125 | 241.75 | 50.75 |
| 4–11 | spatial-005 | 3.25 | 29.125 | 3 | 0.875 | 341.625 | 173.125 |
| 4–11 | dagger-fit-001 | 3.125 | 33.25 | 2 | 0.750 | 237.00 | 51.25 |

The confirmation slice has a small room-count decrease (0.125), but the
candidate advances farther within rooms, has one fewer death, loses less
health, and cuts rejected actions and rejection streaks substantially. It
therefore meets the promotion rule: improved survival with meaningful progress
gain on an independent confirmation slice.

## Next experiment

Run a second DAgger collection from this promoted baseline. Preserve the
current safety restriction and combat gate. Before considering PPO again,
measure whether a second correction round improves the same two held-out slices
without trading away survival.
