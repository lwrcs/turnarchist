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
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 250; //how many turns before it burns out
    this.tileX = 27;
    this.tileY = 0;
    this.name = "candle";
    this.fuelCap = 250;
    this.maxRadius = 4;
    this.minRadius = 2;
  }

}
