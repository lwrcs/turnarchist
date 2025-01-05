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
  shakeScreen = () => {
    this.wielder.slowMotionEnabled = true;

    if (
      this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
    )
      //this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      setTimeout(() => {
        this.game.shakeScreen(0, -10, false);
        this.wielder.hitY = -3;
        this.wielder.slowMotionEnabled = false;
      }, 150);
  };
}
