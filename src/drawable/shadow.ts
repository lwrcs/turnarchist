import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";

export class Shadow {
  // Shared offscreen resources for shadow rendering
  private static _canvas?: HTMLCanvasElement;
  private static _ctx?: CanvasRenderingContext2D;
  private static _blurRenderer?: any;

  /**
   * Draw a soft blurred shadow at the given tile-space coordinates.
   * - x, y: world coordinates in tiles (e.g., entity.x - entity.drawX)
   * - width, height: footprint size in tiles; default 1x1. Larger values scale the shadow ellipse.
   * - radiusPx: optional blur radius in pixels; defaults to current behavior (~3px).
   */
  static draw(x: number, y: number, width: number = 1, height: number = 1) {
    const tileSize = GameConstants.TILESIZE;
    Game.ctx.globalAlpha = 0.5;
    if (width > 1 || height > 1) {
      Game.drawFX(30, 3, 2, 2, x, y + 0.5, 2, 2, "black");
    } else {
      Game.drawFX(30, 1, 2, 2, x - 0.5, y - 0.5, 2, 2, "black");
    }
    Game.ctx.globalAlpha = 1;
  }
}
