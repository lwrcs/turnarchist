import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { MouseCursor } from "./mouseCursor";
import { InputEnum } from "../game/input";

interface ScreenMessageButton {
  text: string;
  onClick: () => void;
  x: number;
  y: number;
  width: number;
  height: number;
  hoverAnim: number;
}

export class ScreenMessage {
  open: boolean = false;
  private lines: string[] = [];
  private buttons: ScreenMessageButton[] = [];
  private selectedButton: number = -1;
  private usingKeyboard: boolean = false;

  private readonly marginX = 24;
  private readonly padX = 10;
  private readonly padY = 8;
  private readonly lineH = Game.letter_height + 4;
  private readonly buttonH = 14;
  private readonly buttonGap = 8;
  private readonly buttonPadX = 12;
  private readonly buttonMarginTop = 10;

  show = (text: string, buttons?: Array<{ text: string; onClick: () => void }>) => {
    this.lines = this.computeLines(text);
    this.buttons = (buttons || []).map(b => ({
      ...b,
      x: 0,
      y: 0,
      width: Math.round(Game.measureText(b.text).width + this.buttonPadX * 2),
      height: this.buttonH,
      hoverAnim: 0,
    }));
    this.selectedButton = this.buttons.length > 0 ? 0 : -1;
    this.usingKeyboard = false;
    this.open = true;
  };

  close = () => {
    this.open = false;
    this.lines = [];
    this.buttons = [];
    this.selectedButton = -1;
  };

  handleMouseDown = (x: number, y: number): void => {
    for (const b of this.buttons) {
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        b.onClick();
        return;
      }
    }
    this.close();
  };

  handleKey = (input: InputEnum): boolean => {
    if (input === InputEnum.EQUALS || input === InputEnum.MINUS) return false;
    if (input === InputEnum.MOUSE_MOVE) { this.usingKeyboard = false; return false; }

    if (this.buttons.length > 0) {
      if (input === InputEnum.LEFT || input === InputEnum.UP) {
        this.selectedButton = Math.max(0, this.selectedButton - 1);
        this.usingKeyboard = true;
        return true;
      }
      if (input === InputEnum.RIGHT || input === InputEnum.DOWN) {
        this.selectedButton = Math.min(this.buttons.length - 1, this.selectedButton + 1);
        this.usingKeyboard = true;
        return true;
      }
      if (input === InputEnum.ENTER || input === InputEnum.SPACE) {
        if (this.selectedButton >= 0 && this.selectedButton < this.buttons.length) {
          this.buttons[this.selectedButton].onClick();
          return true;
        }
      }
      if (input === InputEnum.ESCAPE) {
        this.close();
        return true;
      }
      return true;
    }

    this.close();
    return true;
  };

  private computeLines = (text: string): string[] => {
    const maxWidth = GameConstants.WIDTH - (this.marginX + this.padX) * 2;
    const result: string[] = [];
    for (const paragraph of text.split("\n")) {
      if (paragraph.trim() === "") { result.push(""); continue; }
      const words = paragraph.split(" ");
      let line = "";
      for (const word of words) {
        const test = line === "" ? word : line + " " + word;
        if (Game.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line !== "") result.push(line);
          line = word;
        }
      }
      if (line !== "") result.push(line);
    }
    return result;
  };

  draw = (delta: number) => {
    if (!this.open) return;

    const totalTextH = this.lines.length * this.lineH;
    const buttonAreaH = this.buttons.length > 0
      ? this.buttonMarginTop + this.buttonH + this.padY
      : 0;
    const boxW = GameConstants.WIDTH - this.marginX * 2;
    const boxH = totalTextH + this.padY * 2 + buttonAreaH;
    const boxX = this.marginX;
    const boxY = Math.round((GameConstants.HEIGHT - boxH) / 2);

    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    Game.ctx.fillRect(boxX, boxY, boxW, boxH);

    Game.ctx.fillStyle = "white";
    for (let i = 0; i < this.lines.length; i++) {
      const w = Game.measureText(this.lines[i]).width;
      const x = Math.round(GameConstants.WIDTH / 2 - w / 2);
      const y = boxY + this.padY + i * this.lineH;
      Game.fillText(this.lines[i], x, y);
    }

    if (this.buttons.length > 0) {
      const buttonY = boxY + this.padY + totalTextH + this.buttonMarginTop;
      let totalButtonW = 0;
      for (const b of this.buttons) totalButtonW += b.width;
      totalButtonW += this.buttonGap * (this.buttons.length - 1);
      let bx = Math.round(GameConstants.WIDTH / 2 - totalButtonW / 2);

      const cursor = MouseCursor.getInstance().getPosition();

      // Resolve positions first, then check hover state for all buttons before animating.
      for (const b of this.buttons) {
        b.x = bx;
        b.y = buttonY;
        bx += b.width + this.buttonGap;
      }
      for (let i = 0; i < this.buttons.length; i++) {
        const b = this.buttons[i];

        const hovered = cursor.x >= b.x && cursor.x <= b.x + b.width &&
                        cursor.y >= b.y && cursor.y <= b.y + b.height;
        const active = this.usingKeyboard ? this.selectedButton === i : hovered;
        const target = active ? 1 : 0;
        b.hoverAnim += 0.3 * delta * (target - b.hoverAnim);
        b.hoverAnim = Math.max(0, Math.min(1, b.hoverAnim));

        const growPx = Math.round(3 * b.hoverAnim);
        const rx = b.x - growPx;
        const ry = b.y - growPx;
        const rw = b.width + 2 * growPx;
        const rh = b.height + 2 * growPx;

        Game.ctx.fillStyle = active ? "rgba(75, 75, 75, 0.7)" : "rgba(100, 100, 100, 0.5)";
        Game.ctx.fillRect(rx, ry, rw, rh);

        Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
        const tw = Game.measureText(b.text).width;
        const tx = Math.round(rx + (rw - tw) / 2);
        const ty = Math.round(ry + (rh - Game.letter_height) / 2);
        Game.fillText(b.text, tx, ty);
      }
    }

    Game.ctx.restore();
  };
}
