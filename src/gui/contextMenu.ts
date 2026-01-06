import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Input } from "../game/input";

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
};

/**
 * Simple RuneScape-style context menu:
 * - Opens at the click location, extending down/right.
 * - Clamps on-screen if it would overflow.
 * - Clicking outside closes it.
 */
export class ContextMenu {
  open: boolean = false;
  private xPx: number = 0;
  private yPx: number = 0;
  private items: ContextMenuItem[] = [];

  // Cached layout
  private widthPx: number = 0;
  private heightPx: number = 0;
  private readonly padX = 6;
  private readonly padY = 6;
  private readonly rowH = Game.letter_height + 8;
  private readonly closeMarginPx = 10;

  openAt = (xPx: number, yPx: number, items: ContextMenuItem[]) => {
    this.items = items;
    this.open = true;
    this.xPx = Math.round(xPx);
    this.yPx = Math.round(yPx);
    this.recomputeLayoutAndClamp();
  };

  close = () => {
    this.open = false;
  };

  private recomputeLayoutAndClamp = () => {
    const labels = this.items.map((it) => it.label);
    const maxW = Math.max(1, ...labels.map((s) => Game.measureText(s).width));
    this.widthPx = this.padX * 2 + maxW;
    this.heightPx = this.padY * 2 + this.items.length * this.rowH;

    // Clamp to screen (canvas pixels).
    const margin = 2;
    if (this.xPx + this.widthPx > GameConstants.WIDTH - margin) {
      this.xPx = GameConstants.WIDTH - margin - this.widthPx;
    }
    if (this.yPx + this.heightPx > GameConstants.HEIGHT - margin) {
      this.yPx = GameConstants.HEIGHT - margin - this.heightPx;
    }
    if (this.xPx < margin) this.xPx = margin;
    if (this.yPx < margin) this.yPx = margin;
  };

  isPointInMenu = (x: number, y: number): boolean => {
    if (!this.open) return false;
    return (
      x >= this.xPx &&
      x <= this.xPx + this.widthPx &&
      y >= this.yPx &&
      y <= this.yPx + this.heightPx
    );
  };

  private isPointInMenuWithMargin = (
    x: number,
    y: number,
    marginPx: number,
  ): boolean => {
    if (!this.open) return false;
    return (
      x >= this.xPx - marginPx &&
      x <= this.xPx + this.widthPx + marginPx &&
      y >= this.yPx - marginPx &&
      y <= this.yPx + this.heightPx + marginPx
    );
  };

  handleMouseDown = (x: number, y: number, button: 0 | 2): boolean => {
    if (!this.open) return false;
    // Right click inside menu just consumes for now.
    if (!this.isPointInMenu(x, y)) {
      this.close();
      return true;
    }
    if (button !== 0) return true;

    const idx = this.getHoveredIndex(x, y);
    const item = idx !== null ? this.items[idx] : null;
    if (!item) return true;

    try {
      item.onClick();
    } finally {
      // Always close after any selection (RuneScape-like).
      this.close();
    }
    return true;
  };

  private getHoveredIndex = (x: number, y: number): number | null => {
    const localY = y - (this.yPx + this.padY);
    if (localY < 0) return null;
    const idx = Math.floor(localY / this.rowH);
    if (idx < 0 || idx >= this.items.length) return null;
    return idx;
  };

  draw = (delta: number) => {
    delta;
    if (!this.open) return;

    // RuneScape-style: menu only persists while cursor stays near it (desktop only).
    // (On mobile there is no persistent cursor, so do not auto-close here.)
    const mx = Input.mouseX;
    const my = Input.mouseY;
    if (
      !GameConstants.isMobile &&
      mx !== undefined &&
      my !== undefined &&
      !this.isPointInMenuWithMargin(mx, my, this.closeMarginPx)
    ) {
      this.close();
      return;
    }

    Game.ctx.save();

    // Background + border
    Game.ctx.globalAlpha = 0.95;
    Game.ctx.fillStyle = "rgba(12, 16, 22, 0.95)";
    Game.ctx.fillRect(this.xPx, this.yPx, this.widthPx, this.heightPx);
    Game.ctx.globalAlpha = 1;
    Game.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(this.xPx, this.yPx, this.widthPx, this.heightPx);

    const hovered =
      mx !== undefined && my !== undefined && this.isPointInMenu(mx, my)
        ? this.getHoveredIndex(mx, my)
        : null;

    // Items
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const rowX = this.xPx + this.padX;
      const rowTop = this.yPx + this.padY + i * this.rowH;

      if (hovered === i) {
        Game.ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        Game.ctx.fillRect(
          this.xPx + 1,
          rowTop,
          this.widthPx - 2,
          this.rowH,
        );
      }

      Game.ctx.fillStyle = "white";
      const textY =
        rowTop + Math.floor((this.rowH - Game.letter_height) / 2);
      Game.fillText(item.label, rowX, textY);
    }

    Game.ctx.restore();
  };
}


