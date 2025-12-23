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
    this.offsetY = -0.25; //default -0.25
    this.useCost = 1;
    this.degradeable = false;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let newX2 = 2 * newX - this.wielder.x;
    let newY2 = 2 * newY - this.wielder.y;
    let hitEnemies = false;
    const room = this.wielder?.getRoom
      ? this.wielder.getRoom()
      : this.game.rooms[this.wielder.levelID];
    const z = this.wielder?.z ?? 0;

    // Check if there are any pushables at first tile - these completely block the spear
    const pushables = this.getEntitiesAt(newX, newY).filter((e) => e.pushable);
    if (pushables.length > 0) return true;

    // Get entities at both tiles
    const entitiesAtFirstTile = this.getEntitiesAt(newX, newY);
    const entitiesAtSecondTile = this.getEntitiesAt(newX2, newY2);

    // Check if first tile has non-enemy entities that would block the spear
    const nonEnemiesAtFirstTile = entitiesAtFirstTile.filter(
      (e) => !e.pushable && !e.isEnemy,
    );
    if (nonEnemiesAtFirstTile.length > 0) {
      // Hit non-enemy entities at first tile and stop (blocked)
      for (const entity of nonEnemiesAtFirstTile) {
        this.attack(entity, this.damage + this.wielder.damageBonus);
      }
      this.hitSound();
      this.attackAnimation(newX, newY);
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      this.shakeScreen(newX, newY);
      this.degrade();
      return false;
    }

    // Begin a deduplicated swing so big enemies aren't double-hit across tiles
    this.beginSwing();

    // Hit all enemies at first tile (spear penetrates through)
    const enemiesAtFirstTile = entitiesAtFirstTile.filter(
      (e) => !e.pushable && e.isEnemy,
    );
    if (enemiesAtFirstTile.length > 0) {
      for (const enemy of enemiesAtFirstTile) {
        this.attack(enemy, this.damage + this.wielder.damageBonus);
      }
      hitEnemies = true;
    }

    // Hit all enemies at second tile (if tile is valid and not solid)
    if (
      room.roomArray[newX2] &&
      room.roomArray[newX2][newY2] &&
      !room.isSolidAt(newX2, newY2, z)
    ) {
      const enemiesAtSecondTile = entitiesAtSecondTile.filter(
        (e) => !e.pushable && e.isEnemy,
      );
      if (enemiesAtSecondTile.length > 0) {
        for (const enemy of enemiesAtSecondTile) {
          this.attack(enemy, this.damage + this.wielder.damageBonus);
        }
        hitEnemies = true;
      }
    }

    if (hitEnemies) {
      this.hitSound();
      this.attackAnimation(newX2, newY2); // Show animation at the furthest point
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      this.shakeScreen(newX2, newY2);
      this.degrade();
    }

    this.endSwing();

    return !hitEnemies;
  };
}
