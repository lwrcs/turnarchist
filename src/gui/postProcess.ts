import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { WaterOverlay } from "./waterOverlay";

interface Settings {
  enabled: boolean;
  globalAlpha: number;
  fillStyle: string;
  globalCompositeOperation: GlobalCompositeOperation;
  underwaterBaseAlpha: number;
  underwaterFillStyle: string;
  underwaterCompositeOperation: GlobalCompositeOperation;
}

export class PostProcessor {
  static settings: Settings = {
    enabled: true,
    globalAlpha: 0.15,
    fillStyle: "#006A6E",
    globalCompositeOperation: "screen",
    underwaterBaseAlpha: 0.1,
    underwaterFillStyle: "#002631",
    underwaterCompositeOperation: "source-over",
  };

  static draw = (
    delta: number,
    underwater: boolean = false,
    cameraOrigin?: { x: number; y: number },
  ) => {
    if (!PostProcessor.settings.enabled) return;
    Game.ctx.save();

    if (underwater) {
      Game.ctx.save();
      PostProcessor.applyUnderwaterLayer();
      WaterOverlay.draw(Game.ctx, delta, cameraOrigin);
      Game.ctx.fillStyle = this.settings.underwaterFillStyle;
      Game.ctx.globalCompositeOperation =
        this.settings.underwaterCompositeOperation;
      Game.ctx.globalAlpha = this.settings.underwaterBaseAlpha;

      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
      this.settings.globalCompositeOperation = "lighten";
      PostProcessor.applyDefaultLayer();
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
      Game.ctx.restore();
      this.settings.globalCompositeOperation = "screen";

      return;
    }

    PostProcessor.applyDefaultLayer();
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.restore();
  };

  private static applyDefaultLayer() {
    Game.ctx.globalAlpha = PostProcessor.settings.globalAlpha;
    Game.ctx.globalCompositeOperation =
      PostProcessor.settings.globalCompositeOperation;
    Game.ctx.fillStyle = PostProcessor.settings.fillStyle;
  }

  private static applyUnderwaterLayer() {
    Game.ctx.globalAlpha = PostProcessor.settings.underwaterBaseAlpha;
    Game.ctx.globalCompositeOperation =
      PostProcessor.settings.underwaterCompositeOperation;
    Game.ctx.fillStyle = PostProcessor.settings.underwaterFillStyle;
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
  }
}
