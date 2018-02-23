import { Collidable } from "./collidable";
import { Level } from "../level";
import { LayeredTile } from "./layeredTile";
import { Game } from "../game";
import { GameConstants } from "../gameConstants";

export class Door extends LayeredTile {
  opened: boolean;
  frame: number;

  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.opened = false;
    this.frame = 0;
  }

  open = () => {
    this.opened = true;
  };

  draw = () => {
    if (this.opened) {
      this.frame += 0.5;
      if (this.frame > 4) this.frame = 4;
    }
    Game.drawTile(1, this.level.env, 1, 1, this.x, this.y, 1, 1);
    Game.drawTile(20 + Math.floor(this.frame), 1, 1, 1, this.x, this.y, 1, 1);
  };

  drawCeiling = () => {
    if (this.level.visibilityArray[this.x][this.y] > 0) {
      Game.drawTile(20 + Math.floor(this.frame), 0, 1, 1, this.x, this.y - 1, 1, 1);
    } else {
      Game.ctx2d.fillStyle = "black";
      Game.ctx2d.fillRect(
        this.x * GameConstants.TILESIZE,
        (this.y - 1) * GameConstants.TILESIZE,
        GameConstants.TILESIZE,
        GameConstants.TILESIZE
      );
    }
    if (this.y === this.level.height - 1 || this.level.visibilityArray[this.x][this.y + 1] === 0) {
      Game.ctx2d.fillStyle = "black";
      Game.ctx2d.fillRect(
        this.x * GameConstants.TILESIZE,
        (this.y + 0.6) * GameConstants.TILESIZE,
        GameConstants.TILESIZE,
        0.4 * GameConstants.TILESIZE
      );
      Game.ctx2d.globalAlpha = 0.5;
      Game.ctx2d.fillRect(
        this.x * GameConstants.TILESIZE,
        (this.y - 0.4) * GameConstants.TILESIZE,
        GameConstants.TILESIZE,
        1.4 * GameConstants.TILESIZE
      );
      Game.ctx2d.globalAlpha = 1;
    }
  };
}
