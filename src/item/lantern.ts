import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Torch } from "./torch";
import { Coal } from "./coal";
import { Light } from "./light";

export class Lantern extends Light {
  fuelCap: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 0;
    this.tileX = 29;
    this.tileY = 0;
    this.fuelCap = 250;
    this.name = "lantern";
  }
  addFuel = (amount: number) => {
    this.fuel += amount;
  };

  coEquippable = (other: Light): boolean => {
    return !(
      other instanceof Candle ||
      other instanceof Torch ||
      other instanceof Lantern
    );
  };

  setRadius = () => {
    this.wielder.sightRadius = Math.min(this.fuel / 4 + 3, 7);
  };

  toggleEquip = () => {
    if (this.fuel > 0) {
      this.equipped = !this.equipped;
      if (this.isIgnited()) this.setRadius();
      else this.resetRadius();
    } else
      this.wielder.game.pushMessage(
        "I'll need some fuel before I can use this"
      );
  };

  getDescription = () => {
    const percentage = Math.round((this.fuel / this.fuelCap) * 100);
    return `LANTERN - Fuel: ${percentage}%, Capacity: ${this.fuelCap / 50}`;
  };
}
