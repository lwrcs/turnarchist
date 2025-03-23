import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";

export class GreenPotion extends Usable {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 7;
    this.tileY = 0;
    this.offsetY = -0.3;
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  getDescription = () => {
    return "GREEN POTION\nRestores 1 heart";
  };
}
