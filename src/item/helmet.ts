import { Room } from "../room/room";
import { Equippable } from "./equippable";
import { DivingHelmet } from "./divingHelmet";

export class Helmet extends Equippable {
  static itemName = "helmet";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 20;
    this.tileY = 4;
    this.stackable = false;
    this.name = Helmet.itemName;
    this.degradeable = false;
  }

  getDescription = (): string => "HELMET\nA sturdy helmet.";

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Helmet) return false;
    if (other instanceof DivingHelmet) return false;
    return true;
  };
}
