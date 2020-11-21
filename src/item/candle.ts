import { Item } from "./item";
import { Game } from "../game";
import { Level } from "../level";
import { Equippable } from "./equippable";
import { Torch } from "./torch";
import { Lantern } from "./lantern";

export class Candle extends Equippable {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 27;
    this.tileY = 0;
  }

  coEquippable = (other: Equippable): boolean => {
    return !(other instanceof Candle || other instanceof Torch || other instanceof Lantern);
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.equipped) {
      this.wielder.sightRadius = 9;
    } else this.wielder.sightRadius = this.wielder.defaultSightRadius;
  };

  getDescription = () => {
    return "CANDLE";
  };
}
