import { Player } from "../player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable";
import { HitWarning } from "../hitWarning";
import { Direction } from "../game";

export class Projectile extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  parent: Entity | Player;
  dir: Direction;
  constructor(parent: Entity | Player, x: number, y: number) {
    super();

    this.x = x;
    this.y = y;
    this.dead = false;
    this.parent = parent;
    this.drawableY = y;
  }

  get distanceToParent() {
    return Math.abs(this.x - this.parent.x) + Math.abs(this.y - this.parent.y);
  }

  hitPlayer = (player: Player) => {};
  hitEnemy = (enemy: Entity) => {};

  tick = () => {};
  draw = (delta: number) => {};
  drawTopLayer = (delta: number) => {};
}
