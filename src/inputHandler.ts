import { Input, InputEnum } from "./input";
import { Player } from "./player";
import { MouseCursor } from "./mouseCursor";
import { GameConstants } from "./gameConstants";

export class InputHandler {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
    this.registerListeners();
    this.overrideKeyDownListener();
  }

  private registerListeners() {
    Input.mouseLeftClickListeners.push(this.mouseLeftClick);
    Input.mouseRightClickListeners.push(this.mouseRightClick);
    Input.mouseMoveListeners.push(this.mouseMove);
  }

  private overrideKeyDownListener() {
    const originalKeyDownListener = Input.keyDownListener.bind(Input);
    Input.keyDownListener = (key: string) => {
      const inputEnum = this.mapKeyToInputEnum(key);
      if (inputEnum !== null) {
        this.handleKeyboardInput(inputEnum);
      }
      originalKeyDownListener(key);
    };
  }

  private mapKeyToInputEnum(key: string): InputEnum | null {
    switch (key.toLowerCase()) {
      case "i":
        return InputEnum.I;
      case "q":
        return InputEnum.Q;
      case "a":
        return InputEnum.NUMBER_1; // Example mapping
      case "d":
        return InputEnum.NUMBER_2; // Example mapping
      case "w":
        return InputEnum.UP;
      case "s":
        return InputEnum.DOWN;
      case " ":
        return InputEnum.SPACE;
      case ",":
        return InputEnum.COMMA;
      case ".":
        return InputEnum.PERIOD;
      case "arrowleft":
        return InputEnum.LEFT;
      case "arrowright":
        return InputEnum.RIGHT;
      case "arrowup":
        return InputEnum.UP;
      case "arrowdown":
        return InputEnum.DOWN;
      case "1":
        return InputEnum.NUMBER_1;
      case "2":
        return InputEnum.NUMBER_2;
      case "3":
        return InputEnum.NUMBER_3;
      case "4":
        return InputEnum.NUMBER_4;
      case "5":
        return InputEnum.NUMBER_5;
      case "6":
        return InputEnum.NUMBER_6;
      case "7":
        return InputEnum.NUMBER_7;
      case "8":
        return InputEnum.NUMBER_8;
      case "9":
        return InputEnum.NUMBER_9;
      default:
        return null;
    }
  }

  private handleKeyboardInput(input: InputEnum) {
    switch (input) {
      case InputEnum.I:
        this.player.inventory.open();
        break;
      case InputEnum.Q:
        if (this.player.inventory.isOpen) {
          this.player.inventory.drop();
        }
        break;
      case InputEnum.LEFT:
      case InputEnum.NUMBER_1:
        if (this.player.inventory.isOpen) {
          this.player.inventory.left();
        } else {
          this.player.leftListener(false);
        }
        break;
      case InputEnum.RIGHT:
      case InputEnum.NUMBER_2:
        if (this.player.inventory.isOpen) {
          this.player.inventory.right();
        } else {
          this.player.rightListener(false);
        }
        break;
      case InputEnum.UP:
      case InputEnum.NUMBER_3:
        if (this.player.inventory.isOpen) {
          this.player.inventory.up();
        } else {
          this.player.upListener(false);
        }
        break;
      case InputEnum.DOWN:
      case InputEnum.NUMBER_4:
        if (this.player.inventory.isOpen) {
          this.player.inventory.down();
        } else {
          this.player.downListener(false);
        }
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
      case InputEnum.NUMBER_5:
      case InputEnum.NUMBER_6:
      case InputEnum.NUMBER_7:
      case InputEnum.NUMBER_8:
      case InputEnum.NUMBER_9:
        this.player.inventory.handleNumKey(input - InputEnum.NUMBER_1 + 1);
        break;
      default:
        break;
    }
  }

  private mouseLeftClick = () => {
    if (this.player.dead) {
      this.player.restart();
    } else {
      this.player.inventory.mouseLeftClick();
    }

    const { x, y } = MouseCursor.getInstance().getPosition();
    if (
      !this.player.inventory.isOpen &&
      !this.player.inventory.isPointInInventoryButton(x, y) &&
      !this.player.inventory.isPointInQuickbarBounds(x, y).inBounds
    ) {
      this.player.moveWithMouse();
    } else if (this.player.inventory.isPointInInventoryButton(x, y)) {
      this.player.inventory.open();
    }
  };

  private mouseRightClick = () => {
    this.player.inventory.mouseRightClick();
  };

  private mouseMove = () => {
    this.player.inventory.mouseMove();
    this.player.setTileCursorPosition();
  };
}
