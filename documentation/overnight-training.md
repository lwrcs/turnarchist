# Bounded overnight training

`training/overnight.py` runs local CPU PPO and paired evaluation sequentially from
`navigation-model-001/final.zip`. It makes no language-model calls and sends no
notifications. Pass an absolute Unix deadline, an existing artifact root and a
new unique run name. The output directory must not already exist.

The sequence adds 16,384, then up to two batches of 32,768 learner decisions.
Each round evaluates four validation seeds using deterministic and sampled
policies (and a random baseline), checking exact seed/view and contract matching.
The best checkpoint stays separate from the latest safe training checkpoint.
A regression ends training; two rounds without qualifying progress also stop.
These small-sample thresholds are operational guards, not statistical proof of
improvement. Reward, perception and action contracts remain unchanged.

If time allows after an improvement, a paired audit evaluates four additional
seeds excluded from the continuation gates. All reference models and experiment
artifacts are retained. Selection here never deploys a model to the game.

The controller checks the deadline, a run-directory `STOP` file, available RAM,
swap pressure and free disk. It terminates only the subprocess group owned by
its current stage. The runner already writes periodic checkpoints. A fixed
Windows Scheduled Task execution limit provides a second bound; that task must
keep WSL alive after SSH disconnects. No new round starts with less than one hour
remaining, and the absolute deadline may interrupt an unfinished stage.

Read `status.json` for phase, current child PID, selected model, per-round results
and stop reason. Stage logs and paired reports live beside it; training progress
and checkpoints live in the corresponding sibling round directory. Hourly Codex
check-ins are separate from this controller and should inspect compact status,
stay quiet for routine progress, and pause themselves at completion or cutoff.

## Adaptive continuation

With `--adaptive`, the controller tries up to six sequential rounds before the
same absolute deadline. It starts from the preserved imitation checkpoint using
learning rate 0.00001, one third of the earlier PPO rate. A regressing candidate
is retained for diagnosis but never becomes the next source: continuation rolls
back to the best evaluated checkpoint and halves the learning rate. Two neutral
rounds trigger the same adjustment. Failure at the minimum rate of 0.00000125
ends the controller for diagnosis, avoiding identical repeated trials. Runtime
errors and resource pressure still stop immediately. The training manifest
records the override; the saved model retains its schedule and optimizer rate.

The user has authorized hourly supervision to inspect completed experiments and
make small, tested follow-up changes while the checkout is idle. It may then
launch a uniquely named local experiment before the original cutoff. This is
separate from the deterministic controller; changes must be recorded and paired
evaluations remain required. Never mutate a running experiment or replace the
preserved reference with a regressing candidate.
