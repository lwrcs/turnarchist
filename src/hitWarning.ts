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
  private game: Game;
  parent: Entity | null = null;
  private _pointerDir: Direction | null = null;
  private _pointerOffset: { x: number; y: number } | null = null;
  private tileX: number;
  private tileY: number;
  private eX: number;
  private eY: number;
  private offsetY: number;
  private pointerOffset: { x: number; y: number };
  private isEnemy: Boolean;
  private dirOnly: Boolean;

  constructor(
    game: Game,
    x: number,
    y: number,
    eX?: number,
    eY?: number,
    isEnemy?: Boolean,
    dirOnly: Boolean = false,
    parent: Entity | null = null,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.dead = false;
    this.game = game;
    this.parent = parent;
    this.tileX = 0;
    this.tileY = 22;
    this.eX = eX;
    this.eY = eY;
    this.offsetY = 0.2;
    this.dirOnly = dirOnly;

    this.isEnemy = isEnemy !== undefined ? isEnemy : true;
    this.pointerOffset = this.getPointerOffset();
    this.removeOverlapping();
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
      if (
        entity.x === this.x &&
        entity.y === this.y &&
        entity.pushable === false
      ) {
        this.dead = true;
        break;
      }
    }
    for (const door of this.game.room.doors) {
      if (door.x === this.x && door.y === this.y) {
        this.dead = true;
        break;
      }
    }
  };

  private getPointerDir(): Direction {
    if (this._pointerDir === null) {
      const dx = this.eX - this.x;
      const dy = this.eY - this.y;

      if (dx === 0 && dy === 0) {
        this._pointerDir = Direction.Center;
      } else if (dx === 0) {
        this._pointerDir = dy < 0 ? Direction.South : Direction.North;
      } else if (dy === 0) {
        this._pointerDir = dx < 0 ? Direction.East : Direction.West;
      } else if (dx < 0) {
        this._pointerDir = dy < 0 ? Direction.SouthEast : Direction.NorthEast;
      } else {
        this._pointerDir = dy < 0 ? Direction.SouthWest : Direction.NorthWest;
      }

      this.tileX = 0 + 2 * this._pointerDir;
    }
    return this._pointerDir;
  }

  private getPointerOffset(): { x: number; y: number } {
    if (this._pointerOffset === null) {
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

      this._pointerOffset = offsets[this.getPointerDir()];
    }
    return this._pointerOffset;
  }

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
          this.x + this.pointerOffset.x,
          this.y + this.pointerOffset.y - this.offsetY,
          1,
          1,
        );
      }
      if (!this.dirOnly) {
        Game.drawFX(
          18 + Math.floor(HitWarning.frame),
          5,
          1,
          1,
          this.x,
          this.y - this.offsetY + 0,
          1,
          1,
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
        this.x + this.pointerOffset.x,
        this.y + this.pointerOffset.y - this.offsetY,
        1,
        1,
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
          this.y - this.offsetY + 0,
          1,
          1,
        );
      }
    }
  };
}
