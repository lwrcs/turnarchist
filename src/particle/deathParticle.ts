import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Particle } from "./particle";

export class DeathParticle extends Particle {
  x: number;
  y: number;
  frame: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y - 1.5;
    this.dead = false;
    this.frame = 0;
  }

  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    let yOffset = Math.max(0, ((this.frame - 3) * 3) / GameConstants.TILESIZE);
    let f = Math.round(this.frame);
    if (f == 2 || f == 4 || f == 6)
      Game.drawMob(2, 0, 1, 2, this.x, this.y - yOffset, 1, 2);
    else
      Game.drawFX(
        Math.round(this.frame),
        4,
        1,
        2,
        this.x,
        this.y - yOffset,
        1,
        2,
      );

    this.frame += 0.3 * delta;
    if (this.frame > 10) this.dead = true;
  };
}
