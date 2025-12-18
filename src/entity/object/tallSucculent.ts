import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/usable/shrooms";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Random } from "../../utility/random";

export class TallSucculent extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 13;
    this.tileY = 12;
    this.hasShadow = true;
    this.chainPushable = false;
    this.name = "tall succulent";
    this.imageParticleX = 0;
    this.imageParticleY = 28;
    this.drawYOffset = 2.175;
    this.frame = Math.floor(Random.rand() * 8);
    //this.drops.push(new Shrooms(this.room, this.x, this.y));
  }

  get type() {
    return EntityType.PROP;
  }

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta);
      this.updateDrawXY(delta);
      this.frame += delta * 0.075;
      if (this.frame > 8) this.frame = 0;
      Game.drawObj(
        this.tileX + Math.floor(this.frame),
        this.tileY,
        1,
        3,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        3,
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
