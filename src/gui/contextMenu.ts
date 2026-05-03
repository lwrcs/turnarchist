import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Input } from "../game/input";

export type ContextMenuItem = {
  label: string;
  /**
   * Optional "target name" suffix (e.g., Attack + Zombie) drawn in yellow.
   * Not used for generic menu items like Cancel.
   */
  targetName?: string;
  onClick: () => void;
  enabled?: boolean;
  onDisabledClick?: () => void;
  /** If set, clicking this item opens a submenu instead of firing onClick. */
  submenu?: ContextMenuItem[];
};

/**
 * Simple RuneScape-style context menu with optional one-level submenus:
 * - Opens at the click location, extending down/right.
 * - Clamps on-screen if it would overflow.
 * - Clicking outside closes it.
 * - Items with `submenu` show a ▸ indicator; hovering (desktop) or tapping
 *   (mobile) them opens the submenu to the right at the same row height.
 */
export class ContextMenu {
  open: boolean = false;
  private xPx: number = 0;
  private yPx: number = 0;
  private items: ContextMenuItem[] = [];
  keyboardIndex: number = -1;
  private isKeyboardTriggered: boolean = false;

  // Cached layout
  private widthPx: number = 0;
  private heightPx: number = 0;
  private readonly padX = 6;
  private readonly padY = 6;
  private readonly rowH = Game.letter_height + 8;
  private readonly closeMarginPx = 10;
  private readonly targetNameColor = "rgb(255, 210, 74)";
  private readonly targetNameDisabledColor = "rgba(255, 210, 74, 0.65)";
  private readonly submenuArrow = ">";

  // Submenu state
  private activeSubmenuIndex: number | null = null;
  private subXPx: number = 0;
  private subYPx: number = 0;
  private subWidthPx: number = 0;
  private subHeightPx: number = 0;

  private getDisplayLabel = (it: ContextMenuItem): string => {
    const t = typeof it.targetName === "string" ? it.targetName.trim() : "";
    return t.length > 0 ? `${it.label} ${t}` : it.label;
  };

  openAt = (xPx: number, yPx: number, items: ContextMenuItem[], fromKeyboard?: boolean) => {
    this.items = items;
    this.open = true;
    this.xPx = Math.round(xPx);
    this.yPx = Math.round(yPx);
    this.isKeyboardTriggered = fromKeyboard ?? false;
    this.keyboardIndex = fromKeyboard ? 0 : -1;
    this.activeSubmenuIndex = null;
    this.recomputeLayoutAndClamp();
  };

  close = () => {
    this.open = false;
    this.keyboardIndex = -1;
    this.isKeyboardTriggered = false;
    this.activeSubmenuIndex = null;
  };

  navigate = (delta: 1 | -1) => {
    if (!this.open || this.items.length === 0) return;
    if (this.keyboardIndex === -1) this.keyboardIndex = delta > 0 ? 0 : this.items.length - 1;
    else this.keyboardIndex = (this.keyboardIndex + delta + this.items.length) % this.items.length;
  };

  executeKeyboardSelected = (): boolean => {
    if (!this.open || this.keyboardIndex < 0) return false;
    const item = this.items[this.keyboardIndex];
    if (!item) return false;
    if (item.enabled === false) {
      item.onDisabledClick?.();
      return false;
    }
    if (item.submenu) {
      // Open submenu on keyboard confirm
      this.activeSubmenuIndex = this.keyboardIndex;
      this.recomputeSubmenuLayout(this.keyboardIndex);
      return true;
    }
    this.close();
    item.onClick();
    return true;
  };

  private recomputeLayoutAndClamp = () => {
    const arrowW = Game.measureText(` ${this.submenuArrow}`).width;
    const labels = this.items.map((it) => {
      const base = this.getDisplayLabel(it);
      return it.submenu ? base + ` ${this.submenuArrow}` : base;
    });
    const maxW = Math.max(1, ...labels.map((s) => Game.measureText(s).width));
    this.widthPx = this.padX * 2 + maxW;
    this.heightPx = this.padY * 2 + this.items.length * this.rowH;

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

  private recomputeSubmenuLayout = (parentIndex: number) => {
    const sub = this.items[parentIndex]?.submenu;
    if (!sub || sub.length === 0) return;

    const labels = sub.map((it) => this.getDisplayLabel(it));
    const maxW = Math.max(1, ...labels.map((s) => Game.measureText(s).width));
    this.subWidthPx = this.padX * 2 + maxW;
    this.subHeightPx = this.padY * 2 + sub.length * this.rowH;

    // Default: open to the right of the main menu, aligned to the parent row top
    const rowTopY = this.yPx + this.padY + parentIndex * this.rowH;
    let sx = this.xPx + this.widthPx + 2;
    let sy = rowTopY;

    // Clamp on screen
    const margin = 2;
    if (sx + this.subWidthPx > GameConstants.WIDTH - margin) {
      // Open to the left instead
      sx = this.xPx - this.subWidthPx - 2;
    }
    if (sy + this.subHeightPx > GameConstants.HEIGHT - margin) {
      sy = GameConstants.HEIGHT - margin - this.subHeightPx;
    }
    if (sx < margin) sx = margin;
    if (sy < margin) sy = margin;

    this.subXPx = sx;
    this.subYPx = sy;
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

  private isPointInSubmenu = (x: number, y: number): boolean => {
    if (!this.open || this.activeSubmenuIndex === null) return false;
    return (
      x >= this.subXPx &&
      x <= this.subXPx + this.subWidthPx &&
      y >= this.subYPx &&
      y <= this.subYPx + this.subHeightPx
    );
  };

  private isPointInEitherMenu = (x: number, y: number, marginPx: number): boolean => {
    if (!this.open) return false;
    const inMain =
      x >= this.xPx - marginPx &&
      x <= this.xPx + this.widthPx + marginPx &&
      y >= this.yPx - marginPx &&
      y <= this.yPx + this.heightPx + marginPx;
    if (inMain) return true;
    if (this.activeSubmenuIndex === null) return false;
    return (
      x >= this.subXPx - marginPx &&
      x <= this.subXPx + this.subWidthPx + marginPx &&
      y >= this.subYPx - marginPx &&
      y <= this.subYPx + this.subHeightPx + marginPx
    );
  };

  handleMouseDown = (x: number, y: number, button: 0 | 2): boolean => {
    if (!this.open) return false;

    // Click in submenu
    if (this.isPointInSubmenu(x, y)) {
      if (button !== 0) return true;
      const idx = this.getHoveredIndexIn(x, y, this.subXPx, this.subYPx, this.subHeightPx);
      const sub = this.activeSubmenuIndex !== null ? this.items[this.activeSubmenuIndex]?.submenu : null;
      const subItem = sub && idx !== null ? sub[idx] : null;
      if (!subItem) return true;
      if (subItem.enabled === false) {
        subItem.onDisabledClick?.();
        return true;
      }
      try { subItem.onClick(); } finally { this.close(); }
      return true;
    }

    // Click outside both menus
    if (!this.isPointInMenu(x, y)) {
      this.close();
      return true;
    }

    if (button !== 0) return true;

    const idx = this.getHoveredIndex(x, y);
    const item = idx !== null ? this.items[idx] : null;
    if (!item) return true;

    const enabled = item.enabled !== false;
    if (!enabled) {
      item.onDisabledClick?.();
      return true;
    }

    // Item has submenu: toggle it open (or switch to new one)
    if (item.submenu) {
      if (this.activeSubmenuIndex === idx) {
        // Second tap on the same parent closes the submenu
        this.activeSubmenuIndex = null;
      } else {
        this.activeSubmenuIndex = idx;
        this.recomputeSubmenuLayout(idx);
      }
      return true;
    }

    try { item.onClick(); } finally { this.close(); }
    return true;
  };

  private getHoveredIndex = (x: number, y: number): number | null => {
    return this.getHoveredIndexIn(x, y, this.xPx, this.yPx, this.heightPx);
  };

  private getHoveredIndexIn = (
    x: number,
    y: number,
    menuX: number,
    menuY: number,
    menuH: number,
  ): number | null => {
    const localY = y - (menuY + this.padY);
    if (localY < 0) return null;
    const idx = Math.floor(localY / this.rowH);
    const totalRows = Math.round((menuH - this.padY * 2) / this.rowH);
    if (idx < 0 || idx >= totalRows) return null;
    return idx;
  };

  draw = (delta: number) => {
    delta;
    if (!this.open) return;

    const mx = Input.mouseX;
    const my = Input.mouseY;

    // Auto-close when mouse drifts away (desktop only, non-keyboard triggered).
    if (
      !GameConstants.isMobile &&
      !this.isKeyboardTriggered &&
      mx !== undefined &&
      my !== undefined &&
      !this.isPointInEitherMenu(mx, my, this.closeMarginPx)
    ) {
      this.close();
      return;
    }

    // Auto-open submenu on hover (desktop only).
    if (!GameConstants.isMobile && mx !== undefined && my !== undefined) {
      if (this.isPointInMenu(mx, my)) {
        const hIdx = this.getHoveredIndex(mx, my);
        if (hIdx !== null && this.items[hIdx]?.submenu) {
          if (this.activeSubmenuIndex !== hIdx) {
            this.activeSubmenuIndex = hIdx;
            this.recomputeSubmenuLayout(hIdx);
          }
        } else if (hIdx !== null && !this.items[hIdx]?.submenu) {
          // Hovering a non-submenu row closes submenu only if mouse isn't in the submenu.
          if (!this.isPointInSubmenu(mx, my)) {
            this.activeSubmenuIndex = null;
          }
        }
      }
    }

    Game.ctx.save();

    // Draw main menu panel
    this.drawPanel(
      this.xPx, this.yPx, this.widthPx, this.heightPx,
      this.items, mx, my,
      /* isMain */ true,
    );

    // Draw submenu panel
    if (this.activeSubmenuIndex !== null) {
      const sub = this.items[this.activeSubmenuIndex]?.submenu;
      if (sub && sub.length > 0) {
        this.drawPanel(
          this.subXPx, this.subYPx, this.subWidthPx, this.subHeightPx,
          sub, mx, my,
          /* isMain */ false,
        );
      }
    }

    Game.ctx.restore();
  };

  private drawPanel = (
    px: number,
    py: number,
    pw: number,
    ph: number,
    items: ContextMenuItem[],
    mx: number,
    my: number,
    isMain: boolean,
  ) => {
    Game.ctx.save();

    Game.ctx.globalAlpha = 0.95;
    Game.ctx.fillStyle = "rgba(12, 16, 22, 0.95)";
    Game.ctx.fillRect(px, py, pw, ph);
    Game.ctx.globalAlpha = 1;
    Game.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(px, py, pw, ph);

    const inThisPanel = isMain ? this.isPointInMenu(mx, my) : this.isPointInSubmenu(mx, my);
    const hovered = inThisPanel
      ? this.getHoveredIndexIn(mx, my, px, py, ph)
      : null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowX = px + this.padX;
      const rowTop = py + this.padY + i * this.rowH;
      const enabled = item.enabled !== false;

      const isParentOfOpenSubmenu = isMain && this.activeSubmenuIndex === i;
      const isKeyboardSelected = isMain && this.keyboardIndex === i;

      if (hovered === i || isParentOfOpenSubmenu) {
        Game.ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        Game.ctx.fillRect(px + 1, rowTop, pw - 2, this.rowH);
      } else if (isKeyboardSelected) {
        const grow = 2;
        Game.ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        Game.ctx.fillRect(px + 1 - grow, rowTop - grow, pw - 2 + grow * 2, this.rowH + grow * 2);
      }

      const textY = rowTop + Math.floor((this.rowH - Game.letter_height) / 2);
      Game.ctx.fillStyle = enabled ? "white" : "rgba(200, 200, 200, 0.55)";
      Game.fillText(item.label, rowX, textY);

      const t = typeof item.targetName === "string" ? item.targetName.trim() : "";
      if (t.length > 0) {
        const prefixW = Game.measureText(`${item.label} `).width;
        Game.ctx.fillStyle = enabled ? this.targetNameColor : this.targetNameDisabledColor;
        Game.fillText(t, rowX + prefixW, textY);
      }

      // Submenu arrow indicator on the right edge
      if (item.submenu) {
        const arrowStr = this.submenuArrow;
        const arrowW = Game.measureText(arrowStr).width;
        Game.ctx.fillStyle = enabled ? "rgba(200, 200, 200, 0.7)" : "rgba(200, 200, 200, 0.3)";
        Game.fillText(arrowStr, px + pw - this.padX - arrowW, textY);
      }
    }

    Game.ctx.restore();
  };
}
