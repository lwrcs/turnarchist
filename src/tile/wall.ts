import { Game } from "../game";
import { Tile } from "./tile";

export class Wall extends Tile {
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

    Game.drawTile(
      2,
      this.skin,
      1,
      1,
      this.x,
      this.y - 0.5,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount()
    );
  };
}
