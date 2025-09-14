import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { SlashParticle } from "../../particle/slashParticle";
import { Direction } from "../../game";
import { AttackAnimation } from "../../particle/attackAnimation";

export class DualDagger extends Weapon {
  firstAttack: boolean;
  static itemName = "dual daggers";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 0;
    this.firstAttack = true;
    this.name = "Dual Daggers";
    this.useCost = 2;
    this.description =
      "After the first attack, enemies will not take their turn until you attack or move again.";
  }

  hitSound = () => {
    Sound.swing();
    Sound.playShortSlice();
  };

  tickInInventory = () => {
    this.firstAttack = true;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    const entities = this.getEntitiesAt(newX, newY).filter((e) => !e.pushable);
    let flag = false;

    for (let e of entities) {
      this.attack(e, this.damage);
      this.statusEffect(e);
      flag = true;
    }

    if (flag) {
      this.hitSound();
      this.wielder.setHitXY(newX, newY);
      this.shakeScreen(newX, newY);

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
        this.wielder.beginSlowMotion();
      }
      this.degrade();
    }
    return !flag;
  };
}
