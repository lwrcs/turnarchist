import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";

export class Stone extends Item {
  static itemName = "stones";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 15;
    this.tileY = 0;

    this.stackable = true;
  }

  getDescription = (): string => {
    return "STONE\nSome fragments of stone.";
  };
}
