import { Game } from "../game";
import { Collidable } from "./collidable";
import { Level } from "../level";
import { CollidableLayeredTile } from "./collidableLayeredTile";
import { GameConstants } from "../gameConstants";

export class Wall extends CollidableLayeredTile {
  type: number;

  constructor(level: Level, x: number, y: number, type: number) {
    super(level, x, y);
    this.type = type;
  }

  draw = () => {
    if (this.type === 0) Game.drawTile(0, this.level.env, 1, 1, this.x, this.y, 1, 1);
  };

  drawCeiling = () => {
    if (this.level.visibilityArray[this.x][this.y] > 0) {
      if (this.type === 0) {
        Game.drawTile(2, this.level.env, 1, 1, this.x, this.y - 1, 1, 1);
      } else if (this.type === 1) {
        Game.drawTile(5, this.level.env, 1, 1, this.x, this.y - 1, 1, 1);
      }
    } else {
      Game.ctx.fillStyle = "black";
      Game.ctx.fillRect(
        this.x * GameConstants.TILESIZE,
        (this.y - 1) * GameConstants.TILESIZE,
        GameConstants.TILESIZE,
        GameConstants.TILESIZE
      );
    }
  };
}
