import { Game } from "../game";
import { Weapon } from "./weapon";
import { Level } from "../level";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../enemy/crate";
import { Barrel } from "../enemy/barrel";
import { GenericParticle } from "../particle/genericParticle";

export class Shotgun extends Weapon {
  constructor(level: Level, x: number, y: number) {
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
      !this.game.levels[this.wielder.levelID].tileInside(newX, newY) ||
      this.game.levels[this.wielder.levelID].levelArray[newX][newY].isSolid()
    )
      return true;
    else if (
      !this.game.levels[this.wielder.levelID].tileInside(newX2, newY2) ||
      this.game.levels[this.wielder.levelID].levelArray[newX2][newY2].isSolid()
    )
      range = 1;
    else if (
      !this.game.levels[this.wielder.levelID].tileInside(newX3, newY3) ||
      this.game.levels[this.wielder.levelID].levelArray[newX3][newY3].isSolid()
    )
      range = 2;

    let enemyHitCandidates = [];
    let firstPushable = 4;
    let firstNonPushable = 5;
    let firstNonDestroyable = 5;
    for (let e of this.game.levels[this.wielder.levelID].enemies) {
      if (e.pushable) {
        if (e.pointIn(newX, newY)) return true;
        if (e.pointIn(newX2, newY2) && range >= 2) {
          enemyHitCandidates.push({ enemy: e, dist: 2 });
          firstPushable = 2;
        }
        if (e.pointIn(newX3, newY3) && range >= 3) {
          enemyHitCandidates.push({ enemy: e, dist: 3 });
          firstPushable = Math.min(firstPushable, 3);
        }
      } else if (e.destroyable) {
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonPushable = 1;
          enemyHitCandidates.push({ enemy: e, dist: 1 });
        }
        if (e.pointIn(newX2, newY2) && range >= 2) {
          firstNonPushable = Math.min(firstNonPushable, 2);
          enemyHitCandidates.push({ enemy: e, dist: 2 });
        }
        if (e.pointIn(newX3, newY3) && range >= 3) {
          firstNonPushable = Math.min(firstNonPushable, 3);
          enemyHitCandidates.push({ enemy: e, dist: 3 });
        }
      } else {
        if (e.pointIn(newX, newY) && range >= 1) {
          firstNonDestroyable = 1;
        }
        if (e.pointIn(newX2, newY2) && range >= 2) {
          firstNonDestroyable = Math.min(firstNonDestroyable, 2);
        }
        if (e.pointIn(newX3, newY3) && range >= 3) {
          firstNonDestroyable = Math.min(firstNonDestroyable, 3);
        }
      }
    }
    let targetX = newX3;
    let targetY = newY3;
    if (
      firstNonDestroyable < firstNonPushable &&
      firstNonDestroyable < firstPushable
    ) {
      return true;
    }
    if (firstNonPushable <= firstPushable) {
      for (const c of enemyHitCandidates) {
        let e = c.enemy;
        let d = c.dist;
        if (d === 3) e.hurt(this.wielder, 0.5);
        else e.hurt(this.wielder, 1);
      }

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
    return "SHOTGUN\nRange 3, penetration";
  };
}
