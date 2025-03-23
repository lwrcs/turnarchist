import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";

export class Heart extends Usable {
  static itemName = "health potion";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 8;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = Heart.itemName;
    this.description = "restores 1 health";
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 1);
      if (this.level.game.rooms[player.levelID] === this.level.game.room)
        Sound.heal();
      player.inventory.removeItem(this);
    }

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };
}
