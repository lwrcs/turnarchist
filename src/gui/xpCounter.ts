import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Menu } from "./menu";

export class XPCounter {
  static getRect(): { x: number; y: number; w: number; h: number } {
    const tile = GameConstants.TILESIZE;
    const menu = Menu.getOpenMenuButtonRect();
    const x = menu.x;
    // Mirror `Menu.drawOpenMenuButton()` placement, but one tile lower.
    // This makes the hit area match the icon+label style of the Menu button.
    const y = menu.y + tile - 6;
    const w = menu.w;
    const h = tile;
    return { x, y, w, h };
  }

  static isPointInBounds(x: number, y: number): boolean {
    const r = XPCounter.getRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  static draw(delta: number) {
    // draw the skills button (formerly XP counter)
    const r = XPCounter.getRect();
    const tile = GameConstants.TILESIZE;
    const menu = Menu.getOpenMenuButtonRect();

    Game.ctx.save();

    Game.ctx.fillStyle = "rgba(255, 255, 0, 1)";
    // Match Menu button opacity and style (text-only, no background).
    Game.ctx.globalAlpha = 0.1;

    // Skills icon: same as menu icon, but tile is directly below on fxset (tileY + 1).
    // Draw position is also one tile below the menu icon.
    const iconX = 0;
    const iconY = r.y / tile; // keep icon aligned with the Skills button's pixel Y (supports small offsets)
    Game.drawFX(18, 1, 1, 1, iconX, iconY, 1, 1);

    // Label aligned like Menu label (Menu uses y=10).
    Game.fillText("Skills", 10, 10 + tile - 6);
    Game.ctx.restore();
  }
}
