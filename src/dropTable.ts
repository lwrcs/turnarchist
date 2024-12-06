import { Entity } from "./entity/entity";
import { Armor } from "./item/armor";
import { BlueGem } from "./item/bluegem";
import { Candle } from "./item/candle";
import { Coin } from "./item/coin";
import { GreenGem } from "./item/greengem";
import { Heart } from "./item/heart";
import { Item } from "./item/item";
import { RedGem } from "./item/redgem";
import { WeaponFragments } from "./item/weaponFragments";
import { Spear } from "./weapon/spear";
import { Warhammer } from "./weapon/warhammer";
import { DualDagger } from "./weapon/dualdagger";

interface Drop {
  itemType: ItemType;
  dropWeight: number;
}

export enum ItemType {
  heart = "heart",
  armor = "armor",
  coin = "coin",
  dualDagger = "dualdagger",
  warhammer = "warhammer",
  spear = "spear",
  weaponFragments = "weaponfragments",
  candle = "candle",
  redGem = "redgem",
  blueGem = "bluegem",
  greenGem = "greengem",
  // Add other item types here
}

/**
 * Mapping of item types to their corresponding classes.
 */
export const ItemTypeMap: { [key in ItemType]: typeof Item } = {
  [ItemType.heart]: Heart,
  [ItemType.armor]: Armor,
  [ItemType.coin]: Coin,
  [ItemType.dualDagger]: DualDagger,
  [ItemType.warhammer]: Warhammer,
  [ItemType.spear]: Spear,
  [ItemType.weaponFragments]: WeaponFragments,
  [ItemType.candle]: Candle,
  [ItemType.redGem]: RedGem,
  [ItemType.blueGem]: BlueGem,
  [ItemType.greenGem]: GreenGem,
  // Add other item mappings here
};

export class DropTable {
  static drops: Drop[] = [
    { itemType: ItemType.heart, dropWeight: 5 },
    { itemType: ItemType.armor, dropWeight: 1 },
    { itemType: ItemType.coin, dropWeight: 100 },
    { itemType: ItemType.dualDagger, dropWeight: 1 },
    { itemType: ItemType.warhammer, dropWeight: 1 },
    { itemType: ItemType.spear, dropWeight: 1 },
    { itemType: ItemType.weaponFragments, dropWeight: 1 },
    { itemType: ItemType.candle, dropWeight: 15 },
    { itemType: ItemType.redGem, dropWeight: 3 },
    { itemType: ItemType.blueGem, dropWeight: 3 },
    { itemType: ItemType.greenGem, dropWeight: 3 },
  ];

  static getDrop = (entity: Entity, uniqueTable: boolean = false) => {
    const totalWeight = this.drops.reduce(
      (acc, drop) => acc + drop.dropWeight,
      0,
    );
    const randomWeight = Math.floor(Math.random() * totalWeight);
    let cumulativeWeight = 0;
    for (const drop of this.drops) {
      cumulativeWeight += drop.dropWeight;
      if (randomWeight < cumulativeWeight) {
        this.addNewItem(drop.itemType, entity);
      } else return null;
    }
  };

  static addNewItem = (itemType: ItemType, entity: Entity): void => {
    const ItemClass = ItemTypeMap[itemType];
    if (!ItemClass) {
      console.error(`Item type "${itemType}" is not recognized.`);
      return;
    }

    ItemClass.add(entity.room, entity.x, entity.y);
  };
}
