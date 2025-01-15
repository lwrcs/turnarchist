import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { Direction } from "../game";

export class Warhammer extends Weapon {
  static itemName = "warhammer";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 2;
    this.damage = 3;
    this.name = "warhammer";
    this.durability = 25;
    this.durabilityMax = 25;
    this.hitDelay = 225;
  }

  hitSound = () => {
    Sound.hit();
    Sound.playWarHammer();
  };
  shakeScreen = () => {
    this.wielder.slowMotionEnabled = true;

    setTimeout(() => {
      this.wielder.slowMotionEnabled = false;
      //this.hitSound();
      switch (this.wielder.direction) {
        case Direction.DOWN:
          this.game.shakeScreen(0, -30, false);
          break;
        case Direction.UP:
          this.game.shakeScreen(0, -30, false);
          break;
        case Direction.LEFT:
          this.game.shakeScreen(-5, -30, false);
          break;
        case Direction.RIGHT:
          this.game.shakeScreen(5, -30, false);
          break;
      }
    }, this.hitDelay);
  };
}
