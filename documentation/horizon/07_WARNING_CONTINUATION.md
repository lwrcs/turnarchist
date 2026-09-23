# Horizon Live repair v0.2 — warning continuation and cross-room validation

## Evidence and diagnosis
The four supplied current live exports show one clean two-action run and three failures, all named `Restored branch observation mismatch`. Each failure occurs at the first simulation of the first query, before any live dispatch. Affected exports identify standard seeds 1 and 15 and room IDs R-f3, R-hz and R-ct. They contain no expected/restored observations or replayable roots. This establishes the failure boundary, not its exact differing field.

Upstream master was rechecked at 7ab7de52bf2c19166f600e6dcf3b44536e7ad5fb. `writeV2.ts::collectHitWarnings` saves x/y, dead, eX/eY, isEnemy and dirOnly. `loadV2.ts` constructs warnings without their parent and without their previous tick phase, with x/y fallbacks for absent source coordinates. `agentTraits.ts::observeWarnings` includes sourceId, source z, phase and dangerous. `HitWarning.isActive` reads parent death/unconsciousness and tickedForDeath. The existing fingerprint does not include the warning stream. Thus fingerprint success does not imply observation success in a populated room.

These are demonstrated omissions, consistent with the reported symptom. The package does not claim that an unseen failing snapshot has only these differences.

## Implementation
The ordinary Save V2 writer, parser and loader are unchanged. A new **planning-only** codec in `src/game/agentPlanningWarnings.ts` captures the warning graph across the rooms already selected by the save collector. It stores base HitWarning coordinates, optional source coordinates, hostility/direction flags, dead state, tickedForDeath, alpha and stable parent references. Room warning order and shared references from each entity's hitWarnings list are retained. Alpha is copied for faithful construction, not added to the live idle guard.

The codec is optional, versioned metadata under `runtime.warningContinuation` in the existing tagged **snapshot v3** container. Snapshot number, format and tagged codec do not change. Capabilities identify `horizon-warning-graph-v1`; rebuild both frames and capture fresh roots. Legacy v3 data still parses, but receives no invented warning reconstruction. Existing context/build equality and the full observation check remain mandatory.

On a standard planning restore, the normal engine first reconstructs the world. The codec validates every room/entity reference, constructs detached base HitWarnings, restores their captured fields, and commits the room and owner arrays. Parents are the actual restored entities, not placeholder objects or copied labels. Existing fingerprint and allocator checks run as before; the host still compares the same complete observation identity. Diagnostic sandbox replay continues to reconstruct its own warnings; it does not use this supplement.

Unknown warning subclasses, dangling/dead-parent references not present in the saved live-entity set, cross-room shared warning objects, malformed metadata, and unsupported property layouts **fail closed**. Nothing converts an unresolved source into null, a resolved warning into a fresh warning, or an unknown class into HitWarning. These are explicit future codec work, not reasons to relax equality.

## Diagnostics
`AgentHorizonHost.assertViewIdentity` compares the unchanged identity projection. A failure now reports `PLANNING_OBSERVATION_MISMATCH`, a JSON-pointer field path, bounded expected/actual values and `branch.restore`. Array order and all previously compared fields remain significant.

The host retains one local failed-restore reproduction: the exact branch snapshot, expected/restored observation, goal, candidate action and error. The viewer's explicit JSON export includes this reproduction when present. Payloads beyond the 2 MiB character cap are marked omitted, never partially treated as replayable. This can contain privileged game/replay data; review before sharing. No automatic upload, environment dump, authorization token, or PPO trajectory is added. The retained copy is detached on access and reset on the next accepted query.

## New acceptance gate
`training/horizon_live_smoke.py --multi-room` selects the new dedicated page. It must enter a second distinct room using verified ordinary actions, then complete another independently planned, verified action **inside** that room. Entry alone is not a pass. After entry the selector requests an explicit adjacent interior waypoint rather than immediately returning through the arrival door. The planner still certifies the action; no teleport, synthetic wait, debug movement or unsafe fallback is used.

Session/search defaults are unchanged: 16 actions, 60 seconds, and the existing per-query limits. Seeds 1 and 15 are the reported regression cases. A safe refusal, unsupported codec, timeout or exhausted budget remains a failed coverage gate; record its true reason instead of substituting an easier seed.

## Boundaries
No PPO, reward, ordinary evaluator, dependency, game-rule, allocator, production budget or search-core changes. Keep the prior fresh-child smoke workaround, v1.4 bootstrap wait and TypeScript 4.9 compatibility cast. Warning serializers and observation diagnostics are independent modules; do not turn this targeted repair into a new navigation policy.
