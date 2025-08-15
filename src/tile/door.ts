import { Player } from "../player/player";
import { Direction, Game } from "../game";
import { Room } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { EntityType } from "../entity/entity";
import { Key } from "../item/key";
import { Sound } from "../sound/sound";
import { LightSource } from "../lighting/lightSource";
import { GameplaySettings } from "../game/gameplaySettings";
import { Passageway } from "./passageway";

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
  TUNNELDOOR,
}

export class Door extends Passageway {
  globalId: string;
  linkedDoor: Door;
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
  tileXOffset: number;
  tileX: number;
  drawTopOf: boolean;
  alpha: number;

  enteredFrom:
    | Direction.LEFT
    | Direction.RIGHT
    | Direction.DOWN
    | Direction.UP
    | null;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    doorDir: Direction,
    doorType: DoorType,
  ) {
    super(room, game, x, y);
    this.globalId = IdGenerator.generate("D");
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
    this.tileXOffset = 0;
    this.tileX = 2;
    this.drawTopOf = true;
    let lightOffsetX = 0;
    let lightOffsetY = 0;
    this.alpha = 1;
    this.enteredFrom = null;

    switch (this.doorDir) {
      case Direction.UP:
        lightOffsetY = -0.5;
      case Direction.DOWN:
        lightOffsetY = 0.5;
      case Direction.LEFT:
        lightOffsetX = -0.5;
      case Direction.RIGHT:
        lightOffsetX = 0.5;
    }
    this.lightSource = new LightSource(x + 0.5, y + 0.5, 0, [0, 0, 0], 9);
    this.room.lightSources.push(this.lightSource);

    switch (this.type) {
      case DoorType.GUARDEDDOOR:
        if (GameplaySettings.NO_ENEMIES) break;
        this.guard();
        break;
      case DoorType.LOCKEDDOOR:
        this.lock();
        break;
      case DoorType.DOOR:
        this.removeLock();
        break;
      case DoorType.TUNNELDOOR:
        // this.tileX = ? find the right tile for this
        this.locked = true;
        this.iconTileX = 10;
        this.iconXOffset = 1 / 32;
        this.tileXOffset = 12;
        this.drawTopOf = false;
        break;
    }
  }

  shadeAmount = (
    offsetX: number = 0,
    offsetY: number = 0,
    disable: boolean = true,
  ) => {
    if (GameConstants.SMOOTH_LIGHTING && disable) return 0;
    const vis = this.room.softVis[this.x + offsetX][this.y + offsetY];
    if (this.opened) return vis / 2;
    else return vis;
  };

  openTunnelXOffset = () => {
    if (this.type === DoorType.TUNNELDOOR) {
      if (!this.opened) {
        return 0;
      } else {
        return -3;
      }
    }
    return 0;
  };

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
    if (this.type !== DoorType.TUNNELDOOR) this.type = DoorType.DOOR;
    this.locked = false;
  };

  removeLockIcon = () => {
    this.iconYOffset = 0;
    this.unlocking = false;
    this.iconTileX = 2;
    this.iconXOffset = 0;
    this.iconAlpha = 1;
  };

  canUnlock = (player: Player) => {
    if (this.type === DoorType.LOCKEDDOOR) {
      let k = player.inventory.hasItem(Key);
      if (k !== null) {
        if (k.doorID === this.lockable.keyID) {
          this.game.pushMessage("You use the key to unlock the door.");

          return true;
        } else {
          this.game.pushMessage("The key doesn't fit the lock.");
          return false;
        }
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

    if (
      this.type === DoorType.TUNNELDOOR &&
      (!this.opened || !this.linkedDoor.opened)
    ) {
      if (this.linkedDoor === this.room.level.exitRoom.tunnelDoor) {
        this.game.pushMessage("The door refuses to budge from this side.");
        return false;
      } else {
        this.game.pushMessage(
          "You clear the debris, revealing a narrow tunnel.",
        );
        return true;
      }
    }
    return true;
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
    } else if (this.type === DoorType.TUNNELDOOR) {
      this.locked = false;
      this.unlocking = true;
    }
  };

  unGuard = () => {
    if (this.type === DoorType.GUARDEDDOOR) {
      this.removeLock();
      Sound.unlock();

      this.game.tutorialActive = false;
    }
    setTimeout(() => {
      this.removeLockIcon();
    }, 1000);
  };

  link = (other: Door) => {
    this.linkedDoor = other;
  };

  // Returns true if this door's room would be drawn before its linked door's room
  // based on Game.drawRooms sorting (ascending by roomY + height)
  isDrawnFirst = (): boolean => {
    if (!this.linkedDoor || !this.linkedDoor.room) return false;
    try {
      const currentPathId = (this.game as any).currentPathId;
      const roomsInPath = this.game.rooms.filter(
        (r) => (r as any).pathId === currentPathId,
      );
      const sorted = roomsInPath
        .slice()
        .sort((a: any, b: any) => a.roomY + a.height - (b.roomY + b.height));
      const thisIdx = sorted.indexOf(this.room as any);
      const otherIdx = sorted.indexOf(this.linkedDoor.room as any);
      if (thisIdx === -1 || otherIdx === -1) return false;
      return thisIdx < otherIdx;
    } catch {
      return false;
    }
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
      if (this.doorDir === Direction.LEFT) {
        this.enteredFrom = Direction.LEFT;
        this.linkedDoor.enteredFrom = Direction.LEFT;
      }
      if (this.doorDir === Direction.RIGHT) {
        this.enteredFrom = Direction.RIGHT;
        this.linkedDoor.enteredFrom = Direction.RIGHT;
      }
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
    this.removeLockIcon();
  };

  draw = (delta: number) => {
    Game.ctx.save();

    if (this.doorDir === Direction.DOWN) {
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
    }

    if (this.doorDir === Direction.UP) {
      //if top door
      if (this.opened)
        Game.drawTile(
          6 + this.tileXOffset + this.openTunnelXOffset(),
          this.skin,
          1,
          1,
          this.x,
          this.y,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount(0, 1),
        );
      else
        Game.drawTile(
          3 + this.tileXOffset + this.openTunnelXOffset(),
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

    if (
      this.doorDir !== Direction.UP &&
      (this.isDrawnFirst() || !this.opened)
      //!(this.opened && this.doorDir === Direction.RIGHT)
    )
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
      if (!this.drawTopOf) return;
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
          this.shadeAmount(0, 1, false),
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
          this.shadeAmount(0, 1, false),
        );
    }
    Game.ctx.restore();
  };

  drawAbovePlayer = (delta: number) => {};

  drawAboveShading = (delta: number) => {
    //if (this.type === DoorType.TUNNELDOOR) return;
    this.updateFrame(delta);
    Game.ctx.globalAlpha = this.iconAlpha;
    let multiplier = 0.125;
    if (this.unlocking === true) {
      this.iconAlpha *= 0.92 ** delta;
      this.iconYOffset -= 0.035 * delta;
      multiplier = 0;
      if (this.iconAlpha <= 0.01) {
        this.removeLockIcon();
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
      if (this.doorDir === Direction.LEFT || this.doorDir === Direction.RIGHT)
        this.iconYOffset = -0.5;
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
