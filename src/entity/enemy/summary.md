# Codebase Summary

This summary provides an overview of the key components within the game's codebase, focusing on the `Entity`, `Enemy`, and `Item` classes. It highlights their responsibilities, key properties and methods, current conventions, potential improvements, and suggested rule updates to enhance maintainability, scalability, and code quality.

## Table of Contents

1. [Entity Class (`src/entity/entity.ts`](#entity-class-srcentityentityts))
2. [Enemy Class (`src/entity/enemy/enemy.ts`](#enemy-class-srcentityenemytst))
3. [Item Class (`src/item/item.ts`](#item-class-srcitemitemts))
4. [Suggested Rule Updates](#suggested-rule-updates)

---

## Entity Class (`src/entity/entity.ts`)

### Overview

The `Entity` class serves as the foundational base for all in-game entities, including enemies, NPCs, and objects. It manages common functionalities such as movement, rendering, interactions, and state management within the game world.

### Key Properties

- **Position and Movement**

  - `x`, `y`: Current position on the game grid.
  - `w`, `h`: Width and height of the entity.
  - `drawX`, `drawY`: Offsets for smooth movement animations.
  - `direction`: Facing direction (`EntityDirection`).
  - `lastX`, `lastY`: Previous position coordinates.
  - `drawYOffset`: Vertical offset for rendering.

- **State and Behavior**

  - `dead`: Indicates if the entity is dead.
  - `aggro`: Aggressive state towards the player.
  - `skipNextTurns`: Turns to skip for behavior control.
  - `health`, `maxHealth`: Health management.
  - `hitBy`: Reference to the player who last hit the entity.
  - `rumbling`, `crushed`: Animation states.

- **Health and Combat**

  - `healthBar`: Manages health bar display.
  - `attackRange`: Range for attacks.
  - `orthogonalAttack`, `diagonalAttack`, `forwardOnlyAttack`: Attack patterns.

- **Rendering**

  - `hasShadow`: Determines shadow casting.
  - `tileX`, `tileY`: Sprite sheet coordinates.
  - `animationSpeed`: Animation speed.
  - `exclamationFrame`, `sleepingZFrame`: Special effect frames.

- **References**
  - `room`: Reference to the current `Room`.
  - `game`: Reference to the main `Game` instance.
  - `name`: Entity name.
  - `drop`: Item to drop upon death.

### Key Methods

- **Behavior and Actions**

  ```typescript:src/entity/entity.ts
  behavior = () => { };
  ```

  - Placeholder for entity behavior logic, intended to be overridden by subclasses.

- **Combat Methods**

  ```typescript:src/entity/entity.ts
  hit = (): number => { return 0; };

  hurt = (playerHitBy: Player, damage: number) => { /* ... */ };

  kill = () => { /* ... */ };

  killNoBones = () => { /* ... */ };
  ```

  - Methods to handle combat interactions, damage application, and death.

- **Interaction and Movement**

  ```typescript:src/entity/entity.ts
  interact = (player: Player) => { };

  pointIn = (x: number, y: number): boolean => { /* ... */ };

  doneMoving = (): boolean => { /* ... */ };
  ```

- **Rendering Methods**

  ```typescript:src/entity/entity.ts
  draw = (delta: number) => { /* ... */ };

  drawTopLayer = (delta: number) => { /* ... */ };
  ```

- **Utility Methods**

  ```typescript:src/entity/entity.ts
  nearestPlayer = (): [number, Player] | false => { /* ... */ };

  playerDistance = (player: Player): number => { /* ... */ };

  updateDrawXY = (delta: number) => { /* ... */ };

  isWithinRoomBounds = (x: number, y: number): boolean => { /* ... */ };
  ```

- **Event Emission**
  ```typescript:src/entity/entity.ts
  emitEntityData = (): void => {
    globalEventBus.emit("EntityData", {
      name: this.name,
      location: { x: this.x, y: this.y },
    });
  };
  ```

### Potential Improvements

- **Data Encapsulation**

  - Make sensitive properties private or protected.
  - Provide getters and setters for controlled access.

- **Method Visibility**

  - Mark internal methods as `private` or `protected`.

- **Reduce Interdependency**

  - Use interfaces or dependency injection for `Game` and `Room` references.

- **Centralize Enums**

  - Move common enums like `EntityDirection` to a shared module.

- **Improve Comment Quality**

  - Replace informal comments with professional explanations.

- **Abstract Base Class**
  - Consider making `Entity` an abstract class with abstract methods for mandatory behaviors.

## Enemy Class (`src/entity/enemy/enemy.ts`)

### Overview

The `Enemy` class extends the `Entity` class, providing a general template for enemy entities. It includes shared properties, behaviors, and methods that can be customized or overridden by specific enemy types.

### Key Properties

- **State Management**

  - `seenPlayer`: Whether the enemy has spotted the player.
  - `aggro`: Aggressive state towards the player.
  - `alertTicks`: Duration for alert indicators.
  - `frame`, `ticks`: Counters for animation and behavior control.
  - `skipNextTurns`: Turns to skip for behavior control.
  - `drop`: Item to drop upon death.
  - `targetPlayer`: The current target player.

- **Visuals**

  - `tileX`, `tileY`: Sprite sheet coordinates.
  - `drawYOffset`: Vertical rendering offset.

- **Stats**
  - `health`, `maxHealth`: Health management.

### Key Methods

- **Movement**

  ```typescript:src/entity/enemy/enemy.ts
  tryMove = (x: number, y: number, collide: boolean = true) => { /* ... */ };
  ```

  - Attempts to move the enemy, checking for collisions and solid tiles.

- **Combat**

  ```typescript:src/entity/enemy/enemy.ts
  hit = (): number => { return 1; };

  hurt = (playerHitBy: Player, damage: number) => { /* ... */ };
  ```

  - Handles damage application and aggro state updates.

- **Behavior and AI**

  ```typescript:src/entity/enemy/enemy.ts
  behavior = () => { /* ... */ };
  ```

  - Main AI logic executed each tick, managing state transitions and actions.

- **Pathfinding**

  ```typescript:src/entity/enemy/enemy.ts
  findPath = () => { /* ... */ };

  getDisablePositions = (): Array<astar.Position> => { /* ... */ };
  ```

  - Utilizes A\* algorithm to navigate towards the target player, avoiding obstacles.

### Potential Improvements

- **Method Visibility and Encapsulation**

  - Mark methods like `tryMove`, `behavior`, `lookForPlayer`, and `findPath` as `protected` or `private`.

- **Data Encapsulation**

  - Use getters and setters for properties like `health`, `aggro`, and `targetPlayer`.

- **Reduce Interdependency**

  - Abstract pathfinding logic into a separate service or utility class.
  - Decouple from direct references to `Game` and `Room` using interfaces or dependency injection.

- **Consistency in Attack Logic**

  - Standardize attack methods using strategy patterns or base methods.

- **Error Handling and Validation**

  - Validate array accesses and input parameters to prevent runtime errors.

- **Optimize Performance**

  - Cache frequently calculated data, such as pathfinding grids.

- **Code Organization**

  - Group related methods logically (e.g., movement, combat, rendering).

- **Professional Comments**
  - Ensure all comments are clear, concise, and professional.

## Item Class (`src/item/item.ts`)

### Overview

The `Item` class represents collectible items within the game world. Items can be picked up by the player, displayed in the inventory, and possess various interactions and animations. It extends the `Drawable` class to facilitate rendering on the game canvas.

### Key Properties

- **Position and Dimensions**

  - `x`, `y`: Item's position coordinates.
  - `w`, `h`: Width and height.
  - `offsetY`: Vertical offset for rendering.
  - `drawableY`: Used for render sorting.

- **Animation and Rendering**

  - `tileX`, `tileY`: Sprite sheet coordinates.
  - `frame`: Current animation frame.
  - `alpha`: Transparency level.
  - `scaleFactor`: Scale for animations.

- **State and Behavior**
  - `stackable`: If the item can be stacked.
  - `stackCount`: Number of items in the stack.
  - `pickedUp`: Pickup state.
  - `level`: Reference to the current `Room`.

### Key Methods

- **Interaction Methods**

  ```typescript:src/item/item.ts
  onPickup = (player: Player) => { /* ... */ };

  onDrop = () => { };

  dropFromInventory = () => { };
  ```

  - Handles item pickup, drop, and inventory interactions.

- **Rendering Methods**

  ```typescript:src/item/item.ts
  draw = (delta: number) => { /* ... */ };

  drawTopLayer = (delta: number) => { /* ... */ };

  drawIcon = (delta: number, x: number, y: number, opacity = 1) => { /* ... */ };
  ```

  - Renders the item in the game world and inventory, managing animations and visual effects.

- **Utility Methods**

  ```typescript:src/item/item.ts
  tick = () => { };

  tickInInventory = () => { };

  getDescription = (): string => { return ""; };

  pickupSound = () => { /* ... */ };

  shadeAmount = () => { /* ... */ };
  ```

  - Provides hooks for subclass implementations and manages item state.

### Potential Improvements

- **Data Encapsulation**

  - Make properties like `pickedUp`, `stackCount`, `alpha`, `x`, and `y` private or protected.
  - Provide getters and setters for controlled access.

- **Method Visibility**

  - Mark internal methods such as `shadeAmount` and `pickupSound` as `private` or `protected`.

- **Reduce Interdependency**

  - Decouple from the `Game` class by using dependency injection or event systems.
  - Use interfaces for dependencies like `Room` and `Player`.

- **Centralize Common Types**

  - Move shared enums and interfaces to a central module for reuse.

- **Consistency in Naming**

  - Standardize method prefixes (e.g., `on` for event handlers and `draw` for rendering methods).

- **Error Handling**

  - Implement null checks and input validations to prevent runtime errors.

- **Code Documentation**

  - Enhance comments for clarity and professionalism, especially for overridden methods.

- **Abstract Classes**
  - Consider making `Item` an abstract class with abstract methods for mandatory behaviors.

## Suggested Rule Updates

The following rules are proposed to guide future development and improve the codebase's quality:

**47. Enforce Property Encapsulation**

- Declare non-modifiable class properties as `private` or `protected`.
- Provide public getters and setters where necessary.

**48. Limit Accessibility of Internal Methods**

- Use `private` or `protected` modifiers for methods intended for internal use within classes or subclasses.

**49. Use Interfaces for Dependencies**

- Implement interfaces or abstract classes for dependencies like `Game` and `Room` to reduce coupling and enhance testability.

**50. Standardize and Centralize Enums**

- Move commonly used enums (e.g., `EntityDirection`, `EntityType`) to a central location to avoid duplication and ensure consistency.

**51. Improve Comment Quality**

- Replace informal comments with clear, concise, and professional explanations to aid in code understanding.

**52. Use Abstract Classes and Methods Appropriately**

- Utilize the `abstract` keyword for base classes not intended for direct instantiation.
- Define abstract methods that subclasses must implement for essential behaviors.

**53. Implement Strongly Typed Events**

- Define interfaces for events emitted through the event bus to ensure type safety and clarity in event handling.

**54. Validate Input Parameters**

- Add input validations in methods to handle invalid or unexpected values gracefully, preventing runtime errors.

**55. Restrict Method Visibility Appropriately**

- Apply `private` or `protected` modifiers to methods intended solely for internal logic within classes or their subclasses.

**56. Encapsulate Important Properties**

- Use getters and setters for critical properties to manage access and incorporate additional logic during retrieval or assignment.

**57. Abstract Common Functionality**

- Extract repetitive code, such as pathfinding logic, into utility classes or services to reduce duplication and improve maintainability.

**58. Validate Array Accesses**

- Ensure all array accesses are within bounds to prevent out-of-range errors and enhance code robustness.

**59. Optimize Repeated Calculations**

- Cache or optimize frequently recurring calculations within loops or game ticks to improve performance.

**60. Enhance Code Organization**

- Organize class methods and properties logically, grouping related functionalities together to enhance readability and maintainability.

**61. Maintain Professional Comments**

- Ensure all code comments are professional, clear, and contribute meaningfully to understanding the codebase.

---

By implementing these improvements and adhering to the updated development principles, the `Entity`, `Enemy`, and `Item` classes, along with the overall codebase, will become more robust, maintainable, and scalable. These changes will facilitate future enhancements, improve developer collaboration, and enhance the game's performance and stability.
