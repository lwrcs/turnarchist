# Recovery learnability diagnosis

The recovery PPO trial did not learn its 91 recovery labels: source teacher-action
agreement was 31.87%, candidate 29.67%; cross-entropy 1.5793 versus 1.5845.
Original navigation agreement was 71.58% versus 70.78%. Combat demonstration
agreement stayed 100% (not a gameplay retention test).

`training/recovery_diagnostic.py` tests recovery learnability without PPO or saved
model weights. It withholds one entire recovery episode at a time, retaining
original navigation/combat rehearsal and the 0.25 recovery loss. Fixed checkpoints
at 0, 100, 500 and 2,000 SGD updates avoid selecting a favorable stopping point.
All interventions from the same episode stay in one fold. Three folds reflect
only three available episodes; these are training-pool diagnostics, not the
separate held-out dungeon evaluation pool.

| Withheld episode | Training rows | Train agreement before → after | Withheld rows | Withheld agreement before → after |
|---|---:|---:|---:|---:|
| 704369741 | 50 | 38.00% → 48.00% | 41 | 24.39% → 26.83% |
| 2040048877 | 56 | 30.36% → 48.21% | 35 | 34.29% → 28.57% |
| 2241350470 | 76 | 28.95% → 40.79% | 15 | 46.67% → 46.67% |

The fixed 2,000-update endpoint improves fitting but does not reliably generalize.
All folds retain 100% combat demonstration agreement; original navigation stays
about 71–72%. Model capacity, optimization and missing history are not ruled out.
These results support broadening episode coverage before another PPO trial.
No diagnostic weights were saved or promoted. Desktop report:
`/home/harrison/turnarchist-training/recovery-learnability-001/report.json`.

The next collection uses training indices 16–63, excluding the original 16 and
all held-out seeds, with the same loop-prone checkpoint and collection protocol.
It preserves the original dataset. Inspect new episode/rotation coverage, labels
and recovery outcomes before fitting or merging datasets. Collection success is
teacher-assisted and must not be reported as independent learner improvement.

## Expanded collection results

`recovery-collection-002` completed all 48 new training seeds with its model
unchanged. The validated dataset contains 32 unique accepted examples from just
two episodes. Three teacher interventions all left the original loop positions.
Action counts are 9/7/7/9; accepted examples cover rotations 1 (19 rows) and 2
(13 rows). There are no conflicting exact-observation labels and no observation
or seed overlap with the original recovery collection. Assisted episode outcomes
were 47 budget-incomplete and one death, not learned-policy evaluation results.

Across the two separate datasets there are 123 recovery examples from five
contributing episodes. They were not merged or used to fit another model. The
extra collection confirms that the narrow doorway trigger yields little data
in ordinary training rollouts; merely adding more seeds is inefficient for this
specific curriculum. Next work should target reproducible loop states and assess
other stagnation modes, while preserving legitimate retreat/backtracking and
keeping training scenarios separate from unassisted evaluation. Teacher escape
does not establish that the learner can recover independently.

Both artifact sets remain preserved on the desktop. Collection is complete and
the monitoring heartbeat is paused pending the next user-directed step.
