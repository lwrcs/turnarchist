# Planning continuation repair after Horizon Live v0.2

This is a planning-only integration repair. Ordinary Save V2, gameplay/AI rules,
PPO, dependencies, snapshot v3, equality checks and production budgets are unchanged.
Rebuild with the development watcher and initialize fresh live/simulator frames;
do not relabel old snapshots with a new build ID.

## Reproduced omissions

The standard seed-1 exit route at (17,12) exposed three distinct failures:

1. A removed dead ZombieEnemy still parents a fading HitWarning. Save V2 omits the
   dead entity. The v0.2 warning supplement rejected this source during branch capture.
2. A pending DownLadder confirmation becomes `world` after Save V2 restoration.
   Full observation equality correctly reports `/observation/decision`.
3. After eight verified live actions, a cached zombie path is lost on restoration.
   The next action recomputes a different route, producing live/simulator divergence
   at `/observation/room/entities/5/facing/dx`. Position also differs. This is not
   cosmetic rendering drift and must not be excluded from equality.

## Narrow continuations

### Retired warning sources

An optional `horizon-retired-warning-parents-v1` table inside the existing warning
graph preserves the original source ID, terminal death/unconsciousness and complete
position/footprint read by base HitWarning (`isActive`, `getPointerDir`) and its
observation projection. Sources are shared by identity across reconstructed warnings.
This table describes **terminal warning sources**, not active enemy simulations.
It never inserts a fake enemy into a room, copies expected observation labels, runs
constructors, consumes RNG/IDs or makes a dead warning dangerous.

The audited capture case is specifically a dead ZombieEnemy already absent from all
room entity pools. Zombie behavior is gated by `!dead`; Room.clearDeadStuff removes
the original; death clones are separate objects. Missing live parents, other retired
classes and custom warning subclasses still fail closed. Restored terminal records
are immutable and provenance-tracked for subsequent branch recapture. Live sources
continue to reference the actual restored entities.

### Pending ladder prompt

Optional `horizon-down-ladder-prompt-v1` runtime data stores the pending prompt's
actual room and coordinates. Restore checks the unlocked base DownLadder and all
players' positions before invoking its ordinary `onCollide` prompt-only branch.
The real confirm/cancel callbacks are rebuilt. Restore does not descend, record,
generate, unlock, or consume a turn. A cancelled prompt on the same tile stays closed.
Other open screen-message interactions remain explicitly unsupported.

### Cached enemy paths

Optional `horizon-enemy-path-cache-v1` data preserves each live enemy's cached target,
origin and ordered move positions, including null caches. Only the audited inherited
Enemy.searchPathLocalizedCached implementation is supported. The cache and all its
current callers consume `moves[].pos`, not AStar search scores, parent links or cyclic
Tile.org references. Capturing those temporary search internals is neither necessary
nor safe. Restoration validates the complete entity set, identity, room, class and
writable cache field before committing any cache. Existing blocked-cell, moved-enemy
and changed-target invalidation logic remains authoritative.

## Testing

### Explicit empty loot and standard-world readiness

The next independently reproduced mismatch was `/observation/player/coins`:
live had an empty zombie loot list, while the exact search branch had a freshly
rerolled FishingRod. A new isolated replay could differ again, which is why the
diagnostic captures the actual first edge used by search, not just a fresh probe.
Optional `horizon-empty-loot-v1` restores those explicitly empty collections and
their lootDropped flag. Entity.dropLoot and Coin.autoPickup remain unchanged.
This narrow supplement does **not** claim general nonempty hidden-loot support.

Standard Save V2 restoration now waits for the existing world to settle before
clearing its collections, just as diagnostic reconstruction already did. This
prevents old generation callbacks replacing the player mid-branch. Existing
readiness and timeout criteria are unchanged; failures are not retried away.

`training/horizon_live_smoke.py --continuation` runs the reported seed-1 route in a
separate browser at the reported viewer settings (20 actions, depth17, simulations128,
unchanged 2000ms query budget). It does not treat automatic arrival-door bouncing as
coverage. It retains bounded source-state comparisons on execution divergence.
The targeted gate requires the selected exit to complete; 20 verified actions that
exhaust the budget without reaching it remain a failed goal-coverage gate, not a
state-mismatch failure and not a completed goal.
Original planner standard/cave seed1/2, three-action live, and multi-room seed1/15
gates remain separate and unchanged. Source-extracted HitWarning, DownLadder and
Enemy cache tests cover lifecycle, real callbacks, invalidation and malformed data.
