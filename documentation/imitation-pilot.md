# Combat imitation experiments — 2026-09-08

The programmed `explore-combat-v22` teacher cleared all 24 encounters in
`teacher-001` without health loss: skeleton, zombie and alert armored zombie,
two seeded repeats in each of four coordinate frames. The dataset contains
48 decisions, 24 distinct learner observations, and no conflicting labels for
identical observations. Giant fixtures are excluded from the dataset.

Teacher observations come only from restricted player perception. It can use
more traits/history than the small learned policy. Labels are mapped into the
learner's coordinate frame; environment execution maps them back. Raw outcomes
are retained, while fitting accepts only cleared, no-health-loss episodes.

## 200-epoch fit: imitation-001

Committed runner `537cda55`, 48 examples, two-worker configuration for a later
PPO continuation. Offline fitting generated zero PPO/game decisions and reduced
training cross-entropy from 1.6085 to 0.2892. No layers were frozen. This is not a
validation score or evidence of broad learning.

The real-game evaluation ran 60 episodes: random, deterministic learned and
sampled learned policies, each on five fixtures in all four coordinate frames.
Both learned plans matched the random scenario/seed/rotation plan.

| Fixture | Deterministic clears | Sampled clears | Random clears |
| --- | ---: | ---: | ---: |
| Skeleton | 4/4 | 4/4 | 1/4 |
| Zombie | 4/4 | 4/4 | 4/4 |
| Alert armored zombie | 4/4 | 4/4 | 0/4 |
| Alert giant skeleton | 1/4 | 4/4 | 0/4 |
| Alert giant zombie | 1/4 | 0/4 | 0/4 |

All non-clears were deaths, with no budget-incomplete episodes. Skeleton/zombie
clears retained both health. Three of four deterministic armored-zombie clears,
and all four sampled clears, lost one health. All successful giant episodes also
lost one health. The teacher's no-damage strategy was therefore not yet reliably
copied despite all basic fixtures clearing. The apparent sampled giant-skeleton
result is only four correlated fixed-layout episodes; it is not a graduation gate.

The next experiment fits the same examples for 2,000 epochs and repeats actual
evaluation with two seeds per fixture/view for each policy. This tests whether
the available examples can be learned more faithfully, while preserving the
first checkpoint. New-layout coverage and a broader curriculum remain separate
requirements regardless of training loss.

## 2,000-epoch fit: imitation-002

The same 48 examples reached training cross-entropy 0.00049. The 120-episode
evaluation used two seeds per fixture/view for random, deterministic and sampled
policies. All plans matched. Both learned policies cleared all 40 of their
encounters: 8/8 in each fixture. The 24 basic cases preserved full health; all
16 giant cases lost one health. There were no deaths or budget-incomplete results.

The traces locate the giant damage after the first successful dodge and side hit.
The policy then attacks again when it needs another dodge. It has copied the
short armored-zombie sequence but has not learned to repeat the cycle for an
enemy that survives longer and turns. This is distinct from choosing the wrong
initial dodge direction.

The next explicit `forward` curriculum includes armored skeletons and alert
giants in training. Their non-alert starting arrangements are separate held-out
fixtures. Future reports must not describe the trained giant variants as unseen
enemies. The starter checkpoints and original transfer results remain preserved.

## Expanded teacher: teacher-forward-001

All 48 episodes cleared with full health, yielding 208 decisions. The six
fixtures include both alert armored variants and both alert giants alongside
basic skeletons/zombies. Giant-skeleton demonstrations take nine decisions and
giant-zombie demonstrations six; armored skeletons take five. These longer
sequences supply the repeat-dodge behavior absent from the original dataset.

`imitation-forward-001` fits these examples for 2,000 epochs, reaching training
cross-entropy 0.000141. Its separate evaluation checks all six training fixtures
and four held-out non-alert starting arrangements in all four views. This remains
a small fixed-fixture curriculum, not a general dungeon policy.

The completed expanded evaluation cleared all 40 deterministic encounters,
36 with full health. All 24 training encounters, including the repeated giant
cycles, preserved health. Four of the eight held-out giant fights lost one
health. Sampled play cleared 39/40, with one death against a held-out armored
skeleton. All sampled training fixtures also cleared at full health.

This checkpoint is the starting point for continued PPO under `open-combat`,
which adds the four non-alert arrangements to training. Their earlier results
remain held-out evidence for this checkpoint; they are training fixtures for the
continuation. Giant-pocket and skeleton-choke cases are separate stress tests.

## Full open-room teacher and imitation-open-001

After the PPO health regression documented in `training-pilot-003.md`,
`teacher-open-002` collected 80/80 full-health clears across all ten open-room
arrangements, yielding 344 decisions. The incomplete prior `teacher-open-001`
was excluded. Fitting a separate model for 2,000 epochs reduced training loss
from 1.5923 to 0.0000270; no PPO decisions occurred during this fit.

The completed v2 evaluation ran 288 episodes and the cycle exited successfully.
Both deterministic and sampled policies cleared all 80 open-room encounters at
full health. Deterministic comparison against the original forward model found
eight health improvements and no regressions in the shared 80 cases. The same
comparison against PPO recovery found 24 health improvements in these duels.

The model did worse on the 16 obstacle stress encounters. Deterministic play
cleared 0/8 giant pockets and 4/8 skeleton chokes; sampled play cleared 1/8 pockets
and 3/8 chokes. All other stress attempts were budget-incomplete, not victories
or deaths. No stress clear preserved full health. PPO recovery had cleared
16/16 deterministic and 15/16 sampled stress attempts. This is therefore a
better open-room reference, not a universally better policy.

The next controlled PPO trial initializes from this clean-duel checkpoint and
adds pocket/choke cases as explicitly declared training fixtures. It uses a
learning rate of 0.00003, an entropy coefficient of 0.01, and a KL early-stopping
target of 0.01. This tests adaptation with smaller updates and exploration;
retention must still be verified. Harder giant/armored clutter with support
enemies remains separately labeled stress evaluation. All fixtures retain fixed
geometry; none of these scores demonstrates arbitrary-room generalization.
