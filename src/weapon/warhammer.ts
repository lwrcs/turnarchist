import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";

export class Warhammer extends Weapon {
  static itemName = "warhammer";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 2;
    this.damage = 3;
    this.name = "warhammer";
    this.durability = 25;
    this.durabilityMax = 25;
  }

  hitSound = () => {
    if (
      this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
    )
      Sound.hit();
    Sound.playGore();
  };
}
