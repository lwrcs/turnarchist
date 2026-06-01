# Sidepath Navigation — Design Review & Adjustment Ideas

## Context

The current sidepath system (Dungeon → Forest/Sewer/Tutorial/Cave; DarkDungeon → DarkForest → DarkCastle → MagmaCave) works mechanically but feels clunky in ways that don't have a clear gameplay justification. The goal of this review is **not to homogenize** the design to match standard roguelikes — the game has deliberate identity choices (single-room biome sidepaths, PNG-based castle layouts, color-coded keys) that should be preserved. Instead, this doc identifies the friction points where the game is unintentionally clunky and proposes targeted adjustments grounded in what comparable games do well.

## Current architecture (the player's view)

Branching layout, by depth:


| Depth | Main        | Sidepath(s)                                                                       |
| ----- | ----------- | --------------------------------------------------------------------------------- |
| 0     | Dungeon     | Tutorial (locked, multi-room), Sewer (unlocked, terminal, 1 big room)             |
| 1     | Dungeon     | Forest (locked, **1 big room**, 50×50) → Castle (locked, PNG multi-room, 30×30)   |
| 2     | Dungeon     | Cave (locked, **1 big room**, 88×88)                                              |
| 3     | DarkDungeon | DarkForest (locked, 1 big room, 55×55) → DarkCastle (locked) → MagmaCave (locked) |


Source: `src/level/levelProgressionConfig.ts:28-216`.

Navigation primitives:

- Locked rope `DownLadder` on main floor → key found on same main floor → unlock → descend into a separate `Level` with its own minimap.
- Inside sidepath: an `UpLadder` (rope up) returns to the parent. Examine text: `"A rope up."` — no destination label. `src/tile/upLadder.ts:129`.
- Castle has a special twist: the rope-up in the castle exit room is *locked from the inside*, and the unlock key is also the **main-path** key needed to open the depth-1 Dungeon's downladder. `src/level/sidePathManager.ts:316-367`.

Player-facing cues:

- Down ladder examine text: `"A rope down. It leads to a side path."` `src/tile/downLadder.ts:75` — generic, doesn't name the destination.
- Down ladder sprite: rope (tile index 16/17 locked) vs staircase (index 4). All sidepath ropes look identical regardless of destination.
- Minimap: down ladders render as a cyan pixel. `src/gui/map.ts:1000`. No preview of destination biome.
- Key pickup: `"You found a [COLOR] key!"` and `"Path guide enabled. Click key to toggle."` `src/item/key.ts:128-131`. The path-guide visualization highlights the matching lock. Color is hashed from `keyID`, not tied to destination.
- The minimap only shows the current `mapGroup`; sidepath and main-floor views never appear together. `src/gui/map.ts:109-127`.

## Observed clunkiness (and what's not actually clunky)

**Real friction:**

1. **Castle is on the critical path, not a sidepath.** Depth-1 progression requires Forest → Castle → return-with-main-key. The "sidepath" framing is a misnomer when it's actually a mandatory detour with a different generation style, layout, and locked-exit pressure. This is the single largest source of perceived clunkiness — players who don't enjoy castle content are forced through it every run, and it contradicts the convention that sidepaths are optional reward detours.
2. **Information vacuum at entry.** The player can't tell forest from cave from castle until they've descended. There's no biome name, no enemy preview, no risk/reward signal. Standard practice (DCSS, Slay the Spire, Hades) is to surface *what's behind that door* before the player commits.
3. **Minimap disconnect on entry.** Entering a sidepath replaces the minimap entirely. The player loses spatial context for "where I came from" and "is the way back still accessible." Persistent linked-room data exists in code but isn't surfaced.
4. **Keys are colored but the colors are arbitrary.** A "blue key" tells you nothing about the destination — it just helps you find the matching lock via the path guide. The key system works mechanically but doesn't help the player build a mental model of *which* sidepath they're unlocking.
5. **Return path is silent.** `"A rope up."` doesn't say where it leads. For the castle's return-to-root rope (which actually leads back to the main Dungeon two layers up), this is especially confusing.
6. **Nested sidepaths add depth without commensurate reward.** Forest → Castle is two ropes into a "branch" before you find the main key to exit. DarkForest → DarkCastle → MagmaCave is three layers. The mechanical novelty wears off when the reward doesn't scale with depth.
7. **No tutorial for locks/keys/ropes.** First-time players have no guided introduction. `documentation/tutorial.md` covers enemies only.

**Not actually clunky — preserve:**

- Single-room sidepaths (Forest, Cave, DarkForest) play very differently from multi-room main dungeons. This is a *deliberate flavor contrast*. Recommend keeping them — but setting the player's expectation before entry.
- Color-coded keys with a path guide. The mechanic is fine; only its meaning is opaque.
- Castle's PNG-based layout. The distinct generation style is part of its identity.

## Genre conventions worth borrowing


| Game                 | Relevant pattern                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DCSS**             | Branches (Lair, Snake, Swamp, Vault, Tomb…) are *optional* off the main column. Each staircase is labeled (`"You see a staircase to the Lair"`). Required progression stays on the main path; branches reward exploration. |
| **Slay the Spire**   | Whole-floor map visible before traversal. Every node icon tells you what's there (combat / elite / shop / ?event). Total transparency.                                                                                     |
| **Hades**            | Doors preview the next room's reward (gold, boon, gem). The player commits with information.                                                                                                                               |
| **Spelunky**         | Alternate paths (Black Market, Hell) gated by *discoverable* requirements, not arbitrary keys. Cause-effect signaling.                                                                                                     |
| **Binding of Isaac** | Door icons hint at the room behind (treasure, boss, secret). No key management for normal rooms.                                                                                                                           |


The unifying principle: **the player should know what they're committing to before they commit.** And: **required progression goes on the main path; sidepaths are reward detours.**

## Recommendations (ranked by impact / cost ratio)

### Tier 1 — High impact, low cost

**R1. Decouple main progression from castle.** Make castle a true optional sidepath:

- Move the main-path key out of the castle exit room. Place it on the main Dungeon floor (existing key-distribution logic in `Level.distributeKey` already handles this).
- The castle still locks behind a key (found in Forest), and the castle's reward becomes unique loot — a guaranteed boss drop, a jewelry piece, or a relic — not main progression.
- Same change for DarkCastle / MagmaCave chain.
- *Why:* Fixes the largest perceived clunkiness. Players who enjoy castle take the detour; players who don't can skip it.
- *Cost:* Modest — touches `sidePathManager.ts:316-367` and roomPopulator key placement.

**R2. Name the destination on examine text.** Change `"A rope down. It leads to a side path."` to `"A rope down. It leads to the Forest."` — substitute the destination biome dynamically.

- The downladder already knows its destination env via `downLadder.environment`.
- Same for `UpLadder`: `"A rope up. Leads back to Dungeon 1."` using `linkedRoom.depth` and `linkedRoom.level.environment`.
- *Cost:* ~10 lines across `downLadder.ts:74-77` and `upLadder.ts:129-131`.

**R3. Tint or icon-mark sidepath ropes by destination.** Forest rope = mossy/green, Cave rope = rocky/dark, Castle rope = gilded. Use the existing sprite-row mechanism — the downladder already has access to its destination environment.

- *Cost:* Sprite art + a tile-coord lookup table by `downLadder.environment`.

**R4. Tutorial for the lock/key/rope loop.** One-time popup on first locked-rope encounter and first key pickup. Hook into existing `globalEventBus` and `TutorialListener`.

- *Cost:* Add two event types and two short messages.

### Tier 2 — Moderate cost, moderate impact

**R5. Minimap "you came from here" indicator.** When inside a sidepath, render the parent-floor entry rope as a faded marker on the sidepath's minimap with an arrow indicating "exit." Use existing persistent `downLadder.linkedRoom` data; just a draw-pass addition in `map.ts`.

- Optional further step: a hotkey to toggle to the parent-floor minimap view while in a sidepath.

**R6. Reward preview at entry.** Examine text on a locked rope shows the reward category: `"A rope down. Leads to the Castle. Contains: rare loot."` This is Hades-style commitment-with-information.

- Could be as simple as: rare loot / boss fight / shopkeeper / mini-event.
- *Cost:* Add a `rewardTag` field to SidePathSpec; render in examine text.

**R7. Name keys by destination, not color.** Replace "blue key" with "Forest key" / "Castle key" / etc., with destination-themed icons. Keep the underlying ID system; just relabel for the player.

- *Cost:* Touch `key.ts:128-131` messaging and `keyColor.ts` icon logic.

### Tier 3 — Larger structural moves (suggest, don't recommend)

**R8. Flatten the nested chains.** Forest → Castle and DarkForest → DarkCastle → MagmaCave become parallel sidepaths off the main dungeon at the same depth, not nested. Removes navigation depth that doesn't pay off.

- *Tradeoff:* Loses the "wow, another level deeper" reveal moment. Only worth it if R1 has been done and the chains are still felt as drag.

**R9. Make sidepath entries discoverable from anywhere on the main floor.** Mark the down-ladder location on the minimap from level entry, not just after the player walks past it. Lets players plan routes.

**R10. Persistent re-entry.** Once you've cleared a sidepath, you can re-enter as long as you have its key — and the minimap shows your previous progress in that branch. Code already supports persistent `linkedRoom`; just needs UI exposure.

## Open questions

These shape which recommendations are in scope:

1. **Is castle intended as required (a design choice) or required by accident?** If intentional, R1 changes the game's identity and shouldn't be done. If accidental, R1 is the highest-leverage fix.
2. **Are nested chains a deliberate "wow factor" or vestigial?** Affects R8.
3. **Sprite art capacity** — R3 needs new rope variants. Is that feasible?
4. **Where does this rank against other priorities?** R1 + R2 + R4 alone would meaningfully shift the player experience; the rest can wait.

## Critical files (for reference)

- `src/level/levelProgressionConfig.ts` — sidepath chain definitions.
- `src/level/sidePathManager.ts` — castle key in exit room, return-to-root mechanic.
- `src/tile/downLadder.ts`, `src/tile/upLadder.ts` — examine text and sprites.
- `src/gui/map.ts` — minimap rendering.
- `src/item/key.ts` — key pickup messaging.
- `src/room/roomPopulator.ts` — key placement on main floor.
- `documentation/tutorial.md` — tutorial coverage gap.

## Verification (for any chosen direction)

Since there are no automated tests:

- **R1**: play depth 0 → 4 with castle skipped, confirm progression works and the run feels distinct from a castle-included run.
- **R2 / R3 / R7**: visual smoke test by entering each sidepath type and confirming the destination is named correctly.
- **R4**: clear browser storage, start fresh, confirm the tutorial messages fire exactly once.
- **R5 / R6 / R10**: walk through each sidepath and visually inspect minimap state at entry, mid-traversal, and after return.
- **Optional telemetry**: `statsTracker.recordSidePathEntered` already exists (`src/level/sidePathManager.ts:174`). Add `recordSidePathSkipped` and `recordSidePathCompleted` to measure whether R1 actually changes player behavior.

