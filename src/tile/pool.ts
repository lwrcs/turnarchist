import { Room } from "../room/room";
import { Game } from "../game";
import { Tile } from "./tile";
import { FishingSpot } from "../entity/object/fishingSpot";

export class Pool extends Tile {
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

    this.tileX = 20;
    this.tileY = 4;

    if (leftEdge) this.tileX--;
    else if (rightEdge) this.tileX++;
    if (topEdge) this.tileY--;
    else if (bottomEdge) this.tileY++;

    this.topEdge = topEdge;
    if (rightEdge || leftEdge || topEdge || bottomEdge) {
      this.room.entities.push(
        new FishingSpot(this.room, this.room.game, this.x, this.y),
      );
    }
  }

  interact = (): void => {
    this.room.game.pushMessage("You jump into the pool.");
  };

  isSolid = (): boolean => {
    return true;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  draw = (delta: number) => {
    Game.drawTile(
      1,
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
    if (this.topEdge)
      Game.drawTile(
        22,
        3,
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
