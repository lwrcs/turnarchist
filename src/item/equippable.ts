import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Player } from "../player";

export class Equippable extends Item {
  wielder: Player;
  equipped: boolean;

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.equipped = false;
  }

  setWielder = (wielder: Player) => {
    this.wielder = wielder;
  };

  coEquippable = (other: Equippable): boolean => {
    return true;
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
  };

  drawEquipped = (delta: number, x: number, y: number) => {
    Game.drawItem(this.tileX, this.tileY, 1, 2, x, y - 1, this.w, this.h);
  };

  degrade = (degradeAmount: number = 1) => {
    this.durability -= degradeAmount;
    if (this.durability <= 0) this.break();
  };

  break = () => {
    this.durability = 0;
    this.toggleEquip();
    this.wielder.inventory.removeItem(this);
    this.wielder = null;
  };

  onDrop = () => {};

  dropFromInventory = () => {
    this.wielder.inventory.weapon = null;
    this.wielder = null;
    this.equipped = false;
  };
}
