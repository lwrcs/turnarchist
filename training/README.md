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
