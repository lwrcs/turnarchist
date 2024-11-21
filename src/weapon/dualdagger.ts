import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";
import { GameConstants } from "../gameConstants";

export class DualDagger extends Weapon {
  firstAttack: boolean;

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 0;
    this.firstAttack = true;
    this.name = "Dual Dagger";
  }

  tickInInventory = () => {
    this.firstAttack = true;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
        e.hurt(this.wielder, 1);

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
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY)
      );
      this.game.rooms[this.wielder.levelID].entities = this.game.rooms[
        this.wielder.levelID
      ].entities.filter((e) => !e.dead);

      if (!this.firstAttack) {
        this.game.rooms[this.wielder.levelID].tick(this.wielder);
      }
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);

      if (this.firstAttack) {
        this.firstAttack = false;
        this.wielder.slowMotionEnabled = true;
      }
    }
    return !flag;
  };

  getDescription = (): string => {
    return "Dual Daggers\nOne extra attack per turn";
  };
}
