Looking into how sidepaths are currently generated and merged, where IDs and coordinates are handled, and why multiple sidepaths share the same generated level. I’ll open the sidepath-related generator and populator code to trace the flow.
Ran tool
Ran tool
Ran tool
Ran tool
Ran tool

Ran tool
High-level findings on current sidepath architecture:

- Generation always writes new rooms into the global `game.rooms` and registers them via `game.registerRooms(rooms)` even for sidepaths. This forces all rooms (main path and any sidepaths) into the same “active set,” which causes spatial overlap and cross-talk.
- Sidepath generation uses the same `depth` and a new `mapGroup` computed from the current tail of `game.rooms`. Multiple sidepaths created at the same depth reuse the same Random state seeding (`Random.setState(this.seed + depth)`), so they can produce identical sidepath layouts unless other state differs.
- For sidepaths, a `Level` object is created but deliberately not pushed into `game.levels` (“create Level object ONLY to prepare rooms, but DO NOT push to game.levels”). Yet those rooms are still pushed into `game.rooms` and `game.roomsById`. This is why multiple down ladders at the same depth end up “sharing” the same sidepath space.
- `RoomPopulator.addDownladder` currently blindly adds 3 down ladders per level and selects rooms randomly. That will create multiple sidepath entry points but they all point to future on-demand generated sidepath rooms that get dumped into the same global room array.
- During save/load, the code uses `mapGroup` and `roomID` to reconstruct, but that still assumes a single global space of rooms per depth. There’s workaround logic to pre-generate “missing” sidepath groups and merge them into `level.rooms`.

Why multiple sidepaths collide or share the same sidepath:

- Sidepaths reuse global containers (`game.rooms`, `roomsById`) instead of living in their own isolated container per sidepath instance.
- Random seed for sidepaths is `seed + depth` (not unique per sidepath instance), so invoking two sidepaths at the same depth may produce identical partitions.
- No per-sidepath ID namespace: `mapGroup` is a monotonically increasing number based on `game.rooms`, not a unique container keyed off the downladder instance.

Proposed direction to enable multiple independent sidepaths (and nesting)

- Sidepath instance model

  - When a `DownLadder` is first used, spawn a dedicated sidepath instance with:
    - A unique sidepath ID (e.g., `SP-<random/gid>`) derived from the downladder tile’s `globalId`.
    - Its own `Level` object and its own `rooms` array, not merged into `game.rooms`.
    - Its own `roomsById` map separate from the main level.
    - Its own random state seed (e.g., `seed = baseSeed ^ hash(sidepathGID)`).
  - Store a reference on the `DownLadder` to this instance (e.g., `downLadder.sidepathId` and `downLadder.sidepathLevelGID`) and to the linked entrance `UpLadder`.
  - For nested sidepaths, the process repeats: when inside a sidepath, clicking another `DownLadder` spawns another child sidepath instance chained off the parent sidepath ID.

- Game switching between room containers

  - Introduce a `WorldContext` object encapsulating:
    - `rooms`, `roomsById`, `level` pointer and `levelsById` for the current context (main path or a sidepath instance).
  - `Game.room`, `Game.rooms`, etc., reference the active context. Transition through a door or ladder swaps the active context to the target sidepath’s context level/rooms.
  - Current rendering and update paths (drawRooms/drawRoomShadeAndColor) already iterate over `this.rooms` and `this.room`, so swapping the context means they won’t draw other contexts.
  - Player carries `roomGID` keyed to the active context; when saving, persist the “current context ID” plus the room GID inside that context.

- Save/load adjustments

  - For each sidepath instance, save a small blob: sidepathId, depth, env, and the rooms array and tiles like the main level. Save a “parent link” (GID of parent room/tile).
  - For PlayerState, persist a context ID (main or sidepathId) and `roomGID` inside that context.
  - On load, rehydrate the sidepath graphs into separate contexts; don’t merge their rooms into the global main `game.rooms`.

- Short-term fix to allow multiple sidepaths without full refactor

  - Make sidepaths generate with a unique seed per entrance:
    - In `DownLadder.onCollide` before calling `levelgen.generate`, set a deterministic seed from `downLadder.globalId` (e.g., `Random.setState(hash(seed, downLadder.globalId))`).
  - Keep sidepaths in separate `Level`s and do not call `game.registerRooms(rooms)` for sidepaths.
  - Instead, keep sidepath rooms in a map on the `DownLadder`/`UpLadder` pair, e.g., `downLadder.sidepathRooms` and switch `Game.rooms` temporarily when entering through that ladder:
    - On `changeLevelThroughLadder`, if ladder has `linkedRoom` with a dedicated sidepath rooms array, set `game.rooms = ladder.sidepathLevel.rooms`, `game.roomsById` accordingly, set `game.level = ladder.sidepathLevel`.
    - On returning via `UpLadder`, restore `game.rooms` to the main level’s rooms and `game.level` accordingly.
  - This isolates the coordinate space and avoids needing the current coordinate offsets hack.
  - For now, carry a `contextStack` in `Game` for nested sidepaths, pushing current context on enter and popping on exit.

- RoomPopulator
  - Remove or parameterize the triple downladder injection; make it configurable or treat deep sidepath addition more intentionally.
  - Ensure `DownLadder` has a unique environment for each instance if needed.

Key code touchpoints to implement minimal viable version

- `src/level/levelGenerator.ts`
  - When `isSidePath === true`, do not call `game.registerRooms(rooms)`. Instead create and return a full `Level` object with its own rooms; set their `level` pointer correctly. Don’t touch `game.rooms` at all.
  - Seed deterministically with a unique value per downladder instance (pass in a seed param, or compute in caller).
- `src/tile/downLadder.ts`
  - In `generate`, compute a unique seed from `this.globalId` (or from parent room GID + coords), set this on `levelgen` before calling, and on callback store the resulting `Level` on the ladder: `this.sidepathLevel = newLevel; this.linkedRoom = linkedStartRoom;`
  - In `onCollide`, when all players are present, set the game context to this.sidepath context (swap `game.rooms`, `game.roomsById`, `game.level`), then run the transition like main path. On return via `UpLadder`, pop the context to restore previous.
- `src/tile/upLadder.ts`
  - When `isRope` and `linkedRoom` points back to a parent context, return to that parent context by swapping the active context.
- `Game`
  - Add an internal context stack:
    - Each context contains `{ level, rooms, roomsById }`
    - Methods to `pushContext(ctx)` and `popContext()` and `setContext(ctx)`
  - Update transition methods to use context push/pop for sidepath ladders.
- Save/load
  - First step: tag the current context in `GameState` minimally: `currentContext = 'main' | sidepathId` and persist per-sidepath levels (optional for phase 1). Alternatively, avoid saving sidepath instances initially (generate on demand on enter), which is acceptable if you’re okay with sidepaths re-rolling.

Immediate next step recommendation

- Implement the minimal isolation: stop merging sidepaths into `game.rooms`. Add per-ladder cached sidepath `Level` and context push/pop on enter/exit. Use per-ladder seed to generate unique sidepaths. This will allow:
  - Multiple distinct sidepaths in a floor
  - Nested sidepaths via stacking contexts
  - No coordinate overlap hacks
- We can then iterate to full persistence of sidepaths across saves.

I can start by:

- Adding a `SidepathContext` and context stack to `Game`.
- Adjusting `LevelGenerator.generate` to return the `Level` created and not register rooms when `isSidePath`.
- Wiring `DownLadder.generate()`/`onCollide()` to create/cache a `sidepathLevel` per ladder with a unique seed and to push the context on enter.
- Updating `UpLadder` to pop context on exit.

Say the word and I’ll implement this minimal isolation path.
