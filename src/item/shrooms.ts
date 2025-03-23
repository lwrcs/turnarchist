import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";

export class Shrooms extends Item {
  static itemName = "mushrooms";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 6;
    this.tileY = 0;

    this.stackable = true;
  }

  getDescription = (): string => {
    return "SHROOMS\nI don't think I should eat these...";
  };
}
