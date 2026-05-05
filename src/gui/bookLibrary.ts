import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { BookRenderer, BookTheme } from "./bookRenderer";
import type { Player } from "../player/player";

type LibraryEntry = {
  title: string;
  subtitle: string;
  /** Returns true if this entry has content (not grayed out). */
  hasContent: () => boolean;
  onSelect: () => void;
};

export class BookLibrary extends BookRenderer {
  private player: Player;
  private entryRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  private buttonX: number = 0;
  private buttonY: number = 0;

  constructor(player: Player) {
    super();
    this.player = player;
    this.theme = "parchment";
    this.handleResize();
  }

  // ── BookRenderer abstract implementations ─────────────────────────────────

  getPageCount(): number {
    return 1;
  }

  drawLeftPage(
    _pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    theme: BookTheme,
  ): void {
    const entries = this.getEntries();
    const rowH = Game.letter_height + 14;
    const padX = 4;
    this.entryRects = [];

    Game.ctx.fillStyle = theme.accentText;
    Game.fillText("Library", x + padX, y);

    const startY = y + Game.letter_height + 8;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const ey = startY + i * rowH;
      if (ey + rowH > y + h) break;

      const available = entry.hasContent();
      const rect = { x: x, y: ey, w: w, h: rowH - 2 };
      this.entryRects.push(rect);

      // Row background on hover (approximate — always draw slight bg)
      Game.ctx.fillStyle = available
        ? "rgba(255,255,255,0.06)"
        : "rgba(255,255,255,0.02)";
      Game.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      Game.ctx.strokeStyle = available
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.06)";
      Game.ctx.lineWidth = 1;
      Game.ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

      // Entry title
      Game.ctx.fillStyle = available ? theme.text : "rgba(160,155,145,0.6)";
      Game.fillText(entry.title, x + padX, ey + 3);

      // Entry subtitle
      if (entry.subtitle) {
        Game.ctx.fillStyle = available
          ? "rgba(120,110,90,0.9)"
          : "rgba(120,110,90,0.4)";
        Game.fillText(entry.subtitle, x + padX, ey + Game.letter_height + 4);
      }

      // Arrow indicator on right
      if (available) {
        const arrowStr = "»";
        const arrowW = Game.measureText(arrowStr).width;
        Game.ctx.fillStyle = theme.accentText;
        Game.fillText(arrowStr, x + w - arrowW - 4, ey + 3);
      }
    }
  }

  drawRightPage(
    _pageIndex: number,
    _x: number,
    _y: number,
    _w: number,
    _h: number,
    _theme: BookTheme,
  ): void {
    // Right panel intentionally empty for the TOC
  }

  // ── Protected hook overrides ───────────────────────────────────────────────

  protected stackedModeEnabled(): boolean {
    return true;
  }

  protected handleExtraClick(x: number, y: number): boolean {
    const entries = this.getEntries();
    for (let i = 0; i < this.entryRects.length; i++) {
      const rect = this.entryRects[i];
      const entry = entries[i];
      if (!entry) continue;
      if (this.pointInRect(x, y, rect)) {
        if (entry.hasContent()) {
          entry.onSelect();
        }
        return true;
      }
    }
    return false;
  }

  // ── Library button (replaces old bestiary button) ─────────────────────────

  getLibraryButtonRect = (): { x: number; y: number; w: number; h: number } => {
    let bx = 0.25;
    let by = GameConstants.HEIGHT / GameConstants.TILESIZE - 1.25;
    if (GameConstants.WIDTH < 145) by -= 1.25;
    const x = Math.round(bx * GameConstants.TILESIZE);
    const y = Math.round(by * GameConstants.TILESIZE);
    const w = GameConstants.TILESIZE;
    const h = GameConstants.TILESIZE;
    return { x, y, w, h };
  };

  isPointInLibraryButton = (x: number, y: number): boolean => {
    const r = this.getLibraryButtonRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  drawLibraryButton = (_delta: number) => {
    Game.ctx.save();
    const r = this.getLibraryButtonRect();
    this.buttonX = r.x / GameConstants.TILESIZE;
    this.buttonY = r.y / GameConstants.TILESIZE;
    Game.drawFX(1, 0, 1, 1, this.buttonX, this.buttonY, 1, 1);
    Game.ctx.restore();
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  private getEntries(): LibraryEntry[] {
    return [
      {
        title: "Creature Compendium",
        subtitle: "Bestiary",
        hasContent: () => (this.player.bestiary?.entries.length ?? 0) > 0,
        onSelect: () => {
          this.player.bestiary?.setBackCallback(() => this.open());
          this.close();
          this.player.bestiary?.open();
        },
      },
      {
        title: "Spell Compendium",
        subtitle: "Inscribed spells",
        hasContent: () => this.player.knownSpells.length > 0,
        onSelect: () => {
          this.close();
          this.player.spellbookReader?.setBackCallback(() => this.open());
          this.player.spellbookReader?.openForPlayer(this.player);
        },
      },
      {
        title: "Armory",
        subtitle: "Known weapons",
        hasContent: () => (this.player.armoryBook?.entries.length ?? 0) > 0,
        onSelect: () => {
          this.player.armoryBook?.setBackCallback(() => this.open());
          this.close();
          this.player.armoryBook?.open();
        },
      },
    ];
  }
}
