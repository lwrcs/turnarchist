import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";
import { Player } from "../player";
import { Inventory } from "../inventory";
import { WizardFireball } from "../projectile/wizardFireball";
import { PlayerFireball } from "../projectile/playerFireball";
import { Lighting } from "../lighting";

export class Spellbook extends Weapon {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 25;
    this.tileY = 0;
    this.canMine = true;
    this.name = "Spellbook";
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    let difX = newX - this.x;
    let difY = newY - this.y;

    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (
        (e.destroyable || e.pushable) &&
        e.pointIn(newX, newY) &&
        !this.game.rooms[this.wielder.levelID].roomArray[e.x][e.y].isSolid()
      ) {
        e.hurt(this.wielder, 1);

        this.game.rooms[this.wielder.levelID].projectiles.push(
          new PlayerFireball(this.wielder, e.x, e.y)
        );

        flag = true;
      }
    }

    if (flag) {
      if (
        this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
      )
        Sound.hit();
      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);

      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
    }
    return !flag;
  };
}
