# `entity.ts` Overview

The `entity.ts` file defines the `Entity` class, which serves as the base class for all in-game entities, including enemies, NPCs, and objects. It handles common functionality such as movement, rendering, interactions, and state management for entities within the game world.

## Key Enums and Interfaces

### Enums

#### `EntityDirection`

Enumerates the possible directions an entity can face or move.

```typescript:src/entity/entity.ts
export enum EntityDirection {
  DOWN,
  UP,
  RIGHT,
  LEFT,
}
```

#### `EntityType`

Defines the various types of entities present in the game.

```typescript:src/entity/entity.ts
export enum EntityType {
  ENEMY,
  FRIENDLY,
  RESOURCE,
  PROP,
  CHEST,
}
```

### Interfaces

#### `entityData`

Represents basic data about an entity, used for events or data transmission.

```typescript:src/entity/entity.ts
export interface entityData {
  name: string;
  location: { x: number; y: number };
}
```

## `Entity` Class

The `Entity` class is the foundational class for all game entities. It extends the `Drawable` class, allowing entities to be rendered within the game world.

### Constructor

```typescript:src/entity/entity.ts
export class Entity extends Drawable {
  constructor(room: Room, game: Game, x: number, y: number) {
    super();

    this.room = room;
    this.game = game;
    this.x = x;
    this.y = y;
    this.w = 1;
    this.h = 1;
    this.drawX = 0;
    this.drawY = 0;
    this.dead = false;
    this.hasShadow = true;
    this.skipNextTurns = 0;
    this.direction = EntityDirection.DOWN;
    this.destroyable = true;
    this.pushable = false;
    this.chainPushable = true;
    this.interactable = false;
    this.healthBar = new HealthBar();
    this.alertTicks = 0;
    this.exclamationFrame = 0;
    this.lastX = x;
    this.lastY = y;
    this.hitBy = this.getPlayer();
    this.crushX = 1;
    this.crushY = 1;
    this.crushVertical = false;
    this.crushed = false;
    this.rumbling = false;
    this.animationSpeed = 0.1;
    this.drawYOffset = 1.175;

    this.orthogonalAttack = false;
    this.diagonalAttack = false;
    this.forwardOnlyAttack = false;
    this.attackRange = 1;
    this.diagonalAttackRange = 1;
  }
}
```

### Properties

- **Position and Movement**:

  - `x`, `y`: Current position on the game grid.
  - `w`, `h`: Width and height of the entity.
  - `drawX`, `drawY`: Offsets for smooth movement animations.
  - `direction`: Facing direction (`EntityDirection`).
  - `lastX`, `lastY`: Previous position coordinates.
  - `drawYOffset`: Vertical offset for rendering.

- **State and Behavior**:

  - `dead`: Indicates if the entity is dead.
  - `skipNextTurns`: Number of turns to skip (used for delaying actions).
  - `destroyable`: If the entity can be destroyed by the player.
  - `pushable`: If the entity can be pushed by the player.
  - `chainPushable`: If the entity can be pushed as part of a chain reaction.
  - `interactable`: If the entity can be interacted with.
  - `rumbling`: Indicates if the entity is rumbling (used for animations).
  - `crushed`: Indicates if the entity has been crushed.
  - `crushX`, `crushY`: Factors for crushing animation effects.

- **Health and Combat**:

  - `health`, `maxHealth`: Current and maximum health.
  - `healthBar`: Manages the entity's health bar display.
  - `hitBy`: Reference to the player who last hit the entity.
  - `attackRange`: Range for attacks.
  - `orthogonalAttack`, `diagonalAttack`, `forwardOnlyAttack`: Attack patterns.

- **Rendering**:

  - `hasShadow`: Determines if the entity casts a shadow.
  - `tileX`, `tileY`: Coordinates on the sprite sheet.
  - `animationSpeed`: Speed of animation frames.
  - `exclamationFrame`, `sleepingZFrame`: Frames counters for special effects.

- **References and Identification**:
  - `room`: Reference to the `Room` the entity is in.
  - `game`: Reference to the main `Game` instance.
  - `name`: Name of the entity.
  - `drop`: Item to drop upon death.

### Key Methods

#### Behavior and Actions

```typescript:src/entity/entity.ts
behavior = () => { };
```

- The main method where the entity's behavior logic is implemented. Intended to be overridden by subclasses.

#### Combat Methods

```typescript:src/entity/entity.ts
hit = (): number => {
  return 0;
};

hurt = (playerHitBy: Player, damage: number) => {
  this.healthBar.hurt();

  this.health -= damage;
  if (this.health <= 0) this.kill();
  else this.hurtCallback();
};

kill = () => {
  if (this.room.roomArray[this.x][this.y] instanceof Floor) {
    let b = new Bones(this.room, this.x, this.y);
    b.skin = this.room.roomArray[this.x][this.y].skin;
    this.room.roomArray[this.x][this.y] = b;
  }

  this.killNoBones();
};

killNoBones = () => {
  this.dead = true;
  this.dropLoot();
};
```

- **`hit`**: Calculates the damage the entity can inflict.
- **`hurt`**: Applies damage to the entity.
- **`kill`**: Handles the entity's death, including replacing the tile with bones and calling `killNoBones`.
- **`killNoBones`**: Marks the entity as dead and handles loot dropping.

#### Interaction and Movement

```typescript:src/entity/entity.ts
interact = (player: Player) => { };

pointIn = (x: number, y: number): boolean => {
  return (
    x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
  );
};

doneMoving = (): boolean => {
  let EPSILON = 0.01;
  return Math.abs(this.drawX) < EPSILON && Math.abs(this.drawY) < EPSILON;
};
```

- **`interact`**: Defines interaction behavior with the player.
- **`pointIn`**: Checks if a point is within the entity's bounds.
- **`doneMoving`**: Determines if the entity has completed its movement animation.

#### Rendering Methods

```typescript:src/entity/entity.ts
draw = (delta: number) => {
  if (!this.dead) {
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
      this.tileX,
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
};

drawTopLayer = (delta: number) => {
  this.drawableY = this.y - this.drawY;

  this.healthBar.draw(
    delta,
    this.health,
    this.maxHealth,
    this.x,
    this.y,
    true
  );
  this.updateDrawXY(delta);
};
```

- **`draw`**: Handles rendering the entity, including its shadow and sprite.
- **`drawTopLayer`**: Draws overlays such as the health bar.

#### Utility Methods

```typescript:src/entity/entity.ts
nearestPlayer = (): [number, Player] | false => {
  // Implementation to find the nearest player
};

playerDistance = (player: Player): number => {
  return Math.max(Math.abs(this.x - player.x), Math.abs(this.y - player.y));
};

updateDrawXY = (delta: number) => {
  this.drawX += -0.3 * delta * this.drawX;
  this.drawY += -0.3 * delta * this.drawY;
};

isWithinRoomBounds = (x: number, y: number): boolean => {
  const xInBounds =
    x >= this.room.roomX && x < this.room.roomX + this.room.width;
  const yInBounds =
    y >= this.room.roomY && y < this.room.roomY + this.room.height;
  const tileExists =
    this.room.roomArray[x] && this.room.roomArray[x][y] !== undefined;

  return xInBounds && yInBounds && tileExists;
};
```

- **`nearestPlayer`**: Finds the closest player to the entity.
- **`playerDistance`**: Calculates Manhattan distance to a player.
- **`updateDrawXY`**: Updates the drawing offsets for smooth animations.
- **`isWithinRoomBounds`**: Checks if the given coordinates are within the room boundaries.

#### Event Emission

```typescript:src/entity/entity.ts
emitEntityData = (): void => {
  globalEventBus.emit("EntityData", {
    name: this.name,
    location: { x: this.x, y: this.y },
  });
};
```

- **`emitEntityData`**: Emits entity data through the global event bus, useful for tracking or debugging.

## Conventions and Patterns

- **Coordinate System**:

  - Uses a top-left origin coordinate system; positive X is right, and positive Y is down.

- **Method Visibility**:

  - Most methods are public, even those that could be internal (`updateDrawXY`, `isWithinRoomBounds`), potentially exposing internal mechanics.

- **Data Encapsulation**:

  - Properties are largely public, allowing direct external modification, which can lead to unintended side effects.

- **Naming Conventions**:

  - Uses `camelCase` for method and variable names.
  - Methods are named descriptively, indicating their purpose.

- **Inheritance**:

  - Inherits from `Drawable`, allowing entities to be rendered.

- **Event Handling**:
  - Utilizes an event bus (`globalEventBus`) to emit entity data.

## Potential Improvements

- **Data Encapsulation**:

  - **Encapsulate Properties**: Make sensitive properties like `health`, `x`, `y`, `dead`, and `hitBy` private or protected. Provide getters and setters where necessary to control access and modification.

- **Method Visibility**:

  - **Restrict Internal Methods**: Mark utility methods that are not intended for external use as `private` or `protected` to prevent misuse.

- **Reduce Interdependency**:

  - **Decouple from Global Instances**: Minimize direct dependencies on `game` and `room` by using interfaces or dependency injection. This can make unit testing easier and reduce tight coupling.

- **Consistency in Enums**:

  - **Centralize Direction Enums**: Ensure that `EntityDirection` and similar enums are consistent across the codebase and consider moving them to a shared module.

- **Event System Enhancement**:

  - **Use Strongly Typed Events**: Define event types and interfaces for events emitted via the event bus to improve type safety and maintainability.

- **Error Handling**:

  - **Validate Inputs**: Add validation in methods like `hurt` and `kill` to handle edge cases and prevent potential errors (e.g., negative health).

- **Commenting and Documentation**:

  - **Improve Code Comments**: Replace informal comments (e.g., "pulled this straight outta my ass") with professional explanations. Provide documentation for complex logic.

- **Method Overriding and Abstract Classes**:
  - **Abstract Base Class**: Consider making `Entity` an abstract class if it's not intended to be instantiated directly. Define abstract methods for behaviors that must be implemented by subclasses.

## Suggested Rule Updates

**47. Enforce Property Encapsulation**

- Class properties that should not be modified externally must be declared as `private` or `protected`. Provide public getters and setters as needed.

**48. Limit Accessibility of Internal Methods**

- Use appropriate access modifiers to restrict access to methods that are intended for internal use (`private` or `protected`).

**49. Use Interfaces for Dependencies**

- When classes depend on other objects (e.g., `Game`, `Room`), use interfaces or abstract classes to reduce coupling and enhance testability.

**50. Standardize and Centralize Enums**

- Move commonly used enums (e.g., `EntityDirection`, `EntityType`) to a central location to avoid duplication and ensure consistency.

**51. Improve Comment Quality**

- Replace informal or unprofessional comments with clear, concise, and professional explanations that aid in code understanding.

**52. Use Abstract Classes and Methods Appropriately**

- For base classes intended to be extended but not instantiated, use the `abstract` keyword and define abstract methods where subclasses must provide an implementation.

**53. Implement Strongly Typed Events**

- Define interfaces for events emitted through the event bus to ensure type safety and clarity in event handling.

**54. Validate Input Parameters**

- Add input validation in methods to catch and handle invalid or unexpected values gracefully.

---

By applying these improvements and adhering to the updated development principles, the `Entity` class will become more robust, maintainable, and aligned with best practices. This enhances code quality and facilitates easier collaboration, testing, and future development.
