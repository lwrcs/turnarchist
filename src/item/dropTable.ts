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

interface Drop {
  itemType: string;
  dropWeight: number;
  category: string;
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

  candle: Candle,
  torch: Torch,
  lantern: Lantern,

  redgem: RedGem,
  bluegem: BlueGem,
  greengem: GreenGem,
  gold: Gold,
  stone: Stone,
  coal: Coal,
};

export class DropTable {
  static drops: Drop[] = [
    // Weapons
    { itemType: "dualdagger", dropWeight: 3, category: "weapon" },
    { itemType: "warhammer", dropWeight: 3, category: "weapon" },
    { itemType: "spear", dropWeight: 5, category: "weapon" },
    { itemType: "spellbook", dropWeight: 0.1, category: "weapon" },

    // Equipment
    { itemType: "armor", dropWeight: 8, category: "equipment" },

    // Tools
    { itemType: "pickaxe", dropWeight: 3, category: "tool" },
    { itemType: "hammer", dropWeight: 3, category: "tool" },

    // Consumables
    { itemType: "heart", dropWeight: 5, category: "consumable" },

    { itemType: "weaponpoison", dropWeight: 0.25, category: "consumable" },
    { itemType: "weaponblood", dropWeight: 0.25, category: "consumable" },

    { itemType: "coin", dropWeight: 250, category: "coin" },

    { itemType: "weaponfragments", dropWeight: 5, category: "consumable" },

    // Light sources
    { itemType: "candle", dropWeight: 10, category: "light" },
    { itemType: "torch", dropWeight: 5, category: "light" },
    { itemType: "lantern", dropWeight: 2, category: "light" },

    // Gems and minerals
    { itemType: "redgem", dropWeight: 5, category: "gem" },
    { itemType: "bluegem", dropWeight: 5, category: "gem" },
    { itemType: "greengem", dropWeight: 5, category: "gem" },
    { itemType: "gold", dropWeight: 5, category: "gem" },
    { itemType: "stone", dropWeight: 5, category: "gem" },
    { itemType: "coal", dropWeight: 15, category: "fuel" },
  ];

  static getDrop = (
    entity: Entity,
    uniqueTable: boolean = false,
    useCategory: string[] = ["coin"],
    force: boolean = false,
  ) => {
    let filteredDrops = this.drops;
    if (useCategory.length > 0) {
      filteredDrops = this.drops.filter((drop) =>
        useCategory.includes(drop.category),
      );
    }

    if (filteredDrops.length === 0) {
      if (force) {
        filteredDrops = this.drops;
        if (filteredDrops.length === 0) return null;
      } else return null;
    }

    const totalWeight = filteredDrops.reduce(
      (acc, drop) => acc + drop.dropWeight,
      0,
    );

    const randomWeight = Math.floor(Math.random() * totalWeight);

    let cumulativeWeight = 0;
    for (const drop of filteredDrops) {
      cumulativeWeight += drop.dropWeight;

      if (randomWeight <= cumulativeWeight) {
        this.addNewItem(drop.itemType, entity);
        return;
      }
    }

    if (force && filteredDrops.length > 0) {
      this.addNewItem(filteredDrops[0].itemType, entity);
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
    console.log(
      `Drop for ${entity.constructor.name}:`,
      entity.drop.constructor.name,
    );
  };
}
