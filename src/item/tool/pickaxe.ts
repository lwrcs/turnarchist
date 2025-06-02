import { Weapon } from "../weapon/weapon";
import { Room } from "../../room/room";
import { Item } from "../item";

export class Pickaxe extends Item {
  static itemName = "pickaxe";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 30;
    this.tileY = 0;
    this.name = Pickaxe.itemName;
    this.description = "allows mining rocks without equipping";
    //this.canMine = true;
  }
}
