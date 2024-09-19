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
  NorthWest
}

export class HitPointer extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  static frame = 0;
  game: Game;
  entity: Entity;
  dir: Direction;
  tileX: number;
  tileY: number;
  entityX: number;
  entityY: number;

  constructor(game: Game, x: number, y: number, entity: Entity) {
    super();
    this.x = x;
    this.y = y;
    this.dead = false;
    this.game = game;
    this.dir = Direction.North;
    this.tileX = 18;
    this.tileY = 6;
  }

  tick = () => {
    this.dead = true;
  };

  static updateFrame = (delta: number) => {
    HitPointer.frame += 0.125 * delta;
    if (HitPointer.frame >= 4) HitPointer.frame = 0;
  };

  setPointerDir = () => {
    if (!this.entity) return;
    const dx = this.entity.x - this.x;
    const dy = this.entity.y - this.y;
    
    if (dx === 0 && dy === 0) return; // Same position, no direction
  
    // Determine direction based on dx and dy
    if (dx === 0) {
      this.dir = dy > 0 ? Direction.South : Direction.North;
    } else if (dy === 0) {
      this.dir = dx > 0 ? Direction.East : Direction.West;
    } else if (dx > 0) {
      this.dir = dy > 0 ? Direction.SouthEast : Direction.NorthEast;
    } else {
      this.dir = dy > 0 ? Direction.SouthWest : Direction.NorthWest;
    }
    this.tileX = 22 + this.dir;
    console.log(this.tileX)
    console.log(this.dir)
  };

  draw = (delta: number) => {
    this.setPointerDir()
    if (
      (this.x === this.game.players[this.game.localPlayerID].x && Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1) ||
      (this.y === this.game.players[this.game.localPlayerID].y && Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1)
    )
      Game.drawFX(this.tileX + Math.floor(HitPointer.frame), this.tileY, 1, 1, this.x, this.y, 1, 1);
  };

  drawTopLayer = (delta: number) => {
    this.setPointerDir()
    this.drawableY = this.y;
    if (
      (this.x === this.game.players[this.game.localPlayerID].x && Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1) ||
      (this.y === this.game.players[this.game.localPlayerID].y && Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1)
    )
      Game.drawFX(this.tileX + Math.floor(HitPointer.frame), this.tileY - 1, 1, 1, this.x, this.y, 1, 1);
  };
}
