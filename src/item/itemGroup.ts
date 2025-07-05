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
    item.degradeable = false;
    item.level.game.pushMessage(`You choose to keep the ${item.name}.`);
    item.level.game.pushMessage(`This one won't break.`);
  }
}
