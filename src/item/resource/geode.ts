import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { RedGem } from "./redgem";
import { BlueGem } from "./bluegem";
import { GreenGem } from "./greengem";
import { Inventory } from "../../inventory/inventory";
import { Utils } from "../../utility/utils";
export class Geode extends Item {
  static itemName = "geode";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 15;
    this.tileY = 2;
    this.name = Geode.itemName;

    this.stackable = false;
  }

  getDescription = (): string => {
    return "GEODE\nWhen in doubt hit it with a hammer.";
  };

  split = (inventory: Inventory) => {
    if (inventory.isFull()) {
      this.level.game.pushMessage(
        `You don't have enough space in your inventory to split the geode.`,
      );
    } else {
      const numGems = Math.min(1, Utils.randomNormalInt(1, 3));
      let gemTypes = [BlueGem, RedGem, GreenGem];
      let gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      this.level.game.pushMessage(
        `You split the geode and find ${numGems} ${gemType.itemName}.`,
      );

      for (let i = 0; i < numGems; i++) {
        inventory.addItem(new gemType(this.level, this.x, this.y));
      }
      inventory.removeItem(this);
    }
  };
}
