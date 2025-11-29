import { Item } from "../item";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { Equippable } from "../equippable";
import { Torch } from "./torch";
import { Lantern } from "./lantern";
import { Inventory } from "../../inventory/inventory";
import { Player } from "../../player/player";
import { Light } from "./light";

export class GlowStick extends Light {
  static itemName = "glow stick";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 100; //how many turns before it burns out
    this.tileX = 27;
    this.tileY = 2;
    this.name = GlowStick.itemName;
    this.fuelCap = 100;
    this.radius = 10;
    this.stackable = true;
    this.maxBrightness = 2;
    //teal blue green rgb 0-255
    this.color = [5, 150, 50];
  }
}
