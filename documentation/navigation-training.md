# Navigation recovery experiment

Dungeon pilot 001 completed, but its deterministic policy averaged only 1.5 rooms
and 3.75 positions on four held-out seeds. All four runs exhausted their budgets.
Three final traces paced between adjacent tiles; the fourth repeatedly attempted
an unrecorded direction. Sampled play averaged 1.75 rooms and 10.5 positions.
Neither mode reached a deeper floor. These are failures of exploration, not
successful survival. Old artifacts are preserved.

Inspection also found an observation gap: the compact combat features did not
explicitly encode doors or stairs. Increasing doorway reward alone cannot fix
missing distinctions or provide examples the policy almost never encounters.

The next experiment therefore changes inputs and initialization, keeping dungeon
reward v1 unchanged. Encoder v6 adds observed doors/stairs, known lock state,
unlocking from the current side, and actual past passage use to the existing
combat frames and visited-tile memory. It never guesses hidden connections or
marks the reverse side merely because a crossing occurred.

A restricted-perception programmed teacher collects up to 256 decisions on each
of 16 training seeds. Only recorded, position-changing directional actions with
no perceived hostile/contact beforehand and no damage are navigation labels.
These are successful local steps, not whole winning runs or human recordings.
The teacher's longer history can make some choices ambiguous to the local-memory
student; fitting loss is not a navigation success metric.

A new actor starts from the legal terrain-combat reference and receives 2000
balanced updates: 32 navigation and 32 successful combat examples per batch.
The additional inputs start at zero weight. Combat rehearsal has zero-padded new
inputs, so retention in arbitrary dungeon memory states remains an evaluation
question. All layers remain trainable; there is no irreversible specialization.
The resulting model has zero PPO decisions and is clearly marked as imitation.

Initial and fitted models receive identical four-seed held-out evaluations,
including deterministic, sampled and random controls at 512 game actions per
run. The evaluator compares rooms, positions, depth, damage and deaths without
calling budget exhaustion a win. It checks identical input, reward, helper,
game, budget and seed contracts. Further PPO is deferred until these results
show whether the new navigation behavior is useful.

Desktop cycle: `navigation-cycle-001`, Windows task
`Turnarchist-Navigation-Cycle-001`. The cycle first runs a small real collection
and fit preflight, then the full collection, fitting and paired evaluation.
It runs only locally. Signal remains paused and no cloud rental is involved.
