# Horizon v1.2 — diagnostic reconstruction identity

## Scope and evidence

This upgrades the applied v1.1 packet; it is not a new planner phase. The user reports complete standard-seed 1/2 success and cave-seed 1/2 root failures at `/fingerprint/playerFingerprints/0/roomPathId`. The attached coordinator confirms unit, typecheck, watcher, and diff gates pass but does not contain the referenced browser-smoke JSON or the latest attempted ID workaround. No specific expected/actual room-ID strings are inferred from that parent report.

The v1.1 AgentEnvironment base was reconstructed from the supplied application receipt's preimage and original v1.1 edits. Its SHA-256 is exactly the receipt's postimage: `55fe68785b5bed9fb606abccf70318172f4244402bf32afe2acab9ba76eb535c`. This is the applied baseline, NOT a claim to possess subsequent local edits.

Public upstream remained `7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb`. The upstream IdGenerator source was verified against Git blob `1d5bf7d287289cf620d208393ba1d94540b07d7e`. `Room` calls `IdGenerator.generate("R")`; diagnostic setup constructs Level/Room/Tile/Player objects and registers level/room lookup maps. The allocator has both a monotonic BigInt counter and a collision-reservation Set. A seed and action list alone do not capture either allocator component.

## Correct reconstruction boundary

The origin checkpoint is taken in `AgentEnvironment.reset()` **after `newGame(seed)` settles but immediately before `startLightingSandbox` or `startCombatSandbox` constructs the diagnostic world**. Recording it is read-only; the visible allocator is not reset or renumbered.

A diagnostic continuation stores two checkpoints:

- `origin`: the allocator state at that construction boundary, retained for the diagnostic run.
- `frontier`: the allocator state at the current snapshot, after setup and recorded actions.

In the isolated simulator, restoration runs the existing new-game preparation, then restores `origin` at the identical boundary, constructs the sandbox using the existing constructors, resolves the initial ladder interaction, and replays recorded actions normally. Maps, references, linked rooms and spawned objects receive the same IDs by construction. The original raw fingerprint comparison remains unchanged. A second comparison verifies that the independently replayed allocator equals `frontier`.

**Never set the allocator to `frontier` before construction. Never copy expected IDs into the reconstructed world. Never overwrite the frontier after replay to manufacture equality.** Failed comparisons remain errors. Counter-only restoration is insufficient when a reserved ID forces generation to skip a candidate.

## Public/internal API changes

`IdGenerator.captureSimulationState(): IdGeneratorSnapshot` is a detached, frozen, JSON-safe memento with format `id-generator-state-v1`, a positive decimal-string `next` (no Number conversion), and sorted unique `reserved` IDs. `readIdGeneratorSnapshot()` validates and detaches incoming data. `restoreSimulationState()` validates and allocates replacement structures before mutating either allocator field. The caller must own an isolated world-replacement boundary; the live agent API rejects restoration. Existing `generate`, `reserve`, `clearRegistryForLoad`, and `resetForTest` behavior is unchanged.

Allocator limits are 200,000 reserved IDs, at most 512 characters per ID, and an at-most-80-digit positive canonical decimal counter. The existing planning DTO limits also apply to the combined envelope. Exceeding bounds is unsupported, never silently truncated. Historical reservations are preserved; no assumption is made that a counter alone subsumes the registry.

`restoreSimulationSnapshot(serialized, planningOrigin?)` gains an optional internal argument. Existing callers omitting it keep their previous behavior. Only planning's diagnostic path supplies it. `restoreDiagnosticSandbox` receives that same optional provenance and retains it for child snapshots. Generic old diagnostic preview snapshots are not retroactively upgraded into verified Horizon snapshots; this patch does not claim to repair every legacy preview consumer.

Standard Save V2 snapshots use `reconstruction: null` and never rewind the allocator. Their save/load mechanics, action semantics, rewards, and policy inputs are unchanged.

## Snapshot and cache compatibility

Planning snapshot schema is now **3**, format `turnarchist-planning-snapshot-v3`; codec remains `tagged-planning-data-v1`. Logical envelopes add required `reconstruction: null | {format:"diagnostic-allocator-replay-v1",origin,frontier}`. Diagnostic inner metadata must agree with runtime seed/scenario/maxSteps, use the existing diagnostic replay format, and contain no more recorded actions than the decision count.

Capabilities include the reconstruction format. Host namespace changes to `turnarchist-savev2-or-sandbox/horizon-v3`. Rebuild both realms and reset/recapture; there is no migration of old snapshots or cached plans. Caller goal/plan APIs and gross-health metric stay the same. All recipe metadata participates in conservative state identity and the diagnostic live guard.

New failures: `PLANNING_ID_ORIGIN_MISSING`, `PLANNING_ID_STATE_INVALID`, `PLANNING_RECONSTRUCTION_INVALID`, `PLANNING_REPLAY_METADATA_INVALID`, `PLANNING_ALLOCATOR_MISMATCH`. Existing `PLANNING_FINGERPRINT_MISMATCH` remains intact. Each checkpoint error reports its field path; expected/actual mismatches retain bounded details.

## Validation and long-term boundary

The node suite compiles the actual installed allocator and extracts the actual installed `reset`, `captureSimulationSnapshot`, `restoreSimulationSnapshot`, `restoreDiagnosticSandbox`, and planning methods into a synthetic lifecycle harness. Tests deliberately start separate realms with different allocator histories, reproduce the old error, check repeated reset and branch continuation, exercise later entity allocations and reservation collisions, and reject forged checkpoints. This is stronger contract coverage, not a substitute for the actual engine.

The actual-game smoke now performs two live resets before each diagnostic case to exercise nonzero allocator history. It still requires the original standard/cave seeds 1 and 2, continuation parity, plan replay, no visible-state changes, cancellation and budget checks. The coordinator embeds the complete bounded browser report; failed validation additionally emits selected source and bounded log tails in a self-contained evidence JSON.

Allocator mementos are intentionally a separate engine primitive. Later optimization can add a tested compact encoding or origin-plus-delta representation behind a new version, avoiding repeated historical-registry copies. Do not remove reservations or hashes from identity merely to improve cache hit rate. No phase-two compression, PPO/controller integration, training run, or gameplay-rule change is part of this repair.

Passing the four smoke cases is scoped integration evidence, not certification of all traps, enemy types, sidepaths or save-codec coverage. Retain the roadmap's broader parity gates before using this as an automated training oracle.
