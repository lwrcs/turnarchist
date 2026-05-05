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
import { BookRenderer, BookTheme } from "../gui/bookRenderer";

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
    effects?: Array<
      | {
          kind: "wizardFireball";
          state: 0 | 1 | 2;
          variant: "energy" | "fire" | "earth";
          offsets: Array<{ x: number; y: number }>;
        }
      | {
          kind: "bigWizardFireball";
          state: 0 | 1 | 2;
          offsets: Array<{ x: number; y: number }>;
        }
    >;
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

export class Bestiary extends BookRenderer {
  game: Game;
  player: Player;
  private entryViewStartTime: number = Date.now();
  entries: Array<BestiaryEntry>;
  private seenEnemyTypeNames: Set<string>;
  private enemyNameToClass: Map<string, typeof Enemy>;

  cycleEntrySprites: boolean = true;
  private readonly entrySpriteCycleMs = 1200;
  manualStateCycling: boolean = true;
  private activeSpriteStateIndex: number = 0;

  private prevStateRect: { x: number; y: number; w: number; h: number } | null = null;
  private nextStateRect: { x: number; y: number; w: number; h: number } | null = null;

  constructor(game: Game, player: Player) {
    super();
    this.game = game;
    this.player = player;
    this.entries = [];
    this.currentPage = 0;

    this.enemyNameToClass = new Map();
    for (const [enemyClass] of enemyClassToId.entries()) {
      this.enemyNameToClass.set(enemyClass.name, enemyClass);
    }

    this.seenEnemyTypeNames = new Set(loadSeenEnemyTypes());

    this.ensureEntry("CrabEnemy");

    if (GameConstants.DEVELOPER_MODE) {
      for (const typeName of Object.keys(BESTIARY_ENEMIES)) {
        this.ensureEntry(typeName);
      }
    }

    for (const enemyTypeName of this.seenEnemyTypeNames) {
      this.ensureEntry(enemyTypeName);
    }

    globalEventBus.on(EVENTS.ENEMY_SEEN_PLAYER, (data: any) => {
      const enemyTypeName = data?.enemyType;
      if (typeof enemyTypeName !== "string") return;
      this.addEntry(enemyTypeName);
    });

    this.handleResize();
  }

  // ── BookRenderer abstract implementations ─────────────────────────────────

  getPageCount(): number {
    return this.entries.length;
  }

  drawLeftPage(
    pageIndex: number,
    x: number,
    y: number,
    _w: number,
    _h: number,
    theme: BookTheme,
  ): void {
    const entry = this.entries[pageIndex];
    if (!entry) return;
    Game.ctx.fillStyle = theme.text;
    Game.fillText(entry.displayName, x, y);
    this.drawWrappedText(entry.description || "???", x, y + 14, _w);
  }

  drawRightPage(
    pageIndex: number,
    x: number,
    y: number,
    w: number,
    h: number,
    theme: BookTheme,
  ): void {
    const entry = this.entries[pageIndex];
    if (!entry) return;
    this.drawSpritesWithHitWarnings(entry.sprites ?? [], { x, y, w, h });
    this.drawStateCycleButton(theme, entry, { x, y, w, h });
  }

  // ── Protected hook overrides ───────────────────────────────────────────────

  protected onBeforeDraw(delta: number): void {
    HitWarning.updatePreviewFrame(delta);
  }

  protected onPageChanged(newPage: number): void {
    this.setActiveEntryIndex(newPage);
  }

  protected onHitboxesClear(): void {
    this.prevStateRect = null;
    this.nextStateRect = null;
  }

  protected handleExtraClick(x: number, y: number): boolean {
    if (this.prevStateRect && this.pointInRect(x, y, this.prevStateRect)) {
      this.advanceSpriteState(-1);
      return true;
    }
    if (this.nextStateRect && this.pointInRect(x, y, this.nextStateRect)) {
      this.advanceSpriteState(1);
      return true;
    }
    return false;
  }

  protected stackedModeEnabled(): boolean {
    return GameplaySettings.BESTIARY_STACK_PANELS_ON_NARROW;
  }

  protected subpageLabel(subpage: 0 | 1): string {
    return subpage === 0 ? "Info" : "Sprite";
  }

  protected onOpen(): void {
    this.entryViewStartTime = Date.now();
  }

  // ── Public Bestiary-specific API ──────────────────────────────────────────

  entryUp = () => {
    this.setActiveEntryIndex(this.currentPage - 1);
  };

  entryDown = () => {
    this.setActiveEntryIndex(this.currentPage + 1);
  };

  openToEnemy = (typeName: string) => {
    const idx = this.entries.findIndex((e) => e.typeName === typeName);
    if (idx !== -1) this.currentPage = idx;
    this.open();
  };


  addEntry = (enemyTypeName: string) => {
    this.seenEnemyTypeNames.add(enemyTypeName);
    this.ensureEntry(enemyTypeName);
    saveSeenEnemyTypes(this.seenEnemyTypeNames);
  };

  isPointInBestiaryControls = (x: number, y: number): boolean => {
    if (this.isPointInBookControls(x, y)) return true;
    if (this.prevStateRect && this.pointInRect(x, y, this.prevStateRect)) return true;
    if (this.nextStateRect && this.pointInRect(x, y, this.nextStateRect)) return true;
    return false;
  };

  // ── Private Bestiary helpers ───────────────────────────────────────────────

  private ensureEntry = (enemyTypeName: string) => {
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

  private activeCycledSpriteIndex = (len: number): number => {
    if (len <= 0) return 0;
    const t = Math.max(0, Date.now() - this.entryViewStartTime);
    return Math.floor(t / this.entrySpriteCycleMs) % len;
  };

  private setActiveEntryIndex = (nextIndex: number): void => {
    if (this.entries.length <= 0) {
      this.currentPage = 0;
      this.entryViewStartTime = Date.now();
      return;
    }
    const clamped =
      ((nextIndex % this.entries.length) + this.entries.length) %
      this.entries.length;
    if (clamped !== this.currentPage) {
      this.currentPage = clamped;
      this.entryViewStartTime = Date.now();
      this.activeSpriteStateIndex = 0;
    }
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

      Game.ctx.fillStyle = theme.text;
      const label = s.label ?? "";
      const lw = Game.measureText(label).width;
      if (label.length > 0) {
        Game.fillText(label, cellX + cellW / 2 - lw / 2, cellY + 2);
      }

      const areaY = cellY + labelH;
      const areaHpx = cellH - labelH - cellPad;
      const drawW = s.w;
      const drawH = s.h;

      const centerX = cellX + cellW / 2;
      const centerY = areaY + areaHpx / 2;
      const drawX = centerX / GameConstants.TILESIZE - drawW / 2;
      const drawY = centerY / GameConstants.TILESIZE - drawH / 2;

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

      this.drawEffectsPreview(s, { xBase, yBase, drawW, drawH }, "front");

      if (s.hp !== undefined && s.maxHp !== undefined && s.maxHp > 1) {
        const hbX = xBase + (drawW - 1) / 2;
        const hbY = yBase + 1;
        HealthBar.drawStatic({
          hearts: s.hp,
          maxHearts: s.maxHp,
          x: hbX,
          y: hbY,
          flashing: true,
        });
      }

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
            HitWarning.drawPreviewArrow({ targetX: tx2, targetY: ty2, dir, variant: "red", alpha });
          }
          if (show.whiteArrow) {
            HitWarning.drawPreviewArrow({ targetX: tx2, targetY: ty2, dir, variant: "white", alpha });
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

    const baseY = args.yBase + (args.drawH - 1);
    const baseX =
      sprite.hitWarningsWide && args.drawW > 1
        ? args.xBase
        : args.xBase + (args.drawW - 1) / 2;

    for (const fx of effects) {
      if (fx.kind === "wizardFireball") {
        const tileY =
          fx.variant === "energy" ? 7 : fx.variant === "fire" ? 8 : 10;

        const stateYOffset = fx.state === 2 ? -1 : fx.state === 1 ? -0.2 : 0;

        const offsets = fx.offsets
          .filter((o) => {
            const yDraw = o.y + stateYOffset;
            return layer === "behind" ? yDraw < 0 : yDraw >= 0;
          })
          .slice()
          .sort((a, b) => a.y - b.y);

        for (const o of offsets) {
          const x = baseX + o.x;
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
      } else if (fx.kind === "bigWizardFireball") {
        const stateYOffset = fx.state === 2 ? -2 : 0;

        const offsets = fx.offsets
          .filter((o) => {
            const yDraw = o.y + stateYOffset;
            return layer === "behind" ? yDraw < 0 : yDraw >= 0;
          })
          .slice()
          .sort((a, b) => a.y - b.y);

        for (const o of offsets) {
          const x = baseX + o.x;
          const y = baseY + o.y + 0.5;

          if (fx.state === 0) {
            const frame = Math.floor(this.previewAnimT * 0.25) % 4;
            Game.drawFX(19 + frame * 2, 18, 2, 2, x, y, 2, 2);
          } else if (fx.state === 1) {
            const frame = Math.floor(this.previewAnimT * 0.25) % 4;
            Game.drawFX(11 + frame * 2, 18, 2, 2, x, y, 2, 2);
          } else {
            const frame = Math.floor(this.previewAnimT * 0.3) % 18;
            Game.drawFX(frame * 2, 56, 2, 4, x, y - 2, 2, 4);
          }
        }
      }
    }
  };

  private advanceSpriteState = (dir: -1 | 1): void => {
    const entry = this.entries[this.currentPage];
    const count = entry?.sprites?.length ?? 0;
    if (count <= 1) return;
    this.activeSpriteStateIndex =
      (((this.activeSpriteStateIndex + dir) % count) + count) % count;
  };

  private drawStateCycleButton = (
    theme: BookTheme,
    entry: BestiaryEntry,
    spriteRect: { x: number; y: number; w: number; h: number },
  ): void => {
    const count = entry.sprites?.length ?? 0;
    const shouldShow = this.manualStateCycling && count > 1;
    if (!shouldShow) {
      this.prevStateRect = null;
      this.nextStateRect = null;
      return;
    }

    const arrowW = 22;
    const arrowH = 12;
    const gap = 14;

    const centerX = spriteRect.x + spriteRect.w / 2;
    const totalW = arrowW * 2 + gap;
    const leftX = Math.round(centerX - totalW / 2);
    const rightX = leftX + arrowW + gap;
    const y = Math.round(spriteRect.y + spriteRect.h - arrowH - 6);

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
    return HitWarning.computePointerDir({ targetX, targetY, sourceX, sourceY });
  };
}
