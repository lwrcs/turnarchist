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
  fuelCap: number;

  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
    this.coal = 0;
    this.fuel = 0;
    this.lit = false;
    this.tileX = 29;
    this.tileY = 0;
    this.fuelCap = 250;
  }
  addFuel = (amount: number) => {
    this.fuel += amount;
  };

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
    if (this.fuel === 0 && this.equipped) {
      this.equipped = false;
      this.wielder.game.pushMessage("Your lantern runs out of fuel.");
    }
    this.ignite();

    if (this.lit) {
      this.fuel -= 1;
      this.wielder.sightRadius = Math.min(this.fuel / 4 + 3, 7);
    } else this.wielder.sightRadius = 3;
    console.log("fuel:" + this.fuel);
  };

  toggleEquip = () => {
    if (this.fuel > 0) {
      this.equipped = !this.equipped;
      this.ignite();
      if (this.lit) this.wielder.sightRadius = Math.min(this.fuel / 4 + 3, 7);
      else this.wielder.sightRadius = 3;
    }
    else this.wielder.game.pushMessage("I'll need some fuel before I can use this");
    //Math.max(this.wielder.defaultSightRadius, this.fuel / 25)}
  };

  getDescription = () => {
    const percentage = (this.fuel / 50) * 100;
    return `LANTERN - Fuel: ${percentage}%, Capacity: ${this.fuelCap / 50}`;
  };
}
