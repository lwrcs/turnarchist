import { Game } from "../game";
import { Tile } from "./tile";
import { Room } from "../room";
import { LightSource } from "../lightSource";
import { LevelConstants } from "../levelConstants";

export class WallTorch extends Tile {
  frame: number;
  private tileYOffset: number;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.room.lightSources.push(
      new LightSource(this.x + 0.5, this.y + 0.5, 0.5, LevelConstants.TORCH_LIGHT_COLOR, 1.5)
    );
    this.frame = Math.random() * 12;
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

  draw = (delta: number) => {
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
      this.shadeAmount()
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

    Game.drawFX(Math.floor(this.frame), 32, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
