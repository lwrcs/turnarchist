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
  // Dialog box rect captured by draw() — used by handleMouseDown to decide whether
  // a tap that missed every button should dismiss the prompt or be ignored. Tapping
  // inside the dialog (just missed the button) should NOT close; tapping outside
  // closes for messages without buttons or as an explicit dismiss for prompts.
  private boxX = 0;
  private boxY = 0;
  private boxW = 0;
  private boxH = 0;

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
    // Pre-compute layout so handleMouseDown works even before the first draw —
    // otherwise a fast tap immediately after show() hits buttons whose x/y are
    // still at their init value of 0.
    this.layout();
  };

  close = () => {
    this.open = false;
    this.lines = [];
    this.buttons = [];
    this.selectedButton = -1;
  };

  handleMouseDown = (x: number, y: number): void => {
    // Make sure button rects are current. layout() is cheap and idempotent —
    // safer than relying on the most recent draw() having run.
    this.layout();

    for (const b of this.buttons) {
      if (
        x >= b.x &&
        x <= b.x + b.width &&
        y >= b.y &&
        y <= b.y + b.height
      ) {
        b.onClick();
        return;
      }
    }

    // Don't dismiss on a near-miss inside the dialog — only on a tap clearly
    // outside the box. For prompts without buttons (plain examine text), any
    // tap still closes since the whole point is tap-to-dismiss.
    if (this.buttons.length === 0) {
      this.close();
      return;
    }
    const insideBox =
      x >= this.boxX &&
      x <= this.boxX + this.boxW &&
      y >= this.boxY &&
      y <= this.boxY + this.boxH;
    if (!insideBox) {
      this.close();
    }
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

  // Pure layout: compute boxX/Y/W/H and each button's x/y. Has no rendering side
  // effects, so it can be called from show() (so tap handling works before the
  // first draw) and from handleMouseDown (so a hit-test never reads stale rects).
  private layout = () => {
    const totalTextH = this.lines.length * this.lineH;
    const buttonAreaH = this.buttons.length > 0
      ? this.buttonMarginTop + this.buttonH + this.padY
      : 0;
    this.boxW = GameConstants.WIDTH - this.marginX * 2;
    this.boxH = totalTextH + this.padY * 2 + buttonAreaH;
    this.boxX = this.marginX;
    this.boxY = Math.round((GameConstants.HEIGHT - this.boxH) / 2);

    if (this.buttons.length > 0) {
      const buttonY = this.boxY + this.padY + totalTextH + this.buttonMarginTop;
      let totalButtonW = 0;
      for (const b of this.buttons) totalButtonW += b.width;
      totalButtonW += this.buttonGap * (this.buttons.length - 1);
      let bx = Math.round(GameConstants.WIDTH / 2 - totalButtonW / 2);
      for (const b of this.buttons) {
        b.x = bx;
        b.y = buttonY;
        bx += b.width + this.buttonGap;
      }
    }
  };

  draw = (delta: number) => {
    if (!this.open) return;

    this.layout();
    const totalTextH = this.lines.length * this.lineH;
    const boxX = this.boxX;
    const boxY = this.boxY;
    const boxW = this.boxW;
    const boxH = this.boxH;

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
      const cursor = MouseCursor.getInstance().getPosition();

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
