# Level System Investigation

An audit of how level generation, room population, environment configuration, and sidepath logic are organized (or scattered) across the codebase. The goal is to identify where there is no single source of truth, where configuration is duplicated, and what needs consolidation before adding new features.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [No Single Source of Truth: Environment Progression](#no-single-source-of-truth-environment-progression)
3. [Sidepath Configuration Scattering](#sidepath-configuration-scattering)
4. [roomPopulator.ts Sprawl](#roompopulatorts-sprawl)
5. [RoomType System: 27 Types, Uneven Handling](#roomtype-system-27-types-uneven-handling)
6. [Environment-Specific Logic Duplication](#environment-specific-logic-duplication)
7. [game.ts God Object](#gamets-god-object)
8. [Dead and Vestigial Code](#dead-and-vestigial-code)
9. [Refactoring Plan](#refactoring-plan)

---

## Executive Summary

The level system works, but configuration decisions are made in many places with no clear authority. The same question — "what environment does this sidepath get?" — is answered by at least 3 different mechanisms in different files, each using different logic. Room population has a dual-dispatch system (by environment AND by room type) with unclear priority. The 4,069-line `roomPopulator.ts` contains duplicated formulas, dead methods, and scattered environment-specific checks. The 6,596-line `game.ts` acts as orchestrator, registry, renderer, and state machine all at once.

### Core Problems (ordered by impact)

| # | Problem | Severity | Files Affected |
|---|---------|----------|----------------|
| 1 | Environment progression has 3 competing sources of truth | High | roomPopulator.ts, downladderMaker.ts, sidePathManager.ts |
| 2 | DownLadder environment/opts set in 5+ different places | High | roomPopulator.ts (×5), downladderMaker.ts |
| 3 | roomPopulator.ts is 4,069 lines with dual dispatch and duplication | High | roomPopulator.ts |
| 4 | Environment-specific logic duplicated (cave ore ×3, forest trees ×2, castle checks ×4+) | Medium | roomPopulator.ts |
| 5 | 27 RoomTypes but only 16 have population logic | Medium | room.ts, roomPopulator.ts, pngPartitionGenerator.ts |
| 6 | game.ts is a 6,596-line god object | Medium | game.ts |
| 7 | Dead code: downladderMaker.ts, populateByType(), populateEmpty() | Low | various |

---

## No Single Source of Truth: Environment Progression

The question "what environment does depth N get?" is answered differently depending on context:

### Source 1: Depth-based in `addDownladder()` (roomPopulator.ts:812-824)

When creating sidepath DownLadders, the environment is chosen by depth:

```
depth < 2  → FOREST
depth == 2 → CAVE
depth == 3 → FLOODED_CAVE
depth > 3  → 50/50 FOREST or CAVE
```

This only applies when `opts.envType` is not already set.

### Source 2: Environment-driven chain in `getEnvDrivenSidePathOptions()` (roomPopulator.ts:212-234)

When the current level's environment determines the *next* sidepath's environment:

```
CAVE         → DARK_CASTLE (via createDarkCastleSidePathOptions)
DARK_DUNGEON → DARK_CASTLE
FOREST       → CASTLE (via createCastleSidePathOptions)
CASTLE/DARK_CASTLE → null (no further sidepaths)
```

### Source 3: Main path in `downladderMaker.ts:25-38` (possibly obsolete)

```
depth < 1   → FOREST
depth == 1  → CAVE
depth > 1   → 50/50 FOREST or CAVE
```

### The Conflict

Sources 1 and 2 can both fire for the same level. In `populateRooms()`:
- Lines 562-602: Source 1 fires for DUNGEON environments based on depth
- Lines 620-622: Source 2 fires based on the level's environment type

Both can call `addDownladder()`, creating multiple sidepath ladders per level with environments determined by different logic. There is no single table or config that says "depth 2, environment CAVE → sidepath should be X."

### What a Single Source of Truth Would Look Like

A single configuration table mapping `(depth, parentEnvironment)` → `{ childEnvironment, sidePathOptions }` that is consulted by one method.

---

## Sidepath Configuration Scattering

### Where DownLadders Are Created (5 locations)

| Location | Method | Environment Source | Opts Source |
|----------|--------|--------------------|-------------|
| roomPopulator.ts:744 | `addDownladder()` | Depth-based ternary chain (Source 1) | Parameter from `populateRooms()` |
| roomPopulator.ts:705 | `addTrainingDownladder()` | Hardcoded `EnvType.DUNGEON` | Parameter |
| roomPopulator.ts:3123 | `populateRopeHole()` | `depth < 1 ? FOREST : CAVE` | None |
| roomPopulator.ts:3811-3938 | `populateSingleRoomSidepathMaze()` | From `getEnvDrivenSidePathOptions()` | From generation options |
| roomPopulator.ts:2959 | `populateDownLadder()` (main path) | Hardcoded `EnvType.DUNGEON` | `undefined` |

Each location makes its own environment decision with its own logic.

### Where SidePathOptions Are Built (4 locations)

| Location | Context | Key Decisions |
|----------|---------|---------------|
| roomPopulator.ts:567-601 | `populateRooms()` depth branches | Depth 1: `caveRooms: numRooms * 2`. Depth 2: `locked: true, linearity: 0.8`. Default: basic options |
| roomPopulator.ts:212-234 | `getEnvDrivenSidePathOptions()` | CAVE→darkCastle opts, FOREST→castle opts, DARK_DUNGEON→custom opts |
| sidePathManager.ts:64-97 | `baseCastleOptions()` factory | XY symmetry, 12 rooms, linearity 0.8, 30×30 map |
| roomPopulator.ts:3683+ | `populateSingleRoomSidepathMaze()` | Combines opts from level.generationOptions with env-driven overrides |

### The SidePathOptions Flow

```
SidePathOptions is defined in sidePathManager.ts:12-50

Created in: roomPopulator.populateRooms() or getEnvDrivenSidePathOptions()
     ↓
Stored on: DownLadder.opts (downLadder.ts:24)
     ↓
Consumed by: SidePathManager.generateFor() → passes to levelgen.generate()
     ↓
Stored on: Level.generationOptions (level.ts:120)
     ↓
Consumed by: partitionGenerator via opts parameter
     ↓
Also serialized: tilesBuiltins.ts:153-205 (save/load codec)
```

This chain works, but the creation point is fractured across 4 locations with different logic.

---

## roomPopulator.ts Sprawl

**4,069 lines. 40+ methods. 24 populate-prefixed methods. Dual dispatch.**

### Dual Dispatch Problem

Room population dispatches on two axes:

1. **By RoomType** via `populate()` at line 3555 — 16-case switch calling `populateDungeon()`, `populateBoss()`, etc.
2. **By EnvType** via `populateByEnvironment()` at line 669 — 6-case switch calling `populateCaveEnvironment()`, `populateForestEnvironment()`, etc.

Both run during `populateRooms()`. The room-type dispatch handles structural concerns (what tiles/doors/ladders go in this room shape). The environment dispatch handles thematic concerns (what props/enemies go in this biome). But the boundary is blurry — `populateCaveEnvironment()` adds enemies, and `populateDungeon()` calls `addProps()`. Some methods do both.

### Duplicated Enemy Density Formula

The same calculation exists in two places:

**`addEnemiesForLevel()` (line 2050-2063):**
```
rawFactor = (depth + ENEMY_DENSITY_DEPTH_OFFSET) * ENEMY_DENSITY_DEPTH_MULTIPLIER
factor = min(rawFactor, MAX_ENEMY_DENSITY)
baseCount = ceil(max(randomNormalInt(), meanValue * factor))
numEnemies = min(baseCount, numEmptyTiles)
```

**`addRandomEnemies()` (line 2409-2426):**
Same formula, nearly line-for-line.

Plus `populateCave()` (line 2918) uses a *different* hardcoded formula: `numEmptyTiles * randTable([0.25, 0.3, 0.35])`.

### Fragmented Torch/Window System

Each has 4 methods:

| Concept | Methods | Lines |
|---------|---------|-------|
| Torches | `addDoorTorches()`, `addTorches()`, `addRandomTorches()`, `addTorchesByArea()` | 1455, 1481, 3180, 3209 |
| Windows | `addDoorWindows()`, `addWindows()`, `addRandomWindows()`, `addWindowsByArea()` | 1550, 1574, 3195, 3233 |

### Three-Layer Enemy System

```
addEnemiesForLevel()  ─┐
                       ├──→ addEnemiesUnified() → spawnEnemiesFromPool()
addRandomEnemies()  ───┘
```

`addEnemiesForLevel()` is the level-wide distributor (called once per level). `addRandomEnemies()` is the per-room calculator (called by environment-specific methods). Both eventually call `addEnemiesUnified()`. The two entry points have overlapping responsibility.

### Method Inventory Summary

| Category | Count | Key Methods |
|----------|-------|-------------|
| Room-type populate methods | 15 | `populateDungeon`, `populateBoss`, `populateCave`, `populateShop`, etc. |
| Environment populate methods | 7 | `populateCaveEnvironment`, `populateForestEnvironment`, etc. |
| Special populate methods | 2 | `populateGiantSingleRoomRopeCave`, `populateSingleRoomSidepathMaze` |
| Enemy methods | 8 | `addEnemiesForLevel`, `addRandomEnemies`, `addEnemiesUnified`, `addSpawners`, etc. |
| Props methods | 4 | `addProps`, `addPropsWithClustering`, `getCavePropsWithReducedResourceWeights`, `addCaveOrePocket` |
| Decoration methods | 8 | 4 torch methods, 4 window methods |
| Sidepath/ladder methods | 5 | `addDownladder`, `addTrainingDownladder`, `populateDownLadder`, etc. |
| Utility methods | ~10 | Distance computation, tile selection, footprint checks, etc. |

---

## RoomType System: 27 Types, Uneven Handling

### Defined in `room.ts:203-231`

27 total values: START, DUNGEON, BOSS, BIGDUNGEON, TREASURE, FOUNTAIN, COFFIN, GRASS, PUZZLE, KEYROOM, CHESSBOARD, MAZE, CORRIDOR, SPIKECORRIDOR, UPLADDER, DOWNLADDER, SHOP, BIGCAVE, CAVE, SPAWNER, ROPEHOLE, ROPECAVE, TUTORIAL, GRAVEYARD, FOREST, ROPEUP, GEMCAVE

### Coverage

| Status | Count | Types |
|--------|-------|-------|
| Fully implemented (populate + lighting + assignment) | 16 | START, DUNGEON, BOSS, BIGDUNGEON, CAVE, BIGCAVE, TREASURE, SPIKECORRIDOR, UPLADDER, DOWNLADDER, ROPEHOLE, ROPECAVE, SHOP, SPAWNER, PUZZLE, GRASS |
| Partial (lighting or skin override only) | 4 | GEMCAVE, KEYROOM, ROPEUP, FOREST |
| PNG color mapping only (no code behavior) | 6 | FOUNTAIN, COFFIN, CHESSBOARD, MAZE, CORRIDOR, GRAVEYARD |
| Validation-only | 1 | TUTORIAL |

The 6 PNG-only types exist so level designers can paint them in PNG templates, but they fall through to no-op in the populate switch. Some of these (FOUNTAIN, CHESSBOARD, MAZE) seem like they're intended for future implementation. Others (CORRIDOR, GRAVEYARD) may be aspirational.

### Ad-hoc Checking

RoomType is checked ad-hoc in 16 files. Some patterns:
- **Exclusion lists:** "don't put enemies in START, DOWNLADDER, UPLADDER, ROPEHOLE" appears in ~3 places with slightly different lists.
- **Lookup patterns:** `rooms.find(r => r.type === RoomType.X)` scattered across levelGenerator, sidePathManager, level, godStone.
- **Skin overrides:** ROPEUP and FOREST set special skin types in room.ts:699, conflating room type with environment type.

---

## Environment-Specific Logic Duplication

### Cave Ore Logic — 3 Instances

| Location | Lines | Context |
|----------|-------|---------|
| `populateCaveEnvironment()` | 1288-1341 | Adds ore pockets during environment population |
| `addEnemiesForLevel()` | ~2201-2210 | Adds ore pockets during level-wide enemy pass |
| Environmental features | ~2745-2753 | Adds ore pockets in a third pass |

Same concept, three call sites. Each may use slightly different parameters.

### Forest Tree Blob Logic — 2 Instances

| Location | Lines | Context |
|----------|-------|---------|
| `populateForestEnvironment()` | 1343-1355 | Adds tree blobs during environment population |
| Environmental features | ~2749 | Adds tree blobs in a second pass |

### Castle-Like Environment Checks — 4+ Instances

The check "is this a castle-like environment?" appears as:
- `CASTLE_LIKE_ENV_TYPES.has(env)` in sidePathManager.ts
- `env === EnvType.CASTLE || env === EnvType.DARK_CASTLE` in roomPopulator.ts (×3+)
- Various inline checks throughout population logic

### Torch Exclusion for Forest — Hardcoded

`roomPopulator.ts:1488-1492`: Torches are excluded from FOREST with a direct `if` check. This should be an environment property like `hasTorches: boolean`.

### Water Tile Selection — Switch Statement

`roomPopulator.ts:672-686`: Chooses Pool vs MagmaPool based on environment. Only MAGMA_CAVE differs. Could be a simple `waterTileClass` property on the environment data.

---

## game.ts God Object

**6,596 lines.** Acts as:

| Role | Responsibility |
|------|----------------|
| Level orchestrator | Triggers generation, manages level state machine |
| Room registry | `rooms[]`, `roomsById`, `registerRooms()`, `updateLevel()` |
| Renderer | Main render loop, transition animations, post-processing |
| State machine | 4 states: IN_LEVEL, TRANSITIONING, TRANSITIONING_LADDER, LEVEL_GENERATION |
| Input handler | Player input dispatch |
| Camera controller | Camera position, shake, animation |
| Audio coordinator | Music transitions |
| Save/load entry point | Delegates to gameState.ts but holds context |

### Key Level-Related Methods in game.ts

| Method | Lines | What It Does |
|--------|-------|-------------|
| `changeLevelThroughDoor()` | 1758-1816 | Immediate room switch + transition animation setup |
| `changeLevelThroughLadder()` | 1707-1756 | Queued room switch after generation |
| `updateLevel()` | 1487-1495 | Syncs game.level/rooms to a room's parent level |
| `registerRooms()` | 1509-1512 | Sets game.rooms and roomsById |
| `beginPreLevelGenFade()` | 1536-1562 | Fade-to-black before generation |

The level state management (IN_LEVEL ↔ TRANSITIONING ↔ LEVEL_GENERATION) is mutated from many locations. The room registry (rooms[], roomsById) is updated from both game.ts and room.ts:enterLevel().

### What Could Be Extracted

- **LevelStateController:** The 4-state machine with transition timing
- **RoomRegistry:** rooms[], roomsById, updateLevel(), registerRooms()
- **TransitionAnimator:** Door/ladder transition vectors, fade timing
- **The render loop itself** is too intertwined to extract easily, but the state checks could be cleaner

---

## Dead and Vestigial Code

| Code | Location | Status |
|------|----------|--------|
| `downladderMaker.ts` | `src/entity/downladderMaker.ts` | Appears unused — `createDownladder()` not called from roomPopulator |
| `populateByType()` | roomPopulator.ts:853 | Empty stub, never called |
| `populateEmpty()` | roomPopulator.ts:2822 | No-op, called for several room types |
| `addProps()` | roomPopulator.ts:855 | Superseded by `addPropsWithClustering()`, commented out at call sites |
| `populateCave()` enemy formula | roomPopulator.ts:2918 | Hardcoded density, commented as disabled |
| 6 RoomTypes with no behavior | room.ts | FOUNTAIN, COFFIN, CHESSBOARD, MAZE, CORRIDOR, GRAVEYARD |

---

## Refactoring Plan

### Phase 1: Single Source of Truth for Level Progression (High Priority)

**Goal:** One configuration table that answers "given (depth, parentEnvironment), what sidepath environment and options should be used?"

**Steps:**

1. Create a `LevelProgressionConfig` data structure:
   ```typescript
   interface SidePathSpec {
     environment: EnvType;
     options: Partial<SidePathOptions>;
   }

   // Map from (depth, parentEnv) → sidepath specification
   type ProgressionTable = Map<string, SidePathSpec>;
   ```

2. Populate the table with the currently-scattered logic:
   - Depth-based defaults (from addDownladder)
   - Environment-driven chains (from getEnvDrivenSidePathOptions)
   - Castle options (from sidePathManager factories)

3. Replace the 5 DownLadder creation sites with a single method that consults this table.

4. Delete `downladderMaker.ts` if confirmed unused.

**Files touched:** roomPopulator.ts, sidePathManager.ts, new levelProgressionConfig.ts

### Phase 2: Consolidate Environment Properties (Medium Priority)

**Goal:** Environment-specific behaviors (has torches, water tile type, ore pockets, tree blobs) should be properties in the `environmentData` table, not scattered if/else checks.

**Steps:**

1. Extend the `EnvironmentData` interface in environment.ts:
   ```typescript
   interface EnvironmentData {
     props: PropInfo[];
     enemies: EnemyInfo[];
     bosses: BossInfo[];
     // NEW:
     hasTorches?: boolean;        // default true, false for FOREST
     waterTile?: typeof Tile;     // Pool or MagmaPool
     oreGeneration?: OreGenConfig; // cave ore pocket params
     treeGeneration?: TreeGenConfig; // forest tree blob params
   }
   ```

2. Move scattered checks into data-driven lookups.

3. Consolidate the 3 cave ore instances and 2 forest tree instances into single methods that read from this config.

**Files touched:** environment.ts, roomPopulator.ts

### Phase 3: roomPopulator.ts Decomposition (Medium Priority)

**Goal:** Break the 4,069-line file into focused modules.

**Suggested decomposition following the pattern in `documentation/refactor.md`:**

| New Module | Responsibility | Methods Moving |
|------------|---------------|----------------|
| `enemyPopulator.ts` | All enemy placement logic | `addEnemiesForLevel`, `addRandomEnemies`, `addEnemiesUnified`, `spawnEnemiesFromPool`, `addSpawners`, `addOccultists`, `addBosses`, `generateEnemyPoolIds`, `getAvailableEnemiesForRoom` |
| `propPopulator.ts` | All prop/object placement | `addProps`, `addPropsWithClustering`, `getCavePropsWithReducedResourceWeights`, `addCaveOrePocket`, `addChests`, `addResources`, `addGems`, `addBombs` |
| `decorationPopulator.ts` | Torches, windows, environmental features | All 4 torch methods, all 4 window methods, `addEnvironmentalFeatures`, `addChasms`, `addMagmaPools`, `addPools`, `addSpikeTraps` |
| `sidepathPopulator.ts` | DownLadder creation and sidepath setup | `addDownladder`, `addTrainingDownladder`, `populateDownLadder`, `populateRopeHole`, `populateRopeCave`, `populateSingleRoomSidepathMaze` |
| `roomPopulator.ts` (reduced) | Orchestration + room-type dispatch | `populateRooms`, `populate`, `populateByEnvironment`, room-type-specific methods |

The main `Populator` class would hold references to these sub-modules (composition pattern from refactor.md).

### Phase 4: Merge Duplicated Enemy Density Logic (Low Priority, Do With Phase 3)

**Goal:** One `calculateEnemyCount(room, depth)` function used by both `addEnemiesForLevel` and `addRandomEnemies`.

### Phase 5: Clean Up RoomType (Low Priority)

**Goal:** Decide which of the 11 unhandled RoomTypes are intentional placeholders (for PNG maps) vs truly dead.

**Steps:**
1. Audit PNG level files to see which types are actually painted
2. Remove types that are neither painted nor coded
3. For types that ARE painted but have no behavior, add explicit no-op comments in the switch so it's clear they're intentional fallthrough
4. Consolidate the room-type exclusion lists ("don't put enemies in X, Y, Z") into a single `ROOM_TYPES_WITHOUT_ENEMIES` set

### Phase 6: game.ts Extraction (Low Priority, Long-term)

**Goal:** Extract room registry and level state machine from game.ts.

This is lower priority because game.ts works and is rarely the source of bugs. But extracting a `RoomRegistry` service and a `LevelStateController` would make the code more navigable and reduce the surface area for accidental mutation.

---

## Key File Reference

| File | Lines | Role |
|------|-------|------|
| `src/game.ts` | 6,596 | God object: orchestration, rendering, registry, state machine |
| `src/room/roomPopulator.ts` | 4,069 | All room population logic |
| `src/level/levelGenerator.ts` | 444 | Level generation orchestration |
| `src/level/partitionGenerator.ts` | ~2,200 | BSP room layout algorithm |
| `src/level/pngPartitionGenerator.ts` | ~600 | PNG-based room layout |
| `src/level/environment.ts` | ~790 | Environment data tables (props, enemies, bosses) |
| `src/level/sidePathManager.ts` | ~228 | Sidepath generation coordination |
| `src/level/levelParametersGenerator.ts` | ~72 | Depth → generation parameters |
| `src/level/level.ts` | ~480 | Level container (rooms, paths, environment) |
| `src/room/room.ts` | ~1,700 | Room class, RoomType enum, EnemyType enum |
| `src/tile/downLadder.ts` | ~184 | DownLadder tile (stores environment, opts, triggers generation) |
| `src/entity/downladderMaker.ts` | ~46 | Possibly dead code |
| `src/game/gameplaySettings.ts` | ~105 | Tunable gameplay constants |
| `src/game/gameConstants.ts` | ~50 | Build/engine constants |
| `src/room/propClusterer.ts` | ~725 | Prop clustering algorithm |
| `src/item/dropTable.ts` | ~423 | Item drop configuration |
