import fontUrl = require("../../res/font.png");

type Size = { width: number; height: number };

/**
 * Minimal boot-time loading renderer.
 * - Loads ONLY the pixel font sheet (`res/font.png`)
 * - Can draw a simple loading screen in the game's text style
 * - Fully independent of `Game` (no imports from game.ts)
 *
 * Dispose once the real game has initialized.
 */
export class BootLoadingRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private fontsheet: HTMLImageElement | null = null;
  private fontReady = false;

  private rafId: number | null = null;
  private disposed = false;
  private prevCanvasCssText: string | null = null;

  private loaded = 0;
  private total = 1;
  private label = "loading";
  private readonly fontScale = 5;
  private cssW: number = 0;
  private cssH: number = 0;
  private dpr: number = 1;

  private static readonly letters =
    "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/+";
  private static readonly letterWidths = [
    4, 4, 4, 4, 3, 3, 4, 4, 1, 4, 4, 3, 5, 5, 4, 4, 4, 4, 4, 3, 4, 5, 5, 5, 5,
    3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1, 1, 4, 1, 1, 2, 2, 2, 2, 5, 3, 3, 3,
  ] as const;
  private static readonly letterHeight = 6;
  private static letterPositions: number[] = [];

  private readonly textCanvases = new Map<string, HTMLCanvasElement>();
  private readonly textCanvasOrder: string[] = [];
  private readonly textCanvasMax = 256;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /** Starts loading the font and begins drawing until disposed. */
  start(): void {
    if (this.disposed) return;
    this.forceFullscreenCanvasStyle();
    this.loadFont();
    if (this.rafId === null) this.rafId = window.requestAnimationFrame(this.drawFrame);
  }

  setProgress(loaded: number, total: number): void {
    this.loaded = Math.max(0, Math.floor(loaded));
    this.total = Math.max(1, Math.floor(total));
  }

  setLabel(label: string): void {
    this.label = label;
  }

  get isFontReady(): boolean {
    return this.fontReady;
  }

  dispose(): void {
    this.disposed = true;
    if (this.rafId !== null) window.cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.textCanvases.clear();
    this.textCanvasOrder.length = 0;
    this.fontsheet = null;
    this.restoreCanvasStyle();
  }

  private loadFont(): void {
    if (this.fontsheet) return;
    const img = new Image();
    img.onload = () => {
      if (this.disposed) return;
      this.fontReady = true;
    };
    img.src = fontUrl;
    this.fontsheet = img;
  }

  private drawFrame = (tMs: number): void => {
    if (this.disposed) return;

    // Keep the canvas sized to the actual displayed (CSS) size so centering is correct even
    // before the main game resize pipeline runs.
    this.syncCanvasToDisplaySize();

    const ctx = this.ctx;
    const w = this.cssW || 1;
    const h = this.cssH || 1;

    ctx.save();
    // Draw in CSS pixels; scale to device pixels via transform so sizes look correct on high-DPR screens.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Nearest-neighbor for pixel font scaling.
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, w, h);

    const pct = Math.max(0, Math.min(1, this.loaded / Math.max(1, this.total)));
    const sub = `${this.loaded}/${this.total}`;

    if (this.fontReady) {
      const dots = Math.floor((tMs / 400) % 4);
      const dotStr = dots === 0 ? "" : ".".repeat(dots);
      ctx.fillStyle = "white";
      const title = `${this.label}${dotStr}`.toLowerCase();

      // Compute a vertically-centered content block so the loader doesn't drift toward the top.
      const titleSz = BootLoadingRenderer.measureText(title);
      const subSz = BootLoadingRenderer.measureText(sub);
      const s = Math.max(1, Math.round(this.fontScale));
      const titleH = Math.round(titleSz.height * s);
      const subH = Math.round(subSz.height * s);

      const barWOuter = Math.round(Math.max(180, Math.floor(w * 0.45)));
      const barHOuter = Math.round(Math.max(10, 10 * s));
      const gapTitleToBar = Math.round(10 * s);
      const gapBarToSub = Math.round(10 * s);

      const blockH = titleH + gapTitleToBar + barHOuter + gapBarToSub + subH;
      const blockTop = Math.round(h / 2 - blockH / 2);

      // Title
      this.fillTextScaledCentered(title, w / 2, blockTop + Math.round(titleH / 2), s);

      // Progress bar (all integer fillRects so it's fully solid)
      const x0 = Math.round(w / 2 - barWOuter / 2);
      const y0 = blockTop + titleH + gapTitleToBar;

      // Outer border
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(x0, y0, barWOuter, barHOuter);
      // Inner background
      const border = 2; // px
      const ix = x0 + border;
      const iy = y0 + border;
      const iW = Math.max(0, barWOuter - border * 2);
      const iH = Math.max(0, barHOuter - border * 2);
      ctx.fillStyle = "black";
      ctx.fillRect(ix, iy, iW, iH);
      // Fill
      const fillW = Math.max(0, Math.min(iW, Math.floor(iW * pct)));
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(ix, iy, fillW, iH);

      // Subtext
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      this.fillTextScaledCentered(sub, w / 2, y0 + barHOuter + gapBarToSub + Math.round(subH / 2), s);
    } else {
      // Minimal fallback until font loads.
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
      ctx.fillText("Loading…", w / 2, h / 2 - 20);
    }

    ctx.restore();

    this.rafId = window.requestAnimationFrame(this.drawFrame);
  };

  private syncCanvasToDisplaySize(): void {
    // Avoid exceptions during early boot or in non-DOM contexts.
    let rectW = 0;
    let rectH = 0;
    try {
      const rect = this.canvas.getBoundingClientRect();
      rectW = rect.width;
      rectH = rect.height;
    } catch {
      return;
    }

    let vw = 0;
    let vh = 0;
    try {
      vw = typeof window !== "undefined" ? window.innerWidth : 0;
      vh = typeof window !== "undefined" ? window.innerHeight : 0;
    } catch {}

    // Prefer the actual displayed (CSS) canvas size; only fall back to viewport if rect is unavailable.
    const cssW = rectW > 1 ? rectW : vw;
    const cssH = rectH > 1 ? rectH : vh;
    if (cssW <= 0 || cssH <= 0) return;

    const dpr =
      typeof window !== "undefined" && typeof window.devicePixelRatio === "number"
        ? window.devicePixelRatio
        : 1;

    this.cssW = Math.max(1, Math.round(cssW));
    this.cssH = Math.max(1, Math.round(cssH));
    this.dpr = Math.max(1, Math.round(dpr * 1000) / 1000);

    const pxW = Math.max(1, Math.round(this.cssW * this.dpr));
    const pxH = Math.max(1, Math.round(this.cssH * this.dpr));
    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      this.canvas.width = pxW;
      this.canvas.height = pxH;
    }
  }

  /**
   * During boot, before the game's resize pipeline runs, the canvas can have a small default CSS size,
   * which makes "centered" loaders appear pinned near the top. Force fullscreen temporarily.
   */
  private forceFullscreenCanvasStyle(): void {
    if (this.prevCanvasCssText !== null) return;
    try {
      this.prevCanvasCssText = this.canvas.style.cssText;
      this.canvas.style.position = "fixed";
      this.canvas.style.left = "0";
      this.canvas.style.top = "0";
      this.canvas.style.width = "100vw";
      this.canvas.style.height = "100vh";
      this.canvas.style.display = "block";
      this.canvas.style.margin = "0";
      this.canvas.style.padding = "0";
      this.canvas.style.zIndex = "0";
      // Avoid iOS scroll bounce / selection oddities during boot.
      this.canvas.style.touchAction = "none";
    } catch {
      // If styling fails for any reason, proceed without it.
    }
  }

  private restoreCanvasStyle(): void {
    if (this.prevCanvasCssText === null) return;
    try {
      this.canvas.style.cssText = this.prevCanvasCssText;
    } catch {
      // ignore
    } finally {
      this.prevCanvasCssText = null;
    }
  }

  private static measureText(text: string): Size {
    if (typeof text !== "string") return { width: 0, height: BootLoadingRenderer.letterHeight };
    let w = 0;
    for (const ch of text.toLowerCase()) {
      if (ch === " ") w += 4;
      else {
        for (let i = 0; i < BootLoadingRenderer.letters.length; i++) {
          if (BootLoadingRenderer.letters[i] === ch) {
            w += BootLoadingRenderer.letterWidths[i] + 1;
            break;
          }
        }
      }
    }
    return { width: w, height: BootLoadingRenderer.letterHeight };
  }

  private ensureLetterPositions(): void {
    if (BootLoadingRenderer.letterPositions.length > 0) return;
    for (let i = 0; i < BootLoadingRenderer.letterWidths.length; i++) {
      if (i === 0) BootLoadingRenderer.letterPositions[0] = 0;
      else {
        BootLoadingRenderer.letterPositions[i] =
          BootLoadingRenderer.letterPositions[i - 1] + BootLoadingRenderer.letterWidths[i - 1] + 2;
      }
    }
  }

  private fillText(text: string, x: number, y: number): void {
    if (!this.fontReady || !this.fontsheet) return;
    if (typeof text !== "string" || text.length === 0) return;

    this.ensureLetterPositions();
    x = Math.round(x);
    y = Math.round(y);

    const dims = BootLoadingRenderer.measureText(text);
    if (dims.width <= 0) return;

    const key = `${text}|${this.ctx.fillStyle}`;
    const existing = this.textCanvases.get(key);
    if (existing) {
      this.ctx.drawImage(existing, x, y);
      return;
    }

    const c = document.createElement("canvas");
    c.width = dims.width;
    c.height = dims.height;
    const bx = c.getContext("2d");
    if (!bx) return;
    bx.imageSmoothingEnabled = false;

    let letterX = 0;
    for (const ch of text.toLowerCase()) {
      if (ch === " ") {
        letterX += 4;
        continue;
      }
      for (let i = 0; i < BootLoadingRenderer.letters.length; i++) {
        if (BootLoadingRenderer.letters[i] !== ch) continue;
        bx.drawImage(
          this.fontsheet,
          BootLoadingRenderer.letterPositions[i] + 1,
          0,
          BootLoadingRenderer.letterWidths[i],
          BootLoadingRenderer.letterHeight,
          letterX,
          0,
          BootLoadingRenderer.letterWidths[i],
          BootLoadingRenderer.letterHeight,
        );
        letterX += BootLoadingRenderer.letterWidths[i] + 1;
        break;
      }
    }

    bx.fillStyle = this.ctx.fillStyle;
    bx.globalCompositeOperation = "source-in";
    bx.fillRect(0, 0, c.width, c.height);

    this.textCanvases.set(key, c);
    this.textCanvasOrder.push(key);
    while (this.textCanvasOrder.length > this.textCanvasMax) {
      const oldest = this.textCanvasOrder.shift();
      if (oldest) this.textCanvases.delete(oldest);
    }

    this.ctx.drawImage(c, x, y);
  }

  private fillTextScaledCentered(text: string, cx: number, cy: number, scale: number): void {
    if (!this.fontReady || !this.fontsheet) return;
    if (typeof text !== "string" || text.length === 0) return;
    const s = Math.max(1, Math.round(scale));

    const dims = BootLoadingRenderer.measureText(text);
    if (dims.width <= 0) return;
    const sw = Math.round(dims.width * s);
    const sh = Math.round(dims.height * s);
    const x = Math.round(cx - sw / 2);
    const y = Math.round(cy - sh / 2);

    // Render the 1x cached canvas then scale it as a pixel sprite (nearest-neighbor).
    const key = `${text}|${this.ctx.fillStyle}`;
    let src = this.textCanvases.get(key);
    if (!src) {
      // Build cache entry at 1x by rendering once offscreen.
      const c = document.createElement("canvas");
      c.width = dims.width;
      c.height = dims.height;
      const bx = c.getContext("2d");
      if (!bx) return;
      bx.imageSmoothingEnabled = false;
      this.ensureLetterPositions();
      let letterX = 0;
      for (const ch of text.toLowerCase()) {
        if (ch === " ") {
          letterX += 4;
          continue;
        }
        for (let i = 0; i < BootLoadingRenderer.letters.length; i++) {
          if (BootLoadingRenderer.letters[i] !== ch) continue;
          bx.drawImage(
            this.fontsheet,
            BootLoadingRenderer.letterPositions[i] + 1,
            0,
            BootLoadingRenderer.letterWidths[i],
            BootLoadingRenderer.letterHeight,
            letterX,
            0,
            BootLoadingRenderer.letterWidths[i],
            BootLoadingRenderer.letterHeight,
          );
          letterX += BootLoadingRenderer.letterWidths[i] + 1;
          break;
        }
      }
      bx.fillStyle = this.ctx.fillStyle;
      bx.globalCompositeOperation = "source-in";
      bx.fillRect(0, 0, c.width, c.height);

      this.textCanvases.set(key, c);
      this.textCanvasOrder.push(key);
      while (this.textCanvasOrder.length > this.textCanvasMax) {
        const oldest = this.textCanvasOrder.shift();
        if (oldest) this.textCanvases.delete(oldest);
      }
      src = c;
    }

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(src, x, y, sw, sh);
  }
}


