import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { SlashParticle } from "../../particle/slashParticle";
import type { Enemy } from "../../entity/enemy/enemy";
import { AttackAnimation } from "../../particle/attackAnimation";

export class Spear extends Weapon {
  static itemName = "spear";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 24;
    this.tileY = 0;
    this.name = "spear";
    this.description =
      "Hits enemies in front of you within a range of 2 tiles.";
    this.iconOffset = 0.1; //default 0
    this.offsetY = 0; //default -0.25
    this.useCost = 1;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let newX2 = 2 * newX - this.wielder.x;
    let newY2 = 2 * newY - this.wielder.y;
    let flag = false;
    let enemyHitCandidates = [];

    // Check first tile
    if (this.checkForPushables(newX, newY)) return true;

    const hitFirstTile = this.hitEntitiesAt(newX, newY);
    if (hitFirstTile) flag = true;

    // Check second tile for enemies only (not pushables)
    if (
      !this.game.rooms[this.wielder.levelID].roomArray[newX][newY].isSolid()
    ) {
      const entitiesAtSecondTile = this.getEntitiesAt(newX2, newY2).filter(
        (e) => !e.pushable,
      );
      enemyHitCandidates = entitiesAtSecondTile;
    }

    if (!flag && enemyHitCandidates.length > 0) {
      for (const e of enemyHitCandidates) {
        this.attack(e);
      }
      this.hitSound();
      this.attackAnimation(newX2, newY2);
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      this.shakeScreen(newX2, newY2);
      this.degrade();
      return false;
    }

    if (flag) {
      this.hitSound();
      this.attackAnimation(newX, newY);
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      this.shakeScreen(newX, newY);
      this.degrade();
    }

    return !flag;
  };
}
