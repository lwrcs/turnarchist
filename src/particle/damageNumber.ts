import { Game } from "../game";
import { GameConstants } from "../gameConstants";
import { Room } from "../room";
import { Particle } from "./particle";

export class DamageNumber extends Particle {
  room: Room;
  damage: number;
  x: number;
  y: number;
  alpha: number = 1;
  color: string;
  outlineColor: string;
  frame: number = 0;
  xoffset: number = 0;
  constructor(
    room: Room,
    x: number,
    y: number,
    damage: number,
    color?: string,
    outlineColor?: string,
  ) {
    super();
    this.room = room;
    this.damage = damage;
    this.x = x;
    this.y = y;
    if (color) this.color = color;
    else this.color = "red";
    if (outlineColor) this.outlineColor = outlineColor;
    else this.outlineColor = GameConstants.OUTLINE;
    this.xoffset = Math.random() * 0.2;
  }
  getXoffset = () => {
    if (this.room.particles.length > 0) {
      let damageNumbers = this.room.particles.filter(
        (p) => p instanceof DamageNumber,
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
    if (this.frame > 15) this.alpha *= 0.95;

    this.y -= 0.03 * delta;
    this.frame += delta;
    let width = Game.measureText(this.damage.toString()).width;
    if (this.alpha <= 0.002) {
      this.alpha = 0;
      this.dead = true;
    }
    Game.ctx.globalAlpha = this.alpha;

    Game.fillTextOutline(
      this.damage.toString(),
      (this.x + 0.4 + this.xoffset) * GameConstants.TILESIZE - width / 2,
      (this.y - 0.6) * GameConstants.TILESIZE,
      this.outlineColor,
      this.color,
    );

    Game.ctx.globalAlpha = 1;

    Game.ctx.restore();
  };
}
