import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Room } from "../room/room";
import { Random } from "../utility/random";
import { Particle } from "./particle";

export class XPPopup extends Particle {
  room: Room;
  xp: number;
  x: number;
  y: number;
  alpha: number = 0.25;
  color: string;
  outlineColor: string;
  frame: number = 0;
  xoffset: number = 0;
  constructor(room: Room, x: number, y: number, xp: number) {
    super();
    this.room = room;
    this.xp = xp;
    this.x = x;
    this.y = y;
    this.color = "yellow";
    this.outlineColor = GameConstants.OUTLINE;
    this.xoffset = 0;
  }
  getXoffset = () => {
    if (this.room.particles.length > 0) {
      let damageNumbers = this.room.particles.filter(
        (p) => p instanceof XPPopup,
      );
      if (damageNumbers.length % 3 === 0) return 0.5;
      if (damageNumbers.length % 3 === 1) return 0;
      if (damageNumbers.length % 3 === 2) return 0.25;
    }
  };

  drawTopLayer = (delta: number) => {
    Game.ctx.save();

    if (this.dead) {
      Game.ctx.restore();
      return;
    }
    if (this.frame > 15) this.alpha -= 0.005 * delta;

    this.y -= 0.03 * delta;
    this.frame += delta;
    let width = Game.measureText(this.xp.toString()).width;
    if (this.alpha <= 0.002) {
      this.alpha = 0;
      this.dead = true;
    }
    Game.ctx.globalAlpha = this.alpha;
    const centerX = Game.measureText(`+${this.xp}xp`).width / 2;
    Game.ctx.fillStyle = this.color;
    Game.fillText(
      `+${this.xp} xp`,
      (this.x + 0.4 + this.xoffset) * GameConstants.TILESIZE - centerX,
      (this.y - 0.75) * GameConstants.TILESIZE,
    );

    Game.ctx.globalAlpha = 1;

    Game.ctx.restore();
  };
}
