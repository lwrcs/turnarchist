import { Direction, Game } from "../game";
import { GameConstants } from "../gameConstants";
import { Particle } from "./particle";

export class AttackAnimation extends Particle {
  tileX: number;
  tileY: number;
  tileYOffset: number;
  x: number;
  y: number;
  frame: number;
  type: string;
  direction: Direction;
  frames: number;
  yOffset: number;
  xOffset: number;

  constructor(x: number, y: number, type: string, direction: Direction) {
    super();
    this.x = x;
    this.y = y - 0.25;
    this.dead = false;
    this.frame = 0;
    this.type = type;
    this.xOffset = 0;
    this.yOffset = 0;
    switch (type) {
      case "dagger":
        this.frames = 10;
        break;
      case "warhammer":
        this.frames = 11;
        this.tileX = 12;
        this.tileY = 32;
        this.yOffset = -0.75;
        this.xOffset = -0.1;
        break;
    }
    switch (direction) {
      case Direction.DOWN:
        this.tileYOffset = 0;
        break;
      case Direction.UP:
        this.tileYOffset = 2;
        break;
      case Direction.LEFT:
        this.tileYOffset = 2;
        break;
      case Direction.RIGHT:
        this.tileYOffset = 3;
        break;
    }
  }

  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    Game.drawFX(
      this.tileX + 2 * Math.round(this.frame / 2),
      this.tileY + this.tileYOffset,
      2,
      2,
      this.x - 0.5 + this.xOffset,
      this.y - 0.5 + this.yOffset,
      2,
      2,
    );

    this.frame += 1.5 * delta;
    if (this.frame > this.frames) this.dead = true;
  };
}
