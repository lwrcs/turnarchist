import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player";
import { HitWarning } from "../hitWarning";
import { Lighting } from "../lighting";
export class PlayerFireball extends Projectile {
  state: number;
  frame: number;
  delay: number;
  parent: Player;

  constructor(parent: Player, x: number, y: number) {
    super(parent, x, y);
    this.state = 0;
    this.frame = 6;
    Lighting.momentaryLight(
      this.parent.game.rooms[this.parent.levelID],
      this.x + 0.5,
      this.y + 0.5,
      0.5,
      [255, 100, 0],
      150,
      10,
      1
    );
  }
  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    this.frame += 0.25 * delta;

    if (this.frame > 17) this.dead = true;
    Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
