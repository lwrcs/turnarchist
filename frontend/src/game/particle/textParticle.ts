import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Random } from "../utility/random";
import { Particle } from "./particle";

export class TextParticle extends Particle {
  text: string;
  x: number;
  y: number;
  z: number;
  dz: number;
  time: number;
  color: string;
  dead: boolean;
  delay: number;

  constructor(
    text: string,
    x: number,
    y: number,
    color: string,
    delay?: number,
  ) {
    super();
    this.text = text;
    this.x = x * GameConstants.TILESIZE;
    this.y = y * GameConstants.TILESIZE;
    this.z = GameConstants.TILESIZE;
    this.dz = 1;
    this.color = color;
    this.dead = false;
    this.time = 0;
    if (delay === undefined) this.delay = Game.rand(0, 10, Random.rand);
    // up to a 10 tick delay
    else this.delay = delay;
  }

  draw = (delta: number) => {
    if (this.dead) return;

    if (this.delay > 0) {
      this.delay--;
    } else {
      let GRAVITY = 0.2;
      let TIMEOUT = 1; // lasts for 1 second

      this.z += this.dz;
      if (this.z < 0) {
        this.z = 0;
        this.dz *= -0.6;
      }
      this.dz -= GRAVITY;

      this.time++;
      if (this.time > GameConstants.FPS * TIMEOUT) this.dead = true;

      let width = Game.measureText(this.text).width;

      Game.fillTextOutline(
        this.text,
        this.x - width / 2,
        this.y - this.z,
        GameConstants.OUTLINE,
        this.color,
      );
    }
  };
}
