# `levelGenerator.ts` Overview

The `levelGenerator.ts` file is responsible for procedurally generating levels in the game, including dungeons, caves, and tutorial levels. It defines the structures and algorithms used to create partitions (rooms), connect them, and populate them with game elements.

## Key Classes and Functions

### Classes

#### `PartitionConnection`

Represents a connection between two partitions (rooms).

- **Properties**:

  - `x: number`
  - `y: number`
  - `other: Partition` - The connected partition.

- **Constructor**:
  - Initializes a connection at position `(x, y)` to another partition.

#### `Partition`

Represents a rectangular area in the game world, serving as a room or part of a level.

- **Properties**:

  - `x: number`, `y: number` - Top-left coordinates.
  - `w: number`, `h: number` - Width and height.
  - `type: RoomType` - The type of room (e.g., `DUNGEON`, `BOSS`, `START`).
  - `connections: Array<PartitionConnection>` - Connections to other partitions.
  - `distance: number` - Distance from the starting partition (used in pathfinding).

- **Methods**:
  - `split(): Array<Partition>` - Splits the partition into two smaller partitions.
  - `point_in(x: number, y: number): boolean` - Checks if a point is inside the partition.
  - `point_next_to(x: number, y: number): boolean` - Checks if a point is adjacent to the partition.
  - `area(): number` - Calculates the area of the partition.
  - `overlaps(other: Partition): boolean` - Checks if another partition overlaps with this one.
  - `get_branch_point(): { x: number; y: number }` - Gets a point on the perimeter for branching connections.

### Functions

#### `split_partitions(partitions: Array<Partition>, prob: number): Array<Partition>`

Recursively splits partitions based on a probability.

- **Parameters**:

  - `partitions`: The list of partitions to split.
  - `prob`: The probability of splitting a partition.

- **Returns**:
  - An updated list of partitions after splitting.

#### `populate_grid(partitions: Array<Partition>, grid: Array<Array<Partition | false>>, w: number, h: number): Array<Array<Partition | false>>`

Populates a grid to map which cells belong to which partitions.

- **Parameters**:

  - `partitions`: The list of partitions.
  - `grid`: The grid to populate.
  - `w`, `h`: Width and height of the grid.

- **Returns**:
  - The populated grid.

#### `generate_dungeon_candidate(map_w: number, map_h: number): Array<Partition>`

Generates a candidate dungeon layout.

- **Algorithm Overview**:

  - Initializes a partition covering the entire map.
  - Splits partitions multiple times with varying probabilities to create rooms.
  - Assigns room types (`START`, `BOSS`) based on partition size and position.
  - Connects rooms using `PartitionConnection`.
  - Adds loops and special rooms like down ladders.
  - Calculates distances for pathfinding.

- **Returns**:
  - An array of partitions representing rooms in the dungeon.

#### `generate_cave_candidate(map_w: number, map_h: number, num_rooms: number): Array<Partition>`

Generates a candidate cave layout.

- Similar to dungeon generation but tailored for caves.
- Limits the number of rooms to prevent timeouts.
- Rooms are connected until the desired number is reached.

#### `generate_cave(mapWidth: number, mapHeight: number): Array<Partition>`

Generates a cave by repeatedly attempting to create a valid cave candidate.

#### `generate_tutorial(height: number = 7, width: number = 7): Array<Partition>`

Generates a simple tutorial level with a single partition.

### `LevelGenerator` Class

This class orchestrates the generation of levels and integrates them into the game.

- **Properties**:

  - `game: Game` - Reference to the main game instance.
  - `seed: number` - Seed for random number generation.
  - `depthReached: number` - Tracks the depth of generated levels.
  - `currentFloorFirstLevelID: number` - Identifier for the first level on the current floor.

- **Methods**:

  - **`setSeed(seed: number): void`**

    - Sets the seed for random number generation.

  - **`getLevels(partitions: Array<Partition>, depth: number, mapGroup: number): Array<Room>`**

    - Converts partitions into actual game rooms.
    - Adds doors between rooms based on `PartitionConnection`.
    - Populates rooms with entities and items.

  - **`generate(game: Game, depth: number, cave = false): Room`**

    - Generates a set of levels and adds them to the game.
    - Parameters:
      - `game`: The main game instance.
      - `depth`: The current depth level.
      - `cave`: Boolean indicating whether to generate a cave or dungeon.
    - Returns:
      - The starting room (`RoomType.START` or `RoomType.ROPECAVE`).

  - **`generateFirstNFloors(game: Game, numFloors: number): void`**
    - Generates the first `n` floors of the game.
    - Useful for pre-loading levels.

## Level Generation Logic

### Dungeon Generation

1. **Initialization**:

   - Start with a single large partition covering the map area.

2. **Partition Splitting**:

   - Split partitions multiple times with varying probabilities to create diverse room sizes.

3. **Assigning Room Types**:

   - Designate the smallest room as the `START` room.
   - Designate the largest room as the `BOSS` room.

4. **Connecting Rooms**:

   - Use a frontier-based algorithm to connect rooms via doors until the boss is reachable.
   - Add loops by creating additional connections between non-adjacent rooms.

5. **Adding Special Rooms**:

   - Insert special rooms like down ladders (`RoomType.DOWNLADDER`) near the boss room.

6. **Pathfinding Data**:
   - Calculate distances from the start room to each room for gameplay mechanics.

### Cave Generation

- Similar to dungeon generation but focuses on creating a specified number of rooms.
- Does not include a boss room.
- Rooms are assigned as `CAVE` or `ROPECAVE` types.

### Tutorial Generation

- Generates a simple room of fixed size designated as a tutorial area.

## Conventions and Patterns

- **Coordinate System**:

  - Top-left origin with positive X to the right and positive Y downward.

- **Random Number Generation**:

  - Utilizes a custom `Random` class to maintain consistent procedural generation based on seed.

- **Room Connections**:

  - Connections between rooms are managed via `PartitionConnection` objects.
  - Doors are added to the actual game rooms based on these connections.

- **Method Visibility**:

  - All methods in the `LevelGenerator` class are public.
  - Helper functions outside classes are kept private to the module scope.

- **Data Encapsulation**:

  - `Partition` properties are public, which might lead to external modifications.

- **Naming Consistency**:
  - Room types and methods follow a consistent naming convention (e.g., `generate_dungeon_candidate`).

## Potential Improvements

- **Method Visibility**:

  - **Adjust Visibility**: Make methods that are intended for internal use within classes private to encapsulate functionality.
    - For example, in `Partition`, methods like `split` and `overlaps` could be private if not used externally.

- **Data Encapsulation**:

  - **Encapsulate Partition Properties**: Use getters and setters to control access to `Partition` properties.
    - Prevent external modification of `x`, `y`, `w`, `h` without proper validation.

- **Reduce Interdependency**:

  - **Decouple Classes**: The `LevelGenerator` class has direct dependencies on `Game`, `Room`, and other classes.
    - Introduce interfaces or abstract classes to reduce coupling.
    - Use dependency injection to provide required functionalities.

- **Centralize Common Types**:

  - **Extract Shared Types**: Move shared types like `RoomType` and utility functions into separate modules.
    - This promotes reuse and maintains consistency.

- **Consistency in Naming**:

  - **Standardize Method Names**: Ensure all method names follow a consistent convention.
    - For example, use verb-based names for actions (`generateDungeonCandidate`).

- **Pattern Recognition**:

  - **Modularize Repeated Logic**: Identify repeated patterns in level generation algorithms.
    - Abstract common logic into reusable functions or classes.
    - For example, the cave and dungeon generation share similar steps, which can be unified.

- **Error Handling**:

  - **Improve Stability**: Currently, some functions return empty arrays or throw errors when generation fails.
    - Implement retry mechanisms with a maximum number of attempts.
    - Provide meaningful error messages or fallback behaviors.

- **Optimize Performance**:

  - **Limit Max Tries**: High `max_tries` values in loops can lead to performance issues.
    - Optimize algorithms to reduce the need for excessive retries.

- **Comment and Documentation**:
  - **Clarify Code Purpose**: Replace casual comments with clear, professional explanations.
    - For example, update comments like `// remove rooms we haven't connected to yet` for clarity.

## Suggested Rule Updates

Based on the analysis, consider the following additions or modifications to the development principles:

20. **Method Visibility Enforcement**: Ensure methods and properties not intended for external use are marked as private to encapsulate class internals.

21. **Enhanced Data Encapsulation**: Use getters and setters to protect class properties, preventing unintended external modification.

22. **Abstract Common Generation Logic**: Identify and abstract shared logic in level generation to reduce code duplication and improve maintainability.

23. **Optimize Loop Conditions**: Review loops with high iteration caps (`max_tries`) to enhance performance and prevent potential infinite loops.

24. **Standardize Comments and Documentation**: Maintain clear and professional comments, avoiding casual language, to improve readability and maintainability.

25. **Error Handling Consistency**: Implement consistent error handling strategies across generation functions, providing meaningful feedback and avoiding abrupt failures.

26. **Utilize Interfaces for Inter-Class Communication**: Introduce interfaces to define contracts between classes, reducing tight coupling and enhancing modularity.

27. **Coordinate System Documentation**: Clearly document the coordinate system in a central location to avoid confusion and ensure consistency across the codebase.

---

By implementing these improvements and adhering to the updated rules, the codebase will become more robust, easier to maintain, and better equipped for collaborative development and AI integration.
