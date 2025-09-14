import { Weapon } from "../weapon/weapon";
import { Room } from "../../room/room";
import { Item } from "../item";
import { Usable } from "../usable/usable";
import { WeaponFragments } from "../usable/weaponFragments";
import { Player } from "../../player/player";

export class Pickaxe extends Weapon {
  static itemName = "pickaxe";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 30;
    this.tileY = 0;
    this.name = Pickaxe.itemName;
    this.description = "allows mining rocks without equipping";
    this.canMine = true;
  }
}
