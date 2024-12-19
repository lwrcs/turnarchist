import { Game } from "../../game";
import { Room } from "../../room";

import { Enemy } from "./enemy";

import { Utils } from "../../utils";
import { BeamEffect } from "../../beamEffect";
import { Player } from "../../player";
import { ImageParticle } from "../../particle/imageParticle";

export class OccultistEnemy extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  shieldedEnemies: Enemy[];
  range: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 6;
    this.maxHealth = 6;
    this.tileX = 55;
    this.tileY = 8;
    this.seenPlayer = true;
    this.name = "occultist";
    this.range = 6;
    this.aggro = false;
    this.frame = 0;
    this.hasShadow = true;
    this.shieldedBefore = false;
    this.shieldedEnemies = [];
  }

  hit = (): number => {
    return 1;
  };

  uniqueKillBehavior = () => {
    this.unshieldEnemies();
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    let enemiesToShield = this.room.entities.filter(
      (entity) =>
        entity instanceof Enemy &&
        Utils.distance(this.x, this.y, entity.x, entity.y) <= this.range &&
        !entity.shielded &&
        !entity.dead &&
        entity !== this &&
        !entity.shieldedBefore,
    );

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      if (this.ticks % 2 === 0) {
        if (enemiesToShield.length > 0) {
          this.applyShieldTo(
            enemiesToShield[
              Math.floor(Math.random() * enemiesToShield.length)
            ] as Enemy,
          );
          this.createBeam(this.shieldedEnemies);
        }
      }
    }
  };

  unshieldEnemies = () => {
    if (this.shieldedEnemies.length > 0) {
      this.shieldedEnemies.forEach((enemy) => {
        enemy.removeShield();
      });
      this.shieldedEnemies = [];
    }
  };

  applyShieldTo = (enemy: Enemy) => {
    enemy.applyShield();
  };

  private createBeam = (enemies: Enemy[]) => {
    enemies.forEach((enemy) => {
      enemy.shield.beam = new BeamEffect(this.x, this.y, enemy.x, enemy.y);
      this.room.beamEffects.push(enemy.shield.beam);
    });
  };

  private drawBeam = (delta: number) => {
    this.room.beamEffects.forEach((beam) => {
      beam.render(this.x, this.y, beam.targetX, beam.targetY, "cyan", 2, delta);
    });
  };

  updateBeam = (delta: number) => {
    this.shieldedEnemies.forEach((enemy) => {
      if (enemy.shield.beam) {
        enemy.shield.beam.targetX = enemy.x - enemy.drawX;
        enemy.shield.beam.targetY = enemy.y - enemy.drawY;
      }
    });
  };

  draw = (delta: number) => {
    this.drawableY = this.y;
    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.room.beamEffects.length > 0) {
        this.updateBeam(delta);
        this.drawBeam(delta);
      }
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
        this.tileX + Math.floor(this.frame),
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
  };
}
