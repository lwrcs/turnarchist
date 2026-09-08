# Rotated-view combat pilot — 2026-09-08

Pilot 002 trains a fresh PPO policy for 8,192 decisions with encoder v2's
per-episode coordinate-frame rotation. It keeps the first pilot's reward,
starter equipment, fixed encounter geometry and three training scenarios.
The training checkout remains on `8062c2d0` throughout the run.

## Interim checkpoint: 2,048 decisions

A separate evaluation checkout (`e6016955`) evaluated an immutable checkpoint
copy while training continued. Each of five fixtures ran with all four coordinate
rotations for both random and deterministic policies: 40 episodes total.
Underlying seeds and rotations matched between policies. Output lives in
`/home/harrison/turnarchist-training/pilot-002-interim` on the desktop.

| Fixture | Learned clears | Deaths | Budget incomplete | Random clears |
| --- | ---: | ---: | ---: | ---: |
| Skeleton | 1/4 | 0 | 3 | 1/4 |
| Zombie | 1/4 | 0 | 3 | 4/4 |
| Alert armored zombie | 1/4 | 0 | 3 | 0/4 |
| Alert giant skeleton | 0/4 | 1 | 3 | 0/4 |
| Alert giant zombie | 0/4 | 1 | 3 | 0/4 |

Every deterministic action was policy-direction down. The easy fixtures cleared
only in the rotation mapping down to world-right. The armored zombie cleared
with two frontal attacks, losing one health; this was damage trading, not a dodge.
The same frontal sequence died against both giant variants. Other views ran to
the room edge and exhausted their decision budget. This checkpoint has not
demonstrated reliable combat strategy or rotation robustness.

These are highest-probability actions. They do not establish that the policy's
entire probability distribution collapsed onto one direction. Follow-up
evaluation also measures reproducibly sampled actions, kept separate from
deterministic results. The full training run continues without changing reward
or inputs in response to this interim result.

All four views share fixed fixture geometry. They test coordinate dependence,
not independent layouts or full-dungeon generalization. Periodic checkpoints
are saved before the current rollout's PPO update; their step counter includes
that collected rollout. The final checkpoint includes the final update.
