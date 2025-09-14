import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "../usable/usable";
import { GoldRing } from "../jewelry/goldRing";

export class GreenGem extends Usable {
  static itemName = "emerald";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 11;
    this.tileY = 0;
    this.name = GreenGem.itemName;
    this.canUseOnOther = true;

    this.stackable = true;
  }

  useOnOther = (player: Player, other: Item) => {
    if (other.name === "gold ring") {
      let goldRing = other as GoldRing;
      goldRing.embed(player, this);
    }
  };

  getDescription = (): string => {
    return "An emerald gem. Embed it into a gold ring to imbue it with magic.";
  };
}
