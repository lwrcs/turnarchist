import { Weapon } from "./weapon";
import { Room } from "../room";

export class Pickaxe extends Weapon {
  static itemName = "pickaxe";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 30;
    this.tileY = 0;
    this.canMine = true;
  }
}
