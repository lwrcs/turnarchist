import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class Backplate extends Equippable {
  static itemName = "backplate";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    // Reuse the existing armor tile for now (requested).
    this.tileX = 5;
    this.tileY = 0;
    this.stackable = false;
    this.name = Backplate.itemName;
    this.description = "Blocks damage from behind based on your facing.";
  }

  outline = () => {
    return {
      color: "#639bff", // blue
      opacity: 0.5,
      offset: 1,
      manhattan: true,
    };
  };

  coEquippable = (other: Equippable): boolean => {
    // Only allow one backplate.
    if (other instanceof Backplate) return false;
    return true;
  };
}


