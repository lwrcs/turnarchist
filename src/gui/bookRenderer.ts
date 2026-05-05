import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";

export type BookTheme = {
  backdrop: string;
  coverFill: string;
  coverStroke: string;
  spineStroke: string;
  pageFill: string;
  pageStroke: string;
  spritePanelFill: string;
  spritePanelStroke: string;
  text: string;
  accentText: string;
  closeFill: string;
  closeText: string;
};

export abstract class BookRenderer {
  isOpen: boolean = false;
  openTime: number = Date.now();
  protected currentPage: number = 0;
  protected activeSubpage: 0 | 1 = 0;
  protected previewAnimT = 0;
  private compactMode: boolean = false;

  theme: "parchment" | "slate" | "midnight" | "mahogany" | "arcana" = "parchment";

  private marginPx = (): number => {
    const m = Math.round(GameConstants.WIDTH * 0.04);
    return Math.max(6, Math.min(16, m));
  };

  private innerPadPx = (): number => {
    const p = Math.round(GameConstants.WIDTH * 0.03);
    return Math.max(4, Math.min(12, p));
  };

  private pageInsetPx = (): number => {
    const i = Math.round(GameConstants.WIDTH * 0.025);
    return Math.max(4, Math.min(10, i));
  };

  protected getTheme = (): BookTheme => {
    const THEMES = {
      parchment: {
        backdrop: "rgba(0, 0, 0, 0.8)",
        coverFill: "rgba(235, 225, 200, 1)",
        coverStroke: "rgba(120, 100, 80, 1)",
        spineStroke: "rgba(160, 140, 120, 1)",
        pageFill: "rgba(245, 238, 220, 1)",
        pageStroke: "rgba(200, 185, 160, 1)",
        spritePanelFill: "rgba(235, 225, 200, 1)",
        spritePanelStroke: "rgba(120, 100, 80, 1)",
        text: "rgba(40, 35, 30, 1)",
        accentText: "rgba(60, 50, 40, 1)",
        closeFill: "rgba(220, 60, 60, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      slate: {
        backdrop: "rgba(0, 0, 0, 0.85)",
        coverFill: "rgba(165, 170, 178, 1)",
        coverStroke: "rgba(78, 82, 90, 1)",
        spineStroke: "rgba(105, 110, 118, 1)",
        pageFill: "rgba(195, 198, 205, 1)",
        pageStroke: "rgba(120, 125, 135, 1)",
        spritePanelFill: "rgba(150, 154, 162, 1)",
        spritePanelStroke: "rgba(78, 82, 90, 1)",
        text: "rgba(30, 32, 36, 1)",
        accentText: "rgba(45, 48, 54, 1)",
        closeFill: "rgba(200, 70, 70, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      midnight: {
        backdrop: "rgba(0, 0, 0, 0.92)",
        coverFill: "rgba(75, 78, 86, 1)",
        coverStroke: "rgba(28, 30, 36, 1)",
        spineStroke: "rgba(45, 48, 56, 1)",
        pageFill: "rgba(100, 104, 114, 1)",
        pageStroke: "rgba(55, 58, 66, 1)",
        spritePanelFill: "rgba(78, 82, 92, 1)",
        spritePanelStroke: "rgba(28, 30, 36, 1)",
        text: "rgba(245, 246, 248, 1)",
        accentText: "rgba(220, 222, 226, 1)",
        closeFill: "rgba(185, 60, 60, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      mahogany: {
        backdrop: "rgba(0, 0, 0, 0.92)",
        coverFill: "rgba(70, 28, 24, 1)",
        coverStroke: "rgba(24, 10, 10, 1)",
        spineStroke: "rgba(40, 16, 14, 1)",
        pageFill: "rgba(92, 38, 30, 1)",
        pageStroke: "rgba(40, 16, 14, 1)",
        spritePanelFill: "rgba(62, 24, 20, 1)",
        spritePanelStroke: "rgba(24, 10, 10, 1)",
        text: "rgba(248, 240, 236, 1)",
        accentText: "rgba(230, 214, 206, 1)",
        closeFill: "rgba(190, 58, 58, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      arcana: {
        backdrop: "rgba(0, 0, 0, 0.9)",
        coverFill: "rgba(118, 104, 146, 1)",
        coverStroke: "rgba(44, 34, 66, 1)",
        spineStroke: "rgba(68, 54, 96, 1)",
        pageFill: "rgba(150, 136, 178, 1)",
        pageStroke: "rgba(78, 62, 110, 1)",
        spritePanelFill: "rgba(110, 96, 140, 1)",
        spritePanelStroke: "rgba(44, 34, 66, 1)",
        text: "rgba(18, 12, 28, 1)",
        accentText: "rgba(34, 20, 52, 1)",
        closeFill: "rgba(196, 70, 110, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
    } as const;

    return THEMES[this.theme];
  };

  private leftArrowRect: { x: number; y: number; w: number; h: number } | null = null;
  private rightArrowRect: { x: number; y: number; w: number; h: number } | null = null;
  private closeRect: { x: number; y: number; w: number; h: number } | null = null;
  private backRect: { x: number; y: number; w: number; h: number } | null = null;

  protected backCallback: (() => void) | null = null;

  setBackCallback(cb: (() => void) | null): void {
    this.backCallback = cb;
  }

  private pageTransition: {
    startMs: number;
    durationMs: number;
    mode: "commit" | "cancel";
    dir: -1 | 1;
    fromPage: number;
    toPage: number;
    fromSubpage: 0 | 1;
    toSubpage: 0 | 1;
    startOffsetPx: number;
    endOffsetPx: number;
  } | null = null;

  private openFade: {
    kind: "opening" | "closing";
    startMs: number;
    durationMs: number;
  } | null = null;

  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCanvasCtx: CanvasRenderingContext2D | null = null;

  private touchDrag: {
    active: boolean;
    startX: number;
    startY: number;
    x: number;
    y: number;
    offsetPx: number;
    dir: -1 | 1;
    toPage: number;
    toSubpage: 0 | 1;
  } | null = null;

  // ── Abstract interface ────────────────────────────────────────────────────

  abstract getPageCount(): number;

  abstract drawLeftPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    theme: BookTheme,
  ): void;

  abstract drawRightPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    theme: BookTheme,
  ): void;

  // ── Protected hooks (no-op defaults; subclasses override as needed) ───────

  /** Called once per draw frame before the book is rendered. */
  protected onBeforeDraw(_delta: number): void {}

  /** Return a pixel offset to translate the entire book this frame. */
  protected getShakeOffset(): { x: number; y: number } { return { x: 0, y: 0 }; }

  /** Called when the active page changes (page transition committed). */
  protected onPageChanged(newPage: number): void {
    this.currentPage = newPage;
  }

  /** Called when a commit page transition begins (before animation plays). */
  protected onPageTransitionStart(_toPage: number): void {}

  /** Called when all hitbox rects are cleared (close fade complete, or animation started). */
  protected onHitboxesClear(): void {}

  /**
   * Called from handleMouseDown after the drag/transition guards pass.
   * Return true to consume the click (prevents close/arrow handling).
   */
  protected handleExtraClick(_x: number, _y: number): boolean {
    return false;
  }

  /** Whether stacked layout (left + right panels stacked vertically) should be used in compact mode. */
  protected stackedModeEnabled(): boolean {
    return false;
  }

  /** Label shown next to the page indicator in compact subpage mode. */
  protected subpageLabel(subpage: 0 | 1): string {
    return subpage === 0 ? "Info" : "View";
  }

  /** Called at the end of open() so subclasses can reset per-open state. */
  protected onOpen(): void {}

  // ── Concrete public API ───────────────────────────────────────────────────

  open = (): void => {
    this.isOpen = true;
    this.openTime = Date.now();
    this.previewAnimT = 0;
    this.openFade = { kind: "opening", startMs: Date.now(), durationMs: 160 };
    this.handleResize();
    this.onOpen();
  };

  close = (): void => {
    if (!this.isOpen) return;
    this.openFade = { kind: "closing", startMs: Date.now(), durationMs: 140 };
    this.touchDrag = null;
    this.pageTransition = null;
  };

  toggleOpen = (): void => {
    this.isOpen ? this.close() : this.open();
  };

  isPointInBookBounds = (x: number, y: number): boolean => {
    if (!this.isOpen) return false;
    const r = this.computeBookRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  isPointInBookControls = (x: number, y: number): boolean => {
    if (!this.isOpen) return false;
    if (this.openFade?.kind === "closing") return false;
    if (this.closeRect && this.pointInRect(x, y, this.closeRect)) return true;
    if (this.leftArrowRect && this.pointInRect(x, y, this.leftArrowRect)) return true;
    if (this.rightArrowRect && this.pointInRect(x, y, this.rightArrowRect)) return true;
    if (this.backRect && this.pointInRect(x, y, this.backRect)) return true;
    return false;
  };

  handleTouchStart = (x: number, y: number): boolean => {
    if (!this.isOpen) return false;
    if (!this.isPointInBookBounds(x, y)) return false;
    this.touchDrag = {
      active: false,
      startX: x,
      startY: y,
      x,
      y,
      offsetPx: 0,
      dir: 1,
      toPage: this.currentPage,
      toSubpage: this.activeSubpage,
    };
    return true;
  };

  handleTouchMove = (x: number, y: number): void => {
    if (!this.isOpen) return;
    if (!this.touchDrag) return;
    if (this.pageTransition) return;

    const r = this.computeBookRect();
    const dx = x - this.touchDrag.startX;
    const dy = y - this.touchDrag.startY;

    const START_PX = 14;
    if (!this.touchDrag.active) {
      if (dx * dx + dy * dy < START_PX * START_PX) return;
      if (Math.abs(dx) < Math.abs(dy)) return;
      this.touchDrag.active = true;
    }

    const clamped = Math.max(-r.w, Math.min(r.w, dx));
    const dir: -1 | 1 = clamped < 0 ? 1 : -1;
    const next = this.computeNextPage(dir);

    this.touchDrag.x = x;
    this.touchDrag.y = y;
    this.touchDrag.offsetPx = clamped;
    this.touchDrag.dir = dir;
    this.touchDrag.toPage = next.pageIndex;
    this.touchDrag.toSubpage = next.subpage;
  };

  handleTouchEnd = (_x: number, _y: number): void => {
    if (!this.isOpen) return;
    if (!this.touchDrag) return;

    const r = this.computeBookRect();
    const drag = this.touchDrag;
    this.touchDrag = null;

    if (!drag.active) return;

    const commitThreshold = r.w * 0.22;
    const commit = Math.abs(drag.offsetPx) >= commitThreshold;
    if (commit) {
      this.startPageTransition({
        dir: drag.dir,
        toPage: drag.toPage,
        toSubpage: drag.toSubpage,
        startOffsetPx: drag.offsetPx,
        mode: "commit",
      });
    } else {
      this.startPageTransition({
        dir: drag.dir,
        toPage: drag.toPage,
        toSubpage: drag.toSubpage,
        startOffsetPx: drag.offsetPx,
        mode: "cancel",
      });
    }
  };

  handleInput = (input: "escape" | "left" | "right"): void => {
    if (!this.isOpen) return;
    if (this.openFade?.kind === "closing") return;
    if (input === "escape") {
      this.close();
      return;
    }
    if (input === "left") this.pageLeft();
    if (input === "right") this.pageRight();
  };

  handleMouseDown = (x: number, y: number): void => {
    if (!this.isOpen) return;
    if (this.openFade?.kind === "closing") return;
    if (this.pageTransition) return;
    if (this.touchDrag?.active) return;
    if (this.backRect && this.pointInRect(x, y, this.backRect)) {
      const cb = this.backCallback;
      this.close();
      if (cb) cb();
      return;
    }
    if (this.handleExtraClick(x, y)) return;
    if (this.closeRect && this.pointInRect(x, y, this.closeRect)) {
      this.close();
      return;
    }
    if (this.leftArrowRect && this.pointInRect(x, y, this.leftArrowRect)) {
      this.pageLeft();
      return;
    }
    if (this.rightArrowRect && this.pointInRect(x, y, this.rightArrowRect)) {
      this.pageRight();
      return;
    }
  };

  handleResize = (): void => {
    const nextCompact = this.computeCompactMode();
    if (nextCompact === this.compactMode) return;
    this.compactMode = nextCompact;
    if (!this.compactMode) this.activeSubpage = 0;
    if (this.compactMode && this.stackedModeEnabled()) {
      this.activeSubpage = 0;
    }
  };

  pageLeft = (): void => {
    if (this.getPageCount() <= 0) return;
    if (this.pageTransition) return;
    if (this.touchDrag?.active) return;
    const subpageMode = this.isCompactMode() && !this.stackedModeEnabled();
    if (subpageMode) {
      const totalPages = this.getPageCount() * 2;
      const current = this.currentPage * 2 + this.activeSubpage;
      const next = (current - 1 + totalPages) % totalPages;
      const nextEntry = Math.floor(next / 2);
      const nextSub = (next % 2) as 0 | 1;
      this.startPageTransition({ dir: -1, toPage: nextEntry, toSubpage: nextSub });
      return;
    }
    const nextEntry =
      (((this.currentPage - 1) % this.getPageCount()) + this.getPageCount()) %
      this.getPageCount();
    this.startPageTransition({ dir: -1, toPage: nextEntry, toSubpage: 0 });
  };

  pageRight = (): void => {
    if (this.getPageCount() <= 0) return;
    if (this.pageTransition) return;
    if (this.touchDrag?.active) return;
    const subpageMode = this.isCompactMode() && !this.stackedModeEnabled();
    if (subpageMode) {
      const totalPages = this.getPageCount() * 2;
      const current = this.currentPage * 2 + this.activeSubpage;
      const next = (current + 1) % totalPages;
      const nextEntry = Math.floor(next / 2);
      const nextSub = (next % 2) as 0 | 1;
      this.startPageTransition({ dir: 1, toPage: nextEntry, toSubpage: nextSub });
      return;
    }
    const nextEntry = (this.currentPage + 1) % this.getPageCount();
    this.startPageTransition({ dir: 1, toPage: nextEntry, toSubpage: 0 });
  };

  draw = (delta: number): void => {
    if (!this.isOpen) return;
    const a = this.openAlpha();
    if (a <= 0) return;

    const offCtx = this.ensureOverlayCanvasCtx();
    if (!offCtx || !this.overlayCanvas) return;

    offCtx.save();
    offCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    offCtx.globalCompositeOperation = "source-over";
    offCtx.globalAlpha = 1;
    offCtx.imageSmoothingEnabled = false;

    const prevCtx = Game.ctx;
    Game.ctx = offCtx;
    Game.ctx.save();

    this.onBeforeDraw(delta);
    this.previewAnimT += delta;
    const theme = this.getTheme();
    // Draw backdrop before shake translate so it always covers the full canvas.
    Game.ctx.fillStyle = theme.backdrop;
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // const shakeOff = this.getShakeOffset();
    // Game.ctx.translate(shakeOff.x, shakeOff.y);

    const { x: bookX, y: bookY, w: bookW, h: bookH } = this.computeBookRect();
    const compactMode = this.isCompactMode();
    const stackedMode = compactMode && this.stackedModeEnabled();
    const subpageMode = compactMode && !stackedMode;

    if (this.touchDrag?.active) {
      this.leftArrowRect = null;
      this.rightArrowRect = null;
      this.closeRect = null;
      this.backRect = null;
      this.onHitboxesClear();

      const dir = this.touchDrag.dir;
      const outgoingOffset = this.touchDrag.offsetPx;
      const incomingOffset = outgoingOffset + dir * bookW;
      const outgoingAlpha = this.pageAlphaForOffset(outgoingOffset, bookW);
      const incomingAlpha = this.pageAlphaForOffset(incomingOffset, bookW);

      this.drawBookAt({
        theme, bookX, bookY, bookW, bookH,
        compactMode, stackedMode, subpageMode,
        entryIndex: this.currentPage,
        subpage: this.activeSubpage,
        xOffsetPx: outgoingOffset,
        alpha: outgoingAlpha,
        enableHitboxes: false,
        drawChrome: true,
      });
      this.drawBookAt({
        theme, bookX, bookY, bookW, bookH,
        compactMode, stackedMode, subpageMode,
        entryIndex: this.touchDrag.toPage,
        subpage: this.touchDrag.toSubpage,
        xOffsetPx: incomingOffset,
        alpha: incomingAlpha,
        enableHitboxes: false,
        drawChrome: true,
      });
    } else if (this.pageTransition) {
      this.leftArrowRect = null;
      this.rightArrowRect = null;
      this.closeRect = null;
      this.backRect = null;
      this.onHitboxesClear();

      const now = Date.now();
      const tRaw = (now - this.pageTransition.startMs) / this.pageTransition.durationMs;
      const t = Math.max(0, Math.min(1, tRaw));
      const ease = t * (2 - t);
      const outgoingOffset =
        this.pageTransition.startOffsetPx +
        (this.pageTransition.endOffsetPx - this.pageTransition.startOffsetPx) * ease;
      const incomingOffset = outgoingOffset + this.pageTransition.dir * bookW;
      const outgoingAlpha = this.pageAlphaForOffset(outgoingOffset, bookW);
      const incomingAlpha = this.pageAlphaForOffset(incomingOffset, bookW);

      this.drawBookAt({
        theme, bookX, bookY, bookW, bookH,
        compactMode, stackedMode, subpageMode,
        entryIndex: this.pageTransition.fromPage,
        subpage: this.pageTransition.fromSubpage,
        xOffsetPx: outgoingOffset,
        alpha: outgoingAlpha,
        enableHitboxes: false,
        drawChrome: true,
      });
      this.drawBookAt({
        theme, bookX, bookY, bookW, bookH,
        compactMode, stackedMode, subpageMode,
        entryIndex: this.pageTransition.toPage,
        subpage: this.pageTransition.toSubpage,
        xOffsetPx: incomingOffset,
        alpha: incomingAlpha,
        enableHitboxes: false,
        drawChrome: true,
      });

      if (t >= 1) {
        const done = this.pageTransition;
        this.pageTransition = null;
        if (done.mode === "commit") {
          this.activeSubpage = subpageMode ? done.toSubpage : 0;
          this.onPageChanged(done.toPage);
        }
      }
    } else {
      const effectiveSubpage = subpageMode ? this.activeSubpage : 0;
      this.activeSubpage = effectiveSubpage;
      this.drawBookAt({
        theme, bookX, bookY, bookW, bookH,
        compactMode, stackedMode, subpageMode,
        entryIndex: this.currentPage,
        subpage: effectiveSubpage,
        xOffsetPx: 0,
        alpha: 1,
        enableHitboxes: true,
        drawChrome: true,
      });
    }

    Game.ctx.restore();
    Game.ctx = prevCtx;
    offCtx.restore();

    prevCtx.save();
    prevCtx.globalCompositeOperation = "source-over";
    prevCtx.globalAlpha = prevCtx.globalAlpha * a;
    prevCtx.drawImage(this.overlayCanvas, 0, 0);
    prevCtx.restore();
  };

  // ── Private helpers ───────────────────────────────────────────────────────

  private openAlpha = (): number => {
    if (!this.isOpen) return 0;
    if (!this.openFade) return 1;
    const now = Date.now();
    const tRaw = (now - this.openFade.startMs) / this.openFade.durationMs;
    const t = Math.max(0, Math.min(1, tRaw));
    const ease = t * (2 - t);
    if (this.openFade.kind === "opening") {
      if (t >= 1) this.openFade = null;
      return ease;
    }
    const a = 1 - ease;
    if (t >= 1) {
      this.openFade = null;
      this.isOpen = false;
      this.leftArrowRect = null;
      this.rightArrowRect = null;
      this.closeRect = null;
      this.backRect = null;
      this.onHitboxesClear();
    }
    return a;
  };

  private ensureOverlayCanvasCtx = (): CanvasRenderingContext2D | null => {
    if (typeof document === "undefined") return null;
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement("canvas");
      this.overlayCanvasCtx = this.overlayCanvas.getContext("2d");
    }
    if (!this.overlayCanvas || !this.overlayCanvasCtx) return null;
    if (
      this.overlayCanvas.width !== GameConstants.WIDTH ||
      this.overlayCanvas.height !== GameConstants.HEIGHT
    ) {
      this.overlayCanvas.width = GameConstants.WIDTH;
      this.overlayCanvas.height = GameConstants.HEIGHT;
    }
    return this.overlayCanvasCtx;
  };

  private computeBookRect = (): { x: number; y: number; w: number; h: number } => {
    const margin = this.marginPx();
    const w = Math.min(GameConstants.WIDTH - margin * 2, 420);
    const h = Math.min(GameConstants.HEIGHT - margin * 2, 260);
    const x = Math.round(0.5 * GameConstants.WIDTH - 0.5 * w);
    const y = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * h);
    return { x, y, w, h };
  };

  private startPageTransition = (args: {
    dir: -1 | 1;
    toPage: number;
    toSubpage: 0 | 1;
    startOffsetPx?: number;
    mode?: "commit" | "cancel";
  }): void => {
    if (this.getPageCount() <= 1) {
      this.activeSubpage = args.toSubpage;
      this.onPageChanged(args.toPage);
      return;
    }
    const r = this.computeBookRect();
    const mode = args.mode ?? "commit";
    if (mode === "commit") this.onPageTransitionStart(args.toPage);
    const startOffsetPx = args.startOffsetPx ?? 0;
    const endOffsetPx = mode === "commit" ? -args.dir * r.w : 0;
    this.pageTransition = {
      startMs: Date.now(),
      durationMs: 180,
      mode,
      dir: args.dir,
      fromPage: this.currentPage,
      toPage: args.toPage,
      fromSubpage: this.activeSubpage,
      toSubpage: args.toSubpage,
      startOffsetPx,
      endOffsetPx,
    };
  };

  private pageAlphaForOffset = (offsetPx: number, bookW: number): number => {
    const visibleFraction = 1 - Math.abs(offsetPx) / Math.max(1, bookW);
    const a = visibleFraction / 0.75;
    return Math.max(0, Math.min(1, a));
  };

  private computeNextPage = (dir: -1 | 1): { pageIndex: number; subpage: 0 | 1 } => {
    const compactMode = this.isCompactMode();
    const stackedMode = compactMode && this.stackedModeEnabled();
    const subpageMode = compactMode && !stackedMode;

    if (!subpageMode) {
      const nextEntry =
        (((this.currentPage + dir) % this.getPageCount()) + this.getPageCount()) %
        this.getPageCount();
      return { pageIndex: nextEntry, subpage: 0 };
    }

    const totalPages = this.getPageCount() * 2;
    const current = this.currentPage * 2 + this.activeSubpage;
    const next = (current + dir + totalPages) % totalPages;
    return { pageIndex: Math.floor(next / 2), subpage: (next % 2) as 0 | 1 };
  };

  private isCompactMode = (): boolean => this.compactMode;

  private computeCompactMode = (): boolean => {
    const canvasScreenW = GameConstants.WIDTH;
    const marginScreenPx = this.marginPx();
    const maxBookScreenPx = 420;
    const bookScreenPx = Math.min(canvasScreenW - marginScreenPx * 2, maxBookScreenPx);
    return bookScreenPx < 250;
  };

  private drawBookAt = (args: {
    theme: BookTheme;
    bookX: number;
    bookY: number;
    bookW: number;
    bookH: number;
    compactMode: boolean;
    stackedMode: boolean;
    subpageMode: boolean;
    entryIndex: number;
    subpage: 0 | 1;
    xOffsetPx: number;
    alpha: number;
    enableHitboxes: boolean;
    drawChrome: boolean;
  }): void => {
    Game.ctx.save();
    const baseAlpha = Game.ctx.globalAlpha;
    Game.ctx.globalAlpha = baseAlpha * Math.max(0, Math.min(1, args.alpha));

    const theme = args.theme;
    const bookX = args.bookX + Math.round(args.xOffsetPx);
    const bookY = args.bookY;
    const bookW = args.bookW;
    const bookH = args.bookH;

    // Cover/border
    Game.ctx.fillStyle = theme.coverFill;
    Game.ctx.fillRect(bookX, bookY, bookW, bookH);
    Game.ctx.strokeStyle = theme.coverStroke;
    Game.ctx.lineWidth = 2;
    Game.ctx.strokeRect(bookX, bookY, bookW, bookH);

    // Spine
    const spineX = Math.round(bookX + bookW / 2);
    if (!args.compactMode) {
      Game.ctx.strokeStyle = theme.spineStroke;
      Game.ctx.lineWidth = 2;
      Game.ctx.beginPath();
      Game.ctx.moveTo(spineX, bookY + 8);
      Game.ctx.lineTo(spineX, bookY + bookH - 8);
      Game.ctx.stroke();
    }

    // Page panels
    const pad = this.innerPadPx();
    const pageW = args.compactMode
      ? bookW - pad * 2
      : Math.floor(bookW / 2) - pad * 2;
    const pageH = bookH - pad * 2 - 22; // reserve bottom row for arrows
    const leftX = bookX + pad;
    const rightX = spineX + pad;
    const pageY = bookY + pad;

    Game.ctx.fillStyle = theme.pageFill;
    Game.ctx.fillRect(leftX, pageY, pageW, pageH);
    Game.ctx.strokeStyle = theme.pageStroke;
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(leftX, pageY, pageW, pageH);
    if (!args.compactMode) {
      Game.ctx.fillRect(rightX, pageY, pageW, pageH);
      Game.ctx.strokeRect(rightX, pageY, pageW, pageH);
    }

    // Close button
    const closeSize = 13;
    const closePad = 2;
    const closeX = bookX + bookW - closeSize - closePad;
    const closeY = bookY + closePad;
    if (args.drawChrome && args.enableHitboxes) {
      this.closeRect = { x: closeX, y: closeY, w: closeSize, h: closeSize };
    } else if (args.drawChrome) {
      this.closeRect = null;
    }

    const pageCount = this.getPageCount();
    if (pageCount === 0) {
      Game.ctx.fillStyle = theme.text;
      Game.fillText("No entries", leftX + 6, pageY + 6);
    } else {
      const inset = this.pageInsetPx();
      if (args.stackedMode) {
        const contentX = leftX + inset;
        const contentY = pageY + inset;
        const contentW = pageW - inset * 2;
        const contentH = pageH - inset * 2;

        const gap = 6;
        const minInfoH = 44;
        const minSpriteH = 68;
        let infoH = Math.floor(contentH * 0.42);
        infoH = Math.max(
          minInfoH,
          Math.min(infoH, Math.max(minInfoH, contentH - minSpriteH - gap)),
        );

        // Info region (clipped so text can't spill into sprite region)
        Game.ctx.save();
        Game.ctx.beginPath();
        Game.ctx.rect(contentX, contentY, contentW, infoH);
        Game.ctx.clip();
        this.drawLeftPage(args.entryIndex, contentX, contentY, contentW, infoH, theme);
        Game.ctx.restore();

        // Sprite region
        const spriteY = contentY + infoH + gap;
        const spriteH = Math.max(0, contentY + contentH - spriteY);
        const spriteRect = { x: contentX, y: spriteY, w: contentW, h: spriteH };

        Game.ctx.fillStyle = theme.spritePanelFill;
        Game.ctx.strokeStyle = theme.spritePanelStroke;
        Game.ctx.lineWidth = 1;
        Game.ctx.fillRect(spriteRect.x, spriteRect.y, spriteRect.w, spriteRect.h);
        Game.ctx.strokeRect(spriteRect.x, spriteRect.y, spriteRect.w, spriteRect.h);

        this.drawRightPage(
          args.entryIndex,
          spriteRect.x,
          spriteRect.y,
          spriteRect.w,
          spriteRect.h,
          theme,
        );
      } else {
        if (!args.compactMode || args.subpage === 0) {
          this.drawLeftPage(
            args.entryIndex,
            leftX + inset,
            pageY + inset,
            pageW - inset * 2,
            pageH - inset * 2,
            theme,
          );
        }

        if (!args.compactMode || args.subpage === 1) {
          const rightInnerX = (args.compactMode ? leftX : rightX) + inset;
          const rightInnerY = pageY + inset;
          const rightInnerW = pageW - inset * 2;
          const rightInnerH = pageH - inset * 2;

          Game.ctx.fillStyle = theme.spritePanelFill;
          Game.ctx.strokeStyle = theme.spritePanelStroke;
          Game.ctx.lineWidth = 1;
          Game.ctx.fillRect(rightInnerX, rightInnerY, rightInnerW, rightInnerH);
          Game.ctx.strokeRect(rightInnerX, rightInnerY, rightInnerW, rightInnerH);

          this.drawRightPage(
            args.entryIndex,
            rightInnerX,
            rightInnerY,
            rightInnerW,
            rightInnerH,
            theme,
          );
        }
      }
    }

    // Page turn arrows + indicator
    if (args.drawChrome) {
      const arrowY = bookY + bookH - 20;
      const arrowW = 28;
      const arrowH = 14;
      const leftRect = { x: spineX - arrowW - 18, y: arrowY, w: arrowW, h: arrowH };
      const rightRect = { x: spineX + 18, y: arrowY, w: arrowW, h: arrowH };
      if (pageCount > 1) {
        if (args.enableHitboxes) {
          this.leftArrowRect = leftRect;
          this.rightArrowRect = rightRect;
        }
        this.drawArrow(leftRect, "left");
        this.drawArrow(rightRect, "right");
      } else {
        if (args.enableHitboxes) {
          this.leftArrowRect = null;
          this.rightArrowRect = null;
        }
      }

      if (pageCount > 0) {
        const indicator = `${args.entryIndex + 1}/${pageCount}`;
        const iw = Game.measureText(indicator).width;
        Game.ctx.fillStyle = theme.accentText;
        Game.fillText(indicator, spineX - iw / 2, arrowY + 2);
        if (args.subpageMode) {
          const sub = this.subpageLabel(args.subpage);
          Game.fillText(` ${sub}`, spineX + iw / 2, arrowY + 2);
        }
      }

      // Close button draw
      Game.ctx.fillStyle = theme.closeFill;
      Game.ctx.fillRect(closeX, closeY, closeSize, closeSize);
      Game.ctx.fillStyle = theme.closeText;
      const xw = Game.measureText("X").width;
      const xh = Game.letter_height;
      const xt = Math.round(closeX + (closeSize - xw) / 2);
      const yt = Math.round(closeY + (closeSize - xh) / 2);
      Game.fillText("X", xt, yt);

      // Back button (shown when backCallback is set)
      if (this.backCallback !== null) {
        const backLabel = "< Back";
        const backW = Game.measureText(backLabel).width + 8;
        const backH = arrowH;
        const bx = bookX + 4;
        const by = arrowY;
        if (args.enableHitboxes) {
          this.backRect = { x: bx, y: by, w: backW, h: backH };
        }
        Game.ctx.fillStyle = "rgba(255,255,255,0.1)";
        Game.ctx.fillRect(bx, by, backW, backH);
        Game.ctx.strokeStyle = "rgba(255,255,255,0.3)";
        Game.ctx.lineWidth = 1;
        Game.ctx.strokeRect(bx, by, backW, backH);
        Game.ctx.fillStyle = theme.accentText;
        const btY = Math.round(by + (backH - Game.letter_height) / 2);
        Game.fillText(backLabel, bx + 4, btY);
      } else if (args.enableHitboxes) {
        this.backRect = null;
      }
    }

    Game.ctx.restore();
  };

  // ── Shared utilities (protected so subclasses can use in draw methods) ────

  protected pointInRect = (
    x: number,
    y: number,
    r: { x: number; y: number; w: number; h: number },
  ): boolean => {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  protected drawArrow = (
    rect: { x: number; y: number; w: number; h: number },
    dir: "left" | "right",
  ): void => {
    const tile = GameConstants.TILESIZE;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dX = (cx - tile / 2) / tile;
    const dY = (cy - tile / 2) / tile;
    if (dir === "left") {
      Game.drawFX(15, 1, 1, 1, dX, dY, 1, 1);
    } else {
      Game.drawFX(16, 1, 1, 1, dX, dY, 1, 1);
    }
  };

  protected drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
  ): void => {
    const words = text.split(/\s+/);
    let line = "";
    let yy = y;
    const lineH = Game.letter_height + 4;
    for (const w of words) {
      const test = line.length === 0 ? w : `${line} ${w}`;
      if (Game.measureText(test).width > maxWidth && line.length > 0) {
        Game.fillText(line, x, yy);
        yy += lineH;
        line = w;
      } else {
        line = test;
      }
    }
    if (line.length > 0) Game.fillText(line, x, yy);
  };
}
