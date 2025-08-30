import { Entity } from "../entity/entity";
import { Armor } from "./armor";
import { BlueGem } from "./resource/bluegem";
import { Candle } from "./light/candle";
import { Coin } from "./coin";
import { GreenGem } from "./resource/greengem";
import { Heart } from "./usable/heart";
import { Item } from "./item";
import { RedGem } from "./resource/redgem";
import { WeaponFragments } from "./usable/weaponFragments";
import { Spear } from "./weapon/spear";
import { Warhammer } from "./weapon/warhammer";
import { DualDagger } from "./weapon/dualdagger";
import { WeaponPoison } from "./usable/weaponPoison";
import { WeaponBlood } from "./usable/weaponBlood";
import { Gold } from "./resource/gold";
import { Stone } from "./resource/stone";
import { Pickaxe } from "./tool/pickaxe";
import { Hammer } from "./tool/hammer";
import { Coal } from "./resource/coal";
import { Torch } from "./light/torch";
import { Lantern } from "./light/lantern";
import { Spellbook } from "./weapon/spellbook";
import { SpellbookPage } from "./usable/spellbookPage";
import { Backpack } from "./backpack";
import { BombItem } from "./bombItem";
import { Greataxe } from "./weapon/greataxe";
import { Random } from "../utility/random";
import { Game } from "../game";
import { Utils } from "../utility/utils";
import { Geode } from "./resource/geode";
import { Scythe } from "./weapon/scythe";
import { Hourglass } from "./usable/hourglass";
import { ScytheHandle } from "./weapon/scytheHandle";
import { ScytheBlade } from "./weapon/scytheBlade";
import { FishingRod } from "./tool/fishingRod";
import { ShieldRightFragment } from "./weapon/shieldRightFragment";
import { ShieldLeftFragment } from "./weapon/shieldLeftFragment";

interface Drop {
  itemType: string;
  dropRate: number; // 1/x chance of dropping
  category: string[];
  unique?: boolean;
  minDepth?: number;
}

export const ItemTypeMap: { [key: string]: typeof Item } = {
  dualdagger: DualDagger,
  warhammer: Warhammer,
  spear: Spear,
  spellbook: Spellbook,
  greataxe: Greataxe,
  scythe: Scythe,
  hourglass: Hourglass,
  fishingrod: FishingRod,

  scytheblade: ScytheBlade,
  scythehandle: ScytheHandle,
  shieldleftfragment: ShieldLeftFragment,
  shieldrightfragment: ShieldRightFragment,

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
  geode: Geode,
  gold: Gold,
  stone: Stone,
  coal: Coal,
  bomb: BombItem,
};

export class DropTable {
  static drops: Drop[] = [
    // Weapons - Higher numbers = rarer
    {
      itemType: "dualdagger",
      dropRate: 500,
      category: ["weapon", "melee"],
      unique: true,
    },
    {
      itemType: "warhammer",
      dropRate: 250,
      category: ["weapon", "melee"],
      unique: true,
    },
    {
      itemType: "spear",
      dropRate: 150,
      category: ["weapon", "melee"],
      unique: true,
    },
    {
      itemType: "spellbook",
      dropRate: 250,
      category: ["weapon", "magic"],
      unique: true,
    },
    {
      itemType: "greataxe",
      dropRate: 500,
      category: ["weapon", "melee"],
      unique: true,
    },
    {
      itemType: "scythe",
      dropRate: 500,
      category: ["reaper"],
      unique: true,
    },
    {
      itemType: "scytheblade",
      dropRate: 10,
      category: ["reaper"],
      unique: true,
    },
    {
      itemType: "scythehandle",
      dropRate: 10,
      category: ["reaper"],
      unique: true,
    },
    {
      itemType: "shieldleftfragment",
      dropRate: 10,
      category: ["occultist"],
      unique: true,
    },
    {
      itemType: "shieldrightfragment",
      dropRate: 10,
      category: ["occultist"],
      unique: true,
    },

    // Equipment
    { itemType: "armor", dropRate: 350, category: ["equipment"], unique: true },

    // Tools
    { itemType: "pickaxe", dropRate: 25, category: ["tool"] },
    { itemType: "hammer", dropRate: 25, category: ["tool"] },
    { itemType: "fishingrod", dropRate: 40, category: ["tool"] },

    { itemType: "hourglass", dropRate: 10, category: ["reaper"], unique: true },

    // Consumables
    { itemType: "heart", dropRate: 20, category: ["consumable"] },
    { itemType: "weaponpoison", dropRate: 100, category: ["consumable"] },
    { itemType: "weaponblood", dropRate: 100, category: ["consumable"] },

    // Common items
    { itemType: "coin", dropRate: 10, category: ["coin"] }, // Always drops

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
    { itemType: "redgem", dropRate: 25, category: ["gem", "resource"] },
    { itemType: "bluegem", dropRate: 25, category: ["gem", "resource"] },
    { itemType: "greengem", dropRate: 25, category: ["gem", "resource"] },
    { itemType: "geode", dropRate: 100, category: ["gem", "resource"] },
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
    maxDrops: number = 1,
  ) => {
    if (entity.cloned) {
      return;
    }

    const currentDepth = entity.room.depth + increaseDepth;
    const dropChance = entity.dropChance || 1;

    // Skip initial drop chance check if forced
    if (!force && dropChance > 1 && Random.rand() > 1 / dropChance) {
      return null;
    }

    // Filter eligible drops by depth
    let eligibleDrops = this.drops.filter(
      (drop) => drop.minDepth === undefined || drop.minDepth <= currentDepth,
    );

    // Filter out unique items if no categories are specified (default drop table)
    if (useCategory.length === 0) {
      eligibleDrops = eligibleDrops.filter(
        (drop) => drop.unique === undefined || drop.unique === false,
      );
    }

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

    // Track how many items we've dropped
    let droppedCount = 0;
    let droppedItems = [];

    // Try to drop items based on drop rates, up to maxDrops
    for (const drop of eligibleDrops) {
      const randomRoll = Random.rand();
      const threshold = 1 / drop.dropRate;

      if (randomRoll < threshold) {
        const item = this.addNewItem(drop.itemType, entity);
        if (item) {
          droppedItems.push(item);
          droppedCount++;

          // Stop if we've reached the maximum number of drops
          if (droppedCount >= maxDrops) {
            break;
          }
        } else {
        }
      }
    }

    // Force drop the most common item if needed and we haven't dropped anything yet
    if (force && droppedCount === 0 && eligibleDrops.length > 0) {
      const mostCommonDrop = eligibleDrops.reduce((prev, curr) =>
        prev.dropRate < curr.dropRate ? prev : curr,
      );
      const item = this.addNewItem(mostCommonDrop.itemType, entity);
      if (item) {
        droppedItems.push(item);
      }
    }

    return droppedItems.length > 0 ? droppedItems : null;
  };

  static addNewItem = (itemType: string, entity: Entity): Item | null => {
    const ItemClass = ItemTypeMap[itemType];
    if (!ItemClass) {
      console.error(`Item type "${itemType}" is not recognized.`);
      return null;
    }

    let drop = ItemClass.add(entity.room, entity.x, entity.y);
    if (drop.name === "coin") {
      // Generate random number between 0-14 with normal distribution around 7
      drop.stackCount = Utils.randomNormalInt(0, 14);
    }
    if (
      drop instanceof BlueGem ||
      drop instanceof RedGem ||
      drop instanceof GreenGem
    ) {
      // Generate random number between 0-14 with normal distribution around 7
      drop.stackCount = Utils.randomNormalInt(0, 5);
    }
    entity.drops.push(drop);
    return drop;
  };
}
