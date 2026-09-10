# Recovery rehearsal trial — September 10, 2026

Trial `recovery-training-001` completed 16,384 additional PPO steps from
`daytime-001-r4/final.zip`, adding eight recovery demonstrations weighted 0.25
alongside unchanged original navigation/combat rehearsal. Eight workers;
learning rate 0.00000125. Code c6539557; 66 tests passed before launch.
All artifacts remain under `/home/harrison/turnarchist-training` on the desktop.

## Four-seed unassisted selection evaluation

| Mode / model | Deaths | Mean rooms | Mean positions | Mean health lost |
|---|---:|---:|---:|---:|
| Deterministic source | 0 | 2 | 12.5 | 0 |
| Deterministic recovery candidate | 0 | 1.75 | 11.5 | 0 |
| Sampled source | 1 | 3.75 | 71 | 1.25 |
| Sampled recovery candidate | 2 | 4 | 55.25 | 1.75 |

Neither candidate mode reached a deeper floor. Survivors exhausted their action
budget; they are not wins. The controller's permissive screening gate advanced
the candidate to audit on the small mean-room gain, despite worse deaths and
positions. Its `selectedModel` field is an experimental selection, not a validated
replacement or a game deployment.

Final trace inspection found doorway alternation in three of four deterministic
candidate episodes, exactly as in the source and the matched nighttime-003 first
round. The fourth candidate tail oscillated within one room; the source had
repeated blocked moves there. This targeted intervention did not establish a
reduction in doorway cycling. Tail-only inspection is not whole-episode incidence.

## Audit cutoff and status

The reference finished all 24 seeds in random, deterministic and sampled modes.
The candidate completed random mode and 14 deterministic episodes before the
14:00 UTC / 10 AM Eastern hard cutoff; sampled mode never began. Partial episode
logs are preserved, but there is no complete candidate deterministic report or
paired fresh-seed audit. Do not compare incomplete/unmatched aggregates as proof
of generalization. Independent combat retention has not been evaluated.

The controller stopped at the deadline, launcher exit 1 reflected the time-limit
stop, and a subsequent process check found no active training/evaluation worker.
The heartbeat was paused. No model was deployed; retain the previous best
checkpoint pending stronger evidence.

## Next justified work

Before another PPO continuation, measure whether recovery labels are learned on
separate recovery episodes and whether their relevant history is represented in
the policy input. Broaden the three-episode recovery set if needed. Reuse finished
reference results and evaluate only missing candidate seed/mode work to avoid
spending most of a time budget on repeated audits. Require explicit loop-recovery
and combat-retention evidence before promotion; the current broad exploration
gate alone is insufficient for this targeted task.
