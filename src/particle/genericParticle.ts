import { Room } from "../room/room";
import { Particle } from "./particle";
import { Game } from "../game";
import { GameConstants } from "../gameConstants";

export class GenericParticle extends Particle {
  level: Room;
  x: number;
  y: number;
  z: number;
  s: number;
  dx: number;
  dy: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  dz: number;
  color: string;
  alpha: number;
  delay: number;
  expirationTimer: number;

  static shotgun = (
    level: Room,
    cx: number,
    cy: number,
    tx: number,
    ty: number,
    color: string,
  ) => {
    for (let i = 0; i < 4; i++) {
      level.particles.push(
        new GenericParticle(
          level,
          cx,
          cy,
          0,
          Math.random() * 0.5 + 0.3,
          0,
          0,
          0,
          color,
          0,
          10000000,
          tx + Math.random() - 0.5,
          ty + Math.random() - 0.5,
          0,
        ),
      );
    }
  };

  static spawnCluster = (
    level: Room,
    cx: number,
    cy: number,
    color: string,
  ) => {
    for (let i = 0; i < 4; i++) {
      level.particles.push(
        new GenericParticle(
          level,
          cx + Math.random() * 0.05 - 0.025,
          cy + Math.random() * 0.05 - 0.025,
          Math.random() * 0.5,
          0.0625 * (i + 8),
          0.025 * (Math.random() * 2 - 1),
          0.025 * (Math.random() * 2 - 1),
          0.2 * (Math.random() - 1),
          color,
          0,
        ),
      );
    }
  };

  constructor(
    level: Room,
    x: number,
    y: number,
    z: number,
    s: number,
    dx: number,
    dy: number,
    dz: number,
    color: string,
    delay?: number,
    expirationTimer?: number,
    targetX?: number,
    targetY?: number,
    targetZ?: number,
  ) {
    super();
    this.level = level;
    this.x = x;
    this.y = y;
    this.z = z;
    this.s = s;
    this.dx = dx;
    this.dy = dy;
    this.dz = dz;
    this.color = color;
    this.alpha = 1.0;
    if (delay !== undefined) this.delay = delay;
    this.targetX = targetX;
    this.targetY = targetY;
    this.targetZ = targetZ;
    this.expirationTimer = 1000000;
    if (expirationTimer !== undefined) this.expirationTimer = expirationTimer;
  }

  render = () => {
    let scale = GameConstants.TILESIZE;
    let scaledS = this.s * this.alpha; // using alpha for scaling, not alpha
    let halfS = 0.5 * scaledS;
    let oldFillStyle = Game.ctx.fillStyle;
    Game.ctx.fillStyle = this.color;
    Game.ctx.imageSmoothingEnabled = false;

    Game.ctx.beginPath();
    Game.ctx.arc(
      Math.round(this.x * scale),
      Math.round((this.y - this.z) * scale),
      Math.round(halfS * scale),
      0,
      2 * Math.PI,
      false,
    );
    Game.ctx.fill();

    Game.ctx.fillStyle = oldFillStyle;
  };

  draw = (delta: number) => {
    if (this.targetX) this.x += 0.1 * (this.targetX - this.x);
    else this.x += this.dx;
    if (this.targetY) this.y += 0.1 * (this.targetY - this.y);
    else this.y += this.dy;
    if (this.targetZ) this.z += 0.1 * (this.targetZ - this.z);
    else this.z += this.dz;

    this.dx *= 0.97;
    this.dy *= 0.97;
    if (this.z <= 0) {
      this.z = 0;
      this.dz *= -0.8;
    }

    // apply gravity
    this.dz -= 0.01;

    if (this.alpha < 0.2) this.alpha -= 0.007;
    else this.alpha -= 0.02;
    if (this.alpha <= 0.1) this.dead = true;

    this.expirationTimer--;
    if (this.expirationTimer <= 0) this.dead = true;

    if (this.dead) return;

    this.drawableY = this.y;

    this.render();
  };
}
