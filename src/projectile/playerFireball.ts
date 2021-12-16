import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../enemy/wizardEnemy";
import { Player } from "../player";
import { HitWarning } from "../hitWarning";

export class PlayerFireball extends Projectile {
  state: number;
  frame: number;
  delay: number;

  constructor(x: number, y: number) {
    super(x, y);
    this.state = 0;
    this.frame = 0;
  }
  draw = (delta: number) => {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.frame += 0.3 * delta;
    if (this.frame > 12) this.dead = true;
    Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
  }
};

