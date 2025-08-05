import { Game } from "../game";
import { Level } from "../level/level";
import { Room } from "../room/room";
import { Entity } from "../entity/entity";
import { Item } from "../item/item";
import { Inventory } from "../inventory/inventory";
import { GlobalStateManager } from "./GlobalStateManager";
import { TypeRegistry } from "../globalStateManager/TypeRegistry";
import { Tile } from "../tile/tile";
import { Projectile } from "../projectile/projectile";

/* ---------- Raw DTO interfaces ---------- */
export interface ItemState {
  id: string;
  key: string;
  x: number;
  y: number;
  stack: number;
  ext?: any;
}

export interface InventoryState {
  id: string;
  coin: number;
  itemIds: string[];
}

export interface EntityState {
  id: string;
  key: string;
  x: number;
  y: number;
  hp: number;
  inventoryId?: string;
  ext?: any;
}

export interface RoomState {
  id: string;
  depth: number;
  roomX: number;
  roomY: number;
  width: number;
  height: number;
  type: string;
  entityIds: string[];
  itemIds: string[];
}

export interface LevelState {
  id: string;
  depth: number;
  roomIds: string[];
}

export interface GameState {
  id: string;
  currentDepth: number;
  levelIds: string[];
  playerIds: string[];
}

export interface TileState {
  id: string;
  key: string;
  x: number;
  y: number;
  ext?: any;
}

export interface ProjectileState {
  id: string;
  key: string;
  x: number;
  y: number;
  ext?: any;
}

/* ---------- Serialization helpers ---------- */
export const Serializer = {
  item(i: Item): ItemState {
    return {
      id: i.globalId,
      key: (i.constructor as any).SAVE_KEY,
      x: i.x,
      y: i.y,
      stack: i.stackCount,
      ext: (i as any).serializeExtra?.(),
    };
  },

  inventory(inv: Inventory): InventoryState {
    return {
      id: inv.globalId,
      coin: inv.coins,
      itemIds: inv.items.filter(Boolean).map((it) => (it as Item).globalId),
    };
  },

  entity(e: Entity): EntityState {
    return {
      id: e.globalId,
      key: (e.constructor as any).SAVE_KEY,
      x: e.x,
      y: e.y,
      hp: e.health,
      inventoryId: (e as any).inventory?.globalId,
      ext: (e as any).serializeExtra?.(),
    };
  },

  room(r: Room): RoomState {
    return {
      id: r.globalId,
      depth: r.depth,
      roomX: r.roomX,
      roomY: r.roomY,
      width: r.width,
      height: r.height,
      type: r.type,
      entityIds: r.entities.map((en) => en.globalId),
      itemIds: r.items.map((it) => it.globalId),
    };
  },

  level(l: Level): LevelState {
    return {
      id: l.globalId,
      depth: l.depth,
      roomIds: l.rooms.map((rm) => rm.globalId),
    };
  },

  game(g: Game): GameState {
    return {
      id: g.globalId,
      currentDepth: g.currentDepth,
      levelIds: g.levels.map((lvl) => lvl.globalId),
      playerIds: Object.values(g.players).map((pl) => pl.globalId),
    };
  },

  tile(t: Tile): TileState {
    return {
      id: t.globalId,
      key: (t.constructor as any).SAVE_KEY,
      x: t.x,
      y: t.y,
      ext: (t as any).serializeExtra?.(),
    };
  },

  projectile(p: Projectile): ProjectileState {
    return {
      id: p.globalId,
      key: (p.constructor as any).SAVE_KEY,
      x: p.x,
      y: p.y,
      ext: (p as any).serializeExtra?.(),
    };
  },

  /* Snapshot entire runtime */
  snapshot(): {
    game: GameState;
    levels: LevelState[];
    rooms: RoomState[];
    entities: EntityState[];
    items: ItemState[];
    inventories: InventoryState[];
    tiles: TileState[];
    projectiles: ProjectileState[];
  } {
    const gsm = GlobalStateManager.instance;
    return {
      game: this.game([...gsm.games.values()][0]),
      levels: [...gsm.levels.values()].map(this.level),
      rooms: [...gsm.rooms.values()].map(this.room),
      entities: [...gsm.entities.values()].map(this.entity),
      items: [...gsm.items.values()].map(this.item),
      inventories: [...gsm.inventories.values()].map(this.inventory),
      tiles: [...gsm.tiles.values()].map(this.tile),
      projectiles: [...gsm.projectiles.values()].map(this.projectile),
    };
  },
};

/* ---------- Deserialization stubs ---------- */
export const Deserializer = {
  // allocate objects later – placeholders for now
  fromSnapshot(_data: any): void {
    console.warn("Deserializer not implemented yet.");
  },
};
