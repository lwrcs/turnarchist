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
    this.fuelCap = 50;
    this.fuel = 50;
    this.maxRadius = 7;
  }
}
