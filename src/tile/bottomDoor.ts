import { Game } from "../game";
import { Level } from "../level";
import { Door } from "./door";
import { Player } from "../player";
import { GameConstants } from "../gameConstants";
import { Tile } from "./tile";

export class BottomDoor extends Tile {
  linkedDoor: Door;
  game: Game;

  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, x, y);
    this.game = game;
    this.isDoor = true;
  }

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    this.game.changeLevelThroughDoor(player, this.linkedDoor);
  };

  drawAbovePlayer = (delta: number) => {
    /*Game.drawTile(
      14,
      0,
      1,
      1,
      this.x,
      this.y - 1,
      1,
      1,
      "black",
      this.level.softVis[this.x][this.y - 1]
    ); */
  };

  drawAboveShading = (delta: number) => {
    Game.drawFX(2, 2, 1, 1, this.x, this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
  };
}
