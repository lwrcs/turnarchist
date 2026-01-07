import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class Gauntlets extends Equippable {
  static itemName = "gauntlets";
  static examineText = "Gauntlets. Better knuckles, fewer regrets.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    // Reuse existing armor tile for now (until we assign unique art).
    this.tileX = 9;
    this.tileY = 2;
    this.stackable = false;
    this.name = Gauntlets.itemName;
    this.description = "Reduces damage from the sides (not diagonal) by half.";
  }

  coEquippable = (other: Equippable): boolean => {
    // Only allow one gauntlets item equipped at a time.
    if (other instanceof Gauntlets) return false;
    return true;
  };
}
