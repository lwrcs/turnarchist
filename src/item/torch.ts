import { Room } from "../room";

import { Light } from "./light";

export class Torch extends Light {
  static itemName = "torch";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.name = "torch";
    this.fuelCap = 250;
    this.fuel = 250;
    this.radius = 5;
    this.maxBrightness = 2;
    this.minBrightness = 0.75;
  }
}
