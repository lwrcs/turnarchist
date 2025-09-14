# `item.ts` Overview

The `item.ts` file defines the `Item` class, which represents collectible items within the game world. Items can be picked up by the player, displayed in the inventory, and have various interactions and animations associated with them. The `Item` class extends the `Drawable` class, allowing items to be rendered on the game canvas.

## Key Properties and Methods

### Properties

- **Position and Dimensions**:

  - `x: number`: The x-coordinate of the item's position.
  - `y: number`: The y-coordinate of the item's position.
  - `w: number`: The width of the item (typically `1`).
  - `h: number`: The height of the item (typically `2`).
  - `offsetY: number`: Vertical offset for rendering adjustments.
  - `drawableY: number`: Used for sorting render order.

- **Animation and Rendering**:
  - `tileX: number`: The x-coordinate on the sprite sheet for rendering.
  - `tileY: number`: The y-coordinate on the sprite sheet for rendering.
  - `frame: number`: The current animation frame.
  - `alpha: number`: Transparency level for fade-out effects.
  - `scaleFactor: number`: Scale factor for entry animation.
- **State and Behavior**:
  - `stackable: boolean`: Whether the item can be stacked.
  - `stackCount: number`: Number of items in the stack.
  - `pickedUp: boolean`: Indicates if the item has been picked up.
  - `level: Room`: Reference to the room where the item is located.

### Constructor

```typescript:src/item/item.ts
export class Item extends Drawable {
  constructor(level: Room, x: number, y: number) {
    super();

    this.level = level;
    this.x = x;
    this.y = y;
    this.drawableY = y;
    this.w = 1;
    this.h = 2;
    this.tileX = 0;
    this.tileY = 0;
    this.frame = 0;
    this.stackable = false;
    this.stackCount = 1;
    this.pickedUp = false;
    this.alpha = 1;
    this.scaleFactor = 0.2;
    this.offsetY = -0.25;
  }
}
```

- Initializes the item's position, dimensions, animation parameters, and state flags.
- Sets default values for properties such as `stackable`, `stackCount`, and `pickedUp`.

### Key Methods

#### Interaction Methods

- **`onPickup(player: Player): void`**: Handles logic when the item is picked up by the player.

  ```typescript:src/item/item.ts
  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) this.pickupSound();
    }
  };
  ```

  - Checks if the item has already been picked up to prevent duplicates.
  - Adds the item to the player's inventory.
  - Plays the pickup sound if successful.

- **`onDrop(): void`**: Placeholder for logic when the item is dropped.

  ```typescript:src/item/item.ts
  onDrop = () => { };
  ```

  - Intended to be overridden by subclasses to define drop behavior.

- **`dropFromInventory(): void`**: Handles logic when the item is dropped from the inventory.

  ```typescript:src/item/item.ts
  dropFromInventory = () => { };
  ```

  - Intended to be overridden or implemented with specific drop mechanics.

#### Rendering Methods

- **`draw(delta: number): void`**: Renders the item within the game world.

  ```typescript:src/item/item.ts
  draw = (delta: number) => {
    if (!this.pickedUp) {
      this.drawableY = this.y;

      if (this.scaleFactor < 1) this.scaleFactor += 0.04;
      else this.scaleFactor = 1;

      Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x + this.w * (this.scaleFactor * -0.5 + 0.5),
        this.y +
          Math.sin(this.frame) * 0.07 -
          1 +
          this.offsetY +
          this.h * (this.scaleFactor * -0.5 + 0.5),
        this.w * this.scaleFactor,
        this.h * this.scaleFactor,
        this.level.shadeColor,
        this.shadeAmount()
      );
    }
  };
  ```

  - Only draws the item if it hasn't been picked up.
  - Handles scaling animation when the item appears.
  - Applies a floating animation using `Math.sin` for a bobbing effect.
  - Considers shading based on the game's lighting at the item's position.

- **`drawTopLayer(delta: number): void`**: Renders any top-layer effects for the item.

  ```typescript:src/item/item.ts
  drawTopLayer = (delta: number) => {
    if (this.pickedUp) {
      this.y -= 0.125 * delta;
      this.alpha -= 0.03 * delta;
      if (this.y < -1)
        this.level.items = this.level.items.filter((x) => x !== this);

      if (GameConstants.ALPHA_ENABLED)
        Game.ctx.globalAlpha = Math.max(0, this.alpha);

      Game.drawItem(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x,
        this.y - 1,
        this.w,
        this.h
      );

      Game.ctx.globalAlpha = 1.0;
    }
  };
  ```

  - Handles the fade-out and upward movement animation when an item is picked up.
  - Removes the item from the room's item list once it moves off-screen.
  - Adjusts the canvas's global alpha for transparency effects.

- **`drawIcon(delta: number, x: number, y: number, opacity = 1): void`**: Draws the item's icon in the inventory or UI.

  ```typescript:src/item/item.ts
  drawIcon = (delta: number, x: number, y: number, opacity = 1) => {
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = opacity;
    Game.drawItem(this.tileX, this.tileY, 1, 2, x, y - 1, this.w, this.h);
    Game.ctx.globalAlpha = 1;

    let countText = this.stackCount <= 1 ? "" : "" + this.stackCount;
    let width = Game.measureText(countText).width;
    let countX = 16 - width;
    let countY = 10;

    Game.fillTextOutline(
      countText,
      x * GameConstants.TILESIZE + countX,
      y * GameConstants.TILESIZE + countY,
      GameConstants.OUTLINE,
      "white"
    );
  };
  ```

  - Renders the item's icon at the specified coordinates.
  - Displays the stack count if the item is stackable and has multiple units.
  - Applies opacity if needed.

#### Utility Methods

- **`tick(): void`** and **`tickInInventory(): void`**

  ```typescript:src/item/item.ts
  tick = () => { };
  tickInInventory = () => { };
  ```

  - Empty methods meant to be overridden by subclasses.
  - `tick` is called each game tick when the item is in the world.
  - `tickInInventory` is called each game tick when the item is in the player's inventory.

- **`getDescription(): string`**

  ```typescript:src/item/item.ts
  getDescription = (): string => {
    return "";
  };
  ```

  - Returns a description of the item.
  - Intended to be overridden to provide item-specific descriptions.

- **`pickupSound(): void`**

  ```typescript:src/item/item.ts
  pickupSound = () => {
    if (this.level === this.level.game.room) Sound.genericPickup();
  };
  ```

  - Plays a sound when the item is picked up.
  - Can be overridden for items with unique pickup sounds.

- **`shadeAmount(): number`**

  ```typescript:src/item/item.ts
  shadeAmount = () => {
    if (!this.x || !this.y) return 0;
    else return this.level.softVis[this.x][this.y];
  };
  ```

  - Determines the shading amount based on the item's position.
  - Uses the `softVis` array from `Room` to get lighting information.

## Game Logic and Flow

- **Item Appearance and Animation**:

  - Items spawn in the game world with an initial scale factor for a "pop-in" animation.
  - They have a floating effect to draw the player's attention.

- **Item Pickup**:

  - When the player moves over an item, `onPickup` is called.
  - The item is added to the player's inventory if possible.
  - A pickup sound is played, and the item begins its fade-out animation.

- **Rendering Order**:

  - Items use `drawableY` for render sorting to ensure proper layering with other entities and tiles.

- **Inventory Interaction**:

  - Items can be rendered in the inventory using `drawIcon`.
  - Stackable items display their count in the inventory.

- **Shading and Visibility**:
  - Items adjust their appearance based on the game's lighting at their location.
  - This creates a more immersive and visually consistent game world.

## Conventions and Patterns

### Coordinate System

- The game uses a top-left origin coordinate system.
- Positive `x` moves right, and positive `y` moves down.

### Method Visibility

- All properties and methods are public.
- Methods meant for internal use or to be overridden by subclasses are not marked as `private` or `protected`.

### Data Encapsulation

- Direct access to properties like `x`, `y`, `pickedUp`, and `stackCount` is allowed.
- The class relies on external code to modify these properties.

### Consistent Naming

- Methods and variables use `camelCase`.
- Method names are descriptive of their actions (e.g., `onPickup`, `drawIcon`).

### Inheritance and Polymorphism

- The `Item` class is designed to be extended.
- Subclasses can override methods like `tick`, `onPickup`, `getDescription`, and `pickupSound` to provide specific behaviors.

## Potential Improvements

### Data Encapsulation

- **Encapsulate Properties**: Make properties like `pickedUp`, `stackCount`, `alpha`, and position (`x`, `y`) private or protected to prevent unintended external modification. Provide getters and setters as needed.

- **Control Access to Internal State**: Use methods to modify internal states, such as `pickUp()`, `drop()`, or `setPosition(x, y)`.

### Method Visibility

- **Restrict Internal Methods**: Mark methods that are intended for internal use as `private` or `protected`, such as `shadeAmount` and `pickupSound`.

### Reduce Interdependency

- **Decouple from `Game` Class**: Avoid direct references to the `Game` class within the `Item` class. Instead, pass necessary dependencies through parameters or use event dispatchers.

- **Use Interfaces**: Define interfaces for classes like `Room` and `Player` to reduce coupling and improve testability.

### Centralize Common Types

- **Shared Enums and Interfaces**: Move common types like item-related interfaces or constants to a shared module to promote reuse and consistency.

### Consistency in Naming

- **Standardize Method Prefixes**: Use consistent prefixes for methods, such as `on` for event handlers (`onPickup`, `onDrop`) and `draw` for rendering methods.

### Error Handling

- **Null Checks and Validations**: Ensure properties like `x` and `y` are valid before using them to prevent runtime errors.

### Code Documentation

- **Commenting and Documentation**: Improve code comments to provide clear explanations of methods, especially ones intended for overriding.

### Method Overriding and Abstract Classes

- **Abstract Methods**: Consider making `Item` an abstract class if it's not meant to be instantiated directly. Define abstract methods for behaviors that must be implemented by subclasses.

## Suggested Rule Updates

**62. Enforce Property Encapsulation**

- Class properties that should not be modified externally should be declared as `private` or `protected`. Provide public getters and setters to control access.

**63. Limit Method Accessibility**

- Use appropriate access modifiers (`private`, `protected`) for methods intended for internal use to enhance encapsulation and prevent misuse.

**64. Decouple Classes from Global Instances**

- Reduce direct dependencies on global instances like `Game` by using dependency injection or event systems to improve modularity and testability.

**65. Centralize Item Types and Constants**

- Move item-related enums, interfaces, and constants to a shared module to avoid duplication and maintain consistency across the codebase.

**66. Standardize Method Naming Conventions**

- Adopt consistent naming patterns for methods, such as prefixing event handlers with `on` and rendering methods with `draw`.

**67. Implement Abstract Classes Where Appropriate**

- Use the `abstract` keyword for base classes not intended for direct instantiation and define abstract methods that subclasses must implement.

---

By incorporating these improvements and adhering to the updated development principles, the `Item` class and overall codebase will become more robust, maintainable, and scalable. This will facilitate future enhancements, improve collaboration among developers, and enhance the game's performance and stability.
