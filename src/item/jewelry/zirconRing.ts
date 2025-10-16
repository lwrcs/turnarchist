import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";

export class ZirconRing extends Equippable {
  static itemName = "zircon ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 13;
    this.tileY = 2;
    this.name = ZirconRing.itemName;
    this.stackable = false;
    this.description = "A ring of zircon";
  }

  onEquip = () => {
    this.wielder.magicDamageBonus = 1;
    this.level.game.pushMessage("A magic boosting force surrounds you.");
  };

  onUnequip = () => {
    this.wielder.magicDamageBonus = 0;
    this.level.game.pushMessage("The magic boosting force fades away.");
  };

  onDrop = () => {
    this.wielder.magicDamageBonus = 0;
    if (this.equipped) {
      this.level.game.pushMessage("The magic boosting force fades away.");
      this.equipped = false;
    }
  };
}
