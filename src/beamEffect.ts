import { Game } from "./game";
import { GameConstants } from "./gameConstants";
import { Room } from "./room";

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
}

export class BeamEffect {
  // Number of points that make up the beam (higher = smoother but more expensive)
  // Range: 10-100, recommended: 30
  private static readonly SEGMENTS = 30;

  // Downward force applied to each point (0 = no gravity)
  // Range: 0-10, recommended: 2
  private static readonly GRAVITY = 2;

  // Physics simulation steps per frame (higher = more accurate but more expensive)
  // Range: 1-10, recommended: 1
  private static readonly ITERATIONS = 5;

  // How much the beam reacts to movement of start/end points
  // Range: 0-5, recommended: 1
  private static readonly MOTION_INFLUENCE = 1;

  // Amount of random movement applied to points (0 = straight beam)
  // Range: 0-1, recommended: 0.5
  private static readonly TURBULENCE = 0.5;

  // How quickly velocity decreases over time
  // Range: 0-1, recommended: 0.5
  private static readonly VELOCITY_DECAY = 0.1;

  // How quickly the turbulence angle changes
  // Range: 0-2, recommended: 0.9
  private static readonly ANGLE_CHANGE = 0.01; // for turbulence specifically

  // Maximum speed any point can move per frame
  // Range: 10-1000, recommended: 100
  private static readonly MAX_VELOCITY = 100;

  // General movement resistance (1 = no damping, 0 = full stop)
  // Range: 0.9-0.999, recommended: 0.8
  private static readonly DAMPING = 0.8;

  // How strongly points pull toward their neighbors
  // Range: 0.01-1, recommended: 0.01
  private static readonly SPRING_STIFFNESS = 0.01;

  // How quickly spring oscillations settle
  // Range: 0.001-0.1, recommended: 0.1
  private static readonly SPRING_DAMPING = 0.1;

  private points: Point[];
  private prevStartX: number;
  private prevStartY: number;
  private prevEndX: number;
  private prevEndY: number;
  private active: boolean = true;
  private time: number = 0;

  constructor(x1: number, y1: number, x2: number, y2: number) {
    const startX = x1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY = y1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX = x2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY = y2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    this.points = this.initializePoints(startX, startY, endX, endY);
    this.prevStartX = startX;
    this.prevStartY = startY;
    this.prevEndX = endX;
    this.prevEndY = endY;
  }

  render(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = "cyan",
    lineWidth: number = 2,
    delta: number = 1 / 60,
  ): void {
    const startX = x1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY = y1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX = x2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY = y2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    const startForceX =
      (startX - this.prevStartX) * BeamEffect.MOTION_INFLUENCE * delta;
    const startForceY =
      (startY - this.prevStartY) * BeamEffect.MOTION_INFLUENCE * delta;
    const endForceX =
      (endX - this.prevEndX) * BeamEffect.MOTION_INFLUENCE * delta;
    const endForceY =
      (endY - this.prevEndY) * BeamEffect.MOTION_INFLUENCE * delta;

    for (let i = 1; i < 4; i++) {
      const influence = 1 - i / 4;
      this.points[i].x += startForceX * influence;
      this.points[i].y += startForceY * influence;
    }
    for (let i = this.points.length - 4; i < this.points.length - 1; i++) {
      const influence = 1 - (this.points.length - i) / 4;
      this.points[i].x += endForceX * influence;
      this.points[i].y += endForceY * influence;
    }

    this.simulateRope(startX, startY, endX, endY, delta);

    const ctx = Game.ctx;
    ctx.save();

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));

      const xIncrement = dx / steps;
      const yIncrement = dy / steps;

      let x = p1.x;
      let y = p1.y;

      for (let step = 0; step <= steps; step++) {
        for (let w = 0; w < lineWidth; w++) {
          for (let h = 0; h < lineWidth; h++) {
            ctx.fillStyle = color;
            ctx.fillRect(Math.round(x + w), Math.round(y + h), 1, 1);
          }
        }
        x += xIncrement;
        y += yIncrement;
      }
    }

    ctx.restore();

    this.prevStartX = startX;
    this.prevStartY = startY;
    this.prevEndX = endX;
    this.prevEndY = endY;
  }

  private initializePoints(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < BeamEffect.SEGMENTS; i++) {
      const t = i / (BeamEffect.SEGMENTS - 1);
      points.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
        oldX: startX + (endX - startX) * t,
        oldY: startY + (endY - startY) * t,
        velocityX: 0,
        velocityY: 0,
        angle: Math.random() * Math.PI * 2,
      });
    }
    return points;
  }

  private applyTurbulence(point: Point, index: number): void {
    point.angle +=
      Math.sin(this.time * 0.1 + index * 0.5) * BeamEffect.ANGLE_CHANGE;

    const turbulenceX = Math.cos(point.angle) * BeamEffect.TURBULENCE;
    const turbulenceY = Math.sin(point.angle) * BeamEffect.TURBULENCE;

    point.velocityX += turbulenceX;
    point.velocityY += turbulenceY;

    point.velocityX = Math.min(
      Math.max(point.velocityX, -BeamEffect.MAX_VELOCITY),
      BeamEffect.MAX_VELOCITY,
    );
    point.velocityY = Math.min(
      Math.max(point.velocityY, -BeamEffect.MAX_VELOCITY),
      BeamEffect.MAX_VELOCITY,
    );
  }

  private simulateRope(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    delta: number,
  ): void {
    const iterationsThisFrame = Math.ceil(BeamEffect.ITERATIONS * delta);

    for (let iteration = 0; iteration < iterationsThisFrame; iteration++) {
      for (let i = 1; i < this.points.length - 1; i++) {
        const point = this.points[i];
        const prevPoint = this.points[i - 1];
        const nextPoint = this.points[i + 1];

        const springForceXPrev =
          (prevPoint.x - point.x) * BeamEffect.SPRING_STIFFNESS * delta;
        const springForceYPrev =
          (prevPoint.y - point.y) * BeamEffect.SPRING_STIFFNESS * delta;
        const springForceXNext =
          (nextPoint.x - point.x) * BeamEffect.SPRING_STIFFNESS * delta;
        const springForceYNext =
          (nextPoint.y - point.y) * BeamEffect.SPRING_STIFFNESS * delta;

        this.applyTurbulence(point, i);

        point.velocityX =
          (point.velocityX + springForceXPrev + springForceXNext) *
          Math.pow(BeamEffect.DAMPING, delta);
        point.velocityY =
          (point.velocityY + springForceYPrev + springForceYNext) *
          Math.pow(BeamEffect.DAMPING, delta);

        const relativeVXPrev = (prevPoint.velocityX - point.velocityX) * delta;
        const relativeVYPrev = (prevPoint.velocityY - point.velocityY) * delta;
        const relativeVXNext = (nextPoint.velocityX - point.velocityX) * delta;
        const relativeVYNext = (nextPoint.velocityY - point.velocityY) * delta;

        point.velocityX +=
          (relativeVXPrev + relativeVXNext) * BeamEffect.SPRING_DAMPING;
        point.velocityY +=
          (relativeVYPrev + relativeVYNext) * BeamEffect.SPRING_DAMPING;

        point.oldX = point.x;
        point.oldY = point.y;

        point.x += point.velocityX * delta;
        point.y += point.velocityY * delta + BeamEffect.GRAVITY * delta * delta;
      }

      const segmentLength =
        Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) /
        (BeamEffect.SEGMENTS - 1);

      for (
        let constraintIteration = 0;
        constraintIteration < 2;
        constraintIteration++
      ) {
        for (let i = 0; i < this.points.length - 1; i++) {
          const p1 = this.points[i];
          const p2 = this.points[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const difference = segmentLength - distance;
          const percent = difference / distance / 2;
          const offsetX = dx * percent;
          const offsetY = dy * percent;

          if (i > 0) {
            p1.x -= offsetX * 1.5;
            p1.y -= offsetY * 1.5;
          }
          if (i < this.points.length - 2) {
            p2.x += offsetX * 1.5;
            p2.y += offsetY * 1.5;
          }
        }
      }
    }

    this.points[0].x = startX;
    this.points[0].y = startY;
    this.points[0].oldX = startX;
    this.points[0].oldY = startY;
    this.points[this.points.length - 1].x = endX;
    this.points[this.points.length - 1].y = endY;
    this.points[this.points.length - 1].oldX = endX;
    this.points[this.points.length - 1].oldY = endY;
  }

  static renderBeam(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = "cyan",
    lineWidth: number = 2,
  ): void {
    const ctx = Game.ctx;

    const startX = x1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY = y1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX = x2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY = y2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  }

  destroy(): void {
    this.active = false;
    this.points = [];
  }

  isActive(): boolean {
    return this.active;
  }
}
