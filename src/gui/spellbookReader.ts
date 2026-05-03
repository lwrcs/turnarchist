import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { BookRenderer, BookTheme } from "./bookRenderer";
import { Spellbook } from "../item/weapon/spellbook";
import type { SpellPattern } from "../item/weapon/spell";

export class SpellbookReader extends BookRenderer {
  private spellbook: Spellbook | null = null;

  constructor() {
    super();
    this.theme = "arcana";
    this.handleResize();
  }

  /** Open the reader for a specific spellbook item. */
  openBook(spellbook: Spellbook): void {
    this.spellbook = spellbook;
    this.currentPage = 0;
    this.activeSubpage = 0;
    this.open();
  }

  // ── BookRenderer abstract implementations ─────────────────────────────────

  getPageCount(): number {
    return this.spellbook?.spells.length ?? 0;
  }

  drawLeftPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    _h: number,
    theme: BookTheme,
  ): void {
    if (!this.spellbook) return;
    const spell = this.spellbook.spells[pageIndex];
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
    if (!this.spellbook) return;
    const spell = this.spellbook.spells[pageIndex];
    if (!spell) return;
    this.drawSpellPatternGrid(spell.getPattern(), x, y, w, h);
  }

  // ── Protected hook overrides ───────────────────────────────────────────────

  protected stackedModeEnabled(): boolean {
    return true;
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
    // PlayerFireball: frame starts at 6, ends at 17 (inclusive), rate 0.25/delta
    // Duration to play all 12 frames: (17 - 6) / 0.25 = 44 delta units
    const FIREBALL_START_FRAME = 6;
    const FIREBALL_END_FRAME = 17;
    const FIREBALL_RATE = 0.25;
    const EXPLOSION_DURATION = (FIREBALL_END_FRAME - FIREBALL_START_FRAME) / FIREBALL_RATE; // 44
    // Delay between waves: PlayerFireball offsetFrame = spellDelay * 120, drains at 10/delta → 12 delta units per delay step
    const DELAY_UNIT = 12;
    const maxDelay = pattern.delays.length > 0 ? Math.max(...pattern.delays) : 0;
    const CYCLE = maxDelay * DELAY_UNIT + EXPLOSION_DURATION + 20; // 20 blank frames gap
    const TILE = GameConstants.TILESIZE;

    const tileDrawSize = Math.min(rw / GRID_SIZE, rh / GRID_SIZE);
    const originX = rx + (rw - GRID_SIZE * tileDrawSize) / 2;
    const originY = ry + (rh - GRID_SIZE * tileDrawSize) / 2;
    const CENTER = 3;

    const destW = tileDrawSize / TILE;
    const destH = tileDrawSize / TILE;

    // Solid grey grid background
    Game.ctx.fillStyle = "rgba(90, 90, 100, 1)";
    Game.ctx.fillRect(originX, originY, GRID_SIZE * tileDrawSize, GRID_SIZE * tileDrawSize);

    // Highlight center tile
    Game.ctx.fillStyle = "rgba(255, 240, 100, 0.18)";
    Game.ctx.fillRect(
      originX + CENTER * tileDrawSize,
      originY + CENTER * tileDrawSize,
      tileDrawSize,
      tileDrawSize,
    );

    // Draw looping explosion animations at each pattern offset.
    // Mirror PlayerFireball exactly: frame starts at FIREBALL_START_FRAME, drawn at (x, y-1) with size 1×2.
    const cycleT = this.previewAnimT % CYCLE;
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
        // PlayerFireball draws at (this.x, this.y - 1) with drawW=1, drawH=2
        Game.drawFX(frame, 6, 1, 2, destX, destY - destH, destW, destH * 2);
      }
    }
  }
}
