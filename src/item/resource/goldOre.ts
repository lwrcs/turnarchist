import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldBar } from "./goldBar";
import { Sound } from "../../sound/sound";

export class GoldOre extends Item {
  static itemName = "gold ore";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 18;
    this.tileY = 0;
    this.name = GoldOre.itemName;
    this.stackable = true;
    this.description = "Some gold ore";
  }

  smelt = (player: Player) => {
    if (player.inventory.isFull()) {
      this.level.game.pushMessage(
        `You don't have enough space in your inventory to smelt the gold ore.`,
      );
      return;
    }
    if (this.stackCount >= 3) {
      player.inventory.subtractItem(this, 3);
      player.inventory.addItem(new GoldBar(this.level, this.x, this.y));
      Sound.playSmith();
      this.level.game.pushMessage(`You smelt the gold ore into a gold bar.`);
    }
  };
}
