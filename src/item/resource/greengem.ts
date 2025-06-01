import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../gameConstants";

export class GreenGem extends Item {
  static itemName = "peridot";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 11;
    this.tileY = 0;
    this.name = GreenGem.itemName;

    this.stackable = true;
  }

  getDescription = (): string => {
    return "PERIDOT";
  };
}
