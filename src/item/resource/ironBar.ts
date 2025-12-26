import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { GoldRing } from "../jewelry/goldRing";
import { Sound } from "../../sound/sound";
import { DivingHelmet } from "../divingHelmet";
import { Backplate } from "../backplate";
import { Gauntlets } from "../gauntlets";
import { ShoulderPlates } from "../shoulderPlates";
import { ChestPlate } from "../chestPlate";

export class IronBar extends Item {
  static itemName = "iron bar";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 16;
    this.tileY = 0;
    this.name = IronBar.itemName;
    this.stackable = true;
    this.description = "A bar of iron. Hit it with a hammer to smith armor.";
  }

  smith = (player: Player) => {
    const craft = (label: string, item: Item) => {
      player.inventory.subtractItem(this, 1);
      player.inventory.addItem(item);
      this.level.game.pushMessage(`You hammer the iron bar into ${label}.`);
      Sound.playSmith();
    };

    player.menu.openSelectionMenu({
      title: "Smith armor",
      options: [
        {
          label: "Chest plate",
          onSelect: () =>
            craft("a chest plate", new ChestPlate(this.level, this.x, this.y)),
        },
        {
          label: "Backplate",
          onSelect: () =>
            craft("a backplate", new Backplate(this.level, this.x, this.y)),
        },
        {
          label: "Shoulder plates",
          onSelect: () =>
            craft(
              "shoulder plates",
              new ShoulderPlates(this.level, this.x, this.y),
            ),
        },
        {
          label: "Gauntlets",
          onSelect: () =>
            craft("gauntlets", new Gauntlets(this.level, this.x, this.y)),
        },
        {
          label: "Diving helmet",
          onSelect: () =>
            craft(
              "a diving helmet",
              new DivingHelmet(this.level, this.x, this.y),
            ),
        },
      ],
    });
  };
}
