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
  Center
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

  constructor(game: Game, x: number, y: number, eX: number, eY: number) {
    super();
    this.x = x;
    this.y = y;
    this.dead = false;
    this.game = game;
    this.dir = Direction.North;
    this.tileX = 0;
    this.tileY = 0;
    this.eX = eX
    this.eY = eY
    this.offsetY = 0;

    this.setPointerDir()


  }

  tick = () => {
    this.dead = true;
  };

  static updateFrame = (delta: number) => {
    HitWarning.frame += 0.125 * delta;
    if (HitWarning.frame >= 4) HitWarning.frame = 0;
  };

  setPointerDir = () => {
    const dx = this.eX - this.x;
    const dy = this.eY - this.y;
    
    if (dx === 0 && dy === 0) {
      this.tileX = 18
      this.tileY = 5
      this.offsetY = 0
    } 
    else 
    {if (dx === 0) {
      this.dir = dy < 0 ? Direction.South : Direction.North;
    } else if (dy === 0) {
      this.dir = dx < 0 ? Direction.East : Direction.West;
    } else if (dx < 0) {
      this.dir = dy < 0 ? Direction.SouthEast : Direction.NorthEast;
    } else {
      this.dir = dy < 0 ? Direction.SouthWest : Direction.NorthWest;
    }
    this.tileX = 0 + (4 * this.dir);
    this.offsetY = 0.4
    console.log(this.tileX)
    console.log(this.dir)
  };
  }
  draw = (delta: number) => {
    if (
      (this.x === this.game.players[this.game.localPlayerID].x && Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1) ||
      (this.y === this.game.players[this.game.localPlayerID].y && Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1)
    )
      Game.drawFX(this.tileX + Math.floor(HitWarning.frame), this.tileY, 1, 1, this.x, this.y - this.offsetY, 1, 1);
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
    if (
      (this.x === this.game.players[this.game.localPlayerID].x && Math.abs(this.y - this.game.players[this.game.localPlayerID].y) <= 1) ||
      (this.y === this.game.players[this.game.localPlayerID].y && Math.abs(this.x - this.game.players[this.game.localPlayerID].x) <= 1)
    )
      Game.drawFX(this.tileX + Math.floor(HitWarning.frame), this.tileY + 1 , 1, 1, this.x, this.y - this.offsetY, 1, 1);
  };
}
