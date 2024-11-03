import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";

export class Barrel extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 1;
    this.tileY = 0;
    this.hasShadow = false;
    this.pushable = true;
    this.name = "barrel";
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 3, 25);

    this.dead = true;
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
    if (!this.dead) {
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

    this.updateDrawXY(delta);
  };
}
