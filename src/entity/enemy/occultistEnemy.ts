import { Game } from "../../game";
import { Room } from "../../room";
import { Floor } from "../../tile/floor";
import { HitWarning } from "../../hitWarning";
import { SkullEnemy } from "./skullEnemy";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { KnightEnemy } from "./knightEnemy";
import { Enemy } from "./enemy";
import { Random } from "../../random";
import { EnergyWizardEnemy } from "./energyWizard";
import { ZombieEnemy } from "./zombieEnemy";
import { BishopEnemy } from "./bishopEnemy";
import { CrabEnemy } from "./crabEnemy";
import { ChargeEnemy } from "./chargeEnemy";
import { BigKnightEnemy } from "./bigKnightEnemy";
import { BigSkullEnemy } from "./bigSkullEnemy";
import { FrogEnemy } from "./frogEnemy";
import { FireWizardEnemy } from "./fireWizard";
import { QueenEnemy } from "./queenEnemy";
import { ArmoredzombieEnemy } from "./armoredzombieEnemy";
import { RookEnemy } from "./rookEnemy";
import { RoomType } from "../../room";
import { Utils } from "../../utils";

export class OccultistEnemy extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  shieldedEnemies: Enemy[];
  range: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 6;
    this.maxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.name = "occultist";
    this.range = 6;
  }

  hit = (): number => {
    return 1;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    let enemiesToShield = this.room.entities.filter(
      (entity) =>
        entity instanceof Enemy &&
        Utils.distance(this.x, this.y, entity.x, entity.y) <= this.range,
    );

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.tileX = 6;
      if (this.ticks % 2 === 0) {
        if (enemiesToShield.length > 0) {
          this.applyShieldTo(
            enemiesToShield[
              Math.floor(Math.random() * enemiesToShield.length)
            ] as Enemy,
          );
        }
      }
    }
  };

  applyShieldTo = (enemy: Enemy) => {
    enemy.applyShield();
  };

  draw = (delta: number) => {
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow)
        Game.drawMob(
          0,
          0,
          1,
          1,
          this.x - this.drawX,
          this.y - this.drawY,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount(),
        );
      Game.drawMob(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta);
    }
  };
}
