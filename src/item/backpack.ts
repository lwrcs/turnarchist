import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Level } from "../level";
import { Usable } from "./usable";
import { Inventory } from "../inventory";

export class Backpack extends Usable {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.offsetY = 0;
  }

  onUse = (player: Player) => {
    if (this.level.game.levels[player.levelID] === this.level.game.level)
      Sound.heal();
    let b = player.inventory.hasItem(Backpack);
    if (b !== null) {
      // remove backpack
      player.inventory.removeItem(b);
    }
    player.inventory.expansion += 1;
    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };
  getDescription = () => {
    return "BACKPACK\nA normal looking backpack. Increases the amount you can carry. ";
  };
}
