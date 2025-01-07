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

interface Drop {
  itemType: string;
  dropWeight: number;
  category: string[];
  minDepth?: number;
}

export const ItemTypeMap: { [key: string]: typeof Item } = {
  dualdagger: DualDagger,
  warhammer: Warhammer,
  spear: Spear,
  spellbook: Spellbook,

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
    // Weapons
    { itemType: "dualdagger", dropWeight: 1, category: ["weapon", "melee"] },
    { itemType: "warhammer", dropWeight: 2, category: ["weapon", "melee"] },
    { itemType: "spear", dropWeight: 5, category: ["weapon", "melee"] },
    { itemType: "spellbook", dropWeight: 1, category: ["weapon", "magic"] },

    // Equipment
    { itemType: "armor", dropWeight: 8, category: ["equipment"] },

    // Tools
    { itemType: "pickaxe", dropWeight: 3, category: ["tool"] },
    { itemType: "hammer", dropWeight: 3, category: ["tool"] },

    // Consumables
    { itemType: "heart", dropWeight: 5, category: ["consumable"] },
    { itemType: "weaponpoison", dropWeight: 1, category: ["consumable"] },
    { itemType: "weaponblood", dropWeight: 1, category: ["consumable"] },

    { itemType: "coin", dropWeight: 100, category: ["coin"] },

    {
      itemType: "weaponfragments",
      dropWeight: 5,
      category: ["consumable", "melee"],
    },
    {
      itemType: "spellbookPage",
      dropWeight: 2,
      category: ["consumable", "magic"],
    },

    // Upgrades
    { itemType: "backpack", dropWeight: 5, category: ["upgrade"] },

    // Light sources
    { itemType: "candle", dropWeight: 10, category: ["light"] },
    { itemType: "torch", dropWeight: 5, category: ["light"] },
    { itemType: "lantern", dropWeight: 2, category: ["light"] },

    // Gems and minerals
    { itemType: "redgem", dropWeight: 5, category: ["gem", "resource"] },
    { itemType: "bluegem", dropWeight: 5, category: ["gem", "resource"] },
    { itemType: "greengem", dropWeight: 5, category: ["gem", "resource"] },
    { itemType: "gold", dropWeight: 5, category: ["gem", "resource"] },
    { itemType: "stone", dropWeight: 5, category: ["gem", "resource"] },
    {
      itemType: "coal",
      dropWeight: 15,
      category: ["fuel", "lantern", "resource"],
    },
    { itemType: "bomb", dropWeight: 30, category: ["bomb", "weapon"] },
  ];

  static getDrop = (
    entity: Entity,
    uniqueTable: boolean = false,
    useCategory: string[] = ["coin"],
    force: boolean = false,
    currentDepth: number = 0,
  ) => {
    let filteredDropsByCategory: Drop[] = [];
    let filteredDropsByItem: Drop[] = [];
    let filteredDropsByDepth: Drop[] = [];

    const allCategories = Array.from(
      new Set(this.drops.flatMap((drop) => drop.category)),
    );
    const allItemTypes = Object.keys(ItemTypeMap);

    const allDepth = this.drops.map((drop) => drop.minDepth);

    // Separate categories and specific item names from useCategory
    const categories = useCategory.filter((cat) => allCategories.includes(cat));
    const specificItems = useCategory.filter((item) =>
      allItemTypes.includes(item),
    );
    const itemsByDepth = this.drops.filter(
      (drop) => drop.minDepth === undefined || drop.minDepth <= currentDepth,
    );

    // Get drops from specified categories
    if (categories.length > 0) {
      filteredDropsByCategory = itemsByDepth.filter((drop) =>
        drop.category.some((cat) => categories.includes(cat)),
      );
    }

    // Get specific drops by item name
    if (specificItems.length > 0) {
      filteredDropsByItem = itemsByDepth.filter((drop) =>
        specificItems.includes(drop.itemType),
      );
    }

    // Combine and remove duplicates
    const combinedDropsMap: { [key: string]: Drop } = {};

    filteredDropsByCategory.forEach((drop) => {
      combinedDropsMap[drop.itemType] = drop;
    });

    filteredDropsByItem.forEach((drop) => {
      combinedDropsMap[drop.itemType] = drop;
    });

    let combinedDrops = Object.values(combinedDropsMap);

    // If no categories or specific items matched, use items by depth
    if (combinedDrops.length === 0) {
      combinedDrops = itemsByDepth;
    }

    if (combinedDrops.length === 0) {
      if (force) {
        combinedDrops = itemsByDepth;
        if (combinedDrops.length === 0) return null;
      } else return null;
    }

    const totalWeight = combinedDrops.reduce(
      (acc, drop) => acc + drop.dropWeight,
      0,
    );

    const randomWeight = Math.floor(Math.random() * totalWeight);

    let cumulativeWeight = 0;
    for (const drop of combinedDrops) {
      cumulativeWeight += drop.dropWeight;

      if (randomWeight <= cumulativeWeight) {
        this.addNewItem(drop.itemType, entity);
        return;
      }
    }

    if (force && combinedDrops.length > 0) {
      this.addNewItem(combinedDrops[0].itemType, entity);
      return;
    }

    return null;
  };

  static addNewItem = (itemType: string, entity: Entity): void => {
    const ItemClass = ItemTypeMap[itemType];
    if (!ItemClass) {
      console.error(`Item type "${itemType}" is not recognized.`);
      return;
    }
    entity.drop = ItemClass.add(entity.room, entity.x, entity.y);
    //console.log(
    //  `Drop for ${entity.constructor.name}:`,
    //  entity.drop.constructor.name,
    //);
  };
}
