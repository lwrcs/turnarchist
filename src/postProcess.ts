import { Game } from "./game";
import { GameConstants } from "./gameConstants";

export class PostProcessor {
  static draw = (delta: number) => {
    Game.ctx.globalAlpha = 0.2;
    Game.ctx.globalCompositeOperation = "screen";

    Game.ctx.fillStyle = "#006A6E"; //dark teal
    //Game.ctx.fillStyle = "#003B6F"; //deep underwater blue
    //Game.ctx.fillStyle = "#2F2F2F"; //smoky fog prison

    //Game.ctx.fillStyle = "#4a6c4b"; //darker muddy green
    //Game.ctx.fillStyle = "#800000"; // lighter red for dungeon hell theme

    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.globalCompositeOperation = "source-over";
  };
}
