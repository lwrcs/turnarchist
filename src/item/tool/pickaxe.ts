import { Weapon } from "../weapon/weapon";
import { Room } from "../../room/room";
import { Item } from "../item";
import { Usable } from "../usable/usable";
import { WeaponFragments } from "../usable/weaponFragments";
import { Player } from "../../player/player";

export class Pickaxe extends Usable {
  static itemName = "pickaxe";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 30;
    this.tileY = 0;
    this.name = Pickaxe.itemName;
    this.description = "allows mining rocks without equipping";
    //this.canMine = true;
  }

  disassemble = (player: Player) => {
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.ceil(Math.random() * 5 + 5);
    player.inventory.removeItem(this);
    player.inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY, numFragments),
    );
  };
}
