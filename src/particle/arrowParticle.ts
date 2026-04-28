import { Particle } from "./particle";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Room } from "../room/room";

export class ArrowParticle extends Particle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  frame: number;
  speed: number;
  room: Room;

  constructor(
    room: Room,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) {
    super();
    this.room = room;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.x = startX;
    this.y = startY;
    this.dead = false;
    this.frame = 0; // animation frame counter, incremented by delta each draw
    this.speed = 0.25; // tiles per game-frame (at 60 fps) — controls travel duration
  }

  draw = (delta: number) => {
    if (this.dead) return;

    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;

    // frame accumulates real-time units (like all other particle animations)
    this.frame += delta;
    const totalFrames = dist / this.speed;
    const t = Math.min(1, this.frame / totalFrames);

    this.x = this.startX + t * dx;
    this.y = this.startY + t * dy;
    this.drawableY = this.y;

    if (t >= 1) {
      this.room.game.shakeScreen(Math.sign(dx) * 5, Math.sign(dy) * 5);
      this.dead = true;
    }

    const ctx = (Game as any).ctx as CanvasRenderingContext2D;
    if (!ctx) return;
    const tilesize = GameConstants.TILESIZE;

    const angle = Math.atan2(dy, dx);
    const length = Math.round(1 * tilesize);
    const thickness = Math.max(1, Math.round(0.25 * tilesize));
    const px = Math.round(this.x * tilesize);
    const py = Math.round(this.y * tilesize);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = "white";
    ctx.fillRect(-Math.round(length / 2), -Math.round(thickness / 2), length, thickness);
    ctx.restore();
  };
}
