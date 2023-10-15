import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/crate";
import { Barrel } from "../entity/barrel";
import { GenericParticle } from "../particle/genericParticle";

export class Shotgun extends Weapon {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 26;
    this.tileY = 0;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    let newX2 = 2 * newX - this.wielder.x;
    let newY2 = 2 * newY - this.wielder.y;
    let newX3 = 3 * newX - 2 * this.wielder.x;
    let newY3 = 3 * newY - 2 * this.wielder.y;
    let range = 3;
    if (
      !this.game.rooms[this.wielder.levelID].tileInside(newX, newY) ||
      this.game.rooms[this.wielder.levelID].roomArray[newX][newY].isSolid()
    )
      //if current position is inside new position OR is solid
      return true;
    else if (
      !this.game.rooms[this.wielder.levelID].tileInside(newX2, newY2) ||
      this.game.rooms[this.wielder.levelID].roomArray[newX2][newY2].isSolid()
    )
      //if current position is inside new position 2 OR is solid
      //set range as one
      range = 1;
    else if (
      !this.game.rooms[this.wielder.levelID].tileInside(newX3, newY3) ||
      this.game.rooms[this.wielder.levelID].roomArray[newX3][newY3].isSolid()
    )
      //if current position is inside new position 3 OR is solid
      //set range as two
      range = 2;

    let enemyHitCandidates = [];
    let firstPushable = 4;
    let firstNonPushable = 5;
    let firstNonDestroyable = 5;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      //loop through enemies in this weapons wielders level
      if (e.pushable) {
        //case for pushables
        if (e.pointIn(newX, newY)) return true;
        //if pushable is in new position return true
        if (e.pointIn(newX2, newY2) && range >= 2) {
          enemyHitCandidates.push({ enemy: e, dist: 2 });
          firstPushable = 2;
          //if pushable is in position 2 set firstPushable var
        }
        if (e.pointIn(newX3, newY3) && range >= 3) {
          enemyHitCandidates.push({ enemy: e, dist: 3 });
          firstPushable = Math.min(firstPushable, 3);
          //if pushable is in position 3 set firstPushable to min of firstPushable and 3
        }
      } else if (e.destroyable) {
        //case for destroyables
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonPushable = 1;
          enemyHitCandidates.push({ enemy: e, dist: 1 });
        }
        //if enemy is in new position and range is enough push enemy to hit candidate array
        if (e.pointIn(newX2, newY2) && range >= 2) {
          firstNonPushable = Math.min(firstNonPushable, 2);
          enemyHitCandidates.push({ enemy: e, dist: 2 });
        }
        //if enemy is in new position 2 and range is enough push enemy to hit candidate array
        if (e.pointIn(newX3, newY3) && range >= 3) {
          firstNonPushable = Math.min(firstNonPushable, 3);
          enemyHitCandidates.push({ enemy: e, dist: 3 });
        }
        //if enemy is in new position 3 and range is enough push enemy to hit candidate array
      } else {
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonDestroyable = 1;
        }
        //if enemy is in new position and range is enough set first non destroyable to 1
        if (e.pointIn(newX2, newY2) && range >= 2) {
          firstNonDestroyable = Math.min(firstNonDestroyable, 2);
        }
        //if enemy is in new position and range is enough set first non destroyable to 2

        if (e.pointIn(newX3, newY3) && range >= 3) {
          firstNonDestroyable = Math.min(firstNonDestroyable, 3);
        }
        //if enemy is in new position and range is enough set first non destroyable to 3
      }
    }
    let targetX = newX3;
    let targetY = newY3;
    if (
      firstNonDestroyable < firstNonPushable &&
      firstNonDestroyable < firstPushable
      //if a non destroyable comes before the first non pushable and before the first pushable
    ) {
      return true;
      //return true and exit the function
    }
    if (firstNonPushable <= firstPushable) {
      for (const c of enemyHitCandidates) {
        let e = c.enemy;
        let d = c.dist;
        if (d === 3) e.hurt(this.wielder, 0.5);
        else e.hurt(this.wielder, 1);
      }
      //finally bro
      //for the array c of enemyHitCandidates if the enemy distance is 3 only do .5 damage
      //if they're closer do the usual damage
      //hits all candidates in enemyHitCandidates

      if (
        this.wielder.game.rooms[this.wielder.levelID] ===
        this.wielder.game.level
      )
        Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      GenericParticle.shotgun(
        this.game.rooms[this.wielder.levelID],
        this.wielder.x + 0.5,
        this.wielder.y,
        targetX + 0.5,
        targetY,
        "black"
      );
      GenericParticle.shotgun(
        this.game.rooms[this.wielder.levelID],
        this.wielder.x + 0.5,
        this.wielder.y,
        targetX + 0.5,
        targetY,
        "#ffddff"
      );
      let gp = new GenericParticle(
        this.game.rooms[this.wielder.levelID],
        0.5 * (newX + this.wielder.x) + 0.5,
        0.5 * (newY + this.wielder.y),
        0,
        1,
        0,
        0,
        0,
        "white",
        0
      );
      gp.expirationTimer = 10;
      this.game.rooms[this.wielder.levelID].particles.push(gp);
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX2, newY2));
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX3, newY3));
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);

      return false;
    }
    return true;
  };

  getDescription = (): string => {
    return "SHOTGUN\nRange 3, penetration";
  };
}
