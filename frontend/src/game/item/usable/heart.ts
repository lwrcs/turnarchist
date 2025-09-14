import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";

export class Heart extends Usable {
  static itemName = "health potion";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 8;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = Heart.itemName;
    this.stackable = true;
    this.description = "restores 1 health";
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 1);
      if (this.level.game.rooms[player.levelID] === this.level.game.room)
        Sound.heal();
      if (this.stackCount > 1) {
        this.stackCount--;
      } else player.inventory.removeItem(this);
      player.game.pushMessage("You drink the health potion.");
    }
  };
}
