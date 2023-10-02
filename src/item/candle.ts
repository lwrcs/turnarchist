import { Item } from "./item";
import { Game } from "../game";
import { Level } from "../level";
import { Equippable } from "./equippable";
import { Torch } from "./torch";
import { Lantern } from "./lantern";
import { Inventory } from "../inventory";
import { Player } from "../player";

export class Candle extends Equippable {
  fuel: number;
  coal: number;
  lit: boolean;
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.fuel = 100; //how many turns before it burns out
    this.lit = false;
    this.tileX = 27;
    this.tileY = 0;
  }

  coEquippable = (other: Equippable): boolean => {
    return !(
      other instanceof Candle ||
      other instanceof Torch ||
      other instanceof Lantern
    );
  };

  ignite = () => {
    if (this.fuel > 0 && this.equipped) this.lit = true; //if has fuel and is equipped set as lit
    else this.lit = false;
  };

  tickInInventory = () => {
    this.ignite();
    if (this.fuel <= 0) {
      this.wielder.game.pushMessage("Your candle burns out.")
      this.wielder.inventory.subtractItemCount(this);
    }
    if (this.lit) {
      this.fuel -= 1;
      this.wielder.sightRadius = Math.min(this.fuel / 5 + 2, 4);
      this.ignite();
    } else this.wielder.sightRadius = 3;
    console.log("fuel:" + this.fuel);
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    this.ignite();
    if (this.lit) this.wielder.sightRadius = Math.min(this.fuel / 5 + 2, 4);
    else this.wielder.sightRadius = 3;
    //Math.max(this.wielder.defaultSightRadius, this.fuel / 25)}
  };

  getDescription = () => {
    const percentage = (this.fuel / 50) * 100;
    return `Candle: ${percentage}%`;
  };
}
