import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldRing } from "../jewelry/goldRing";
import { Sound } from "../../sound/sound";
import { DivingHelmet } from "../divingHelmet";

export class IronBar extends Item {
  static itemName = "iron bar";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 16;
    this.tileY = 0;
    this.name = IronBar.itemName;
    this.stackable = true;
    this.description =
      "A bar of iron. Hit it with a hammer to make a diving helmet.";
  }

  smith = (player: Player) => {
    player.inventory.subtractItem(this, 1);
    player.inventory.addItem(new DivingHelmet(this.level, this.x, this.y));
    this.level.game.pushMessage(
      `You hammer the iron bar into a diving helmet.`,
    );

    Sound.playSmith();
  };
}
