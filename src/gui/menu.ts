import { Game } from "../game";
import { guiButton } from "./guiButton";
import { InputEnum } from "../game/input";
import { GameConstants } from "../game/gameConstants";
import { MouseCursor } from "../gui/mouseCursor";
import { MuteButton } from "./muteButton";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";

export class Menu {
  buttons: guiButton[];
  closeButton: guiButton;
  open: boolean;
  selectedButton: number;
  player: Player;
  selectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(player: Player) {
    this.buttons = [];
    this.open = false;
    this.selectedButton = 0;
    this.initializeCloseButton();
    this.initializeMainMenu();
    this.player = player;
  }

  static drawOpenMenuButton() {
    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    Game.ctx.globalAlpha = 0.1;

    // Position in top right corner, 2 tiles away from right edge
    const buttonWidth = Math.round(GameConstants.TILESIZE * 1.5 - 2);
    const buttonHeight = Math.round(GameConstants.TILESIZE / 2 - 1);
    const rightMargin = 2 * GameConstants.TILESIZE; // 2 tiles from right edge
    const buttonX = 1;
    const buttonY = GameConstants.TILESIZE / 2;

    Game.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    Game.ctx.globalAlpha = 1;

    Game.ctx.fillStyle = "rgb(0, 0, 0)"; //yellow text
    Game.fillText("Menu", buttonX + 1, buttonY + 1);
    Game.ctx.restore();
  }

  initializeCloseButton() {
    // Match the menu button dimensions
    const buttonWidth = Math.round(GameConstants.TILESIZE * 1.5 - 2);
    const buttonHeight = Math.round(GameConstants.TILESIZE / 2 - 1);

    this.closeButton = new guiButton(
      0,
      0,
      Math.round(buttonWidth),
      Math.round(buttonHeight),
      "X",
      () => this.close(),
      false,
      this,
    );
  }

  initializeMainMenu() {
    // Don't set fixed dimensions - let positionButtons() calculate optimal sizes
    //this.addButton(new guiButton(0, 0, 0, 0, "Start Game", this.startGame));
    //this.addButton(new guiButton(0, 0, 0, 0, "Settings", this.openSettings));
    this.addButton(
      new guiButton(0, 0, 0, 0, "- Scale", this.scaleDown, false, this),
    );
    this.addButton(
      new guiButton(0, 0, 0, 0, "+ Scale", this.scaleUp, false, this),
    );
    const muteButton = new guiButton(
      0,
      0,
      0,
      0,
      "Mute Sound",
      () => {},
      false,
      this,
    );
    muteButton.onClick = muteButton.toggleMuteText;
    this.addButton(muteButton);
    //this.addButton(new guiButton(0, 0, 0, 0, "Exit", this.exitGame));
    this.positionButtons();
  }

  addButton(button: guiButton) {
    this.buttons.push(button);
  }

  draw() {
    if (!this.open) return;

    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Draw main menu buttons
    this.buttons.forEach((button) => {
      this.drawButton(button);
    });

    // Draw close button
    this.drawCloseButton();

    Game.ctx.restore();
  }

  drawButton(button: guiButton) {
    Game.ctx.save();
    Game.ctx.imageSmoothingEnabled = false;

    // Clear any stroke settings to prevent unwanted outlines
    Game.ctx.strokeStyle = "transparent";
    Game.ctx.lineWidth = 0;

    Game.ctx.fillStyle =
      this.selectedButton === this.buttons.indexOf(button)
        ? "rgba(75, 75, 75, 1)"
        : "rgba(100, 100, 100, 1)";

    // Round coordinates to prevent anti-aliasing outlines
    Game.ctx.fillRect(
      Math.round(button.x),
      Math.round(button.y),
      Math.round(button.width),
      Math.round(button.height),
    );

    Game.ctx.fillStyle = "rgba(0, 0, 0, 1)";

    const textWidth = Game.measureText(button.text).width;
    const textX = button.x + (button.width - textWidth) / 2;

    // Center text vertically in the button, accounting for varying button heights
    const textY = button.y + button.height / 2 - Game.letter_height / 2;

    Game.fillText(button.text, Math.round(textX), Math.round(textY));
    Game.ctx.restore();
  }

  drawCloseButton() {
    Game.ctx.save();
    Game.ctx.imageSmoothingEnabled = false;

    // Close button styling - make it red-ish for better visibility
    Game.ctx.fillStyle = "rgba(220, 60, 60, 1)"; // Red background
    Game.ctx.fillRect(
      Math.round(this.closeButton.x),
      Math.round(this.closeButton.y),
      Math.round(this.closeButton.width),
      Math.round(this.closeButton.height),
    );

    // Border for the close button
    Game.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(
      this.closeButton.x,
      this.closeButton.y,
      this.closeButton.width,
      this.closeButton.height,
    );

    // Draw X text
    Game.ctx.fillStyle = "rgba(255, 255, 255, 1)"; // White X
    const textWidth = Game.measureText(this.closeButton.text).width;
    const textX = this.closeButton.x + (this.closeButton.width - textWidth) / 2;
    const textY =
      this.closeButton.y + this.closeButton.height / 2 - Game.letter_height / 2;

    Game.fillText(this.closeButton.text, textX, textY);
    Game.ctx.restore();
  }

  inputHandler(input: InputEnum) {
    if (!this.open) return;

    switch (input) {
      case InputEnum.ESCAPE:
        this.open = false;
        break;
      case InputEnum.UP:
        this.up();
        break;
      case InputEnum.DOWN:
        this.down();
        break;
      case InputEnum.SPACE:
        this.select();
        break;
      case InputEnum.LEFT_CLICK:
        // Handle mouse clicks by getting current mouse position and calling mouseInputHandler
        const { x, y } = MouseCursor.getInstance().getPosition();
        console.log(
          `Menu.inputHandler received LEFT_CLICK, delegating to mouseInputHandler with x: ${x}, y: ${y}`,
        );
        this.mouseInputHandler(x, y);
        break;
      case InputEnum.RIGHT_CLICK:
        // Handle right clicks if needed (for now just log)
        console.log("Menu.inputHandler received RIGHT_CLICK");
        break;
      default:
        break;
    }
  }

  mouseInputHandler(x: number, y: number) {
    console.log(
      `Menu.mouseInputHandler called with x: ${x}, y: ${y}, menu.open: ${this.open}`,
    );

    if (!this.open) {
      console.log("Menu not open, returning early");
      return;
    }

    // Check close button first
    if (this.isPointInCloseButton(x, y)) {
      console.log("Close button clicked!");
      this.closeButton.onClick();
      return;
    }

    // Check main menu buttons
    const bounds = this.isPointInMenuBounds(x, y);
    console.log(`Menu bounds check result:`, bounds);

    if (bounds.inBounds && bounds.buttonIndex >= 0) {
      const button = this.buttons[bounds.buttonIndex];
      console.log(`Button ${bounds.buttonIndex} (${button.text}) clicked!`);

      // Clear any existing timeout
      if (this.selectionTimeoutId !== null) {
        clearTimeout(this.selectionTimeoutId);
      }

      // Set the selected button for visual feedback
      this.selectedButton = bounds.buttonIndex;

      // Set timeout to reset selection after 100ms
      this.selectionTimeoutId = setTimeout(() => {
        this.selectedButton = -1; // Reset to invalid index so no button appears selected
        this.selectionTimeoutId = null;
      }, 100);

      button.onClick();
    } else {
      console.log("Click was not on any menu button");
    }
  }

  close() {
    this.open = false;
  }

  openMenu() {
    console.log("Menu.openMenu() called");
    this.open = true;
    this.selectedButton = -1;
    console.log(`Menu opened, buttons positioned at:`);
    this.buttons.forEach((button, index) => {
      console.log(
        `  Button ${index} (${button.text}): x: ${button.x}, y: ${button.y}, width: ${button.width}, height: ${button.height}`,
      );
    });
  }

  toggleOpen() {
    if (this.open) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  select() {
    if (this.buttons[this.selectedButton]) {
      this.buttons[this.selectedButton].onClick();
    }
  }

  up() {
    if (this.buttons.length > 0) {
      this.selectedButton =
        (this.selectedButton - 1 + this.buttons.length) % this.buttons.length;
    }
  }

  down() {
    if (this.buttons.length > 0) {
      this.selectedButton = (this.selectedButton + 1) % this.buttons.length;
    }
  }

  // Action methods
  startGame = () => {
    console.log("Game Started");
    this.close();
    // Implement game start logic
  };

  exitGame = () => {
    console.log("Exit Game");
    // Implement exit game logic
  };

  openSettings = () => {
    console.log("Settings clicked - submenus disabled for now");
    // Implement settings logic later
  };

  scaleUp = () => {
    this.player.game.increaseScale();
    console.log("Scale Up clicked!");
    // Add scale up functionality here
  };

  scaleDown = () => {
    this.player.game.decreaseScale();
    console.log("Scale Down clicked!");
    // Add scale down functionality here
  };

  positionButtons() {
    const screenWidth = GameConstants.WIDTH;
    const screenHeight = GameConstants.HEIGHT;
    const buttonCount = this.buttons.length;

    // Position close button to match menu button position
    this.closeButton.x = 1;
    this.closeButton.y = GameConstants.TILESIZE / 2;

    // Button sizing - make them responsive to screen size
    const maxButtonWidth = Math.min(200, screenWidth * 0.6); // Max 60% of screen width

    // Calculate available space
    const horizontalMargin = (screenWidth - maxButtonWidth) / 2;
    const verticalMargin = 20; // Top and bottom margin
    const availableHeight = screenHeight - verticalMargin * 2;

    // Calculate button slots (scale buttons share one slot)
    const scaleButtonIndices = this.getScaleButtonIndices();
    const buttonSlots = buttonCount - (scaleButtonIndices.length > 0 ? 1 : 0); // Scale buttons share one slot
    const heightPerButtonSlot = availableHeight / buttonSlots;

    // Make each button take up ~80% of its slot, leaving 20% for spacing
    // Add maximum height constraint - reduce by 40% from what could be very tall buttons
    const maxButtonHeight = 30; // Maximum button height in pixels
    const calculatedHeight = Math.floor(heightPerButtonSlot * 0.8);
    const buttonHeight = Math.min(calculatedHeight, maxButtonHeight);

    console.log(`Menu.positionButtons: 
      Screen: ${screenWidth}x${screenHeight}
      Close button: ${this.closeButton.x}, ${this.closeButton.y} (${this.closeButton.width}x${this.closeButton.height})
      Button count: ${buttonCount}
      Button slots: ${buttonSlots}
      Available height: ${availableHeight}
      Height per slot: ${heightPerButtonSlot}
      Button height: ${buttonHeight}
      Button width: ${maxButtonWidth}`);

    // Update button dimensions and positions
    let currentSlot = 0;
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];

      if (button.text === "- Scale" || button.text === "+ Scale") {
        // Handle scale buttons specially - they share one slot side by side
        const isMinusButton = button.text === "- Scale";
        const buttonWidth = Math.floor(maxButtonWidth / 2) - 2; // Split width with small gap

        button.x = horizontalMargin + (isMinusButton ? 0 : buttonWidth + 4);
        button.y =
          verticalMargin +
          currentSlot * heightPerButtonSlot +
          (heightPerButtonSlot - buttonHeight) / 2;
        button.width = buttonWidth;
        button.height = buttonHeight;

        // Only advance slot after both scale buttons are positioned
        if (button.text === "+ Scale") {
          currentSlot++;
        }
      } else {
        // Regular button positioning
        button.x = horizontalMargin;
        button.y =
          verticalMargin +
          currentSlot * heightPerButtonSlot +
          (heightPerButtonSlot - buttonHeight) / 2;
        button.width = maxButtonWidth;
        button.height = buttonHeight;
        currentSlot++;
      }

      console.log(`  Button ${i} (${button.text}): 
        x: ${button.x}, y: ${button.y}, 
        width: ${button.width}, height: ${button.height}
        Bottom: ${button.y + button.height}`);
    }
  }

  getScaleButtonIndices(): number[] {
    const indices: number[] = [];
    this.buttons.forEach((button, index) => {
      if (button.text === "- Scale" || button.text === "+ Scale") {
        indices.push(index);
      }
    });
    return indices;
  }

  isPointInMenuBounds(
    x: number,
    y: number,
  ): { inBounds: boolean; buttonIndex: number } {
    if (!this.open) {
      return { inBounds: false, buttonIndex: -1 };
    }

    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        return { inBounds: true, buttonIndex: i };
      }
    }

    return { inBounds: false, buttonIndex: -1 };
  }

  isPointInCloseButton(x: number, y: number): boolean {
    return (
      x >= this.closeButton.x &&
      x <= this.closeButton.x + this.closeButton.width &&
      y >= this.closeButton.y &&
      y <= this.closeButton.y + this.closeButton.height
    );
  }
}
