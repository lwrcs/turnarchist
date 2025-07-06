import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";
import { EmeraldRing } from "./emeraldRing";

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

    player.inventory.addItem(new EmeraldRing(this.level, this.x, this.y));
    this.level.game.pushMessage(`You embed the gem into the ring.`);
  };
}
