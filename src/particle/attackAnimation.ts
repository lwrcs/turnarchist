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
  animationSpeed: number;

  constructor(x: number, y: number, type: string, direction: Direction) {
    super();
    this.x = x;
    this.y = y - 0.25;
    this.dead = false;
    this.frame = 0;
    this.type = type;
    this.xOffset = 0;
    this.yOffset = 0;
    this.tileX = 12;

    this.animationSpeed = 1;
    switch (type) {
      case "dagger":
        this.frames = 8;
        this.tileY = 24;
        this.yOffset = 0;
        this.xOffset = 0;

        switch (direction) {
          case Direction.DOWN:
            this.yOffset -= 0.75;
            break;
          case Direction.UP:
            this.yOffset += 0.5;
            break;
          case Direction.LEFT:
            this.xOffset += 0.8;
            this.yOffset += 0.25;
            break;
          case Direction.RIGHT:
            this.xOffset -= 0.8;
            this.yOffset -= 0.25;
            break;
        }

        break;
      case "warhammer":
        this.frames = 8;
        this.tileX = 12;
        this.tileY = 32;
        this.yOffset = -0.75;
        this.xOffset = -0;
        this.frame = -5;
        this.animationSpeed = 2;

        switch (direction) {
          case Direction.DOWN:
            this.yOffset -= 0.25;
            this.xOffset += 0.125;
            break;
          case Direction.UP:
            this.yOffset += 1;
            this.xOffset += 0.25;
            break;
          case Direction.LEFT:
            this.xOffset += 0.75;
            this.yOffset += 0.5;
            break;
          case Direction.RIGHT:
            this.xOffset -= 0.75;
            this.yOffset += 0.5;
            break;
        }
        break;

      case "dualdagger":
        this.frames = 8;
        this.tileY = 40;
        this.yOffset = 0;
        this.xOffset = 0;

        switch (direction) {
          case Direction.DOWN:
            this.yOffset -= 1;
            break;
          case Direction.UP:
            this.yOffset += 0.5;
            break;
          case Direction.LEFT:
            this.xOffset += 0.8;
            this.yOffset -= 0.25;
            break;
          case Direction.RIGHT:
            this.xOffset -= 0.8;
            this.yOffset -= 0.25;
            break;
        }
        break;

      case "dualdagger2":
        this.frames = 8;
        this.tileY = 48;
        this.yOffset = 0;
        this.xOffset = 0;
        //this.animationSpeed = 1;

        switch (direction) {
          case Direction.DOWN:
            this.yOffset -= 1;
            break;
          case Direction.UP:
            this.yOffset += 0.5;
            break;
          case Direction.LEFT:
            this.xOffset += 0.8;
            this.yOffset -= 0.25;
            break;
          case Direction.RIGHT:
            this.xOffset -= 0.8;
            this.yOffset -= 0.25;
            break;
        }
        break;

      case "spear":
        this.frames = 5;
        this.tileY = 32;
        this.tileX = 22;
        this.animationSpeed = 0.5;

        switch (direction) {
          case Direction.DOWN:
            this.yOffset -= 0.75;
            this.xOffset += 0.125;

            break;
          case Direction.UP:
            //needs to draw behind player but its fine for now
            this.yOffset += 1;
            this.xOffset -= 0.125;

            break;
          case Direction.LEFT:
            this.xOffset += 1;
            this.yOffset += 0.25;

            break;
          case Direction.RIGHT:
            this.xOffset -= 1;
            this.yOffset += 0.25;

            break;
        }
    }
    switch (direction) {
      case Direction.DOWN:
        this.tileYOffset = 0;
        break;
      case Direction.UP:
        this.tileYOffset = 2;
        break;
      case Direction.LEFT:
        this.tileYOffset = 4;
        break;
      case Direction.RIGHT:
        this.tileYOffset = 6;
        break;
    }
  }

  drawTopLayer = (delta: number) => {
    // if (this.frame <= this.frames / 2)
    this.drawAnimation(delta);
  };

  drawAnimation = (delta: number) => {
    if (this.dead) return;
    if (this.frame >= 0) {
      Game.drawFX(
        this.tileX + 2 * Math.round(Math.max(0, this.frame) / 2),
        this.tileY + this.tileYOffset,
        2,
        2,
        this.x - 0.5 + this.xOffset,
        this.y - 0.5 + this.yOffset,
        2,
        2,
      );
    }

    this.frame += this.animationSpeed * delta;
    if (this.frame > this.frames) this.dead = true;
  };
}
