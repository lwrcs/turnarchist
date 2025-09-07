import { GameplaySettings } from "../game/gameplaySettings";
import { Item } from "./item";

export class ItemGroup {
  items: Item[];
  constructor(items: Item[]) {
    this.items = items;
  }

  destroyOtherItems(item: Item) {
    for (const i of this.items) {
      if (i !== item) {
        i.destroy();
      }
    }
    item.level.game.pushMessage(`You choose to keep the ${item.name}.`);

    if (GameplaySettings.UNBREAKABLE_ITEMGROUP_LOOT) {
      item.degradeable = false;
      item.level.game.pushMessage(`This one won't break.`);
      item.description += " Unbreakable.";
    }
  }
}
