import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "./usable";

export class Apple extends Usable {
  static itemName = "apple";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 6;
    this.tileY = 0;

    this.stackable = true;
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 0.5);
      if (this.stackCount > 1) {
        this.stackCount--;
      } else player.inventory.removeItem(this);
      player.game.pushMessage("You eat the apple and feel better.");
    }
  };

  getDescription = (): string => {
    return "APPLE\nAppears nutritious.";
  };
}
