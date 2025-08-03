import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";

interface Settings {
  enabled: boolean;
  globalAlpha: number;
  fillStyle: string;
  globalCompositeOperation: GlobalCompositeOperation;
}

export class PostProcessor {
  static settings: Settings = {
    enabled: true,
    globalAlpha: 0.15,
    fillStyle: "#006A6E",
    globalCompositeOperation: "screen",
  };

  static underwater: boolean = false;

  static draw = (delta: number) => {
    if (!PostProcessor.settings.enabled) return;
    if (PostProcessor.underwater) {
      PostProcessor.settings.globalAlpha = 0.3;
      PostProcessor.settings.fillStyle = "#003B6F"; //deep underwater blue
      PostProcessor.settings.globalCompositeOperation = "source-over";
    }
    Game.ctx.save();
    Game.ctx.globalAlpha = PostProcessor.settings.globalAlpha;
    Game.ctx.globalCompositeOperation =
      PostProcessor.settings.globalCompositeOperation;
    // GameConstants.SHADE_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation; //"soft-light";

    Game.ctx.fillStyle = PostProcessor.settings.fillStyle;
    //Game.ctx.fillStyle = "#003B6F"; //deep underwater blue
    //Game.ctx.fillStyle = "#2F2F2F"; //smoky fog prison

    //Game.ctx.fillStyle = "#4a6c4b"; //darker muddy green
    //Game.ctx.fillStyle = "#800000"; // lighter red for dungeon hell theme

    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.restore();
  };
}
