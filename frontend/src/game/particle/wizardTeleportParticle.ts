import { Particle } from "./particle";
import { Game } from "../game";

export class WizardTeleportParticle extends Particle {
  x: number;
  y: number;
  z: number;
  dz: number;
  frame: number;
  dead: boolean;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.dead = false;
    this.frame = 0;
    this.z = 0;
    this.dz = 0.1;
  }

  draw = (delta: number) => {
    if (this.dead) return;
    Game.drawFX(Math.floor(this.frame), 3, 1, 1, this.x, this.y - this.z, 1, 1);
    this.z += this.dz * delta;
    this.dz *= 0.9;
    this.frame += 0.3 * delta;
    if (this.frame > 6) this.dead = true;
  };
}
