import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";

export class Key extends Item {
  static itemName = "key";
  doorID: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 0;
    this.name = "key";
    this.doorID = 0;
  }

  getDescription = (): string => {
    const ID = this.doorID === 0 ? "" : "ID: " + this.doorID.toString();
    return `KEY\nAn iron key. ${ID}`;
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      this.level.game.pushMessage("You found a key!");
      if (this.pickedUp) Sound.keyPickup();
    }
  };
}
