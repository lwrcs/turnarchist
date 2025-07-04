import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";

export class Hourglass extends Usable {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 0;
    this.tileY = 2;
    this.offsetY = -0.3;
    this.durability = 30;
    this.durabilityMax = 30;
  }

  onUse = (player: Player) => {
    if (this.broken) return;
    player.stall();
    player.game.pushMessage("turn skipped");
    this.durability -= 1;
    if (this.durability <= 0) {
      this.broken = true;
    }
    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  getDescription = () => {
    return "HOURGLASS\nSkips a turn";
  };
}
