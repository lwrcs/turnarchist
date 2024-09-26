import { Room } from "../room";
import { Particle } from "./particle";
import { Game } from "../game";
import { GameConstants } from "../gameConstants";
import { Random } from "../random";

export class ImageParticle extends Particle {
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
  tileX: number;
  tileY: number;
  size: number;

  static shotgun = (
    level: Room,
    cx: number,
    cy: number,
    tx: number,
    ty: number,
    tileX: number,
    tileY: number,
    color: string
  ) => {
    for (let i = 0; i < 4; i++) {
      level.particles.push(
        new ImageParticle(
          level,
          cx,
          cy,
          0,
          Math.random() * 0.5 + 0.3,
          0,
          0,
          0,
          tileX,
          tileY,
          color,
          0,
          100000000,
          tx + Math.random() - 0.5,
          ty + Math.random() - 0.5,
          0
        )
      );
    }
  };

  static spawnCluster = (
    level: Room,
    cx: number,
    cy: number,
    tileX: number,
    tileY: number,
    color: string
  ) => {
    for (let i = Math.floor(Math.random() * 3); i < 5; i++) {
      level.particles.push(
        new ImageParticle(
          level,
          cx + Math.random() * 0.05 - 0.025, // x
          cy + Math.random() * 0.05 - 0.025, // y
          Math.random() * 0.5, // z
          0.0625 * (i + 8), // s
          0.025 * (Math.random() * 2 - 1), //dx
          0.025 * (Math.random() * 2 - 1), //dy
          0.2 * (Math.random() - 1), //dz
          tileX,
          tileY,
          color,
          [2, 1, 0, 1, 2, 2, 2][i],
          0
        )
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
    tileX: number,
    tileY: number,
    color: string,
    size: number,
    delay?: number,
    expirationTimer?: number,
    targetX?: number,
    targetY?: number,
    targetZ?: number
  ) {
    super();
    this.level = level;
    this.x = x;
    this.y = y;
    this.z = z; // Use provided height
    this.s = s;
    this.dx = dx;
    this.dy = dy;
    this.dz = dz;
    this.tileX = tileX;
    this.tileY = tileY;
    this.size = size;
    this.color = color;
    this.alpha = 1.0;
    if (delay !== undefined) this.delay = delay;
    this.targetX = targetX;
    this.targetY = targetY;
    this.targetZ = targetZ;
    this.expirationTimer = 100; // Increased life duration
    if (expirationTimer !== undefined) this.expirationTimer = expirationTimer;
  }

  render = () => {
    let scale = GameConstants.TILESIZE;
    let yOffset = this.z * scale;
    let frame = this.s > 0.5 ? 1 : 0; // Placeholder frames for large and small particles
    Game.ctx.imageSmoothingEnabled = false;

    let adjustedTileX = this.tileX + this.size;
    Game.drawFX(
      adjustedTileX,
      this.tileY,
      1,
      1,
      this.x - this.alpha / 2,
      this.y - this.z - this.alpha / 2,
      this.alpha,
      this.alpha
    );
  };

  draw = (delta: number) => {
    Game.ctx.imageSmoothingEnabled = false;

    if (this.targetX) this.x += 0.2 * (this.targetX - this.x);
    else this.x += this.dx;
    if (this.targetY) this.y += 0.2 * (this.targetY - this.y);
    else this.y += this.dy;
    if (this.targetZ) this.z += 0.2 * (this.targetZ - this.z);
    else this.z += this.dz;

    this.dx *= 0.97;
    this.dy *= 0.97;
    if (this.z <= 0) {
      this.z = 0;
      this.dz *= -0.8;
    }

    // apply gravity
    this.dz -= 0.01;
    /*
    if (this.alpha < 0.2) this.alpha -= ((0.01 * this.size) + 0.005);
    else this.alpha -= ((0.005 * this.size) + 0.005);
    if (this.alpha <= 0.6) this.dead = true;
    */

    this.expirationTimer--;
    if (this.expirationTimer <= 0) this.dead = true;

    if (this.dead) return;

    this.drawableY = this.y;

    this.render();
  };
}