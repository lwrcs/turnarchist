import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/usable/shrooms";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { GlowStick } from "../../item/light/glowStick";
import { LightSource } from "../../lighting/lightSource";
import { ShroomLight } from "../../item/usable/shroomLight";

export class Glowshrooms extends Entity {
  static itemName = "glowshrooms";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 1;
    this.tileY = 7;
    this.hasShadow = true;
    this.chainPushable = false;
    this.name = Glowshrooms.itemName;
    this.imageParticleX = 0;
    this.imageParticleY = 30;
    this.drops.push(new ShroomLight(this.room, this.x, this.y));
    this.hasBloom = true;
    this.bloomColor = "#054B4B";
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      7,
      [5, 100, 150],
      5,
    );
    this.addLightSource(this.lightSource);
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
