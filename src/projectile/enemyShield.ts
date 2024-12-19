import { Projectile } from "./projectile";
import { Game } from "../game";
import { Player } from "../player";
import { HitWarning } from "../hitWarning";
import { Entity } from "../entity/entity";
import { Enemy } from "../entity/enemy/enemy";
import { LightSource } from "../lightSource";
import { Lighting } from "../lighting";
import { OccultistEnemy } from "../entity/enemy/occultistEnemy";
import { GameConstants } from "../gameConstants";
import { BeamEffect } from "../beamEffect";
import { GenericParticle } from "../particle/genericParticle";

export class EnemyShield extends Projectile {
  frame: number;
  parent: Entity;
  tileX: number;
  tileY: number;
  health: number;
  beam: BeamEffect;

  constructor(parent: Entity, x: number, y: number, health: number = 1) {
    super(parent, x, y);
    this.parent = parent;
    this.frame = 0;
    this.health = health;
    this.parent.shielded = true;
    this.beam = null;
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [250, 0, 150],
      0.5,
      1,
    );
    this.parent.addLightSource(this.lightSource);
    this.parent.room.projectiles.push(this);
    this.parent.room.updateLighting();
  }

  remove = () => {
    this.parent.shielded = false;
    this.parent.removeLightSource(this.lightSource);
    this.parent.room.projectiles = this.parent.room.projectiles.filter(
      (projectile) => projectile !== this,
    );
    this.lightSource = null;
    this.parent.shield = null;
  };

  updateLightSourcePos = () => {
    if (this.lightSource === null) return;
    let index = this.parent.room.lightSources.indexOf(this.lightSource);
    this.parent.room.lightSources[index].x = this.parent.x + 0.5;
    this.parent.room.lightSources[index].y = this.parent.y + 0.5;
    this.parent.room.updateLighting();
  };

  hurt = (damage: number) => {
    const damageOverShield = Math.max(0, damage - this.health);
    this.health -= damage;
    GenericParticle.spawnCluster(
      this.parent.room,
      this.parent.x + 0.5,
      this.parent.y + 0.5,
      "#fbf236",
    );

    if (this.health <= 0) {
      this.remove();
    }
    return damageOverShield;
  };

  tick = () => {
    if (this.parent.dead) {
      this.remove();
    }
    if (this.dead)
      this.parent.room.beamEffects = this.parent.room.beamEffects.filter(
        (beam) => beam !== this.beam,
      );
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
