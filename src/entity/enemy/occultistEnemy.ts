import { Game } from "../../game";
import { Room } from "../../room/room";

import { Enemy } from "./enemy";

import { Utils } from "../../utility/utils";
import { BeamEffect } from "../../projectile/beamEffect";
import { Player } from "../../player/player";
import { ImageParticle } from "../../particle/imageParticle";
import { Lighting } from "../../lighting/lighting";
import { Entity } from "../entity";
import { Random } from "../../utility/random";

export class OccultistEnemy extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  shieldedEnemies: Enemy[];
  range: number;
  static tileX: number = 55;
  static tileY: number = 8;
  lastHealth: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.lastHealth = this.health;
    this.maxHealth = 4;
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
    this.shadeColor = "#000000";
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [20, 0, 40],
      3.5,
      20,
    );
    this.addLightSource(this.lightSource);
    this.room.updateLighting();
    this.hasBloom = true;
    this.bloomColor = "#2E0854";
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return 1;
  };

  uniqueKillBehavior = () => {
    this.unshieldEnemies();
    this.removeLightSource(this.lightSource);
    this.lightSource = null;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    let enemiesToShield = this.enemyShieldCandidates();

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }

      this.ticks++;

      if (this.ticks % 2 === 0) {
        this.shieldEnemies(enemiesToShield);
        this.updateShieldedEnemies();
      }
    }

    if (this.shieldedEnemies.length > 0) {
      this.shadeColor = "#2E0854";
    } else {
      this.shadeColor = "#000000";
    }
    this.runAway();
    if (this.lightSource) {
      this.lightSource.updatePosition(this.x + 0.5, this.y + 0.5);
    }
  };

  onHurt = (damage: number = 1) => {
    if (
      this.health < this.lastHealth &&
      this.health % 2 === 0 &&
      this.health > 0
    ) {
      this.teleport();
    }
    this.lastHealth = this.health;
  };

  updateShieldedEnemies = () => {
    this.shieldedEnemies.forEach((enemy) => {
      if (enemy.dead) {
        this.shieldedEnemies = this.shieldedEnemies.filter((e) => e !== enemy);
      }
    });
  };

  shieldEnemies = (enemiesToShield: Entity[]) => {
    if (enemiesToShield.length > 0) {
      enemiesToShield.forEach((enemy) => {
        const distance = Utils.distance(this.x, this.y, enemy.x, enemy.y);
        if (Random.rand() * 10 > distance) {
          this.applyShieldTo(enemy as Enemy);
        }
      });
    }
  };

  enemyShieldCandidates = () => {
    return this.room.entities.filter(
      (entity) =>
        entity instanceof Enemy &&
        Utils.distance(this.x, this.y, entity.x, entity.y) <= this.range &&
        !entity.shielded &&
        !entity.dead &&
        entity !== this &&
        !entity.shieldedBefore,
    );
  };

  unshieldEnemies = () => {
    if (this.shieldedEnemies.length > 0) {
      for (let enemy of this.shieldedEnemies) {
        if (!enemy.cloned) {
          enemy.removeShield();
        }
      }
      this.shieldedEnemies = [];
    }
  };

  applyShieldTo = (enemy: Enemy) => {
    //this.shadeColor = "#2E0854";
    this.shadeMultiplier = 1.5;
    enemy.applyShield();
    this.shieldedEnemies.push(enemy);
    if (enemy.shielded && enemy.shield) {
      let beam = new BeamEffect(enemy.x, enemy.y, this.x, this.y, enemy);
      beam.compositeOperation = "source-over";
      beam.color = "#2E0854";
      beam.turbulence = 0.4;
      beam.gravity = 0.1;
      beam.iterations = 1;
      beam.segments = 100;
      beam.angleChange = 0.001;
      beam.springDamping = 0.01;
      beam.drawableY = enemy.drawableY;
      this.room.projectiles.push(beam);
    }
  };

  private createBeam = (enemies: Enemy[]) => {
    for (let enemy of enemies) {
      if (enemy.shielded && enemy.shield) {
        let beam = new BeamEffect(enemy.x, enemy.y, this.x, this.y, enemy);
        beam.compositeOperation = "source-over";
        beam.color = "#2E0854";
        beam.turbulence = 0.5;
        beam.gravity = 0.1;
        beam.iterations = 1;
        beam.segments = 30;
        beam.angleChange = 0.01;
        beam.springDamping = 0.1;
        beam.drawableY = enemy.drawableY;
        this.room.projectiles.push(beam);
      }
    }
  };

  updateBeam = (delta: number) => {
    for (let beam of this.room.projectiles) {
      if (beam instanceof BeamEffect) {
        beam.setTarget(
          this.x - this.drawX,
          this.y - this.drawY,
          beam.parent.x - beam.parent.drawX,
          beam.parent.y - beam.parent.drawY,
        );
        beam.drawableY = beam.parent.drawableY;

        switch (Math.floor(this.frame)) {
          case 0:
            beam.color = "#2e0854";
            break;
          case 1:
            beam.color = "#331988";
            break;
          case 2:
            beam.color = "#4729db";
            break;
          case 3:
            beam.color = "#331988";
            break;
        }
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    this.drawableY = this.y;
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.updateBeam(delta);

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
        this.softShadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };
}
