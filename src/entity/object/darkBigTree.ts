import { BigTree } from "./bigTree";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkBigTree extends BigTree {
  static examineText =
    "A massive dark tree. Its canopy blots out what little light remains.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark big tree";
    this.tileX = 17;
    this.tileY = 15;
    this.imageParticleX = 9;
  }

  draw = (delta: number) => {
    this.tileX = this.health === 2 ? 17 : 19;
    if (this.cloned === true) this.tileX = 19;
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta, -1);
      this.updateDrawXY(delta);
      Game.ctx.save();
      this.updateSeeThroughAlpha(delta);
      if (!this.cloned) Game.ctx.globalAlpha = this.softSeeThroughAlpha;
      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        3,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - 0.85,
        2,
        3,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.ctx.restore();
      Game.drawObj(
        this.tileX,
        18,
        2,
        3,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - 0.85,
        2,
        3,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };
}
