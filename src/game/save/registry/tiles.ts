import type { Tile } from "../../../tile/tile";
import type { Room } from "../../../room/room";
import type { LoadContext, SaveContext } from "../context";
import type { TileKind, TileSaveV2 } from "../schema";
import { Registry } from "./registry";

export type TileCodecV2 = {
  save: (value: Tile, ctx: SaveContext) => TileSaveV2;
  /** Apply the saved state onto an already-generated tile at the same coordinate. */
  apply: (value: TileSaveV2, room: Room, ctx: LoadContext) => void;
};

export const tileRegistryV2 = new Registry<TileKind, TileCodecV2>();


