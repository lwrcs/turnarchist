import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";

export class GarnetRing extends Equippable {
  static itemName = "garnet ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 12;
    this.tileY = 2;
    this.name = GarnetRing.itemName;
    this.stackable = false;
    this.description = "A ring of garnet";
  }

  onEquip = () => {
    this.wielder.damageBonus = 1;
    this.level.game.pushMessage("You feel a surge of power in your ring.");
  };

  onUnequip = () => {
    this.wielder.damageBonus = 0;
    this.level.game.pushMessage("The power in your ring fades.");
  };

  onDrop = () => {
    this.wielder.damageBonus = 0;
    if (this.equipped) {
      this.level.game.pushMessage("The power in your ring fades.");
      this.equipped = false;
    }
  };
}
