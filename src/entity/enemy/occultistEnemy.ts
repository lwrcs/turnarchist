import { Game } from "../../game";
import { Room } from "../../room";

import { Enemy } from "./enemy";

import { Utils } from "../../utils";
import { BeamEffect } from "../../beamEffect";
import { Player } from "../../player";
import { ImageParticle } from "../../particle/imageParticle";
import { Lighting } from "../../lighting";

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
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [100, 0, 200],
      0.5,
      1,
    );
    this.addLightSource(this.lightSource);
    this.room.updateLighting();
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
          enemiesToShield.forEach((enemy) => {
            this.applyShieldTo(enemy as Enemy);
          });
          this.createBeam(this.shieldedEnemies);
        }
      }
      this.shieldedEnemies.forEach((enemy) => {
        if (enemy.dead) {
          this.shieldedEnemies = this.shieldedEnemies.filter(
            (e) => e !== enemy,
          );
        }
      });
    }
  };

  unshieldEnemies = () => {
    if (this.shieldedEnemies.length > 0) {
      for (let enemy of this.shieldedEnemies) {
        enemy.removeShield();
      }
      this.shieldedEnemies = [];
    }
  };

  applyShieldTo = (enemy: Enemy) => {
    enemy.applyShield();
    this.shieldedEnemies.push(enemy);
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
        console.log("beam created");
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
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
  };
}
