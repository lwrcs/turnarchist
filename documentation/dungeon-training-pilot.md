# Procedural dungeon training pilot

The first dungeon learner extends the legal four-action combat actor with
player-relative memory of visited tiles. It learns directional exploration and
combat in generated standard maps. A separately logged helper confirms ladders,
dismisses prompts, cancels selections where supported, and consumes exposed
zero-turn healing items. It does not learn spells, crafting, equipment, or food
selection. There is no free Wait action.

Reward and observation contracts are distinct from combat training. Combat actor
transfer preserves its initial action probabilities; new memory inputs start
with zero weights, and the value head and optimizer start fresh. Dungeon
continuation restores its own optimizer and weights with explicit compatibility
checks. Initial, periodic and final checkpoints are preserved.

Each training episode has a total game-action budget, shared by the helper and
learner. No per-world-turn preparation cap or forced turn is introduced.
Incomplete budgets are not wins. The policy receives only restricted perception
plus its own position history. Floor depth is reward/report supervision only.
Tile/room/depth exploration bonuses are paid once per episode, and neither enemy
disappearance nor changes in vertical animation count as progress.

There are 64 declared training seeds and a disjoint held-out seed pool. Paired
initial/final evaluations use exactly the same generated seeds, view rotations,
helper and budget. Reports separate damage, new rooms, visited positions, deeper
floors, deaths and incomplete runs. This first finite sample cannot establish
whole-game mastery, and no promotion is automatic.

## Validation and execution

The initial real-game smoke benchmark ran 128 directional decisions across two
workers and exercised 32-action episode boundaries and resets. Collection took
16.75 seconds: **7.64 decisions/second**, excluding 100.56 seconds of startup.
Linux memory was about 2.2 GiB with no swap during the run. This is a short random
benchmark, not trained-policy speed or a scaling guarantee. The developmental
smoke's worker phase labels say dungeon-training; it performed no learning, as
its complete.json records. The committed benchmark uses a separate benchmark
phase label.

The desktop cycle `dungeon-cycle-001` is designed to run sequentially:

1. A four-worker throughput benchmark, then a 256-decision training preflight and
   short evaluation that must complete successfully before the main experiment.
2. An 8192-decision dungeon pilot initialized from `pilot-legal-terrain-001`, with
   two CPU workers, 512 total game actions per episode, and browser-context
   recycling every 64 episodes.
3. Initial and final checkpoint evaluation on four held-out seeds, with random,
   deterministic and sampled control (24 evaluation episodes total), followed
   by a paired report. Four seeds are an initial diagnostic, not a reliable
   estimate of dungeon success probability.

Windows task: `Turnarchist-Dungeon-Cycle-001`.
Launcher, log and exit status live under
`/home/harrison/turnarchist-training/dungeon-cycle-001/`.
No cloud resources or Signal notifications are part of this cycle.

## Cloud sizing notes — September 8, 2026

Published Runpod Pod listings currently include:

| Listing | vCPUs | System RAM | USD/hour | USD/24 hours |
| --- | ---: | ---: | ---: | ---: |
| RTX A5000 | 9 | 25 GB | 0.27 | 6.48 |
| RTX 3090 | 16 | 125 GB | 0.50 | 12.00 |
| RTX 4090 | 6 | 41 GB | 0.74 | 17.76 |
| L40S | 16 | 94 GB | 1.09 | 26.16 |

Source: https://www.runpod.io/pricing (retrieved September 8, 2026).
These are advertised listings, not reserved offers. Availability and CPU
allocation must be checked at deployment; storage, transfer and taxes may add
cost. The older-GPU 3090 listing is a plausible first benchmark candidate because
this small CPU-trained policy mainly needs game simulation throughput and RAM.
A GPU model alone does not predict the speed of its host CPU.

No cloud speedup has been measured. At the desktop's measured roughly 8
combat decisions/second, one million decisions take about 35 hours. Conditional
throughput of 32 or 64 decisions/second would reduce that to about 8.7 or 4.3
hours, respectively. Those are 4x/8x arithmetic scenarios, not performance
promises; parallel rollout collection and single-environment evaluation have
different scaling limits. The first practical step is comparing cost per million
collected decisions on a small time-bounded rental after local scaling tests.
A larger rental should be chosen by measured CPU throughput, RAM, and price,
not by buying an expensive accelerator for the current tiny network.
