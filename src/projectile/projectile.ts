import { Player } from "../player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable";

export class Projectile extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  parent: Entity | Player;

  constructor(parent: Entity | Player, x: number, y: number) {
    super();

    this.x = x;
    this.y = y;
    this.dead = false;
    this.parent = parent;
    this.drawableY = y;
  }

  get distanceToParent() {
    return Math.sqrt(
      (this.x - this.parent.x) ** 2 + (this.y - this.parent.y) ** 2
    );
  }

  hitPlayer = (player: Player) => {};
  hitEnemy = (enemy: Entity) => {};

  tick = () => {};
  draw = (delta: number) => {};
  drawTopLayer = (delta: number) => {};
}
