import { Tree } from "./tree";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkTree extends Tree {
  static examineText = "A twisted dark tree. Ancient and foreboding.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark tree";
    this.tileX = 9;
    this.tileY = 8;
    this.imageParticleX = 9;
  }

  draw = (delta: number) => {
    this.tileX = this.health === 2 ? 9 : 11;
    if (this.cloned === true) this.tileX = 11;
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
        11,
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
