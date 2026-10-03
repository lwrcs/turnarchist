# World state ownership and room handoffs

This describes the current implementation at `29f16570` and the narrow naming
clarifications made afterward. It is a guide for adding content and for later
refactors, not a new runtime contract. The game and training simulator depend on
the current ordering of generation, transitions, drawing, and saves.

## Terms and owners

| State | Owner and current meaning | Main source |
| --- | --- | --- |
| `Room.level` | The `Level` object that owns a room. Sidepath rooms point to a sidepath level. | `src/room/room.ts` constructor |
| `Level.rooms`, `Level.roomsById`, `Level.paths*` | The level's room list and local lookup/grouping structures. `Level.setRooms()` assigns each `Room.id` to its index in `Level.rooms`. | `src/level/level.ts` `setRooms()` |
| `Game.levels`, `Game.levelsById` | Generated main-path levels and their registered IDs. Sidepath levels are created but are not appended to `Game.levels`. | `src/level/levelGenerator.ts` `generate()` |
| `Game.room` | Room being presented in the local game view. This can differ temporarily from the player's destination during a ladder fade. | `src/game.ts` `setActiveRoom()` and transition methods |
| `Game.level`, `Game.rooms`, `Game.roomsById` | Active-level pointers and its current room lookup, rebuilt by `updateLevel()`/`setActiveRoom()`. They are not a world-wide sidepath registry. Generation and restore can temporarily rebind them. | `src/game.ts` `updateLevel()`, `registerRooms()`; `src/game/save/loadV2.ts` |
| `Player.roomGID`, `Player.levelID`, `Player.depth` | Player location. `roomGID` names a room by global ID; `levelID` is a legacy **room index within that player's level**, despite its name. `depth` is the room's floor depth. `getRoom()` tries the active room lookup, then main levels by depth/index, then `Game.room`. | `src/player/player.ts` `getRoom()` |
| `Room.pathId`, `Game.currentPathId` | Room's path membership versus the path selected for draw/update filtering. Sidepath IDs encode a parent path and ladder coordinates. `currentPathId` is switched before some ladder room handoffs. | `src/level/sidePathManager.ts`; `src/game.ts` draw/update filters |
| `Room.mapGroup` | Group of rooms shown together on the minimap; this is separate from `pathId`, room ID, and depth. | `src/gui/map.ts` `saveMapData()` |
| `Game.currentDepth` | Current local game depth, updated during ladder handoff and save restoration. It is a convenience mirror; individual rooms and players also carry depth. | `src/game.ts` `updateDepth()` |
| `Game.levelState`, `prevLevel`, `transitioningLadder`, transition timing/offsets | Presentation and pending handoff state, rather than persistent ownership of a room. | `src/game.ts` transition methods, `run()`, `draw()` |

`Room.globalId` and `Level.globalId` are generated identities for a world and
are matched or restored during loading. `Room.id` is an array index. Do not
substitute one for the other, especially when a sidepath and a main level share
a depth. `Game.getRoomById()` only searches the current `Game.roomsById` map;
`Level.getRoomById()` searches that particular level.

## Handoffs as implemented

| Entry | Sequence that matters |
| --- | --- |
| Main-level generation | `LevelGenerator.generate()` creates a `Level`, appends/registers it only for the main path, builds rooms, calls `Level.setRooms()`, then populates. For a main level it calls `Game.registerRooms()` and updates `Game.level`; for a sidepath it returns the linked entry room without replacing the active game room list. |
| Door within a level | `Game.changeLevelThroughDoor()` sets the player's destination ID/index, exits the old room, calls `setActiveRoom(door.room)`, and enters via `Room.enterLevelThroughDoor()`. It sets `LevelState.TRANSITIONING` for presentation. |
| Down ladder | `DownLadder.doEnterLevel()` generates/links the destination, selects its path for a sidepath, then calls `changeLevelThroughLadder()`. That method updates player destination and depth, exits the old room, and stores the ladder. The new `Game.room` is installed when the fade reaches its handoff in `draw()` or `completeLadderTransitionForSimulation()`, followed by `Room.enterLevel()`. |
| Up rope | `UpLadder` selects the linked parent room's path before calling the same ladder transition. The linked room and saved exit coordinates determine the arrival. |
| Save V2 load | `loadV2.ts` regenerates and restores rooms, resolves each player by saved room GID, then explicitly rebinds `Game.room`, `level`, `rooms`, lookup, depth, and path to the local player's room. `loadingSaveV2` suppresses normal updates while this is incomplete. |
| Legacy load | `gameState.ts` also restores by room GID when possible and has map-group, coordinate, and index fallbacks. This separate path retains its existing serialized names. |

At a **settled local-player handoff**, the intended relationship is
`game.room.level === game.level`, `game.rooms === game.level.rooms`, the active
room is in that list, `game.currentPathId === game.room.pathId`, and the local
player's `roomGID`, `levelID`, and `depth` identify that room. These are
review invariants, not assertions that hold during every generation, fade,
debug setup, or loading step. In particular, ladder transitions set player
destination/depth and may select the path before switching `Game.room`.

## Save names and expansion rules

Save V2 already persists `roomGid`, `roomId`, `pathId`, `mapGroup`, and depth
in room data (`src/game/save/schema.ts`), plus player room GIDs. The legacy
format uses names such as `roomGID`, `roomID`, and `levelID` in
`src/game/gameState.ts`. These are format fields: renaming a TypeScript field
alone would not migrate existing saves. Keep the persisted spelling and add a
versioned migration only when the stored meaning must change.

For a new room or route, start with its owning `Level`, room index, path ID,
map group, and linked door/ladder. Check both the normal transition and the
save/restore path; a generated sidepath is not automatically available through
`Game.levels` or the current `Game.roomsById`. Preserve the fade handoff used
by the visible renderer and the hidden planning simulator. If ownership is
centralized later, first capture real-browser continuation through doors,
ladders, saves, and sidepaths with exact room/path/RNG comparisons; the
remaining parity checklist in `engineering-stabilization-2026-09-27.md` tracks
those gates.

The nearby `level-system-investigation.md` is historical investigation, not a
current ownership contract. This guide describes the code paths named above
without changing their behavior.
