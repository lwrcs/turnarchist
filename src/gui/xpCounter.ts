import { Game } from "../game";
import { statsTracker } from "../game/stats";

export class XPCounter {
  private xp: number;
  private level: number;

  constructor() {
    this.xp = 0;
    this.level = 1;
  }

  static draw(delta: number) {
    const xp = statsTracker.getXp();
    // draw the xp counter

    Game.ctx.save();

    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    Game.ctx.globalAlpha = 0.1;
    Game.fillText(`XP: ${xp}`, 10, 10);
    Game.ctx.restore();
  }
}
