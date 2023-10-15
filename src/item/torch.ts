import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Lantern } from "./lantern";
import { Light } from "./light";

export class Torch extends Light {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
  }

  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.equipped) {
      this.wielder.sightRadius = 12;
    } else this.wielder.sightRadius = this.wielder.defaultSightRadius;
  };

  coEquippable = (other: Light): boolean => {
    return !(
      other instanceof Candle ||
      other instanceof Torch ||
      other instanceof Lantern
    );
  };
  
  getDescription = () => {
    return "TORCH";
  };
}
