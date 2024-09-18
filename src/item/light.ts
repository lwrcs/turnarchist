import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Lantern } from "./lantern";
import { Torch } from "./torch";

export class Light extends Equippable {
    fuel: number;
  fuelCap: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.fuel = 0;
    this.fuelCap = 250;
  }

  ignite = () => {
    if (this.fuel > 0 && this.equipped) {
      return true;
    } else return false;
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.equipped) {
      this.wielder.sightRadius = 12;
    } else this.wielder.sightRadius = this.wielder.defaultSightRadius;
  };

  getDescription = () => {
    return "TORCH";
  };
}