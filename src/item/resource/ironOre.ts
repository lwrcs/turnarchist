import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldBar } from "./goldBar";
import { Sound } from "../../sound/sound";
import { IronBar } from "./ironBar";

export class IronOre extends Item {
  static itemName = "iron ore";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 16;
    this.tileY = 2;
    this.name = IronOre.itemName;
    this.stackable = true;
    this.description = "Some iron ore";
  }

  smelt = (player: Player) => {
    if (player.inventory.isFull()) {
      this.level.game.pushMessage(
        `You don't have enough space in your inventory to smelt the iron ore.`,
      );
      return;
    }
    if (this.stackCount >= 3) {
      player.inventory.subtractItem(this, 3);
      player.inventory.addItem(new IronBar(this.level, this.x, this.y));
      Sound.playSmith();
      this.level.game.pushMessage(`You smelt the iron ore into a iron bar.`);
    }
  };
}
