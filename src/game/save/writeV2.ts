import { Game } from "../../game";
import { Random } from "../../utility/random";
import type { Player } from "../../player/player";
import type { Room } from "../../room/room";
import type { Result } from "./errors";
import { err, ok } from "./errors";
import type {
  InventorySaveV2,
  MainPathGenPlanV2,
  PlayerSaveV2,
  RoomDeltaV2,
  SaveV2,
  SidepathSpecV2,
  WorldDeltaV2,
  WorldSpecV2,
} from "./schema";
import { directionToDirectionKind, envTypeToEnvKind } from "./mappers";
import { registerBuiltinTileCodecsV2 } from "./registry/tilesBuiltins";
import { tileRegistryV2 } from "./registry/tiles";
import type { Tile } from "../../tile/tile";
import type { TileKind, TileSaveV2 } from "./schema";
import { Door } from "../../tile/door";
import { DownLadder } from "../../tile/downLadder";
import { UpLadder } from "../../tile/upLadder";
import { Button } from "../../tile/button";
import { InsideLevelDoor } from "../../tile/insideLevelDoor";
import { registerBuiltinItemCodecsV2, getItemKindV2 } from "./registry/itemsBuiltins";
import { registerBuiltinEnemyCodecsV2, getEnemyKindV2 } from "./registry/enemiesBuiltins";
import { itemRegistryV2 } from "./registry/items";
import { enemyRegistryV2 } from "./registry/enemies";
import type { ItemSaveV2, EnemySaveV2 } from "./schema";
import type { Item } from "../../item/item";
import type { Entity } from "../../entity/entity";
import { WizardFireball } from "../../projectile/wizardFireball";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { GameplaySettings } from "../gameplaySettings";

const GEN_VERSION = "levelgen-v1";

export const createSaveV2 = (game: Game, nowMs: number = Date.now()): Result<SaveV2> => {
  // Ensure builtin codecs are registered before we attempt to encode tiles.
  registerBuiltinTileCodecsV2();
  registerBuiltinItemCodecsV2();
  registerBuiltinEnemyCodecsV2();

  if (!game.levelgen) {
    return err({ kind: "InvalidState", message: "Cannot save: game.levelgen is missing" });
  }
  if (!game.level) {
    return err({ kind: "InvalidState", message: "Cannot save: game.level is missing" });
  }
  if (!Array.isArray(game.rooms)) {
    return err({ kind: "InvalidState", message: "Cannot save: game.rooms is not initialized" });
  }

  const envType = game.level.environment.type;

  const mainPathPlan: MainPathGenPlanV2[] = game.levels
    .filter((l) => l && typeof l.depth === "number" && l.depth <= game.level.depth)
    .map((l): MainPathGenPlanV2 => {
      if (
        l.genSource === "png" &&
        typeof l.pngUrl === "string" &&
        l.pngUrl.length > 0
      ) {
        return { depth: l.depth, kind: "png", pngUrl: l.pngUrl };
      }
      return { depth: l.depth, kind: "procedural" };
    })
    .sort((a, b) => a.depth - b.depth);

  const worldSpec: WorldSpecV2 = {
    seed: game.levelgen.seed,
    rngState: Random.state,
    genVersion: GEN_VERSION,
    depth: game.level.depth,
    env: envTypeToEnvKind(envType),
    mainPathPlan,
    sidepaths: collectSidepaths(game.rooms),
  };

  const delta: WorldDeltaV2 = {
    players: mapPlayers(game, game.players, nowMs),
    offlinePlayers: mapPlayers(game, game.offlinePlayers, nowMs),
    rooms: mapRooms(game, game.rooms, nowMs),
  };

  const out: SaveV2 = {
    saveVersion: 2,
    meta: { savedAtMs: nowMs },
    worldSpec,
    delta,
  };

  return ok(out);
};

const collectSidepaths = (rooms: Room[]): SidepathSpecV2[] => {
  const counts = new Map<string, number>();
  for (const r of rooms) {
    const pid = r.pathId || "main";
    if (pid === "main") continue;
    counts.set(pid, (counts.get(pid) ?? 0) + 1);
  }
  const out: SidepathSpecV2[] = [];
  for (const [pathId, roomsCount] of counts.entries()) {
    out.push({ pathId, rooms: roomsCount });
  }
  // Stable ordering for deterministic saves
  out.sort((a, b) => (a.pathId < b.pathId ? -1 : a.pathId > b.pathId ? 1 : 0));
  return out;
};

const mapPlayers = (
  game: Game,
  players: Record<string, Player>,
  nowMs: number,
): Record<string, PlayerSaveV2> => {
  const out: Record<string, PlayerSaveV2> = {};
  for (const [id, p] of Object.entries(players)) {
    out[id] = playerToSave(game, id, p, nowMs);
  }
  return out;
};

const playerToSave = (game: Game, id: string, p: Player, nowMs: number): PlayerSaveV2 => {
  const room = p.getRoom();
  const inventory = inventoryToSave(game, p.inventory, nowMs);
  return {
    id,
    x: p.x,
    y: p.y,
    dead: p.dead,
    direction: directionToDirectionKind(p.direction),
    health: p.health,
    maxHealth: p.maxHealth,
    mana: p.mana,
    maxMana: p.maxMana,
    roomGid: room.globalId,
    inventory,
    sightRadius: p.sightRadius,
    light: {
      equipped: p.lightEquipped,
      colorRgb: [p.lightColor[0], p.lightColor[1], p.lightColor[2]],
      brightness: p.lightBrightness,
    },
  };
};

const inventoryToSave = (game: Game, inv: Player["inventory"], nowMs: number): InventorySaveV2 => {
  const totalSlots = (inv.rows + inv.expansion) * inv.cols;
  const slots = new Array<InventorySaveV2["slots"][number]>(totalSlots).fill(null);
  for (let i = 0; i < inv.items.length && i < totalSlots; i++) {
    const it = inv.items[i];
    if (!it) continue;
    const s = tryEncodeItem(game, it, nowMs);
    if (s) slots[i] = s;
  }
  const weaponIdx =
    inv.weapon === null ? undefined : inv.items.findIndex((it) => it === inv.weapon);
  const equippedWeaponSlot =
    weaponIdx !== undefined && weaponIdx >= 0 ? weaponIdx : undefined;
  return {
    isOpen: inv.isOpen,
    cols: inv.cols,
    rows: inv.rows,
    selX: inv.selX,
    selY: inv.selY,
    coins: inv.coins,
    expansion: inv.expansion,
    slots,
    equippedWeaponSlot,
  };
};

const mapRooms = (game: Game, rooms: Room[], nowMs: number): RoomDeltaV2[] => {
  return rooms.map((r) => roomToDelta(game, r, nowMs));
};

/**
 * Minimal room delta for now:
 * - records room identity + basic flags
 * - leaves tiles/entities/items/projectiles/hitWarnings empty
 *
 * This keeps SaveV2 schema-valid while we incrementally implement registries
 * and stable IDs for dynamic objects.
 */
const roomToDelta = (game: Game, r: Room, nowMs: number): RoomDeltaV2 => {
  const tiles = collectPersistedTiles(game, r, nowMs);
  const items = collectPersistedItems(game, r, nowMs);
  const enemies = collectPersistedEnemies(game, r, nowMs);
  const projectiles = collectPersistedProjectiles(game, r, nowMs);
  const hitWarnings = collectHitWarnings(r);
  return {
    roomGid: r.globalId,
    roomId: r.id,
    roomX: r.roomX,
    roomY: r.roomY,
    pathId: r.pathId || "main",
    mapGroup: r.mapGroup,
    entered: r.entered,
    active: r.active,
    onScreen: r.onScreen,
    tiles,
    enemies,
    items,
    projectiles,
    hitWarnings,
  };
};

const collectHitWarnings = (room: Room): RoomDeltaV2["hitWarnings"] => {
  const out: RoomDeltaV2["hitWarnings"] = [];
  for (const hw of room.hitwarnings) {
    if (!hw) continue;
    out.push({ x: hw.x, y: hw.y, dead: hw.dead });
  }
  return out;
};

const collectPersistedProjectiles = (game: Game, room: Room, nowMs: number): RoomDeltaV2["projectiles"] => {
  const out: RoomDeltaV2["projectiles"] = [];
  for (const p of room.projectiles) {
    if (!p) continue;
    if (p instanceof WizardFireball) {
      out.push({
        kind: "wizard_fireball",
        gid: p.globalId,
        roomGid: room.globalId,
        x: p.x,
        y: p.y,
        dead: p.dead,
        parentGid: p.parent.globalId,
        state: p.state,
        delay: typeof p.delay === "number" ? p.delay : undefined,
      });
    }
    if (p instanceof EnemySpawnAnimation) {
      const enemySave = tryEncodeEnemy(game, p.enemy, nowMs);
      if (!enemySave) continue;
      out.push({
        kind: "enemy_spawn_animation",
        gid: p.globalId,
        roomGid: room.globalId,
        x: p.x,
        y: p.y,
        dead: p.dead,
        enemy: enemySave,
      });
    }
  }
  return out;
};

const tileToKind = (t: Tile): TileKind | null => {
  if (t instanceof Door) return "door";
  if (t instanceof InsideLevelDoor) return "inside_level_door";
  if (t instanceof Button) return "button";
  if (t instanceof DownLadder) return "down_ladder";
  if (t instanceof UpLadder) return "up_ladder";
  return null;
};

const collectPersistedTiles = (game: Game, room: Room, nowMs: number): TileSaveV2[] => {
  const out: TileSaveV2[] = [];
  const ctx = { game, nowMs };

  for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
    for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
      const t = room.roomArray[x]?.[y];
      if (!t) continue;
      const kind = tileToKind(t);
      if (!kind) continue;
      const codec = tileRegistryV2.get(kind);
      if (!codec) {
        throw new Error(`Missing Tile codec for kind=${kind}`);
      }
      out.push(codec.save(t, ctx));
    }
  }

  return out;
};

const tryEncodeItem = (game: Game, item: Item, nowMs: number): ItemSaveV2 | null => {
  const kind = getItemKindV2(item);
  if (!kind) {
    if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
      const name = item?.constructor?.name ?? "UnknownItem";
      throw new Error(`Missing Item kind mapping for ${name}`);
    }
    return null;
  }
  const codec = itemRegistryV2.get(kind);
  if (!codec) {
    if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
      throw new Error(`Missing Item codec for kind=${kind}`);
    }
    return null;
  }
  return codec.save(item, { game, nowMs });
};

const collectPersistedItems = (game: Game, room: Room, nowMs: number): ItemSaveV2[] => {
  const out: ItemSaveV2[] = [];
  for (const it of room.items) {
    if (!it) continue;
    const encoded = tryEncodeItem(game, it, nowMs);
    if (encoded) {
      // Ensure room reference is set for in-world items
      encoded.roomGid = room.globalId;
      out.push(encoded);
    }
  }
  return out;
};

const tryEncodeEnemy = (game: Game, e: Entity, nowMs: number): EnemySaveV2 | null => {
  const kind = getEnemyKindV2(e);
  if (!kind) {
    if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
      const name = e?.constructor?.name ?? "UnknownEntity";
      throw new Error(`Missing Enemy kind mapping for ${name}`);
    }
    return null;
  }
  const codec = enemyRegistryV2.get(kind);
  if (!codec) {
    if (GameplaySettings.SAVE_V2_STRICT_KINDS) {
      throw new Error(`Missing Enemy codec for kind=${kind}`);
    }
    return null;
  }
  return codec.save(e, { game, nowMs });
};

const collectPersistedEnemies = (game: Game, room: Room, nowMs: number): EnemySaveV2[] => {
  const out: EnemySaveV2[] = [];
  for (const e of room.entities) {
    if (!e) continue;
    const encoded = tryEncodeEnemy(game, e, nowMs);
    if (encoded) out.push(encoded);
  }
  return out;
};


