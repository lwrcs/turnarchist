import { Weapon } from "./weapon";
import { Room } from "../room/room";
import { Sound } from "../sound";
import { Direction } from "../game";

export class Warhammer extends Weapon {
  static itemName = "warhammer";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 2;
    this.damage = 2;
    this.name = "warhammer";
    this.hitDelay = 225;
    this.useCost = 2;
  }

  hitSound = () => {
    Sound.hit();
    Sound.playWarHammer();
  };

  shakeScreen = () => {
    this.wielder.beginSlowMotion();

    setTimeout(() => {
      this.wielder.endSlowMotion();
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
