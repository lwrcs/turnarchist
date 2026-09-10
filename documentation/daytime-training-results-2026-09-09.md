# Daytime rehearsal results — September 9, 2026

`daytime-001` completed on revision f8be73e4, launcher exit 0. Five trials
used 147,456 new learner decisions total with rollbacks. Trial four remains the
selected candidate, with 32,768 PPO steps from navigation-model-001 plus
interleaved demonstration rehearsal. Trial five regressed and was preserved
without promotion. No gameplay model was deployed.

Candidate: `/home/harrison/turnarchist-training/daytime-001-r4/final.zip`.
Reference: `/home/harrison/turnarchist-training/navigation-model-001/final.zip`.

## Independent audit

Eight seeds (indices 8–15) excluded from earlier selection and overnight audits.
Each episode has a 512-action budget. All survivors are incomplete runs.

| Policy / measure | Reference | Candidate |
| --- | ---: | ---: |
| Sampled deaths | 5/8 | 0/8 |
| Sampled mean health lost | 1.375 | 0.5 |
| Sampled mean rooms | 2.625 | 2.5 |
| Sampled mean unique positions | 56 | 65.75 |
| Deterministic deaths | 0/8 | 1/8 |
| Deterministic mean rooms | 1.5 | 1.625 |
| Deterministic mean unique positions | 25 | 19.75 |

Neither policy reached a deeper floor. Sampled survival improved on this small
sample, but room progression did not; longer survival also gives more time to
accumulate unique positions. Deterministic results were mixed. This does not
establish overall superiority or that rehearsal beats PPO alone: the prior
PPO-only candidate has not been evaluated on these same eight seeds.

Next useful work: trace-level analysis of repeated helper interactions and
stalled exploration; compare the PPO-only candidate on the same seed set;
check held-out combat/navigation retention before selecting a default model.
Avoid further blind learning-rate sweeps. Future independent audits need new
seeds because these results have now been inspected.

The run completed before the fixed cutoff. With less than an hour left,
no additional training was launched and hourly supervision was paused.
All artifacts remain under `/home/harrison/turnarchist-training/daytime-001*`.
