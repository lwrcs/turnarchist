import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";

export class Rapier extends Weapon {
  static itemName = "rapier";
  static examineText = "A slender thrusting blade. Angles the rest couldn't.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 25;
    this.tileY = 0;
    this.name = "rapier";
    this.description = "Attacks cardinally and diagonally. Press two direction keys together to thrust on a diagonal.";
    this.useCost = 1;
    this.degradeable = false;
    this.allowsDiagonalAttack = true;
  }

  hitSound = () => {
    Sound.swing();
    Sound.playShortSlice();
  };

  weaponMove = (newX: number, newY: number): boolean => {
    if (this.checkForPushables(newX, newY)) return true;

    const isDiagonal = newX !== this.wielder.x && newY !== this.wielder.y;
    const hitSomething = this.executeAttack(
      newX,
      newY,
      true,
      this.damage + this.wielder.damageBonus,
    );

    // Diagonal inputs never move the player — only attack
    if (isDiagonal) return false;
    return !hitSomething;
  };
}
