import { Room } from "../room/room";
import { Game } from "../game";
import { Tile } from "./tile";

export class FountainTile extends Tile {
  subTileX: number; // each fountain is 3x3, this is the sub-tile coordinate
  subTileY: number;

  constructor(
    room: Room,
    x: number,
    y: number,
    subTileX: number,
    subTileY: number,
  ) {
    super(room, x, y);
    this.subTileX = subTileX;
    this.subTileY = subTileY;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    Game.drawTile(
      1,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
    Game.drawTile(
      this.subTileX,
      2 + this.subTileY,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };
}
