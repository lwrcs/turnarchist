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
  static itemName = "lantern";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 0;
    this.tileX = 29;
    this.tileY = 0;
    this.fuelCap = 250;
    this.name = "lantern";
    this.canRefuel = true;
    this.maxBrightness = 3;
    this.minBrightness = 2;
    this.radius = 7;
    this.broken = this.fuel <= 0 ? true : false;
  }

  getDescription = () => {
    const percentage = Math.round((this.fuel / this.fuelCap) * 100);
    return `LANTERN - Fuel: ${percentage}%, Capacity: ${this.fuelCap / 50}`;
  };
}
