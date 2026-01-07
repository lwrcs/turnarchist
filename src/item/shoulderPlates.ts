import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class ShoulderPlates extends Equippable {
  static itemName = "shoulder plates";
  static examineText = "Shoulder plates. No more cheap shots.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    // Reuse existing armor tile for now (until we assign unique art).
    this.tileX = 5;
    this.tileY = 0;
    this.stackable = false;
    this.name = ShoulderPlates.itemName;
    this.description = "Reduces diagonal attacks by half.";
  }

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof ShoulderPlates) return false;
    return true;
  };
}
