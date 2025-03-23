import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";
import { Inventory } from "../inventory/inventory";

export class Backpack extends Usable {
  static itemName = "backpack";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.offsetY = 0;
  }

  onUse = (player: Player) => {
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
    player.inventory.removeItem(this);
    player.inventory.expansion += 1;
    this.level.game.pushMessage(
      "You equip the backpack, increasing the amount you can carry.",
    );
    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };
  getDescription = () => {
    return "BACKPACK\nA normal looking backpack. Increases the amount you can carry. ";
  };
}
