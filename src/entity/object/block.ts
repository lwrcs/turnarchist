import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";

export class Block extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 10;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "block";
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    this.dead = true;

    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 29);
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
      Game.drawObj(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
