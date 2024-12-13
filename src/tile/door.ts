import { Player } from "../player";
import { Direction, Game } from "../game";
import { Room } from "../room";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { EntityType } from "../entity/entity";
import { Key } from "../item/key";
import { Sound } from "../sound";

export enum DoorDir {
  North = "North",
  East = "East",
  South = "South",
  West = "West",
}

export enum DoorType {
  DOOR,
  LOCKEDDOOR,
  GUARDEDDOOR,
}

export class Door extends Tile {
  linkedDoor: Door;
  game: Game;
  opened: boolean;
  doorDir: Direction;
  guarded: boolean;
  type: DoorType;
  locked: boolean;
  iconTileX: number;
  iconXOffset: number;
  iconYOffset: number;
  unlocking: boolean;
  iconAlpha: number;
  frame: number;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    doorDir: Direction,
    doorType: DoorType,
  ) {
    super(room, x, y);
    this.game = game;
    this.opened = false;
    this.doorDir = doorDir;
    this.locked = false;
    this.isDoor = true;
    this.type = doorType;
    this.iconTileX = 2;
    this.iconXOffset = 0;
    this.iconYOffset = 0;
    this.unlocking = false;
    this.iconAlpha = 1;
    this.frame = 0;
    switch (this.type) {
      case DoorType.GUARDEDDOOR:
        this.guard();
        break;
      case DoorType.LOCKEDDOOR:
        this.lock();
        break;
      case DoorType.DOOR:
        this.removeLock();
        break;
    }
  }

  guard = () => {
    this.type = DoorType.GUARDEDDOOR;
    this.locked = true;
    this.iconTileX = 9;
    this.iconXOffset = 1 / 32;
  };

  lock = () => {
    this.type = DoorType.LOCKEDDOOR;
    this.locked = true;
    this.iconTileX = 10;
    this.iconXOffset = 1 / 32;
  };
  removeLock = () => {
    this.type = DoorType.DOOR;
    this.locked = false;
  };

  removeLockIcon = () => {
    this.iconTileX = 2;
    this.iconAlpha = 1;
  };

  canUnlock = (player: Player) => {
    if (this.type === DoorType.LOCKEDDOOR) {
      let k = player.inventory.hasItem(Key);
      if (k !== null) {
        this.game.pushMessage("You use the key to unlock the door.");
        return true;
      } else
        this.game.pushMessage("The door is locked tightly and won't budge.");
      return false;
    }

    if (this.type === DoorType.GUARDEDDOOR) {
      this.room.checkForNoEnemies();
      this.game.pushMessage(
        "There are still remaining foes guarding this door...",
      );
      return false;
    }
  };
  unlock = (player: Player) => {
    if (this.type === DoorType.LOCKEDDOOR) {
      let k = player.inventory.hasItem(Key);
      if (k !== null) {
        // remove key
        player.inventory.removeItem(k);
        Sound.unlock();
        this.removeLock();
        this.unlocking = true;
      }
    }
  };

  unGuard = () => {
    if (this.type === DoorType.GUARDEDDOOR) {
      this.removeLock();
      this.game.tutorialActive = false;
    }
  };

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  isSolid = (): boolean => {
    if (this.locked) {
      return true;
    } else false;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
    if (!this.opened) {
      Sound.doorOpen();
    }
    this.opened = true;

    this.linkedDoor.opened = true;
    if (this.doorDir === Direction.UP || this.doorDir === Direction.DOWN) {
      this.game.changeLevelThroughDoor(player, this.linkedDoor);
    } else
      this.game.changeLevelThroughDoor(
        player,
        this.linkedDoor,
        this.linkedDoor.room.roomX - this.room.roomX > 0 ? 1 : -1,
      );
    this.linkedDoor.removeLock();
    this.linkedDoor.removeLockIcon();
  };

  draw = (delta: number) => {
    if (this.doorDir === Direction.UP) {
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
          this.room.shadeColor,
          this.shadeAmount(),
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
          this.room.shadeColor,
          this.shadeAmount(),
        );
    }
    if (this.doorDir !== Direction.UP)
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
        this.room.shadeColor,
        this.shadeAmount(),
      );
    //the following used to be in the drawaboveplayer function
    if (this.doorDir === Direction.UP) {
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
          this.room.shadeColor,
          this.shadeAmount(),
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
          this.room.shadeColor,
          this.shadeAmount(),
        );
    }
  };

  drawAbovePlayer = (delta: number) => {};

  drawAboveShading = (delta: number) => {
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
    Game.ctx.globalAlpha = this.iconAlpha;
    let multiplier = 0.125;
    if (this.unlocking == true) {
      this.iconAlpha *= 0.92 ** delta;
      this.iconYOffset -= 0.035 * delta;
      multiplier = 0;
      if (this.iconAlpha <= 0.01) {
        this.iconYOffset = 0;
        this.unlocking = false;
        this.iconTileX = 2;
        this.iconXOffset = 0;
        this.iconAlpha = 1;
      }
    }
    if (this.doorDir === Direction.UP) {
      //if top door
      Game.drawFX(
        this.iconTileX,
        2,
        1,
        1,
        this.x + this.iconXOffset,
        this.y -
          1.25 +
          multiplier * Math.sin((this.frame * Math.PI) / 50) +
          this.iconYOffset,
        1,
        1,
      );
    } else {
      Game.drawFX(
        this.iconTileX,
        2,
        1,
        1,
        this.x + this.iconXOffset,
        this.y -
          1.25 +
          multiplier * Math.sin((this.frame * Math.PI) / 50) +
          this.iconYOffset,
        1,
        1,
      ); //if not top door
    }
    Game.ctx.globalAlpha = 1;
  };
}
