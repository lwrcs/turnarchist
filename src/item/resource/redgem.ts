import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../gameConstants";

export class RedGem extends Item {
  static itemName = "garnet";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.name = RedGem.itemName;

    this.stackable = true;
  }

  getDescription = (): string => {
    return "GARNET";
  };
}
