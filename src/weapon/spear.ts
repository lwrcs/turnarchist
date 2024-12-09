import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";
import { Enemy } from "../entity/enemy/enemy";

export class Spear extends Weapon {
  static itemName = "spear";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 24;
    this.tileY = 0;
    this.name = "spear";
    this.description =
      "Hits enemies in front of you within a range of 2 tiles.";
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let newX2 = 2 * newX - this.wielder.x;
    let newY2 = 2 * newY - this.wielder.y;
    let flag = false;
    let enemyHitCandidates = [];
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable) {
        if (e.pointIn(newX, newY)) {
          if (e.pushable) return true;
          else {
            e.hurt(this.wielder, 1);
            this.statusEffect(e);
            flag = true;
          }
        }
        if (
          e.pointIn(newX2, newY2) &&
          !this.game.rooms[this.wielder.levelID].roomArray[newX][newY].isSolid()
        ) {
          //only hit targest 2 tiles away if they are enemies
          if (!e.pushable && e instanceof Enemy) enemyHitCandidates.push(e);
        }
      }
    }
    if (!flag && enemyHitCandidates.length > 0) {
      for (const e of enemyHitCandidates) e.hurt(this.wielder, 1);
      if (
        this.wielder.game.room === this.wielder.game.rooms[this.wielder.levelID]
      )
        Sound.hit();
      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY),
      );
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX2, newY2),
      );
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      this.degrade();
      return false;
    }
    if (flag) {
      if (
        this.wielder.game.room === this.wielder.game.rooms[this.wielder.levelID]
      )
        Sound.hit();
      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY),
      );
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      this.degrade();
    }
    return !flag;
  };
}
