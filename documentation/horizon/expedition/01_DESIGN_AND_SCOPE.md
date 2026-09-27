# Horizon Expedition: intent, computation, and visible branches

## Implemented boundary

The loop is now **real-world ledger → persistent objective director → explicit local goal → Horizon verification → one ordinary live action → exact successor parity → ledger update**. The integration leaves the existing action dispatcher, zero-gross-health-loss measurements, snapshot-v3 representation, restoration codecs, model/evaluator behavior, and ordinary advisory `plan()` intact.

This packet targets the committed Horizon JS at `7134292147e20c0cd26a6655a7622a49aeebde04` and preserves the user's newer local fixes through narrow source insertions. `SOURCE_BASELINE.json` records exact JS blob identities. Engine/renderer source was inspected by ranges; this is not a full checkout or full-engine validation.

## 1. Deterministic world knowledge

`agent-horizon-world.js` maintains an episode-local ledger outside the game and outside simulator snapshots. Only real observations and successfully parity-verified live transitions enter it. Repeating an identical observation is idempotent; simulated visits do not increment real coverage, passage traversal, or action counts.

A room is keyed by depth plus room identity within an explicit episode. A directed passage is keyed by origin room, portal coordinate and height. Discovering a door is not crossing it; knowing a directed destination is not traversing it; crossing A→B does not fabricate B→A. The inspection API discloses destination identity only for already-entered rooms. Unknown rooms are never inspected to populate the ledger.

Records distinguish accumulated observed tiles from physically visited tiles; current room contents from last-known remote contents; currently present objects from absent/depleted ones; and unresolved opportunities from temporarily deferred ones. Disappearance is **not** automatically classified as a kill or collection. Item heights are read explicitly; unknown height is not silently converted to the player's layer.

Capacities are explicit: 512 rooms, 250,000 known tiles, 8,192 directed passage records, and 32,768 opportunities by default. Capacity failure stops collection instead of silently erasing strategic history. Export is detached JSON data. No persistent browser storage/import is supplied: memory persists across bounded Run/Stop/One-action sessions in the same initialized viewer, not across page reloads. Initialize creates a fresh episode, even for the same seed. Consumers must likewise create a fresh ledger for a new episode; equal seed/step is not an adequate reset identity.

The shipped observer is **privileged full-current-room inspection**, matching the existing oracle-assisted controller. “Explore” therefore does not mean walking on every already-known empty floor tile. It means pursuing unseen passages, unfinished observed regions, and explicit opportunities. Partial-coverage inputs have a frontier path, but wiring a player-perception-only observer is a separate evaluation mode, not silently claimed here. The ledger is not a PPO observation or trajectory.

## 2. Stable intentions

The director retains a target/objective identity while emitting successive radius-five local waypoints. Reaching a waypoint does not abandon the larger motivation. Completion, disappearance, material changes, urgent threat, a valid externally selected objective, and bounded failures can trigger reselection. The controller's optional `shouldReselect()` hook is synchronous and cannot authorize an action.

Motivations implemented:

| Motivation | Evidence / local execution goal |
|---|---|
| `ESCAPE` | An observed dangerous warning under the player; propose a local departure, still simulator-checked. |
| `COLLECT_RESOURCE` | Observed item/healing opportunity or breakable resource; concrete same-layer target. |
| `BOSS_PROGRESS` | Observed boss-room enemy gate; concrete enemy target under ordinary directional mechanics. |
| `CLEAR_ROOM` | Optional user-enabled enemy-clearing motivation; disabled by default. |
| `FOLLOW_NEW_PASSAGE` | Observed usable passage whose destination has not been visited. |
| `EXPLORE_REGION` | Partial-observation frontier or route through known directed passages to unfinished known work. |
| `ADVANCE_FLOOR` | Observed main-path downward ladder, distinct from an optional side path. |
| `BACKTRACK` | Return toward the discovery parent when currently actionable higher-priority work is absent. |

The deterministic priorities are named, configurable code policy—not learned competence. They favor immediate escape and needed healing, mandatory boss clearance, local exploration/resources, unseen passages, unfinished remote regions, then floor progression/return. Explicit deferred/locked opportunities remain visible. **Backtracking does not certify that the entire region is permanently exhausted.** A bounded search failure never becomes “globally unsolvable.” Failure deferral is tied to material room versions and a bounded action cooldown; “Retry deferred objectives” is an explicit idle control.

Actual combat still uses the current permitted directional action subset. A navigation goal aimed at an enemy can cause attacks through the real engine; it is not a new tactical kill-objective solver. No spell, purchase, consume-item, arbitrary menu, or damage-trading policy is introduced. Opportunities requiring those actions remain unsupported or deferred. Strict zero-loss can correctly refuse all available progress.

## 3. Future Jev interface (implemented, no model call)

`director.offer()` returns a bounded immutable candidate list, objective IDs, motivation labels, and a summarized real ledger. The offer includes an episode/revision token. `director.accept({token, objectiveId})` accepts only an ID from that still-current offer and consumes it; stale, unknown or fabricated IDs are rejected. Successful acceptance requests reselection—it does not execute a move, alter safety, or edit the world.

These are **code-generated eligible objectives**, not promises that a zero-loss route exists. Jev can eventually rank these compact candidates rather than raw moves. Low confidence, unavailable inference or invalid output should use deterministic selection. Revalidate the offer after any intervening real action. The supplied code has no provider SDK, network call, model dependency, inference cost, or PPO coupling.

## 4. Simulation display

`agent-horizon-driver.js` observes real adapter calls and emits compact root/edge events with query, node, parent, action, before/after room/depth/height/position, gross health loss, outcome and timing. Different branches at the same tile remain different lineage nodes. Cache hits are not misrepresented as new simulations; unexplored actions are not drawn as evaluated futures.

`agent-horizon-ghosts.js` renders a separate pointer-transparent canvas over the visible game. A tiny read-only renderer hook publishes the actual camera transform at the native player render boundary. Ghosts use the base player atlas at frame zero, with no idle animation; an unavailable atlas uses a simple silhouette. They are not full mutable player/armor clones. A damage-pruned branch flashes a red tinted sprite and fades; it is explicitly **pruned**, not necessarily game-dead. Rejected/error branches are distinguished from hurt branches. Room changes do not draw imaginary paths between unrelated coordinate frames.

The viewer never creates additional `Player`/entity objects or invokes `hurt()`, simulation, collision, RNG, or game draw methods for these ghosts. It reads detached trace data. Rendering is capped at 20 frames/second and 256 visible ghosts, with up to 4,096 trace records / 2 MiB accounted text per latest query. Dropped records are reported; a capped trace is not called complete. Modal, stale camera and disabled states hide/clear the overlay. Replay replays the trace only, not the game.

Search does not wait for the animation. A synchronous game operation can temporarily prevent the browser from painting, so live visualization is best effort; saved trace replay remains available. Rendering still consumes some browser time and can affect wall-clock-limited search throughput. Compare visualization off/on rather than promising zero overhead.

## Module seams

| Module | Responsibility |
|---|---|
| `agent-horizon-world.js` | Ledger, graph/frontier routing, director, future objective-ID interface. |
| `agent-horizon-driver.js` | Reference/route-first strategy, compact traces, bounded profiler. |
| `agent-horizon-ghosts.js` | Read-only native-sprite or custom-provider rendering. |
| `agent-horizon-expedition.js` | Composition; existing controller remains sole live dispatcher. |
| `horizon-expedition*` | Separate viewer and explicit actual-game validation entry points. |

Four existing files receive hooks: host, controller, `agentEnvironment.ts`, and `playerRenderer.ts`. The core search and all continuation implementations are retained. The new page validates the JS hook versions; stale scripts cannot silently omit the strategy/intent hooks.
