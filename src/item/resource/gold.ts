import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldBar } from "./goldBar";
import { Sound } from "../../sound/sound";

export class Gold extends Item {
  static itemName = "gold";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 18;
    this.tileY = 0;
    this.name = Gold.itemName;
    this.stackable = true;
    this.description = "A bar of gold";
  }

  smelt = (player: Player) => {
    player.inventory.removeItem(this);
    player.inventory.addItem(new GoldBar(this.level, this.x, this.y));
    Sound.playSmith();
  };
}
