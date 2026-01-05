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
    }
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
