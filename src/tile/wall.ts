import { Direction, Game } from "../game";
import { Room, WallDirection } from "../room/room";
import { Door, DoorDir } from "./door";
import { Tile } from "./tile";
import { WallInfo } from "../room/room";
import { GameConstants } from "../game/gameConstants";

export class Wall extends Tile {
  private tileXOffset: number;
  wallDirections: Array<WallDirection>;
  room: Room;

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
    this.room = room;
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

  isInnerWall = (): boolean => {
    const wallInfo = this.wallInfo();
    return wallInfo?.isInnerWall || false;
  };

  get direction() {
    let directions = [];
    if (this.room.roomArray[this.x - 1][this.y] === null)
      directions.push(Direction.LEFT);
    if (this.room.roomArray[this.x + 1][this.y] === null)
      directions.push(Direction.RIGHT);
    if (this.room.roomArray[this.x][this.y - 1] === null)
      directions.push(Direction.DOWN);
    if (this.room.roomArray[this.x][this.y + 1] === null)
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

  // Returns the door tile directly below this wall if present.
  // Early returns undefined if this wall is not marked as below a door wall.
  getDoor = (): Door | undefined => {
    const info = this.wallInfo();
    if (!info || !info.isBelowDoorWall) return undefined;
    const below = this.room.roomArray[this.x]?.[this.y + 1];
    return below instanceof Door ? (below as Door) : undefined;
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
    const isDrawnFirst = this.getDoor()?.isDrawnFirst();
    if (
      wallInfo.isDoorWall ||
      wallInfo.isBelowDoorWall ||
      (wallInfo.isTopWall && !wallInfo.isLeftWall && !wallInfo.isRightWall) ||
      wallInfo.isInnerWall
    ) {
      if (
        wallInfo.isBelowDoorWall &&
        !isDrawnFirst &&
        GameConstants.SMOOTH_LIGHTING
      )
        return;
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
        this.shadeAmount(), //this.room.softVis[this.x][this.y + 1],
      );
    }

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
    const room = this.room;
    if (!wallInfo || !room) return;
    if (wallInfo.isBottomWall && room.active)
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
        this.shadeAmount(), //this.room.softVis[this.x][this.y + 1],
      );
  };
}
