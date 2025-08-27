import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "./usable";
import { Sound } from "../../sound/sound";

export class Fish extends Usable {
  static itemName = "fish";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 5;
    this.tileY = 2;

    this.stackable = true;
    this.animateToInventory = true;
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 1);
      Sound.playEat();
      if (this.stackCount > 1) {
        this.stackCount--;
      } else player.inventory.removeItem(this);
      player.game.pushMessage("You eat the fish and feel better.");
    }
  };

  getDescription = (): string => {
    return "FISH\nLooks spiky.";
  };
}
