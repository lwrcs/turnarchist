import { Entity } from "../entity/entity";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Particle } from "../particle/particle";
import { Projectile } from "./projectile";
import { Room } from "../room/room";
import { Random } from "../utility/random";
import { IdGenerator } from "../globalStateManager/IdGenerator";

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
}

export class BeamEffect extends Projectile {
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
  alpha: number = 1;
  targetX: number;
  targetY: number;
  color: string;
  compositeOperation: string;
  gravity: number = BeamEffect.GRAVITY;
  motionInfluence: number = BeamEffect.MOTION_INFLUENCE;
  turbulence: number = BeamEffect.TURBULENCE;
  velocityDecay: number = BeamEffect.VELOCITY_DECAY;
  angleChange: number = BeamEffect.ANGLE_CHANGE;
  maxVelocity: number = BeamEffect.MAX_VELOCITY;
  damping: number = BeamEffect.DAMPING;
  springStiffness: number = BeamEffect.SPRING_STIFFNESS;
  springDamping: number = BeamEffect.SPRING_DAMPING;
  iterations: number = BeamEffect.ITERATIONS;
  segments: number = BeamEffect.SEGMENTS;
  type: string;
  constructor(x1: number, y1: number, x2: number, y2: number, parent: Entity) {
    super(parent, x1, y1);
    const startX = x1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY = y1 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX = x2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY = y2 * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    this.x = x1;
    this.y = y1;
    this.targetX = x2;
    this.targetY = y2;

    this.points = this.initializePoints(startX, startY, endX, endY);
    this.prevStartX = startX;
    this.prevStartY = startY;
    this.prevEndX = endX;
    this.prevEndY = endY;
    this.color = "cyan";
    this.compositeOperation = "source-over";
  }
  /**
   * Sets the physics properties for the beam effect.
   *
   * @param {number} [gravity] - The gravitational force applied to the beam. Default: 2
   * @param {number} [motionInfluence] - The influence of motion on the beam. Default: 1
   * @param {number} [turbulence] - The turbulence applied to the beam. Default: 0.5
   * @param {number} [velocityDecay] - The rate at which velocity decays. Default: 0.1
   * @param {number} [angleChange] - The change in angle of the beam. Default: 0.01
   * @param {number} [maxVelocity] - The maximum velocity of the beam.
   * @param {number} [damping] - The damping factor for the beam's motion.
   * @param {number} [springStiffness] - The stiffness of the spring effect.
   * @param {number} [springDamping] - The damping of the spring effect.
   * @param {number} [iterations] - The number of iterations for the physics simulation.
   * @param {number} [segments] - The number of segments for the beam.
   */
  setPhysics(
    gravity?: number,
    motionInfluence?: number,
    turbulence?: number,
    velocityDecay?: number,
    angleChange?: number,
    maxVelocity?: number,
    damping?: number,
    springStiffness?: number,
    springDamping?: number,
    iterations?: number,
    segments?: number,
  ) {
    this.gravity = gravity ?? BeamEffect.GRAVITY;
    this.motionInfluence = motionInfluence ?? BeamEffect.MOTION_INFLUENCE;
    this.turbulence = turbulence ?? BeamEffect.TURBULENCE;
    this.velocityDecay = velocityDecay ?? BeamEffect.VELOCITY_DECAY;
    this.angleChange = angleChange ?? BeamEffect.ANGLE_CHANGE;
    this.maxVelocity = maxVelocity ?? BeamEffect.MAX_VELOCITY;
    this.damping = damping ?? BeamEffect.DAMPING;
    this.springStiffness = springStiffness ?? BeamEffect.SPRING_STIFFNESS;
    this.springDamping = springDamping ?? BeamEffect.SPRING_DAMPING;
    this.iterations = iterations ?? BeamEffect.ITERATIONS;
    this.segments = segments ?? BeamEffect.SEGMENTS;
  }

  setTarget(x: number, y: number, x2: number, y2: number) {
    this.x = x;
    this.y = y;
    this.targetX = x2;
    this.targetY = y2;
  }

  render(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = this.color,
    lineWidth: number = 2,
    delta: number = 1 / 60,
    compositeOperation: string = this.compositeOperation,
  ): void {
    const startX =
      this.x * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY =
      this.y * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX =
      this.targetX * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY =
      this.targetY * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    const startForceX =
      (startX - this.prevStartX) * this.motionInfluence * delta;
    const startForceY =
      (startY - this.prevStartY) * this.motionInfluence * delta;
    const endForceX = (endX - this.prevEndX) * this.motionInfluence * delta;
    const endForceY = (endY - this.prevEndY) * this.motionInfluence * delta;

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
    Game.ctx.globalCompositeOperation =
      compositeOperation as GlobalCompositeOperation;
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
    for (let i = 0; i < this.segments; i++) {
      const t = i / (this.segments - 1);
      points.push({
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
        oldX: startX + (endX - startX) * t,
        oldY: startY + (endY - startY) * t,
        velocityX: 0,
        velocityY: 0,
        angle: Random.rand() * Math.PI * 2,
      });
    }
    return points;
  }

  private applyTurbulence(point: Point, index: number): void {
    point.angle += Math.sin(this.time * 0.1 + index * 0.5) * this.angleChange;

    const turbulenceX = Math.cos(point.angle) * this.turbulence;
    const turbulenceY = Math.sin(point.angle) * this.turbulence;

    point.velocityX += turbulenceX;
    point.velocityY += turbulenceY;

    point.velocityX = Math.min(
      Math.max(point.velocityX, -this.maxVelocity),
      this.maxVelocity,
    );
    point.velocityY = Math.min(
      Math.max(point.velocityY, -this.maxVelocity),
      this.maxVelocity,
    );
  }

  tick = () => {
    if (this.parent.dead) {
      this.destroy();
    }
  };

  private simulateRope(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    delta: number,
  ): void {
    const iterationsThisFrame = Math.ceil(this.iterations * delta);

    for (let iteration = 0; iteration < iterationsThisFrame; iteration++) {
      for (let i = 1; i < this.points.length - 1; i++) {
        const point = this.points[i];
        const prevPoint = this.points[i - 1];
        const nextPoint = this.points[i + 1];

        const springForceXPrev = (prevPoint.x - point.x) * this.springStiffness;
        const springForceYPrev = (prevPoint.y - point.y) * this.springStiffness;
        const springForceXNext = (nextPoint.x - point.x) * this.springStiffness;
        const springForceYNext = (nextPoint.y - point.y) * this.springStiffness;

        this.applyTurbulence(point, i);

        point.velocityX =
          (point.velocityX + springForceXPrev + springForceXNext) *
          this.damping;
        point.velocityY =
          (point.velocityY + springForceYPrev + springForceYNext) *
          this.damping;

        const relativeVXPrev = prevPoint.velocityX - point.velocityX;
        const relativeVYPrev = prevPoint.velocityY - point.velocityY;
        const relativeVXNext = nextPoint.velocityX - point.velocityX;
        const relativeVYNext = nextPoint.velocityY - point.velocityY;

        point.velocityX +=
          (relativeVXPrev + relativeVXNext) * this.springDamping;
        point.velocityY +=
          (relativeVYPrev + relativeVYNext) * this.springDamping;

        point.oldX = point.x;
        point.oldY = point.y;

        point.x += point.velocityX;
        point.y += point.velocityY + this.gravity;
      }

      const segmentLength =
        Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) /
        (this.segments - 1);

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

  draw = (delta: number) => {
    this.drawableY = this.y - 0.01;
    this.render(
      this.targetX,
      this.targetY,
      this.x,
      this.y,
      this.color,
      2,
      delta,
      this.compositeOperation,
    );
  };

  static renderBeam(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = "cyan",
    lineWidth: number = 2,
    alpha: number = 1,
  ): void {
    const ctx = Game.ctx;
    ctx.globalAlpha = alpha;

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
    this.dead = true;
  }

  isActive(): boolean {
    return this.active;
  }
}
