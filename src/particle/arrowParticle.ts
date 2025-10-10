import { Particle } from "./particle";
import { Game } from "../game";
import { Room } from "../room/room";

export class ArrowParticle extends Particle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  t: number;
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
    this.t = 0; // 0..1 progression
    this.speed = 0.5; // tiles per frame (scaled by delta)
  }

  private renderRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) => {
    const scale = (Game as any).ctx ? 1 : 1; // guard for server-side
    const ctx = (Game as any).ctx;
    if (!ctx) return;

    const tilesize = (Game as any).TILESIZE || 16;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = color;
    // Centered rectangle
    const px = Math.round((x - width / 2) * tilesize);
    const py = Math.round((y - height / 2) * tilesize);
    const pw = Math.max(1, Math.round(width * tilesize));
    const ph = Math.max(1, Math.round(height * tilesize));
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  };

  draw = (delta: number) => {
    if (this.dead) return;

    // advance t based on approximate speed; clamp to [0,1]
    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const dist = Math.max(1, Math.abs(dx) + Math.abs(dy));
    // normalize to travel in about (dist / speed) frames
    this.t += (this.speed * (delta || 1)) / dist;
    if (this.t >= 1) this.t = 1;

    // interpolate position
    this.x = this.startX + this.t * dx;
    this.y = this.startY + this.t * dy;

    // when arrived, mark dead; room will clean up
    if (this.t >= 1) this.dead = true;

    // Draw as a longer rectangle aligned to travel axis
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const length = 0.5; // tiles
    const thickness = 0.12; // tiles
    const w = horizontal ? length : thickness;
    const h = horizontal ? thickness : length;
    this.renderRect(this.x, this.y, w, h, "white");
  };
}
