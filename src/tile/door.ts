import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { EntityType } from "../enemy/enemy";
import { Key } from "../item/key";

export enum DoorDir {
  North,
  East,
  South,
  West,
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
  doorDir: DoorDir;
  guarded: boolean;
  DoorType: DoorType;
  locked: boolean;

  constructor(
    level: Level,
    game: Game,
    x: number,
    y: number,
    dir: number,
    doorType: DoorType
  ) {
    super(level, x, y);
    this.game = game;
    this.opened = false;
    this.doorDir = dir;
    this.DoorType = doorType;
    this.locked = false;

    if (this.DoorType === DoorType.GUARDEDDOOR) {
      this.locked = true;
    }
    if (this.DoorType === DoorType.LOCKEDDOOR) {
      this.locked = true;
    }
  }
  canUnlock = (player: Player) => {
    if (this.DoorType === DoorType.LOCKEDDOOR) {
      let k = player.inventory.hasItem(Key);
      if (k !== null) {
        this.game.pushMessage("You use the key to unlock the door.");
        return true;
      } else
        this.game.pushMessage("The door is locked tightly and won't budge.");
      return false;
    }

    if (this.DoorType === DoorType.GUARDEDDOOR) {
      const inRoom = this.game.level.enemies.filter(
        (enemy) => enemy.entityType === EntityType.Enemy
      );
      if (inRoom.length === 0) {
        this.game.pushMessage(
          "The foes have been slain and the door allows you passage."
        );
        return true;
      } else
        this.game.pushMessage(
          "There are still remaining foes guarding this door..."
        );

      return false;
    }
  };
  unlock = (player: Player) => {
    if (this.DoorType === DoorType.LOCKEDDOOR) {
      let k = player.inventory.hasItem(Key);
      if (k !== null) {
        // remove key
        player.inventory.removeItem(k);
        this.locked = false;
        this.DoorType = DoorType.DOOR;
      }
    }
    if (this.DoorType === DoorType.GUARDEDDOOR) {
      this.locked = false;
      for (let door of this.level.doors) {
        door.DoorType = DoorType.DOOR;
      }
    } else {
    }
  };

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  isSolid = (): boolean => {
    console.log(this.DoorType);
    if (this.locked) {
      return true;
    } else false;
  };
  canCrushEnemy = (): boolean => {
    return true;
  };

  onCollide = (player: Player) => {
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
    this.linkedDoor.locked = false;
    this.linkedDoor.DoorType = DoorType.DOOR;
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
    let icon = 2;
    let xOffset = 0;
    if (this.DoorType === DoorType.GUARDEDDOOR) (icon = 9), (xOffset = 1 / 32);
    if (this.DoorType === DoorType.LOCKEDDOOR) (icon = 10), (xOffset = 1 / 32);

    if (this.doorDir === DoorDir.North) {
      //if top door
      Game.drawFX(
        icon,
        2,
        1,
        1,
        this.x + xOffset,
        this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()),
        1,
        1
      );
    } else {
      Game.drawFX(
        icon,
        2,
        1,
        1,
        this.x + xOffset,
        this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()),
        1,
        1
      ); //if not top door
    }
  };
}
