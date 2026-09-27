# Horizon expedition device handoff (2026-09-27)

This branch carries the current Horizon expedition viewer, coordinator, tests, and
the local work built on `c904120c` (`Add Horizon live planning and validation`).
It is a work-in-progress branch. It has not passed a full-level live expedition.

## Current validation

- `node training/horizon-tests.cjs`: 360/360 passed.
- `./node_modules/.bin/tsc --noEmit`: passed.
- `python3 -m unittest training.tests.horizon_expedition_runner_tests`: 6/6 passed.
- The development `dist/bundle.js` was rebuilt after the current changes.

## Open live issues

1. Seed 1, standard scenario, reference driver, 16 actions per Run, horizon 5,
   128 simulations/query previously blocked near turn 57 in its sixth room with
   `HORIZON_EXECUTION_DIVERGED` at
   `/observation/room/entities/3/facing/dx` (expected `0`, actual `-1`).
   The entity was identified as `ZombieEnemy EN-w8` at `(19,12)`. The skull
   regeneration persistence change did not resolve this mismatch. A subsequent
   planning-path cache hypothesis also failed a full replay and was reverted.
2. The current planning continuation reasserts the captured enemy tick order
   after room reconstruction. Its focused regression and suite pass, but the
   exact sixth-room live action has not been reached again to validate it.
3. In the most recent bounded live replay, seed 1 stopped after three rooms
   with `NO_ACTIONABLE_KNOWN_OBJECTIVE`. The goal director therefore still
   needs investigation before a full-level completion can be claimed.

The controller's exact successor parity and zero-gross-health-loss checks remain
enabled. Continue from the live evidence; do not treat fixture passes as proof
that either open issue is fixed.
