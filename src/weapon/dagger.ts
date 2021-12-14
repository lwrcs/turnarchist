import { Game } from "../game";
import { Weapon } from "./weapon";
import { Level } from "../level";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../enemy/crate";
import { Barrel } from "../enemy/barrel";

export class Dagger extends Weapon {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 0;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.levels[this.wielder.levelID].enemies) {
      if (
        e.destroyable &&
        !e.pushable &&
        e.pointIn(newX, newY)
      ) {
        e.hurt(this.wielder, 1);
        flag = true;
      }
    }
    if (flag) {
      if (this.wielder.game.levels[this.wielder.levelID] === this.wielder.game.level) Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
      this.game.levels[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);
    }
    return !flag;
  };

  getDescription = (): string => {
    return "DAGGER\nDamage 1";
  };
}
