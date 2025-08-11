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
  static draw(
    x: number,
    y: number,
    width: number = 1,
    height: number = 1,
    radiusPx?: number,
  ) {
    const tileSize = GameConstants.TILESIZE;
    const blurRadius = radiusPx ?? 3; // default matches prior behavior

    // Lazily create shared offscreen canvas
    if (!Shadow._canvas) {
      Shadow._canvas = document.createElement("canvas");
      Shadow._ctx = Shadow._canvas.getContext("2d");
    }
    const canvas = Shadow._canvas as HTMLCanvasElement;
    const ctx = Shadow._ctx as CanvasRenderingContext2D;

    // Pad for blur falloff; scale slightly with tile size
    const pad = Math.floor(tileSize * 0.25);

    // Size offscreen buffer to the entity footprint so the ellipse can scale
    const offW = Math.max(1, Math.ceil(width * tileSize)) + pad * 2;
    const offH = Math.max(1, Math.ceil(height * tileSize)) + pad * 2;
    if (canvas.width !== offW || canvas.height !== offH) {
      canvas.width = offW;
      canvas.height = offH;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Draw ellipse centered under the footprint; scale radii with width/height
    const cx = Math.floor(canvas.width / 2);
    const cy =
      Math.floor(canvas.height / 2) + Math.floor(tileSize * 0.15 * height);
    const rx = tileSize * 0.35 * width;
    const ry = tileSize * 0.2 * height;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Compute on-screen position (top-left of the footprint) in pixels
    const screenX = Math.round(x * tileSize) - pad;
    const screenY = Math.round((y - 0.25) * tileSize) - pad;

    // Composite below sprites with multiply
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "multiply";
    Game.ctx.globalAlpha = 1;

    if (GameConstants.USE_WEBGL_BLUR) {
      try {
        const { WebGLBlurRenderer } = require("../gui/webglBlurRenderer");
        if (!Shadow._blurRenderer) {
          Shadow._blurRenderer = new WebGLBlurRenderer(
            Game.ctx.canvas as HTMLCanvasElement,
          );
        }
        const renderer = Shadow._blurRenderer as any;
        const blurred = renderer.blur(canvas, blurRadius, 1);
        Game.ctx.drawImage(blurred, screenX, screenY);
      } catch {
        if (GameConstants.ctxBlurEnabled)
          Game.ctx.filter = `blur(${blurRadius}px)`;
        Game.ctx.drawImage(canvas, screenX, screenY);
        Game.ctx.filter = "none";
      }
    } else {
      if (GameConstants.ctxBlurEnabled)
        Game.ctx.filter = `blur(${blurRadius}px)`;
      Game.ctx.drawImage(canvas, screenX, screenY);
      Game.ctx.filter = "none";
    }

    Game.ctx.restore();
  }
}
