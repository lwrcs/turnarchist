import type { Item } from "../../../item/item";
import type { Room } from "../../../room/room";
import type { LoadContext, SaveContext } from "../context";
import type { ItemKind, ItemSaveV2 } from "../schema";
import { Registry } from "./registry";

export type ItemCodecV2 = {
  save: (value: Item, ctx: SaveContext) => ItemSaveV2;
  spawn: (value: ItemSaveV2, room: Room, ctx: LoadContext) => Item;
};

export const itemRegistryV2 = new Registry<ItemKind, ItemCodecV2>();


