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
    const getAvailableBars = (): number => {
      const stack = player.inventory.hasItem(IronBar);
      return stack?.stackCount ?? 0;
    };

    const craft = (label: string, item: Item, costBars: number) => {
      player.inventory.subtractItem(this, costBars);
      player.inventory.addItem(item);
      this.level.game.pushMessage(`You hammer the iron bar into ${label}.`);
      Sound.playSmith();
    };

    const cost: {
      divingHelmet: number;
      shoulderPlates: number;
      chestPlate: number;
      backplate: number;
      gauntlets: number;
    } = {
      divingHelmet: 1,
      shoulderPlates: 1,
      chestPlate: 2,
      backplate: 2,
      gauntlets: 2,
    };

    const barsLabel = (n: number) => `(${n} iron bar${n === 1 ? "" : "s"})`;

    const bars = getAvailableBars();

    player.menu.openSelectionMenu({
      title: "Smith armor",
      style: "overlay",
      options: [
        {
          label: `Chest plate ${barsLabel(cost.chestPlate)}`,
          enabled: bars >= cost.chestPlate,
          onSelect: () =>
            craft(
              "a chest plate",
              new ChestPlate(this.level, this.x, this.y),
              cost.chestPlate,
            ),
        },
        {
          label: `Backplate ${barsLabel(cost.backplate)}`,
          enabled: bars >= cost.backplate,
          onSelect: () =>
            craft(
              "a backplate",
              new Backplate(this.level, this.x, this.y),
              cost.backplate,
            ),
        },
        {
          label: `Shoulder plates ${barsLabel(cost.shoulderPlates)}`,
          enabled: bars >= cost.shoulderPlates,
          onSelect: () =>
            craft(
              "shoulder plates",
              new ShoulderPlates(this.level, this.x, this.y),
              cost.shoulderPlates,
            ),
        },
        {
          label: `Gauntlets ${barsLabel(cost.gauntlets)}`,
          enabled: bars >= cost.gauntlets,
          onSelect: () =>
            craft(
              "gauntlets",
              new Gauntlets(this.level, this.x, this.y),
              cost.gauntlets,
            ),
        },
        {
          label: `Diving helmet ${barsLabel(cost.divingHelmet)}`,
          enabled: bars >= cost.divingHelmet,
          onSelect: () =>
            craft(
              "a diving helmet",
              new DivingHelmet(this.level, this.x, this.y),
              cost.divingHelmet,
            ),
        },
      ],
    });
  };
}
