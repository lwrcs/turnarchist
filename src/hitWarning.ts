import { Game } from "./game";
import { Drawable } from "./drawable";
import { Room } from "./room";
import { Entity } from "./entity/entity";

enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Center,
}

export class HitWarning extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  static frame = 0;
  game: Game;
  entity: Entity;
  dir: Direction;
  tileX: number;
  tileY: number;
  eX: number;
  eY: number;
  offsetY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  animLength: number;
  isEnemy: Boolean;
  dirOnly: Boolean;

  constructor(
    game: Game,
    x: number,
    y: number,
    eX?: number,
    eY?: number,
    isEnemy?: Boolean,
    dirOnly: Boolean = false
  ) {
    super();
    this.x = x;
    this.y = y;
    this.dead = false;
    this.game = game;
    this.dir = Direction.North;
    this.tileX = 0;
    this.tileY = 22;
    this.eX = eX;
    this.eY = eY;
    this.offsetY = 0.2;
    this.pointerOffsetX = 0;
    this.pointerOffsetY = 0;
    this.isEnemy = isEnemy !== undefined ? isEnemy : true;
    const { dir, tileX } = HitWarning.setPointerDir(x, y, eX, eY);
    this.tileX = tileX;
    const pointerOffset = HitWarning.setPointerOffset(dir);
    this.pointerOffsetX = pointerOffset.x;
    this.pointerOffsetY = pointerOffset.y;
    this.removeOverlapping();
    this.dirOnly = dirOnly;
  }

  tick = () => {
    this.dead = true;
  };

  static updateFrame = (delta: number) => {
    HitWarning.frame += 0.125 * delta;
    if (HitWarning.frame >= 2) HitWarning.frame = 0;
  };

  removeOverlapping = () => {
    for (const entity of this.game.room.entities) {
      if (entity.x === this.x && entity.y === this.y) {
        this.dead = true;
        break;
      }
    }
    /*for (const door of this.game.room.doors) {
      if (door.x === this.x && door.y === this.y) {
        this.dead = true;
        break;
      }
    }*/
  };

  static setPointerDir = (x: number, y: number, eX: number, eY: number) => {
    const dx = eX - x;
    const dy = eY - y;

    let dir: Direction;
    let tileX: number;

    if (dx === 0 && dy === 0) {
      dir = Direction.Center;
    } else {
      if (dx === 0) {
        dir = dy < 0 ? Direction.South : Direction.North;
      } else if (dy === 0) {
        dir = dx < 0 ? Direction.East : Direction.West;
      } else if (dx < 0) {
        dir = dy < 0 ? Direction.SouthEast : Direction.NorthEast;
      } else {
        dir = dy < 0 ? Direction.SouthWest : Direction.NorthWest;
      }

      tileX = 0 + 2 * dir;
      return { dir, tileX };
    }
  };

  static setPointerOffset = (dir: Direction) => {
    const offsets = {
      [Direction.North]: { x: 0, y: 0.5 },
      [Direction.South]: { x: 0, y: -0.6 },
      [Direction.West]: { x: 0.6, y: 0 },
      [Direction.East]: { x: -0.6, y: 0 },
      [Direction.NorthEast]: { x: -0.5, y: 0.5 },
      [Direction.NorthWest]: { x: 0.5, y: 0.5 },
      [Direction.SouthEast]: { x: -0.5, y: -0.5 },
      [Direction.SouthWest]: { x: 0.5, y: -0.5 },
      [Direction.Center]: { x: 0, y: -0.25 },
    };

    const offset = offsets[dir];
    return offset;
  };

  draw = (delta: number) => {
    if (
      Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1 &&
      Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1
    ) {
      if (this.isEnemy) {
        Game.drawFX(
          this.tileX + Math.floor(HitWarning.frame),
          this.tileY,
          1,
          1,
          this.x + this.pointerOffsetX,
          this.y + this.pointerOffsetY - this.offsetY,
          1,
          1
        );
      }
      if (!this.dirOnly) {
        Game.drawFX(
          18 + Math.floor(HitWarning.frame),
          5,
          1,
          1,
          this.x,
          this.y - this.offsetY,
          1,
          1
        );
      }
    }
  };

  drawTopLayer = (delta: number) => {
    if (this.isEnemy) {
      Game.drawFX(
        this.tileX + Math.floor(HitWarning.frame),
        this.tileY + 1,
        1,
        1,
        this.x + this.pointerOffsetX,
        this.y + this.pointerOffsetY - this.offsetY,
        1,
        1
      );
    }
    if (
      Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1 &&
      Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1
    ) {
      if (!this.dirOnly) {
        Game.drawFX(
          18 + Math.floor(HitWarning.frame),
          6,
          1,
          1,
          this.x,
          this.y - this.offsetY,
          1,
          1
        );
      }
    }
  };
}
