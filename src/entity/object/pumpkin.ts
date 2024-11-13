import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Shrooms } from "../../item/shrooms";
import { EntityType } from "../entity";
import { LightSource } from "../../lightSource";
import { Spellbook } from "../../weapon/spellbook";
import { Random } from "../../random";
import { Candle } from "../../item/candle";
import { ImageParticle } from "../../particle/imageParticle";

export class Pumpkin extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 15;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "pumpkin";
    this.drop = new Candle(this.room, this.x, this.y);
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      1,
      [200, 30, 1],
      0.5
    );
    this.addLightSource(this.lightSource);
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    this.removeLightSource(this.lightSource);
    this.dead = true;
    this.dropLoot();
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 25);

    //this.room.items.push(new Shrooms(this.room, this.x, this.y));
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
