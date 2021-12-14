import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";

export class Door extends Tile {
  linkedDoor: BottomDoor;
  game: Game;
  opened: boolean;

  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, x, y);
    this.game = game;
    this.opened = false;
    this.isDoor = true;
  }

  link = (other: BottomDoor) => {
    this.linkedDoor = other;
  };

  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    this.opened = true;
    this.game.changeLevelThroughDoor(player, this.linkedDoor);
  };

  draw = (delta: number) => {
    if (this.opened)
      Game.drawTile(
        6,
        this.skin,
        1,
        1,
        this.x,
        this.y,
        1,
        1,
        this.level.shadeColor,
        this.shadeAmount()
      );
    else
      Game.drawTile(
        3,
        this.skin,
        1,
        1,
        this.x,
        this.y,
        1,
        1,
        this.level.shadeColor,
        this.shadeAmount()
      );
  };

  drawAbovePlayer = (delta: number) => {
    if (!this.opened)
      Game.drawTile(
        13,
        0,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.level.shadeColor,
        this.shadeAmount()
      );
    else
      Game.drawTile(
        14,
        0,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.level.shadeColor,
        this.shadeAmount()
      );
  };

  drawAboveShading = (delta: number) => {
    Game.drawFX(2, 2, 1, 1, this.x, this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
  };
}
