# Horizon v1.4 — settle the old world before diagnostic reconstruction

## Scope and evidence

The user's v1.3 summary reports standard seeds 1/2 and cave seed 1 passing, with cave seed 2 failing at `plan-replay.restore`: `PLANNING_FINGERPRINT_MISMATCH` at `/fingerprint/playerFingerprints/0/roomPathId` (`R-mxv` versus `R-nce`). The local smoke runner now restarts its simulator child before returned-plan replay. Preserve that change.

The latest named retry report, receipt and manual smoke patch were not available as attachment bytes in this chat. The available embedded source is from v1.2; v1.3 intentionally left `agentEnvironment.ts` and `agentPlanning.ts` untouched. This packet uses that source plus the exact supplied v1.3 payload as its baseline. GitHub master was rechecked at `7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb`; the user's local HEAD remains `129f49f7854896ffde2ce3fbfb8a0aebdbaa8461`. The installer reconciles actual local bytes before writing. No current local browser run is claimed.

## Confirmed lifecycle defect; case-level diagnosis still provisional

`Game` calls `newGame()` and immediately publishes `window.agent`. `newGame()` starts `loadGameState()`, which returns an asynchronous generation chain; the public agent's existence does not establish that this chain is finished. Normal `AgentEnvironment.reset()` calls `await this.settle()` before cancelling replay and starting another world. `restoreDiagnosticSandbox()` lacked this first wait. It waited only after starting its own `newGame(seed)`.

That asymmetry allows two world-generation operations to overlap when restoring into a newly opened iframe. A stale callback may then allocate IDs or update collections after the diagnostic allocator origin was correctly restored. Saving the origin/frontier alone does not serialize overlapping operations.

## Production change

Inside `restoreDiagnosticSandbox()`, immediately after validating the scenario and before `cancelReplay()` / `newGame(seed)`, add the existing `await this.settle()` readiness barrier. This runs within the existing exclusive operation. It uses the existing timeout, update pump and readiness predicate, not a new sleep or timeout increase. The existing second wait remains after `newGame(seed)` and before allocator-origin restoration. No origin/frontier value is assigned or normalized differently.

This is one executable TypeScript statement plus its explanatory comment. It serializes the same lifecycle already used by normal reset. Standard Save V2 restoration, tagged codec, snapshot v3, all fingerprint/allocator comparisons, PPO, gameplay rules, dependencies, limits and action enumeration are unchanged.

This fixes a demonstrable overlap defect; the user's precise cave-seed-2 failure must still be verified against their actual checkout. A regression with controlled late callbacks reproduces the same mismatch path in the unchanged v1.3 implementation. Its fake world is not evidence that the exact production scheduling occurred in the unavailable retry report.

## Installed files and invariants

Only three manifest paths are written:

- `src/game/agentEnvironment.ts`: the pre-replacement wait.
- `training/tests/horizon-bootstrap.test.cjs`: twelve regression tests, picked up automatically by the existing runner.
- `documentation/horizon/05_REPAIR_V14.md`: this specification.

The full `baseline/` and `payload/` trees are reference material for source-extracted packet tests. Do not copy those trees into the checkout. In particular, this installer never writes `training/horizon-browser-smoke.js` or `agentPlanning.ts`; the local fresh-child replay patch and TS 4.9 Wire cast survive unchanged.

## Acceptance

Run the existing full coordinator at the existing limits. All four original actual-game standard/cave seed-1/2 cases must pass, along with unit/runner tests, repository typecheck, development rebuild and diff gates. Preserve first-run failures rather than discarding them when a later run passes. If the cave failure is intermittent, repeat the unchanged four-case suite in fresh processes, retaining every result. Do not declare nondeterminism repaired from one favorable retry.

## Source references

The public source inspected at the pinned commit:
- `src/game.ts`, lines 1190–1200: bootstrap publishes the agent after calling newGame.
- `src/game.ts`, lines 1800–1870: newGame/startFreshWorld dispatch asynchronous loading without returning its promise.
- `src/game/gameState.ts`, lines 1814–1925: generation promise and completion continuation.
- Installed `src/game/agentEnvironment.ts`: compare reset and restoreDiagnosticSandbox (included in baseline/payload).

Repository URL: https://github.com/lwrcs/turnarchist/tree/7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb
