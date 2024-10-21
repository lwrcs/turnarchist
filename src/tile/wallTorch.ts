import { Game } from "../game";
import { Tile } from "./tile";
import { Room } from "../room";
import { LightSource } from "../lightSource";

export class WallTorch extends Tile {
  frame: number;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.room.lightSources.push(new LightSource(this.x + 0.5, this.y + 0.5, 3));
    this.frame = Math.random() * 12;
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
    this.frame += 0.3 * delta;
    if (this.frame >= 12) this.frame = 0;

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

    Game.drawFX(Math.floor(this.frame), 32, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
