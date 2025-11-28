import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";

export class QuarterStaff extends Weapon {
  static itemName = "quarterstaff";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 4;
    this.damage = 1;
    this.name = QuarterStaff.itemName;
    this.useCost = 1;
    this.degradeable = false;
    this.knockbackDistance = 1;
  }

  hitSound = () => {
    Sound.swing();
    Sound.hit();
  };
}
