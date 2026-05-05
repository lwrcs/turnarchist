import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { BookRenderer, BookTheme } from "./bookRenderer";
import { spellById } from "../item/weapon/spell";
import type { SpellPattern } from "../item/weapon/spell";
import type { Player } from "../player/player";

export class SpellbookReader extends BookRenderer {
  private player: Player | null = null;
  private _shakeAmountY: number = 0;
  private _shakeFrame: number = 0;
  private _shakeActive: boolean = false;
  private _shakeScheduledAt: number = -1; // previewAnimT value to trigger shake

  constructor() {
    super();
    this.theme = "arcana";
    this.handleResize();
  }

  /** Open the reader showing the player's known spells. */
  openForPlayer(player: Player): void {
    this.player = player;
    this.currentPage = 0;
    this.activeSubpage = 0;
    this.open();
  }

  // ── BookRenderer abstract implementations ─────────────────────────────────

  getPageCount(): number {
    return this.player?.knownSpells.length ?? 0;
  }

  drawLeftPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    _h: number,
    theme: BookTheme,
  ): void {
    if (!this.player) return;
    const id = this.player.knownSpells[pageIndex];
    const spell = id ? spellById(id) : null;
    if (!spell) return;

    Game.ctx.fillStyle = theme.accentText;
    Game.fillText(spell.name, x, y);

    const pattern = spell.getPattern();
    Game.ctx.fillStyle = theme.text;
    this.drawWrappedText(this.describeSpell(pattern), x, y + 14, w);
  }

  drawRightPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    _theme: BookTheme,
  ): void {
    if (!this.player) return;
    const id = this.player.knownSpells[pageIndex];
    const spell = id ? spellById(id) : null;
    if (!spell) return;
    this.drawSpellPatternGrid(spell.getPattern(), x, y, w, h);
  }

  // ── Protected hook overrides ───────────────────────────────────────────────

  protected onBeforeDraw(delta: number): void {
    // Tick shake
    if (this._shakeActive) {
      this._shakeAmountY *= 0.8 ** delta;
      this._shakeFrame += 0.15 * delta;
      if (Math.abs(this._shakeAmountY) < 0.5) {
        this._shakeAmountY = 0; this._shakeFrame = 0; this._shakeActive = false;
      }
    }
    // Fire scheduled shake
    if (this._shakeScheduledAt >= 0 && this.previewAnimT >= this._shakeScheduledAt) {
      this._shakeAmountY = 5;
      this._shakeFrame = Math.PI / 2;
      this._shakeActive = true;
      this._shakeScheduledAt = -1;
    }
  }

  protected stackedModeEnabled(): boolean {
    return true;
  }

  protected getShakeOffset(): { x: number; y: number } {
    const y = this._shakeActive ? Math.round(Math.sin(this._shakeFrame * Math.PI) * this._shakeAmountY) : 0;
    return { x: 0, y };
  }

  protected subpageLabel(subpage: 0 | 1): string {
    return subpage === 0 ? "Info" : "Pattern";
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private describeSpell(pattern: SpellPattern): string {
    const { offsets, delays } = pattern;
    const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;
    if (maxDelay === 0) {
      return `Strikes ${offsets.length} tile${offsets.length !== 1 ? "s" : ""} simultaneously.`;
    }
    const waves = maxDelay + 1;
    return `Strikes in ${waves} waves, hitting ${offsets.length} tile${offsets.length !== 1 ? "s" : ""} total.`;
  }

  private drawSpellPatternGrid(
    pattern: SpellPattern,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
  ): void {
    const GRID_SIZE = 7;
    const FIREBALL_START_FRAME = 6;
    const FIREBALL_END_FRAME = 17;
    const FIREBALL_RATE = 0.25;
    const EXPLOSION_DURATION = (FIREBALL_END_FRAME - FIREBALL_START_FRAME) / FIREBALL_RATE; // 44
    const DELAY_UNIT = 12;
    const maxDelay = pattern.delays.length > 0 ? Math.max(...pattern.delays) : 0;
    const CYCLE = maxDelay * DELAY_UNIT + EXPLOSION_DURATION + 20;
    const TILE = GameConstants.TILESIZE;

    const maxTileDrawSize = Math.min(rw / GRID_SIZE, rh / GRID_SIZE);
    const scale = Math.max(1, Math.floor(maxTileDrawSize / TILE));
    const tileDrawSize = scale * TILE;
    const originX = Math.round(rx + (rw - GRID_SIZE * tileDrawSize) / 2);
    const originY = Math.round(ry + (rh - GRID_SIZE * tileDrawSize) / 2);
    const CENTER = 3;
    const destW = scale;
    const destH = scale;

    const cycleT = this.previewAnimT % CYCLE;

    // Schedule shake at the midpoint of the first explosion wave
    const firstExplosionMid = FIREBALL_START_FRAME / FIREBALL_RATE + EXPLOSION_DURATION * 0.5;
    const cycleBase = this.previewAnimT - cycleT;
    const shakeTarget = cycleBase + firstExplosionMid;
    if (cycleT < firstExplosionMid && this._shakeScheduledAt < cycleBase) {
      this._shakeScheduledAt = shakeTarget;
    }

    // Reset to known state; clip to panel
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = 1;
    Game.ctx.beginPath();
    Game.ctx.rect(rx, ry, rw, rh);
    Game.ctx.clip();

    // Border ring (static, no shake)
    Game.ctx.fillStyle = "rgba(70, 70, 80, 1)";
    Game.ctx.fillRect(originX, originY, GRID_SIZE * tileDrawSize, GRID_SIZE * tileDrawSize);

    // Checkerboard (1-tile inset, static)
    for (let col = 1; col < GRID_SIZE - 1; col++) {
      for (let row = 1; row < GRID_SIZE - 1; row++) {
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

    // Draw looping explosion animations
    const { offsets, delays } = pattern;
    for (let i = 0; i < offsets.length; i++) {
      const { dx, dy } = offsets[i];
      const delay = delays[i] ?? 0;
      const tileStart = delay * DELAY_UNIT;
      const localT = cycleT - tileStart;
      if (localT >= 0 && localT < EXPLOSION_DURATION) {
        const frame = FIREBALL_START_FRAME + Math.floor(localT * FIREBALL_RATE);
        const col = CENTER + dx;
        const row = CENTER + dy;
        const destX = (originX + col * tileDrawSize) / TILE;
        const destY = (originY + row * tileDrawSize) / TILE;
        Game.drawFX(frame, 6, 1, 2, destX, destY - destH, destW, destH * 2);
      }
    }

    Game.ctx.restore(); // end clip/state reset
  }
}
