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
