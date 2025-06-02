import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";

export class BlueGem extends Item {
  static itemName = "zircon";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 13;
    this.tileY = 0;
    this.name = BlueGem.itemName;

    this.stackable = true;
  }

  getDescription = (): string => {
    return "ZIRCON";
  };
}
