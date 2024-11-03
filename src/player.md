# `player.ts` Overview

The `player.ts` file defines the `Player` class, which manages the player character's state, behavior, input handling, rendering, and interactions within the game. The `Player` class extends the `Drawable` class, allowing it to be displayed within the game world.

## Key Enums and Classes

### Enums

#### `PlayerDirection`

Enumerates the possible directions the player can face or move.

```typescript
enum PlayerDirection {
  DOWN = 0,
  UP = 1,
  RIGHT = 2,
  LEFT = 3,
}
```

## `Player` Class

Represents the player character, handling movement, input processing, health, inventory, rendering, and interactions with game entities and environment.

### Properties

- **Position and Movement**:

  - `x: number`, `y: number`: Current position on the game grid.
  - `w: number`, `h: number`: Width and height (typically `1`).
  - `drawX: number`, `drawY: number`: Offset values for smooth movement animations.
  - `direction: PlayerDirection`: Current facing direction.
  - `moveRange: number`: Maximum range the player can move in one action.
  - `lastMoveTime: number`: Timestamp of the last movement action.
  - `moveCooldown: number`: Cooldown duration between moves to control movement speed.
  - `tileCursor: { x: number; y: number }`: Position of the cursor for tile selection.

- **State and Health**:

  - `health: number`: Current health points.
  - `maxHealth: number`: Maximum health capacity.
  - `dead: boolean`: Indicates if the player is dead.
  - `flashing: boolean`: Used for visual feedback when taking damage.
  - `flashingFrame: number`: Frame counter for flashing effect.
  - `lastTickHealth: number`: Health value from the previous game tick.
  - `lastHitBy: string`: Identifier of the last source that caused damage.

- **Inventory and Equipment**:

  - `inventory: Inventory`: Manages items and equipment.
  - `openVendingMachine: VendingMachine`: Reference to an interacted vending machine.

- **Rendering and GUI**:

  - `frame: number`: Animation frame counter.
  - `healthBar: HealthBar`: Manages health display.
  - `guiHeartFrame: number`: Animation frame for GUI heart icon.
  - `map: Map`: Reference to the game map.
  - `mapToggled: boolean`: Indicates if the map is currently displayed.

- **Game References**:

  - `game: Game`: Reference to the main game instance.
  - `levelID: number`: Identifier of the current level or room.
  - `isLocalPlayer: boolean`: Indicates if this player instance is controlled locally.

- **Miscellaneous**:
  - `sightRadius: number`: The radius within which the player can see.
  - `defaultSightRadius: number`: Default value for sight radius.
  - `turnCount: number`: Counter for the number of turns taken.
  - `triedMove: boolean`: Tracks movement attempts during input handling.
  - `tutorialRoom: boolean`: Indicates if the player is in the tutorial room.

### Constructor

Initializes a new `Player` instance at a specified position and sets up properties and input listeners if it's the local player.

```typescript
constructor(game: Game, x: number, y: number, isLocalPlayer: boolean) { ... }
```

- Sets initial position, health, and other default values.
- If `isLocalPlayer` is `true`, it sets up input listeners for handling player input.

### Key Methods

#### Input Handling

- **`inputHandler(input: InputEnum)`**: Main method to process input events.
- **Input Listeners**:
  - `upListener(isLocal: boolean): boolean`
  - `downListener(isLocal: boolean): boolean`
  - `leftListener(isLocal: boolean): boolean`
  - `rightListener(isLocal: boolean): boolean`
  - `spaceListener()`
  - `mouseLeftClick()`
  - `mouseRightClick()`
  - `mouseMove()`

#### Movement

- **`tryMove(x: number, y: number)`**: Attempts to move to the specified position, handling collisions and interactions.
- **Directional Movement Methods**:
  - `up()`, `down()`, `left()`, `right()`: Move the player in cardinal directions.
- **`move(x: number, y: number)`**: Executes the movement, updates position, and processes item pickups.
- **`dashMove(x: number, y: number)`**: Instantly moves the player to a position, typically used for abilities.
- **`canMove(): boolean`**: Checks if the player can move based on movement cooldown.

#### Combat and Interaction

- **`hurt(damage: number, enemy: string)`**: Applies damage to the player, updates health, and handles death.
- **`wouldHurt(x: number, y: number): boolean`**: Determines if moving to a position would cause the player harm (e.g., stepping on traps).

#### Rendering

- **`draw(delta: number)`**: Renders the player character on the screen with animations.
- **`drawPlayerSprite(delta: number)`**: Handles rendering the player's sprite with appropriate animation frames.
- **`drawGUI(delta: number, transitioning: boolean = false)`**: Renders GUI elements like the health bar, inventory, and map.
- **`drawTopLayer(delta: number)`**: Draws elements that should overlay the player sprite, such as the health bar.
- **`updateDrawXY(delta: number)`**: Updates `drawX` and `drawY` for smooth movement transitions.
- **`faceMouse()`**: Updates the player's facing direction based on the mouse position.

#### Utility Methods

- **`setTileCursorPosition()`**: Updates the cursor position used for targeting tiles.
- **`moveWithMouse()`**: Initiates movement towards the position clicked with the mouse.
- **`mouseToTile(): { x: number; y: number }`**: Converts mouse position to game grid coordinates.
- **`moveRangeCheck(x: number, y: number): boolean`**: Checks if a target position is within the player's movement range.
- **`finishTick()`**: Updates player state at the end of a game tick.

## Game Logic and Flow

- **Initialization**:
  - Sets up initial properties, health, and inventory.
  - Registers input listeners if the player is controlled locally.
- **Input Handling**:
  - Processes user input to perform actions such as movement, attacking, or interacting with items.
- **Movement and Actions**:
  - Movement is controlled through methods that check for cooldowns and validate the destination.
  - Interaction with items and entities occurs during movement or specific action inputs.
- **Combat and Damage**:
  - Damage is processed through the `hurt` method, accounting for armor and health updates.
  - Visual feedback such as flashing is triggered when the player takes damage.
- **Rendering**:
  - The `draw` methods handle rendering of the player and GUI elements, including animations and effects.
- **State Updates**:
  - `finishTick` and `update` methods handle per-tick updates to the player's state, such as health regeneration or cooldown resets.
- **Interactions with Game World**:
  - The player interacts with the environment and entities through methods coordinated with the `Game` and `Room` classes.
  - Movement and actions can trigger events or changes in the game state.

## Conventions and Patterns

- **Coordinate System**:

  - Utilizes a top-left origin coordinate system where positive X moves right and positive Y moves down.

- **Input Handling Pattern**:

  - Input events are mapped to listener methods that handle the corresponding action.
  - The use of `InputEnum` ensures consistent input handling.

- **Method Visibility**:

  - Internal methods are marked as `private` to encapsulate functionality and prevent unintended access.
  - Public methods are those intended for interaction with other parts of the codebase.

- **Data Encapsulation**:

  - The player’s internal state is managed within the class, with controlled access through methods.
  - Direct manipulation of properties from outside the class is minimized.

- **Naming Conventions**:

  - CamelCase is used for method and variable names.
  - Consistent naming for methods, e.g., movement methods like `up`, `down`, `left`, `right`.

- **Pattern Recognition**:
  - Repetitive logic, such as movement checks and rendering updates, are encapsulated in dedicated methods.

## Potential Improvements

- **Reduce Interdependency**:

  - **Abstract Input Handling**: Move input event registrations and processing to a centralized input manager to reduce direct dependencies on the `Input` class.
  - **Event-Driven Interactions**: Use an event system for interactions with game entities and environment to decouple the `Player` class from other classes.

- **Data Encapsulation**:

  - **Private Properties**: Make properties like `health`, `x`, `y`, and `inventory` private, providing getters and setters if external access is necessary.
  - **Encapsulate Inventory**: Provide methods for inventory interactions instead of exposing the `inventory` object directly.

- **Method Visibility**:

  - **Restrict Internal Methods**: Review methods to ensure only those necessary are public; others should be private or protected.

- **Centralize Common Types**:

  - **Shared Enums**: Move enums like `PlayerDirection` to a centralized types or constants file to promote reuse and maintain consistency.

- **Consistency in Naming**:

  - **Prefix Listener Methods**: Use a consistent prefix like `on` for event listener methods (e.g., `onUp`, `onDown`) to clarify their purpose.

- **Optimize Performance**:

  - **Use Game Time for Cooldowns**: Replace `Date.now()` with the game's unified time management system for movement cooldowns to ensure synchronization across game systems.

- **Error Handling**:

  - **Validate Inputs**: Add checks in methods like `move` and `hurt` to prevent and handle invalid inputs or states.

- **Modularization**:
  - **Separate GUI Logic**: Extract GUI rendering into separate classes or modules to improve separation of concerns.

## Suggested Rule Updates

Based on the analysis, consider incorporating the following updates to the development principles:

**35. Enhance Input Abstraction**

- **Centralize Input Management**: Introduce an input manager to handle all input events, decoupling input processing from the `Player` class.

**36. Strengthen Data Encapsulation**

- **Private Class Properties**: Make class properties private by default, exposing them via getters and setters as needed to control access and modification.

**37. Implement Event-Driven Architecture**

- **Use an Event System**: Adopt an event-based system for interactions among game entities, reducing tight coupling and enhancing modularity.

**38. Standardize Method Naming**

- **Prefix Event Handlers**: Use a consistent prefix like `on` for event handler methods (e.g., `onMouseMove`, `onLeftClick`) to improve clarity and consistency.

**39. Centralize Shared Types**

- **Move Enums to Shared Modules**: Place shared enums and interfaces in centralized modules to promote reuse and maintain consistency across the codebase.

**40. Optimize Time Management**

- **Unified Timing System**: Use a centralized game clock or time management system for all timing-related functionality to ensure consistent behavior.

---

By implementing these improvements and adhering to the updated rules, the `Player` class and overall codebase will become more maintainable, modular, and better suited for future development, collaboration, and integration with AI tools.
