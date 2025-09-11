import { LevelConstants } from "../level/levelConstants";
import { Game } from "../game";
import { guiButton } from "./guiButton";

export class LinkButton extends guiButton {
  constructor({
    text,
    linkUrl,
    x,
    y,
  }: {
    text: string;
    linkUrl: string;
    x: number;
    y: number;
  }) {
    const width = Game.measureText(text).width + 10;
    const height = 16;

    super(
      x,
      y,
      width,
      height,
      text,
      () => window.open(linkUrl, "_blank", "noopener,noreferrer"),
      false,
    );
  }

  draw() {
    Game.ctx.save();
    Game.ctx.imageSmoothingEnabled = false;

    // Draw button background
    Game.ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
    Game.ctx.fillRect(
      Math.round(this.x),
      Math.round(this.y),
      Math.round(this.width),
      Math.round(this.height),
    );

    // Draw button border
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(
      Math.round(this.x),
      Math.round(this.y),
      Math.round(this.width),
      Math.round(this.height),
    );

    // Draw button text
    Game.ctx.fillStyle = "rgba(255, 255, 255, 1)";
    const textWidth = Game.measureText(this.text).width;
    const textX = this.x + (this.width - textWidth) / 2;
    const textY = this.y + this.height / 2 - Game.letter_height / 2;

    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(this.text, Math.round(textX), Math.round(textY));
    Game.ctx.restore();
  }
}
