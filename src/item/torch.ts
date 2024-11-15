import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Lantern } from "./lantern";
import { Light } from "./light";

export class Torch extends Light {
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
