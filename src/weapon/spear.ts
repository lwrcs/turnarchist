import { Game } from "../game";
import { Weapon } from "./weapon";
import { Level } from "../level";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../enemy/crate";
import { Barrel } from "../enemy/barrel";

export class Spear extends Weapon {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 24;
    this.tileY = 0;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let newX2 = 2 * newX - this.wielder.x;
    let newY2 = 2 * newY - this.wielder.y;
    let flag = false;
    let enemyHitCandidates = [];
    for (let e of this.game.levels[this.wielder.levelID].enemies) {
      if (e.destroyable) {
        if (e.pointIn(newX, newY)) {
          if (e.pushable) return true;
          else {
            e.hurt(this.wielder, 1);
            flag = true;
          }
        }
        if (e.pointIn(newX2, newY2) && !this.game.levels[this.wielder.levelID].levelArray[newX][newY].isSolid()) {
          if (!e.pushable) enemyHitCandidates.push(e);
        }
      }
    }
    if (!flag && enemyHitCandidates.length > 0) {
      for (const e of enemyHitCandidates) e.hurt(this.wielder, 1);
      if (this.wielder.game.level === this.wielder.game.levels[this.wielder.levelID]) Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
      this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX2, newY2));
      this.game.levels[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);
      return false;
    }
    if (flag) {
      if (this.wielder.game.level === this.wielder.game.levels[this.wielder.levelID]) Sound.hit();
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
    return "SPEAR\nRange 2";
  };
}
