import { DarkTree } from "./darkTree";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkFirTree extends DarkTree {
  static examineText =
    "A gnarled dark fir tree. Its needles are black as pitch.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark fir tree";
    this.tileX = 4;
    this.tileY = 10;
    this.imageParticleX = 9;
  }

  draw = (delta: number) => {
    if (this.health === 2) {
      this.tileX = 4;
      this.tileY = 10;
    } else {
      this.tileX = 11;
      this.tileY = 8;
    }
    if (this.cloned === true) {
      this.tileX = 11;
      this.tileY = 8;
    }
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta);
      this.updateDrawXY(delta);
      Game.ctx.save();
      this.updateSeeThroughAlpha(delta);
      if (!this.cloned) Game.ctx.globalAlpha = this.softSeeThroughAlpha;
      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        3,
        this.x - this.drawX - 0.5,
        this.y - this.drawYOffset - this.drawY - 1,
        2,
        3,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.ctx.restore();
      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        3,
        this.x - this.drawX - 0.5,
        this.y - this.drawYOffset - this.drawY - 1,
        2,
        3,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };
}
