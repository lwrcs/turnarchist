import { Game } from "../game";
import { Tile } from "./tile";
import { Room } from "../room/room";
import { LightSource } from "../lighting/lightSource";
import { LevelConstants } from "../level/levelConstants";
import { Wall } from "./wall";
import { Random } from "../utility/random";

export class Window extends Wall {
  frame: number;
  private tileYOffset: number;
  private isBottomWall: boolean;
  //private torchOffset: number;
  lightSource: LightSource;

  constructor(room: Room, x: number, y: number, isBottomWall?: boolean) {
    super(room, x, y);

    this.isBottomWall = isBottomWall;
    //this.torchOffset = isBottomWall ? 1 : 0;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      20,
      [135, 206, 235], //sky blue rgb array,
      3,
    );
    this.room.lightSources.push(this.lightSource);
    //this.frame = Random.rand() * 12;
    //this.tileYOffset = 6;
    this.hasBloom = true;
    this.bloomColor = "#00FFFF"; //cyan
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
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

  draw = (delta: number) => {
    this.drawWall(delta);
    const wallInfo = this.room.wallInfo.get(`${this.x},${this.y}`);
    if (!wallInfo) this.tileYOffset = 6;
    this.frame += 0.3 * delta;
    if (this.frame >= 12) this.frame = 0;

    this.tileYOffset =
      wallInfo?.innerWallType === "bottomInner" ||
      wallInfo?.innerWallType === "surroundedInner"
        ? 0
        : 6;
    if (!this.isBottomWall) {
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
        this.shadeAmount(),
      );
    }

    if (this.isBottomWall) {
      Game.drawTile(
        0,
        this.skin,
        1,
        1,
        this.x,
        this.y - 0.6,
        1,
        1,
        this.room.shadeColor,
        1,
      );
    }
  };
}
