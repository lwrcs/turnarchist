import { Entity } from "../entity/entity";
import { Armor } from "./armor";
import { BlueGem } from "./bluegem";
import { Candle } from "./candle";
import { Coin } from "./coin";
import { GreenGem } from "./greengem";
import { Heart } from "./heart";
import { Item } from "./item";
import { RedGem } from "./redgem";
import { WeaponFragments } from "./weaponFragments";
import { Spear } from "../weapon/spear";
import { Warhammer } from "../weapon/warhammer";
import { DualDagger } from "../weapon/dualdagger";
import { WeaponPoison } from "./weaponPoison";
import { WeaponBlood } from "./weaponBlood";
import { Gold } from "./gold";
import { Stone } from "./stone";
import { Pickaxe } from "../weapon/pickaxe";
import { Hammer } from "./hammer";
import { Coal } from "./coal";
import { Torch } from "./torch";
import { Lantern } from "./lantern";
import { Spellbook } from "../weapon/spellbook";
import { SpellbookPage } from "./spellbookPage";
import { Backpack } from "./backpack";
import { BombItem } from "./bombItem";
import { Greataxe } from "../weapon/greataxe";
import { Random } from "../random";
import { Game } from "../game";

interface Drop {
  itemType: string;
  dropRate: number; // 1/x chance of dropping
  category: string[];
  minDepth?: number;
}

export const ItemTypeMap: { [key: string]: typeof Item } = {
  dualdagger: DualDagger,
  warhammer: Warhammer,
  spear: Spear,
  spellbook: Spellbook,
  greataxe: Greataxe,

  armor: Armor,

  pickaxe: Pickaxe,
  hammer: Hammer,

  heart: Heart,
  weaponpoison: WeaponPoison,
  weaponblood: WeaponBlood,

  coin: Coin,

  weaponfragments: WeaponFragments,
  spellbookPage: SpellbookPage,

  backpack: Backpack,

  candle: Candle,
  torch: Torch,
  lantern: Lantern,

  redgem: RedGem,
  bluegem: BlueGem,
  greengem: GreenGem,
  gold: Gold,
  stone: Stone,
  coal: Coal,
  bomb: BombItem,
};

export class DropTable {
  static drops: Drop[] = [
    // Weapons - Higher numbers = rarer
    { itemType: "dualdagger", dropRate: 1000, category: ["weapon", "melee"] },
    { itemType: "warhammer", dropRate: 500, category: ["weapon", "melee"] },
    { itemType: "spear", dropRate: 500, category: ["weapon", "melee"] },
    { itemType: "spellbook", dropRate: 500, category: ["weapon", "magic"] },
    { itemType: "greataxe", dropRate: 1000, category: ["weapon", "melee"] },

    // Equipment
    { itemType: "armor", dropRate: 350, category: ["equipment"] },

    // Tools
    { itemType: "pickaxe", dropRate: 100, category: ["tool"] },
    { itemType: "hammer", dropRate: 50, category: ["tool"] },

    // Consumables
    { itemType: "heart", dropRate: 20, category: ["consumable"] },
    { itemType: "weaponpoison", dropRate: 100, category: ["consumable"] },
    { itemType: "weaponblood", dropRate: 100, category: ["consumable"] },

    // Common items
    { itemType: "coin", dropRate: 1, category: ["coin"] }, // Always drops

    // Crafting materials
    {
      itemType: "weaponfragments",
      dropRate: 100,
      category: ["consumable", "melee"],
    },
    {
      itemType: "spellbookPage",
      dropRate: 100,
      category: ["consumable", "magic"],
    },

    // Upgrades
    { itemType: "backpack", dropRate: 100, category: ["upgrade"] },

    // Light sources
    { itemType: "candle", dropRate: 100, category: ["light"] },
    { itemType: "torch", dropRate: 250, category: ["light"] },
    { itemType: "lantern", dropRate: 500, category: ["light"] },

    // Gems and minerals
    { itemType: "redgem", dropRate: 200, category: ["gem", "resource"] },
    { itemType: "bluegem", dropRate: 200, category: ["gem", "resource"] },
    { itemType: "greengem", dropRate: 200, category: ["gem", "resource"] },
    { itemType: "gold", dropRate: 200, category: ["resource"] },
    { itemType: "stone", dropRate: 200, category: ["resource"] },
    {
      itemType: "coal",
      dropRate: 100,
      category: ["fuel", "lantern", "resource", "light"],
    },
    { itemType: "bomb", dropRate: 100, category: ["bomb", "weapon"] },
  ];

  static getDrop = (
    entity: Entity,
    useCategory: string[] = [],
    force: boolean = false,
    increaseDepth: number = 0,
  ) => {
    if (entity.cloned) return;
    const currentDepth = entity.room.depth + increaseDepth;
    const dropChance = entity.dropChance || 1;

    // Skip initial drop chance check if forced
    if (!force && dropChance > 1 && Math.random() > 1 / dropChance) {
      return null;
    }

    // Filter eligible drops by depth
    let eligibleDrops = this.drops.filter(
      (drop) => drop.minDepth === undefined || drop.minDepth <= currentDepth,
    );

    // Filter by categories or specific items if provided
    if (useCategory.length > 0) {
      eligibleDrops = eligibleDrops.filter(
        (drop) =>
          useCategory.includes(drop.itemType) || // Match specific item
          drop.category.some((cat) => useCategory.includes(cat)), // Match category
      );
    }

    // Handle case with no eligible drops
    if (eligibleDrops.length === 0) {
      return null;
    }

    // Try to drop an item based on drop rates
    for (const drop of eligibleDrops) {
      if (Math.random() < 1 / drop.dropRate) {
        this.addNewItem(drop.itemType, entity);
        return;
      }
    }

    // Force drop the most common item if needed
    if (force && eligibleDrops.length > 0) {
      const mostCommonDrop = eligibleDrops.reduce((prev, curr) =>
        prev.dropRate < curr.dropRate ? prev : curr,
      );
      this.addNewItem(mostCommonDrop.itemType, entity);
    }

    return null;
  };

  static addNewItem = (itemType: string, entity: Entity): void => {
    const ItemClass = ItemTypeMap[itemType];
    if (!ItemClass) {
      console.error(`Item type "${itemType}" is not recognized.`);
      return;
    }
    console.log(
      `Creating new item of type: ${itemType}, class: ${ItemClass.name}`,
    );
    entity.drop = ItemClass.add(entity.room, entity.x, entity.y);
    if (entity.drop.name === "coin") {
      // Create right-skewed distribution for coins (1-15 common, up to 100 rare)
      entity.drop.stack = Math.floor(Math.pow(Math.random(), 3) * 93 + 7);
    }
  };
}
