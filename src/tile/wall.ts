import { Direction, Game } from "../game";
import { Room, WallDirection } from "../room";
import { Door, DoorDir } from "./door";
import { Tile } from "./tile";
import { WallInfo } from "../room";
import { Player } from "../player";

export class Wall extends Tile {
  private tileXOffset: number;
  wallDirections: Array<WallDirection>;

  constructor(
    room: Room,
    x: number,
    y: number,
    wallDirections?: Array<WallDirection>,
  ) {
    super(room, x, y);
    this.isDoor = false;
    this.tileXOffset = 6;
    this.wallDirections = wallDirections || [];
    this.opacity = 1;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };
  isOpaque = (): boolean => {
    const wallInfo = this.wallInfo();
    if (!wallInfo) return false;
    return (
      (!wallInfo.isTopWall && !wallInfo.isInnerWall) ||
      wallInfo.isLeftWall ||
      wallInfo.isRightWall
    );
  };

  get direction() {
    let directions = [];
    if (this.room.roomArray[this.x - 1][this.y] == null)
      directions.push(Direction.LEFT);
    if (this.room.roomArray[this.x + 1][this.y] == null)
      directions.push(Direction.RIGHT);
    if (this.room.roomArray[this.x][this.y - 1] == null)
      directions.push(Direction.DOWN);
    if (this.room.roomArray[this.x][this.y + 1] == null)
      directions.push(Direction.UP);
    if (directions.length == 1) return directions[0];
    if (
      directions.includes(Direction.UP) &&
      directions.includes(Direction.LEFT)
    ) {
      this.opacity = 0.5;
      return Direction.UP_LEFT;
    }
    if (
      directions.includes(Direction.UP) &&
      directions.includes(Direction.RIGHT)
    ) {
      this.opacity = 0.5;
      return Direction.UP_RIGHT;
    }
    if (
      directions.includes(Direction.DOWN) &&
      directions.includes(Direction.LEFT)
    ) {
      this.opacity = 0.5;
      return Direction.DOWN_LEFT;
    }
    return Direction.DOWN_RIGHT;
  }

  wallInfo = () => {
    return this.room.wallInfo.get(`${this.x},${this.y}`);
  };

  draw = (delta: number) => {
    this.drawWall(delta);
  };

  drawWall = (delta: number) => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return;

    // Set tileYOffset based on inner wall type
    this.tileXOffset =
      wallInfo.innerWallType === "bottomInner" ||
      wallInfo.innerWallType === "surroundedInner"
        ? 0
        : 26;

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
        this.room.softVis[this.x][this.y + 1],
      );

    Game.drawTile(
      2 + this.tileXOffset,
      this.skin,
      1,
      1,
      this.x,
      this.y - 1,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };

  drawTopLayer = (delta: number) => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return;
    if (
      wallInfo.isBottomWall ||
      wallInfo.isBelowDoorWall ||
      wallInfo.isAboveDoorWall
    ) {
      Game.drawTile(
        2 + this.tileXOffset,
        this.skin,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.room.softVis[this.x][this.y + 1],
      );
    }
  };
}
