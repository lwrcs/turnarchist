import { Game } from "../game";
import { Drawable } from "./drawable";
import { Room } from "../room/room";
import { Entity } from "../entity/entity";
import { Utils } from "../utility/utils";

export enum HitWarningDirection {
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
  private _pointerDir: HitWarningDirection | null = null;
  private _pointerOffset: { x: number; y: number } | null = null;
  private tileX: number;
  private tileY: number;
  private eX: number;
  private eY: number;
  private offsetY: number;
  private pointerOffset: { x: number; y: number };
  private isEnemy: Boolean;
  private dirOnly: Boolean;
  private alpha: number = 0;
  private ticks: number;
  private tickedForDeath = false;

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
    if (this.tickedForDeath) this.dead = true;
    this.tickedForDeath = true;
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

  getPointerDir(): HitWarningDirection {
    if (this._pointerDir === null) {
      const dx = this.eX - this.x;
      const dy = this.eY - this.y;

      if (dx === 0 && dy === 0) {
        this._pointerDir = HitWarningDirection.Center;
      } else if (dx === 0) {
        this._pointerDir =
          dy < 0 ? HitWarningDirection.South : HitWarningDirection.North;
      } else if (dy === 0) {
        this._pointerDir =
          dx < 0 ? HitWarningDirection.East : HitWarningDirection.West;
      } else if (dx < 0) {
        this._pointerDir =
          dy < 0
            ? HitWarningDirection.SouthEast
            : HitWarningDirection.NorthEast;
      } else {
        this._pointerDir =
          dy < 0
            ? HitWarningDirection.SouthWest
            : HitWarningDirection.NorthWest;
      }

      this.tileX = 0 + 2 * this._pointerDir;
    }
    return this._pointerDir;
  }

  private getPointerOffset(): { x: number; y: number } {
    if (this._pointerOffset === null) {
      const offsets = {
        [HitWarningDirection.North]: { x: 0, y: 0.5 },
        [HitWarningDirection.South]: { x: 0, y: -0.6 },
        [HitWarningDirection.West]: { x: 0.6, y: 0 },
        [HitWarningDirection.East]: { x: -0.6, y: 0 },
        [HitWarningDirection.NorthEast]: { x: -0.5, y: 0.5 },
        [HitWarningDirection.NorthWest]: { x: 0.5, y: 0.5 },
        [HitWarningDirection.SouthEast]: { x: -0.5, y: -0.5 },
        [HitWarningDirection.SouthWest]: { x: 0.5, y: -0.5 },
        [HitWarningDirection.Center]: { x: 0, y: -0.25 },
      };

      this._pointerOffset = offsets[this.getPointerDir()];
    }
    return this._pointerOffset;
  }

  fadeHitwarnings = (delta: number) => {
    if (!this.tickedForDeath) {
      if (this.alpha < 1) this.alpha += 0.03 * delta;
      if (this.alpha > 1) this.alpha = 1;
    } else {
      if (this.alpha > 0) this.alpha -= 0.03 * delta;
      if (this.alpha < 0) this.alpha = 0;
    }
  };

  draw = (delta: number) => {
    this.fadeHitwarnings(delta);
    if (
      Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1 &&
      Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1
    ) {
      Game.ctx.globalAlpha = this.alpha;
      if (
        this.isEnemy &&
        Utils.distance(
          this.x,
          this.y,
          this.game.players[this.game.localPlayerID].x,
          this.game.players[this.game.localPlayerID].y,
        ) <= 1
      ) {
        // Red Arrow that only renders one square away

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
      if (false) {
        // removed for now because unneeded and overlaps poorly with top layer x
        // Red X that only renders one square away
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
      Game.ctx.globalAlpha = 1;
    }
  };

  drawTopLayer = (delta: number) => {
    this.fadeHitwarnings(delta);

    Game.ctx.globalAlpha = this.alpha;

    if (this.isEnemy && this.getPointerDir() !== HitWarningDirection.North) {
      //white arrow top layer
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
      Utils.distance(
        this.x,
        this.y,
        this.game.players[this.game.localPlayerID].x,
        this.game.players[this.game.localPlayerID].y,
      ) <= 1
    ) {
      if (!this.dirOnly) {
        // Red X that renders 1 square away for top layer
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
    Game.ctx.globalAlpha = 1;
  };
}
