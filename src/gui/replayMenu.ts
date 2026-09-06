import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { GameplaySettings } from "../game/gameplaySettings";
import { InputEnum } from "../game/input";
import { MouseCursor } from "./mouseCursor";

type ReplayMenuItemKind = "toggle" | "action";

interface ReplayMenuItem {
  label: string;
  kind: ReplayMenuItemKind;
  getState?: () => boolean;
  onActivate: () => void;
}

const BUTTON_HEIGHT = 14;
const SPACING = 2;
const CONTENT_PADDING = 24;
const CHECKBOX_SIZE = 7;
const CHECKBOX_MARGIN = 4;

export class ReplayMenu {
  open: boolean = false;
  private game: Game;
  private items: ReplayMenuItem[];
  private activeItemIndex: number = 0;
  private hoverAnims: number[] = [];
  private lastInputWasMouse: boolean = false;
  private openFade: { kind: "opening" | "closing"; startMs: number; durationMs: number } | null = null;
  private menuX: number = 0;
  private menuY: number = 0;
  private menuW: number = 0;
  private lastClickTime: number = 0;
  private readonly CLICK_DEBOUNCE = 150;

  constructor(game: Game) {
    this.game = game;
    this.items = this.buildItems();
    this.hoverAnims = new Array(this.items.length).fill(0);
  }

  private get replayManager() {
    return this.game.replayManager;
  }

  private setSpeed(speed: "slow" | "normal" | "fast") {
    GameplaySettings.REPLAY_SPEED = speed;
  }

  private buildItems(): ReplayMenuItem[] {
    return [
      {
        label: this.replayManager.isFinished() ? "Replay Again" : "Resume",
        kind: "action",
        onActivate: () => {
          if (this.replayManager.isFinished()) {
            this.forceClose();
            this.replayManager.cancelReplay();
            this.replayManager.replay(this.game);
          } else {
            this.close();
            this.replayManager.resume();
          }
        },
      },
      {
        label: "New Game",
        kind: "action",
        onActivate: () => {
          this.forceClose();
          this.replayManager?.cancelReplay?.();
          this.game.newGame();
        },
      },
      {
        label: "Slow",
        kind: "toggle",
        getState: () => GameplaySettings.REPLAY_SPEED === "slow",
        onActivate: () => this.setSpeed("slow"),
      },
      {
        label: "Normal",
        kind: "toggle",
        getState: () => GameplaySettings.REPLAY_SPEED === "normal",
        onActivate: () => this.setSpeed("normal"),
      },
      {
        label: "Fast",
        kind: "toggle",
        getState: () => GameplaySettings.REPLAY_SPEED === "fast",
        onActivate: () => this.setSpeed("fast"),
      },
    ];
  }

  openMenu() {
    this.items = this.buildItems();
    this.replayManager.pause();
    this.lastInputWasMouse = false;
    this.open = true;
    this.activeItemIndex = 0;
    this.openFade = { kind: "opening", startMs: Date.now(), durationMs: 160 };
    this.computeLayout();
  }

  close() {
    if (!this.open) return;
    this.openFade = { kind: "closing", startMs: Date.now(), durationMs: 140 };
  }

  private forceClose() {
    this.open = false;
    this.openFade = null;
  }

  private openAlpha(): number {
    if (!this.open) return 0;
    if (!this.openFade) return 1;
    const t = Math.max(0, Math.min(1, (Date.now() - this.openFade.startMs) / this.openFade.durationMs));
    const ease = t * (2 - t);
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
    let maxW = 0;
    for (const item of this.items) {
      const w = Game.measureText(item.label).width;
      if (w > maxW) maxW = w;
    }
    // All items have a checkbox area even if they're "action" kind, for consistent alignment.
    this.menuW = maxW + CONTENT_PADDING + CHECKBOX_SIZE + CHECKBOX_MARGIN * 2 + 4;
    this.menuX = Math.round((GameConstants.WIDTH - this.menuW) / 2);
    const totalH = this.items.length * (BUTTON_HEIGHT + SPACING) - SPACING;
    this.menuY = Math.round((GameConstants.HEIGHT - totalH) / 2);
  }

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

    this.computeLayout();

    const cursor = MouseCursor.getInstance().getPosition();

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const baseY = this.menuY + i * (BUTTON_HEIGHT + SPACING);

      const isSelected = !this.lastInputWasMouse && this.activeItemIndex === i;
      let hovered = false;
      if (this.lastInputWasMouse) {
        hovered =
          cursor.x >= this.menuX && cursor.x <= this.menuX + this.menuW &&
          cursor.y >= baseY && cursor.y <= baseY + BUTTON_HEIGHT;
      }
      const target = (isSelected || hovered) ? 1 : 0;
      if (i >= this.hoverAnims.length) this.hoverAnims.push(0);
      this.hoverAnims[i] += 0.3 * delta * (target - this.hoverAnims[i]);
      this.hoverAnims[i] = Math.max(0, Math.min(1, this.hoverAnims[i]));
      const growPx = Math.round(1 * this.hoverAnims[i]);

      const bx = Math.round(this.menuX - growPx);
      const by = Math.round(baseY - growPx);
      const bw = Math.round(this.menuW + 2 * growPx);
      const bh = Math.round(BUTTON_HEIGHT + 2 * growPx);

      ctx.fillStyle = (isSelected || hovered) ? "rgba(75, 75, 75, 0.5)" : "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(bx, by, bw, bh);

      // Checkbox for toggle items (radio-style: only one speed active)
      if (item.kind === "toggle") {
        const checkX = Math.round(this.menuX + CHECKBOX_MARGIN);
        const checkY = Math.round(baseY + (BUTTON_HEIGHT - CHECKBOX_SIZE) / 2);
        ctx.fillStyle = "rgba(255, 255, 0, 1)";
        // Border
        ctx.fillRect(checkX, checkY, CHECKBOX_SIZE, 1);
        ctx.fillRect(checkX, checkY + CHECKBOX_SIZE - 1, CHECKBOX_SIZE, 1);
        ctx.fillRect(checkX, checkY, 1, CHECKBOX_SIZE);
        ctx.fillRect(checkX + CHECKBOX_SIZE - 1, checkY, 1, CHECKBOX_SIZE);
        // Fill if active
        if (item.getState && item.getState()) {
          ctx.fillRect(checkX + 2, checkY + 2, CHECKBOX_SIZE - 4, CHECKBOX_SIZE - 4);
        }
      }

      // Text — toggle items indent past checkbox; action items align to same left edge
      ctx.fillStyle = "rgba(255, 255, 0, 1)";
      const textStartX = this.menuX + CHECKBOX_MARGIN + CHECKBOX_SIZE + 4;
      const textX = Math.round(item.kind === "toggle" ? textStartX : this.menuX + CHECKBOX_MARGIN);
      const textY = Math.round(baseY + (BUTTON_HEIGHT - Game.letter_height) / 2);
      Game.fillText(item.label, textX, textY);
    }

    ctx.restore();
  }

  inputHandler(input: InputEnum) {
    if (!this.open) return;
    if (this.openFade?.kind === "closing") return;

    if (input === InputEnum.UP || input === InputEnum.DOWN) {
      this.lastInputWasMouse = false;
    } else if (input === InputEnum.LEFT_CLICK || input === InputEnum.MOUSE_MOVE) {
      this.lastInputWasMouse = true;
    }

    switch (input) {
      case InputEnum.ESCAPE:
        if (this.replayManager.isFinished()) return;
        this.close();
        this.replayManager?.resume?.();
        break;
      case InputEnum.UP:
        this.activeItemIndex = (this.activeItemIndex - 1 + this.items.length) % this.items.length;
        break;
      case InputEnum.DOWN:
        this.activeItemIndex = (this.activeItemIndex + 1) % this.items.length;
        break;
      case InputEnum.SPACE:
      case InputEnum.ENTER:
        this.activateItem(this.activeItemIndex);
        break;
      case InputEnum.LEFT_CLICK: {
        const { x, y } = MouseCursor.getInstance().getPosition();
        this.handleClick(x, y);
        break;
      }
    }
  }

  private handleClick(x: number, y: number) {
    if (!this.open || this.openFade?.kind === "closing") return;
    this.computeLayout();
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_DEBOUNCE) return;
    this.lastClickTime = now;

    for (let i = 0; i < this.items.length; i++) {
      const by = this.menuY + i * (BUTTON_HEIGHT + SPACING);
      if (
        x >= this.menuX && x <= this.menuX + this.menuW &&
        y >= by && y <= by + BUTTON_HEIGHT
      ) {
        this.lastInputWasMouse = true;
        this.activeItemIndex = i;
        this.activateItem(i);
        return;
      }
    }

    if (this.replayManager.isFinished()) return;
    // Tap/click outside the menu: resume and close
    this.close();
    this.replayManager?.resume?.();
  }

  handleMouseDown(x: number, y: number) {
    this.handleClick(x, y);
  }

  private activateItem(index: number) {
    if (index >= 0 && index < this.items.length) {
      this.items[index].onActivate();
    }
  }
}
