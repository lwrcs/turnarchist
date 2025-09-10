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
import { GameplaySettings } from "../../game/gameplaySettings";

export class ExalterEnemy extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  buffedEnemies: Enemy[];
  range: number;
  static tileX: number = 59;
  static tileY: number = 8;
  lastHealth: number;
  buffedBefore: boolean;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.lastHealth = this.health;
    this.maxHealth = 4;
    this.tileX = 59;
    this.tileY = 8;
    this.seenPlayer = true;
    this.name = "exalter";
    this.range = 6;
    this.aggro = false;
    this.frame = 0;
    this.hasShadow = true;
    this.buffedBefore = false;
    this.buffedEnemies = [];
    this.shadeColor = "#000000";
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [1, 20, 30],
      3.5,
      20,
    );
    this.addLightSource(this.lightSource);
    this.room.updateLighting();
    this.hasBloom = true;
    this.bloomColor = "#00FFFF"; //cyan;
    this.bloomAlpha = 0.5;
    this.softBloomAlpha = 0;
    this.dropChance = 1;
    this.getDrop(["exalter"], false);
    this.pushable = false;
    this.chainPushable = false;
  }

  hit = (): number => {
    return 1;
  };

  uniqueKillBehavior = () => {
    this.unbuffEnemies();
    this.removeLightSource(this.lightSource);
    this.lightSource = null;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    let enemiesToBuff = this.enemyBuffCandidates();

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }

      this.ticks++;

      if (this.ticks % 2 === 0) {
        this.buffEnemies(enemiesToBuff);
        this.updateBuffedEnemies();
        this.runAway();
      }
    }

    if (this.buffedEnemies.length > 0) {
      this.shadeColor = "#306082";
    } else {
      this.shadeColor = "#000000";
    }
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

  updateBuffedEnemies = () => {
    this.buffedEnemies.forEach((enemy) => {
      if (enemy.dead) {
        this.buffedEnemies = this.buffedEnemies.filter((e) => e !== enemy);
      }
    });
  };

  buffEnemies = (enemiesToBuff: Entity[]) => {
    if (enemiesToBuff.length > 0) {
      enemiesToBuff.forEach((enemy) => {
        const distance = Utils.distance(this.x, this.y, enemy.x, enemy.y);
        if (Random.rand() * 10 > distance) {
          this.applyBuffTo(enemy as Enemy);
        }
      });
    }
  };

  enemyBuffCandidates = () => {
    const uncappedCandidates = this.room.entities.filter(
      (entity) =>
        entity instanceof Enemy &&
        Utils.distance(this.x, this.y, entity.x, entity.y) <= this.range &&
        !entity.buffed &&
        !entity.dead &&
        entity !== this &&
        !entity.buffedBefore,
    );
    return uncappedCandidates.slice(0, GameplaySettings.MAX_EXALTER_BUFFS);
  };

  unbuffEnemies = () => {
    if (this.buffedEnemies.length > 0) {
      for (let enemy of this.buffedEnemies) {
        if (!enemy.cloned) {
          enemy.removeBuff();
        }
      }
      this.buffedEnemies = [];
    }
  };

  applyBuffTo = (enemy: Enemy) => {
    //this.shadeColor = "#2E0854";
    if (!enemy.destroyable) return;
    this.shadeMultiplier = 1.5;
    enemy.applyBuff();
    this.buffedEnemies.push(enemy);
    if (enemy.buffed) {
      for (let i = 0; i < 5; i++) {
        let beam = new BeamEffect(enemy.x, enemy.y, this.x, this.y, enemy);
        beam.compositeOperation = "source-over";
        beam.color = "#00FFFF";
        beam.turbulence = 1;
        beam.gravity = 0;
        beam.iterations = 3;
        beam.segments = 30;
        beam.angleChange = 1;
        beam.springDamping = 0.3;
        beam.drawableY = enemy.drawableY;
        beam.type = "buff";
        this.room.projectiles.push(beam);
      }
    }
  };

  updateBeam = (delta: number) => {
    for (let beam of this.room.projectiles) {
      if (beam instanceof BeamEffect) {
        if (
          !this.buffedEnemies.includes(beam.parent as Enemy) ||
          beam.type !== "buff"
        )
          continue;
        beam.setTarget(
          this.x - this.drawX,
          this.y - this.drawY,
          beam.parent.x - beam.parent.drawX,
          beam.parent.y - beam.parent.drawY,
        );
        beam.drawableY = beam.parent.drawableY;

        switch (Math.floor(this.frame)) {
          case 0:
            beam.color = "#00FFFF";
            break;
          case 1:
            beam.color = "#00a1dc"; //darker cyan;
            break;
          case 2:
            beam.color = "#008ea7"; //darker cyan;
            break;
          case 3:
            beam.color = "#00a1dc"; //darker cyan;
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

      if (this.hasShadow) this.drawShadow(delta);
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
