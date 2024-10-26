import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room";

export class Key extends Item {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 0;
  }

  getDescription = (): string => {
    return "KEY\nAn iron key.";
  };
}
