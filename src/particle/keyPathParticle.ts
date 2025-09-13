import { Utils } from "../utility/utils";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Particle } from "./particle";

export class KeyPathParticle extends Particle {
  x: number;
  y: number;
  frame: number;
  type: string;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y - 0.25;
    this.dead = false;
    this.frame = 0;
  }

  drawTopLayer = (delta: number) => {
    if (this.dead) return;
    const frameOffset = Utils.distance(
      this.x,
      this.y,
      this.room.game.players[this.room.game.localPlayerID].x,
      this.room.game.players[this.room.game.localPlayerID].y,
    );
    this.frame += delta / 10;
    const sinFrame = Math.sin(this.frame + frameOffset) * 1;
    const cosFrame = Math.cos(this.frame + frameOffset) * 1;

    Game.ctx.fillStyle = "#FFFF00";

    Game.ctx.fillRect(
      (this.x + 0.5) * GameConstants.TILESIZE - 1 + Math.round(sinFrame),
      (this.y + 0.5) * GameConstants.TILESIZE - 1 + Math.round(cosFrame),
      2,
      2,
    );
  };
}
