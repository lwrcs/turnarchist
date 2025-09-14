import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Sound } from "../sound/sound";

export class MuteButton {
  static draw() {
    const tile = GameConstants.TILESIZE;
    Game.ctx.save();
    Game.ctx.globalAlpha = 0.1;
    if (Sound.audioMuted) {
      Game.drawFX(17, 0, 1, 1, 0, 0.5, 1, 1);
    } else {
      Game.drawFX(16, 0, 1, 1, 0, 0.5, 1, 1);
    }
    Game.ctx.restore();
  }

  static toggleMute() {
    Sound.toggleMute();
  }
}
