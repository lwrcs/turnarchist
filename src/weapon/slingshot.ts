import { Game } from "../game";
import { Weapon } from "./weapon";
import { Level } from "../level";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../enemy/crate";
import { Barrel } from "../enemy/barrel";
import { GenericParticle } from "../particle/genericParticle";

export class Slingshot extends Weapon {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 26;
    this.tileY = 0;
  }

  weaponMove = (newX: number, newY: number): boolean => {
    console.log(`Current Position: (${this.wielder.x},${this.wielder.y})`);
    let nextX = [newX];
    let nextY = [newY];
    //define arrays for coords beginning with function arguments
    let range: number = 1;
    let l = 0;
    for (
      let i = 0;
      i < 15;
      i++ //loop through range
    ) {
      if (newX === this.wielder.x) {
        nextX.push(newX), nextY.push(nextY[l] + (newY - this.wielder.y));
      }
      if (newY === this.wielder.y) {
        nextX.push(nextX[l] + (newX - this.wielder.x)), nextY.push(newY);
      }
      //console.log(`Iteration ${i}: nextX = ${nextX}, nextY = ${nextY}`);
      // push nex coordinates to array of possible moves
      l++;
    }
    if (
      !this.game.levels[this.wielder.levelID].tileInside(newX, newY) ||
      this.game.levels[this.wielder.levelID].levelArray[newX][newY].isSolid()
    ) {
      //if current position is inside new position OR is solid
      return true;
    }
    let c = 1;
    for (let i = 0; i < 15; i++) {
      if (
        !this.game.levels[this.wielder.levelID].tileInside(
          nextX[c],
          nextY[c]
        ) ||
        this.game.levels[this.wielder.levelID].levelArray[nextX[c]][
          nextY[c]
        ].isSolid()
      ) {
        range = c;
        //exit the function if wall is detected
      }
      c++;
      //increase the range each loop until
    }
    //console.log(`range = ${range}`)
    //range = 15;
    let enemyHitCandidates = [];
    let firstPushable = range + 1;
    let firstNonPushable = range + 2;
    let firstNonDestroyable = range + 2;
    for (let e of this.game.levels[this.wielder.levelID].enemies) {
      //loop through enemies in this weapons wielders level
      if (e.pushable) {
        let p = 2;

        //case for pushables
        if (e.pointIn(newX, newY)) return true;
        //if pushable is in new position return true
        for (let i = 0; i < 15; i++) {
          if (e.pointIn(nextX[p - 1], nextY[p - 1]) && range >= p) {
            //enemyHitCandidates.push({ enemy: e, dist: p });
            firstPushable = Math.min(firstPushable, p);
          }
          p++; //run that shit back
        }
      } else if (e.destroyable) {
        //case for destroyables
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonPushable = 1;
          enemyHitCandidates.push({ enemy: e, dist: 1 });
        }
        let d = 2;
        for (let i = 0; i < 15; i++) {
          if (e.pointIn(nextX[d - 1], nextY[d - 1]) && range >= d) {
            firstNonPushable = Math.min(firstNonPushable, d);
            enemyHitCandidates.push({ enemy: e, dist: d });
          }
          d++;
        }
      } else {
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonDestroyable = 1;
        }
        let n = 2;
        for (let i = 0; i < 15; i++) {
          if (e.pointIn(nextX[n - 1], nextY[n - 1]) && range >= n) {
            firstNonDestroyable = Math.min(firstNonDestroyable, n);
          }
          n++;

          //if enemy is in new position and range is enough set first non destroyable to 3
        }
      }
    }
    //enemyHitCandidates.splice(1, enemyHitCandidates.length - 1);

    console.log("first pushable " + firstPushable);
    console.log("first nonpushable " + firstNonPushable);
    console.log("first nondestroyable " + firstNonDestroyable);
    console.log("hitCandidates ", enemyHitCandidates);
    let targetX = newX; //nextX[range];
    let targetY = newY; //nextY[range];

    if (
      firstNonDestroyable < firstNonPushable &&
      firstNonDestroyable < firstPushable
      //if a non destroyable comes before the first non pushable and before the first pushable
    ) {
      return true;
      //return true and exit the function
    }
    if (firstNonPushable <= firstPushable) {
      if (enemyHitCandidates.length > 0) {
        const closestEnemy = enemyHitCandidates.reduce(
          (minEnemy, currentEnemy) => {
            if (currentEnemy.dist < minEnemy.dist) {
              return currentEnemy;
            } else return minEnemy;
          }
        );
        console.log(`closestEnemy = ${closestEnemy}`)
        closestEnemy.enemy.hurt(this.wielder, 3);
      }
      //for (const c of enemyHitCandidates) {
      //let e = c.enemy;
      //let d = c.dist;
      //if (d === 1) e.hurt(this.wielder, 0.5);

      //}
      //finally bro
      //for the array c of enemyHitCandidates if the enemy distance is 3 only do .5 damage
      //if they're closer do the usual damage
      //hits all candidates in enemyHitCandidates

      if (
        this.wielder.game.levels[this.wielder.levelID] ===
        this.wielder.game.level
      )
        Sound.hit();
      this.wielder.drawX = 0.5 * (this.wielder.x - newX);
      this.wielder.drawY = 0.5 * (this.wielder.y - newY);
      GenericParticle.shotgun(
        this.game.levels[this.wielder.levelID],
        this.wielder.x + 0.5,
        this.wielder.y,
        targetX + 0.5,
        targetY,
        "black"
      );
      GenericParticle.shotgun(
        this.game.levels[this.wielder.levelID],
        this.wielder.x + 0.5,
        this.wielder.y,
        targetX + 0.5,
        targetY,
        "#ffddff"
      );
      let gp = new GenericParticle(
        this.game.levels[this.wielder.levelID],
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
      this.game.levels[this.wielder.levelID].particles.push(gp);
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX2, newY2));
      //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX3, newY3));
      this.game.levels[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.drawX, 10 * this.wielder.drawY);

      return false;
    }
    return true;
  };
  getDescription = (): string => {
    return "SLINGSHOT\nRange 15";
  };
}