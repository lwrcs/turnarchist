import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { LevelConstants } from "../level/levelConstants";

export class HealthBar {
  hurtTimer: number;
  shouldDraw: boolean;

  constructor() {
    this.hurtTimer = 0;
  }

  hurt = () => {
    this.hurtTimer = Date.now();
  };

  draw = (
    delta: number,
    hearts: number,
    maxHearts: number,
    x: number,
    y: number,
    flashing: boolean,
    opts?: {
      mana?: { current: number; max: number };
    },
  ) => {
    let t = Math.min(
      LevelConstants.HEALTH_BAR_TOTALTIME,
      Math.max(Date.now() - this.hurtTimer, 0),
    );
    if (t <= LevelConstants.HEALTH_BAR_TOTALTIME) {
      let fullHearts = Math.floor(hearts);

      let halfHearts = Math.ceil(hearts - fullHearts);

      let emptyHearts = maxHearts - fullHearts - halfHearts;

      // I wouldn't normally use magic numbers here, but these are hardcoded based on the tileset
      //   (which isn't really parameterizable)
      let drawWidth = Math.round(
        Math.min(
          9,
          Math.min(0.05 * (LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.05 * t),
        ),
      );
      let drawHeight =
        Math.round(
          Math.min(
            0.5,
            Math.min(
              0.003 * (LevelConstants.HEALTH_BAR_TOTALTIME - t),
              0.003 * t,
            ),
          ) * 16,
        ) / 16.0;
      let width = (drawWidth * (maxHearts - 1) + 8) / 16.0;
      let xxStart = 0.5 + -width / 2;
      for (let i = 0; i < Math.ceil(0.5 * maxHearts); i++) {
        let tileX = 0;
        if (!flashing) tileX = 1.5;
        else if (i < fullHearts) tileX = 0;
        else if (i < fullHearts + halfHearts) tileX = 0.5;
        else tileX = 1;
        let xx = (drawWidth * i) / 16.0 + xxStart;
        Game.drawFX(
          tileX,
          8,
          0.5,
          0.5,
          x + xx,
          y - 1 - drawHeight / 2,
          0.5,
          drawHeight,
        );
        xx += 9.0 / 16.0;

        let j = maxHearts - i - 1;
        if (j !== i) {
          let tileX = 0;
          if (!flashing) tileX = 1.5;
          else if (j < fullHearts) tileX = 0;
          else if (j < fullHearts + halfHearts) tileX = 0.5;
          else tileX = 1;
          let xx = (drawWidth * j) / 16.0 + xxStart;
          Game.drawFX(
            tileX,
            8,
            0.5,
            0.5,
            x + xx,
            y - 1 - drawHeight / 2,
            0.5,
            drawHeight,
          );
          xx += 9.0 / 16.0;
        }
      }

      // Optional mana orb (player-only): draw above the heart bar.
      const mana = opts?.mana;
      if (
        mana &&
        typeof mana.current === "number" &&
        typeof mana.max === "number" &&
        Number.isFinite(mana.current) &&
        Number.isFinite(mana.max) &&
        mana.max > 0
      ) {
        const pct = Math.max(0, Math.min(1, mana.current / mana.max));
        this.drawManaOrb({
          centerTileX: x + 0.5,
          centerTileY: y - 1 - drawHeight / 2 - 0.75,
          percent01: pct,
          manaValue: Math.max(0, Math.floor(mana.current)),
        });
      }
    }
  };

  private drawManaOrb = (args: {
    centerTileX: number;
    centerTileY: number;
    percent01: number;
    manaValue: number;
  }): void => {
    const color = "#2aa8ff";
    const sizePx = 12; // pixel-art orb size
    const r = Math.floor(sizePx / 2); // radius in px
    const cx = Math.round(args.centerTileX * GameConstants.TILESIZE);
    const cy = Math.round(args.centerTileY * GameConstants.TILESIZE);
    const x0 = cx - r;
    const y0 = cy - r;

    const prevSmoothing = Game.ctx.imageSmoothingEnabled;
    Game.ctx.imageSmoothingEnabled = false;
    Game.ctx.save();

    // Fill rows from bottom to top, row-by-row.
    const innerR = Math.max(0, r - 1);
    const filledRows = Math.floor(sizePx * Math.max(0, Math.min(1, args.percent01)));
    const fillStartY = y0 + (sizePx - filledRows);

    for (let py = 0; py < sizePx; py++) {
      for (let px = 0; px < sizePx; px++) {
        const gx = x0 + px;
        const gy = y0 + py;
        const dx = px - (r - 0.5);
        const dy = py - (r - 0.5);
        const d2 = dx * dx + dy * dy;

        const inOuter = d2 <= r * r;
        if (!inOuter) continue;

        const inInner = d2 <= innerR * innerR;
        const isOutline = !inInner;

        if (isOutline) {
          Game.ctx.fillStyle = color;
          Game.ctx.fillRect(gx, gy, 1, 1);
          continue;
        }

        // Inner pixel: only draw if this row is "filled".
        if (gy >= fillStartY) {
          Game.ctx.fillStyle = color;
          Game.ctx.fillRect(gx, gy, 1, 1);
        }
      }
    }

    // Mana number (overlapping bottom-right, like the coin counter style).
    const text = `${args.manaValue}`;
    Game.fillTextOutline(
      text,
      x0 + sizePx - 1, // slightly overlapping orb
      y0 + sizePx + 2,
      GameConstants.OUTLINE,
      color,
    );

    Game.ctx.restore();
    Game.ctx.imageSmoothingEnabled = prevSmoothing;
  };

  /**
   * UI/static draw: renders the same heart bar visuals as `draw()`, but without
   * the hurt-timer animation gating. Intended for previews (e.g. Bestiary).
   *
   * Coordinates are in tile units (same as `draw()`).
   */
  static drawStatic = (args: {
    hearts: number;
    maxHearts: number;
    x: number;
    y: number;
    flashing?: boolean;
    alpha?: number;
  }) => {
    const hearts = args.hearts;
    const maxHearts = args.maxHearts;
    if (maxHearts <= 0) return;

    const fullHearts = Math.floor(hearts);
    const halfHearts = Math.ceil(hearts - fullHearts);

    // Match the "fully expanded" look of the in-game bar.
    const drawWidth = 9;
    const drawHeight = 0.5;
    const width = (drawWidth * (maxHearts - 1) + 8) / 16.0;
    const xxStart = 0.5 + -width / 2;

    const flashing = args.flashing ?? true;

    Game.ctx.save();
    if (args.alpha !== undefined) Game.ctx.globalAlpha = args.alpha;

    for (let i = 0; i < Math.ceil(0.5 * maxHearts); i++) {
      let tileX = 0;
      if (!flashing) tileX = 1.5;
      else if (i < fullHearts) tileX = 0;
      else if (i < fullHearts + halfHearts) tileX = 0.5;
      else tileX = 1;
      const xx = (drawWidth * i) / 16.0 + xxStart;
      Game.drawFX(
        tileX,
        8,
        0.5,
        0.5,
        args.x + xx,
        args.y - 1 - drawHeight / 2,
        0.5,
        drawHeight,
      );

      const j = maxHearts - i - 1;
      if (j !== i) {
        let tileX = 0;
        if (!flashing) tileX = 1.5;
        else if (j < fullHearts) tileX = 0;
        else if (j < fullHearts + halfHearts) tileX = 0.5;
        else tileX = 1;
        const xx = (drawWidth * j) / 16.0 + xxStart;
        Game.drawFX(
          tileX,
          8,
          0.5,
          0.5,
          args.x + xx,
          args.y - 1 - drawHeight / 2,
          0.5,
          drawHeight,
        );
      }
    }

    Game.ctx.restore();
  };
}
