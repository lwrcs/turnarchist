import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/usable/shrooms";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Apple } from "../../item/usable/apple";
import { Sound } from "../../sound/sound";

export class Tree extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 2;
    this.maxHealth = 2;

    this.tileX = 14;
    this.tileY = 6;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "tree";
    this.imageParticleX = 0;
    this.imageParticleY = 28;
    this.opaque = true;
    this.hitSound = Sound.playBush;
    if (Math.random() < 0.5)
      this.drops.push(new Apple(this.room, this.x, this.y));
    //this.drawableY = 0.1;
    //this.drops.push(new Shrooms(this.room, this.x, this.y));
  }

  get type() {
    return EntityType.PROP;
  }
  uniqueKillBehavior = () => {
    if (this.cloned) return;
    Sound.playWood();
  };

  draw = (delta: number) => {
    this.tileX = this.health === 2 ? 14 : 16;
    if (this.cloned === true) this.tileX = 16;
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
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

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
