# Combat training pilot

This is the first learned-policy pilot, using real browser gameplay on the
Windows desktop under WSL. It does not replace the programmed lab policy.

Activate `/home/harrison/turnarchist-training/.venv` in `TurnarchistTraining`.
From the repository root:

```sh
python training/combat_pilot.py --smoke --out ~/turnarchist-training/pilot-smoke
python -m unittest discover -s training -p 'test_*.py'
python training/combat_pilot.py --steps 2048 --out ~/turnarchist-training/pilot-001
```

Use a dedicated output directory per run. For a continuation:

```sh
python training/combat_pilot.py --steps 2048 --resume ~/turnarchist-training/pilot-001/checkpoint.zip --out ~/turnarchist-training/pilot-002
```

Resume restores policy/optimizer state and starts fresh episodes. It does not
restore the interrupted game or rollout, or promise bit-identical continuation.
Schema, reward and game-contract mismatches reject loading. The manifest also
records Git identity; do not change game files during a run.

The observation is a 13x13 player-relative crop of **restricted** perception,
with two frames, explicit known/unknown channels, full identified entity
footprints, health, hitwarnings and current weapon damage/turn-cost traits.
Enemy class names, diagnostic room data and hidden enemy counts never enter the
policy. This initial action set contains four directional actions and Wait;
crafting, healing, equipment changes, spells and exploration are not trained.
No per-world-turn action cap is imposed. Episode decision budgets produce
truncations with bootstrapping, not deaths or forced Wait actions.

Reward v1: +10 for a cleared encounter, -10 for death, -3 per health lost,
-0.01 per attempted decision. Encounter completion is a supervisor signal, not
an input feature. An enemy leaving perception does not earn a kill reward.
PPO uses a small 128x128 MLP on CPU; GPU functionality is verified separately.
The browser simulation is expected to dominate early runtime.

Training rotates simple skull, zombie and alert armored-zombie fixtures. Giant
alert encounters are separate transfer evaluations. These fixtures have fixed
geometry, so different seeds are **not** independent layout generalization.
The initial random and final deterministic evaluations are small diagnostics,
not robust estimates or a curriculum graduation gate.

Outputs: manifest, episode JSONL, periodic checkpoint (256 decisions), final
model, random/final evaluations, completion marker and one latest replay.
The final replay replaces the previous one to bound disk use. This pilot retains
sandbox replay limitations documented in agent-training.md. Errors fail the run;
never report them as deaths or silently reset over pending game callbacks.

For unattended execution, keep a Windows `wsl.exe` process alive using a
Windows scheduled task under the training user, and keep the desktop awake.
A tmux-only launch did not survive the Windows SSH session ending on this
machine. Pilot 001 uses the on-demand task `Turnarchist-Combat-Pilot-001`,
with a 12-hour execution limit; it does not automatically restart after failure.
Inspect its exit-code file and log/progress after reconnecting. The runner starts its own
loopback-only HTTP server on an available port and isolated browser profile;
it never touches the Mac's port-8000 server. Browser requests to external hosts
are blocked, and service workers are disabled.

Evaluate a saved checkpoint without further learning:

```sh
python training/combat_pilot.py --evaluate ~/turnarchist-training/pilot-001/final.zip --eval-repeats 5 --out ~/turnarchist-training/pilot-001-eval
```

This runs the random and deterministic learned policies on the same episode-seed
plan across training fixtures and giant transfer fixtures. Seeds do not depend
on how many actions earlier episodes took. Repeats still use fixed fixture
geometry; they do not provide randomized-layout coverage. Evaluation performs
no learning updates. Existing run directories are refused to protect results.

## Coordinate-frame augmentation (encoder v2)

Pilot 001's deterministic policy chose right on every action. Add
`--rotate-frames` to train a new policy with random per-episode quarter-turns
of the observation grid and inverse-mapped directional actions. Wait and scalar
traits remain unchanged. Both history frames use the same rotation. This changes
what direction the policy sees, not the real game rules or fixture geometry;
it does not count as room-layout variation. Episode records include the rotation
and traces distinguish policy actions from actual game actions.

```sh
python training/combat_pilot.py --rotate-frames --steps 8192 --out ~/turnarchist-training/pilot-002
```

Use the flag for evaluation/resumption of that checkpoint too. Its encoder v2
manifest prevents silently loading it into the unrotated v1 input contract.

After an evaluation completes, summarize it with:

```sh
python training/report.py ~/turnarchist-training/pilot-001-eval
```

The report explicitly checks whether episode seeds/scenarios/rotations match,
keeps incomplete budgets separate from clears/deaths, and reports dominant
policy actions and distinct positions. Check action distributions by scenario:
a dominant action can be correct for a simple fixture, but repetition without
completion on hard fixtures deserves inspection.

For rotated checkpoints, cover every view explicitly with `--eval-all-rotations`:

```sh
python training/combat_pilot.py --rotate-frames --evaluate ~/turnarchist-training/pilot-002/final.zip --eval-repeats 2 --eval-all-rotations --out ~/turnarchist-training/pilot-002-eval
```

This runs two seeds per fixture in each of four coordinate frames, for 40
episodes per policy (80 total). Each group of four shares the underlying game
seed, and the random and learned policies receive the same complete plan.
Reports include outcomes by rotation and both policy/world action counts.
The four views are correlated tests of the same encounter, not four independent
layouts. This evaluation option leaves checkpoint inputs and training unchanged.

New traces also record the game's `recorded` and `turnDelta` results. These are
diagnostics only, excluded from policy inputs and rewards. An attack can remain
on the same tile and still be a recorded action; position repetition alone does
not identify a wall bump. Report coverage counts distinguish old traces with
missing fields from confirmed unrecorded decisions or zero-turn actions.

Add `--eval-stochastic` to checkpoint evaluation to also sample actions from the
learned policy, saving a separate `stochastic-evaluation.json`. Deterministic
results still use the highest-probability action and remain in `evaluation.json`.
Sampled evaluation uses the same encounter plan, with a reproducible CPU sampler
whose random state is restored afterward. It performs no learning updates.
Compare both: a repeated deterministic choice does not by itself prove that all
action probability has collapsed onto that direction. With two seeds and all
four rotations, this optional third policy brings the five-fixture total to 120
episodes. It does not make the fixed layouts independent samples.

## Collection throughput

`benchmark.py` measures isolated browser environments with random actions. It
does not train a model, speed up animations, or change the game contract:

```sh
python training/benchmark.py --envs 1 --steps 128 --out ~/turnarchist-training/throughput-001
python training/benchmark.py --envs 2 --steps 128 --out ~/turnarchist-training/throughput-002
```

Each worker has its own browser, loopback server and output directory. The report
separates startup from collection time and verifies identical game contracts.
Short random-action throughput is a sizing measurement, not evidence of faster
learning or equal episode outcomes. Keep active training checkouts unchanged;
run development benchmarks from a separate checkout.

On this desktop, the initial 128-decision benchmark measured 3.41 decisions/s
with one environment and 6.50 with two (startup excluded), while pilot 002 kept
running separately. This is a short throughput measurement, not a learning result.

Training accepts `--envs 2` or `--envs 4` for separate browser workers. The total
rollout remains 256 decisions: each worker contributes `256 / envs` decisions
before an update. Batch size, epochs, reward and encoder stay unchanged. Worker
episodes and latest replays live in `worker-N` directories; root-level episode
records belong to evaluation. Checkpoint evaluation still uses one environment.
Resume requires the original worker count to avoid silently changing rollout
collection. Old checkpoints without this metadata are treated as single-worker.

## Baseline demonstrations and an imitation warm start

```sh
python training/collect_teacher.py --repeats 2 --out ~/turnarchist-training/teacher-001
python training/imitate.py --data ~/turnarchist-training/teacher-001 --envs 2 --epochs 200 --out ~/turnarchist-training/imitation-001
```

The collector runs the existing programmed baseline on the three training
fixtures in all four views. It saves learner observations and mapped action
labels, with separate episode outcomes. Failed and damaged runs remain in the
raw dataset; imitation selects only completed encounters without health loss.
Giant transfer fixtures are excluded. The teacher itself uses restricted
perception, but has more traits and history than the small learner's encoder.

The initial collection cleared 24/24 encounters with full health, producing only
48 decisions from fixed layouts. These are tiny, repeated examples, not a broad
demonstration corpus. Offline cross-entropy fitting initializes the policy; it
does not generate game experience, train the value head, or freeze any layers.
The checkpoint records zero PPO decisions and can later resume real PPO with
its configured worker count. Low training loss is not evidence of combat skill:
evaluate the saved checkpoint in actual games, including held-out giants, before
deciding whether to continue from it.

New episode records carry a `phase` label: training, random/deterministic/sampled
evaluation, teacher demonstration, or throughput benchmark. Keep these sources
separate when aggregating outcomes. Older unlabelled logs should not be assumed
to contain only training episodes; initial and final evaluations may be mixed in.

## Repeated forward-facing combat

`--curriculum forward` explicitly adds alert armored skeletons and both alert
giants to the three starter training fixtures. This addresses the longer
dodge–hit–dodge cycle after an enemy survives and turns again. Once included,
giants are no longer labeled unseen training enemies. The four non-alert armored
and giant fixtures become held-out starting arrangements. They still use fixed
geometry and do not establish general dungeon performance.

Use the curriculum flag when collecting demonstrations, training PPO, and
evaluating its checkpoints. Imitation inherits the dataset's declared curriculum.
Dataset loading checks actual episode scenarios as well as the manifest; reports
label training versus held-out fixtures. Evaluation rejects an incorrect
curriculum flag to avoid silently mislabeling training encounters as transfer.

Evaluation and PPO continuation manifests record the source checkpoint's path,
SHA-256, curriculum and Git identity. This links results to an exact saved model,
even when a later run has a different curriculum or output directory.

New records include starting health. Reports distinguish clears that preserve
that health from damage trades. For older results without starting health, this
metric stays unknown rather than assuming a starting value.

`--curriculum open-combat` continues from forward combat with the four non-alert
starting arrangements now included in training (ten open-room fixtures total).
The giant pocket and skeleton choke become separately labeled held-out stress
fixtures. Do not interpret their failure as proof the normal open-room curriculum
failed or that starter equipment should solve every cluttered encounter.
Changing the curriculum during an explicit PPO continuation is allowed and
recorded in checkpoint lineage; encoder, reward and game compatibility still apply.

Evaluation plan v2 keys each seed by fixture and repeat, so adding or reordering
fixtures does not change shared encounters. Old v1 evaluation files remain valid
within-run comparisons, but must be rerun under v2 for these curriculum-spanning
comparisons. Use `python training/report.py AFTER --against BEFORE` (optionally
`--stochastic`) to count exact matched outcome transitions and remaining-health
changes. Unmatched encounters are counted separately, duplicate identities fail,
and known mismatched game contracts reject comparison. A regression cannot be
hidden by adding easier fixtures to the newer evaluation.
Individual health regressions include encounter identities for trace review,
even if the average remaining health improves.

Audit retention of teacher examples without launching a game or updating weights:

```sh
python training/audit_demonstrations.py --checkpoint RUN/final.zip --data DATASET
```

This reports action agreement, teacher-action probability, and disagreements by
scenario/view/decision, both across all examples and unique observation/action
pairs. It checks encoder/game compatibility. It is a rehearsal diagnostic, not a
success score: the policy may learn another valid dodge, and the dataset may
already have been used in training. Confirm suspected regressions with real-game
evaluation. Use an immutable copy when auditing an actively replaced checkpoint.
