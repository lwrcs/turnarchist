import { Player } from "../player/player";
import { Game } from "../game";
import { Key } from "../item/key";
import { Sound } from "../sound/sound";
import { Door } from "./door";
import { DownLadder } from "./downLadder";
import { UpLadder } from "./upLadder";
import { Random } from "../utility/random";
import { GameConstants } from "../game/gameConstants";

export enum LockType {
  NONE = 0,
  LOCKED = 1,
  GUARDED = 2,
  TUNNEL = 3,
}

export interface LockableConfig {
  lockType: LockType;
  keyID?: number;
  iconTileX?: number;
  iconXOffset?: number;
  isTopDoor?: boolean;
}

export class Lockable {
  private locked: boolean = false;
  private unlocking: boolean = false;
  private iconAlpha: number = 1;
  private iconYOffset: number = 0;
  private frame: number = 0;
  private lockType: LockType;
  keyID: number = 0;
  private iconTileX: number;
  private iconXOffset: number;
  private isTopDoor: boolean;
  private game: Game;

  constructor(game: Game, config: LockableConfig) {
    this.game = game;
    this.lockType = config.lockType;
    this.keyID = config.keyID || 0;
    this.iconTileX = config.iconTileX || 2;
    this.iconXOffset = config.iconXOffset || 0;
    this.isTopDoor = config.isTopDoor || false;

    this.initializeLockState();
  }

  private initializeLockState() {
    switch (this.lockType) {
      case LockType.LOCKED:
        this.lock();
        break;
      case LockType.GUARDED:
        this.guard();
        break;
      case LockType.TUNNEL:
        this.lock();
        this.iconTileX = 10;
        this.iconXOffset = 1 / 32;
        break;
      case LockType.NONE:
        this.removeLock();
        break;
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  isUnlocking(): boolean {
    return this.unlocking;
  }

  lock() {
    this.locked = true;
    this.iconTileX = 10;
    this.iconXOffset = 1 / 32;
  }

  guard() {
    this.lockType = LockType.GUARDED;
    this.locked = true;
    this.iconTileX = 9;
    this.iconXOffset = 1 / 32;
  }

  removeLock() {
    this.lockType = LockType.NONE;
    this.locked = false;
  }

  removeLockIcon() {
    this.iconYOffset = 0;
    this.unlocking = false;
    this.iconTileX = 2;
    this.iconXOffset = 0;
    this.iconAlpha = 1;
  }

  canUnlock(player: Player): boolean {
    if (GameConstants.DEVELOPER_MODE) return true;
    if (this.lockType === LockType.LOCKED) {
      const key = this.hasKeyWithID(this.keyID, player);
      console.log(this.keyID);
      if (key !== null) {
        this.game.pushMessage("You use the key to unlock.");
        console.log("key.doorID", key.doorID, "lock.keyID", this.keyID);
        return true;
      }

      // If no matching key, check if player has any key at all
      const hasAnyKey = player.inventory.hasItem(Key);
      if (hasAnyKey) {
        this.game.pushMessage("The key doesn't fit the lock.");
      } else {
        this.game.pushMessage("It's locked tightly and won't budge.");
      }
      return false;
    }

    if (this.lockType === LockType.GUARDED) {
      // Check if room has no enemies - access through game.room
      const hasEnemies = this.game.room.entities.some(
        (entity) => entity.constructor.name.includes("Enemy") && !entity.dead,
      );
      if (hasEnemies) {
        this.game.pushMessage(
          "There are still remaining foes guarding this...",
        );
        return false;
      }
    }

    return true;
  }

  unlock(player: Player) {
    if (this.lockType === LockType.LOCKED) {
      const key = this.hasKeyWithID(this.keyID, player);
      if (key !== null || GameConstants.DEVELOPER_MODE) {
        player.inventory.removeItem(key);
        Sound.unlock();
        this.removeLock();
        this.unlocking = true;
      }
    } else if (this.lockType === LockType.TUNNEL) {
      this.locked = false;
      this.unlocking = true;
    }
  }

  hasKeyWithID(keyID: number, player: Player) {
    const inventory = player.inventory;
    for (const item of inventory.items) {
      if (item instanceof Key) {
        if (item.doorID === keyID) {
          return item;
        }
      }
    }
    return null;
  }

  unGuard() {
    if (this.lockType === LockType.GUARDED) {
      this.removeLock();
      Sound.unlock();
      this.game.tutorialActive = false;
    }
    setTimeout(() => {
      this.removeLockIcon();
    }, 1000);
  }

  update(delta: number) {
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
  }

  drawIcon(x: number, y: number, delta: number) {
    Game.ctx.globalAlpha = this.iconAlpha;

    let multiplier = 0.125;
    if (this.unlocking) {
      this.iconAlpha *= 0.92 ** delta;
      this.iconYOffset -= 0.035 * delta;
      multiplier = 0;
      if (this.iconAlpha <= 0.01) {
        this.removeLockIcon();
      }
    }

    const iconY = this.isTopDoor ? y - 1.25 : y - 1.25;

    // Only draw the arrow if not unlocking and lockType is NONE
    if (this.lockType === LockType.NONE && !this.unlocking) {
      Game.drawFX(
        2,
        2,
        1,
        1,
        x,
        y - 1.25 + multiplier * Math.sin((this.frame * Math.PI) / 50),
        1,
        1,
      );
      return;
    }

    // Draw the lock icon (even when unlocking, to show the fade animation)
    Game.drawFX(
      this.iconTileX,
      2,
      1,
      1,
      x + this.iconXOffset,
      iconY +
        multiplier * Math.sin((this.frame * Math.PI) / 50) +
        this.iconYOffset,
      1,
      1,
    );

    Game.ctx.globalAlpha = 1;
  }

  setKey(key: Key) {
    this.keyID = Lockable.generateID();
    key.doorID = this.keyID;
  }

  static generateID() {
    return Math.floor(Random.rand() * 1000000);
  }
}
