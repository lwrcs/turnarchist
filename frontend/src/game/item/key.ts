import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";

export class Key extends Item {
  static itemName = "key";
  doorID: number;
  depth: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 0;
    this.name = "key";
    this.doorID = 0;
    this.depth = null;
  }

  getDescription = (): string => {
    //const ID = this.doorID === 0 ? "" : "ID: " + this.doorID.toString();
    const depth = this.depth !== null ? "Depth: " + this.depth.toString() : "";
    return `KEY\nA key. ${depth}`;
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) {
        this.level.game.pushMessage("You found a key!");
        Sound.keyPickup();
        if (this.depth === null) this.depth = player.depth;
        console.log(this.depth);
      }
    }
  };
}
