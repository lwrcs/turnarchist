import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";

export class Door extends Tile {
  linkedDoor: Door;
  game: Game;
  opened: boolean;
  doorDir: number;

  constructor(level: Level, game: Game, x: number, y: number, dir: number) {
    super(level, x, y);
    this.game = game;
    this.opened = false;
    this.isDoor = true;
    this.doorDir = dir;
  }

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    this.opened = true;
    if (this.doorDir === 0 || this.doorDir === 2) {
      this.game.changeLevelThroughDoor(player, this.linkedDoor);
    } else
      this.game.changeLevelThroughDoor(
        player,
        this.linkedDoor,
        this.linkedDoor.level.roomX - this.level.roomX > 0 ? 1 : -1
      );
  };

  draw = (delta: number) => {
    if (this.doorDir === 0) {
      //if top door
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
    }
    if (this.doorDir !== 0)
      //if not top door
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

  drawAbovePlayer = (delta: number) => {
    if (this.doorDir === 0) {
      //if top door
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
    }
    if (this.doorDir !== 0) {
    }
  };

  drawAboveShading = (delta: number) => {
    if (this.doorDir === 0) {
      //if top door
      Game.drawFX(
        2,
        2,
        1,
        1,
        this.x,
        this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()),
        1,
        1
      );
    } else {
      Game.drawFX(
        2,
        2,
        1,
        1,
        this.x,
        this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()),
        1,
        1
      ); //if not top door
    }
  };
}
