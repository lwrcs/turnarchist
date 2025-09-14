# `enemy.ts` Overview

The `enemy.ts` file defines the `Enemy` class, which extends the base `Entity` class. This class serves as a general template for enemy entities in the game, providing shared properties, behaviors, and methods that can be used or overridden by specific enemy types.

## Key Properties and Methods

### Properties

- **State Management**:

  - `seenPlayer: boolean`: Indicates whether the enemy has spotted the player.
  - `aggro: boolean`: Determines if the enemy is actively aggressive towards the player.
  - `alertTicks: number`: Ticks remaining for alert indicators (e.g., exclamation marks).
  - `frame: number`: Animation frame counter.
  - `ticks: number`: General purpose tick counter for behaviors.
  - `skipNextTurns: number`: Number of turns to skip, used for behavior control.
  - `drop: Item`: Item to drop upon death.
  - `targetPlayer: Player`: The player the enemy is targeting.

- **Visuals**:

  - `tileX: number`, `tileY: number`: Sprite sheet coordinates for rendering the enemy.
  - `drawYOffset: number`: Vertical offset for rendering, typically to adjust for sprite sizes.

- **Stats**:
  - `health: number`: Current health points.
  - `maxHealth: number`: Maximum health capacity.

### Constructor

```typescript:src/entity/enemy/enemy.ts
export class Enemy extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.drawYOffset = 1.5;
    this.name = "generic enemy";
    this.seenPlayer = false;
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 17;
    this.tileY = 8;
    this.aggro = false;
  }
}
```

- Initializes default values for enemy properties.
- Sets up position, visuals, and state management variables.

### Key Methods

#### Movement

- **`tryMove(x: number, y: number, collide: boolean = true): void`**

  Attempts to move the enemy to a new position, checking for collisions with other entities and solid tiles.

  ```typescript:src/entity/enemy/enemy.ts
  readonly tryMove = (x: number, y: number, collide: boolean = true) => {
    let entityCollide = (entity: Entity): boolean => {
      if (entity.x >= x + this.w || entity.x + entity.w <= x) return false;
      if (entity.y >= y + this.h || entity.y + entity.h <= y) return false;
      return true;
    };
    for (const e of this.room.entities) {
      if (e !== this && entityCollide(e) && collide) {
        return;
      }
    }
    if (x >= this.room.width || y >= this.room.height || x < 0 || y < 0) {
      return;
    }
    let tiles = [];
    for (let xx = 0; xx < this.w; xx++) {
      for (let yy = 0; yy < this.h; yy++) {
        if (!this.room.roomArray[x + xx][y + yy].isSolid()) {
          tiles.push(this.room.roomArray[x + xx][y + yy]);
        } else {
          return;
        }
      }
    }
    for (let tile of tiles) {
      tile.onCollideEnemy(this);
    }
    this.x = x;
    this.y = y;
  };
  ```

- Checks for entity collisions and solid tiles before moving.
- Updates the enemy's position if the move is valid.

#### Combat

- **`hit(): number`**

  Returns the damage the enemy can inflict.

  ```typescript:src/entity/enemy/enemy.ts
  hit = (): number => {
    return 1;
  };
  ```

- **`hurt(playerHitBy: Player, damage: number): void`**

  Applies damage to the enemy, updates aggro state, and handles death.

  ```typescript:src/entity/enemy/enemy.ts
  hurt = (playerHitBy: Player, damage: number) => {
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID])
        this.alertTicks = 2;
    }
    this.health -= damage;
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 26);
    this.healthBar.hurt();
    if (this.health <= 0) {
      this.kill();
    }
  };
  ```

- Sets aggro towards the player who inflicted damage.
- Triggers visual feedback upon taking damage.
- Calls `kill()` if health drops to zero or below.

#### Behavior and AI

- **`behavior(): void`**

  The main AI logic for the enemy, executed each tick.

  ```typescript:src/entity/enemy/enemy.ts
  behavior = () => {
    // Store the current position
    this.lastX = this.x;
    this.lastY = this.y;

    // If the enemy is not dead
    if (!this.dead) {
      // Skip turns if necessary
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }

      // Increment the tick counter
      this.ticks++;

      // If the enemy has not seen the player yet
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        // If the target player has taken their turn
        if (this.room.playerTicked === this.targetPlayer) {
          // Decrement alert ticks
          this.alertTicks = Math.max(0, this.alertTicks - 1);

          // Pathfinding and movement towards the target player
          // [... code for pathfinding and movement ...]

          // Update position and direction
          // [... code for updating position and handling attacks ...]
        }

        // Re-acquire target if necessary
        // [... code for checking if target player is offline or out of range ...]
      }
    }
  };
  ```

- Manages the enemy's decision-making each tick.
- Skips turns if required (e.g., after attacking).
- Looks for the player if not already seen.
- Uses A\* pathfinding to navigate towards the player.
- Handles attacking the player if adjacent.

- **`lookForPlayer(): void`**

  Scans the nearby area for the player.

  ```typescript:src/entity/enemy/enemy.ts
  lookForPlayer = () => {
    let p = this.nearestPlayer();
    if (p !== false) {
      let [distance, player] = p;
      if (distance <= 4) {
        this.targetPlayer = player;
        this.facePlayer(player);
        this.seenPlayer = true;
        globalEventBus.emit("EnemySeenPlayer", {
          enemyType: this.constructor.name,
          enemyName: this.name,
        });
        if (player === this.game.players[this.game.localPlayerID])
          this.alertTicks = 1;
        this.makeHitWarnings();
      }
    }
  };
  ```

- Detects if the player is within a certain distance.
- Sets the enemy to target and face the player.
- Emits an event when the player is seen.

#### Rendering

- **`draw(delta: number): void`**

  Renders the enemy, including animations and alerts.

  ```typescript:src/entity/enemy/enemy.ts
  draw = (delta: number) => {
    if (!this.dead) {
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow)
        Game.drawMob(
          0,
          0,
          1,
          1,
          this.x - this.drawX,
          this.y - this.drawY,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount()
        );
      Game.drawMob(
        this.tileX + Math.floor(this.frame),
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount()
      );
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta);
    }
  };
  ```

- Updates animation frames.
- Renders the enemy sprite and shadow.
- Displays indicators like sleeping Z's or exclamation marks based on state.

#### Pathfinding

- **`findPath(): void`**

  Calculates a path towards the target player using the A\* algorithm.

  ```typescript:src/entity/enemy/enemy.ts
  findPath = () => {
    // Create a list of positions to avoid
    let disablePositions = this.getDisablePositions();

    // Create a grid of the room
    let grid = [];
    for (let x = 0; x < this.room.roomX + this.room.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.room.roomY + this.room.height; y++) {
        if (this.room.roomArray[x] && this.room.roomArray[x][y])
          grid[x][y] = this.room.roomArray[x][y];
        else grid[x][y] = false;
      }
    }

    // Find a path to the target player
    let moves = astar.AStar.search(
      grid,
      this,
      this.targetPlayer,
      disablePositions,
      false,
      false,
      true,
      this.direction
    );

    // Handle movement based on the path
    // [... code for moving along the path or attacking ...]
  };
  ```

- Prepares the grid and obstacles for the pathfinding algorithm.
- Calculates the path to the target player.

- **`getDisablePositions(): Array<astar.Position>`**

  Determines positions that the enemy should avoid.

  ```typescript:src/entity/enemy/enemy.ts
  getDisablePositions = (): Array<astar.Position> => {
    let disablePositions = [];
    for (const e of this.room.entities) {
      if (e !== this) {
        disablePositions.push({ x: e.x, y: e.y });
      }
    }
    for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
      for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
        if (
          this.room.roomArray[xx][yy] instanceof SpikeTrap &&
          (this.room.roomArray[xx][yy] as SpikeTrap).on
        ) {
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy });
        }
      }
    }
    return disablePositions;
  };
  ```

- Avoids other entities and active spike traps.
- Helps prevent enemies from colliding with obstacles or traps.

## Game Logic and Flow

- **State Management**:

  - Enemies start in a passive state (`seenPlayer = false`).
  - Upon spotting the player within range, they become aggressive (`aggro = true`) and begin pursuing.

- **Behavior Execution**:

  - The `tick` method calls `behavior` each game tick.
  - Enemies may skip turns based on `skipNextTurns`.

- **Pathfinding and Movement**:

  - Uses A\* algorithm to navigate towards the player.
  - Considers obstacles and other entities to avoid collisions.

- **Combat**:

  - If adjacent to the player, the enemy attacks.
  - Damage is inflicted using the `hit` method.
  - Enemies face the player when attacking.

- **Rendering and Visual Feedback**:
  - Animations are updated each frame.
  - Visual indicators like exclamation marks show enemy state.
  - Enemies display sleeping animations when idle.

## Conventions and Patterns

- **Coordinate System**:

  - The game uses a top-left origin coordinate system. Positive x is right, and positive y is down.

- **Method Visibility**:

  - Many methods are defined as public, even when used internally.
  - Some methods could be marked as `private` or `protected` to encapsulate functionality.

- **Consistent Naming**:

  - CamelCase is used for method and variable names.
  - Direction enums (`EntityDirection`) are consistently used.

- **Inheritance and Polymorphism**:

  - `Enemy` extends `Entity`, inheriting common properties and methods.
  - Specific enemy types can extend `Enemy` and override behaviors.

- **Event Handling**:

  - Uses `globalEventBus` to emit events like `EnemySeenPlayer`.
  - Promotes decoupling between the enemy and other game systems.

- **Data Encapsulation**:
  - Direct property access is common, potentially leading to tight coupling.

## Potential Improvements

- **Method Visibility and Encapsulation**:

  - **Restrict Internal Methods**: Methods like `tryMove`, `behavior`, `lookForPlayer`, and `findPath` could be marked as `protected` or `private` to prevent external access.

- **Data Encapsulation**:

  - **Use Getters and Setters**: Properties like `health`, `aggro`, and `targetPlayer` can be encapsulated with getters and setters to control access and modification.

- **Reduce Interdependency**:

  - **Abstract Pathfinding Logic**: The code for pathfinding is duplicated in several places. Extract pathfinding logic to a separate service or utility class to reduce redundancy.

  - **Decouple from `Game` and `Room`**: Minimize direct dependencies by using interfaces or dependency injection, enhancing testability and reducing coupling.

- **Consistency in Attack Logic**:

  - **Standardize Attack Methods**: Consolidate attack logic to a base method or use strategy patterns for different attack behaviors.

- **Error Handling and Validation**:

  - **Validate Coordinates**: Ensure that array accesses, like `this.room.roomArray[xx][yy]`, are within bounds to prevent runtime errors.

- **Optimize Performance**:

  - **Cache Calculations**: Repeated calculations, such as creating the grid for pathfinding, could be optimized or cached if appropriate.

- **Code Organization**:

  - **Group Related Methods**: Organize methods logically, grouping together movement, combat, rendering, and AI behavior methods.

- **Comment Quality**:

  - **Professional Comments**: Replace or remove any unprofessional comments. Ensure comments are clear, concise, and helpful.

- **Use of Enums and Constants**:

  - **Centralize Enums**: Move enums like `EntityDirection` to a central `types.ts` file to promote reuse.

## Suggested Rule Updates

Based on the analysis, consider incorporating the following updates to the development principles:

**55. Restrict Method Visibility Appropriately**

- Use `private` or `protected` access modifiers for methods that are intended for internal use within the class or subclasses to enhance encapsulation and prevent unintended usage.

**56. Encapsulate Important Properties**

- Utilize getters and setters for important properties to control access and allow for additional logic during retrieval or assignment.

**57. Abstract Common Functionality**

- Extract common code, such as pathfinding logic, to utility classes or services to reduce code duplication and improve maintainability.

**58. Validate Array Accesses**

- Ensure all array accesses are validated to prevent out-of-bounds errors, enhancing the robustness of the code.

**59. Optimize Repeated Calculations**

- Cache or optimize calculations that occur frequently within loops or game ticks to improve performance.

**60. Enhance Code Organization**

- Organize class methods and properties logically, grouping related functionality together to improve readability.

**61. Maintain Professional Comments**

- Ensure all code comments are professional, clear, and contribute to understanding the codebase.

---

By implementing these improvements and adhering to the updated rules, the `Enemy` class and overall codebase will become more robust, maintainable, and scalable, facilitating future development and collaboration.
