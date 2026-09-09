# Player-legal action correction — September 8, 2026

The user identified an invalid assumption: players cannot wait freely. They can
spend a turn through real gameplay, including breaking objects, or use the
hourglass's limited charges. The old agent Wait directly ticked the room without
an item. It was an invalid advantage in the offered action space.

Action schema 4 rejects Wait before execution, recording or budget mutation.
The live player action processor also rejects it; historical Wait events remain
replay-only so old recordings can still be inspected. The lab Wait button and
smoke step are removed. Programmed policy v23 reports an unsupported decision
when it has no move instead of inventing a free wait. Hourglass use remains an
inventory action, exposes its turn cost and cannot advance another turn after
its durability is exhausted. No zero-turn preparation cap or forced turn was added.

The pilot now offers four directional actions, which resolve through the real
move/attack/push/break/interact rules. It does not yet offer inventory actions,
including hourglass use. Encoder versions 3 (unrotated) and 4 (rotated) replace
the five-action versions 1/2. Old model and dataset contracts are rejected,
not silently relabeled or resumed. Fresh legal-action demonstrations and
evaluation are required; all historical model files are preserved.

## Audit of recent saved learned evaluations

| Checkpoint evaluation | Deterministic + sampled episodes | Wait decisions |
| --- | ---: | ---: |
| imitation-forward-001-eval-v2 | 160 | 0 |
| pilot-003-recovery-001-eval-v2 | 192 | 0 |
| imitation-open-001-eval-v2 | 192 | 0 |

Those 544 saved learned traces did not use Wait. This does not establish that
all earlier training rollouts or other evaluations were free of it. The old
random controls offered Wait and must not be treated as player-legal baselines.
The terrain experiment using the old action space was stopped, and its
artifacts retained as a retired-contract experiment.

## Fresh four-action reference and next experiment

The replacement `legal-cycle-001` completed with exit code 0 on the desktop,
using revision `4448d789`. Fresh `teacher-legal-open-001` provided 80 episodes
and 344 decisions. `imitation-legal-open-001` was fitted from scratch for 2000
epochs; it did not reuse five-action weights. Its paired v2 evaluation completed
288 episodes (two seeds per fixture, all four coordinate views, three policies).

| Policy | Open clears / 80 | Open full-health clears | Obstacle clears / 16 | Obstacle full-health clears |
| --- | ---: | ---: | ---: | ---: |
| Deterministic learned | 80 | 80 | 4 | 0 |
| Sampled learned | 80 | 80 | 6 | 1 |
| Four-action random | 26 | 15 | 2 | 0 |

These are fixed combat fixtures, not full-dungeon win rates. The two obstacle
fixtures were held out of this imitation dataset.

The next bounded experiment, `pilot-legal-terrain-001`, starts from this fresh
four-action reference. It adds giant-pocket and skull-choke to the ten open
training fixtures, with 8192 PPO decisions, two CPU workers, learning rate
0.00003, entropy coefficient 0.01 and target KL 0.01. Browser contexts recycle
every 64 episodes. These conservative updates are an experiment, not a guarantee
against forgetting.

The sequential desktop launcher is
`/home/harrison/turnarchist-training/legal-terrain-cycle-001/run.sh`
(Windows task `Turnarchist-Legal-Terrain-001`). It pins game/runtime revision
`4448d789`, preserves the source model, and then runs a 336-episode evaluation.
Reports compare exact shared encounters with `imitation-legal-open-001-eval-v2`,
including individual health regressions and sampled play. Heavy giant/armored
clutter remains separate held-out stress coverage, not a must-win requirement
with starter equipment. No model promotion is automatic.

Signal and its recurring listener are paused at the user's request. The desktop
job runs independently; progress checks occur in chat when requested.
