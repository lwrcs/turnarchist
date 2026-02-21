import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";

export class QuarterStaff extends Weapon {
  static itemName = "quarterstaff";
  static examineText = "A sturdy staff. Better than bare hands.";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 4;
    this.damage = 1;
    this.name = QuarterStaff.itemName;
    this.useCost = 1;
    this.degradeable = false;
    this.knockbackDistance = 1;
    this.description =
      "Hitting an enemy will push them back 1 tile. Pin them against a wall to instantly kill them.";
  }

  hitSound = () => {
    Sound.swing();
    Sound.hit();
  };
}
