import { Item } from "../item";
import { Player } from "../../player/player";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { DivingHelmet } from "../divingHelmet";
import { Backplate } from "../backplate";
import { Gauntlets } from "../gauntlets";
import { ShoulderPlates } from "../shoulderPlates";
import { ChestPlate } from "../chestPlate";

export type IronSmithRecipe =
  | "chestPlate"
  | "backplate"
  | "shoulderPlates"
  | "gauntlets"
  | "divingHelmet";

interface IronSmithRecipeDef {
  label: string;
  cost: number;
  create: (room: Room, x: number, y: number) => Item;
}

const IRON_SMITH_RECIPES: Record<IronSmithRecipe, IronSmithRecipeDef> = {
  chestPlate: {
    label: "a chest plate",
    cost: 4,
    create: (room, x, y) => new ChestPlate(room, x, y),
  },
  backplate: {
    label: "a backplate",
    cost: 3,
    create: (room, x, y) => new Backplate(room, x, y),
  },
  shoulderPlates: {
    label: "shoulder plates",
    cost: 2,
    create: (room, x, y) => new ShoulderPlates(room, x, y),
  },
  gauntlets: {
    label: "gauntlets",
    cost: 2,
    create: (room, x, y) => new Gauntlets(room, x, y),
  },
  divingHelmet: {
    label: "a diving helmet",
    cost: 2,
    create: (room, x, y) => new DivingHelmet(room, x, y),
  },
};

// Applies a recipe in one synchronous step. Called from the action processor for
// both record-time (via the smith menu's onSelect) and replay-time execution, so
// the iron-bar → armor crafting is fully captured by a single SmithRecipe action.
export const applyIronSmithRecipe = (
  player: Player,
  recipe: string,
): boolean => {
  const def = (IRON_SMITH_RECIPES as Record<string, IronSmithRecipeDef>)[recipe];
  if (!def) return false;
  const bar = player.inventory.hasItem(IronBar);
  if (!bar) return false;
  if ((bar.stackCount ?? 0) < def.cost) return false;

  player.inventory.subtractItem(bar, def.cost);
  const room = player.getRoom();
  player.inventory.addItem(def.create(room, player.x, player.y));
  player.game.pushMessage(`You hammer the iron bar into ${def.label}.`);
  Sound.playSmith();
  return true;
};

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

    const barsLabel = (n: number) => `(${n} iron bar${n === 1 ? "" : "s"})`;

    const bars = getAvailableBars();

    const optionForRecipe = (
      recipe: IronSmithRecipe,
      labelPrefix: string,
    ) => ({
      label: `${labelPrefix} ${barsLabel(IRON_SMITH_RECIPES[recipe].cost)}`,
      enabled: bars >= IRON_SMITH_RECIPES[recipe].cost,
      onSelect: () =>
        player.actionProcessor.process({ type: "SmithRecipe", recipe }),
    });

    player.menu.openSelectionMenu({
      title: "Smith armor",
      style: "overlay",
      options: [
        optionForRecipe("chestPlate", "Chest plate"),
        optionForRecipe("backplate", "Backplate"),
        optionForRecipe("shoulderPlates", "Shoulder plates"),
        optionForRecipe("gauntlets", "Gauntlets"),
        optionForRecipe("divingHelmet", "Diving helmet"),
      ],
    });
  };
}
