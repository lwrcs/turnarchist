import { Game } from "../game";
import { Particle } from "./particle";

export class DashParticle extends Particle {
  x: number;
  y: number;
  frame: number;

  constructor(x: number, y: number, frameOffset: number) {
    super();
    this.x = x;
    this.y = y - 1;
    this.dead = false;
    this.frame = frameOffset;
  }

  drawBehind = (delta: number) => {
    Game.drawFX(Math.round(this.frame), 0, 1, 2, this.x, this.y, 1, 2);

    this.frame += 0.4 * delta;
    if (this.frame > 7) this.dead = true;
  };
}
