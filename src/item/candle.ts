import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Torch } from "./torch";
import { Lantern } from "./lantern";
import { Inventory } from "../inventory";
import { Player } from "../player";
import { Light } from "./light";

export class Candle extends Light {
  static itemName = "candle";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 50; //how many turns before it burns out
    this.tileX = 27;
    this.tileY = 0;
    this.name = "candle";
    this.fuelCap = 50;
    this.radius = 4;
    this.stackable = true;
    this.maxBrightness = 2;
    this.maxBrightness = 0.25;
  }
}
