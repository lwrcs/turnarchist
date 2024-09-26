import { Game } from "./game";
import { GameConstants } from "./gameConstants";

export class PostProcessor {
  static draw = (delta: number) => {
    Game.ctx.globalAlpha = 0.15;
    Game.ctx.fillStyle = "#006A6E"
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.globalCompositeOperation = "screen";
  };
}