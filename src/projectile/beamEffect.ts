import { Entity } from "../entity/entity";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Particle } from "../particle/particle";
import { Projectile } from "./projectile";
import { Room } from "../room/room";
import { Random } from "../utility/random";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { Door } from "../tile/door";
import { Player } from "../player/player";

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  velocityX: number;
  velocityY: number;
  angle: number;
}

export interface BeamAttachmentControl {
  angle: number;
  weight?: number;
  influence?: number;
  lengthScale?: number;
  influenceDistance?: number;
}

export interface BeamGuideNode {
  x: number;
  y: number;
  tPosition: number;
  weight?: number;
  influenceDistance?: number;
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

  private static offscreenCanvas: HTMLCanvasElement | null = null;
  private static offscreenCtx: CanvasRenderingContext2D | null = null;

  private static getOffscreenCtx(
    width: number,
    height: number,
  ): CanvasRenderingContext2D {
    if (!BeamEffect.offscreenCanvas) {
      BeamEffect.offscreenCanvas = document.createElement("canvas");
      BeamEffect.offscreenCanvas.width = width;
      BeamEffect.offscreenCanvas.height = height;
      BeamEffect.offscreenCtx =
        BeamEffect.offscreenCanvas.getContext("2d")!;
    } else if (
      BeamEffect.offscreenCanvas.width !== width ||
      BeamEffect.offscreenCanvas.height !== height
    ) {
      BeamEffect.offscreenCanvas.width = width;
      BeamEffect.offscreenCanvas.height = height;
    }
    return BeamEffect.offscreenCtx!;
  }

  protected points: Point[];
  private prevStartX: number;
  private prevStartY: number;
  private prevEndX: number;
  private prevEndY: number;
  private active: boolean = true;
  private time: number = 0;
  private attachmentInfluence: number[] = [];
  private hostRoom?: Room;
  private colorCache?: {
    source: string;
    r: number;
    g: number;
    b: number;
    a: number;
  };
  drawOnTop: boolean = false;
  alpha: number = 1;
  lineWidth: number = 2;
  targetX: number;
  targetY: number;
  color: string;
  compositeOperation: string;
  startAttachment?: "player" | "tile";
  endAttachment?: "player" | "tile";
  startControl?: BeamAttachmentControl;
  endControl?: BeamAttachmentControl;
  guideNodes: BeamGuideNode[] = [];
  oxygenTraversalIndex?: number;
  /** When true, skips spring physics entirely and places points geometrically along the guide-node polyline. Beam snaps instantly to new positions; no oscillation. */
  disableSimulation: boolean = false;
  /** Fixed physical length of the rope in pixels. When nonzero, overrides the head-to-tail distance calculation so the rope maintains this length regardless of endpoint positions. */
  naturalLength: number = 0;
  /** If nonzero, draw a second copy of the beam shifted by this many pixels in Y (use negative for upward). */
  shadowOffsetY: number = 0;
  /** Color for the shadow (offset) beam layer. Falls back to `color` if null. */
  shadowBeamColor: string | null = null;
  /** If set, draw a 1-pixel outline of this color around the combined beam shape. */
  beamOutlineColor: string | null = null;
  /** When false, getBrightnessAt always returns 1 (beam color is unmodulated by room lighting). Shade comes from applyInlineShadeOverlayForCanvas instead. */
  useBrightnessSampling: boolean = true;
  /** Resistance to direction changes along the rope. Each point is pulled toward the midpoint of its neighbours, smoothing sharp bends into gradual arcs. */
  bendingStiffness: number = 0;
  /** Width at the tail end of the beam (t=1). When > 0 and < lineWidth, beam tapers toward the tail. 0 = no taper. */
  tailWidth: number = 0;
  /** t-fraction at which tail tapering begins. 0 = linear from start; e.g. 0.75 keeps body at full width and only tapers the last 25%. */
  tailTaperStart: number = 0;
  /** Width at the very tip of the head (t=0). 0 = no head taper. Drives a circular curve to headNeckWidth, then widens to lineWidth. */
  headTipWidth: number = 0;
  /** Width at the neck dip, between the tip and the body. Only used when headTipWidth > 0. */
  headNeckWidth: number = 0;
  /** Fraction of the beam (from t=0) that forms the head+neck zone. */
  headTaperLength: number = 0.25;
  /** Pixel length of the nose taper zone (headTipWidth → headPeakWidth). Default 3 for backward compat. */
  headNosePx: number = 3;
  /** Maximum head width at the widest point (just after the nose). 0 = no peak (head stays ≤ lineWidth). */
  headPeakWidth: number = 0;
  /** Pixels along the body axis from the nose tip where eyes are placed. */
  eyeSetback: number = 1;
  /** Per-instance canvases for the dual-layer + outline compositing pass. */
  private _beamCompositeCanvas: HTMLCanvasElement | null = null;
  private _beamCompositeCtx: CanvasRenderingContext2D | null = null;
  private _beamOutlineCanvas: HTMLCanvasElement | null = null;
  private _beamOutlineCtx: CanvasRenderingContext2D | null = null;
  private _tileShadeSmallCanvas: HTMLCanvasElement | null = null;
  private _tileShadeSmallCtx: CanvasRenderingContext2D | null = null;
  private _tileShadeLargeCanvas: HTMLCanvasElement | null = null;
  private _tileShadeLargeCtx: CanvasRenderingContext2D | null = null;
  private _renderAccum: number = 0;
  private _lastOriginX: number = 0;
  private _lastOriginY: number = 0;
  private _hasCachedFrame: boolean = false;
  /** Cap visual redraws per second (0 = unlimited). Physics simulation is unaffected. */
  renderFps: number = 0;
  /** If set, draw two 1-px eye pixels at the head, perpendicular to the beam direction. */
  eyeColor: string | null = null;
  /** When false, stripe shading on the beam is disabled (both color layers drawn solid). */
  showStripes: boolean = true;
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
  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    parent: Entity | Player,
  ) {
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

  private applyAttachmentControl(
    isStart: boolean,
    anchorX: number,
    anchorY: number,
    segmentLength: number,
  ) {
    const control = isStart ? this.startControl : this.endControl;
    if (!control) return;

    const dirX = Math.cos(control.angle);
    const dirY = Math.sin(control.angle);
    const baseWeight = this.clamp01(control.weight ?? 0.6);
    const scale = control.lengthScale ?? 1;

    const influenceTiles =
      control.influenceDistance ??
      (control.influence !== undefined ? control.influence : 3);
    const influenceDistancePx = influenceTiles * GameConstants.TILESIZE;

    if (influenceDistancePx <= 0) return;

    const maxSegments = Math.min(
      this.points.length - 2,
      Math.max(
        1,
        Math.floor(influenceDistancePx / Math.max(segmentLength, 1e-4)),
      ),
    );

    for (let i = 1; i <= maxSegments; i++) {
      const idx = isStart ? i : this.points.length - 1 - i;
      if (idx <= 0 || idx >= this.points.length - 1) continue;

      const distanceAlong = segmentLength * i;
      const ratio = Math.min(1, distanceAlong / influenceDistancePx);
      const falloff = Math.pow(1 - ratio, 2);
      const weight = baseWeight * falloff;
      if (weight <= 0) continue;

      const targetX = anchorX + dirX * distanceAlong * scale;
      const targetY = anchorY + dirY * distanceAlong * scale;

      const prevInfluence = this.attachmentInfluence[idx] ?? 0;
      if (weight <= prevInfluence) continue;
      this.attachmentInfluence[idx] = weight;

      this.points[idx].x = this.lerp(this.points[idx].x, targetX, weight);
      this.points[idx].y = this.lerp(this.points[idx].y, targetY, weight);
    }
  }

  setGuideNodes(nodes: BeamGuideNode[]) {
    this.guideNodes = nodes;
  }

  private applyGuideNode(node: BeamGuideNode, segmentLength: number) {
    if (this.points.length < 2) return;
    const anchorX =
      node.x * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const anchorY =
      node.y * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    const baseWeight = this.clamp01(node.weight ?? 0.85);
    const influenceTiles = node.influenceDistance ?? 1.5;
    const influenceDistancePx = influenceTiles * GameConstants.TILESIZE;
    if (influenceDistancePx <= 0) return;

    const lastIdx = this.points.length - 1;
    const tClamped = Math.min(1, Math.max(0, node.tPosition));
    const centerIdx = Math.round(tClamped * lastIdx);

    // Pin the center point directly to the anchor (no falloff at center).
    if (centerIdx > 0 && centerIdx < lastIdx) {
      const prevInfluence = this.attachmentInfluence[centerIdx] ?? 0;
      if (baseWeight > prevInfluence) {
        this.attachmentInfluence[centerIdx] = baseWeight;
        this.points[centerIdx].x = this.lerp(
          this.points[centerIdx].x,
          anchorX,
          baseWeight,
        );
        this.points[centerIdx].y = this.lerp(
          this.points[centerIdx].y,
          anchorY,
          baseWeight,
        );
      }
    }

    const maxSegments = Math.max(
      1,
      Math.floor(influenceDistancePx / Math.max(segmentLength, 1e-4)),
    );

    for (let i = 1; i <= maxSegments; i++) {
      const distanceAlong = segmentLength * i;
      const ratio = Math.min(1, distanceAlong / influenceDistancePx);
      const falloff = Math.pow(1 - ratio, 2);
      const weight = baseWeight * falloff;
      if (weight <= 0) continue;

      for (const idx of [centerIdx - i, centerIdx + i]) {
        if (idx <= 0 || idx >= lastIdx) continue;
        const prevInfluence = this.attachmentInfluence[idx] ?? 0;
        if (weight <= prevInfluence) continue;
        this.attachmentInfluence[idx] = weight;
        this.points[idx].x = this.lerp(this.points[idx].x, anchorX, weight);
        this.points[idx].y = this.lerp(this.points[idx].y, anchorY, weight);
      }
    }
  }

  private clamp01(value: number): number {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private resetAttachmentInfluence() {
    if (this.attachmentInfluence.length !== this.points.length) {
      this.attachmentInfluence = new Array(this.points.length).fill(0);
    } else {
      this.attachmentInfluence.fill(0);
    }
  }

  private getBrightnessAt(px: number, py: number): number {
    if (!this.hostRoom || !this.useBrightnessSampling) return 1;
    const tileX = Math.floor(px / GameConstants.TILESIZE);
    const tileY = Math.floor(py / GameConstants.TILESIZE);

    let bestVis = this.sampleVisibility(this.hostRoom, tileX, tileY);
    const door = this.hostRoom.roomArray?.[tileX]?.[tileY];
    if (door instanceof Door && door.linkedDoor?.room) {
      const linkedRoom = door.linkedDoor.room;
      const linkedVis = this.sampleVisibility(
        linkedRoom,
        door.linkedDoor.x,
        door.linkedDoor.y,
      );
      bestVis = Math.min(bestVis, linkedVis);
    }

    return 1 - bestVis;
  }

  private sampleVisibility(room: Room, x: number, y: number): number {
    const visRow = room.softVis?.[x];
    if (!visRow) return 1;
    const vis = visRow[y];
    if (vis === undefined) return 1;
    return Math.max(0, Math.min(1, vis));
  }

  private getColorWithBrightness(
    baseColor: string,
    brightness: number,
    alpha: number,
  ): string {
    const comps = this.getColorComponents(baseColor);
    const clampB = this.clamp01(brightness);
    const r = Math.round(comps.r * clampB);
    const g = Math.round(comps.g * clampB);
    const b = Math.round(comps.b * clampB);
    const finalAlpha = comps.a * alpha;
    return `rgba(${r},${g},${b},${finalAlpha})`;
  }

  private getColorComponents(color: string) {
    if (this.colorCache && this.colorCache.source === color) {
      return this.colorCache;
    }
    let r = 135;
    let g = 206;
    let b = 235;
    let a = 1;
    const normalized = (color || "").trim().toLowerCase();
    if (normalized.startsWith("#")) {
      const hex = normalized.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6 || hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) {
          a = parseInt(hex.slice(6, 8), 16) / 255;
        }
      }
    } else if (normalized.startsWith("rgba")) {
      const parts = normalized
        .replace("rgba", "")
        .replace("(", "")
        .replace(")", "")
        .split(",")
        .map((p) => p.trim());
      r = parseFloat(parts[0]) || r;
      g = parseFloat(parts[1]) || g;
      b = parseFloat(parts[2]) || b;
      a = parseFloat(parts[3]) || a;
    } else if (normalized.startsWith("rgb")) {
      const parts = normalized
        .replace("rgb", "")
        .replace("(", "")
        .replace(")", "")
        .split(",")
        .map((p) => p.trim());
      r = parseFloat(parts[0]) || r;
      g = parseFloat(parts[1]) || g;
      b = parseFloat(parts[2]) || b;
    }
    this.colorCache = { source: color, r, g, b, a };
    return this.colorCache;
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

  setAttachmentControls(
    start?: BeamAttachmentControl,
    end?: BeamAttachmentControl,
  ) {
    this.startControl = start;
    this.endControl = end;
  }

  setHostRoom(room: Room) {
    this.hostRoom = room;
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
    skipDrawing: boolean = false,
    simulate: boolean = true,
  ): void {
    const startX =
      this.x * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const startY =
      this.y * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endX =
      this.targetX * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;
    const endY =
      this.targetY * GameConstants.TILESIZE + 0.5 * GameConstants.TILESIZE;

    if (simulate) {
      if (this.disableSimulation) {
        this._repositionAlongWaypoints(startX, startY, endX, endY);
      } else {
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
      }
    }

    if (skipDrawing) {
      this.prevStartX = startX;
      this.prevStartY = startY;
      this.prevEndX = endX;
      this.prevEndY = endY;
      return;
    }

    // Visual-frame throttle: simulate every frame but only redraw at renderFps.
    if (this.renderFps > 0) {
      this._renderAccum += delta;
      const frameInterval = 1 / this.renderFps;
      if (this._renderAccum < frameInterval) {
        if (this._hasCachedFrame) this._reblitLastFrame();
        this.prevStartX = startX;
        this.prevStartY = startY;
        this.prevEndX = endX;
        this.prevEndY = endY;
        return;
      }
      this._renderAccum -= frameInterval;
    }

    // Dual-layer (shadow copy) or outlined beam: compositing path
    if (this.shadowOffsetY !== 0 || this.beamOutlineColor !== null) {
      this._renderWithComposite(color, lineWidth);
      this.prevStartX = startX;
      this.prevStartY = startY;
      this.prevEndX = endX;
      this.prevEndY = endY;
      return;
    }

    const ctx = Game.ctx;
    const mainCanvas = ctx.canvas;
    const useOffscreen = this.alpha < 1;

    let drawCtx: CanvasRenderingContext2D;
    if (useOffscreen) {
      const offCtx = BeamEffect.getOffscreenCtx(
        mainCanvas.width,
        mainCanvas.height,
      );
      // Clear in identity space, then mirror the main canvas transform so
      // beam pixels land at the same screen positions as they would on Game.ctx.
      const cameraTransform = ctx.getTransform();
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
      offCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
      offCtx.setTransform(cameraTransform);
      offCtx.globalCompositeOperation =
        compositeOperation as GlobalCompositeOperation;
      drawCtx = offCtx;
    } else {
      ctx.save();
      ctx.globalCompositeOperation =
        compositeOperation as GlobalCompositeOperation;
      drawCtx = ctx;
    }

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
        const brightness = this.getBrightnessAt(x, y);
        const adjustedColor = this.getColorWithBrightness(
          color,
          brightness,
          useOffscreen ? 1 : this.alpha,
        );
        const half = lineWidth / 2;
        for (let w = 0; w < lineWidth; w++) {
          for (let h = 0; h < lineWidth; h++) {
            drawCtx.fillStyle = adjustedColor;
            drawCtx.fillRect(Math.round(x - half + w), Math.round(y - half + h), 1, 1);
          }
        }
        x += xIncrement;
        y += yIncrement;
      }
    }

    if (useOffscreen) {
      // Blit the offscreen canvas onto Game.ctx in raw screen pixels —
      // reset the transform so drawImage is 1:1, not camera-offset.
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(BeamEffect.offscreenCanvas!, 0, 0);
      ctx.restore();
    } else {
      ctx.restore();
    }

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

  private _getBeamBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (this.shadowOffsetY !== 0) {
        const sy = p.y + this.shadowOffsetY;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
  }

  private _headWidthAt(headPx: number, lineWidth: number): number | null {
    if (this.headTipWidth <= 0) return null;
    const nosePx = this.headNosePx;
    const peakWidth = this.headPeakWidth > 0 ? this.headPeakWidth : lineWidth;
    // Nose zone: headTipWidth → peakWidth over nosePx pixels.
    if (headPx < nosePx) {
      const f = nosePx > 1 ? headPx / (nosePx - 1) : 1;
      return Math.max(1, Math.round(this.headTipWidth + (peakWidth - this.headTipWidth) * f));
    }
    // Post-nose zone: peakWidth → (optional neck dip) → lineWidth.
    const hasNeck = this.headNeckWidth > 0 && this.headNeckWidth < peakWidth;
    const neckPx = Math.max(2, Math.ceil(nosePx * 0.65));
    const postOffset = headPx - nosePx;
    if (hasNeck && postOffset < neckPx) {
      // First half: peak → neck (linear descent).
      const f = postOffset / neckPx;
      return Math.max(1, Math.round(peakWidth - (peakWidth - this.headNeckWidth) * Math.sin(Math.PI * f * 0.5)));
    }
    // Widen from neck (or peak) back to lineWidth over the same neckPx window.
    const riseStart = hasNeck ? neckPx : 0;
    const riseOffset = postOffset - riseStart;
    const risePx = Math.max(2, Math.ceil(nosePx * 0.65));
    if (riseOffset < risePx) {
      const fromW = hasNeck ? this.headNeckWidth : peakWidth;
      if (fromW !== lineWidth) {
        const f = riseOffset / risePx;
        return Math.max(1, Math.round(fromW + (lineWidth - fromW) * Math.sin(Math.PI * f * 0.5)));
      }
    }
    return null;
  }

  private _getSegmentWidth(t: number, lineWidth: number): number {
    // Tail zone only — head steps are applied per-segment-index in _drawBeamPassToCtx.
    if (this.tailWidth > 0 && this.tailWidth < lineWidth) {
      const start = this.tailTaperStart;
      if (t >= start) {
        const f = start < 1 ? (t - start) / (1 - start) : 1;
        return Math.max(this.tailWidth, Math.round(lineWidth + (this.tailWidth - lineWidth) * f));
      }
    }
    return lineWidth;
  }

  private _drawBeamPassToCtx(
    ctx: CanvasRenderingContext2D,
    offX: number,
    offY: number,
    color: string,
    lineWidth: number,
    dynamicOffsetY: number = 0,
  ): void {
    const n = this.points.length;
    const hasTaper = (this.tailWidth > 0 && this.tailWidth < lineWidth) || this.headTipWidth > 0;

    const comps = this.getColorComponents(color);
    const sf = 0.75;
    const stripeColor = `rgb(${Math.round(comps.r * sf)},${Math.round(comps.g * sf)},${Math.round(comps.b * sf)})`;

    let headPx = 0;
    for (let i = 0; i < n - 1; i++) {
      const t = i / Math.max(1, n - 2);
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;
      const steps = Math.max(1, Math.round(Math.max(Math.abs(pdx), Math.abs(pdy))));
      const xInc = pdx / steps;
      const yInc = pdy / steps;
      let wx = p1.x;
      let wy = p1.y;
      for (let step = 0; step <= steps; step++) {
        let segWidth: number;
        const headW = this._headWidthAt(headPx, lineWidth);
        if (headW !== null) {
          segWidth = headW;
        } else {
          segWidth = hasTaper ? this._getSegmentWidth(t, lineWidth) : lineWidth;
        }
        const half = Math.floor(segWidth / 2);
        const segOffY = dynamicOffsetY !== 0 && hasTaper
          ? Math.round(dynamicOffsetY * (segWidth / lineWidth))
          : dynamicOffsetY;
        const cx = Math.round(wx + offX);
        const cy = Math.round(wy + offY + segOffY);
        ctx.fillStyle = (this.showStripes && (headPx % 6) < 3) ? stripeColor : color;
        for (let w = 0; w < segWidth; w++) {
          for (let h = 0; h < segWidth; h++) {
            ctx.fillRect(cx - half + w, cy - half + h, 1, 1);
          }
        }
        wx += xInc;
        wy += yInc;
        headPx++;
      }
    }
  }

  private _drawBeamOrientedRibbon(
    ctx: CanvasRenderingContext2D,
    offX: number,
    offY: number,
    color: string,
    lineWidth: number,
    dynamicOffsetY: number = 0,
  ): void {
    const n = this.points.length;
    if (n < 2) return;
    const hasTaper = (this.tailWidth > 0 && this.tailWidth < lineWidth) || this.headTipWidth > 0;
    const comps = this.getColorComponents(color);
    const sf = 0.75;
    const stripeColor = `rgb(${Math.round(comps.r * sf)},${Math.round(comps.g * sf)},${Math.round(comps.b * sf)})`;

    // Compute total arc length of the rendered path.
    let totalArcLen = 0;
    for (let i = 1; i < n; i++) {
      const dx = this.points[i].x - this.points[i - 1].x;
      const dy = this.points[i].y - this.points[i - 1].y;
      totalArcLen += Math.sqrt(dx * dx + dy * dy);
    }
    // Two stripe bands per body segment (×2 density): interior guide nodes map 2:1 to
    // actual segments, so (interiorCount + 1) bands per segment half-period.
    const interiorNodes = this.guideNodes.filter(gn => gn.tPosition > 0 && gn.tPosition < 1).length;
    const stripeHalfPeriod = Math.max(1, totalArcLen / Math.max(1, (interiorNodes + 1) * 2));

    let headPx = 0;
    let arcLen = 0;
    for (let i = 0; i < n - 1; i++) {
      const t = i / Math.max(1, n - 2);
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const pdx = p2.x - p1.x;
      const pdy = p2.y - p1.y;
      const segLen = Math.sqrt(pdx * pdx + pdy * pdy);
      // Perpendicular unit vector (90° CCW of tangent); integer-rounded per pixel below.
      const perpX = segLen > 0 ? -pdy / segLen : 0;
      const perpY = segLen > 0 ?  pdx / segLen : 1;

      // ceil(segLen) ensures step size ≤ 1 px — no tangent-direction pixel rows are skipped.
      const steps = Math.max(1, Math.ceil(segLen));
      const xInc = pdx / steps;
      const yInc = pdy / steps;
      const arcInc = segLen / steps;
      let wx = p1.x;
      let wy = p1.y;
      for (let step = 0; step <= steps; step++) {
        let segWidth: number;
        const headW = this._headWidthAt(headPx, lineWidth);
        if (headW !== null) {
          segWidth = headW;
        } else {
          segWidth = hasTaper ? this._getSegmentWidth(t, lineWidth) : lineWidth;
        }
        const half = Math.floor(segWidth / 2);
        const segOffY = dynamicOffsetY !== 0 && hasTaper
          ? Math.round(dynamicOffsetY * (segWidth / lineWidth))
          : dynamicOffsetY;
        const cx = Math.round(wx + offX);
        const cy = Math.round(wy + offY + segOffY);
        ctx.fillStyle = (this.showStripes && (Math.floor(arcLen / stripeHalfPeriod) % 2 === 0)) ? stripeColor : color;
        // Integer-only fillRect per pixel — pixel-perfect, no canvas anti-aliasing.
        for (let w = 0; w < segWidth; w++) {
          const offset = w - half;
          ctx.fillRect(cx + Math.round(perpX * offset), cy + Math.round(perpY * offset), 1, 1);
        }
        wx += xInc;
        wy += yInc;
        arcLen += arcInc;
        headPx++;
      }
    }
  }

  private _applyTileShadeOverlay(
    maskCanvas: HTMLCanvasElement,
    originX: number,
    originY: number,
  ): void {
    if (!this.hostRoom) return;
    const ts = GameConstants.TILESIZE;
    const blurPad = 2; // extra tile padding so blur doesn't clip at canvas edge

    const minTX = Math.floor(originX / ts) - blurPad;
    const minTY = Math.floor(originY / ts) - blurPad;
    const maxTX = Math.ceil((originX + maskCanvas.width) / ts) + blurPad;
    const maxTY = Math.ceil((originY + maskCanvas.height) / ts) + blurPad;
    const numTX = maxTX - minTX;
    const numTY = maxTY - minTY;
    if (numTX <= 0 || numTY <= 0) return;

    // Small canvas: 1 px per tile — stores softVis shade alpha per tile.
    if (
      !this._tileShadeSmallCanvas ||
      this._tileShadeSmallCanvas.width < numTX ||
      this._tileShadeSmallCanvas.height < numTY
    ) {
      this._tileShadeSmallCanvas = document.createElement("canvas");
      this._tileShadeSmallCanvas.width = numTX;
      this._tileShadeSmallCanvas.height = numTY;
      this._tileShadeSmallCtx = this._tileShadeSmallCanvas.getContext("2d")!;
    }
    const sCtx = this._tileShadeSmallCtx!;
    sCtx.clearRect(0, 0, numTX, numTY);
    for (let dtx = 0; dtx < numTX; dtx++) {
      for (let dty = 0; dty < numTY; dty++) {
        const sv = this.hostRoom.softVis?.[minTX + dtx]?.[minTY + dty] ?? 0;
        if (sv <= 0) continue;
        sCtx.globalAlpha = sv;
        sCtx.fillStyle = "#000";
        sCtx.fillRect(dtx, dty, 1, 1);
      }
    }
    sCtx.globalAlpha = 1;

    // Large canvas: full-pixel scale-up of the small canvas, blurred.
    const largeW = numTX * ts;
    const largeH = numTY * ts;
    if (
      !this._tileShadeLargeCanvas ||
      this._tileShadeLargeCanvas.width < largeW ||
      this._tileShadeLargeCanvas.height < largeH
    ) {
      this._tileShadeLargeCanvas = document.createElement("canvas");
      this._tileShadeLargeCanvas.width = largeW;
      this._tileShadeLargeCanvas.height = largeH;
      this._tileShadeLargeCtx = this._tileShadeLargeCanvas.getContext("2d")!;
    }
    const lCtx = this._tileShadeLargeCtx!;
    lCtx.clearRect(0, 0, largeW, largeH);

    // Scale small → large with bilinear interpolation and apply blur in one pass.
    lCtx.imageSmoothingEnabled = true;
    (lCtx as any).imageSmoothingQuality = "high";
    lCtx.filter = `blur(${Math.round(ts * 0.5)}px)`;
    lCtx.drawImage(this._tileShadeSmallCanvas!, 0, 0, numTX, numTY, 0, 0, largeW, largeH);
    lCtx.filter = "none";

    // Mask to beam shape: keep only pixels where the beam canvas has pixels.
    const beamOffX = originX - minTX * ts;
    const beamOffY = originY - minTY * ts;
    lCtx.imageSmoothingEnabled = false;
    lCtx.globalCompositeOperation = "destination-in";
    lCtx.drawImage(maskCanvas, beamOffX, beamOffY);
    lCtx.globalCompositeOperation = "source-over";

    // Blit masked shade onto Game.ctx. Do not override globalAlpha here — the
    // caller (draw()) already set it to the entity's fading alpha, so the shade
    // blit inherits the same fade as the beam canvases above it.
    Game.ctx.drawImage(
      this._tileShadeLargeCanvas!,
      0, 0, largeW, largeH,
      minTX * ts, minTY * ts, largeW, largeH,
    );
  }

  private _drawBeamEyes(): void {
    if (!this.eyeColor || this.points.length < 2) return;
    const p0 = this.points[0];
    const p1 = this.points[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return;
    // Unit vector toward body from head tip.
    const nx = dx / len;
    const ny = dy / len;
    // Perpendicular (side) direction.
    const perpX = -ny;
    const perpY = nx;
    const bx = p0.x + nx * this.eyeSetback;
    const by = p0.y + ny * this.eyeSetback - 5;
    Game.ctx.fillStyle = this.eyeColor;
    Game.ctx.fillRect(Math.round(bx + perpX * 2), Math.round(by + perpY * 2), 2, 2);
    Game.ctx.fillRect(Math.round(bx - perpX * 2), Math.round(by - perpY * 2), 2, 2);
  }

  private _reblitLastFrame(): void {
    if (!this._beamCompositeCanvas) return;
    const prevOp = Game.ctx.globalCompositeOperation;
    if (prevOp !== this.compositeOperation) {
      Game.ctx.globalCompositeOperation = this.compositeOperation as GlobalCompositeOperation;
    }
    if (this.beamOutlineColor && this._beamOutlineCanvas) {
      Game.ctx.drawImage(this._beamOutlineCanvas, this._lastOriginX, this._lastOriginY);
    }
    Game.ctx.drawImage(this._beamCompositeCanvas, this._lastOriginX, this._lastOriginY);
    if (Game.ctx.globalCompositeOperation !== prevOp) {
      Game.ctx.globalCompositeOperation = prevOp;
    }
    if (this.useBrightnessSampling) {
      this._applyTileShadeOverlay(this._beamCompositeCanvas, this._lastOriginX, this._lastOriginY);
      if (this.beamOutlineColor && this._beamOutlineCanvas) {
        this._applyTileShadeOverlay(this._beamOutlineCanvas, this._lastOriginX, this._lastOriginY);
      }
    } else {
      this.hostRoom?.applyInlineShadeOverlayForCanvas(this._beamCompositeCanvas, this._lastOriginX, this._lastOriginY);
      if (this.beamOutlineColor && this._beamOutlineCanvas) {
        this.hostRoom?.applyInlineShadeOverlayForCanvas(this._beamOutlineCanvas, this._lastOriginX, this._lastOriginY);
      }
    }
    this._drawBeamEyes();
  }

  private _renderWithComposite(color: string, lineWidth: number): void {
    if (this.points.length < 2) return;

    const lhalf = Math.ceil(Math.max(lineWidth, this.headPeakWidth) / 2);
    const pad = lhalf + (this.beamOutlineColor ? 1 : 0) + 1;
    const bounds = this._getBeamBounds();
    const originX = Math.floor(bounds.minX) - pad;
    const originY = Math.floor(bounds.minY) - pad;
    const cW = Math.ceil(bounds.maxX - bounds.minX) + 2 * pad + 1;
    const cH = Math.ceil(bounds.maxY - bounds.minY) + 2 * pad + 1;
    if (cW <= 0 || cH <= 0) return;

    if (
      !this._beamCompositeCanvas ||
      this._beamCompositeCanvas.width < cW ||
      this._beamCompositeCanvas.height < cH
    ) {
      this._beamCompositeCanvas = document.createElement("canvas");
      this._beamCompositeCanvas.width = cW;
      this._beamCompositeCanvas.height = cH;
      this._beamCompositeCtx = this._beamCompositeCanvas.getContext("2d")!;
    }
    const cCtx = this._beamCompositeCtx!;
    const cCanvas = this._beamCompositeCanvas!;

    this._lastOriginX = originX;
    this._lastOriginY = originY;
    this._hasCachedFrame = true;

    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    cCtx.globalCompositeOperation = "source-over";
    const offX = -originX;
    const offY = -originY;
    const drawPass = this.disableSimulation
      ? this._drawBeamOrientedRibbon.bind(this)
      : this._drawBeamPassToCtx.bind(this);
    drawPass(cCtx, offX, offY, color, lineWidth);
    if (this.shadowOffsetY !== 0) {
      drawPass(cCtx, offX, offY, this.shadowBeamColor ?? color, lineWidth, this.shadowOffsetY);
    }

    const prevOp = Game.ctx.globalCompositeOperation;
    if (prevOp !== this.compositeOperation) {
      Game.ctx.globalCompositeOperation = this.compositeOperation as GlobalCompositeOperation;
    }

    if (this.beamOutlineColor) {
      if (
        !this._beamOutlineCanvas ||
        this._beamOutlineCanvas.width < cCanvas.width ||
        this._beamOutlineCanvas.height < cCanvas.height
      ) {
        this._beamOutlineCanvas = document.createElement("canvas");
        this._beamOutlineCanvas.width = cCanvas.width;
        this._beamOutlineCanvas.height = cCanvas.height;
        this._beamOutlineCtx = this._beamOutlineCanvas.getContext("2d")!;
      }
      const oCtx = this._beamOutlineCtx!;
      const oCanvas = this._beamOutlineCanvas!;
      oCtx.clearRect(0, 0, oCanvas.width, oCanvas.height);
      oCtx.globalCompositeOperation = "source-over";
      // 4-directional 1px dilation of the combined beam shape
      oCtx.drawImage(cCanvas, -1, 0);
      oCtx.drawImage(cCanvas, 1, 0);
      oCtx.drawImage(cCanvas, 0, -1);
      oCtx.drawImage(cCanvas, 0, 1);
      // Tint with outline color
      oCtx.globalCompositeOperation = "source-in";
      oCtx.fillStyle = this.beamOutlineColor;
      oCtx.fillRect(0, 0, oCanvas.width, oCanvas.height);
      // Punch out the interior (original beam pixels)
      oCtx.globalCompositeOperation = "destination-out";
      oCtx.drawImage(cCanvas, 0, 0);
      oCtx.globalCompositeOperation = "source-over";
      // Blit outline behind beam
      Game.ctx.drawImage(oCanvas, originX, originY);
    }

    // Blit composite beam on top
    Game.ctx.drawImage(cCanvas, originX, originY);

    if (Game.ctx.globalCompositeOperation !== prevOp) {
      Game.ctx.globalCompositeOperation = prevOp;
    }

    // Apply room shade overlay masked to beam shape, then separately to outline ring.
    // oCanvas has the beam interior punched out so the two masks are non-overlapping.
    // useBrightnessSampling = true → new tile-based overlay (blurred softVis squares).
    // useBrightnessSampling = false → legacy inline shade src canvas path.
    if (this.useBrightnessSampling) {
      this._applyTileShadeOverlay(cCanvas, originX, originY);
      if (this.beamOutlineColor && this._beamOutlineCanvas) {
        this._applyTileShadeOverlay(this._beamOutlineCanvas, originX, originY);
      }
    } else {
      this.hostRoom?.applyInlineShadeOverlayForCanvas(cCanvas, originX, originY);
      if (this.beamOutlineColor && this._beamOutlineCanvas) {
        this.hostRoom?.applyInlineShadeOverlayForCanvas(this._beamOutlineCanvas, originX, originY);
      }
    }
    this._drawBeamEyes();
  }

  tick = () => {
    if (this.parent && this.parent.dead) {
      this.destroy();
    }
  };

  private _catmullRomEval(
    wps: Array<{ t: number; px: number; py: number }>,
    t: number,
  ): { x: number; y: number } {
    const m = wps.length;
    if (m === 0) return { x: 0, y: 0 };
    if (m === 1) return { x: wps[0].px, y: wps[0].py };
    if (t <= wps[0].t) return { x: wps[0].px, y: wps[0].py };
    if (t >= wps[m - 1].t) return { x: wps[m - 1].px, y: wps[m - 1].py };

    // Find the segment [i1, i2] that straddles t
    let i1 = 0;
    for (let j = 0; j < m - 1; j++) {
      if (t <= wps[j + 1].t) { i1 = j; break; }
      i1 = j;
    }
    const i0 = Math.max(0, i1 - 1);
    const i2 = Math.min(m - 1, i1 + 1);
    const i3 = Math.min(m - 1, i1 + 2);

    const p0 = wps[i0], p1 = wps[i1], p2 = wps[i2], p3 = wps[i3];
    const span = p2.t - p1.t;
    const u = span > 1e-8 ? (t - p1.t) / span : 0;
    const u2 = u * u;
    const u3 = u2 * u;

    return {
      x: 0.5 * (2 * p1.px + (-p0.px + p2.px) * u + (2 * p0.px - 5 * p1.px + 4 * p2.px - p3.px) * u2 + (-p0.px + 3 * p1.px - 3 * p2.px + p3.px) * u3),
      y: 0.5 * (2 * p1.py + (-p0.py + p2.py) * u + (2 * p0.py - 5 * p1.py + 4 * p2.py - p3.py) * u2 + (-p0.py + 3 * p1.py - 3 * p2.py + p3.py) * u3),
    };
  }

  private _repositionAlongWaypoints(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): void {
    const ts = GameConstants.TILESIZE;
    const wps: { t: number; px: number; py: number }[] = [
      { t: 0, px: startX, py: startY },
    ];
    const sorted = [...this.guideNodes].sort((a, b) => a.tPosition - b.tPosition);
    for (const gn of sorted) {
      const tc = Math.min(1, Math.max(0, gn.tPosition));
      if (tc > 0 && tc < 1) {
        wps.push({ t: tc, px: gn.x * ts + 0.5 * ts, py: gn.y * ts + 0.5 * ts });
      }
    }
    wps.push({ t: 1, px: endX, py: endY });

    const n = this.points.length;
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      const pos = this._catmullRomEval(wps, t);
      this.points[i].x = pos.x;
      this.points[i].y = pos.y;
      this.points[i].velocityX = 0;
      this.points[i].velocityY = 0;
    }
  }

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

        // Bending resistance: pull each point toward the midpoint of its neighbours.
        // This resists sharp direction changes, making corners arc gradually.
        const bendX = this.bendingStiffness > 0
          ? ((prevPoint.x + nextPoint.x) * 0.5 - point.x) * this.bendingStiffness
          : 0;
        const bendY = this.bendingStiffness > 0
          ? ((prevPoint.y + nextPoint.y) * 0.5 - point.y) * this.bendingStiffness
          : 0;

        point.velocityX =
          (point.velocityX + springForceXPrev + springForceXNext + bendX) *
          this.damping;
        point.velocityY =
          (point.velocityY + springForceYPrev + springForceYNext + bendY) *
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

      const totalLength = this.naturalLength > 0
        ? this.naturalLength
        : Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const segmentLength = totalLength / (this.segments - 1);

      this.resetAttachmentInfluence();
      this.applyAttachmentControl(true, startX, startY, segmentLength);
      this.applyAttachmentControl(false, endX, endY, segmentLength);
      for (const node of this.guideNodes) {
        this.applyGuideNode(node, segmentLength);
      }

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
    const skipDrawing = this.drawOnTop === true;
    this.render(
      this.targetX,
      this.targetY,
      this.x,
      this.y,
      this.color,
      this.lineWidth,
      delta,
      this.compositeOperation,
      skipDrawing,
      true,
    );
  };

  drawTopLayer = (delta: number) => {
    if (!this.drawOnTop) return;
    this.render(
      this.targetX,
      this.targetY,
      this.x,
      this.y,
      this.color,
      this.lineWidth,
      delta,
      this.compositeOperation,
      false,
      false,
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
