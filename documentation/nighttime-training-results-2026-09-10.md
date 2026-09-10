# Nighttime training results — September 10, 2026

The selected checkpoint remains `daytime-001-r4/final.zip`. No experiment
established deeper-floor progress. Training and evaluation artifacts are preserved
under `/home/harrison/turnarchist-training` on the desktop.

## Matched reserved-seed comparison

Nighttime-006 evaluated the earlier PPO-only checkpoint `overnight-002-r4/final.zip`
on the same 16 seeds as the existing daytime audits. The table uses only indices
8–15, which were not used to select either trained checkpoint. Evaluation contracts
and seed/rotation pairs passed the paired-report checks. Eight episodes per row;
budget survivors are incomplete runs, not wins.

| Policy / checkpoint | Deaths | Mean rooms | Mean positions | Mean health lost |
|---|---:|---:|---:|---:|
| Sampled original imitation | 5 | 2.625 | 56 | 1.375 |
| Sampled PPO-only | 2 | 2.375 | 51.75 | 0.5625 |
| Sampled PPO + rehearsal | 0 | 2.5 | 65.75 | 0.5 |
| Deterministic original imitation | 0 | 1.5 | 25 | 0.3125 |
| Deterministic PPO-only | 1 | 1.375 | 20.5 | 0.375 |
| Deterministic PPO + rehearsal | 1 | 1.625 | 19.75 | 0.375 |

Every row had zero deeper-floor episodes and zero unsupported decisions.
This small matched comparison supports retaining rehearsal, especially for sampled
survival. It does not establish statistical significance or a general improvement
in dungeon completion. Rehearsal visits slightly fewer rooms than original imitation
in sampled mode despite better survival.

## Rejected continuations and bottleneck

Nighttime-003 ran 49,152 additional steps; nighttime-004 and nighttime-005 each
ran 16,384 additional steps. None replaced the selected checkpoint. Eight-worker
collection reached roughly 25 steps/second. Model step counters include resumed
history and should not be mistaken for additional work.

Nighttime-004 added failed-action feedback. Nighttime-005 deduplicated its buffer.
The latter improved sampled positions versus 004 (50.75 versus 35.25), but still
regressed against the selected source. All four 005 deterministic trace tails
cycled across a doorway between two rooms: 64 recorded zero-turn moves each.
These are successful actions, outside the failed-action labeling rule. Sampled
traces also retain blocked moves. No reward, observation, helper or game mechanics
were changed to force progress.

Read-only demonstration audit: 1,376 examples from 16 episodes; action counts
304/417/306/349; 705 examples include a visible door; 819 include a previously
crossed passage. There are 1,374 unique observations and no exactly identical
observations with conflicting action labels. Thus a simple absence of door
features or exact label conflicts does not explain the problem. These counts
do not prove coverage of the learner's looping states.

## Next work and stopping decision

The next justified task is a targeted doorway-cycle recovery benchmark and
teacher-labeled recovery examples from learner-visited states, with consistent
teacher history and held-out scenarios. Retain legitimate backtracking, retreat,
attacking, pushing and zero-turn interactions. Any changed observation or helper
contract requires versioning and compatible baselines.

The overnight diagnostic finished successfully. No further unattended training
is launched: another feedback-weight sweep is not supported by these results,
and a recovery curriculum needs deliberate implementation and validation.
The hourly heartbeat is paused early rather than consuming usage while idle.
All checkpoints remain preserved; the selected model is unchanged. Signal stays
paused and the Mac game server is untouched.
