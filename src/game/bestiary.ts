import { Game } from "../game";
import { Player } from "../player/player";
import { GameConstants } from "./gameConstants";
import { MouseCursor } from "../gui/mouseCursor";
import { CrabEnemy } from "../entity/enemy/crabEnemy";
import { Enemy } from "../entity/enemy/enemy";
import { enemyClassToId } from "../level/environment";
import { loadSeenEnemyTypes, saveSeenEnemyTypes } from "./bestiaryPersistence";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { BESTIARY_ENEMIES } from "./bestiaryEnemyRegistry";
import { Entity } from "../entity/entity";
import { HitWarning, HitWarningDirection } from "../drawable/hitWarning";
import { HealthBar } from "../drawable/healthbar";
import { GameplaySettings } from "./gameplaySettings";

interface BestiaryEntry {
  typeName: string;
  displayName: string;
  description: string;
  sprites: Array<{
    label?: string;
    tileX: number;
    tileY: number;
    frames: number;
    frameStride: number;
    frameMs: number;
    w: number;
    h: number;
    hp?: number;
    maxHp?: number;
    effects?: Array<{
      kind: "wizardFireball";
      state: 0 | 1 | 2;
      variant: "energy" | "fire" | "earth";
      offsets: Array<{ x: number; y: number }>;
    }>;
    sheet?: "mob" | "obj";
    offsetX?: number;
    offsetY?: number;
    hitWarningsWide?: boolean;
    hitWarnings?: Array<{
      targetOffset: { x: number; y: number };
      sourceOffset?: { x: number; y: number };
      direction?:
        | "North"
        | "NorthEast"
        | "East"
        | "SouthEast"
        | "South"
        | "SouthWest"
        | "West"
        | "NorthWest"
        | "Center";
      show?: {
        redArrow?: boolean;
        whiteArrow?: boolean;
        redX?: boolean;
      };
      alpha?: number;
    }>;
    rumbling?: boolean;
  }>;
}

export class Bestiary {
  game: Game;
  player: Player;
  isOpen: boolean = false;
  openTime: number = Date.now();
  private entryViewStartTime: number = Date.now();
  // Inventory-style open button positioning (stored in tile coordinates)
  private buttonX: number = 0.25;
  private buttonY: number = 0;
  entries: Array<BestiaryEntry>;
  activeEntryIndex: number = 0;
  /**
   * In compact mode, each entry is split into two pages:
   * 0 = info (name/description), 1 = sprite preview.
   */
  private activeEntrySubpage: 0 | 1 = 0;
  private compactMode: boolean = false;
  private seenEnemyTypeNames: Set<string>;
  private enemyNameToClass: Map<string, typeof Enemy>;

  /**
   * When enabled (default), if an entry has multiple sprites (idle/armed/HP states),
   * the bestiary cycles through them instead of rendering them all side-by-side.
   */
  cycleEntrySprites: boolean = true;
  private readonly entrySpriteCycleMs = 1200;
  private previewAnimT = 0;
  /**
   * When enabled (default), automatic state cycling is disabled and a button is shown
   * on the sprite page to manually advance through states.
   */
  manualStateCycling: boolean = true;
  private activeSpriteStateIndex: number = 0;

  theme: "parchment" | "slate" | "midnight" | "mahogany" | "arcana" =
    "parchment";

  /**
   * Margin in UI pixels. Shrinks on small screens (pixels are scarce),
   * but stays comfortable on larger screens.
   */
  private marginPx = (): number => {
    // ~4% of width, clamped.
    const m = Math.round(GameConstants.WIDTH * 0.04);
    return Math.max(6, Math.min(16, m));
  };

  /**
   * Inner padding between the book cover and the page panel(s).
   * Shrinks on small screens to reclaim content space.
   */
  private innerPadPx = (): number => {
    // ~3% of width, clamped.
    const p = Math.round(GameConstants.WIDTH * 0.03);
    return Math.max(4, Math.min(12, p));
  };

  /**
   * Inner content inset within a page panel (text/sprites away from the border).
   */
  private pageInsetPx = (): number => {
    // ~2.5% of width, clamped.
    const i = Math.round(GameConstants.WIDTH * 0.025);
    return Math.max(4, Math.min(10, i));
  };

  private getTheme = () => {
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
      // Darker than "slate" but still readable (not pitch-black).
      midnight: {
        backdrop: "rgba(0, 0, 0, 0.92)",
        coverFill: "rgba(75, 78, 86, 1)",
        coverStroke: "rgba(28, 30, 36, 1)",
        spineStroke: "rgba(45, 48, 56, 1)",
        pageFill: "rgba(100, 104, 114, 1)",
        pageStroke: "rgba(55, 58, 66, 1)",
        // Enemy preview panel should be darker than the surrounding page.
        spritePanelFill: "rgba(78, 82, 92, 1)",
        spritePanelStroke: "rgba(28, 30, 36, 1)",
        // Use light text for readability on dark pages.
        text: "rgba(245, 246, 248, 1)",
        accentText: "rgba(220, 222, 226, 1)",
        closeFill: "rgba(185, 60, 60, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      // Deep wood / mahogany: darker than midnight with warm reds/browns.
      mahogany: {
        backdrop: "rgba(0, 0, 0, 0.92)",
        coverFill: "rgba(70, 28, 24, 1)",
        coverStroke: "rgba(24, 10, 10, 1)",
        spineStroke: "rgba(40, 16, 14, 1)",
        pageFill: "rgba(92, 38, 30, 1)",
        pageStroke: "rgba(40, 16, 14, 1)",
        // Enemy preview panel should be darker than the surrounding page.
        spritePanelFill: "rgba(62, 24, 20, 1)",
        spritePanelStroke: "rgba(24, 10, 10, 1)",
        text: "rgba(248, 240, 236, 1)",
        accentText: "rgba(230, 214, 206, 1)",
        closeFill: "rgba(190, 58, 58, 1)",
        closeText: "rgba(255, 255, 255, 1)",
      },
      // Wild card: dark "arcane" purple theme.
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

  private activeCycledSpriteIndex = (len: number): number => {
    if (len <= 0) return 0;
    const t = Math.max(0, Date.now() - this.entryViewStartTime);
    return Math.floor(t / this.entrySpriteCycleMs) % len;
  };

  private setActiveEntryIndex = (nextIndex: number): void => {
    if (this.entries.length <= 0) {
      this.activeEntryIndex = 0;
      this.entryViewStartTime = Date.now();
      return;
    }
    const clamped =
      ((nextIndex % this.entries.length) + this.entries.length) %
      this.entries.length;
    if (clamped !== this.activeEntryIndex) {
      this.activeEntryIndex = clamped;
      // Reset sprite cycling so the viewed enemy starts at its first state.
      this.entryViewStartTime = Date.now();
      this.activeSpriteStateIndex = 0;
    }
  };

  // UI hitboxes (pixels)
  private leftArrowRect: { x: number; y: number; w: number; h: number } | null =
    null;
  private rightArrowRect: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null = null;
  private closeRect: { x: number; y: number; w: number; h: number } | null =
    null;
  private prevStateRect: { x: number; y: number; w: number; h: number } | null =
    null;
  private nextStateRect: { x: number; y: number; w: number; h: number } | null =
    null;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.player = player;
    this.entries = [];
    this.activeEntryIndex = 0;

    // Build registry from environment enemy mapping.
    this.enemyNameToClass = new Map();
    for (const [enemyClass] of enemyClassToId.entries()) {
      this.enemyNameToClass.set(enemyClass.name, enemyClass);
    }

    this.seenEnemyTypeNames = new Set(loadSeenEnemyTypes());

    // Always include crab as the first entry.
    this.ensureEntry("CrabEnemy");

    // In developer mode, show all enemies regardless of "seen" status.
    if (GameConstants.DEVELOPER_MODE) {
      for (const typeName of Object.keys(BESTIARY_ENEMIES)) {
        this.ensureEntry(typeName);
      }
    }

    // Load persisted entries.
    for (const enemyTypeName of this.seenEnemyTypeNames) {
      this.ensureEntry(enemyTypeName);
    }

    // Track newly encountered enemies for persistence/bestiary population.
    globalEventBus.on(EVENTS.ENEMY_SEEN_PLAYER, (data: any) => {
      const enemyTypeName = data?.enemyType;
      if (typeof enemyTypeName !== "string") return;
      this.addEntry(enemyTypeName);
    });

    // Initialize layout state based on current canvas size.
    this.handleResize();
  }

  /**
   * Opens the logbook window.
   */
  open = () => {
    this.isOpen = true;
    this.openTime = Date.now();
    this.previewAnimT = 0;
    this.entryViewStartTime = Date.now();
    // Ensure layout mode reflects the current screen size at the moment of opening.
    this.handleResize();
  };

  /**
   * Closes the logbook window.
   */
  close = () => {
    this.isOpen = false;
  };

  entryUp = () => {
    this.setActiveEntryIndex(this.activeEntryIndex - 1);
  };

  entryDown = () => {
    this.setActiveEntryIndex(this.activeEntryIndex + 1);
  };

  /**
   * Toggles the logbook window's open state.
   */
  toggleOpen = () => {
    this.isOpen ? this.close() : this.open();
  };

  isPointInBestiaryButton = (x: number, y: number): boolean => {
    const r = this.getBestiaryButtonRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  getBestiaryButtonRect = (): {
    x: number;
    y: number;
    w: number;
    h: number;
  } => {
    // Mirror `drawBestiaryButton()` positioning logic.
    let bx = 0.25;
    let by = GameConstants.HEIGHT / GameConstants.TILESIZE - 1.25;
    if (GameConstants.WIDTH < 145) by -= 1.25;
    const x = Math.round(bx * GameConstants.TILESIZE);
    const y = Math.round(by * GameConstants.TILESIZE);
    const w = GameConstants.TILESIZE;
    const h = GameConstants.TILESIZE;
    return { x, y, w, h };
  };

  drawBestiaryButton = (delta: number) => {
    // Mirror inventory button's bottom-corner positioning logic, but on the left.
    // `delta` is unused, but kept for parity with other UI draw methods.
    delta;
    Game.ctx.save();

    const r = this.getBestiaryButtonRect();
    this.buttonX = r.x / GameConstants.TILESIZE;
    this.buttonY = r.y / GameConstants.TILESIZE;

    // Draw like the inventory button, but +1 tileX on fxset (one to the right).
    Game.drawFX(1, 0, 1, 1, this.buttonX, this.buttonY, 1, 1);

    Game.ctx.restore();
  };

  /**
   * Adds a new entry to the logbook.
   * @param enemyTypeName The enemy class name (e.g. "CrabEnemy")
   */
  addEntry = (enemyTypeName: string) => {
    this.seenEnemyTypeNames.add(enemyTypeName);
    this.ensureEntry(enemyTypeName);
    saveSeenEnemyTypes(this.seenEnemyTypeNames);
  };

  private ensureEntry = (enemyTypeName: string) => {
    // Already exists?
    if (this.entries.some((e) => e.typeName === enemyTypeName)) return;

    const reg = BESTIARY_ENEMIES[enemyTypeName];
    if (reg) {
      this.entries.push({
        typeName: reg.typeName,
        displayName: reg.displayName,
        description: reg.description,
        sprites: reg.sprites.map((s) => ({
          label: s.label,
          tileX: s.tileX,
          tileY: s.tileY,
          frames: s.frames ?? 1,
          frameStride: s.frameStride ?? 1,
          frameMs: s.frameMs ?? 220,
          w: s.w ?? 1,
          h: s.h ?? 1,
          hp: s.hp,
          maxHp: s.maxHp,
          effects: s.effects,
          sheet: s.sheet,
          offsetX: s.offsetX,
          offsetY: s.offsetY,
          hitWarningsWide: s.hitWarningsWide,
          hitWarnings: s.hitWarnings,
          rumbling: s.rumbling,
        })),
      });
      return;
    }

    const cls = this.enemyNameToClass.get(enemyTypeName);
    if (!cls) return;

    // WARNING: many enemies set tileX/tileY/description in their constructor.
    // For now we rely on the prototype fields present for common enemies, falling back to defaults.
    const proto = cls.prototype as unknown as {
      description?: string;
      tileX?: number;
      tileY?: number;
      name?: string;
    };

    this.entries.push({
      typeName: enemyTypeName,
      displayName: proto.name ?? enemyTypeName,
      description: proto.description ?? "",
      sprites: [
        {
          label: "Idle",
          tileX: proto.tileX ?? 0,
          tileY: proto.tileY ?? 0,
          frames: 1,
          frameStride: 1,
          frameMs: 220,
          w: 1,
          h: 1,
        },
      ],
    });
  };

  pageLeft = () => {
    if (this.entries.length <= 0) return;
    const subpageMode =
      this.isCompactMode() && !GameplaySettings.BESTIARY_STACK_PANELS_ON_NARROW;
    if (subpageMode) {
      // Linear navigation across (entry, subpage).
      const totalPages = this.entries.length * 2;
      const current = this.activeEntryIndex * 2 + this.activeEntrySubpage;
      const next = (current - 1 + totalPages) % totalPages;
      const nextEntry = Math.floor(next / 2);
      this.activeEntrySubpage = (next % 2) as 0 | 1;
      this.setActiveEntryIndex(nextEntry);
      return;
    }

    this.setActiveEntryIndex(this.activeEntryIndex - 1);
  };

  pageRight = () => {
    if (this.entries.length <= 0) return;
    const subpageMode =
      this.isCompactMode() && !GameplaySettings.BESTIARY_STACK_PANELS_ON_NARROW;
    if (subpageMode) {
      const totalPages = this.entries.length * 2;
      const current = this.activeEntryIndex * 2 + this.activeEntrySubpage;
      const next = (current + 1) % totalPages;
      const nextEntry = Math.floor(next / 2);
      this.activeEntrySubpage = (next % 2) as 0 | 1;
      this.setActiveEntryIndex(nextEntry);
      return;
    }

    this.setActiveEntryIndex(this.activeEntryIndex + 1);
  };

  handleInput = (input: "escape" | "left" | "right") => {
    if (!this.isOpen) return;
    if (input === "escape") {
      this.close();
      return;
    }
    if (input === "left") this.pageLeft();
    if (input === "right") this.pageRight();
  };

  handleMouseDown = (x: number, y: number) => {
    if (!this.isOpen) return;
    // Allow the inventory-style button to close the bestiary.
    if (this.isPointInBestiaryButton(x, y)) {
      this.close();
      return;
    }
    if (this.closeRect && this.pointInRect(x, y, this.closeRect)) {
      this.close();
      return;
    }
    if (this.prevStateRect && this.pointInRect(x, y, this.prevStateRect)) {
      this.advanceSpriteState(-1);
      return;
    }
    if (this.nextStateRect && this.pointInRect(x, y, this.nextStateRect)) {
      this.advanceSpriteState(1);
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

  private pointInRect = (
    x: number,
    y: number,
    r: { x: number; y: number; w: number; h: number },
  ) => {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };

  /**
   * Draws the logbook interface.
   * @param delta The time delta since the last frame.
   */
  draw = (delta: number) => {
    if (!this.isOpen) return;
    Game.ctx.save();
    HitWarning.updatePreviewFrame(delta);
    this.previewAnimT += delta;
    const theme = this.getTheme();

    // Backdrop
    Game.ctx.fillStyle = theme.backdrop;
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Book rect
    const margin = this.marginPx();
    const bookW = Math.min(GameConstants.WIDTH - margin * 2, 420);
    const bookH = Math.min(GameConstants.HEIGHT - margin * 2, 260);
    const bookX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * bookW);
    const bookY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * bookH);
    const compactMode = this.isCompactMode();
    const stackedMode =
      compactMode && GameplaySettings.BESTIARY_STACK_PANELS_ON_NARROW;
    const subpageMode = compactMode && !stackedMode;
    if (!subpageMode) this.activeEntrySubpage = 0;

    // Cover/border
    Game.ctx.fillStyle = theme.coverFill;
    Game.ctx.fillRect(bookX, bookY, bookW, bookH);
    Game.ctx.strokeStyle = theme.coverStroke;
    Game.ctx.lineWidth = 2;
    Game.ctx.strokeRect(bookX, bookY, bookW, bookH);

    // Spine (only in two-page mode)
    const spineX = Math.round(bookX + bookW / 2);
    if (!compactMode) {
      Game.ctx.strokeStyle = theme.spineStroke;
      Game.ctx.lineWidth = 2;
      Game.ctx.beginPath();
      Game.ctx.moveTo(spineX, bookY + 8);
      Game.ctx.lineTo(spineX, bookY + bookH - 8);
      Game.ctx.stroke();
    }

    // Page panels
    const pad = this.innerPadPx();
    const pageW = compactMode
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
    if (!compactMode) {
      Game.ctx.fillRect(rightX, pageY, pageW, pageH);
      Game.ctx.strokeRect(rightX, pageY, pageW, pageH);
    }

    // Close button (top-right corner of book)
    const closeSize = 18;
    this.closeRect = {
      x: bookX + bookW - closeSize - 6,
      y: bookY + 6,
      w: closeSize,
      h: closeSize,
    };

    const entry = this.entries[this.activeEntryIndex] ?? null;
    if (!entry) {
      Game.ctx.fillStyle = theme.text;
      Game.fillText("No entries", leftX + 6, pageY + 6);
    } else {
      const inset = this.pageInsetPx();
      if (stackedMode) {
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
        Game.ctx.fillStyle = theme.text;
        Game.fillText(entry.displayName, contentX, contentY);
        this.drawWrappedText(
          entry.description || "???",
          contentX,
          contentY + 14,
          contentW,
        );
        Game.ctx.restore();

        // Sprite region
        const spriteY = contentY + infoH + gap;
        const spriteH = Math.max(0, contentY + contentH - spriteY);
        const spriteRect = { x: contentX, y: spriteY, w: contentW, h: spriteH };

        Game.ctx.fillStyle = theme.spritePanelFill;
        Game.ctx.strokeStyle = theme.spritePanelStroke;
        Game.ctx.lineWidth = 1;
        Game.ctx.fillRect(spriteRect.x, spriteRect.y, spriteRect.w, spriteRect.h);
        Game.ctx.strokeRect(
          spriteRect.x,
          spriteRect.y,
          spriteRect.w,
          spriteRect.h,
        );

        this.drawSpritesWithHitWarnings(entry.sprites ?? [], spriteRect);

        this.drawStateCycleButton({
          theme,
          compactMode,
          leftX,
          rightX,
          pageY,
          pageW,
          pageH,
          inset,
          entry,
          spriteRect,
        });
      } else {
        if (!compactMode || this.activeEntrySubpage === 0) {
          // Info page
          Game.ctx.fillStyle = theme.text;
          Game.fillText(entry.displayName, leftX + inset, pageY + inset);
          this.drawWrappedText(
            entry.description || "???",
            leftX + inset,
            pageY + inset + 14,
            pageW - inset * 2,
          );
        }

        if (!compactMode || this.activeEntrySubpage === 1) {
          // Sprite page (right page in wide mode, single page in compact mode)
          Game.ctx.fillStyle = theme.spritePanelFill;
          Game.ctx.strokeStyle = theme.spritePanelStroke;
          Game.ctx.lineWidth = 1;
          const rightInnerX = (compactMode ? leftX : rightX) + inset;
          const rightInnerY = pageY + inset;
          const rightInnerW = pageW - inset * 2;
          const rightInnerH = pageH - inset * 2;
          Game.ctx.fillRect(rightInnerX, rightInnerY, rightInnerW, rightInnerH);
          Game.ctx.strokeRect(rightInnerX, rightInnerY, rightInnerW, rightInnerH);

          this.drawSpritesWithHitWarnings(entry.sprites ?? [], {
            x: rightInnerX,
            y: rightInnerY,
            w: rightInnerW,
            h: rightInnerH,
          });

          this.drawStateCycleButton({
            theme,
            compactMode,
            leftX,
            rightX,
            pageY,
            pageW,
            pageH,
            inset,
            entry,
          });
        }
      }
    }

    // Page turn arrows
    const arrowY = bookY + bookH - 20;
    const arrowW = 28;
    const arrowH = 14;
    if (this.entries.length > 1) {
      this.leftArrowRect = {
        x: spineX - arrowW - 18,
        y: arrowY,
        w: arrowW,
        h: arrowH,
      };
      this.rightArrowRect = {
        x: spineX + 18,
        y: arrowY,
        w: arrowW,
        h: arrowH,
      };
      this.drawArrow(this.leftArrowRect, "left");
      this.drawArrow(this.rightArrowRect, "right");
    } else {
      this.leftArrowRect = null;
      this.rightArrowRect = null;
    }

    // Page indicator (entry index stays the same even in compact mode)
    if (this.entries.length > 0) {
      const indicator = `${this.activeEntryIndex + 1}/${this.entries.length}`;
      const iw = Game.measureText(indicator).width;
      Game.ctx.fillStyle = theme.accentText;
      Game.fillText(indicator, spineX - iw / 2, arrowY + 2);
      if (subpageMode) {
        const sub = this.activeEntrySubpage === 0 ? "Info" : "Sprite";
        Game.fillText(` ${sub}`, spineX + iw / 2, arrowY + 2);
      }
    }

    // Close button should draw on top of everything else in the bestiary.
    if (this.closeRect) {
      Game.ctx.fillStyle = theme.closeFill;
      Game.ctx.fillRect(
        this.closeRect.x,
        this.closeRect.y,
        this.closeRect.w,
        this.closeRect.h,
      );
      Game.ctx.fillStyle = theme.closeText;
      Game.fillText("X", this.closeRect.x + 6, this.closeRect.y + 6);
    }

    Game.ctx.restore();
  };

  /**
   * Recompute layout mode based on current scaled canvas width.
   * Call this from `Game.onResize()` so the Bestiary flips immediately as the screen changes.
   */
  handleResize = (): void => {
    const nextCompact = this.computeCompactMode();
    if (nextCompact === this.compactMode) return;

    this.compactMode = nextCompact;

    // If we just switched to wide mode, ensure we're on the info page (since sprites will
    // render on the right page again).
    if (!this.compactMode) this.activeEntrySubpage = 0;
    // In stacked compact layout we never want to "stick" on the sprite-only subpage.
    if (
      this.compactMode &&
      GameplaySettings.BESTIARY_STACK_PANELS_ON_NARROW
    ) {
      this.activeEntrySubpage = 0;
    }
  };

  private isCompactMode = (): boolean => {
    return this.compactMode;
  };

  private computeCompactMode = (): boolean => {
    // Decide compact mode in *screen pixels* (CSS px), so this doesn't get stuck
    // when the user changes scale. `GameConstants.WIDTH` is unscaled canvas px.
    const canvasScreenW = GameConstants.WIDTH;

    const marginScreenPx = this.marginPx();
    const maxBookScreenPx = 420;
    const bookScreenPx = Math.min(
      canvasScreenW - marginScreenPx * 2,
      maxBookScreenPx,
    );

    // Threshold is in screen px: below this, two-page layout becomes unusably tight.
    return bookScreenPx < 250;
  };

  private drawSpritesWithHitWarnings = (
    sprites: BestiaryEntry["sprites"],
    rect: { x: number; y: number; w: number; h: number },
  ) => {
    const theme = this.getTheme();
    const count = sprites.length;
    if (count === 0) {
      Game.ctx.fillStyle = theme.text;
      Game.fillText("No sprite", rect.x + 6, rect.y + 6);
      return;
    }

    // Default behavior: show one state at a time (manual by default; otherwise auto-cycle).
    if (count > 1) {
      if (this.manualStateCycling) {
        const idx = ((this.activeSpriteStateIndex % count) + count) % count;
        this.drawSpritesWithHitWarnings([sprites[idx]], rect);
        return;
      }
      if (this.cycleEntrySprites) {
        const idx = this.activeCycledSpriteIndex(count);
        this.drawSpritesWithHitWarnings([sprites[idx]], rect);
        return;
      }
    }

    const cols = count === 1 ? 1 : count === 2 ? 2 : 2;
    const rows = Math.ceil(count / cols);
    const cellW = rect.w / cols;
    const cellH = rect.h / rows;
    const labelH = Game.letter_height + 4;
    const cellPad = 6;

    for (let i = 0; i < count; i++) {
      const s = sprites[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellX = rect.x + col * cellW;
      const cellY = rect.y + row * cellH;

      // Label
      Game.ctx.fillStyle = theme.text;
      const label = s.label ?? "";
      const lw = Game.measureText(label).width;
      if (label.length > 0) {
        Game.fillText(label, cellX + cellW / 2 - lw / 2, cellY + 2);
      }

      // Sprite draw area (pixels)
      const areaY = cellY + labelH;
      const areaHpx = cellH - labelH - cellPad;
      const drawW = s.w;
      const drawH = s.h;

      const centerX = cellX + cellW / 2;
      const centerY = areaY + areaHpx / 2;
      const drawX = centerX / GameConstants.TILESIZE - drawW / 2;
      const drawY = centerY / GameConstants.TILESIZE - drawH / 2;

      // Match crab-style rumble (2-frame: base vs +1px) when requested.
      const rumbleTiles =
        s.rumbling && Math.floor(Date.now() / 170) % 2 === 1
          ? 1 / GameConstants.TILESIZE
          : 0;

      const ox = s.offsetX ?? 0;
      const oy = s.offsetY ?? 0;
      const xBase = drawX + ox;
      const yBase = drawY + oy;
      const x = xBase + rumbleTiles;
      const y = yBase;

      const frames = s.frames ?? 1;
      const stride = s.frameStride ?? 1;
      const frameMs = s.frameMs ?? 220;
      const w = s.w ?? 1;
      const h = s.h ?? 1;
      const frameIndex =
        frames <= 1 ? 0 : Math.floor(Date.now() / frameMs) % frames;
      const tx = s.tileX + frameIndex * stride * w;

      // Bestiary-only effect previews (e.g. wizard fireballs).
      // Draw effects that are above the enemy first so they appear behind the mob sprite.
      this.drawEffectsPreview(s, { xBase, yBase, drawW, drawH }, "behind");

      if (s.sheet === "obj") {
        Game.drawObj(tx, s.tileY, w, h, x, y, drawW, drawH, "Black", 0);
      } else {
        Entity.drawIdleSprite({
          tileX: s.tileX,
          tileY: s.tileY,
          x,
          y,
          w: s.w,
          h: s.h,
          drawW,
          drawH,
          frames: s.frames,
          frameStride: s.frameStride,
          frameMs: s.frameMs,
          shadeColor: "Black",
          shadeAmount: 0,
        });
      }

      // Draw remaining effects on top of the mob sprite.
      this.drawEffectsPreview(s, { xBase, yBase, drawW, drawH }, "front");

      // Optional HP bar preview (uses existing heart-bar visuals).
      // Draw it anchored to the sprite (right above), not in the text/label row.
      if (s.hp !== undefined && s.maxHp !== undefined && s.maxHp > 1) {
        // HealthBar visuals are centered around (x + 0.5). So pass (desiredCenter - 0.5).
        const hbX = xBase + (drawW - 1) / 2;
        // Place the bar just above the sprite's top edge.
        // `HealthBar.drawStatic` draws at (y - 1.25), so `yBase + 1` -> `yBase - 0.25`.
        const hbY = yBase + 1;
        HealthBar.drawStatic({
          hearts: s.hp,
          maxHearts: s.maxHp,
          x: hbX,
          y: hbY,
          flashing: true,
        });
      }

      // Hitwarnings (anchor should not include rumble)
      //
      // NOTE: `hitWarningsWide` is intentionally NOT "draw twice". It's a coordinate-space
      // tweak for authoring: for wide sprites (w>1), anchor hitwarnings on the *left* foot
      // tile so registry authors can place per-tile warnings with integer offsets:
      // - left tile: x = 0
      // - right tile: x = 1 (for w=2)
      const anchorY = yBase + (drawH - 1);
      const anchorX =
        s.hitWarningsWide && drawW > 1 ? xBase : xBase + (drawW - 1) / 2;

      for (const hw of s.hitWarnings ?? []) {
        const alpha = hw.alpha ?? 1;
        const show = hw.show ?? {};

        const tx2 = anchorX + hw.targetOffset.x;
        const ty2 = anchorY + hw.targetOffset.y + 0.5;

        const dir = this.resolveHitWarningDir(hw, anchorX, anchorY);
        if (dir !== null) {
          if (show.redArrow) {
            HitWarning.drawPreviewArrow({
              targetX: tx2,
              targetY: ty2,
              dir,
              variant: "red",
              alpha,
            });
          }
          if (show.whiteArrow) {
            HitWarning.drawPreviewArrow({
              targetX: tx2,
              targetY: ty2,
              dir,
              variant: "white",
              alpha,
              suppressIfNorth: true,
            });
          }
        }
        if (show.redX) {
          HitWarning.drawPreviewX({ targetX: tx2, targetY: ty2, alpha });
        }
      }
    }
  };

  private drawEffectsPreview = (
    sprite: BestiaryEntry["sprites"][number],
    args: { xBase: number; yBase: number; drawW: number; drawH: number },
    layer: "behind" | "front",
  ): void => {
    const effects = sprite.effects;
    if (!effects || effects.length === 0) return;

    // Feet-tile anchor for placing effects (matches hitwarning anchor approach).
    const baseY = args.yBase + (args.drawH - 1);
    const baseX =
      sprite.hitWarningsWide && args.drawW > 1
        ? args.xBase
        : args.xBase + (args.drawW - 1) / 2;

    for (const fx of effects) {
      if (fx.kind !== "wizardFireball") continue;

      // Mirror `WizardFireball.tileY` selection.
      const tileY =
        fx.variant === "energy" ? 7 : fx.variant === "fire" ? 8 : 10;

      // Determine which offsets should render behind the mob.
      // Mirror WizardFireball's own draw offsets:
      // - state 0: y + 0
      // - state 1: y - 0.2
      // - state 2: y - 1
      const stateYOffset = fx.state === 2 ? -1 : fx.state === 1 ? -0.2 : 0;

      const offsets = fx.offsets
        .filter((o) => {
          const yDraw = o.y + stateYOffset;
          return layer === "behind" ? yDraw < 0 : yDraw >= 0;
        })
        // stable: higher tiles first
        .slice()
        .sort((a, b) => a.y - b.y);

      for (const o of offsets) {
        const x = baseX + o.x;
        // Nudge down slightly to match the in-game perceived placement.
        const y = baseY + o.y + 0.5;

        if (fx.state === 0) {
          const frame = Math.floor(this.previewAnimT * 0.25) % 4;
          Game.drawFX(22 + frame, tileY, 1, 1, x, y, 1, 1);
        } else if (fx.state === 1) {
          const frame = Math.floor(this.previewAnimT * 0.25) % 4;
          Game.drawFX(18 + frame, tileY, 1, 1, x, y - 0.2, 1, 1);
        } else {
          const frame = Math.floor(this.previewAnimT * 0.3) % 18;
          Game.drawFX(frame, 6, 1, 2, x, y - 1, 1, 2);
        }
      }
    }
  };

  private advanceSpriteState = (dir: -1 | 1): void => {
    const entry = this.entries[this.activeEntryIndex];
    const count = entry?.sprites?.length ?? 0;
    if (count <= 1) return;
    this.activeSpriteStateIndex =
      (((this.activeSpriteStateIndex + dir) % count) + count) % count;
  };

  private drawStateCycleButton = (args: {
    theme: ReturnType<Bestiary["getTheme"]>;
    compactMode: boolean;
    leftX: number;
    rightX: number;
    pageY: number;
    pageW: number;
    pageH: number;
    inset: number;
    entry: BestiaryEntry;
    spriteRect?: { x: number; y: number; w: number; h: number };
  }): void => {
    const count = args.entry.sprites?.length ?? 0;
    const shouldShow = this.manualStateCycling && count > 1;
    if (!shouldShow) {
      this.prevStateRect = null;
      this.nextStateRect = null;
      return;
    }

    // Render as simple left/right arrows (no box/text), centered on the sprite page.
    const arrowW = 22;
    const arrowH = 12;
    const gap = 14;

    // Place at the bottom of the sprite region/page, centered.
    const centerX =
      args.spriteRect?.x !== undefined
        ? args.spriteRect.x + args.spriteRect.w / 2
        : (args.compactMode ? args.leftX : args.rightX) + args.pageW / 2;
    const totalW = arrowW * 2 + gap;
    const leftX = Math.round(centerX - totalW / 2);
    const rightX = leftX + arrowW + gap;
    const y = Math.round(
      args.spriteRect?.y !== undefined
        ? args.spriteRect.y + args.spriteRect.h - arrowH - 6
        : args.pageY + args.pageH - arrowH - 4,
    );

    this.prevStateRect = { x: leftX, y, w: arrowW, h: arrowH };
    this.nextStateRect = { x: rightX, y, w: arrowW, h: arrowH };
    this.drawArrow(this.prevStateRect, "left");
    this.drawArrow(this.nextStateRect, "right");
  };

  private resolveHitWarningDir = (
    hw: NonNullable<BestiaryEntry["sprites"][number]["hitWarnings"]>[number],
    anchorX: number,
    anchorY: number,
  ): HitWarningDirection | null => {
    if (hw.direction) {
      const map: Record<
        NonNullable<typeof hw.direction>,
        HitWarningDirection
      > = {
        North: HitWarningDirection.North,
        NorthEast: HitWarningDirection.NorthEast,
        East: HitWarningDirection.East,
        SouthEast: HitWarningDirection.SouthEast,
        South: HitWarningDirection.South,
        SouthWest: HitWarningDirection.SouthWest,
        West: HitWarningDirection.West,
        NorthWest: HitWarningDirection.NorthWest,
        Center: HitWarningDirection.Center,
      };
      return map[hw.direction];
    }

    if (!hw.sourceOffset) return null;
    const sourceX = anchorX + hw.sourceOffset.x;
    const sourceY = anchorY + hw.sourceOffset.y;
    const targetX = anchorX + hw.targetOffset.x;
    const targetY = anchorY + hw.targetOffset.y;
    return HitWarning.computePointerDir({
      targetX,
      targetY,
      sourceX,
      sourceY,
    });
  };

  private drawArrow = (
    rect: { x: number; y: number; w: number; h: number },
    dir: "left" | "right",
  ) => {
    // Draw a fixed 1x1 tile sprite, centered within the clickable rect.
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

  private drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
  ) => {
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
