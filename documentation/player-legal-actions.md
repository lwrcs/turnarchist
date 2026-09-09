# Player-legal action correction — September 8, 2026

The user identified an invalid assumption: players cannot wait freely. They can
spend a turn through real gameplay, including breaking objects, or use the
hourglass's limited charges. The old agent Wait directly ticked the room without
an item. It was an invalid advantage in the offered action space.

Action schema 4 rejects Wait before execution, recording or budget mutation.
The live player action processor also rejects it; historical Wait events remain
replay-only so old recordings can still be inspected. The lab Wait button and
smoke step are removed. Programmed policy v23 reports an unsupported decision
when it has no move instead of inventing a free wait. Hourglass use remains an
inventory action, exposes its turn cost and cannot advance another turn after
its durability is exhausted. No zero-turn preparation cap or forced turn was added.

The pilot now offers four directional actions, which resolve through the real
move/attack/push/break/interact rules. It does not yet offer inventory actions,
including hourglass use. Encoder versions 3 (unrotated) and 4 (rotated) replace
the five-action versions 1/2. Old model and dataset contracts are rejected,
not silently relabeled or resumed. Fresh legal-action demonstrations and
evaluation are required; all historical model files are preserved.

## Audit of recent saved learned evaluations

| Checkpoint evaluation | Deterministic + sampled episodes | Wait decisions |
| --- | ---: | ---: |
| imitation-forward-001-eval-v2 | 160 | 0 |
| pilot-003-recovery-001-eval-v2 | 192 | 0 |
| imitation-open-001-eval-v2 | 192 | 0 |

Those 544 saved learned traces did not use Wait. This does not establish that
all earlier training rollouts or other evaluations were free of it. The old
random controls offered Wait and must not be treated as player-legal baselines.
The terrain experiment using the old action space was stopped, and its
artifacts retained as a retired-contract experiment.
