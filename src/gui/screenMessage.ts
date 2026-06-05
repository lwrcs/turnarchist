import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";

export class ScreenMessage {
  open: boolean = false;
  private lines: string[] = [];

  private readonly marginX = 24;
  private readonly padX = 10;
  private readonly padY = 8;
  private readonly lineH = Game.letter_height + 4;

  show = (text: string) => {
    this.lines = this.computeLines(text);
    this.open = true;
  };

  close = () => {
    this.open = false;
    this.lines = [];
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

  draw = (_delta: number) => {
    if (!this.open) return;

    const totalTextH = this.lines.length * this.lineH;
    const boxW = GameConstants.WIDTH - this.marginX * 2;
    const boxH = totalTextH + this.padY * 2;
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

    Game.ctx.restore();
  };
}
