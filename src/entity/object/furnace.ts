import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/usable/shrooms";
import { EntityType } from "../entity";
import { LightSource } from "../../lighting/lightSource";
import { Spellbook } from "../../item/weapon/spellbook";
import { Random } from "../../utility/random";
import { Candle } from "../../item/light/candle";
import { ImageParticle } from "../../particle/imageParticle";
import { Torch } from "../../item/light/torch";

export class Furnace extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 2;
    this.tileY = 4;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "furnace";
    this.drops.push(new Torch(this.room, this.x, this.y));
    this.imageParticleX = 0;
    this.imageParticleY = 25;
    this.bloomColor = "#FFA500";
    this.hasBloom = true;
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      7,
      [200, 30, 1],
      4,
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
