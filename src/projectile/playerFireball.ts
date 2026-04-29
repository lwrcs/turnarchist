import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player/player";
import { HitWarning } from "../drawable/hitWarning";
import { Lighting } from "../lighting/lighting";
import { Utils } from "../utility/utils";
export class PlayerFireball extends Projectile {
  state: number;
  frame: number;
  delay: number;
  parent: Player;
  offsetFrame: number;
  private shookOnImpact: boolean = false;

  constructor(parent: Player, x: number, y: number, spellDelay: number = 0) {
    super(parent, x, y);
    this.state = 0;
    this.frame = 6;
    this.delay = spellDelay;
    this.offsetFrame =
      -Utils.distance(this.parent.x, this.parent.y, this.x, this.y) * 50 - spellDelay * 120;
    Lighting.momentaryLight(
      this.parent.game.rooms[this.parent.levelID],
      this.x + 0.5,
      this.y + 0.5,
      0.5,
      [255, 100, 0],
      250,
      10,
      1,
    );
  }
  drawTopLayer = (delta: number) => {
    if (this.dead) return;
    if (this.offsetFrame < 0) this.offsetFrame += 10 * delta;
    if (this.offsetFrame >= 0) {
      this.frame += 0.25 * delta;
    }

    if (!this.shookOnImpact && this.offsetFrame >= 0) {
      this.shookOnImpact = true;
      this.parent.game.shakeScreen(0, -4);
    }

    if (this.frame > 17) this.dead = true;
    Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
