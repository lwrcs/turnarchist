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
    // Only draw the bottom part of the wall if it's not at the bottom edge of the room
    if (this.y < this.room.roomY + this.room.height - 1)
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

    const isTopWall = this.y === this.room.roomY;
    const isBottomWall = this.y === this.room.roomY + this.room.height - 1;
    const isLeftWall = this.x === this.room.roomX;
    const isRightWall = this.x === this.room.roomX + this.room.width - 1;
    const isTopCornerWall = isTopWall && (isLeftWall || isRightWall);
    const isInnerWall =
      !isTopWall && !isBottomWall && !isLeftWall && !isRightWall;
    const isBelowDoorWall =
      this.y < this.room.roomY + this.room.height - 1 &&
      this.room.getTile(this.x, this.y + 1)?.isDoor;

    const useFullOffset =
      isInnerWall || // All inner walls
      isTopWall || // All bottom walls (visually at the bottom)
      isBelowDoorWall || // Walls below doors
      isTopCornerWall; // Top corner walls

    const useHalfOffset =
      isBottomWall || // All bottom walls
      (isLeftWall && !isTopWall) || // All left walls
      (isRightWall && !isTopWall); // All right walls

    const yOffset = useFullOffset ? 1 : useHalfOffset ? 0.5 : 1; // Default to full offset if neither condition is met

    Game.drawTile(
      2,
      this.skin,
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
