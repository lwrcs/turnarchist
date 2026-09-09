# Open-room PPO continuation — 2026-09-08

Pilot 003 resumes `imitation-forward-001/final.zip` for 8,192 PPO decisions.
The training checkout stays on `52230fa4`, with two CPU environments, rotated
observations, the existing encoder/reward contract and ten `open-combat`
fixtures. The four previously held-out non-alert arrangements are now training
fixtures; their earlier results remain held-out evidence only for the source
checkpoint. Giant pocket and skeleton choke are separate stress tests.

The desktop runs this job under `Turnarchist-Combat-Pilot-003`, with outputs in
`/home/harrison/turnarchist-training/pilot-003`. ComfyUI can continue using the
desktop GPU; this small PPO model and its evaluation use CPU execution.

## Matched evaluation in progress

`Turnarchist-Pilot-003-Comparison` uses a separate checkout pinned to `8ae832d8`.
It reevaluates the source checkpoint in `imitation-forward-001-eval-v2`, waits for
successful training completion, then evaluates the final checkpoint in
`pilot-003-eval-v2`. Both use evaluation plan v2, two seeds per fixture and all
four coordinate views, with random, deterministic and sampled policies.

Each learned policy has 80 common encounters for before/after comparison.
The final checkpoint additionally has 16 stress encounters per policy. Full
output totals are 240 source episodes and 288 final episodes. Stable
scenario-keyed seeds make shared encounters comparable despite the curriculum
expansion. These fixed geometries do not establish dungeon generalization.

## Interim retention diagnostic: 3,840 decisions

An immutable copy in `pilot-003-retention` was audited against the 208 accepted
teacher-forward examples. The source model matched every teacher action, with
mean teacher-action probability 0.99985. The interim model matched 194/208
(93.27%), with mean teacher-action probability 0.93103. The fourteen changed
choices include repeats of seven examples involving alert armored enemies and
giants, across particular viewing directions.

This is a rehearsal diagnostic, not a success measure. A changed choice can be
another valid dodge or reposition. Evaluation must determine whether those
choices cost health, lose clears, or improve the fight. The report identifies
scenario, rotation and decision for trace review. Periodic snapshots include
collected decisions before the corresponding PPO update; final checkpoints
include the last update.

## Memory interruption and recovery

The reference v2 evaluation finished: deterministic clears 80/80 with 72
full-health clears; sampled clears 79/80 with 68 full-health clears.

The continuation accumulated roughly 4.8 GiB RSS per training renderer and
eventually exhausted the dedicated Linux environment's 16 GiB RAM and 4 GiB
swap. An additional teacher collection was interrupted with exit 130 to release
memory; its partial output is not a usable demonstration dataset. Closing
ComfyUI freed Windows memory but did not eliminate this separate Linux limit.
Training advanced to 7,936 decisions, then stalled again. Graceful process
interrupts did not release the stuck browsers; only the dedicated training
distribution was terminated and restarted. Windows and the Mac server were not
restarted.

The 7,936-step checkpoint loads successfully with its original two-environment
configuration; no final checkpoint was produced. A context-recycling fix now
refreshes game pages every 64 episodes, without changing the game contract or
policy inputs. Recovery must use a fresh output directory, preserve this run,
and record the source checkpoint. It restarts game episodes and rollout
collection; it is not a bit-identical continuation of the interrupted rollout.

Validation passed 29 Python tests and a real-game reset/recycle comparison. The
same seeded armored-zombie fight produced identical observations and traces,
cleared in three decisions at full health, closed its previous page, and left
exactly one live browser context.

The recovery continuation uses a fresh `pilot-003-recovery-001` output and 2,048
additional decisions from the saved 7,936-step model. Its nominal counter will
therefore reach 9,984; this includes the source snapshot's pre-update collection
count and is not a claim to have preserved the interrupted rollout. A single
sequential job performs training, then all-view v2 evaluation and comparison
against the completed reference evaluation. Extra demonstration jobs remain off.

## Completed recovery evaluation

The sequential job finished with exit code 0 and all 288 evaluation episodes.
Recovery saved its final model at nominal step 9,984. Monitored Linux memory
during recovery reached about 6.4 GiB used with no swap use; these snapshots are
not a continuous peak measurement. Memory returned below 1 GiB after evaluation.

On the 80 exactly matched open-room encounters per policy:

| Metric | Imitation source | PPO recovery |
| --- | ---: | ---: |
| Deterministic clears | 80/80 | 80/80 |
| Deterministic full-health clears | 72/80 | 56/80 |
| Sampled clears | 79/80 | 80/80 |
| Sampled full-health clears | 68/80 | 57/80 |

All 48 deterministic basic/armored encounters still preserved health. The alert
giants dropped from 16/16 full-health clears to 6/16, and non-alert giants from
8/16 to 2/16. Exact matching identified 18 deterministic encounters with lower
remaining health and two with higher remaining health. Clear rate alone would
have hidden this regression. The final teacher-action agreement was 87.5%, across
both 208 examples and 104 unique observation/action pairs; real-game health loss
provides the relevant confirmation that some changes were harmful.

The 16 additional stress encounters were not matched to the source evaluation.
Deterministic play cleared 16/16 and sampled play 15/16; each preserved full
health in six encounters. Giant-pocket clears all cost health. These are fixed
stress fixtures, not evidence that arbitrary clutter is solvable at starter gear.

The PPO recovery is retained as an experiment, not promoted over the stronger
health-preserving imitation reference. The next controlled cycle uses
`teacher-open-002` to collect all ten open-room arrangements with browser
recycling enabled, fits a separate `imitation-open-001`, and evaluates it against
both previous references. The incomplete `teacher-open-001` is excluded.

The user requested a capability comparison through Signal. The report was sent
and the request acknowledged: controlled duel success has not established an
overall performance gain over the programmed baseline. It retains navigation,
room-transition and food-use logic outside this learned model's five-action
contract. The completed PPO health regressions and next experiment were sent in
a follow-up update.
