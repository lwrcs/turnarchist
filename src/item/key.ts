import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room";
import { Sound } from "../sound";
import { Player } from "../player/player";

export class Key extends Item {
  static itemName = "key";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 0;
  }

  getDescription = (): string => {
    return "KEY\nAn iron key.";
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) Sound.keyPickup();
    }
  };
}
