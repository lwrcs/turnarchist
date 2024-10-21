import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player";
import { HitWarning } from "../hitWarning";
import { Entity } from "../entity/entity";
import { Enemy } from "../entity/enemy/enemy";

export class WizardFireball extends Projectile {
  state: number;
  frame: number;
  parent: Entity;
  delay: number;
  frameOffset: number;
  constructor(parent: Entity, x: number, y: number) {
    super(parent, x, y);
    this.parent = parent;
    this.frame = 0;
    this.frameOffset = 0;
    this.state = 1 - this.distanceToParent;
  }

  tick = () => {
    console.log(`state: ${this.state}`);
    if (this.parent.dead) this.dead = true;

    this.state++;
    if (this.state === 1 && !this.dead) {
      this.parent.room.hitwarnings.push(
        new HitWarning(this.parent.game, this.x, this.y, this.x, this.y, false)
      );
    }
    if (this.state === 2 && !this.dead) {
      this.frame = 0;
      this.delay = Game.rand(0, 10, Math.random);
    }
  };

  hitPlayer = (player: Player) => {
    if (this.state === 2 && !this.dead) {
      player.hurt(1, "wizard");
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.globalCompositeOperation = "overlay";
    Game.ctx.fillRect(this.x, this.y, 16, 16);
    Game.ctx.fillStyle = "red";
    Game.ctx.globalAlpha = 0.5;
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = 1;

    if (this.state >= 0) {
      if (this.state === 0) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(22 + Math.floor(this.frame), 7, 1, 1, this.x, this.y, 1, 1);
      } else if (this.state === 1) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(18 + Math.floor(this.frame), 7, 1, 1, this.x, this.y, 1, 1);
      } else {
        if (this.delay > 0) {
          this.delay--;
          return;
        }
        this.frame += 0.3 * delta;
        if (this.frame > 17) this.dead = true;
        Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
      }
    }
  };
}
