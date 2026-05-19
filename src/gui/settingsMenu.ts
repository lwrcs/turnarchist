import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { GameplaySettings } from "../game/gameplaySettings";
import { InputEnum } from "../game/input";
import { MouseCursor } from "./mouseCursor";
import { Sound } from "../sound/sound";

type SettingsItemKind = "toggle" | "action";

interface SettingsItem {
  label: string;
  kind: SettingsItemKind;
  getState?: () => boolean;
  onActivate: () => void;
}

interface SettingsCategory {
  name: string;
  items: SettingsItem[];
}

const BUTTON_HEIGHT = 14;
const SPACING = 2;
const SIDEBAR_PADDING = 12;
const CONTENT_PADDING = 24;
const PANEL_GAP = 4;
const CHECKBOX_SIZE = 7;
const CHECKBOX_MARGIN = 4;
const DISMISS_MARGIN = 10;

export class SettingsMenu {
  open: boolean = false;
  private game: Game;
  private categories: SettingsCategory[];
  private activeCategoryIndex: number = 0;
  private activeItemIndex: number = 0;
  private focusPanel: "sidebar" | "content" = "sidebar";
  private scrollOffset: number = 0;

  // Hover animation state per slot
  private sidebarHoverAnims: number[] = [];
  private contentHoverAnims: number[] = [];

  // Debouncing
  private lastClickTime: number = 0;
  private readonly CLICK_DEBOUNCE = 150;

  // Fade animation
  private openFade: { kind: "opening" | "closing"; startMs: number; durationMs: number } | null = null;

  // Layout mode: sidebar (wide) or topbar (narrow/mobile)
  private layoutMode: "sidebar" | "topbar" = "sidebar";

  // Track input method for hover behavior
  private lastInputWasMouse: boolean = false;

  // Cached layout (recomputed on open / resize)
  private sidebarX: number = 0;
  private sidebarY: number = 0;
  private sidebarWidth: number = 0;
  private contentX: number = 0;
  private contentY: number = 0;
  private contentWidth: number = 0;
  private visibleContentHeight: number = 0;

  // Topbar-specific layout
  private topbarX: number = 0;
  private topbarY: number = 0;
  private topbarButtonWidth: number = 0;

  constructor(game: Game) {
    this.game = game;
    this.categories = this.buildCategories();
    this.sidebarHoverAnims = new Array(this.categories.length).fill(0);
    this.contentHoverAnims = new Array(10).fill(0);
  }

  private buildCategories(): SettingsCategory[] {
    return [
      {
        name: "Graphics",
        items: [
          { label: "- Scale", kind: "action", onActivate: () => this.game.decreaseScale() },
          { label: "+ Scale", kind: "action", onActivate: () => this.game.increaseScale() },
          {
            label: "Smooth Lighting",
            kind: "toggle",
            getState: () => GameConstants.SMOOTH_LIGHTING,
            onActivate: () => {
              GameConstants.SMOOTH_LIGHTING = !GameConstants.SMOOTH_LIGHTING;
              this.game.pushMessage(`Smooth lighting is now ${GameConstants.SMOOTH_LIGHTING ? "enabled" : "disabled"}`);
              this.saveSettings();
            },
          },
          {
            label: "Screen Shake",
            kind: "toggle",
            getState: () => GameConstants.SCREEN_SHAKE_ENABLED,
            onActivate: () => {
              GameConstants.SCREEN_SHAKE_ENABLED = !GameConstants.SCREEN_SHAKE_ENABLED;
              this.game.pushMessage(`Screen shake is now ${GameConstants.SCREEN_SHAKE_ENABLED ? "enabled" : "disabled"}`);
              this.saveSettings();
            },
          },
        ],
      },
      {
        name: "Audio",
        items: [
          {
            label: "Mute Sound",
            kind: "toggle",
            getState: () => Sound.audioMuted,
            onActivate: () => {
              Sound.toggleMute();
              this.game.pushMessage(Sound.audioMuted ? "Sound Muted" : "Sound Unmuted");
              this.saveSettings();
            },
          },
        ],
      },
      {
        name: "Controls",
        items: [
          {
            label: "Slow Inputs Near Enemies",
            kind: "toggle",
            getState: () => GameConstants.SLOW_INPUTS_NEAR_ENEMIES,
            onActivate: () => {
              GameConstants.SLOW_INPUTS_NEAR_ENEMIES = !GameConstants.SLOW_INPUTS_NEAR_ENEMIES;
              this.game.pushMessage(`Slow inputs near enemies is now ${GameConstants.SLOW_INPUTS_NEAR_ENEMIES ? "enabled" : "disabled"}`);
              this.saveSettings();
            },
          },
          {
            label: "Hover Text",
            kind: "toggle",
            getState: () => GameConstants.HOVER_TEXT_ENABLED,
            onActivate: () => {
              GameConstants.HOVER_TEXT_ENABLED = !GameConstants.HOVER_TEXT_ENABLED;
              this.game.pushMessage(`Hover text is now ${GameConstants.HOVER_TEXT_ENABLED ? "enabled" : "disabled"}`);
              this.saveSettings();
            },
          },
        ],
      },
      {
        name: "Game",
        items: [
          {
            label: "Crossbow Intercept",
            kind: "toggle",
            getState: () => GameplaySettings.CROSSBOW_LINE_INTERCEPT,
            onActivate: () => {
              GameplaySettings.CROSSBOW_LINE_INTERCEPT = !GameplaySettings.CROSSBOW_LINE_INTERCEPT;
              this.game.pushMessage(
                `Crossbow intercept is now ${GameplaySettings.CROSSBOW_LINE_INTERCEPT ? "enabled" : "disabled"}`,
              );
              this.saveSettings();
            },
          },
          {
            label: "New Game",
            kind: "action",
            onActivate: () => {
              this.close();
              this.game.newGame();
            },
          },
        ],
      },
    ];
  }

  private saveSettings() {
    try {
      const { saveSettings } = require("../game/settingsPersistence");
      saveSettings(this.game);
    } catch {}
  }

  toggleOpen() {
    if (this.open && (!this.openFade || this.openFade.kind !== "closing")) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.open = true;
    this.focusPanel = "sidebar";
    this.activeItemIndex = 0;
    this.scrollOffset = 0;
    this.openFade = { kind: "opening", startMs: Date.now(), durationMs: 160 };
    this.computeLayout();
  }

  close() {
    if (!this.open) return;
    this.openFade = { kind: "closing", startMs: Date.now(), durationMs: 140 };
  }

  private openAlpha(): number {
    if (!this.open) return 0;
    if (!this.openFade) return 1;
    const t = Math.max(0, Math.min(1, (Date.now() - this.openFade.startMs) / this.openFade.durationMs));
    const ease = t * (2 - t); // ease-out quadratic
    if (this.openFade.kind === "opening") {
      if (t >= 1) this.openFade = null;
      return ease;
    }
    const a = 1 - ease;
    if (t >= 1) {
      this.openFade = null;
      this.open = false;
    }
    return a;
  }

  private computeLayout() {
    const screenW = GameConstants.WIDTH;
    const screenH = GameConstants.HEIGHT;
    const MARGIN = 6;

    // Sidebar width: longest category name + padding
    let maxSidebarText = 0;
    for (const cat of this.categories) {
      const w = Game.measureText(cat.name).width;
      if (w > maxSidebarText) maxSidebarText = w;
    }
    this.sidebarWidth = maxSidebarText + SIDEBAR_PADDING;

    // Content width: longest label across ALL categories + padding (checkbox area + text padding)
    let maxContentText = 0;
    for (const cat of this.categories) {
      for (const item of cat.items) {
        const w = Game.measureText(item.label).width;
        if (w > maxContentText) maxContentText = w;
      }
    }
    this.contentWidth = maxContentText + CONTENT_PADDING;

    // Decide layout mode based on available width (extra 16px padding before switching)
    const sidebarTotalWidth = this.sidebarWidth + PANEL_GAP + this.contentWidth;
    if (sidebarTotalWidth + MARGIN * 2 + 16 > screenW) {
      this.layoutMode = "topbar";
    } else {
      this.layoutMode = "sidebar";
    }

    const items = this.categories[this.activeCategoryIndex].items;

    if (this.layoutMode === "sidebar") {
      // --- SIDEBAR LAYOUT (wide screens) ---
      const startX = Math.round((screenW - sidebarTotalWidth) / 2);
      this.sidebarX = startX;
      this.contentX = startX + this.sidebarWidth + PANEL_GAP;

      const sidebarHeight = this.categories.length * (BUTTON_HEIGHT + SPACING) - SPACING;
      const contentHeight = items.length * (BUTTON_HEIGHT + SPACING) - SPACING;
      const tallest = Math.max(sidebarHeight, contentHeight);
      const topY = Math.round((screenH - tallest) / 2);
      this.sidebarY = topY;
      this.contentY = topY;
      this.visibleContentHeight = screenH - topY * 2;
    } else {
      // --- TOPBAR LAYOUT (narrow screens) ---
      // Topbar button width: same as sidebar button width so text fits
      this.topbarButtonWidth = this.sidebarWidth;

      // Topbar: 2x2 grid of category buttons, centered
      const topbarCols = 2;
      const topbarRows = Math.ceil(this.categories.length / topbarCols);
      const topbarTotalWidth = topbarCols * (this.topbarButtonWidth + SPACING) - SPACING;
      const topbarTotalHeight = topbarRows * (BUTTON_HEIGHT + SPACING) - SPACING;
      this.topbarX = Math.round((screenW - topbarTotalWidth) / 2);
      this.topbarY = MARGIN + 10;

      // Content panel: centered below topbar grid, clamped to screen width
      const maxContentWidth = screenW - MARGIN * 2;
      this.contentWidth = Math.min(this.contentWidth, maxContentWidth);
      this.contentX = Math.round((screenW - this.contentWidth) / 2);
      this.contentY = this.topbarY + topbarTotalHeight + PANEL_GAP;

      this.visibleContentHeight = screenH - this.contentY - MARGIN;
    }

    // Ensure hover anim arrays are sized
    while (this.contentHoverAnims.length < items.length) {
      this.contentHoverAnims.push(0);
    }
  }

  // ==================== DRAWING ====================

  draw(delta: number) {
    if (!this.open) return;
    const alpha = this.openAlpha();
    if (alpha <= 0) return;

    const ctx = Game.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    // Scrim
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Recompute layout in case of resize
    this.computeLayout();

    // Draw sidebar
    this.drawSidebar(delta);

    // Draw content
    this.drawContent(delta);

    ctx.restore();
  }

  private drawSidebar(delta: number) {
    const ctx = Game.ctx;
    for (let i = 0; i < this.categories.length; i++) {
      const cat = this.categories[i];

      // Position depends on layout mode
      let btnX: number, btnY: number, btnW: number;
      if (this.layoutMode === "topbar") {
        const pos = this.getTopbarButtonPos(i);
        btnX = pos.x;
        btnY = pos.y;
        btnW = this.topbarButtonWidth;
      } else {
        btnX = this.sidebarX;
        btnY = this.sidebarY + i * (BUTTON_HEIGHT + SPACING);
        btnW = this.sidebarWidth;
      }

      // Hover animation (only for mouse input)
      const isSelected = this.focusPanel === "sidebar" && this.activeCategoryIndex === i;
      const isActive = this.activeCategoryIndex === i;
      let hovered = false;
      if (this.lastInputWasMouse) {
        const cursor = MouseCursor.getInstance().getPosition();
        hovered = this.isPointInRect(cursor.x, cursor.y, btnX, btnY, btnW, BUTTON_HEIGHT);
      }
      const target = (isSelected || hovered) ? 1 : 0;
      this.sidebarHoverAnims[i] += 0.3 * delta * (target - this.sidebarHoverAnims[i]);
      this.sidebarHoverAnims[i] = Math.max(0, Math.min(1, this.sidebarHoverAnims[i]));
      const growPx = Math.round(1 * this.sidebarHoverAnims[i]);

      const bx = Math.round(btnX - growPx);
      const by = Math.round(btnY - growPx);
      const bw = Math.round(btnW + 2 * growPx);
      const bh = Math.round(BUTTON_HEIGHT + 2 * growPx);

      // Background - darker and more opaque if this is the active category
      ctx.fillStyle = isActive ? "rgba(40, 40, 40, 0.8)" : "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(bx, by, bw, bh);

      // Text (centered)
      ctx.fillStyle = "rgba(255, 255, 0, 1)";
      const textW = Game.measureText(cat.name).width;
      const textX = Math.round(bx + (bw - textW) / 2);
      const textY = Math.round(by + (bh - Game.letter_height) / 2);
      Game.fillText(cat.name, textX, textY);
    }
  }

  private drawContent(delta: number) {
    const ctx = Game.ctx;
    const items = this.categories[this.activeCategoryIndex].items;

    // Clip to content area for scrolling
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.contentX - 1, this.contentY - 1, this.contentWidth + 2, this.visibleContentHeight + 2);
    ctx.clip();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const baseY = this.contentY + i * (BUTTON_HEIGHT + SPACING) - this.scrollOffset;

      // Hover animation (only for mouse input)
      const isSelected = this.focusPanel === "content" && this.activeItemIndex === i;
      let hovered = false;
      if (this.lastInputWasMouse) {
        const cursor = MouseCursor.getInstance().getPosition();
        hovered = this.isPointInRect(cursor.x, cursor.y, this.contentX, baseY, this.contentWidth, BUTTON_HEIGHT);
      }
      const target = (isSelected || hovered) ? 1 : 0;
      if (i >= this.contentHoverAnims.length) this.contentHoverAnims.push(0);
      this.contentHoverAnims[i] += 0.3 * delta * (target - this.contentHoverAnims[i]);
      this.contentHoverAnims[i] = Math.max(0, Math.min(1, this.contentHoverAnims[i]));
      const growPx = Math.round(1 * this.contentHoverAnims[i]);

      const bx = Math.round(this.contentX - growPx);
      const by = Math.round(baseY - growPx);
      const bw = Math.round(this.contentWidth + 2 * growPx);
      const bh = Math.round(BUTTON_HEIGHT + 2 * growPx);

      // Background
      ctx.fillStyle = isSelected ? "rgba(75, 75, 75, 0.5)" : "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(bx, by, bw, bh);

      // Checkbox for toggles
      const textStartX = this.contentX + CHECKBOX_MARGIN + CHECKBOX_SIZE + 4;
      if (item.kind === "toggle") {
        const checkX = Math.round(this.contentX + CHECKBOX_MARGIN);
        const checkY = Math.round(baseY + (BUTTON_HEIGHT - CHECKBOX_SIZE) / 2);
        // Draw 1px border using fillRects for pixel perfection
        ctx.fillStyle = "rgba(255, 255, 0, 1)";
        // Top
        ctx.fillRect(checkX, checkY, CHECKBOX_SIZE, 1);
        // Bottom
        ctx.fillRect(checkX, checkY + CHECKBOX_SIZE - 1, CHECKBOX_SIZE, 1);
        // Left
        ctx.fillRect(checkX, checkY, 1, CHECKBOX_SIZE);
        // Right
        ctx.fillRect(checkX + CHECKBOX_SIZE - 1, checkY, 1, CHECKBOX_SIZE);

        // Fill if toggled
        if (item.getState && item.getState()) {
          ctx.fillRect(checkX + 2, checkY + 2, CHECKBOX_SIZE - 4, CHECKBOX_SIZE - 4);
        }
      }

      // Text
      ctx.fillStyle = "rgba(255, 255, 0, 1)";
      const textX = Math.round(item.kind === "toggle" ? textStartX : this.contentX + CHECKBOX_MARGIN);
      const textY = Math.round(baseY + (BUTTON_HEIGHT - Game.letter_height) / 2);
      Game.fillText(item.label, textX, textY);
    }

    ctx.restore();

    // Scroll indicator
    const totalContentH = items.length * (BUTTON_HEIGHT + SPACING) - SPACING;
    if (totalContentH > this.visibleContentHeight) {
      const barHeight = Math.max(4, Math.round(this.visibleContentHeight * (this.visibleContentHeight / totalContentH)));
      const barY = Math.round(this.contentY + (this.scrollOffset / (totalContentH - this.visibleContentHeight)) * (this.visibleContentHeight - barHeight));
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(this.contentX + this.contentWidth + 1, barY, 2, barHeight);
    }
  }


  // ==================== INPUT ====================

  inputHandler(input: InputEnum) {
    if (!this.open) return;
    if (this.openFade?.kind === "closing") return;
    const items = this.categories[this.activeCategoryIndex].items;

    // Arrow keys / WASD disable mouse hover; mouse move or click enables it
    if (input === InputEnum.UP || input === InputEnum.DOWN || input === InputEnum.LEFT || input === InputEnum.RIGHT) {
      this.lastInputWasMouse = false;
    } else if (input === InputEnum.LEFT_CLICK || input === InputEnum.MOUSE_MOVE) {
      this.lastInputWasMouse = true;
    }

    switch (input) {
      case InputEnum.ESCAPE:
        this.close();
        break;
      case InputEnum.UP:
        if (this.layoutMode === "topbar") {
          if (this.focusPanel === "content") {
            if (this.activeItemIndex === 0) {
              // Move focus back to topbar grid
              this.focusPanel = "sidebar";
            } else {
              this.activeItemIndex--;
              this.ensureItemVisible();
            }
          } else {
            // Move up one row in 2x2 grid (subtract 2)
            const prev = this.activeCategoryIndex - 2;
            if (prev >= 0) {
              this.activeCategoryIndex = prev;
              this.activeItemIndex = 0;
              this.scrollOffset = 0;
              this.resetContentHoverAnims();
            }
          }
        } else {
          if (this.focusPanel === "sidebar") {
            this.activeCategoryIndex = (this.activeCategoryIndex - 1 + this.categories.length) % this.categories.length;
            this.activeItemIndex = 0;
            this.scrollOffset = 0;
            this.resetContentHoverAnims();
          } else {
            this.activeItemIndex = (this.activeItemIndex - 1 + items.length) % items.length;
            this.ensureItemVisible();
          }
        }
        break;
      case InputEnum.DOWN:
        if (this.layoutMode === "topbar") {
          if (this.focusPanel === "sidebar") {
            // Move down one row in 2x2 grid (add 2), or into content if at bottom row
            const next = this.activeCategoryIndex + 2;
            if (next < this.categories.length) {
              this.activeCategoryIndex = next;
              this.activeItemIndex = 0;
              this.scrollOffset = 0;
              this.resetContentHoverAnims();
            } else {
              this.focusPanel = "content";
              this.activeItemIndex = 0;
              this.scrollOffset = 0;
            }
          } else {
            this.activeItemIndex = (this.activeItemIndex + 1) % items.length;
            this.ensureItemVisible();
          }
        } else {
          if (this.focusPanel === "sidebar") {
            this.activeCategoryIndex = (this.activeCategoryIndex + 1) % this.categories.length;
            this.activeItemIndex = 0;
            this.scrollOffset = 0;
            this.resetContentHoverAnims();
          } else {
            this.activeItemIndex = (this.activeItemIndex + 1) % items.length;
            this.ensureItemVisible();
          }
        }
        break;
      case InputEnum.RIGHT:
        if (this.layoutMode === "topbar") {
          if (this.focusPanel === "sidebar") {
            // Move right one column in 2x2 grid
            const col = this.activeCategoryIndex % 2;
            if (col === 0 && this.activeCategoryIndex + 1 < this.categories.length) {
              this.activeCategoryIndex++;
              this.activeItemIndex = 0;
              this.scrollOffset = 0;
              this.resetContentHoverAnims();
            }
          }
        } else {
          if (this.focusPanel === "sidebar") {
            this.focusPanel = "content";
            this.activeItemIndex = 0;
            this.scrollOffset = 0;
          }
        }
        break;
      case InputEnum.LEFT:
        if (this.layoutMode === "topbar") {
          if (this.focusPanel === "sidebar") {
            // Move left one column in 2x2 grid
            const col = this.activeCategoryIndex % 2;
            if (col === 1) {
              this.activeCategoryIndex--;
              this.activeItemIndex = 0;
              this.scrollOffset = 0;
              this.resetContentHoverAnims();
            }
          }
        } else {
          if (this.focusPanel === "content") {
            this.focusPanel = "sidebar";
          }
        }
        break;
      case InputEnum.SPACE:
      case InputEnum.ENTER:
        if (this.focusPanel === "sidebar") {
          this.focusPanel = "content";
          this.activeItemIndex = 0;
        } else {
          this.activateItem(this.activeItemIndex);
        }
        break;
      case InputEnum.LEFT_CLICK: {
        const { x, y } = MouseCursor.getInstance().getPosition();
        this.handleClick(x, y);
        break;
      }
    }
  }

  private handleClick(x: number, y: number) {
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_DEBOUNCE) return;
    this.lastClickTime = now;

    // Sidebar / Topbar categories
    for (let i = 0; i < this.categories.length; i++) {
      let btnX: number, btnY: number, btnW: number;
      if (this.layoutMode === "topbar") {
        const pos = this.getTopbarButtonPos(i);
        btnX = pos.x;
        btnY = pos.y;
        btnW = this.topbarButtonWidth;
      } else {
        btnX = this.sidebarX;
        btnY = this.sidebarY + i * (BUTTON_HEIGHT + SPACING);
        btnW = this.sidebarWidth;
      }
      if (this.isPointInRect(x, y, btnX, btnY, btnW, BUTTON_HEIGHT)) {
        this.activeCategoryIndex = i;
        this.focusPanel = "sidebar";
        this.activeItemIndex = 0;
        this.scrollOffset = 0;
        this.resetContentHoverAnims();
        return;
      }
    }

    // Content
    const items = this.categories[this.activeCategoryIndex].items;
    for (let i = 0; i < items.length; i++) {
      const by = this.contentY + i * (BUTTON_HEIGHT + SPACING) - this.scrollOffset;
      if (this.isPointInRect(x, y, this.contentX, by, this.contentWidth, BUTTON_HEIGHT)) {
        this.focusPanel = "content";
        this.activeItemIndex = i;
        this.activateItem(i);
        return;
      }
    }

    // Click outside dismiss: if click is outside the menu panels + margin, close
    if (!this.isPointInMenuBounds(x, y)) {
      this.close();
    }
  }

  /** Check if a point is within the combined menu area (panels + margin). */
  private isPointInMenuBounds(px: number, py: number): boolean {
    let menuLeft: number, menuTop: number, menuRight: number, menuBottom: number;
    if (this.layoutMode === "topbar") {
      const lastPos = this.getTopbarButtonPos(this.categories.length - 1);
      menuLeft = this.topbarX;
      menuTop = this.topbarY;
      menuRight = Math.max(lastPos.x + this.topbarButtonWidth, this.contentX + this.contentWidth);
      menuBottom = this.contentY + this.visibleContentHeight;
    } else {
      menuLeft = this.sidebarX;
      menuTop = Math.min(this.sidebarY, this.contentY);
      menuRight = this.contentX + this.contentWidth;
      menuBottom = Math.max(
        this.sidebarY + this.categories.length * (BUTTON_HEIGHT + SPACING) - SPACING,
        this.contentY + this.visibleContentHeight,
      );
    }
    return this.isPointInRect(
      px, py,
      menuLeft - DISMISS_MARGIN, menuTop - DISMISS_MARGIN,
      (menuRight - menuLeft) + DISMISS_MARGIN * 2,
      (menuBottom - menuTop) + DISMISS_MARGIN * 2,
    );
  }

  private activateItem(index: number) {
    const items = this.categories[this.activeCategoryIndex].items;
    if (index >= 0 && index < items.length) {
      items[index].onActivate();
    }
  }

  private ensureItemVisible() {
    const itemTop = this.activeItemIndex * (BUTTON_HEIGHT + SPACING);
    const itemBottom = itemTop + BUTTON_HEIGHT;
    if (itemTop < this.scrollOffset) {
      this.scrollOffset = itemTop;
    } else if (itemBottom > this.scrollOffset + this.visibleContentHeight) {
      this.scrollOffset = itemBottom - this.visibleContentHeight;
    }
    this.scrollOffset = Math.round(Math.max(0, this.scrollOffset));
  }

  private resetContentHoverAnims() {
    for (let i = 0; i < this.contentHoverAnims.length; i++) {
      this.contentHoverAnims[i] = 0;
    }
  }

  handleWheel(deltaY: number) {
    if (!this.open) return;
    const items = this.categories[this.activeCategoryIndex].items;
    const totalH = items.length * (BUTTON_HEIGHT + SPACING) - SPACING;
    if (totalH <= this.visibleContentHeight) return;
    this.scrollOffset += deltaY > 0 ? (BUTTON_HEIGHT + SPACING) : -(BUTTON_HEIGHT + SPACING);
    this.scrollOffset = Math.round(Math.max(0, Math.min(totalH - this.visibleContentHeight, this.scrollOffset)));
  }

  // ==================== UTILITY ====================

  /** Get the x,y position of a topbar category button in the 2x2 grid. */
  private getTopbarButtonPos(index: number): { x: number; y: number } {
    const col = index % 2;
    const row = Math.floor(index / 2);
    return {
      x: this.topbarX + col * (this.topbarButtonWidth + SPACING),
      y: this.topbarY + row * (BUTTON_HEIGHT + SPACING),
    };
  }

  private isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
