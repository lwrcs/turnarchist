import { Room } from "../room/room";
import { Equippable } from "./equippable";

export class Backplate extends Equippable {
  static itemName = "backplate";
  static examineText = "A backplate. Watch your back—literally.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    // Reuse the existing armor tile for now (requested).
    this.tileX = 10;
    this.tileY = 4;
    this.stackable = false;
    this.name = Backplate.itemName;
    this.description = "Blocks damage from behind based on your facing.";
  }

  coEquippable = (other: Equippable): boolean => {
    // Only allow one backplate.
    if (other instanceof Backplate) return false;
    return true;
  };
}
