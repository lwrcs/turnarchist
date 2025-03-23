import { Input, InputEnum } from "../input";
import type { Player } from "./player";

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
        this.player.iListener();
        break;
      case InputEnum.Q:
        this.player.qListener();
        break;
      case InputEnum.LEFT:
        if (!this.player.ignoreDirectionInput())
          this.player.leftListener(false);
        break;
      case InputEnum.RIGHT:
        if (!this.player.ignoreDirectionInput())
          this.player.rightListener(false);
        break;
      case InputEnum.UP:
        if (!this.player.ignoreDirectionInput()) this.player.upListener(false);
        break;
      case InputEnum.DOWN:
        if (!this.player.ignoreDirectionInput())
          this.player.downListener(false);
        break;
      case InputEnum.SPACE:
        this.player.spaceListener();
        break;
      case InputEnum.COMMA:
        this.player.commaListener();
        break;
      case InputEnum.PERIOD:
        this.player.periodListener();
        break;
      case InputEnum.LEFT_CLICK:
        this.player.mouseLeftClick();
        break;
      case InputEnum.RIGHT_CLICK:
        this.player.mouseRightClick();
        break;
      case InputEnum.MOUSE_MOVE:
        this.player.mouseMove();
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
        this.player.numKeyListener(input);
        break;
      case InputEnum.EQUALS:
        this.player.plusListener();
        break;
      case InputEnum.MINUS:
        this.player.minusListener();
        break;
      case InputEnum.ESCAPE:
        this.player.escapeListener();
        break;
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
