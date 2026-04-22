import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Usable } from "./usable";
import { Sound } from "../../sound/sound";

export class Berries extends Usable {
  static itemName = "berries";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 8;
    this.tileY = 4;
    this.name = Berries.itemName;

    this.stackable = true;
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 0.5);
      Sound.playEat();
      if (this.stackCount > 1) {
        this.stackCount--;
      } else player.inventory.removeItem(this);
      player.game.pushMessage("You eat the berries and feel better.");
    }
  };

  getDescription = (): string => {
    return "BERRIES\nSmall and sweet.";
  };
}
