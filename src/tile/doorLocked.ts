import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { Door } from "./door";
import { DoorDir } from "./door";
import { Key } from "../item/key";

export class DoorLocked extends Door {
  linkedDoor: Door;
  game: Game;
  opened: boolean;
  doorDir: DoorDir;
  locked: boolean;
  guarded: boolean;
  unlockedDoor: Door;

  constructor(level: Level, game: Game, x: number, y: number, dir: number) {
    super(level, game, x, y, dir);
    this.game = game;
    this.opened = false;
    this.locked = true;
    this.doorDir = dir;
  }

  unlock = (player: Player) => {
    let k = player.inventory.hasItem(Key);
    if (k !== null) {
      // remove key
      player.inventory.removeItem(k);
      this.level.levelArray[this.x][this.y] = this.unlockedDoor; // replace this door in level
      this.level.doors.push(this.unlockedDoor); // add it to the door list so it can get rendered on the map
    }
  };

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  isLocked = (): boolean => {
    return this.locked;
  };

  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    if (!this.locked) {
      this.opened = true;
      this.linkedDoor.opened = true;
      if (this.doorDir === DoorDir.North || this.doorDir === DoorDir.South) {
        this.game.changeLevelThroughDoor(player, this.linkedDoor);
      } else
        this.game.changeLevelThroughDoor(
          player,
          this.linkedDoor,
          this.linkedDoor.level.roomX - this.level.roomX > 0 ? 1 : -1
        );
    }
  };

  draw = (delta: number) => {
    if (this.doorDir === DoorDir.North) {
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
    if (this.doorDir !== DoorDir.North)
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
    if (this.doorDir === DoorDir.North) {
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
    if (this.doorDir !== DoorDir.North) {
    }
  };

  drawAboveShading = (delta: number) => {
    if (this.doorDir === DoorDir.North) {
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
