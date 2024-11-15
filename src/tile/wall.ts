import { WallCrack } from "../entity/object/wallCrack";
import { Game } from "../game";
import { Room } from "../room";
import { Door } from "./door";
import { Tile } from "./tile";

export class Wall extends Tile {
  private tileYOffset: number;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.isDoor = false;
    this.tileYOffset = 6;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };
  isOpaque = (): boolean => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return true;
    return (
      (!wallInfo.isTopWall && !wallInfo.isInnerWall) ||
      wallInfo.isLeftWall ||
      wallInfo.isRightWall
    );
  };

  crack = () => {
    if (this.room.openWalls.topIsOpen) {
      this.newCrack();
    }
    if (this.room.openWalls.bottomIsOpen) {
      this.newCrack();
    }
    if (this.room.openWalls.leftIsOpen) {
      this.newCrack();
    }
    if (this.room.openWalls.rightIsOpen) {
      this.newCrack();
    }
  };

  newCrack = () => {
    this.room.entities.push(
      new WallCrack(this.room, this.room.game, this.x, this.y)
    );
  };

  wallInfo = () => {
    return this.room.wallInfo.get(`${this.x},${this.y}`);
  };

  draw = (delta: number) => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return;

    // Set tileYOffset based on inner wall type
    this.tileYOffset =
      wallInfo.innerWallType === "bottomInner" ||
      wallInfo.innerWallType === "surroundedInner"
        ? 0
        : 6;

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
      this.skin + this.tileYOffset,
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
  drawAboveShading = (delta: number) => {
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) return;
    if (
      wallInfo.isBottomWall ||
      wallInfo.isBelowDoorWall ||
      wallInfo.isAboveDoorWall
    ) {
      Game.drawTile(
        2,
        this.skin + this.tileYOffset,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.room.softVis[this.x][this.y + 1]
      );
    }
  };
}
