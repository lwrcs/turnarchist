import { Item } from "./item";
import { Game } from "../game";
import { Level } from "../level";
import { Equippable } from "./equippable";
import { Torch } from "./torch";
import { Lantern } from "./lantern";
import { Inventory } from "../inventory";
import { Player } from "../player";
import { Light } from "./light";

export class Candle extends Light {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.fuel = 100; //how many turns before it burns out
    this.tileX = 27;
    this.tileY = 0;
  }

  tickInInventory = () => {
    if (this.fuel <= 0) {
      this.wielder.game.pushMessage("Your candle burns out.");
      this.wielder.inventory.subtractItemCount(this);
    }
    if (this.ignite()) {
      this.fuel -= 1;
      this.wielder.sightRadius = Math.min(this.fuel / 5 + 2, 4);
    }
    console.log("fuel:" + this.fuel);
  };

  coEquippable = (other: Light): boolean => {
    return !(
      other instanceof Candle ||
      other instanceof Torch ||
      other instanceof Lantern
    );
  };
  
  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.ignite()) {
      this.wielder.sightRadius = Math.min(this.fuel / 5 + 2, 4);
    }
    //if (!this.equipped) this.wielder.sightRadius = this.wielder.defaultSightRadius
  };

  getDescription = () => {
    const percentage = (this.fuel / 50) * 100;
    return `Candle: ${percentage}%`;
  };
}
