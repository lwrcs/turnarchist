# `input.ts` Overview

The `input.ts` file is responsible for handling all player input within the game, including keyboard, mouse, and touch events. It defines input enums, manages event listeners, and processes input events to trigger corresponding actions within the game.

## Key Enums and Objects

### Enums

#### `InputEnum`

An enumeration that represents different types of input actions used throughout the game.

```typescript
enum InputEnum {
  I,
  M,
  M_UP,
  Q,
  LEFT,
  RIGHT,
  UP,
  DOWN,
  SPACE,
  COMMA,
  PERIOD,
  LEFT_CLICK,
  RIGHT_CLICK,
  MOUSE_MOVE,
}
```

### `Input` Object

The central object that encapsulates all input-related functionalities, including event listeners, input states, and callback methods.

## The Input Handling System

The `Input` object manages the state of user inputs and dispatches events to callback functions or listeners registered by other parts of the game. It supports multiple input sources:

- **Keyboard Input**: Handles key presses and releases.
- **Mouse Input**: Manages mouse movements and clicks.
- **Touch Input**: Processes touch events for mobile devices, including gestures like swipes and taps.

## Event Listeners and Handlers

### Keyboard Event Handlers

- **`onKeydown(event: KeyboardEvent)`**: Handles the `keydown` event when a key is pressed. It prevents default actions for certain keys and dispatches the input to the appropriate listener based on the key code.

- **`onKeyup(event: KeyboardEvent)`**: Handles the `keyup` event when a key is released. It updates the internal pressed state and triggers any necessary callbacks.

### Mouse Event Handlers

- **`mouseClickListener(event: MouseEvent)`**: Handles mouse click events for both left and right clicks, dispatching them to the respective listeners.

- **`updateMousePos(event: MouseEvent)`**: Updates the current mouse position within the game canvas and notifies any registered mouse move listeners.

- **`handleMouseDown(event: MouseEvent)`**: Processes the `mousedown` event, setting the mouse down state and notifying listeners.

- **`handleMouseUp(event: MouseEvent)`**: Processes the `mouseup` event, resetting the mouse down state and notifying listeners.

### Touch Event Handlers

- **`handleTouchStart(evt: TouchEvent)`**: Processes touch start events, initializing touch positions and starting timers for tap detection.

- **`handleTouchMove(evt: TouchEvent)`**: Manages touch move events, detecting swipe gestures and updating mouse position accordingly.

- **`handleTouchEnd(evt: TouchEvent)`**: Handles touch end events, determining if a tap or swipe occurred and triggering the appropriate actions.

## Input Processing Logic

### Input States

- **`_pressed: { [key: string]: boolean }`**: An internal object tracking the pressed state of keys.

- **`mouseX: number`, `mouseY: number`**: Current mouse position within the game canvas.

- **`mouseDown: boolean`**: Indicates whether a mouse button is currently pressed.

### Key Mappings

Key codes are mapped to readable constants for easier reference:

```typescript
SPACE: "Space",
LEFT: "ArrowLeft",
UP: "ArrowUp",
RIGHT: "ArrowRight",
DOWN: "ArrowDown",
W: "KeyW",
A: "KeyA",
S: "KeyS",
D: "KeyD",
M: "KeyM",
N: "KeyN",
I: "KeyI",
Q: "KeyQ",
COMMA: "Comma",
PERIOD: "Period",
```

### Input Callbacks

The `Input` object defines a series of listener functions that are intended to be overridden or assigned by other parts of the game to handle specific inputs:

- **Keyboard Listeners**

  - `keyDownListener(key: string)`: General key down callback.
  - Directional movement: `leftListener`, `rightListener`, `upListener`, `downListener`.
  - Action keys: `spaceListener`, `iListener`, `mListener`, `qListener`.
  - Alternate keys mapping to movement: `aListener`, `dListener`, `wListener`, `sListener` (which internally call the directional listeners).

- **Mouse Listeners**

  - Arrays to hold multiple listeners: `mouseLeftClickListeners`, `mouseRightClickListeners`, `mouseMoveListeners`, `mouseDownListeners`, `mouseUpListeners`.

- **Touch Listeners**

  - Swipe listeners: `leftSwipeListener`, `rightSwipeListener`, `upSwipeListener`, `downSwipeListener`.
  - Tap listener: `tapListener`.

### Event Registration

At the end of the file, event listeners are registered to the window or document:

```typescript
window.addEventListener("keyup", (event) => Input.onKeyup(event), false);
window.addEventListener("keydown", (event) => Input.onKeydown(event), false);
document
  .getElementById("gameCanvas")
  ?.addEventListener(
    "click",
    (event) => Input.mouseClickListener(event),
    false
  );
// Additional event registrations for mousemove, mousedown, mouseup, and contextmenu prevention
```

These registrations bind the input handling methods to the actual browser events.

## Conventions and Patterns

### Coordinate System

- The input system adheres to the game's top-left origin coordinate system, where positive X is right, and positive Y is down.

### Event-Driven Input Handling

- The `Input` object serves as a centralized hub for input events, dispatching them to registered listeners.
- Lists of listeners (`mouseLeftClickListeners`, etc.) allow multiple parts of the game to respond to input events without direct coupling.

### Separation of Concerns

- The input handling logic is decoupled from the game logic, allowing for cleaner code and easier maintenance.

### Consistent Naming Conventions

- Listener methods are consistently named to reflect their purpose, e.g., `leftListener` for the left arrow key or `A` key.

### Method Visibility

- Functions within the `Input` object are public to allow other modules to assign or override them as needed.
- Internal variables and helper functions are kept within the `Input` object scope to prevent unintended access.

## Potential Improvements

### Reduce Interdependency

- **Encapsulate Input Handling**: While the `Input` object serves as a central hub, direct manipulation of its properties from outside modules can lead to tight coupling. Encapsulating internal states and providing methods to add or remove listeners can improve modularity.

- **Use Classes Instead of Object Literals**: Converting the `Input` object into a class with private properties and public methods can enhance data encapsulation.

### Data Encapsulation

- **Private Properties**: Make internal properties like `_pressed`, `mouseX`, `mouseY`, and others private to prevent external modification.

- **Listener Management Methods**: Provide methods like `addMouseLeftClickListener(callback)` and `removeMouseLeftClickListener(callback)` to manage listeners safely.

### Centralize Common Types

- **Shared Enums and Constants**: Move key codes and `InputEnum` to a centralized types or constants module for reuse and consistency across the codebase.

### Consistency in Naming

- **Prefix Listener Methods**: Adopt a consistent prefix for listener methods, such as `on` (e.g., `onLeftListener`, `onRightListener`) to clearly indicate their role as event handlers.

### Method Visibility

- **Restrict Direct Access**: Limit access to internal methods and variables by using closures or class private fields.

### Modularization

- **Separate Touch and Mouse Handling**: Consider splitting touch and mouse input handling into separate modules or classes if they become more complex, to improve maintainability.

### Error Handling

- **Robust Null Checking**: Ensure that elements like `document.getElementById("gameCanvas")` are checked for `null` to prevent runtime errors in environments where the canvas might not be available.

## Suggested Rule Updates

Based on the analysis, the following rule updates are suggested:

**41. Encapsulate Input Handling**

- Utilize classes or modules to encapsulate input handling logic, preventing external modules from directly modifying internal states.

**42. Manage Event Listeners Through Methods**

- Provide methods for adding and removing event listeners to control registration and ensure that listeners are managed consistently.

**43. Use Private Properties in Classes**

- When using classes, declare internal properties as private, exposing only necessary methods for interaction to enhance data encapsulation.

**44. Centralize Input Constants**

- Move shared input-related constants and enums to a central location to promote reuse and maintain consistency across different modules.

**45. Consistent Listener Naming**

- Prefix all listener methods with `on` to clearly indicate their purpose and maintain consistency (e.g., `onLeft`, `onRight`, `onSpace`).

**46. Null Safety Checks**

- Implement null checks and error handling when accessing DOM elements or external resources to prevent runtime exceptions.

---

By applying these improvements and adhering to the updated rules, the input handling system will become more robust, maintainable, and scalable. This will facilitate future development, allow for easier refactoring, and enhance compatibility with AI and other automation tools.
