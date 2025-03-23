import { Input, InputEnum } from "../input";
import type { Player } from "./player";
import { Direction, LevelState } from "../game";
import { MouseCursor } from "../mouseCursor";
import { VendingMachine } from "../entity/object/vendingMachine";

export class PlayerInputHandler {
  private player: Player;

  constructor(player: Player) {
    this.player = player;

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
        if (!this.player.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.LEFT,
          });
        break;

      case InputEnum.RIGHT:
        if (!this.player.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.RIGHT,
          });
        break;

      case InputEnum.UP:
        if (!this.player.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.UP,
          });
        break;

      case InputEnum.DOWN:
        if (!this.player.ignoreDirectionInput())
          this.player.actionProcessor.process({
            type: "Move",
            direction: Direction.DOWN,
          });
        break;
      case InputEnum.SPACE:
        const player = this.player;
        player.inventory.mostRecentInput = "keyboard";

        if (player.game.chatOpen) return;

        if (player.dead) {
          player.restart();
          return;
        }

        if (player.openVendingMachine) {
          player.openVendingMachine.space();
          return;
        }

        if (
          player.inventory.isOpen ||
          player.game.levelState === LevelState.IN_LEVEL
        ) {
          player.inventory.space();
        }
        break;
      case InputEnum.COMMA:
        this.player.inventory.mostRecentInput = "keyboard";
        this.player.inventory.left();
        break;
      case InputEnum.PERIOD:
        this.player.inventory.mostRecentInput = "keyboard";
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
        this.player.inventory.mostRecentInput = "mouse";
        this.player.inventory.mouseMove();
        this.player.faceMouse();
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
        this.player.inventory.mostRecentInput = "keyboard";
        this.player.inventory.handleNumKey(input - 13);
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

  handleMouseRightClick() {
    this.player.inventory.mouseRightClick();
  }

  handleMouseLeftClick() {
    const player = this.player;
    const cursor = MouseCursor.getInstance();
    const { x, y } = cursor.getPosition();

    player.inventory.mostRecentInput = "mouse";

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
        inventory.mouseLeftClick();
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
}
