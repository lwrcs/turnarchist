import { Weapon } from "./weapon";
import { Room } from "../room";

export class Dagger extends Weapon {
  static itemName = "dagger";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 0;
    this.name = "dagger";
    this.description = "A basic but dependable weapon.";
  }

  degrade = () => {};
}
