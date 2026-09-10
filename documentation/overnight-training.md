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

## Daytime rehearsal experiment

`--adaptive --rehearsal` enables a small supervised SGD update between PPO
rollouts, using 32 navigation and 32 combat demonstrations per practice batch.
This is an interleaved experiment, not an implementation of a joint BC+PPO loss.
The first rollout receives no practice update, preserving PPO's on-policy
collection: subsequent practice occurs after the previous PPO training and
before collecting the next rollout. Practice does not modify stored rollout
log-probabilities or count as new environment experience. SGD is stateless,
uses learning rate 0.001 and gradient clipping at 0.5, and leaves PPO's Adam
moments intact. Dataset hashes and settings are recorded in the training
manifest. Resuming restarts the demonstration sampler's fixed seed; evaluation
uses the saved policy with no rehearsal. The current separate value network
receives no rehearsal gradient.

Navigation and combat datasets must match the live game contract and existing
validated encoders. No rewards, helper actions or policy observations change.
The daytime controller still starts from the original imitation checkpoint so
its first trial can be compared to the prior PPO-only trial. All candidates are
preserved. The audit uses 16 seeds and reports only indices 8–15, excluding the
four selection seeds and four reserve seeds already examined overnight.

## Eight-worker continuation

The September 10 four/eight worker benchmark measured 14.67 versus 25.44 game
decisions per second over 1,024 random decisions (collection time only). This
short test suggests about 1.73x throughput, not a guarantee for long PPO runs;
worker seed mixtures differ and startup/cache effects are excluded.

`--reconfigure-workers` permits explicitly loading an existing checkpoint into
another worker count. Its per-worker rollout length and weights are preserved;
loading the current 64-step checkpoint into eight workers increases the rollout
batch from 256 to 512. This is an optimization change, recorded in the manifest,
not an identical training trajectory or a changed observation/action contract.
Tests verify weight equality and the rebuilt rollout-buffer dimensions.

The controller accepts explicit source model/evaluation, worker count, starting
learning rate, and audit start index. Nighttime continuation starts from the
selected daytime rehearsal candidate instead of discarding that progress.
New independent audit seeds must exclude previously inspected seeds; start 16
uses indices 16–23 when rehearsal is enabled. All reference artifacts remain.

Existing traces show deterministic repeated blocked moves and repeated
Move/DismissInteraction loops at one position. These are confirmed behaviors,
not proof of a bug in the helper. They warrant targeted training/observation
analysis after the current experiment; more memory or a larger GPU alone does
not fix them.

## Failed-action rehearsal

`--rejection-feedback` (requires rehearsal) adds a bounded buffer of experienced
failed directional actions. Eligibility requires an unrecorded action, zero
world turns, identical before/after policy observations, and a nonterminal
transition. Recorded attacks, pushes and interactions, visible changes, and
terminal transitions are excluded. Nothing is masked or forced at inference.

Between PPO rollouts, rehearsal also samples 32 of these examples and adds
0.5 times negative log probability of choosing any alternative action. A stable
log-sum-exp calculation avoids saturation from clamping the rejected action's
probability. The buffer holds at most 256 examples and resets on resume; settings
are recorded in the manifest. This is a supervised optimization experiment,
not a changed game reward, input encoder or helper policy. Evaluation has no
learning. Identical-observation eligibility is conservative and may miss some
first failed actions because the two-frame history has changed.

This targets observed blocked-move loops. It intentionally does not label the
recorded Move/DismissInteraction loops as invalid: those require separate
diagnosis and may represent legitimate interactions.


Feedback version 2 samples unique float32 observation/action pairs uniformly,
with a 256-pair bound and least-recently-seen eviction. Repeated identical wall
bumps refresh one entry instead of crowding out other examples. Coefficient,
update frequency, action eligibility and game contracts remain unchanged.
Nighttime-004 version 1 regressed after 16,384 additional steps: sampled mean
positions 35.25 versus 74.75 in the matched nighttime-003 first round;
deterministic positions 8.75 versus 10.25. The selected daytime checkpoint was
preserved. Deduplication is a hypothesis to test, not evidence of improved play.
