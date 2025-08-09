import { Input, InputEnum } from "../game/input";
import type { Player } from "./player";
import { Direction, LevelState } from "../game";
import { MouseCursor } from "../gui/mouseCursor";
import { VendingMachine } from "../entity/object/vendingMachine";
import { GameConstants } from "../game/gameConstants";
import { MuteButton } from "../gui/muteButton";
import { Sound } from "../sound/sound";

export class PlayerInputHandler {
  private player: Player;
  mostRecentInput: string;
  mostRecentMoveInput: string;
  moveStartTime: number;
  private mouseHoldInitialDirection: Direction | null = null;

  constructor(player: Player) {
    this.player = player;
    this.mostRecentInput = "keyboard";
    this.mostRecentMoveInput = "keyboard";
    this.moveStartTime = 0;

    if (player.isLocalPlayer) {
      this.setupListeners();
    }
  }

  setupListeners() {
    // Prevent duplicate handler registrations after save/load by resetting arrays
    // These arrays are only used for player input routing
    try {
      (Input.mouseRightClickListeners as any).length = 0;
      (Input.mouseLeftClickListeners as any).length = 0;
    } catch {}

    Input.leftSwipeListener = () => this.handleInput(InputEnum.LEFT);
    Input.rightSwipeListener = () => this.handleInput(InputEnum.RIGHT);
    Input.upSwipeListener = () => this.handleInput(InputEnum.UP);
    Input.downSwipeListener = () => this.handleInput(InputEnum.DOWN);
    Input.commaListener = () => this.handleInput(InputEnum.COMMA);
    Input.periodListener = () => this.handleInput(InputEnum.PERIOD);
    Input.tapListener = () => this.handleTap();
    Input.mouseMoveListener = () => this.handleInput(InputEnum.MOUSE_MOVE);
    Input.mouseRightClickListeners.push(() =>
      this.handleInput(InputEnum.RIGHT_CLICK),
    );
    Input.mouseDownListeners.push((x: number, y: number, button: number) =>
      this.handleMouseDown(x, y, button),
    );
    Input.numKeyListener = (num) =>
      this.handleInput(InputEnum.NUMBER_1 + num - 1);
    Input.equalsListener = () => this.handleInput(InputEnum.EQUALS);
    Input.minusListener = () => this.handleInput(InputEnum.MINUS);
    Input.escapeListener = () => this.handleInput(InputEnum.ESCAPE);
    Input.fListener = () => this.handleInput(InputEnum.F);
  }

  handleInput(input: InputEnum) {
    if (this.player.busyAnimating || this.player.game.cameraAnimation.active)
      return;

    // Block input during level transitions, except for mouse movement
    if (
      (this.player.game.levelState === LevelState.TRANSITIONING ||
        this.player.game.levelState === LevelState.TRANSITIONING_LADDER) &&
      input !== InputEnum.MOUSE_MOVE
    ) {
      return;
    }

    if (this.player.menu.open) {
      this.player.menu.inputHandler(input);
      return;
    }

    if (!this.player.game.started && input !== InputEnum.MOUSE_MOVE) {
      this.player.game.startedFadeOut = true;
      return;
    }

    switch (input) {
      case InputEnum.I: {
        const inv = this.player.inventory;
        this.player.actionProcessor.process({
          type: inv.isOpen ? "CloseInventory" : "OpenInventory",
        });
        break;
      }
      case InputEnum.Q:
        this.player.actionProcessor.process({ type: "InventoryDrop" });
        break;
      case InputEnum.F:
        //this.player.game.newGame();
        //this.player.stall();
        break;
      case InputEnum.LEFT:
        if (!this.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.LEFT,
            targetX: this.player.x - 1,
            targetY: this.player.y,
          });
        break;

      case InputEnum.RIGHT:
        if (!this.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.RIGHT,
            targetX: this.player.x + 1,
            targetY: this.player.y,
          });
        break;

      case InputEnum.UP:
        if (!this.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.UP,
            targetX: this.player.x,
            targetY: this.player.y - 1,
          });
        break;

      case InputEnum.DOWN:
        if (!this.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.DOWN,
            targetX: this.player.x,
            targetY: this.player.y + 1,
          });
        break;
      case InputEnum.SPACE:
        const player = this.player;
        this.setMostRecentInput("keyboard");

        if (player.game.chatOpen) return;

        if (player.dead) {
          player.restart();
          return;
        }

        if (
          this.player.openVendingMachine &&
          this.player.openVendingMachine.open
        ) {
          this.player.openVendingMachine.space();
          break;
        }

        if (
          player.inventory.isOpen ||
          player.game.levelState === LevelState.IN_LEVEL
        ) {
          this.setMostRecentInput("keyboard");
          this.player.actionProcessor.process({ type: "InventoryUse" });
        }
        break;
      case InputEnum.COMMA:
        this.setMostRecentInput("keyboard");
        this.player.actionProcessor.process({ type: "InventoryLeft" });
        break;
      case InputEnum.PERIOD:
        this.setMostRecentInput("keyboard");
        this.player.actionProcessor.process({ type: "InventoryRight" });
        break;
      case InputEnum.LEFT_CLICK:
        this.handleMouseLeftClick();
        break;
      case InputEnum.RIGHT_CLICK:
        this.handleMouseRightClick();
        break;
      case InputEnum.MOUSE_MOVE:
        //when mouse moves
        this.setMostRecentInput("mouse");
        this.player.inventory.mouseMove();

        // Check if mouse hold should be cancelled
        if (Input.mouseDown && Input.mouseDownHandled) {
          let shouldCancelHold = false;

          // Check distance from initial position
          const dx = Input.mouseX - Input.lastMouseDownX;
          const dy = Input.mouseY - Input.lastMouseDownY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxHoldDistance = GameConstants.TILESIZE * 1.5; // 1.5 tiles

          if (distance > maxHoldDistance) {
            shouldCancelHold = true;
          }

          // Check if player direction changed from initial
          if (
            this.mouseHoldInitialDirection !== null &&
            this.player.direction !== this.mouseHoldInitialDirection
          ) {
            shouldCancelHold = true;
          }

          if (shouldCancelHold) {
            Input.mouseDownHandled = false;
            Input.lastMouseDownTime = 0;
            this.mouseHoldInitialDirection = null;
          }
        }

        if (!this.ignoreDirectionInput() || GameConstants.isMobile) {
          this.faceMouse();
          this.player.setTileCursorPosition();
        }
        break;
      case InputEnum.NUMBER_1:
      case InputEnum.NUMBER_2:
      case InputEnum.NUMBER_3:
      case InputEnum.NUMBER_4:
      case InputEnum.NUMBER_5:
      case InputEnum.NUMBER_6:
      case InputEnum.NUMBER_7:
      case InputEnum.NUMBER_8:
      case InputEnum.NUMBER_9:
        this.setMostRecentInput("keyboard");
        this.handleNumKey(input - 13);
        break;
      case InputEnum.EQUALS:
        this.player.game.increaseScale();
        break;
      case InputEnum.MINUS:
        this.player.game.decreaseScale();
        break;
      case InputEnum.ESCAPE:
        this.player.inventory.close();
        break;
    }
  }

  handleNumKey = (num: number) => {
    if (this.player.menu.open) return;
    this.setMostRecentInput("keyboard");
    if (num <= 5) {
      this.player.actionProcessor.process({
        type: "InventorySelect",
        index: num - 1,
      });
    } else {
      if (GameConstants.DEVELOPER_MODE) {
        switch (num) {
          case 6:
            GameConstants.SET_SHADE_LAYER_COMPOSITE_OPERATION(true);
            break;
          case 7:
            GameConstants.SET_SHADE_LAYER_COMPOSITE_OPERATION(false);
            break;
        }
      }
    }
  };

  handleMouseRightClick() {
    this.setMostRecentInput("mouse");
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.player.inventory.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      this.player.inventory.drop();
    }
  }

  handleMouseDown(x: number, y: number, button: number) {
    if (button !== 0) return; // Only handle left mouse button

    const player = this.player;

    if (player.game.levelState !== LevelState.IN_LEVEL) {
      Input.mouseDownHandled = false;
      return;
    }

    this.setMostRecentInput("mouse");

    // Handle dead player restart
    if (player.dead) {
      player.restart();
      Input.mouseDownHandled = true;
      return;
    }

    // Handle game not started
    if (!player.game.started) {
      player.game.startedFadeOut = true;
      Input.mouseDownHandled = true;
      return;
    }

    // Store mouse down info for repeat
    Input.lastMouseDownTime = Date.now();
    Input.lastMouseDownX = x;
    Input.lastMouseDownY = y;

    const inventory = player.inventory;

    // Handle inventory toggle when clicking outside or on inventory button
    const clickedOutsideInventory =
      (inventory.isOpen &&
        !inventory.isPointInInventoryBounds(x, y).inBounds) ||
      inventory.isPointInInventoryButton(x, y);

    if (clickedOutsideInventory) {
      inventory.toggleOpen();
      Input.mouseDownHandled = true;
      return;
    }

    // Handle menu
    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    // Check if click is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      this.handleMenuButtonClick();
      Input.mouseDownHandled = true;
      return;
    }

    // Handle vending machine
    if (player.openVendingMachine) {
      if (
        VendingMachine.isPointInVendingMachineBounds(
          x,
          y,
          player.openVendingMachine,
        )
      ) {
        player.openVendingMachine.space();
      } else {
        player.openVendingMachine.close();
      }
      Input.mouseDownHandled = true;
      return;
    }

    // Check if this is a UI interaction
    const isUIInteraction =
      inventory.isPointInInventoryButton(x, y) ||
      inventory.isPointInQuickbarBounds(x, y).inBounds ||
      inventory.isOpen ||
      this.isPointInMenuButtonBounds(x, y);

    if (!isUIInteraction) {
      // Handle movement
      if (!player.busyAnimating && !player.game.cameraAnimation.active) {
        // Store the initial direction when starting mouse hold for movement
        this.mouseHoldInitialDirection = this.player.direction;
        player.moveWithMouse();
        Input.mouseDownHandled = true;
      } else {
        Input.mouseDownHandled = false;
      }
    } else {
      Input.mouseDownHandled = false;
    }
  }

  handleMouseLeftClick() {
    const player = this.player;
    const cursor = MouseCursor.getInstance();
    const { x, y } = cursor.getPosition();

    if (player.game.levelState !== LevelState.IN_LEVEL) {
      return;
    }

    this.setMostRecentInput("mouse");

    if (player.dead) {
      player.restart();
      return;
    }

    const inventory = player.inventory;

    const clickedOutsideInventory =
      (inventory.isOpen &&
        !inventory.isPointInInventoryBounds(x, y).inBounds) ||
      inventory.isPointInInventoryButton(x, y);

    if (clickedOutsideInventory) {
      inventory.toggleOpen();
    }

    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(x, y);
      return;
    } else {
    }

    // Check if click is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      this.handleMenuButtonClick();
      return;
    }

    if (player.openVendingMachine) {
      if (
        VendingMachine.isPointInVendingMachineBounds(
          x,
          y,
          player.openVendingMachine,
        )
      ) {
        player.openVendingMachine.space();
      } else {
        player.openVendingMachine.close();
        this.setMostRecentInput("mouse");
        const { x, y } = MouseCursor.getInstance().getPosition();
        const bounds = this.player.inventory.isPointInInventoryBounds(x, y);
      }
      return;
    }

    const notInInventoryUI =
      !inventory.isPointInInventoryButton(x, y) &&
      !inventory.isPointInQuickbarBounds(x, y).inBounds &&
      !inventory.isOpen;

    // Only handle movement if it wasn't already handled on mousedown
    if (notInInventoryUI && !Input.mouseDownHandled) {
      player.moveWithMouse();
    }
  }

  ignoreDirectionInput = (): boolean => {
    return (
      this.player.inventory.isOpen ||
      this.player.dead ||
      this.player.game.levelState !== LevelState.IN_LEVEL ||
      this.player.menu.open ||
      (this.player.inventory.isPointInQuickbarBounds(Input.mouseX, Input.mouseY)
        .inBounds &&
        this.player.game.isMobile)
    );
  };

  handleTap() {
    // If the interaction was already handled by mouseDown, don't process it again
    if (Input.mouseDownHandled) {
      return;
    }

    if (this.player.dead) {
      this.player.restart();
      return;
    } else if (!this.player.game.started) {
      this.player.game.startedFadeOut = true;
      return;
    }

    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(Input.mouseX, Input.mouseY);
      return;
    }

    const x = Input.mouseX;
    const y = Input.mouseY;

    // Check if tap is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      this.handleMenuButtonClick();
      return;
    }

    const isInInventory = this.player.inventory.isPointInInventoryBounds(
      x,
      y,
    ).inBounds;
    const isInQuickbar = this.player.inventory.isPointInQuickbarBounds(
      x,
      y,
    ).inBounds;

    if (this.player.openVendingMachine && this.player.openVendingMachine.open) {
      const isInVMUI = VendingMachine.isPointInVendingMachineBounds(
        Input.mouseX,
        Input.mouseY,
        this.player.openVendingMachine,
      );
      if (isInVMUI) {
        this.player.openVendingMachine.space();
        return;
      } else if (!isInVMUI) {
        this.player.openVendingMachine.close();
        this.setMostRecentInput("mouse");
        const { x, y } = MouseCursor.getInstance().getPosition();
        const bounds = this.player.inventory.isPointInInventoryBounds(x, y);
      }
      return;
    }

    if (
      !this.player.inventory.isOpen &&
      this.player.inventory.isPointInInventoryButton(x, y)
    ) {
      this.player.inventory.open();
    } else if (this.player.inventory.isOpen) {
      if (isInInventory) {
        this.handleInput(InputEnum.LEFT_CLICK);
      } else {
        this.player.inventory.close();
      }
    } else if (isInQuickbar) {
      this.handleInput(InputEnum.LEFT_CLICK);
    }
  }

  handleKeyboardKey(key: string) {
    switch (key.toUpperCase()) {
      case "A":
      case "ARROWLEFT":
        this.handleInput(InputEnum.LEFT);
        break;
      case "D":
      case "ARROWRIGHT":
        this.handleInput(InputEnum.RIGHT);
        break;
      case "W":
      case "ARROWUP":
        this.handleInput(InputEnum.UP);
        break;
      case "S":
      case "ARROWDOWN":
        this.handleInput(InputEnum.DOWN);
        break;
      case " ":
        this.handleInput(InputEnum.SPACE);
        break;
      case "I":
        this.handleInput(InputEnum.I);
        break;
      case "Q":
        this.handleInput(InputEnum.Q);
        break;
      // Possibly add number keys for inventory here too
      default:
        // Unknown key; ignore or log if needed
        break;
    }
  }

  setMostRecentInput = (input: string) => {
    this.mostRecentInput = input;
  };
  setMostRecentMoveInput = (input: string) => {
    this.mostRecentMoveInput = input;
  };

  mouseAngle = () => {
    const mousePosition = MouseCursor.getInstance().getPosition();
    const playerPixelPosition = {
      x: GameConstants.WIDTH / 2,
      y: GameConstants.HEIGHT / 2,
    };
    const dx = mousePosition.x - playerPixelPosition.x;
    const dy = mousePosition.y - playerPixelPosition.y;
    return Math.atan2(dy, dx);
  };

  faceMouse = () => {
    if (
      !GameConstants.MOVE_WITH_MOUSE ||
      this.mostRecentMoveInput === "keyboard" ||
      GameConstants.isMobile
    )
      return;
    const angle = this.mouseAngle();

    // Convert angle to direction
    // atan2 returns angle in radians (-π to π)
    // Divide the circle into 4 sectors for the 4 directions

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      this.player.direction = Direction.RIGHT;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      this.player.direction = Direction.DOWN;
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
      this.player.direction = Direction.UP;
    } else {
      this.player.direction = Direction.LEFT;
    }
  };

  // Dummy methods for mute button functionality
  isPointInMuteButtonBounds(x: number, y: number): boolean {
    const tile = GameConstants.TILESIZE;
    //mute button is at the top left of the screen right below the fps counter and is 1 tile wide and tall
    return x >= 0 && x <= tile && y >= 0 && y <= tile * 1.5;
  }

  handleMuteButtonClick() {
    MuteButton.toggleMute();
    this.player.game.pushMessage(
      Sound.audioMuted ? "Audio muted" : "Audio unmuted",
    );
  }

  isPointInMenuButtonBounds(x: number, y: number): boolean {
    const tile = GameConstants.TILESIZE;
    //menu button is at the top left of the screen right below the fps counter and is 1 tile wide and tall
    return x >= 0 && x <= tile * 1.5 && y >= 0 && y <= tile;
  }

  handleMenuButtonClick() {
    this.player.menu.toggleOpen();
  }
}
