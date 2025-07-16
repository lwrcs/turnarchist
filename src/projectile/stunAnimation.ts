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

export class StunAnimation extends Projectile {
  frame: number;
  parent: Entity;
  tileX: number;
  tileY: number;
  ticks: number = 0;

  constructor(parent: Entity, x: number, y: number) {
    super(parent, x, y);
    this.frame = 0;

    this.parent.room.projectiles.push(this);
  }

  remove = () => {
    this.parent.room.projectiles = this.parent.room.projectiles.filter(
      (projectile) => projectile !== this,
    );
  };

  tick = () => {
    if (this.ticks > 1 || this.parent.dead === true) {
      this.remove();
      this.parent.unconscious = false;
      this.parent.justHurt = false;
    }
    this.ticks++;
  };

  drawTopLayer = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "screen";
    Game.ctx.globalAlpha = 0.5;
    this.frame += 0.2 * delta;
    if (this.frame > 4) this.frame = 0;

    //this.drawableY = this.parent.drawableY + 0.05;
    //Game.ctx.globalCompositeOperation = "difference";
    //if (this.parent.shielded) {
    Game.drawFX(
      19 + Math.floor(this.frame),
      0,
      1,
      1,
      this.parent.x - this.parent.drawX,
      this.parent.y - this.parent.drawY - 1.4,
      1,
      1,
    );
    //}
    Game.ctx.restore();
  };
}
