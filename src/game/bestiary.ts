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
    sheet?: "mob" | "obj";
    offsetX?: number;
    offsetY?: number;
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
  entries: Array<BestiaryEntry>;
  activeEntryIndex: number = 0;
  private seenEnemyTypeNames: Set<string>;
  private enemyNameToClass: Map<string, typeof Enemy>;

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
  }

  /**
   * Opens the logbook window.
   */
  open = () => {
    this.isOpen = true;
    this.openTime = Date.now();
  };

  /**
   * Closes the logbook window.
   */
  close = () => {
    this.isOpen = false;
  };

  entryUp = () => {
    this.activeEntryIndex =
      (this.activeEntryIndex - 1 + this.entries.length) % this.entries.length;
  };

  entryDown = () => {
    this.activeEntryIndex = (this.activeEntryIndex + 1) % this.entries.length;
  };

  /**
   * Toggles the logbook window's open state.
   */
  toggleOpen = () => {
    this.isOpen ? this.close() : this.open();
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
          sheet: s.sheet,
          offsetX: s.offsetX,
          offsetY: s.offsetY,
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
    this.activeEntryIndex =
      (this.activeEntryIndex - 1 + this.entries.length) % this.entries.length;
  };

  pageRight = () => {
    if (this.entries.length <= 0) return;
    this.activeEntryIndex = (this.activeEntryIndex + 1) % this.entries.length;
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

    // Backdrop
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Book rect
    const margin = 16;
    const bookW = Math.min(GameConstants.WIDTH - margin * 2, 420);
    const bookH = Math.min(GameConstants.HEIGHT - margin * 2, 260);
    const bookX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * bookW);
    const bookY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * bookH);

    // Cover/border
    Game.ctx.fillStyle = "rgba(235, 225, 200, 1)";
    Game.ctx.fillRect(bookX, bookY, bookW, bookH);
    Game.ctx.strokeStyle = "rgba(120, 100, 80, 1)";
    Game.ctx.lineWidth = 2;
    Game.ctx.strokeRect(bookX, bookY, bookW, bookH);

    // Spine
    const spineX = Math.round(bookX + bookW / 2);
    Game.ctx.strokeStyle = "rgba(160, 140, 120, 1)";
    Game.ctx.lineWidth = 2;
    Game.ctx.beginPath();
    Game.ctx.moveTo(spineX, bookY + 8);
    Game.ctx.lineTo(spineX, bookY + bookH - 8);
    Game.ctx.stroke();

    // Page panels
    const pad = 12;
    const pageW = Math.floor(bookW / 2) - pad * 2;
    const pageH = bookH - pad * 2 - 22; // reserve bottom row for arrows
    const leftX = bookX + pad;
    const rightX = spineX + pad;
    const pageY = bookY + pad;

    Game.ctx.fillStyle = "rgba(245, 238, 220, 1)";
    Game.ctx.fillRect(leftX, pageY, pageW, pageH);
    Game.ctx.fillRect(rightX, pageY, pageW, pageH);
    Game.ctx.strokeStyle = "rgba(200, 185, 160, 1)";
    Game.ctx.lineWidth = 1;
    Game.ctx.strokeRect(leftX, pageY, pageW, pageH);
    Game.ctx.strokeRect(rightX, pageY, pageW, pageH);

    // Close button (top-right corner of book)
    const closeSize = 18;
    this.closeRect = {
      x: bookX + bookW - closeSize - 6,
      y: bookY + 6,
      w: closeSize,
      h: closeSize,
    };
    Game.ctx.fillStyle = "rgba(220, 60, 60, 1)";
    Game.ctx.fillRect(
      this.closeRect.x,
      this.closeRect.y,
      this.closeRect.w,
      this.closeRect.h,
    );
    Game.ctx.fillStyle = "rgba(255,255,255,1)";
    Game.fillText("X", this.closeRect.x + 6, this.closeRect.y + 6);

    const entry = this.entries[this.activeEntryIndex] ?? null;
    if (!entry) {
      Game.ctx.fillStyle = "rgba(40, 35, 30, 1)";
      Game.fillText("No entries", leftX + 6, pageY + 6);
    } else {
      // Left page: name + description
      Game.ctx.fillStyle = "rgba(40, 35, 30, 1)";
      Game.fillText(entry.displayName, leftX + 6, pageY + 6);
      this.drawWrappedText(
        entry.description || "???",
        leftX + 6,
        pageY + 20,
        pageW - 12,
      );

      // Right page: enemy sprite (idle)
      Game.ctx.strokeStyle = "rgba(120, 100, 80, 1)";
      Game.ctx.lineWidth = 1;
      const rightInnerX = rightX + 10;
      const rightInnerY = pageY + 10;
      const rightInnerW = pageW - 20;
      const rightInnerH = pageH - 20;
      Game.ctx.strokeRect(rightInnerX, rightInnerY, rightInnerW, rightInnerH);

      const sprites = entry.sprites ?? [];
      const count = sprites.length;
      if (count === 0) {
        Game.ctx.fillStyle = "rgba(40, 35, 30, 1)";
        Game.fillText("No sprite", rightInnerX + 6, rightInnerY + 6);
      } else {
        const cols = count === 1 ? 1 : count === 2 ? 2 : 2;
        const rows = Math.ceil(count / cols);
        const cellW = rightInnerW / cols;
        const cellH = rightInnerH / rows;
        const labelH = Game.letter_height + 4;
        const cellPad = 6;

        for (let i = 0; i < count; i++) {
          const s = sprites[i];
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cellX = rightInnerX + col * cellW;
          const cellY = rightInnerY + row * cellH;

          // Label
          Game.ctx.fillStyle = "rgba(40, 35, 30, 1)";
          const label = s.label ?? "";
          const lw = Game.measureText(label).width;
          Game.fillText(label, cellX + cellW / 2 - lw / 2, cellY + 2);

          // Sprite draw area (pixels)
          const areaX = cellX + cellPad;
          const areaY = cellY + labelH;
          const areaWpx = cellW - cellPad * 2;
          const areaHpx = cellH - labelH - cellPad;
          // Do not scale sprites down to fit; allow overlap if they exceed their cells.
          const drawW = s.w;
          const drawH = s.h;

          const centerX = cellX + cellW / 2;
          const centerY = areaY + areaHpx / 2;
          const drawX = centerX / GameConstants.TILESIZE - drawW / 2;
          const drawY = centerY / GameConstants.TILESIZE - drawH / 2;

          // Match crab-style rumble (2-frame: base vs +1px) when requested.
          // Use exactly 1px in tile-units so this remains visible regardless of TILESIZE.
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

          // Bestiary-only: render any hitwarning previews requested for this sprite/state.
          // Anchor at the "feet tile" of the drawn sprite (better for 1x2 mobs).
          // IMPORTANT: anchor should not include rumble jitter, otherwise the hitwarnings
          // visually "rumble" along with the sprite.
          const anchorX = xBase + (drawW - 1) / 2;
          const anchorY = yBase + (drawH - 1);
          for (const hw of s.hitWarnings ?? []) {
            const tx2 = anchorX + hw.targetOffset.x;
            // Bestiary tweak: the in-game hitwarning sprites are biased slightly upward.
            // For bestiary previews we want them visually centered on the target tile.
            const ty2 = anchorY + hw.targetOffset.y + 0.5;
            const alpha = hw.alpha ?? 1;
            const show = hw.show ?? {};

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

    // Page indicator
    if (this.entries.length > 0) {
      const indicator = `${this.activeEntryIndex + 1}/${this.entries.length}`;
      const iw = Game.measureText(indicator).width;
      Game.ctx.fillStyle = "rgba(60, 50, 40, 1)";
      Game.fillText(indicator, spineX - iw / 2, arrowY + 2);
    }

    Game.ctx.restore();
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
    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(60, 50, 40, 1)";
    Game.ctx.beginPath();
    if (dir === "left") {
      Game.ctx.moveTo(rect.x + rect.w, rect.y);
      Game.ctx.lineTo(rect.x, rect.y + rect.h / 2);
      Game.ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
    } else {
      Game.ctx.moveTo(rect.x, rect.y);
      Game.ctx.lineTo(rect.x + rect.w, rect.y + rect.h / 2);
      Game.ctx.lineTo(rect.x, rect.y + rect.h);
    }
    Game.ctx.closePath();
    Game.ctx.fill();
    Game.ctx.restore();
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
