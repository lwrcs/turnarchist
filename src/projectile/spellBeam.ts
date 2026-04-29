import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Player } from "../player/player";
import { Room } from "../room/room";
import { BeamEffect } from "./beamEffect";

/**
 * SpellBeam — a physics beam that reveals itself from player → target
 * before firing the deferred spell callback.
 *
 * Built on BeamEffect's rope physics. Uses the same "cyan" color as the
 * old non-targeting spellbook beams. The reveal front gets a white tip
 * gradient that eases in both alpha and width.
 *
 * Animation:
 *  - Ease-in (t²) reveal: starts slow, accelerates to full speed.
 *  - Tip gradient spans 1/5 of the currently-revealed arc length.
 *  - Tip width = 2.5× base, grading back via s² ease.
 *  - player.busyAnimating = true for the full duration.
 */
export class SpellBeam extends BeamEffect {
  private elapsed: number = 0;
  private onComplete: () => void;
  private player: Player;
  private fired: boolean = false;

  /** Total animation duration in 60-fps frames. */
  private static readonly TOTAL_DURATION = 18;
  /** Fade-out duration in 60-fps frames (after reveal completes). */
  private static readonly FADE_DURATION = 12;
  /** Base pixel width of the beam body. */
  private static readonly BASE_WIDTH = 2;
  /** Tip is this many times wider than the base. */
  private static readonly TIP_MULT = 2.5;
  /** Gradient covers this fraction of the currently-revealed arc. */
  private static readonly GRADIENT_FRAC = 0.8;

  constructor(
    room: Room,
    player: Player,
    tx: number,
    ty: number,
    onComplete: () => void,
  ) {
    super(player.x, player.y - 0.5, tx, ty, player);
    this.player = player;
    this.onComplete = onComplete;

    this.color = "cyan";
    this.compositeOperation = "source-over";
    this.drawOnTop = true;

    // Tight, responsive physics — low gravity and turbulence so the beam
    // stays mostly straight while still feeling alive.
    this.gravity = 0;
    this.turbulence = 0.08;
    this.angleChange = 0.002;
    this.damping = 0.85;
    this.springStiffness = 0.15;
    this.springDamping = 0.2;
    this.motionInfluence = 0.5;
    this.iterations = 3;
    this.segments = 30;

    player.busyAnimating = true;
  }

  // Override draw: accumulate elapsed and advance physics only (no drawing yet).
  draw = (delta: number) => {
    if (this.dead) return;
    this.elapsed += delta;
    this.drawableY = this.y - 0.01;
    // skipDrawing=true, simulate=true — run physics, no pixels.
    this.render(0, 0, 0, 0, this.color, SpellBeam.BASE_WIDTH, delta, this.compositeOperation, true, true);
  };

  // Override drawTopLayer: custom reveal + fade rendering on top of everything.
  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    const pts = this.points;
    if (!pts || pts.length < 2) return;

    // Fire callback when beam is 2/3 revealed (fireballs spawn before beam fully arrives).
    if (!this.fired) {
      const last = pts.length - 1;
      const revealCount = this.elapsed < SpellBeam.TOTAL_DURATION
        ? Math.floor((this.elapsed / SpellBeam.TOTAL_DURATION) ** 2 * last)
        : last;
      if (revealCount >= Math.floor((2 / 3) * last)) this.fire();
    }

    const ctx = (Game as any).ctx as CanvasRenderingContext2D;
    if (!ctx) return;

    const BASE = SpellBeam.BASE_WIDTH;
    const TIP  = BASE * SpellBeam.TIP_MULT;
    const last = pts.length - 1;

    if (this.elapsed < SpellBeam.TOTAL_DURATION) {
      // — Reveal phase —
      const t = this.elapsed / SpellBeam.TOTAL_DURATION;
      const revealCount = Math.floor(t * t * last);
      if (revealCount < 1) return;

      const gradSegments = Math.max(1, Math.round(revealCount * SpellBeam.GRADIENT_FRAC));
      const gradStart = revealCount - gradSegments;

      ctx.save();
      ctx.globalCompositeOperation = this.compositeOperation as GlobalCompositeOperation;

      if (gradStart > 0) {
        this.drawSegments(ctx, pts, 0, gradStart, "rgba(0,255,255,0.5)", BASE);
      }
      for (let i = gradStart; i < revealCount; i++) {
        const s = (i - gradStart + 1) / gradSegments;
        const sc = s * s;
        const alpha = 0.25 + 0.75 * sc;
        const w = BASE + (TIP - BASE) * sc;
        const color = `rgba(200,235,255,${alpha.toFixed(3)})`;
        this.drawSegmentLine(ctx, pts[i].x, pts[i].y, pts[i + 1]?.x ?? pts[i].x, pts[i + 1]?.y ?? pts[i].y, color, w);
      }

      ctx.restore();
    } else {
      // — Fade phase: dissolve from player end → target end —
      const fadeProg = Math.min(1, (this.elapsed - SpellBeam.TOTAL_DURATION) / SpellBeam.FADE_DURATION);

      if (fadeProg >= 1) {
        this.dead = true;
        return;
      }

      // Ease-out: erode from the player (start) side toward the target.
      const erodeCount = Math.floor(fadeProg * fadeProg * last);
      const globalAlpha = 1 - fadeProg;

      ctx.save();
      ctx.globalCompositeOperation = this.compositeOperation as GlobalCompositeOperation;
      ctx.globalAlpha = globalAlpha;

      this.drawSegments(ctx, pts, erodeCount, last, "rgba(0,255,255,0.5)", BASE);

      ctx.restore();
    }
  };

  private fire(): void {
    this.fired = true;
    setTimeout(() => {
      this.player.busyAnimating = false;
      if (!this.player.dead) this.onComplete();
    }, 0);
  }

  /**
   * Draw a range of segments from the simulated points using the same
   * pixel-fill approach as BeamEffect.render().
   */
  private drawSegments(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[],
    from: number,
    to: number,
    color: string,
    lineWidth: number,
  ): void {
    for (let i = from; i < to && i < pts.length - 1; i++) {
      this.drawSegmentLine(ctx, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, color, lineWidth);
    }
  }

  /**
   * Draw a single line between two pixel-space points using the pixel-fill
   * technique from BeamEffect (integer fillRect cells).
   */
  private drawSegmentLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number,
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
    const xi = dx / steps;
    const yi = dy / steps;
    const lw = Math.max(1, Math.round(lineWidth));
    ctx.fillStyle = color;
    for (let s = 0; s <= steps; s++) {
      ctx.fillRect(Math.round(x1 + s * xi), Math.round(y1 + s * yi), lw, lw);
    }
  }
}
