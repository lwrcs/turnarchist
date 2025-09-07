import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "./usable";
import { Sound } from "../../sound/sound";

export class Shrooms extends Usable {
  static itemName = "mushrooms";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 6;
    this.tileY = 0;

    this.stackable = true;
  }

  onUse = (player: Player) => {
    if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 0.5);
      Sound.playEat();
      if (this.stackCount > 1) {
        this.stackCount--;
      } else player.inventory.removeItem(this);
      player.game.pushMessage("You eat the mushrooms and feel better.");
    }
  };

  getDescription = (): string => {
    return "SHROOMS\nI don't think I should eat these...";
  };
}
