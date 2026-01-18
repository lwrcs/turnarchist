import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Input } from "../game/input";
import { statsTracker } from "../game/stats";
import {
  SKILLS,
  SKILL_DISPLAY_NAME,
  type Skill,
  xpUntilNextLevel,
} from "../game/skills";

export class SkillsMenu {
  open: boolean = false;
  private selectedSkill: Skill = "melee";
  private detailSide: "right" | "left" = "right";
  private openFade: {
    kind: "opening" | "closing";
    startMs: number;
    durationMs: number;
  } | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCanvasCtx: CanvasRenderingContext2D | null = null;

  toggleOpen(): void {
    if (this.open) {
      this.close();
    } else {
      this.open = true;
      // Prefer a stable placement side to avoid jitter from per-frame rounding.
      this.detailSide = "right";
      this.openFade = { kind: "opening", startMs: Date.now(), durationMs: 160 };
    }
  }

  private openAlpha(): number {
    if (!this.open) return 0;
    if (!this.openFade) return 1;
    const now = Date.now();
    const tRaw = (now - this.openFade.startMs) / this.openFade.durationMs;
    const t = Math.max(0, Math.min(1, tRaw));
    // Ease-out quadratic.
    const ease = t * (2 - t);
    if (this.openFade.kind === "opening") {
      if (t >= 1) this.openFade = null;
      return ease;
    }
    // closing
    const a = 1 - ease;
    if (t >= 1) {
      this.openFade = null;
      this.open = false;
    }
    return a;
  }

  close(): void {
    if (!this.open) return;
    this.openFade = { kind: "closing", startMs: Date.now(), durationMs: 140 };
  }

  private panelRect() {
    const tile = GameConstants.TILESIZE;
    const w = Math.round(tile * 8);
    const rowH = Math.round(tile * 0.7);
    const headerH = Math.round(tile * 0.9);
    const h = headerH + SKILLS.length * rowH + Math.round(tile * 0.6);
    const x = Math.round(GameConstants.WIDTH / 2 - w / 2);
    const y = Math.round(GameConstants.HEIGHT / 2 - h / 2);
    return { x, y, w, h, rowH, headerH };
  }

  isPointInBounds(x: number, y: number): boolean {
    if (!this.open || this.openAlpha() <= 0) return false;
    const r = this.panelRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  handleClick(x: number, y: number): boolean {
    if (!this.open || this.openAlpha() <= 0) return false;
    const r = this.panelRect();

    // Click outside closes (modal-ish)
    if (!(x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) {
      this.close();
      return true;
    }

    // Row selection
    const startY = r.y + r.headerH;
    for (let i = 0; i < SKILLS.length; i++) {
      const ry = startY + i * r.rowH;
      if (y >= ry && y <= ry + r.rowH) {
        this.selectedSkill = SKILLS[i];
        return true;
      }
    }

    return true;
  }

  private ensureOverlayCanvasCtx(): CanvasRenderingContext2D | null {
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
  }

  private computeDetailRect(panel: { x: number; y: number; w: number }) {
    const pad = 10;
    const desiredW = Math.round(GameConstants.TILESIZE * 6.5);
    const h = Math.round(GameConstants.TILESIZE * 3);

    const rightX = panel.x + panel.w + pad;
    const rightSpace = GameConstants.WIDTH - pad - rightX;
    const leftSpace = panel.x - 2 * pad;

    // Choose a deterministic side first (to avoid left/right flipping due to 1px ties),
    // then fall back only if that side truly can't fit a minimum usable width.
    const MIN_W = 120;
    const canFitRight = rightSpace >= MIN_W;
    const canFitLeft = leftSpace >= MIN_W;

    let side: "right" | "left" = this.detailSide;
    if (side === "right" && !canFitRight && canFitLeft) side = "left";
    if (side === "left" && !canFitLeft && canFitRight) side = "right";
    // If neither side can fit MIN_W, keep preferred side but clamp aggressively below.

    const sideSpace = side === "right" ? rightSpace : leftSpace;
    const w = Math.max(60, Math.min(desiredW, Math.max(0, sideSpace)));

    let x = side === "right" ? rightX : panel.x - w - pad;
    x = Math.max(pad, Math.min(GameConstants.WIDTH - w - pad, x));

    // Clamp vertically too (in case panel is near top/bottom).
    let y = panel.y;
    y = Math.max(pad, Math.min(GameConstants.HEIGHT - h - pad, y));

    return { x, y, w, h };
  }

  private textWrap(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
  ): number {
    // Mirrors Inventory.textWrap: returns y for next line.
    if (text === "" || maxWidth <= 0) return y;

    const lineHeight = 8;
    const words = text.split(" ");
    let line = "";

    const drawLine = (lineToDraw: string) => {
      const trimmed = lineToDraw.trim();
      if (trimmed === "") return;
      Game.fillText(trimmed, x, y);
      y += lineHeight;
    };

    const findFittingPrefixLength = (s: string): number => {
      if (s.length === 0) return 0;
      if (Game.measureText(s[0]).width > maxWidth) return 0;
      let lo = 1;
      let hi = s.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (Game.measureText(s.slice(0, mid)).width <= maxWidth) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };

    while (words.length > 0) {
      const word = words[0];
      const testLine = line === "" ? word : line + " " + word;

      if (Game.measureText(testLine).width <= maxWidth) {
        line = testLine;
        words.shift();
        continue;
      }

      if (line !== "") {
        drawLine(line);
        line = "";
        continue;
      }

      // Single word doesn't fit; split into chunks.
      let remaining = word;
      while (remaining.length > 0) {
        const prefixLen = findFittingPrefixLength(remaining);
        if (prefixLen <= 0) break;
        drawLine(remaining.slice(0, prefixLen));
        remaining = remaining.slice(prefixLen);
      }
      words.shift();
    }

    if (line.trim() !== "") drawLine(line);
    return y;
  }

  draw(delta: number): void {
    const overlayAlpha = this.openAlpha();
    if (overlayAlpha <= 0) return;
    const r = this.panelRect();

    const offCtx = this.ensureOverlayCanvasCtx();
    if (!offCtx || !this.overlayCanvas) return;

    offCtx.save();
    offCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    offCtx.imageSmoothingEnabled = false;

    const prevCtx = Game.ctx;
    Game.ctx = offCtx;
    Game.ctx.save();

    // Backdrop
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Panel
    Game.ctx.fillStyle = "rgba(50, 50, 50, 0.9)";
    Game.ctx.fillRect(r.x, r.y, r.w, r.h);
    Game.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Header
    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    Game.fillText("Skills", r.x + 10, r.y + 8);

    // Rows
    const mx = Input.mouseX ?? -1;
    const my = Input.mouseY ?? -1;
    let hovered: Skill | null = null;

    const startY = r.y + r.headerH;
    for (let i = 0; i < SKILLS.length; i++) {
      const skill = SKILLS[i];
      const ry = startY + i * r.rowH;
      const isHovered =
        mx >= r.x && mx <= r.x + r.w && my >= ry && my <= ry + r.rowH;
      if (isHovered) hovered = skill;

      const isSelected = this.selectedSkill === skill;
      if (isHovered || isSelected) {
        Game.ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
        Game.ctx.fillRect(r.x + 1, ry, r.w - 2, r.rowH);
      }

      const lvl = statsTracker.getSkillLevel(skill);
      Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
      Game.fillText(`${SKILL_DISPLAY_NAME[skill]}: ${lvl}`, r.x + 10, ry + 4);
    }

    // Details panel (hover > selected)
    const detailSkill = hovered ?? this.selectedSkill;
    const xp = statsTracker.getSkillXp(detailSkill);
    const info = xpUntilNextLevel(xp);

    const detail = this.computeDetailRect(r);

    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    Game.ctx.fillRect(detail.x, detail.y, detail.w, detail.h);
    Game.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    Game.ctx.strokeRect(detail.x, detail.y, detail.w, detail.h);

    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    const leftPadding = 8;
    const topPadding = 6;
    const gutter = 8;
    const maxWidth = Math.max(0, detail.w - leftPadding * 2 - gutter);
    let nextY = detail.y + topPadding;
    nextY = this.textWrap(
      SKILL_DISPLAY_NAME[detailSkill],
      detail.x + leftPadding,
      nextY,
      maxWidth,
    );
    nextY = this.textWrap(`XP: ${xp}`, detail.x + leftPadding, nextY, maxWidth);
    nextY = this.textWrap(
      `Next level in: ${info.xpRemaining}`,
      detail.x + leftPadding,
      nextY,
      maxWidth,
    );

    // Finish offscreen render and restore contexts.
    Game.ctx.restore();
    Game.ctx = prevCtx;
    offCtx.restore();

    // Composite overlay with fade alpha.
    prevCtx.save();
    prevCtx.globalAlpha = overlayAlpha;
    prevCtx.drawImage(this.overlayCanvas, 0, 0);
    prevCtx.restore();
  }
}
