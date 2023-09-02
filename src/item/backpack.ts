import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Level } from "../level";
import { Usable } from "./usable";
import { Inventory } from "../inventory";

export class Backpack extends Item {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.tileX = 4;
    this.tileY = 0;
  }

  onUse = (player: Player) => {
   player.inventory.updateCapacity();
    this.level.items = this.level.items.filter(x => x !== this); // removes itself from the level
  };

  getDescription = (): string => {
    return (
      "BACKPACK\nA normal looking backpack. Increases the amount you can carry. "
    );
  };
}
