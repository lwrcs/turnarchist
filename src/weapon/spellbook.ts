import { Game } from "../game";
import { Weapon } from "./weapon";
import { Level } from "../level";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../enemy/crate";
import { Barrel } from "../enemy/barrel";
import { Player } from "../player";
import { Inventory } from "../inventory";
import { WizardFireball } from "../projectile/wizardFireball";
import { PlayerFireball } from "../projectile/playerFireball";

export class Spellbook extends Weapon {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 25;
    this.tileY = 0;
    this.canMine = true
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.levels[this.wielder.levelID].enemies) {
      if (
        (e.destroyable ||
          e.pushable) &&
        (e.pointIn(this.wielder.x, this.wielder.y + 1) ||
          e.pointIn(this.wielder.x, this.wielder.y - 1) ||
          e.pointIn(this.wielder.x + 1, this.wielder.y) ||
          e.pointIn(this.wielder.x - 1, this.wielder.y) ||
          e.pointIn(this.wielder.x + 1, this.wielder.y + 1) ||
          e.pointIn(this.wielder.x - 1, this.wielder.y + 1) ||
          e.pointIn(this.wielder.x + 1, this.wielder.y - 1) ||
          e.pointIn(this.wielder.x - 1, this.wielder.y - 1))
      ) {
        e.hurt(this.wielder, 2);
        flag = true;
      }
    }
    if (flag) {
      if (this.wielder.game.levels[this.wielder.levelID] === this.wielder.game.level) Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x, this.wielder.y + 1));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x, this.wielder.y - 1));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x + 1, this.wielder.y));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x - 1, this.wielder.y));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x + 1, this.wielder.y + 1));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x - 1, this.wielder.y + 1));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x + 1, this.wielder.y - 1));
      this.game.levels[this.wielder.levelID].particles.push
        (new PlayerFireball(this.wielder.x - 1, this.wielder.y - 1));
      this.game.levels[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);
    }
    return !flag;
  };

  getDescription = (): string => {
    return "SPELLBOOK\nc̵͈̮͍̫̄a̴̲͛͂̌ŗ̴̩͈̞̠͉̤̗̎̓͐͗̐̃̈́̏̊͝ê̴̥̙̰̱̮̙̩͇̝͎̋̏͐̉̑f̴̧͎͚̟͈̻̰̫̫͎̑̔̂͛̓͂̅ú̶̢͖̣͙͔̺̋̉̾̀̿̑̍̕l̵̮͚̊́͐̌̎͘";
  };
}
