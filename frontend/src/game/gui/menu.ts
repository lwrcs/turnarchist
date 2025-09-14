import { Game } from "../game";
import { guiButton } from "./guiButton";
import { InputEnum } from "../game/input";
import { GameConstants } from "../game/gameConstants";
import { MouseCursor } from "./mouseCursor";
import { Player } from "../player/player";

export class Menu {
  buttons: guiButton[];
  closeButton: guiButton | null;
  open: boolean;
  selectedButton: number;
  game: Game;
  player?: Player;
  private showCloseButton: boolean = true;
  selectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // Add debouncing properties
  private lastButtonClickTime: number = 0;
  private lastButtonClickIndex: number = -1;
  private readonly BUTTON_CLICK_DEBOUNCE_TIME = 150; // milliseconds

  constructor(
    arg:
      | Player
      | {
          game: Game;
          player?: Player;
          showCloseButton?: boolean;
        },
  ) {
    this.buttons = [];
    this.open = false;
    this.selectedButton = 0;
    if (arg instanceof Player) {
      this.game = arg.game;
      this.player = arg;
      this.showCloseButton = true;
      this.initializeCloseButton();
      this.initializeMainMenu();
    } else {
      this.game = arg.game;
      this.player = arg.player;
      this.showCloseButton = arg.showCloseButton !== false;
      if (this.showCloseButton) this.initializeCloseButton();
      // Do not auto-build buttons; caller decides what to add
    }
  }

  static drawOpenMenuButton() {
    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    Game.ctx.globalAlpha = 0.1;

    // Position in top right corner, 2 tiles away from right edge
    const buttonWidth = Math.round(GameConstants.TILESIZE * 1.5 - 2);
    const buttonHeight = Math.round(GameConstants.TILESIZE / 2 - 1);
    const rightMargin = 2 * GameConstants.TILESIZE; // 2 tiles from right edge
    const buttonX = GameConstants.WIDTH / 2;
    const buttonY = GameConstants.TILESIZE / 2;

    Game.drawFX(18, 0, 1, 1, 0, 0.5, 1, 1);

    //Game.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    //Game.ctx.fillStyle = "rgb(0, 0, 0)"; //yellow text
    Game.fillText("Menu", 10, 10);
    Game.ctx.globalAlpha = 1;

    Game.ctx.restore();
  }

  initializeCloseButton() {
    // Match the menu button dimensions
    const buttonWidth = Math.round(GameConstants.TILESIZE * 1.5 - 2);
    const buttonHeight = Math.round(GameConstants.TILESIZE * 1.5 - 2);

    this.closeButton = new guiButton(
      0,
      -1,
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
    const smoothButton = new guiButton(
      0,
      0,
      0,
      0,
      "Smooth Lighting",
      () => {
        // Mirror the "/smooth" command behavior
        GameConstants.SMOOTH_LIGHTING = !GameConstants.SMOOTH_LIGHTING;
        const enabled = GameConstants.SMOOTH_LIGHTING ? "enabled" : "disabled";
        this.game.pushMessage(`Smooth lighting is now ${enabled}`);
        try {
          const { saveSettings } = require("../game/settingsPersistence");
          saveSettings(this.game);
        } catch {}
      },
      false,
      this,
    );
    this.addButton(smoothButton);

    const hoverTextButton = new guiButton(
      0,
      0,
      0,
      0,
      "Hover Text",
      () => {
        GameConstants.HOVER_TEXT_ENABLED = !GameConstants.HOVER_TEXT_ENABLED;
        const enabled = GameConstants.HOVER_TEXT_ENABLED
          ? "enabled"
          : "disabled";
        this.game.pushMessage(`Hover text is now ${enabled}`);
        try {
          const { saveSettings } = require("../game/settingsPersistence");
          saveSettings(this.game);
        } catch {}
      },
      false,
      this,
    );
    this.addButton(hoverTextButton);

    const saveBtn = new guiButton(
      0,
      0,
      0,
      0,
      "Save Game",
      () => {
        try {
          const { saveToCookies } = require("../game/savePersistence");
          saveToCookies(this.game);
        } catch (e) {
          this.game.pushMessage("Save failed.");
        }
      },
      false,
      this,
    );
    //this.addButton(saveBtn);

    const loadBtn = new guiButton(
      0,
      0,
      0,
      0,
      "Load Game",
      () => {
        try {
          const { loadFromCookies } = require("../game/savePersistence");
          loadFromCookies(this.game);
        } catch (e) {
          this.game.pushMessage("Load failed.");
        }
      },
      false,
      this,
    );
    //this.addButton(loadBtn);

    const newGameBtn = new guiButton(
      0,
      0,
      0,
      0,
      "New Game",
      () => {
        try {
          this.game.newGame();
        } catch (e) {
          this.game.pushMessage("New Game failed.");
        }
      },
      false,
      this,
    );
    this.addButton(newGameBtn);

    const clearBtn = new guiButton(
      0,
      0,
      0,
      0,
      "Clear Save",
      () => {
        try {
          const { clearCookieSave } = require("../game/savePersistence");
          clearCookieSave();
          this.game.pushMessage("Cleared cookie/localStorage save.");
        } catch (e) {
          this.game.pushMessage("Clear Save failed.");
        }
      },
      false,
      this,
    );
    //this.addButton(clearBtn);
    //this.addButton(new guiButton(0, 0, 0, 0, "Exit", this.exitGame));
    this.positionButtons();
  }

  buildStartMenu() {
    this.buttons = [];
    const header = new guiButton(
      0,
      0,
      0,
      0,
      "Welcome to Turnarchist",
      () => {},
      false,
      this,
    );
    header.noFill = true;
    header.textColor = "rgb(255, 255, 0)"; // yellow text
    this.addButton(header);
    const continueBtn = new guiButton(
      0,
      0,
      0,
      0,
      "Continue",
      () => {
        try {
          const { loadFromCookies } = require("../game/savePersistence");
          loadFromCookies(this.game).then((ok: boolean) => {
            if (ok) {
              this.game.pushMessage("Loaded save.");
              this.close();
              (this.game as any).startedFadeOut = true;
              (this.game as any).startMenuActive = false;
            } else {
              this.game.pushMessage("Load failed.");
            }
          });
        } catch (e) {
          this.game.pushMessage("Load failed.");
        }
      },
      false,
      this,
    );
    const newBtn = new guiButton(
      0,
      0,
      0,
      0,
      "New Game",
      () => {
        this.close();
        (this.game as any).startedFadeOut = true;
        (this.game as any).startMenuActive = false;
      },
      false,
      this,
    );
    this.addButton(continueBtn);
    this.addButton(newBtn);
    this.positionButtons();
  }

  addButton(button: guiButton) {
    this.buttons.push(button);
  }

  draw() {
    if (this.open) {
      Game.ctx.save();
      Game.ctx.fillStyle = "rgba(0, 0, 0, 0)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      // Draw main menu buttons
      this.buttons.forEach((button) => {
        this.drawButton(button);
      });

      // Draw close button
      if (this.showCloseButton && this.closeButton) this.drawCloseButton();

      Game.ctx.restore();
    }
  }

  drawButton(button: guiButton) {
    Game.ctx.save();
    Game.ctx.imageSmoothingEnabled = false;

    // Clear any stroke settings to prevent unwanted outlines
    Game.ctx.strokeStyle = "transparent";
    Game.ctx.lineWidth = 0;

    // Optional no-fill for header-like buttons
    if (!button.noFill) {
      Game.ctx.fillStyle =
        this.selectedButton === this.buttons.indexOf(button)
          ? "rgba(75, 75, 75, 0.5)"
          : "rgba(100, 100, 100, 0.5)";

      // Round coordinates to prevent anti-aliasing outlines
      Game.ctx.fillRect(
        Math.round(button.x),
        Math.round(button.y),
        Math.round(button.width),
        Math.round(button.height),
      );
    }

    // Default text color: yellow (overridden by per-button textColor if provided)
    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    if (button.textColor) Game.ctx.fillStyle = button.textColor;

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
    if (this.closeButton)
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

        this.mouseInputHandler(x, y);
        break;
      case InputEnum.RIGHT_CLICK:
        // Handle right clicks if needed (for now just log)
        break;
      default:
        break;
    }
  }

  mouseInputHandler(x: number, y: number) {
    if (!this.open) {
      return;
    }

    // Check close button first
    if (this.showCloseButton && this.isPointInCloseButton(x, y)) {
      // Add debouncing for close button too
      const currentTime = Date.now();
      if (
        currentTime - this.lastButtonClickTime <
        this.BUTTON_CLICK_DEBOUNCE_TIME
      ) {
        return;
      }
      this.lastButtonClickTime = currentTime;
      this.closeButton.onClick();
      return;
    }

    // Check main menu buttons
    const bounds = this.isPointInMenuBounds(x, y);

    if (bounds.inBounds && bounds.buttonIndex >= 0) {
      const button = this.buttons[bounds.buttonIndex];
      const currentTime = Date.now();

      // Debounce check: prevent multiple rapid clicks on the same button
      if (
        bounds.buttonIndex === this.lastButtonClickIndex &&
        currentTime - this.lastButtonClickTime < this.BUTTON_CLICK_DEBOUNCE_TIME
      ) {
        return; // Ignore this click as it's too soon after the last one
      }

      // Update debounce tracking
      this.lastButtonClickTime = currentTime;
      this.lastButtonClickIndex = bounds.buttonIndex;

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
    }
  }

  close() {
    this.open = false;
  }

  openMenu() {
    this.open = true;
    this.selectedButton = -1;
    this.buttons.forEach((button, index) => {});
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
    this.close();
    // Implement game start logic
  };

  exitGame = () => {
    // Implement exit game logic
  };

  openSettings = () => {
    // Implement settings logic later
  };

  scaleUp = () => {
    this.game.increaseScale();
    // Add scale up functionality here
  };

  scaleDown = () => {
    this.game.decreaseScale();
    // Add scale down functionality here
  };

  positionButtons() {
    const screenWidth = GameConstants.WIDTH;
    const screenHeight = GameConstants.HEIGHT;
    const buttonCount = this.buttons.length;

    // Position close button to match menu button position
    if (this.showCloseButton && this.closeButton) {
      this.closeButton.x = 1;
      this.closeButton.y = GameConstants.TILESIZE / 2;
    }

    // Layout parameters: tighter margins and smaller spacing
    const maxButtonWidth = Math.min(260, Math.floor(screenWidth * 0.8));
    const verticalMargin = 8; // smaller top/bottom margin
    const spacing = 6; // smaller space between buttons
    const horizontalGap = 8; // gap between side-by-side buttons
    const paddingX = 16; // left+right padding for text

    // Rows count (scale +/- share one row)
    const scaleButtonIndices = this.getScaleButtonIndices();
    const rows = buttonCount - (scaleButtonIndices.length > 0 ? 1 : 0);
    const totalSpacing = spacing * Math.max(0, rows - 1);
    const availableHeight = Math.max(
      0,
      screenHeight - verticalMargin * 2 - totalSpacing,
    );
    const maxButtonHeight = 22; // shorter max height
    const computedHeight =
      rows > 0 ? Math.floor(availableHeight / rows) : maxButtonHeight;
    const buttonHeight = Math.min(
      maxButtonHeight,
      Math.max(12, computedHeight), // shorter minimum height
    );

    // Update button dimensions and positions
    if (rows <= 0) return;
    const totalButtonsHeight = rows * buttonHeight + totalSpacing;
    const availableRectTop = verticalMargin;
    const availableRectHeight = screenHeight - verticalMargin * 2;
    let currentY =
      availableRectTop +
      Math.floor((availableRectHeight - totalButtonsHeight) / 2);
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];

      if (button.text === "- Scale" || button.text === "+ Scale") {
        // Handle the scale pair together
        const minusBtn =
          this.buttons[i].text === "- Scale" ? this.buttons[i] : null;
        const plusIdx = this.buttons[i].text === "- Scale" ? i + 1 : i - 1;
        const plusBtn = this.buttons[plusIdx];

        // Measure widths based on text
        const minusTextW = Game.measureText("- Scale").width;
        const plusTextW = Game.measureText("+ Scale").width;
        const minusW = Math.min(maxButtonWidth, minusTextW + paddingX);
        const plusW = Math.min(maxButtonWidth, plusTextW + paddingX);
        const pairWidth = minusW + horizontalGap + plusW;
        const startX = Math.floor((screenWidth - pairWidth) / 2);
        const y = currentY;

        // Place minus
        const minus =
          this.buttons[i].text === "- Scale"
            ? this.buttons[i]
            : this.buttons[plusIdx];
        minus.x = startX;
        minus.y = y;
        minus.width = minusW;
        minus.height = buttonHeight;

        // Place plus
        const plus = plusBtn;
        plus.x = startX + minusW + horizontalGap;
        plus.y = y;
        plus.width = plusW;
        plus.height = buttonHeight;

        // Skip next index if we placed both in this iteration
        if (this.buttons[i].text === "- Scale") {
          i = Math.max(i, plusIdx);
        }
        currentY += buttonHeight + spacing;
      } else {
        const textW = Game.measureText(button.text).width;
        const width = Math.min(maxButtonWidth, textW + paddingX);
        button.width = width;
        button.x = Math.floor((screenWidth - width) / 2);
        button.y = currentY;
        button.height = buttonHeight;
        currentY += buttonHeight + spacing;
      }
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
      !!this.closeButton &&
      x >= this.closeButton.x &&
      x <= this.closeButton.x + this.closeButton.width &&
      y >= this.closeButton.y &&
      y <= this.closeButton.y + this.closeButton.height
    );
  }
}
