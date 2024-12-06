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
    if (this.broken) {
      this.equipped = false;
      let pronoun = this.name.endsWith("s") ? "them" : "it";
      this.level.game.pushMessage(
        "You'll have to fix your " +
          this.name +
          " before you can use " +
          pronoun +
          ".",
      );
    }
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
    this.broken = true;
    this.toggleEquip();
    //this.wielder.inventory.removeItem(this);
    this.wielder = null;
  };

  onDrop = () => {};

  dropFromInventory = () => {
    this.wielder.inventory.weapon = null;
    this.wielder = null;
    this.equipped = false;
  };
}
