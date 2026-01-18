import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Menu } from "./menu";

export class XPCounter {
  static getRect(): { x: number; y: number; w: number; h: number } {
    const tile = GameConstants.TILESIZE;
    const menu = Menu.getOpenMenuButtonRect();
    const x = menu.x;
    // Align text with the Menu label above; use text-line spacing instead of tile spacing.
    const y = 10 + (Game.letter_height + 6) - 2;
    const w = menu.w;
    const h = Game.letter_height + 8;
    return { x, y, w, h };
  }

  static isPointInBounds(x: number, y: number): boolean {
    const r = XPCounter.getRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  static draw(delta: number) {
    // draw the skills button (formerly XP counter)
    const r = XPCounter.getRect();

    Game.ctx.save();

    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    // Match Menu button opacity and style (text-only, no background).
    Game.ctx.globalAlpha = 0.1;
    Game.fillText("Skills", 10, r.y + 2);
    Game.ctx.restore();
  }
}
