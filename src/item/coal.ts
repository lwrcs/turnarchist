import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Usable } from "./usable";
import { Lantern } from "./lantern";

export class Coal extends Usable {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 17;
    this.tileY = 0;
    this.stackable = true;
  }
  onUse = (player: Player) => {
    let l = player.inventory;
    for (let item of player.inventory.items) {
      if (item instanceof Lantern) {
        item.fuel += 50;
        console.log("filled lantern");
      }
    }
  };

  getDescription = (): string => {
    return "COAL\nA lump of coal.";
  };
}
