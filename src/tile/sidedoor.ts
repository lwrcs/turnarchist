import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";

export class SideDoor extends Tile {
  linkedDoor: SideDoor;
  game: Game;
  opened: boolean;

  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, x, y);
    this.game = game;
    this.opened = false;
  }

  link = (other: SideDoor) => {
    this.linkedDoor = other;
  };

  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    this.opened = true;
    this.game.changeLevelThroughDoor(
      player,
      this.linkedDoor,
      this.linkedDoor.level.roomX - this.level.roomX > 0 ? 1 : -1
    );
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
      this.level.shadeColor,
      this.shadeAmount()
    );
  };

  drawAbovePlayer = (delta: number) => { };

  drawAboveShading = (delta: number) => {
    Game.drawFX(2, 2, 1, 1, this.x, this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
  };
}
