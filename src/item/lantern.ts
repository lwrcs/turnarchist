import { Item } from "./item";
import { Game } from "../game";
import { Level } from "../level";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Torch } from "./torch";
import { Coal } from "./coal";

export class Lantern extends Equippable {
  fuel: number;
  coal: number;
  lit: boolean;

  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.coal = 0;
    this.fuel = 0;
    this.lit = false;
    this.tileX = 29;
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
    if (this.fuel > 0 && this.equipped) this.lit = true;
    else this.lit = false;
  };

  tickInInventory = () => {
    this.ignite();
    if (this.lit) {
      this.fuel -= 1;
      this.wielder.sightRadius = Math.min(this.fuel / 3 + 3, 20);
      this.ignite();
    } else this.wielder.sightRadius = 3;
    console.log("fuel:" + this.fuel);
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    this.ignite();
    if (this.lit) this.wielder.sightRadius = Math.min(this.fuel / 2 + 4, 20);
    else this.wielder.sightRadius = 3;
    //Math.max(this.wielder.defaultSightRadius, this.fuel / 25)}
  };

  getDescription = () => {
    return `LANTERN - Fuel: ${this.fuel}`;
  };
}
