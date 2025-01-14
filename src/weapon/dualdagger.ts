import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Direction } from "../game";
import { AttackAnimation } from "../particle/attackAnimation";

export class DualDagger extends Weapon {
  firstAttack: boolean;
  static itemName = "dual daggers";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 0;
    this.firstAttack = true;
    this.name = "Dual Daggers";
    this.durability = 75;
    this.durabilityMax = 75;
    this.description =
      "After the first attack, enemies will not take their turn until you attack or move again.";
  }

  tickInInventory = () => {
    this.firstAttack = true;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
        e.hurt(this.wielder, 1);
        this.statusEffect(e);

        flag = true;
      }
    }
    if (flag) {
      this.hitSound();

      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);
      if (this.firstAttack) {
        this.game.rooms[this.wielder.levelID].particles.push(
          new AttackAnimation(newX, newY, "dualdagger", this.wielder.direction),
        );
      } else {
        this.game.rooms[this.wielder.levelID].particles.push(
          new AttackAnimation(
            newX,
            newY,
            "dualdagger2",
            this.wielder.direction,
          ),
        );
      }
      this.game.rooms[this.wielder.levelID].entities = this.game.rooms[
        this.wielder.levelID
      ].entities.filter((e) => !e.dead);

      if (!this.firstAttack) {
        this.game.rooms[this.wielder.levelID].tick(this.wielder);
      }
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);

      if (this.firstAttack) {
        this.game.rooms[this.wielder.levelID].tickHitWarnings();
        this.game.rooms[this.wielder.levelID].clearDeadStuff();
        this.firstAttack = false;
        this.wielder.slowMotionEnabled = true;
      }
      this.degrade();
    }
    return !flag;
  };
}
