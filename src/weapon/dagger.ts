import { Weapon } from "./weapon";
import { Room } from "../room/room";

export class Dagger extends Weapon {
  static itemName = "dagger";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 0;
    this.name = "dagger";
    this.description = "A basic but dependable weapon.";
  }

  weaponMove = (newX: number, newY: number): boolean => {
    if (this.checkForPushables(newX, newY)) return true;

    const hitSomething = this.executeAttack(newX, newY);

    return !hitSomething;
  };

  degrade = () => {};
}
