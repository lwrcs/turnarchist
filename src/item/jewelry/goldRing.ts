import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";
import { EmeraldRing } from "./emeraldRing";
import { ZirconRing } from "./ZirconRing";
import { AmberRing } from "./amberRing";
import { GarnetRing } from "./garnetRing";

export class GoldRing extends Equippable {
  static itemName = "gold ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 19;
    this.tileY = 2;
    this.name = GoldRing.itemName;
    this.stackable = false;
    this.description = "Embed a gem within this ring to imbue it with magic.";
  }

  embed = (player: Player, gem: Item) => {
    player.inventory.subtractItem(gem, 1);
    player.inventory.removeItem(this);
    switch (gem.name) {
      case "emerald":
        player.inventory.addItem(new EmeraldRing(this.level, this.x, this.y));
        break;
      case "zircon":
        player.inventory.addItem(new ZirconRing(this.level, this.x, this.y));
        break;
      case "amber":
        player.inventory.addItem(new AmberRing(this.level, this.x, this.y));
        break;
      case "garnet":
        player.inventory.addItem(new GarnetRing(this.level, this.x, this.y));
        break;
    }
    this.level.game.pushMessage(`You embed the gem into the ring.`);
  };
}
