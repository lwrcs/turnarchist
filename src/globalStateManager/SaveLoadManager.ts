import {
  Serializer,
  ItemState,
  InventoryState,
  EntityState,
} from "./serialization";
import { GlobalStateManager } from "./GlobalStateManager";
import { IdGenerator } from "./IdGenerator";
import { Game } from "../game";
import { Level } from "../level/level";
import { Room } from "../room/room";
import { Entity } from "../entity/entity";
import { Item } from "../item/item";
import { Inventory } from "../inventory/inventory";

/**
 * Simple file-level save / load utility.
 *  – save(): grabs snapshot JSON (string)
 *  – load(json): wipes GSM, rebuilds Items/Inventories/Entities for now
 *
 * Later we’ll extend to Levels, Rooms, etc.
 */
export class SaveLoadManager {
  /** Serialise everything to a JSON string */
  static save(pretty = false): string {
    const snap = Serializer.snapshot();
    return pretty ? JSON.stringify(snap, null, 2) : JSON.stringify(snap);
  }

  /** Deserialize JSON produced by `save()` */
  static load(json: string): void {
    const data = JSON.parse(json);

    // 1. reset global registries & ID generator
    GlobalStateManager.instance.reset();
    IdGenerator.resetForTest(); // guarantees subsequent IDs don’t collide

    // 2. ---- Items ----
    const itemLookup: Record<string, Item> = {};
    (data.items as ItemState[]).forEach((s) => {
      // TEMP: put every item into a dummy Room (first one we encounter later)
      const dummyRoom = {} as unknown as Room;
      const it = new Item(dummyRoom, s.x, s.y);
      // manually patch runtime fields that constructor overwrote
      it.stackCount = s.stack;
      it.globalId = s.id;
      itemLookup[s.id] = it;
    });

    // 3. ---- Inventories ----
    const invLookup: Record<string, Inventory> = {};
    (data.inventories as InventoryState[]).forEach((s) => {
      // TEMP: attach to a dummy player
      const dummyPlayer = {} as unknown as any;
      const inv = new Inventory({} as unknown as Game, dummyPlayer);
      inv.coins = s.coin;
      inv.globalId = s.id;
      // fill slots with item references
      s.itemIds.forEach((iid, idx) => {
        inv.items[idx] = itemLookup[iid];
      });
      invLookup[s.id] = inv;
    });

    // 4. ---- Entities ----
    (data.entities as EntityState[]).forEach((s) => {
      // Simple generic entity; real enemy type mapping to come later
      const dummyRoom = {} as unknown as Room;
      const dummyGame = {} as unknown as Game;
      const e = new Entity(dummyRoom, dummyGame, s.x, s.y);
      e.health = s.hp;
      e.globalId = s.id;

      if (s.inventoryId && invLookup[s.inventoryId]) {
        (e as any).inventory = invLookup[s.inventoryId];
      }
    });

    console.info(
      `[SaveLoad] Loaded ${data.items.length} items, ${
        data.inventories.length
      } inventories, ${data.entities.length} entities`,
    );
  }
}
