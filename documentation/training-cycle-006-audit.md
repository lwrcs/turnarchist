# Cycle 006 audit

Saved desktop evidence audited 2026-09-14. No training rerun during audit.

- Collection: 16 episodes, 122 selected navigation examples. Logged collector episodes reached 2–6 rooms.
- Fit: 3000 updates, each sampling 32 navigation and 32 combat examples with replacement; initial loss 8.503107, final loss 0.000106573. This is imitation, not PPO experience (trainingSteps=0).
- Every before/after pair across random, deterministic, and sampled evaluation matches episodeSeed, actual game seed, and rotation (8 pairs per policy). This confirms logged seed identity, not full reset-state equivalence.
- Seven of eight final deterministic traces have all 64 retained actions rejected. Seven of eight final sampled traces likewise have all 64 retained actions rejected. Remaining deterministic run alternates locally with 22/64 rejected; remaining sampled run has 62/64 rejected.
- Random baseline visits a mean 3.875 rooms, demonstrating that room transitions are possible in this evaluation environment.
- evaluate_dungeons calls PPO.predict directly over four directions. It does not mask invalid actions or consume rejectedAction feedback.
- Low imitation loss does not establish dungeon skill; current evaluation collapses into rejected actions. Sampled means drawing from the learned distribution, which can be highly concentrated.

## Decision

Do not repeat the long collection/3000-update fit unchanged. Next work is a bounded correctness experiment: verify initial observation/reset reproducibility, direction rotation and action validity; expose rejected-action and no-progress metrics; evaluate an explicitly labeled validity-filtered policy on a few saved seeds, preserving the raw-policy baseline. Use game action semantics, including wall-torch interactions, attacks and push chains, rather than assuming solid tiles forbid all interactions. Any rejection cache must expire when observable state changes.

Then verify navigation learning on held-out routes and combat retention with checkpoint selection before running a full dungeon cycle. Split navigation training/validation by seed, track sample counts and action distribution, and stop fitting based on held-out behavior instead of a fixed 3000 updates on 122 examples. Keep previous checkpoints and datasets intact. Masked/assisted results must not be compared silently against raw-policy results.
