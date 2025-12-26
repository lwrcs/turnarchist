import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class ChestPlate extends Equippable {
  static itemName = "chest plate";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    // Reuse existing armor tile for now (until we assign unique art).
    this.tileX = 5;
    this.tileY = 0;
    this.stackable = false;
    this.name = ChestPlate.itemName;
    this.description = "Reduces front-facing attacks by half.";
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof ChestPlate) return false;
    return true;
  };
}
