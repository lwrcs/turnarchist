# Overnight training results — September 9, 2026

The adaptive experiment `overnight-002` completed successfully (launcher exit 0)
on desktop revision `20468f9d`. Five trials used 147,456 new learner decisions
in total. These are separate trials with rollback, not 147,456 steps accumulated
in the selected model. The earlier `overnight-001` used another 16,384 decisions.

Selected candidate: `/home/harrison/turnarchist-training/overnight-002-r4/final.zip`.
Original reference: `/home/harrison/turnarchist-training/navigation-model-001/final.zip`.
Both and all rejected candidates remain preserved. Trial four added 32,768 PPO
steps to the original imitation checkpoint at learning rate 0.00000125. Trial
five continued it for another 32,768 steps but regressed and was not selected.

## Results

Each row below summarizes four episodes on the indicated seed set. Validation
seeds were used repeatedly for model selection. Reserve seeds were excluded from
those selection decisions. Budgets were 512 game actions; surviving the budget
is an incomplete run, not a win.

| Seed set / policy | Original rooms | Candidate rooms | Original deaths | Candidate deaths | Original unique positions | Candidate unique positions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Validation / deterministic | 1.75 | 1.75 | 0 | 0 | 12.25 | 12.75 |
| Validation / sampled | 3.25 | 3.50 | 2 | 1 | 64.25 | 57.75 |
| Reserve / deterministic | 1.00 | 1.25 | 0 | 0 | 11.50 | 10.50 |
| Reserve / sampled | 2.25 | 2.75 | 2 | 1 | 42.00 | 39.25 |

Neither model reached a deeper floor in these evaluations. Reserve sampled
health lost fell from 1.125 to 0.75 on average. The random baseline visited 4.0
rooms on reserve seeds but died in three of four episodes. There is a modest
candidate gain on unseen seeds, but the sample is too small to establish reliable
superiority, and exploration remains weak, especially with deterministic actions.
Lower tile coverage alone cannot distinguish efficient routing from neglected
branches; trace-level diagnosis remains necessary.

## Next experiment

Prefer testing continued demonstration rehearsal alongside PPO over further
learning-rate reductions. The recent NetHack literature review supports combined
imitation and RL as a candidate approach, not proof that forgetting explains
these particular results. Keep reward and observation contracts unchanged for
that comparison, verify retention on held-out combat and navigation tasks, and
use a fresh evaluation seed set now that the reserve set has been inspected.

The overnight window has less than an hour remaining, so no additional training
job is started. Hourly supervision is paused after successful completion.

Authoritative desktop artifacts under `/home/harrison/turnarchist-training/`:
`overnight-002/status.json`, `overnight-002/rN-report.json`,
`overnight-002/reserve-seed-audit.json`, `overnight-002-audit-reference/`,
`overnight-002-audit-candidate/`, and `overnight-launch-002/exit-code`.
