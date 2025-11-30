import { Room } from "../room/room";
import { Particle } from "./particle";
import { Direction, Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Random } from "../utility/random";
import { Player, PlayerDirection } from "../player/player";
import { Entity } from "../entity/entity";

export class ImageParticle extends Particle {
  room: Room;
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
    room: Room,
    cx: number,
    cy: number,
    tx: number,
    ty: number,
    tileX: number,
    tileY: number,
  ) => {
    for (let i = 0; i < 4; i++) {
      room.particles.push(
        new ImageParticle(
          room,
          cx,
          cy,
          0,
          Random.rand() * 0.5 + 0.3,
          0,
          0,
          0,
          tileX,
          tileY,
          0, //size
        ),
      );
    }
  };

  static spawnCluster = (
    level: Room,
    cx: number,
    cy: number,
    tileX: number,
    tileY: number,
  ) => {
    for (let i = Math.floor(Random.rand() * 3); i < 5; i++) {
      level.particles.push(
        new ImageParticle(
          level,
          cx + Random.rand() * 0.05 - 0.025, // x
          cy + Random.rand() * 0.05 - 0.025, // y
          Random.rand() * 0.5, // z
          0.0625 * (i + 8), // s
          0.025 * (Random.rand() * 2 - 1), //dx
          0.025 * (Random.rand() * 2 - 1), //dy
          0.2 * (Random.rand() - 1), //dz
          tileX,
          tileY,
          [2, 1, 0, 1, 2, 2, 2][i], //size
        ),
      );
    }
  };

  constructor(
    room: Room,
    x: number,
    y: number,
    z: number,
    s: number,
    dx: number,
    dy: number,
    dz: number,
    tileX: number,
    tileY: number,
    size: number,
    delay?: number,
    expirationTimer?: number,
    targetX?: number,
    targetY?: number,
    targetZ?: number,
  ) {
    super();
    this.room = room;
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
      this.x - 0.5, // - this.alpha / 2,
      this.y - this.z - 0.5, // - this.alpha / 2,
      1,
      1,
      this.shadeColor(),
      this.shadeAmount() * (1 / this.alpha),
    );
  };

  draw = (delta: number) => {
    Game.ctx.imageSmoothingEnabled = false;

    if (this.targetX) this.x += 0.2 * (this.targetX - this.x) * delta;
    else this.x += this.dx * delta;
    if (this.targetY) this.y += 0.2 * (this.targetY - this.y) * delta;
    else this.y += this.dy * delta;
    if (this.targetZ) this.z += 0.2 * (this.targetZ - this.z) * delta;
    else this.z += this.dz * delta;

    this.dx *= Math.pow(0.97, delta);
    this.dy *= Math.pow(0.97, delta);
    if (this.z <= 0) {
      this.z = 0;
      this.dz *= -0.8;
    }

    this.dz -= 0.01 * delta;

    this.expirationTimer -= delta;
    if (this.expirationTimer <= 0) this.dead = true;

    if (this.dead) return;

    this.drawableY = this.y;

    this.render();
  };
}

type BubbleParticleOptions = {
  height?: number;
  tileX?: number;
  tileY?: number;
  size?: number;
  scale?: number;
  lifetime?: number;
};

export class BubbleImageParticle extends ImageParticle {
  private bobPhase: number;
  private bobSpeed: number;
  private bobRadius: number;
  private riseSpeed: number;
  private fadeWindow: number;

  constructor(
    room: Room,
    x: number,
    y: number,
    options: BubbleParticleOptions = {},
  ) {
    const scaledSize = options.scale ?? 0.45 + Random.rand() * 0.25;
    const lifeSpan = options.lifetime ?? 90 + Random.rand() * 30;
    super(
      room,
      x,
      y,
      options.height ?? 0,
      scaledSize,
      0,
      0,
      0,
      options.tileX ?? 9,
      options.tileY ?? 26,
      options.size ?? 0,
      undefined,
      lifeSpan,
    );

    this.bobPhase = Random.rand() * Math.PI * 2;
    this.bobSpeed = 0.01 + Random.rand() * 0.0025;
    this.bobRadius = 0.01 + Random.rand() * 0.002;
    this.riseSpeed = 0.015 + Random.rand() * 0.01;
    this.fadeWindow = 30;
  }

  draw = (delta: number) => {
    Game.ctx.imageSmoothingEnabled = false;

    this.bobPhase += this.bobSpeed * delta;
    this.x += Math.sin(this.bobPhase) * this.bobRadius * delta;
    this.y -= this.riseSpeed * delta;
    this.z += (this.riseSpeed * 0.5 + 0.005) * delta;

    this.expirationTimer -= delta;
    if (this.expirationTimer <= 0) {
      this.dead = true;
      return;
    }

    if (this.expirationTimer < this.fadeWindow) {
      this.alpha = Math.max(0.001, this.expirationTimer / this.fadeWindow);
    }

    this.drawableY = this.y;

    this.render();
  };
}
