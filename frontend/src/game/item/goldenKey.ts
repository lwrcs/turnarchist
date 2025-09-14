import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room/room";

export class GoldenKey extends Equippable {
  static itemName = "goldenKey";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 6;
    this.tileY = 0;
    this.name = "goldenKey";
  }

  getDescription = (): string => {
    return "GOLD KEY\nA heavy gold key.";
  };
}
