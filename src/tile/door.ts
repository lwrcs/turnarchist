import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
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
  Door,
  LockedDoor,
  GuardedDoor,
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

      switch (this.DoorType) {
        case DoorType.Door:
        case DoorType.LockedDoor:
          this.locked = true;
        case DoorType.GuardedDoor:
          this.locked = true;
    }
  }
  getDoorType = () => {
    return this.DoorType;
  };
  unlock = (player: Player) => {
    switch (this.DoorType) {
      case DoorType.Door: {}
      case DoorType.LockedDoor: {
        let k = player.inventory.hasItem(Key);
        if (k !== null) {
          // remove key
          player.inventory.removeItem(k);
        }
      }
      case DoorType.GuardedDoor: {
        const inRoom = this.game.level.enemies.filter(
          (enemy) => enemy.entityType === EntityType.Enemy
        );
        console.log(inRoom);
        if (inRoom.length === 0) this.locked = false;
      }
    }
  };

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  isSolid = (): boolean => {
    console.log(this.DoorType)
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
      this.locked = false;
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
