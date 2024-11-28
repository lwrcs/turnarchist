import { Room } from "../room";
import { Game } from "../game";
import { Tile } from "./tile";

export class CoffinTile extends Tile {
  subTileY: number; // each coffin is 1x2, this is the sub-tile coordinate

  constructor(room: Room, x: number, y: number, subTileY: number) {
    super(room, x, y);
    this.subTileY = subTileY;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    if (this.subTileY === 0) {
      Game.drawTile(
        0,
        5,
        1,
        1,
        this.x - 1,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.drawTile(
        1,
        5,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.drawTile(
        2,
        5,
        1,
        1,
        this.x + 1,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.drawTile(
        0,
        6,
        1,
        1,
        this.x - 1,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.drawTile(
        1,
        6,
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
        2,
        6,
        1,
        1,
        this.x + 1,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    } else {
      Game.drawTile(
        0,
        7,
        1,
        1,
        this.x - 1,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
      Game.drawTile(
        1,
        7,
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
        2,
        7,
        1,
        1,
        this.x + 1,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
  };
}
