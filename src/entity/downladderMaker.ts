import { Entity } from "./entity";
import { Room } from "../room/room";
import { Game } from "../game";
import { Heart } from "../item/usable/heart";
import { LevelConstants } from "../level/levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { Shrooms } from "../item/usable/shrooms";
import { EntityType } from "./entity";
import { ImageParticle } from "../particle/imageParticle";
import { Sound } from "../sound/sound";
import { Tile } from "../tile/tile";
import { DownLadder } from "../tile/downLadder";
import { LockType } from "../tile/lockable";
import { EnvType } from "../constants/environmentTypes";

export class DownladderMaker extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;

    if (this.room.level.environment.type === EnvType.DUNGEON)
      this.createDownladder();
    this.name = "DownladderMaker";
    this.dead = true;
  }

  createDownladder = () => {
    const newTile = new DownLadder(
      this.room,
      this.game,
      this.x,
      this.y,
      true,
      2,
      LockType.NONE,
    );
    this.room.roomArray[this.x][this.y] = newTile;
  };

  draw = (delta: number) => {};

  drawTopLayer = (delta: number) => {};
}
