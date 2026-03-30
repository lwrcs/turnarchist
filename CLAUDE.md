# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i              # Install dependencies
npm run watch      # Build + watch (webpack dev mode, runs continuously)
npm run build      # Production build
npm run dev        # Start http-server on port 8080
```

**Do not run `npm run build` manually** — a `watch` process is always running and rebuilds automatically. Serve locally with `python3 -m http.server 8000` or `npm run dev`.

There are no automated tests.

## Architecture

**Turnarchist** is a turn-based browser roguelike written in TypeScript (~88k lines), bundled with Webpack 5. The game renders to an HTML Canvas using 2D context for tiles/entities and WebGL for blur/water overlay post-processing.

### Core class hierarchy

```
Drawable
  └── Item          (world-dropped collectibles)
  └── Entity
        └── Enemy   (all enemies; 36+ subtypes)
        └── Player

Tile               (room grid cells; 40+ subtypes)
Room               (contains roomArray[][], entities[], items[])
Level              (contains Room[]; a floor/dungeon level)
Game               (top-level singleton; owns Level, Players, rendering)
```

### Dependency rules (`src/structure notes.md`)

Lower-level classes store references to higher-level classes — this is intentional and pervasive. `Entity` holds `Room` and `Game`; `Tile` holds `Room`; `Item` holds `Room`. Do not fight this pattern. The main known usages are documented in `src/structure notes.md`.

### Turn / tick model

The game is **turn-based**: the player acts, then each enemy in the current room calls `behavior()`. `Enemy.behavior()` checks `room.playerTicked` to sync with the correct player. `skipNextTurns` on an enemy pauses it for N turns (used after attacks, knockback, etc.). The `ticks` counter increments each turn the enemy is active.

### Enemy AI

`Enemy` base class in `src/entity/enemy/enemy.ts`:
- Starts passive (`seenPlayer = false`); calls `lookForPlayer()` each tick (detects within distance 4).
- Once aggro'd, calls `findPath()` using A* (`src/utility/astarclass.ts`) each turn.
- `getDisablePositions()` marks other entities and active `SpikeTrap` tiles as impassable.
- Specific enemies override `behavior()`, `hit()`, `hurt()`, and `draw()`.
- AI dispatch lives in `src/entity/enemyAIHandler.ts`.

### Level generation

`src/level/levelGenerator.ts` orchestrates generation. Rooms are arranged via `partitionGenerator.ts` (BSP-style) or `pngPartitionGenerator.ts` (image-based templates). Each `Room` has a `roomArray[x][y]: Tile` grid. Environmental biome parameters are in `src/level/environment.ts`. Side paths documented in `src/level/sidepath.md`.

### Save / load

`src/game/save/savePersistence.ts` serializes to browser storage. Entity/item serialization uses codec registries in `src/game/save/registry/`. The save format is documented in `documentation/save_format.md`.

### Rendering pipeline

1. Tiles drawn first (bottom layer)
2. Items and entities drawn sorted by `drawableY`
3. UI/GUI drawn on top
4. WebGL post-processing (blur via `webglBlurRenderer.ts`, water via `webglWaterOverlayRenderer.ts`)

`Game.drawMob()` and `Game.drawItem()` are static helpers that blit from a sprite sheet using tile coordinates (`tileX`, `tileY`). The coordinate system is top-left origin, positive x right, positive y down.

### Event system

`src/event/eventBus.ts` is a global event bus (`globalEventBus`). Event types are in `src/event/events.ts`. Used for loose coupling (e.g., `EnemySeenPlayer`, tutorial triggers).

### Key directories

| Path | Contents |
|------|----------|
| `src/entity/enemy/` | 36+ enemy classes |
| `src/tile/` | 40+ tile types |
| `src/item/` | weapons, tools, armor, usables, resources, jewelry |
| `src/level/` | level and room generation |
| `src/gui/` | menus, map, skills UI, tooltips, post-processing |
| `src/game/save/` | persistence and serialization codecs |
| `src/utility/` | A*, RNG, general utils |
| `documentation/` | design docs, todo, lore, save format |
