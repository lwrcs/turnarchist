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

No final result or promotion decision has been made yet. Preserve the source
checkpoint and use actual matched outcomes to decide the next continuation.
