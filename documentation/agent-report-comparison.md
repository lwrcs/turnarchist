# Comparing agent evaluations

Use Export batch in the agent lab to save each completed report, then run:

```sh
node scripts/compare-agent-batches.cjs before.json after.json
```

This uses Node's built-in modules and works on the laptop or Windows desktop.
It only reads reports. It does not run a game or change either input file.

The result pairs runs by seed, reports missing seeds, and gives numeric deltas
as **after minus before**. Missing optional measurements remain null. Death is
separate from decision-budget exhaustion; neither an incomplete run nor a larger
position count claims victory.

A pair is marked as a controlled comparison only when the backend, game build,
settings, observation/action contract, vision, and decision budget match and both
runs ended in death or budget exhaustion. Different policy versions are expected.
Build changes still produce per-seed deltas, but are flagged so changes to game
rules or observations cannot silently masquerade as policy improvement.
Cancelled, failed, and unsupported-decision runs are excluded from controlled
aggregate death counts. Duplicate seeds are rejected rather than paired arbitrarily.

Keep a fixed seed suite for comparisons and separate seeds for checking behavior
outside that suite. Preserve exported policy source and game code/assets with
reports before using runs as training demonstrations.


For continued episodes, the comparer uses each run's effective `decisionBudget`
instead of the original batch default. Reports from older versions without this
field still use `decisionsPerSeed`.
