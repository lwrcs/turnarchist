import { Projectile } from "./projectile";
import { Game } from "../game";
import { Player } from "../player/player";
import { HitWarning } from "../drawable/hitWarning";
import { Entity } from "../entity/entity";
import { Enemy } from "../entity/enemy/enemy";
import { LightSource } from "../lighting/lightSource";
import { Lighting } from "../lighting/lighting";
import { OccultistEnemy } from "../entity/enemy/occultistEnemy";
import { GameConstants } from "../game/gameConstants";
import { BeamEffect } from "./beamEffect";
import { GenericParticle } from "../particle/genericParticle";

export class EnemyShield extends Projectile {
  frame: number;
  parent: Entity;
  tileX: number;
  tileY: number;
  health: number;
  private autoRegistered?: boolean;

  constructor(
    parent: Entity | null,
    x: number,
    y: number,
    health: number = 1,
    autoRegister: boolean = true,
  ) {
    super(parent as any, x, y);
    this.parent = parent as any;
    this.frame = 0;
    this.health = health;
    this.autoRegistered = false;

    // Gracefully handle missing parent during load; mark as dead so caller can skip
    if (!this.parent || !(this.parent as any).room) {
      this.dead = true;
      return;
    }

    this.parent.shielded = true;
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [20, 0, 40],
      3.5,
      20,
    );
    this.parent.addLightSource(this.lightSource);
    if (autoRegister) {
      this.parent.room.projectiles.push(this);
      this.autoRegistered = true;
    }
    this.parent.room.updateLighting({ x: this.x, y: this.y });
  }

  remove = () => {
    this.parent.shielded = false;
    this.parent.removeLightSource(this.lightSource);
    this.parent.room.projectiles = this.parent.room.projectiles.filter(
      (projectile) => projectile !== this,
    );

    let beam = this.parent.room.projectiles.find(
      (projectile) =>
        projectile instanceof BeamEffect && projectile.parent === this.parent,
    );
    if (beam) {
      beam.dead = true;
    }
    this.parent.shadeColor = "black";
    this.lightSource = null;
    this.parent.shield = null;
  };

  updateLightSourcePos = () => {
    if (this.lightSource === null) return;
    let index = this.parent.room.lightSources.indexOf(this.lightSource);
    this.parent.room.lightSources[index].x = this.parent.x + 0.5;
    this.parent.room.lightSources[index].y = this.parent.y + 0.5;
    //this.parent.room.updateLighting();
  };

  hurt = (damage: number) => {
    const damageOverShield = Math.max(0, damage - this.health);
    this.health -= damage;
    this.parent.maxHealth -= damage;
    /*
    GenericParticle.spawnCluster(
      this.parent.room,
      this.parent.x + 0.5,
      this.parent.y + 0.5,
      "#fbf236",
    );
    */

    if (this.health <= 0) {
      this.remove();
    }
    return damageOverShield;
  };

  tick = () => {
    if (!this.parent || !(this.parent as any).room) {
      this.dead = true;
      return;
    }
    if (this.parent?.dead) {
      this.remove();
    }
    if (this.dead) {
      if (this.parent && (this.parent as any).room) {
        this.parent.room.projectiles = this.parent.room.projectiles.filter(
          (projectile) => projectile !== this,
        );
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = 1;
    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;

    this.drawableY = this.parent.drawableY - 0.05;
    Game.ctx.globalCompositeOperation = "difference";
    if (this.parent.shielded) {
      Game.drawFX(
        18 + Math.floor(this.frame),
        9,
        1,
        1,
        this.parent.x - this.parent.drawX,
        this.parent.y - this.parent.drawY,
        1,
        1,
      );
    }
    Game.ctx.restore();
  };
}
