import { Input, InputEnum } from "../input";
import type { Player } from "./player";
import { Direction, LevelState } from "../game";
import { MouseCursor } from "../mouseCursor";
import { VendingMachine } from "../entity/object/vendingMachine";
import { GameConstants } from "../gameConstants";

export class PlayerInputHandler {
  private player: Player;
  private mostRecentInput: string;
  mostRecentMoveInput: string;

  constructor(player: Player) {
    this.player = player;
    this.mostRecentInput = "keyboard";
    this.mostRecentMoveInput = "keyboard";

    if (player.isLocalPlayer) {
      this.setupListeners();
    }
  }

  setupListeners() {
    Input.leftSwipeListener = () => this.handleInput(InputEnum.LEFT);
    Input.rightSwipeListener = () => this.handleInput(InputEnum.RIGHT);
    Input.upSwipeListener = () => this.handleInput(InputEnum.UP);
    Input.downSwipeListener = () => this.handleInput(InputEnum.DOWN);
    Input.commaListener = () => this.handleInput(InputEnum.COMMA);
    Input.periodListener = () => this.handleInput(InputEnum.PERIOD);
    Input.tapListener = () => this.handleTap();
    Input.mouseMoveListener = () => this.handleInput(InputEnum.MOUSE_MOVE);
    Input.mouseLeftClickListeners.push(() =>
      this.handleInput(InputEnum.LEFT_CLICK),
    );
    Input.mouseRightClickListeners.push(() =>
      this.handleInput(InputEnum.RIGHT_CLICK),
    );
    Input.numKeyListener = (num) =>
      this.handleInput(InputEnum.NUMBER_1 + num - 1);
    Input.equalsListener = () => this.handleInput(InputEnum.EQUALS);
    Input.minusListener = () => this.handleInput(InputEnum.MINUS);
    Input.escapeListener = () => this.handleInput(InputEnum.ESCAPE);
  }

  handleInput(input: InputEnum) {
    if (this.player.busyAnimating) return;
    if (this.player.menu.open) {
      this.player.menu.inputHandler(input);
      return;
    }

    if (!this.player.game.started && input !== InputEnum.MOUSE_MOVE) {
      this.player.game.startedFadeOut = true;
      return;
    }

    switch (input) {
      case InputEnum.I:
        this.player.inventory.open();
        break;
      case InputEnum.Q:
        this.player.inventory.drop();
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
        this.mostRecentInput = "keyboard";

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
          this.mostRecentInput = "keyboard";

          player.inventory.itemUse();
        }
        break;
      case InputEnum.COMMA:
        this.mostRecentInput = "keyboard";
        this.player.inventory.left();
        break;
      case InputEnum.PERIOD:
        this.mostRecentInput = "keyboard";
        this.player.inventory.right();
        break;
      case InputEnum.LEFT_CLICK:
        this.handleMouseLeftClick();
        break;
      case InputEnum.RIGHT_CLICK:
        this.handleMouseRightClick();
        break;
      case InputEnum.MOUSE_MOVE:
        //when mouse moves
        this.mostRecentInput = "mouse";
        this.player.inventory.mouseMove();
        this.faceMouse();
        this.player.setTileCursorPosition();
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
        this.mostRecentInput = "keyboard";
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
    this.mostRecentInput = "keyboard";
    if (num <= 5) {
      this.player.inventory.selX = Math.max(
        0,
        Math.min(num - 1, this.player.inventory.cols - 1),
      );
      this.player.inventory.selY = 0;
      this.player.inventory.itemUse();
    } else {
      if (GameConstants.DEVELOPER_MODE) {
        switch (num) {
          case 6:
            GameConstants.SET_COLOR_LAYER_COMPOSITE_OPERATION(false, true);
            break;
          case 7:
            GameConstants.SET_COLOR_LAYER_COMPOSITE_OPERATION(false);
            break;
        }
      }
      {
        switch (num) {
          case 8:
            GameConstants.BLUR_ENABLED = !GameConstants.BLUR_ENABLED;
            break;
        }
      }
    }
  };

  handleMouseRightClick() {
    this.mostRecentInput = "mouse";
    const { x, y } = MouseCursor.getInstance().getPosition();
    const bounds = this.player.inventory.isPointInInventoryBounds(x, y);

    if (bounds.inBounds) {
      this.player.inventory.drop();
    }
  }

  handleMouseLeftClick() {
    const player = this.player;
    const cursor = MouseCursor.getInstance();
    const { x, y } = cursor.getPosition();
    if (player.game.levelState !== LevelState.IN_LEVEL) return;

    this.mostRecentInput = "mouse";

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
        this.mostRecentInput = "mouse";
        const { x, y } = MouseCursor.getInstance().getPosition();
        const bounds = this.player.inventory.isPointInInventoryBounds(x, y);
      }
      return;
    }

    const notInInventoryUI =
      !inventory.isPointInInventoryButton(x, y) &&
      !inventory.isPointInQuickbarBounds(x, y).inBounds &&
      !inventory.isOpen;

    if (notInInventoryUI) {
      player.moveWithMouse();
    }
  }

  ignoreDirectionInput = (): boolean => {
    return (
      this.player.inventory.isOpen ||
      this.player.dead ||
      this.player.game.levelState !== LevelState.IN_LEVEL ||
      (this.player.inventory.isPointInQuickbarBounds(Input.mouseX, Input.mouseY)
        .inBounds &&
        this.player.game.isMobile)
    );
  };

  handleTap() {
    if (this.player.dead) {
      this.player.restart();
      return;
    } else if (!this.player.game.started) {
      this.player.game.startedFadeOut = true;
      return;
    }

    const x = Input.mouseX;
    const y = Input.mouseY;

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
        this.mostRecentInput = "mouse";
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
      this.mostRecentMoveInput === "keyboard"
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
}
