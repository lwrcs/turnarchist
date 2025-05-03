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
    { itemType: "dualdagger", dropRate: 100, category: ["weapon", "melee"] },
    { itemType: "warhammer", dropRate: 33, category: ["weapon", "melee"] },
    { itemType: "spear", dropRate: 33, category: ["weapon", "melee"] },
    { itemType: "spellbook", dropRate: 100, category: ["weapon", "magic"] },
    { itemType: "greataxe", dropRate: 100, category: ["weapon", "melee"] },

    // Equipment
    { itemType: "armor", dropRate: 12, category: ["equipment"] },

    // Tools
    { itemType: "pickaxe", dropRate: 33, category: ["tool"] },
    { itemType: "hammer", dropRate: 33, category: ["tool"] },

    // Consumables
    { itemType: "heart", dropRate: 20, category: ["consumable"] },
    { itemType: "weaponpoison", dropRate: 100, category: ["consumable"] },
    { itemType: "weaponblood", dropRate: 100, category: ["consumable"] },

    // Common items
    { itemType: "coin", dropRate: 1, category: ["coin"] }, // Always drops

    // Crafting materials
    {
      itemType: "weaponfragments",
      dropRate: 20,
      category: ["consumable", "melee"],
    },
    {
      itemType: "spellbookPage",
      dropRate: 50,
      category: ["consumable", "magic"],
    },

    // Upgrades
    { itemType: "backpack", dropRate: 20, category: ["upgrade"] },

    // Light sources
    { itemType: "candle", dropRate: 10, category: ["light"] },
    { itemType: "torch", dropRate: 20, category: ["light"] },
    { itemType: "lantern", dropRate: 50, category: ["light"] },

    // Gems and minerals
    { itemType: "redgem", dropRate: 20, category: ["gem", "resource"] },
    { itemType: "bluegem", dropRate: 20, category: ["gem", "resource"] },
    { itemType: "greengem", dropRate: 20, category: ["gem", "resource"] },
    { itemType: "gold", dropRate: 20, category: ["gem", "resource"] },
    { itemType: "stone", dropRate: 20, category: ["gem", "resource"] },
    {
      itemType: "coal",
      dropRate: 7,
      category: ["fuel", "lantern", "resource"],
    },
    { itemType: "bomb", dropRate: 10, category: ["bomb", "weapon"] },
  ];

  static getDrop = (
    entity: Entity,
    useCategory: string[] = ["coin"],
    force: boolean = false,
    increaseDepth: number = 0,
  ) => {
    if (entity.cloned) return;
    const currentDepth = entity.room.depth + increaseDepth;
    const dropChance = entity.dropChance || 1;

    console.log(`\n=== Drop Roll for ${entity.constructor.name} ===`);
    console.log(`Initial drop chance: ${((1 / dropChance) * 100).toFixed(1)}%`);

    if (!force && dropChance > 1 && Math.random() > 1 / dropChance) {
      console.log("Failed initial drop chance roll");
      return null;
    }

    console.log(`Categories/Items requested:`, useCategory);
    console.log(`Force:`, force, `Depth:`, currentDepth);

    let filteredDrops: Drop[] = [];

    const allCategories = Array.from(
      new Set(this.drops.flatMap((drop) => drop.category)),
    );
    const allItemTypes = Object.keys(ItemTypeMap);

    // Filter by depth first
    const depthFilteredDrops = this.drops.filter(
      (drop) => drop.minDepth === undefined || drop.minDepth <= currentDepth,
    );

    // Separate categories and specific item names from useCategory
    const categories = useCategory.filter((cat) => allCategories.includes(cat));
    const specificItems = useCategory.filter((item) =>
      allItemTypes.includes(item),
    );

    // Build filtered drops list
    if (categories.length > 0 || specificItems.length > 0) {
      // Filter by categories
      const categoryDrops =
        categories.length > 0
          ? depthFilteredDrops.filter((drop) =>
              drop.category.some((cat) => categories.includes(cat)),
            )
          : [];

      // Filter by specific items
      const itemDrops =
        specificItems.length > 0
          ? depthFilteredDrops.filter((drop) =>
              specificItems.includes(drop.itemType),
            )
          : [];

      // Combine and remove duplicates
      const combinedDropsMap: { [key: string]: Drop } = {};
      [...categoryDrops, ...itemDrops].forEach((drop) => {
        combinedDropsMap[drop.itemType] = drop;
      });

      filteredDrops = Object.values(combinedDropsMap);
    } else {
      filteredDrops = depthFilteredDrops;
    }

    if (filteredDrops.length === 0) {
      console.log("No eligible drops found in filtered list");
      if (force) {
        filteredDrops = depthFilteredDrops;
        if (filteredDrops.length === 0) {
          console.log("No drops available even after force");
          return null;
        }
      } else {
        return null;
      }
    }

    // Sort drops from rarest to most common
    const sortedDrops = [...filteredDrops].sort(
      (a, b) => b.dropRate - a.dropRate,
    );

    console.log(
      "Eligible drops:",
      sortedDrops.map((d) => `${d.itemType} (1/${d.dropRate})`),
    );

    // Try each item in order from rarest to most common
    for (const drop of sortedDrops) {
      const roll = Math.random();
      const threshold = 1 / drop.dropRate;
      console.log(
        `Rolling for ${drop.itemType}: ${roll.toFixed(4)} < ${threshold.toFixed(4)} = ${roll < threshold}`,
      );

      if (roll < threshold) {
        console.log(`Success! Dropping ${drop.itemType}`);
        this.addNewItem(drop.itemType, entity);
        console.log(`Actual item dropped: ${entity.drop?.constructor.name}`);
        console.log(`Clone?: ${entity.cloned}`);

        return;
      }
    }

    // If force is true and no drops occurred, guarantee the most common item
    if (force && sortedDrops.length > 0) {
      const guaranteedDrop = sortedDrops[sortedDrops.length - 1];
      console.log(`Force drop: ${guaranteedDrop.itemType}`);
      this.addNewItem(guaranteedDrop.itemType, entity);
      console.log(
        `Actual forced item dropped: ${entity.drop?.constructor.name}`,
      );
      return;
    }

    console.log("No successful drops");
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
  };
}
