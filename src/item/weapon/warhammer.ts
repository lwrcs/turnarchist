import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { Direction } from "../../game";

export class Warhammer extends Weapon {
  static itemName = "warhammer";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 2;
    this.damage = 2;
    this.name = "warhammer";
    this.hitDelay = 225;
    this.useCost = 2;
    //this.cooldownMax = 10;
    this.degradeable = false;
  }

  hitSound = () => {
    Sound.swing();
    Sound.playWarHammer();
  };

  weaponMove = (newX: number, newY: number): boolean => {
    if (this.checkForPushables(newX, newY)) return true;

    const hitSomething = this.executeAttack(
      newX,
      newY,
      true,
      this.damage + this.wielder.damageBonus,
    );
    if (hitSomething) {
      this.cooldown = this.cooldownMax;
    }
    return !hitSomething;
  };

  shakeScreen = () => {
    this.wielder.beginSlowMotion();

    setTimeout(() => {
      this.wielder.endSlowMotion();
      switch (this.wielder.direction) {
        case Direction.DOWN:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.UP:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.LEFT:
          this.game.shakeScreen(-5, -5, false);
          break;
        case Direction.RIGHT:
          this.game.shakeScreen(5, -5, false);
          break;
      }
    }, this.hitDelay);
  };
}
