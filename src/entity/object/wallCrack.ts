import { Entity } from "../entity";
import { Room, WallDirection } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Candle } from "../../item/candle";
import { Random } from "../../random";
import { Coin } from "../../item/coin";
import { Sound } from "../../sound";
import { Floor } from "../../tile/floor";
import { Wall } from "../../tile/wall";
import { LevelGenerator } from "../../levelGenerator";
import { DoorDir } from "../../tile/door";

export class WallCrack extends Entity {
  wallDirection: WallDirection;
  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    direction: WallDirection
  ) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 11;
    this.tileY = 0;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "wall crack";
    this.wallDirection = direction;

    let dropProb = Random.rand();
    if (dropProb < 0.025) this.drop = new Heart(this.room, this.x, this.y);
    else this.drop = new Coin(this.room, this.x, this.y);
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    this.dead = true;
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 29);
    this.room.crackWallIntoRoom(this.x, this.y, this.wallDirection);
  };
  killNoBones = () => {
    this.kill();
  };

  drawTopLayer = (delta: number) => {
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

  draw = (delta: number) => {
    this.drawableY = this.y;
  };
}
