# `game.ts` Overview

The `game.ts` file serves as the core of the game's logic, handling initialization, resource loading, input processing, game loop execution, rendering, and state management. Below is a structured summary of its main components and functionalities.

## Key Enums and Classes

### Enums

- **`LevelState`**: Represents the current state of the level.

  - `IN_LEVEL`
  - `TRANSITIONING`
  - `TRANSITIONING_LADDER`

- **`Direction`**: Enumerates possible movement directions.
  - `North`, `NorthEast`, `East`, `SouthEast`, `South`, `SouthWest`, `West`, `NorthWest`, `Center`

### `ChatMessage` Class

Represents a chat message in the game's chat system.

- **Properties**:

  - `message: string`
  - `timestamp: number`

- **Constructor**:
  - Initializes a new chat message with the provided message and the current timestamp.

## `Game` Class

The central class that orchestrates the game's functionality.

### Properties

- **Static Properties**:

  - `ctx: CanvasRenderingContext2D`: The canvas rendering context.
  - `shade_canvases: Record<string, HTMLCanvasElement>`: Cached canvases for rendering with shading.
  - `scale`: Scaling factor for rendering.
  - Asset images (`tileset`, `objset`, `mobset`, `itemset`, `fxset`, `fontsheet`).

- **Instance Properties**:
  - **Game State**:
    - `prevLevel: Room`: Previous level, used during transitions.
    - `room: Room`: Current room.
    - `rooms: Array<Room>`: All rooms in the game.
    - `levelgen: LevelGenerator`: Level generator instance.
    - `levelState: LevelState`: Current state of the level.
    - `transitionStartTime: number`: Timestamp when a level transition started.
    - `transitionX`, `transitionY`: Transition offsets.
    - `upwardTransition`, `sideTransition`: Booleans indicating transition type.
    - `transitioningLadder: any`: Reference to the ladder used during transition.
  - **Player Management**:
    - `localPlayerID: string`: Identifier for the local player.
    - `players: Record<string, Player>`: Active players.
    - `offlinePlayers: Record<string, Player>`: Disconnected players.
  - **Input and Interaction**:
    - `chat: Array<ChatMessage>`: Chat messages.
    - `chatOpen: boolean`: Flag indicating if the chat window is open.
    - `chatTextBox: TextBox`: TextBox instance for chat input.
    - `tutorialListener: TutorialListener`: Listener for tutorial events.
  - **Rendering and Effects**:
    - `previousFrameTimestamp: number`: Timestamp of the previous frame.
    - `screenShakeX`, `screenShakeY`: Values for screen shake effect.

### Constructor

- **Initialization**:
  - Sets up the canvas and rendering context.
  - Creates hidden input elements for chat and usernames.
  - Initializes the chat system with callbacks for enter and escape keys.
  - Initializes resource caches (`shade_canvases`, `text_rendering_canvases`).
- **Resource Loading**:
  - Loads image assets (`tileset`, `objset`, `mobset`, `itemset`, `fxset`, `fontsheet`).
  - Waits for all resources to load before proceeding.
- **Event Listeners**:
  - Adds listeners for touch events to handle mobile input.
  - Sets up the `keyDownListener` for keyboard input.
  - Adds a resize listener to handle window resizing.
- **Game Start**:
  - Initiates the game loop using `requestAnimationFrame`.
  - Initializes player data and game state.
  - Loads the initial game state using `loadGameState`.

### Methods

- **`keyDownListener(key: string)`**: Handles keyboard input events.

  - Opens the chat window on "C" or "/" keys.
  - Processes movement inputs (`A`, `W`, `S`, `D`, Arrow keys).
  - Handles other actions (`Space`, `I`, `Q`).

- **Level Transition Methods**:

  - **`changeLevel(player: Player, newLevel: Room)`**: Moves a player to a new level.
  - **`changeLevelThroughLadder(player: Player, ladder: any)`**: Handles level transitions via ladders.
  - **`changeLevelThroughDoor(player: Player, door: any, side?: number)`**: Handles level transitions through doors, including transition animations.

- **Game Loop Methods**:

  - **`run(timestamp: number)`**: The main game loop called every frame.
    - Calculates `delta` time for frame normalization.
    - Updates game state and renders the frame.
  - **`update()`**: Updates game logic, including player states and level transitions.
  - **`draw(delta: number)`**: Renders the game frame, including the current room, entities, transitions, and UI elements.

- **Utility Methods**:

  - **`lerp(a: number, b: number, t: number): number`**: Linear interpolation function.
  - **`pushMessage(message: string)`**: Adds a message to the chat.
  - **`onResize()`**: Handles window resizing and adjusts game scaling accordingly.

- **Static Methods**:
  - **Drawing Utilities**:
    - `drawHelper()`: Core method for rendering images with shading.
    - `drawTile()`, `drawObj()`, `drawMob()`, `drawItem()`, `drawFX()`: Wrapper methods for rendering different asset types.
  - **Text Rendering**:
    - `measureText(text: string)`: Calculates text dimensions.
    - `fillText(text: string, x: number, y: number, maxWidth?: number)`: Renders text to the canvas.

## Game Logic and Flow

- **Initialization**:
  - Resources are loaded asynchronously; the game starts after all resources are ready.
  - Input elements and event listeners are set up for capturing user interactions.
- **Input Handling**:
  - Keyboard input is routed through `keyDownListener`.
  - Touch input is managed via event listeners for mobile compatibility.
- **Game Loop**:
  - Executes the `run` method every frame.
  - Normalizes frame time to maintain consistent updates across different frame rates.
- **Updating Game State**:
  - Checks for input repeats for continuous movement.
  - Manages level transitions with timing and state changes.
  - Updates player states and handles conditions like player death.
- **Rendering**:
  - Calculates camera position to center on the local player.
  - Handles different rendering states based on `levelState` (e.g., transitions).
  - Renders the room, entities, transitions, and UI elements like chat and FPS.
- **Chat System**:
  - Manages chat input and message display with fade effects.
  - Messages are added via `pushMessage` and rendered in the `draw` method.

## Conventions and Patterns

- **Coordinate System**:

  - Uses a top-left origin where positive X is right, and positive Y is down.

- **Event-Driven Input**:

  - Input is handled via event listeners and dispatched to appropriate handlers.

- **Resource Management**:

  - Assets are preloaded, and the game waits for all resources before starting.
  - Uses counters to track loaded resources.

- **Transition Management**:

  - Smooth transitions between levels with animation effects.
  - Utilizes state variables and timing to control transitions.

- **Rendering Optimization**:

  - Uses cached canvases (`shade_canvases`) to optimize rendering with shading effects.

- **Naming Conventions**:
  - Constants and enums use uppercase with underscores.
  - Methods and variables use camelCase.

## Potential Improvements

- **Reduce Interdependency**:

  - Aim to decouple classes by using interfaces or event dispatchers.
  - For example, abstract input handling to reduce direct references to `Input` in the `Game` class.

- **Data Encapsulation**:

  - Encapsulate player and room properties to prevent external modifications.
  - Use getter and setter methods where appropriate.

- **Centralize Common Types**:

  - Move shared enums like `Direction` and `LevelState` to a dedicated types file.
  - This promotes reuse and consistency across modules.

- **Consistency in Naming**:

  - Ensure consistent naming for methods and properties, especially for event handlers and callbacks.
  - Standardize direction names if used across multiple classes.

- **Private Method Usage**:

  - Review method visibility; make internal methods private to encapsulate class functionality.
  - For example, methods like `lerp` and `drawHelper` could be private if not used externally.

- **Event System Implementation**:
  - Introduce an event manager to handle game events, reducing tight coupling between classes.
  - This can facilitate communication between the player, rooms, and other entities.

---

## Suggested Rule Updates

Based on the analysis, consider the following additions to the development principles:

14. **Resource Loading Assurance**: Implement a robust resource loading mechanism to ensure all assets are fully loaded before starting the game loop.

15. **Input Management Abstraction**: Introduce an input manager to centralize and abstract input handling, making it easier to manage different input sources and reduce coupling.

16. **Event-Driven Architecture**: Develop a centralized event system to handle interactions between game components, promoting decoupling and scalability.

17. **Rendering Optimization**: Continue to optimize rendering by caching frequently drawn assets and minimizing redundant draw calls.

18. **Code Documentation**: Maintain concise inline documentation for complex methods to aid future development and AI understanding.

19. **Consistent Error Handling**: Implement consistent error and exception handling across the codebase to improve stability.

---

By focusing on these areas, the codebase will become more maintainable, extensible, and better suited for collaboration, including integration with AI tools for future development.
