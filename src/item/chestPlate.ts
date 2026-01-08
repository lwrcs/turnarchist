import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class ChestPlate extends Equippable {
  static itemName = "chest plate";
  static examineText = "A chest plate. Solid where it counts.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 10;
    this.tileY = 2;
    this.stackable = false;
    this.name = ChestPlate.itemName;
    this.description = "Reduces front-facing attacks by half.";
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof ChestPlate) return false;
    return true;
  };
}
