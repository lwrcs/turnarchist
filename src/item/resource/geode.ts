import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../gameConstants";
import { RedGem } from "./redgem";
import { BlueGem } from "./bluegem";
import { GreenGem } from "./greengem";
import { Inventory } from "../../inventory/inventory";
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
    if (Math.random() < 0.2) {
      this.level.game.pushMessage(
        `You split the geode but it's stone all the way through.`,
      );
    } else if (inventory.isFull()) {
      this.level.game.pushMessage(
        `You don't have enough space in your inventory to split the geode.`,
      );
    } else {
      const numGems = Math.floor(Math.random() * Math.random() * 5) + 1;
      this.level.game.pushMessage(
        `You split the geode and it's full of shiny gems!`,
      );

      let gemTypes = [BlueGem, RedGem, GreenGem];
      let gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
      for (let i = 0; i < numGems; i++) {
        inventory.addItem(new gemType(this.level, this.x, this.y));
      }
      inventory.removeItem(this);
    }
  };
}
