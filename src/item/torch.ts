import { Room } from "../room";

import { Light } from "./light";

export class Torch extends Light {
  static itemName = "torch";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.name = "torch";
    this.fuelCap = 500;
    this.fuel = 500;
    this.radius = 6;
  }
}
