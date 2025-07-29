import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";

export class AmberRing extends Equippable {
  static itemName = "amber ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 14;
    this.tileY = 2;
    this.name = AmberRing.itemName;
    this.stackable = false;
    this.description = "A ring of amber";
  }
}
