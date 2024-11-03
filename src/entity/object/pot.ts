import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Candle } from "../../item/candle";

export class Pot extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 11;
    this.tileY = 0;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "pot";
    this.drop = new Candle(this.room, this.x, this.y);
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    this.room.items.push(this.drop);
    this.dead = true;
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 29);
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
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
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
