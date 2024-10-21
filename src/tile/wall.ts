import { Game } from "../game";
import { Room } from "../room";
import { Door } from "./door";
import { Tile } from "./tile";

export class Wall extends Tile {
  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.isDoor = false;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };
  isOpaque = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return;

    // Only draw the bottom part of the wall if it's not at the bottom edge of the room
    if (
      wallInfo.isDoorWall ||
      wallInfo.isBelowDoorWall ||
      (wallInfo.isTopWall && !wallInfo.isLeftWall && !wallInfo.isRightWall) ||
      wallInfo.isInnerWall
    )
      Game.drawTile(
        0,
        this.skin,
        1,
        1,
        this.x,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.room.softVis[this.x][this.y + 1]
      );

    Game.drawTile(
      2,
      this.skin + 6,
      1,
      1,
      this.x,
      this.y - 1,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount()
    );
  };
}
