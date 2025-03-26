import { Room } from "../room/room";
import { Game } from "../game";
import { Tile } from "./tile";

export class Chasm extends Tile {
  tileX: number;
  tileY: number;
  topEdge: boolean;

  constructor(
    room: Room,
    x: number,
    y: number,
    leftEdge: boolean,
    rightEdge: boolean,
    topEdge: boolean,
    bottomEdge: boolean,
  ) {
    super(room, x, y);

    this.tileX = this.skin === 1 ? 24 : 20;
    this.tileY = 1;

    if (leftEdge) this.tileX--;
    else if (rightEdge) this.tileX++;
    if (topEdge) this.tileY--;
    else if (bottomEdge) this.tileY++;

    this.topEdge = topEdge;
  }

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    if (this.topEdge)
      Game.drawTile(
        22,
        0,
        1,
        2,
        this.x,
        this.y,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    Game.drawTile(
      this.tileX,
      this.tileY,
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
