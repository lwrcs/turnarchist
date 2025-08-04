import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Sound } from "../../sound/sound";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
export class Block extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 10;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
    //this.pushable = true;
    this.name = "block";
    this.imageParticleX = 0;
    this.imageParticleY = 25;
    this.opaque = true;
    //this.hitSound = Sound.breakRock;
    if (Random.rand() < 0.01)
      this.drops.push(new Geode(this.room, this.x, this.y));
  }

  get type() {
    return EntityType.PROP;
  }

  uniqueKillBehavior = () => {
    if (this.cloned) return;
    Sound.delayPlay(Sound.breakRock, 50);
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
