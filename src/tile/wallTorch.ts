import { Game } from "../game";
import { Tile } from "./tile";
import { Room } from "../room/room";
import { LightSource } from "../lightSource";
import { LevelConstants } from "../levelConstants";
import { Wall } from "./wall";

export class WallTorch extends Wall {
  frame: number;
  private tileYOffset: number;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.room.lightSources.push(
      new LightSource(
        this.x + 0.5,
        this.y + 0.5,
        5,
        LevelConstants.TORCH_LIGHT_COLOR,
        1.5,
      ),
    );
    this.frame = Math.random() * 12;
    this.tileYOffset = 6;
    this.hasBloom = true;
    this.bloomColor = "#FFA500";
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
      wallInfo.innerWallType === "bottomInner" ||
      wallInfo.innerWallType === "surroundedInner"
        ? 0
        : 6;

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

    Game.drawFX(Math.floor(this.frame), 32, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
