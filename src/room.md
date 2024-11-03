# `room.ts` Overview

The `room.ts` file defines the `Room` class, representing individual rooms or levels within the game. It manages the room's layout, entities, tiles, rendering logic, and gameplay mechanics specific to each room.

## Key Classes and Interfaces

### Interfaces

#### `WallInfo`

Stores information about wall tiles to assist with rendering and game logic.

- **Properties**:
  - `isTopWall`: `boolean`
  - `isBottomWall`: `boolean`
  - `isLeftWall`: `boolean`
  - `isRightWall`: `boolean`
  - `isInnerWall`: `boolean`
  - `isBelowDoorWall`: `boolean`
  - `isDoorWall`: `boolean`
  - `innerWallType`: `string | null`
  - `shouldDrawBottom`: `boolean`

### Enums

#### `RoomType`

Enumerates various types of rooms (e.g., `START`, `DUNGEON`, `BOSS`).

#### `TurnState`

Indicates whose turn it is in the game loop (`playerTurn` or `computerTurn`).

### `Room` Class

Represents a game room or level, handling its state, entities, tiles, and interactions.

#### Properties

- **Dimensions and Position**:
  - `roomX`, `roomY`: Coordinates of the room's top-left corner.
  - `width`, `height`: Dimensions of the room.
- **Game Elements**:
  - `roomArray: Tile[][]`: 2D array representing tiles in the room.
  - `entities: Entity[]`: List of entities (enemies, NPCs, objects).
  - `items: Item[]`: Collectible items within the room.
  - `doors: Door[]`: Doors connecting to other rooms.
  - `projectiles: Projectile[]`: Active projectiles in the room.
  - `particles: Particle[]`: Visual effect particles.
  - `hitwarnings: HitWarning[]`: Warnings for incoming attacks.
  - `lightSources: LightSource[]`: Sources of light.
  - `wallInfo: Map<string, WallInfo>`: Mapping of wall positions to `WallInfo`.
- **Visibility and Rendering**:
  - `vis: number[][]`: Grid indicating visibility levels for each tile.
  - `softVis: number[][]`: Smoothed visibility grid for rendering.
  - `shadeColor: string`: Color used for shading (default "black").
- **Game State**:
  - `type: RoomType`: Type of the room.
  - `depth: number`: Depth level in the game's hierarchy.
  - `mapGroup: number`: Identifier for grouping related rooms.
  - `name: string`: Name of the room.
  - `message: string`: Message displayed upon entering the room.
  - `turn: TurnState`: Current turn state.
  - `playerTurnTime: number`: Timestamp of the last player turn.
  - `entered: boolean`: Indicates if the player has entered the room.
  - `lastEnemyCount: number`: Tracks the number of enemies for gameplay events.
- **References**:
  - `game: Game`: Reference to the main game instance.
  - `savePoint: Room`: Reference to a save point room.

#### Constructor

```typescript
constructor(
  game: Game,
  x: number,
  y: number,
  w: number,
  h: number,
  type: RoomType,
  depth: number,
  mapGroup: number,
  rand = Random.rand
) { ... }
```

- Initializes room dimensions, position, and type.
- Sets up arrays for entities, items, tiles, and visibility grids.
- Calls `buildEmptyRoom()` to create the basic structure.

#### Key Methods

- **Room Construction and Initialization**:
  - `private buildEmptyRoom()`: Constructs the room with walls and floors.
  - `addDoor(x: number, y: number): Door`: Adds a door at the specified coordinates.
  - `calculateWallInfo()`: Computes wall information for rendering purposes.
- **Population Methods**:
  - `populateEmpty(rand: () => number)`: Populates an empty room with default elements like torches.
  - `private addVendingMachine(rand: () => number)`: Places a vending machine with random items.
- **Player and Level Transitions**:
  - `enterLevel(player: Player)`: Handles logic when a player enters the room.
  - `enterLevelThroughDoor(player: Player, door: Door, side?: number)`: Manages entry through a door.
  - `enterLevelThroughLadder(player: Player, ladder: any)`: Handles entry via ladders.
  - `exitLevel()`: Cleans up when exiting the room.
- **Gameplay Mechanics**:
  - `computerTurn()`: Executes the computer-controlled entities' actions.
  - `private checkForNoEnemies()`: Checks if all enemies are defeated to trigger events.
  - `alertEnemiesOnEntry()`: Alerts enemies when the player enters the room.
- **Tile and Position Utilities**:
  - `getTile(x: number, y: number): Tile`: Retrieves the tile at given coordinates.
  - `private pointInside(x, y, rX, rY, rW, rH): boolean`: Checks if a point is inside a rectangle.
  - `tileInside(tileX: number, tileY: number): boolean`: Determines if a tile is within the room.
  - `getEmptyTiles(): Tile[]`: Returns a list of empty tiles for object placement.
  - `private getRandomEmptyPosition(tiles: Tile[]): { x: number; y: number }`: Selects a random empty position.
  - `private getRoomCenter(): { x: number; y: number }`: Calculates the center coordinates of the room.
  - `private isPositionInRoom(x: number, y: number): boolean`: Checks if a position is within room bounds.
- **Rendering and Effects**:
  - `draw(delta: number)`: Renders the room and its contents.
  - `private drawLayer(delta, condition, method)`: Helper for rendering layers based on a condition.
  - `private addRandomTorches(intensity)`: Adds torches to the room based on specified intensity.
- **Save and Load Functionality**:
  - `createSavePoint()`: Creates a save point of the current room state.
  - `loadSavePoint()`: Loads the room from a saved state.

## Game Logic and Flow

- **Room Entry and Exit**:
  - When the player enters a room, `enterLevel` is called, which updates visibility, alerts enemies, and sets the player's position.
  - Exiting a room triggers `exitLevel`, which cleans up particles and resets states.
- **Turn Management**:
  - The game alternates between `playerTurn` and `computerTurn`.
  - During `computerTurn`, all entities perform their actions via `tick()`.
- **Entity and Item Management**:
  - Entities and items are updated each turn and removed if dead or collected.
  - Collision checks are performed between projectiles and entities or players.
- **Tile Management**:
  - The room's grid `roomArray` holds all tile objects.
  - Tiles have methods like `tickEnd()` for end-of-turn processing.
- **Visibility and Lighting**:
  - Visibility grids `vis` and `softVis` determine what the player can see.
  - Light sources are updated, and shadows are calculated.
- **Event Handling**:
  - Certain events, like defeating all enemies, trigger methods (`checkForNoEnemies`) that can unlock doors or display messages.

## Conventions and Patterns

- **Coordinate System**:
  - Uses a top-left origin coordinate system; positive X is right, and positive Y is down.
- **Method Visibility**:
  - Internal utility methods are marked as `private` to encapsulate functionality.
- **Data Encapsulation**:
  - Direct manipulation of critical properties is avoided; methods provide controlled access.
- **Consistency in Naming**:
  - CamelCase is used for method and property names.
  - Clear and descriptive method names enhance readability.
- **Pattern Recognition**:
  - Common patterns (e.g., getting a random empty position) are abstracted into reusable methods.
- **Separation of Concerns**:
  - Rendering logic is separated from game logic where possible.
  - Methods are focused on single responsibilities.

## Potential Improvements

- **Reduce Interdependency**:
  - **Decouple from `Game` Class**: The `Room` class heavily references the `Game` instance. Introducing interfaces or event dispatchers can reduce coupling.
- **Data Encapsulation**:
  - **Encapsulate Arrays**: Provide methods like `addEntity`, `removeEntity` instead of exposing arrays directly.
- **Centralize Common Types**:
  - **Shared Enums and Interfaces**: Move `RoomType`, `TurnState`, and `WallInfo` to a central `types.ts` file to promote reuse.
- **Consistency in Naming**:
  - **Standardize Method Prefixes**: Use prefixes like `on` for event handlers (e.g., `onEnterLevel`).
- **Method Visibility**:
  - **Review Public Methods**: Ensure only necessary methods are public; others should be private or protected.
- **Error Handling**:
  - **Robust Null Checks**: Methods like `getRandomEmptyPosition` should account for empty arrays to prevent runtime errors.
- **Performance Optimization**:
  - **Optimize Loops**: Large nested loops (e.g., in `calculateWallInfo`) can be optimized or cached.
- **Code Organization**:
  - **Group Similar Methods**: Organize methods logically (e.g., grouping all rendering methods together).

## Suggested Rule Updates

Based on our analysis, consider adding or updating the following rules:

**28. Encapsulate Collection Modifications**

- Provide methods to manage internal collections (e.g., entities, items) and avoid exposing them directly.

**29. Use Event Naming Conventions**

- Prefix event handler methods with `on` (e.g., `onPlayerEnter`) for clarity.

**30. Decouple Classes from `Game`**

- Reduce direct dependencies on the `Game` class by using interfaces or event buses.

**31. Implement Comprehensive Error Handling**

- Add checks and fallback mechanisms to handle potential errors gracefully.

**32. Optimize Rendering Strategies**

- Improve rendering performance by minimizing redundant calculations and leveraging caching where possible.

**33. Enhance Code Documentation**

- Add comments and documentation to complex methods to improve maintainability and assist future developers.

**34. Organize Code Structure**

- Arrange class properties and methods in a consistent order (e.g., properties, constructor, public methods, private methods).

---

By incorporating these improvements and adhering to the updated development principles, the `Room` class and overall codebase will become more robust, maintainable, and scalable. This will facilitate future enhancements, collaboration, and integration with AI tools.
