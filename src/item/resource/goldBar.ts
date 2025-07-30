import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldRing } from "../jewelry/goldRing";
import { Sound } from "../../sound/sound";

export class GoldBar extends Item {
  static itemName = "gold bar";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 18;
    this.tileY = 2;
    this.name = GoldBar.itemName;
    this.stackable = true;
    this.description = "A bar of gold. Hit it with a hammer to make a ring.";
  }

  smith = (player: Player) => {
    player.inventory.subtractItem(this, 1);
    player.inventory.addItem(new GoldRing(this.level, this.x, this.y));
    this.level.game.pushMessage(`You hammer the gold bar into a ring.`);

    Sound.playSmith();
  };
}
