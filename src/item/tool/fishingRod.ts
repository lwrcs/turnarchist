import { Item } from "../item";

import { Room } from "../../room/room";

import { WeaponFragments } from "../usable/weaponFragments";

import { Random } from "../../utility/random";
export class FishingRod extends Item {
  static itemName = "fishing rod";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 31;
    this.tileY = 2;
    this.offsetY = -0.1;
    this.description = "useful for catching fish";
    this.name = FishingRod.itemName;
  }

  disassemble = () => {
    this.level.game.pushMessage(
      `You dissassemble your ${this.name} into fragments.`,
    );

    let inventory =
      this.level.game.players[this.level.game.localPlayerID].inventory;
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.floor(10 + Random.rand() * 10);
    this.level.game.pushMessage(
      `You dissassemble your fishing rod into ${numFragments} fragments.`,
    );
    inventory.removeItem(this);
    inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY),
      numFragments,
    );
  };
}
