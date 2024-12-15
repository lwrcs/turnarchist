import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Room } from "../room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";

export class Gold extends Item {
  static itemName = "gold";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 18;
    this.tileY = 0;
    this.name = Gold.itemName;
    this.stackable = true;
    this.description = "A bar of gold";
  }
}
