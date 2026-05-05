import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { BookRenderer, BookTheme } from "./bookRenderer";
import { Entity } from "../entity/entity";
import { Direction } from "../game";
import type { Player } from "../player/player";

// ── Attack animation data per weapon (for UP direction) ──────────────────────

type AttackAnimData = {
  /** AttackAnimation tileX in FX sheet */
  tileX: number;
  /** AttackAnimation tileY in FX sheet (base row; tileYOffset for UP = +2) */
  tileY: number;
  /** Total animation frames */
  frames: number;
  /** How many frame units advance per delta unit */
  animationSpeed: number;
  /** xOffset relative to entity.x (in full tile units) */
  xOffset: number;
  /** yOffset relative to entity.y (in full tile units) */
  yOffset: number;
};

const ATTACK_ANIM: Record<string, AttackAnimData> = {
  dagger: {
    tileX: 12,
    tileY: 24,
    frames: 8,
    animationSpeed: 1,
    xOffset: 0,
    yOffset: 0.5,
  },
  dualdagger: {
    tileX: 12,
    tileY: 40,
    frames: 8,
    animationSpeed: 1,
    xOffset: 0,
    yOffset: 0.5,
  },
  spear: {
    tileX: 22,
    tileY: 32,
    frames: 5,
    animationSpeed: 0.5,
    xOffset: -0.125,
    yOffset: 1,
  },
  scythe: {
    tileX: 0,
    tileY: 40,
    frames: 6,
    animationSpeed: 0.75,
    xOffset: 0,
    yOffset: 0.75,
  },
  sword: {
    tileX: 0,
    tileY: 48,
    frames: 6,
    animationSpeed: 0.75,
    xOffset: 0,
    yOffset: 0.95,
  },
  warhammer: {
    tileX: 12,
    tileY: 32,
    frames: 8,
    animationSpeed: 2,
    xOffset: 0.25,
    yOffset: -0.75 + 1,
  }, // frame starts at -5
};

// ── Static weapon entry data ─────────────────────────────────────────────────

export type ArmoryEntry = {
  /** Matches Weapon.name / static itemName */
  weaponName: string;
  displayName: string;
  description: string;
  /** Item sprite tileX on the item sheet */
  itemTileX: number;
  /** Item sprite tileY on the item sheet */
  itemTileY: number;
  /** AttackAnimation type key, or null for ranged/no animation */
  attackType: string | null;
  /** Hit tile offsets relative to player position, UP direction */
  hitOffsets: Array<{ dx: number; dy: number }>;
  /** Base damage shown in the preview */
  damage: number;
};

export const ARMORY_WEAPONS: ArmoryEntry[] = [
  {
    weaponName: "dagger",
    displayName: "Dagger",
    description: "A basic but dependable weapon.",
    itemTileX: 22, itemTileY: 0,
    attackType: "dagger",
    hitOffsets: [{ dx: 0, dy: -1 }],
    damage: 1,
  },
  {
    weaponName: "dual daggers",
    displayName: "Dual Daggers",
    description: "After the first attack, enemies will not take their turn until you attack or move again.",
    itemTileX: 23, itemTileY: 0,
    attackType: "dualdagger",
    hitOffsets: [{ dx: 0, dy: -1 }],
    damage: 1,
  },
  {
    weaponName: "spear",
    displayName: "Spear",
    description: "Hits enemies in front of you within a range of 2 tiles.",
    itemTileX: 24, itemTileY: 0,
    attackType: "spear",
    hitOffsets: [{ dx: 0, dy: -1 }, { dx: 0, dy: -2 }],
    damage: 1,
  },
  {
    weaponName: "sword",
    displayName: "Sword",
    description: "A balanced blade. Hits the tile ahead. On hit, also strikes the two tiles beside it.",
    itemTileX: 28, itemTileY: 2,
    attackType: "sword",
    hitOffsets: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 }],
    damage: 1,
  },
  {
    weaponName: "scythe",
    displayName: "Scythe",
    description: "A wide reaping arc. Hits the tile ahead and the flanking tiles of both you and your target.",
    itemTileX: 23, itemTileY: 2,
    attackType: "scythe",
    hitOffsets: [
      { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    ],
    damage: 1,
  },
  {
    weaponName: "warhammer",
    displayName: "Warhammer",
    description: "A slow, heavy smash that hits only the tile ahead.",
    itemTileX: 22, itemTileY: 2,
    attackType: "warhammer",
    hitOffsets: [{ dx: 0, dy: -1 }],
    damage: 2,
  },
  {
    weaponName: "greataxe",
    displayName: "Greataxe",
    description: "A great axe. It wants to bite.",
    itemTileX: 24, itemTileY: 2,
    attackType: null,
    hitOffsets: [{ dx: 0, dy: -1 }],
    damage: 2,
  },
  {
    weaponName: "quarterstaff",
    displayName: "Quarterstaff",
    description: "Hitting an enemy will push them back 1 tile. Pin them against a wall to instantly kill them.",
    itemTileX: 22, itemTileY: 4,
    attackType: null,
    hitOffsets: [{ dx: 0, dy: -1 }],
    damage: 1,
  },
  {
    weaponName: "crossbow",
    displayName: "Crossbow",
    description: "Uses bolts. Load and cock it, then fire in a straight line to hit the first enemy in sight.",
    itemTileX: 23, itemTileY: 4,
    attackType: null,
    hitOffsets: [{ dx: 0, dy: -1 }, { dx: 0, dy: -2 }, { dx: 0, dy: -3 }, { dx: 0, dy: -4 }],
    damage: 4,
  },
  {
    weaponName: "shotgun",
    displayName: "Shotgun",
    description: "Fires a wide blast. Short range, full damage at point blank.",
    itemTileX: 26, itemTileY: 0,
    attackType: null,
    hitOffsets: [{ dx: 0, dy: -1 }, { dx: 0, dy: -2 }, { dx: 0, dy: -3 }],
    damage: 1,
  },
];

const ARMORY_BY_NAME = new Map<string, ArmoryEntry>(
  ARMORY_WEAPONS.map((e) => [e.weaponName, e]),
);

// ── ArmoryBook class ─────────────────────────────────────────────────────────

export class ArmoryBook extends BookRenderer {
  entries: ArmoryEntry[] = [];
  private animT: number = 0;
  private _dummyCanvas: HTMLCanvasElement | null = null;
  private _bounceDelays: number[] = [];
  private _lastCycleIndex: number = -1;
  private _rngSeed: number = 0;
  private _shakeAmountY: number = 0;
  private _shakeFrame: number = 0;
  private _shakeActive: boolean = false;
  private _lastInAttack: boolean = false;
  private _floaters: Array<{
    col: number; row: number;
    riseY: number; alpha: number; frame: number;
    xoffset: number; damage: number;
  }> = [];

  private seededRand(): number {
    // Mulberry32
    this._rngSeed |= 0;
    this._rngSeed = this._rngSeed + 0x6d2b79f5 | 0;
    let t = Math.imul(this._rngSeed ^ this._rngSeed >>> 15, 1 | this._rngSeed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  constructor(_player: Player) {
    super();
    this.theme = "mahogany";
    this.handleResize();
  }

  addEntry(weaponName: string): void {
    if (this.entries.some((e) => e.weaponName === weaponName)) return;
    const def = ARMORY_BY_NAME.get(weaponName);
    if (def) this.entries.push(def);
  }

  // ── BookRenderer abstract implementations ───────────────────────────────

  getPageCount(): number {
    return this.entries.length;
  }

  drawLeftPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    theme: BookTheme,
  ): void {
    const entry = this.entries[pageIndex];
    if (!entry) return;

    const TILE = GameConstants.TILESIZE;
    // Match the pixel scale used by the attack-pattern grid (7×7 grid in the right page).
    const scale = Math.max(1, Math.floor(Math.min(w, h) / (7 * TILE)));
    const drawPx = scale * TILE;
    const itemX = x + (w - drawPx) / 2;
    const itemY = y + 4;

    Game.drawItem(
      entry.itemTileX,
      entry.itemTileY,
      1,
      2,
      itemX / TILE,
      itemY / TILE,
      scale,
      scale * 2,
    );

    const textY = itemY + drawPx * 2 + 6;
    Game.ctx.fillStyle = theme.accentText;
    Game.fillText(entry.displayName, x, textY);
    Game.ctx.fillStyle = theme.text;
    this.drawWrappedText(
      entry.description,
      x,
      textY + Game.letter_height + 4,
      w,
    );
  }

  drawRightPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    _theme: BookTheme,
  ): void {
    const entry = this.entries[pageIndex];
    if (!entry) return;
    this.drawAttackPattern(entry, x, y, w, h);
  }

  // ── Protected hook overrides ──────────────────────────────────────────────

  protected stackedModeEnabled(): boolean {
    return true;
  }

  protected onBeforeDraw(delta: number): void {
    this.animT += delta;
    // Tick local screen shake (mirrors Game.drawScreenShake)
    if (this._shakeActive) {
      this._shakeAmountY *= 0.8 ** delta;
      this._shakeFrame += 0.15 * delta;
      if (Math.abs(this._shakeAmountY) < 0.5) {
        this._shakeAmountY = 0; this._shakeFrame = 0; this._shakeActive = false;
      }
    }
    // Tick damage floaters
    for (const f of this._floaters) {
      f.frame += delta;
      f.riseY += 0.03 * delta;
      if (f.frame > 15) f.alpha -= 0.025 * delta;
      if (f.alpha < 0) f.alpha = 0;
    }
    this._floaters = this._floaters.filter(f => f.alpha > 0);
  }

  private _resetAnim(): void {
    this.animT = 0;
    this._bounceDelays = [];
    this._lastCycleIndex = -1;
    this._lastInAttack = false;
    this._shakeActive = false;
    this._shakeAmountY = 0; this._shakeFrame = 0;
    this._floaters = [];
  }

  protected onOpen(): void { this._resetAnim(); }
  protected onPageTransitionStart(_toPage: number): void { this._resetAnim(); }

  protected getShakeOffset(): { x: number; y: number } {
    const y = this._shakeActive ? Math.round(Math.sin(this._shakeFrame * Math.PI) * this._shakeAmountY) : 0;
    return { x: 0, y };
  }

  protected onPageChanged(newPage: number): void {
    super.onPageChanged(newPage);
  }

  // ── Private: pseudo-renderer ────────────────────────────────────────────

  /**
   * Displacement in "drawn tile" units (1 unit = tileDrawSize px) from the
   * enemy's target position. Negative = above target. Uses gravity + bounce.
   */
  private bounceDispY(t: number, delay: number): number {
    const H    = 5.0;   // drop height in drawn-tile units
    const iv   = 0.84;  // initial downward velocity
    const g    = 0.144; // gravity per frame²
    const drag = 0.3;   // linear air drag coefficient per frame
    const r    = 0.72;  // restitution coefficient

    const lt = t - delay;
    if (lt <= 0) return -H;

    // Numerical integration — 8 substeps per frame for accuracy
    const STEPS = 8;
    const dt = 1 / STEPS;
    const steps = Math.round(lt * STEPS);
    let y = -H;
    let v = iv;
    for (let i = 0; i < steps; i++) {
      v += g * dt;
      v -= drag * v * dt; // linear drag
      y += v * dt;
      if (y >= 0) {
        y = 0;
        v = -Math.abs(v) * r;
      }
    }
    return Math.min(0, y);
  }

  private drawAttackPattern(
    entry: ArmoryEntry,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
  ): void {
    const TILE = GameConstants.TILESIZE;
    const GRID = 7;
    const CENTER = 3;

    // Snap to integer pixel-perfect scale
    const maxTileDrawSize = Math.min(rw / GRID, rh / GRID);
    const scale = Math.max(1, Math.floor(maxTileDrawSize / TILE));
    const tileDrawSize = scale * TILE;
    const ratio = scale;
    const originX = Math.round(rx + (rw - GRID * tileDrawSize) / 2);
    const originY = Math.round(ry + (rh - GRID * tileDrawSize) / 2);

    // Reset to known canvas state; clip to panel so falling sprites don't overflow.
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = 1;
    Game.ctx.beginPath();
    Game.ctx.rect(rx, ry, rw, rh);
    Game.ctx.clip();

    // Border ring
    Game.ctx.fillStyle = "rgba(70, 70, 80, 1)";
    Game.ctx.fillRect(originX, originY, GRID * tileDrawSize, GRID * tileDrawSize);

    // Checkerboard (1-tile inset)
    for (let col = 1; col < GRID - 1; col++) {
      for (let row = 1; row < GRID - 1; row++) {
        Game.ctx.fillStyle = (col + row) % 2 === 0
          ? "rgba(85, 85, 95, 1)"
          : "rgba(100, 100, 110, 1)";
        Game.ctx.fillRect(
          originX + col * tileDrawSize,
          originY + row * tileDrawSize,
          tileDrawSize,
          tileDrawSize,
        );
      }
    }

    // ── Timing ─────────────────────────────────────────────────────────────
    const animData = entry.attackType ? ATTACK_ANIM[entry.attackType] : null;

    // Fall-in phase: enemies drop from above and bounce into position.
    // PHYS_SCALE slows the physics clock without affecting attack/death timings.
    const PHYS_SCALE = 5;
    const MAX_FALL_DELAY = 6; // in physics-time frames
    // Settle time: simulate same physics as bounceDispY, stop after 6 bounces
    // (matching the bounce limit in bounceDispY so FALL_DURATION is accurate).
    const FALL_SETTLE = (() => {
      const H = 5.0, iv = 0.84, g = 0.144, drag = 0.3, r = 0.72;
      const STEPS = 8; const dt = 1 / STEPS;
      let y = -H, v = iv, bounces = 0;
      for (let frame = 0; frame < 1000; frame++) {
        for (let s = 0; s < STEPS; s++) {
          v += g * dt; v -= drag * v * dt; y += v * dt;
          if (y >= 0) { y = 0; v = -Math.abs(v) * r; bounces++; }
        }
        if (bounces >= 6) return frame + 4; // +4 frames for last bounce to settle
      }
      return 60;
    })();
    // Convert physics settle time to cycleT (real-frame) units
    const FALL_DURATION = Math.ceil((FALL_SETTLE + MAX_FALL_DELAY) * PHYS_SCALE) + 3;

    const IDLE_DURATION  = -39;
    const ATTACK_DURATION = animData
      ? Math.ceil(animData.frames / animData.animationSpeed) + 4
      : 20;
    const DYING_DURATION = 15;
    const CYCLE = FALL_DURATION + IDLE_DURATION + ATTACK_DURATION + DYING_DURATION + 20;

    const PHASE_ATTACK = FALL_DURATION + IDLE_DURATION;
    const PHASE_DYING  = PHASE_ATTACK + ATTACK_DURATION;

    const cycleT = this.animT % CYCLE;
    const inAttack = cycleT >= PHASE_ATTACK && cycleT < PHASE_DYING;
    const inDying  = cycleT >= PHASE_DYING;
    const dyingT   = inDying ? cycleT - PHASE_DYING : 0;
    const dyingAlpha = inDying ? Math.max(0, 1 - dyingT / DYING_DURATION) : 1;
    const showHighlight = inAttack || inDying;

    // Trigger shake + spawn floaters on the leading edge of the attack phase
    if (inAttack && !this._lastInAttack) {
      this._shakeAmountY = 6;
      this._shakeFrame = Math.PI / 2;
      this._shakeActive = true;
      // Spawn one damage floater per hit offset
      const newFloaters = entry.hitOffsets.map(({ dx, dy }) => ({
        col: CENTER + dx,
        row: CENTER + dy,
        riseY: 0,
        alpha: 1,
        frame: 0,
        xoffset: Math.random() * 0.2,
        damage: entry.damage,
      }));
      this._floaters.push(...newFloaters);
    }
    this._lastInAttack = inAttack;

    // Regenerate fall delays each new cycle, seeded from Date.now() for variety.
    const cycleIndex = Math.floor(this.animT / CYCLE);
    if (cycleIndex !== this._lastCycleIndex) {
      this._lastCycleIndex = cycleIndex;
      this._rngSeed = Date.now();
      this._bounceDelays = entry.hitOffsets.map(() => this.seededRand() * MAX_FALL_DELAY);
    }

    // ── Temp canvas for dummy compositing ──────────────────────────────────
    if (!this._dummyCanvas) this._dummyCanvas = document.createElement("canvas");
    const dc = this._dummyCanvas;
    if (dc.width !== tileDrawSize || dc.height !== tileDrawSize) {
      dc.width = tileDrawSize;
      dc.height = tileDrawSize;
    }
    const dCtx = dc.getContext("2d")!;

    // ── Draw dummies ───────────────────────────────────────────────────────
    for (let i = 0; i < entry.hitOffsets.length; i++) {
      const { dx, dy } = entry.hitOffsets[i];
      const delay = this._bounceDelays[i] ?? 0; // in physics-time frames
      const col = CENTER + dx;
      const row = CENTER + dy;
      const dummyPixelX = originX + col * tileDrawSize;
      const dummyPixelY = originY + row * tileDrawSize;
      // Convert cycleT to physics time before sampling bounce curve
      const dispPx = this.bounceDispY(cycleT / PHYS_SCALE, delay) * tileDrawSize;

      // Render sprite (+ optional highlight) onto temp canvas at (0,0)
      dCtx.clearRect(0, 0, tileDrawSize, tileDrawSize);
      dCtx.globalCompositeOperation = "source-over";
      dCtx.globalAlpha = 1;
      dCtx.imageSmoothingEnabled = false;

      const prevCtx = Game.ctx;
      Game.ctx = dCtx;
      Entity.drawIdleSprite({
        tileX: 8, tileY: 4, frames: 1, frameStride: 1,
        x: 0, y: 0, w: 1, h: 1, drawW: ratio, drawH: ratio,
      });

      if (showHighlight) {
        dCtx.globalCompositeOperation = "lighten";
        dCtx.globalAlpha = 0.5;
        dCtx.fillStyle = "#ff0000";
        dCtx.fillRect(0, 0, tileDrawSize, tileDrawSize);
        dCtx.globalAlpha = 1;
        dCtx.globalCompositeOperation = "destination-in";
        Entity.drawIdleSprite({
          tileX: 8, tileY: 4, frames: 1, frameStride: 1,
          x: 0, y: 0, w: 1, h: 1, drawW: ratio, drawH: ratio,
        });
        dCtx.globalCompositeOperation = "source-over";
      }

      Game.ctx = prevCtx;

      // Blit at target position + bounce offset, fading out when dying
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.globalAlpha = dyingAlpha;
      Game.ctx.drawImage(dc, dummyPixelX, dummyPixelY + dispPx);
      Game.ctx.restore();
    }

    // ── Player + attack animation ──────────────────────────────────────────
    const localTForHit = inAttack ? cycleT - PHASE_ATTACK : 0;
    const hitY = inAttack ? 0.5 * Math.pow(0.7, localTForHit) : 0;

    const playerTX = (originX + CENTER * tileDrawSize) / TILE;
    const playerTY = (originY + CENTER * tileDrawSize) / TILE - ratio; // 1 tile up

    const attackYTweak: Record<string, number> = { spear: -1 };

    // Attack FX drawn behind player
    if (inAttack && animData) {
      const localT = cycleT - PHASE_ATTACK;
      const frameStart = entry.attackType === "warhammer" ? -5 : 0;
      const rawFrame = frameStart + localT * animData.animationSpeed;
      const frame = Math.max(0, rawFrame);
      if (frame < animData.frames) {
        const srcX = animData.tileX + 2 * Math.round(frame / 2);
        const srcY = animData.tileY + 2;
        const yTweak = entry.attackType ? (attackYTweak[entry.attackType] ?? 0) : 0;
        const fxX = playerTX + (-0.5 + animData.xOffset) * ratio;
        const fxY = playerTY - hitY + (-0.5 + animData.yOffset + yTweak) * ratio;
        Game.drawFX(srcX, srcY, 2, 2, fxX, fxY, 2 * ratio, 2 * ratio);
      }
    }

    // Player sprite on top
    Entity.drawIdleSprite({
      tileX: 1, tileY: 10, frames: 1, frameStride: 1,
      x: playerTX, y: playerTY - hitY,
      w: 1, h: 2, drawW: ratio, drawH: ratio * 2,
    });

    // Damage floaters
    for (const f of this._floaters) {
      if (f.alpha <= 0) continue;
      const TILE = GameConstants.TILESIZE;
      const fx = originX + f.col * tileDrawSize;
      const fy = originY + f.row * tileDrawSize - f.riseY * tileDrawSize;
      const text = "-" + f.damage.toString();
      const centerX = Game.measureText(text).width / 2;
      const drawX = fx + (0.4 + f.xoffset) * tileDrawSize - centerX;
      const drawY = fy - 0.6 * tileDrawSize;
      Game.ctx.globalAlpha = f.alpha;
      Game.fillTextOutline(text, drawX, drawY, GameConstants.OUTLINE, "red");
      Game.ctx.globalAlpha = 1;
    }

    Game.ctx.restore(); // end outer state reset
  }
}
