/**
 * State fingerprinting for save/load validation.
 *
 * A fingerprint is a structured, diffable snapshot of the entire game state.
 * When two fingerprints differ, the diff tells you exactly which room, entity,
 * or item diverged — unlike a hash, which only tells you "something changed".
 */

import { Game } from "../../game";
import { Room } from "../../room/room";
import { Enemy } from "../../entity/enemy/enemy";
import { Entity } from "../../entity/entity";
import { Item } from "../../item/item";
import type { Player } from "../../player/player";
import { Random } from "../../utility/random";
import { getEnemyKindV2 } from "./registry/enemiesBuiltins";
import { getItemKindV2 } from "./registry/itemsBuiltins";
import { collectRoomsForSaveAtCurrentDepth } from "./writeV2";
// Entity-specific imports for state fingerprinting
import { WizardEnemy } from "../../entity/enemy/wizardEnemy";
import { OccultistEnemy } from "../../entity/enemy/occultistEnemy";
import { ExalterEnemy } from "../../entity/enemy/exalterEnemy";
import { Spawner } from "../../entity/enemy/spawner";
import { Chest } from "../../entity/object/chest";
import { VendingMachine } from "../../entity/object/vendingMachine";
// Item-specific imports for state fingerprinting
import { Weapon } from "../../item/weapon/weapon";
import { Crossbow } from "../../item/weapon/crossbow";
import { Key } from "../../item/key";
import { Light } from "../../item/light/light";

// ---------------------------------------------------------------------------
// Fingerprint types
// ---------------------------------------------------------------------------

export interface GameFingerprint {
  rngState: number;
  depth: number;
  playerFingerprints: PlayerFP[];
  roomFingerprints: RoomFP[];
}

export interface RoomFP {
  roomX: number;
  roomY: number;
  width: number;
  height: number;
  pathId: string;
  entered: boolean;
  tileGrid: string; // hash of all "x,y,ctorName" entries
  tileEntries: string[]; // sorted "x,y,ctorName" entries for diff
  statefulTiles: TileFP[];
  entities: EntityFP[];
  items: ItemFP[];
  projectileCount: number;
}

export interface EntityFP {
  kind: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  dead: boolean;
  seenPlayer: boolean;
  stateHash: number;
}

export interface ItemFP {
  kind: string;
  x: number;
  y: number;
  stackCount: number;
  pickedUp: boolean;
  groundedNoAnimate: boolean;
  stateHash: number;
}

export interface PlayerFP {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  dead: boolean;
  roomPathId: string;
  /** Per-slot items as "slot:kind:stackCount" strings for diffable comparison. */
  inventorySlots: string[];
  equippedWeapon: string;
  coins: number;
  sightRadius: number;
  turnCount: number;
  depth: number;
}

export interface TileFP {
  kind: string;
  x: number;
  y: number;
  stateHash: number;
  stateStr: string;
}

// ---------------------------------------------------------------------------
// djb2 hash utility
// ---------------------------------------------------------------------------

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // unsigned 32-bit
}

// ---------------------------------------------------------------------------
// Tile fingerprinting helpers
// ---------------------------------------------------------------------------

/** Tile class names that carry mutable state worth tracking. */
const STATEFUL_TILE_NAMES = new Set([
  "Door",
  "BottomDoor",
  "InsideLevelDoor",
  "Button",
  "SpikeTrap",
  "DownLadder",
  "UpLadder",
  "FountainTile",
]);

function tileFP(tile: any): TileFP | null {
  const ctor = tile.constructor.name;
  if (!STATEFUL_TILE_NAMES.has(ctor)) return null;

  let stateStr = ctor;
  switch (ctor) {
    case "Door":
    case "BottomDoor":
      stateStr += `,opened=${tile.opened},locked=${tile.locked}`;
      break;
    case "InsideLevelDoor":
      stateStr += `,opened=${tile.opened}`;
      break;
    case "Button":
      stateStr += `,pressed=${tile.pressed}`;
      break;
    case "SpikeTrap":
      stateStr += `,on=${tile.on},tickCount=${tile.tickCount}`;
      break;
    case "DownLadder":
      stateStr += `,isSidePath=${tile.isSidePath},depth=${tile.depth},environment=${tile.environment},skin=${tile.skin}`;
      if (tile.lockable) stateStr += `,lockType=${tile.lockable.lockType},locked=${tile.lockable.isLocked()},keyID=${tile.lockable.keyID}`;
      break;
    case "UpLadder":
      stateStr += `,isRope=${tile.isRope},isSidePath=${tile.isSidePath},returnToRoot=${tile.returnToRoot ?? false},depth=${tile.depth},skin=${tile.skin}`;
      if (tile.lockable) stateStr += `,lockType=${tile.lockable.lockType},locked=${tile.lockable.isLocked()},keyID=${tile.lockable.keyID},lockMsg=${tile.lockable.lockedMessage ?? ""}`;
      break;
    case "FountainTile":
      stateStr += `,subTileX=${tile.subTileX},subTileY=${tile.subTileY}`;
      break;
  }

  return {
    kind: ctor,
    x: tile.x,
    y: tile.y,
    stateHash: djb2(stateStr),
    stateStr,
  };
}

// ---------------------------------------------------------------------------
// Entity fingerprinting
// ---------------------------------------------------------------------------

function entityFP(entity: Entity): EntityFP {
  const kind = getEnemyKindV2(entity) ?? entity.constructor.name;

  let stateStr = `${kind},dir=${entity.direction},skip=${entity.skipNextTurns}`;
  if (entity instanceof Enemy) {
    stateStr += `,aggro=${entity.aggro},ticks=${entity.ticks}`;
    stateStr += `,heard=${entity.heardPlayer},buffed=${entity.buffed}`;
    if (entity.status) {
      const p = entity.status.poison;
      const b = entity.status.bleed;
      stateStr += `,poison=${p.active}:${p.hitCount}:${p.startTick}`;
      stateStr += `,bleed=${b.active}:${b.hitCount}:${b.startTick}`;
    }
  }
  // Entity-type-specific state
  if (entity instanceof WizardEnemy) {
    stateStr += `,wizardState=${entity.state}`;
  }
  if (entity instanceof OccultistEnemy) {
    stateStr += `,shielded=${entity.shieldedEnemies?.length ?? 0}`;
  }
  if (entity instanceof ExalterEnemy) {
    stateStr += `,exaltBuffed=${entity.buffedEnemies?.length ?? 0}`;
  }
  if (entity instanceof Spawner) {
    stateStr += `,spawnType=${entity.enemySpawnType},nextTick=${entity.nextSpawnTick}`;
  }
  if (entity instanceof Chest) {
    stateStr += `,opened=${entity.health <= 2}`;
  }
  if (entity instanceof VendingMachine) {
    const vmKind = entity.item ? (getItemKindV2(entity.item) ?? "?") : "none";
    stateStr += `,vmItem=${vmKind},qty=${entity.quantity}`;
  }

  return {
    kind,
    x: entity.x,
    y: entity.y,
    health: entity.health,
    maxHealth: entity.maxHealth,
    dead: entity.dead,
    seenPlayer: entity instanceof Enemy ? entity.seenPlayer : false,
    stateHash: djb2(stateStr),
  };
}

// ---------------------------------------------------------------------------
// Item fingerprinting
// ---------------------------------------------------------------------------

function itemFP(item: Item): ItemFP {
  const kind = getItemKindV2(item) ?? item.constructor.name;

  let stateStr = `${kind},dur=${item.durability}/${item.durabilityMax}`;
  stateStr += `,broken=${item.broken}`;
  stateStr += `,groundedNoAnimate=${item.groundedNoAnimate}`;
  // Item-type-specific state
  if (item instanceof Weapon) {
    const s = item.status;
    stateStr += `,wPoison=${s?.poison ? 1 : 0},wBlood=${s?.blood ? 1 : 0},wCurse=${s?.curse ? 1 : 0}`;
  }
  if (item instanceof Crossbow) {
    stateStr += `,cbState=${item.state}`;
  }
  if (item instanceof Key) {
    stateStr += `,keyDoor=${item.doorID},keyDepth=${item.depth},keyRope=${item.linkedRopeGid ?? ""}`;
  }
  if (item instanceof Light) {
    stateStr += `,fuel=${item.fuel}`;
  }

  return {
    kind,
    x: item.x,
    y: item.y,
    stackCount: item.stackCount,
    pickedUp: item.pickedUp,
    groundedNoAnimate: item.groundedNoAnimate,
    stateHash: djb2(stateStr),
  };
}

// ---------------------------------------------------------------------------
// Player fingerprinting
// ---------------------------------------------------------------------------

function playerFP(player: Player): PlayerFP {
  const inv = player.inventory;

  const inventorySlots: string[] = [];
  for (let i = 0; i < inv.items.length; i++) {
    const it = inv.items[i];
    if (it) {
      const kind = getItemKindV2(it) ?? it.constructor.name;
      inventorySlots.push(`${i}:${kind}:${it.stackCount}`);
    }
  }

  const equippedWeapon = inv.weapon
    ? (getItemKindV2(inv.weapon) ?? inv.weapon.constructor.name)
    : "none";

  return {
    id: player.id,
    x: player.x,
    y: player.y,
    health: player.health,
    maxHealth: player.maxHealth,
    mana: player.mana,
    maxMana: player.maxMana,
    dead: player.dead,
    roomPathId: player.roomGID ?? `levelID:${player.levelID}`,
    inventorySlots,
    equippedWeapon,
    coins: inv.coins,
    sightRadius: player.sightRadius,
    turnCount: player.turnCount,
    depth: player.depth,
  };
}

// ---------------------------------------------------------------------------
// Room fingerprinting
// ---------------------------------------------------------------------------

function roomFP(room: Room): RoomFP {
  // Tile grid hash: sorted "x,y,ctorName" for every tile
  const tileEntries: string[] = [];
  const statefulTiles: TileFP[] = [];

  // roomArray is indexed by GLOBAL coordinates (roomX-1 .. roomX+width+1).
  // Iterating local 0..width would read the wrong cells for rooms not near origin.
  for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
    for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
      const tile = room.roomArray[x]?.[y];
      if (!tile) continue;
      // Normalize cosmetic floor variants to Floor so the tileGrid hash is stable
      // across save/load (SpawnFloor is placed by Spawners during gameplay but
      // regeneration produces a plain Floor — they are functionally identical).
      const tileName =
        tile.constructor.name === "SpawnFloor" ? "Floor" : tile.constructor.name;
      tileEntries.push(`${x},${y},${tileName}`);

      const sfp = tileFP(tile);
      if (sfp) statefulTiles.push(sfp);
    }
  }

  tileEntries.sort();
  const tileGridHash = djb2(tileEntries.join("|")).toString(16);

  // Entities (sorted by x, y, kind for stable ordering)
  const entities = room.entities
    .filter((e) => !e.dead)
    .map(entityFP)
    .sort((a, b) => a.x - b.x || a.y - b.y || a.kind.localeCompare(b.kind));

  // Items (sorted by x, y, kind for stable ordering)
  const items = room.items
    .filter((it) => !it.pickedUp)
    .map(itemFP)
    .sort((a, b) => a.x - b.x || a.y - b.y || a.kind.localeCompare(b.kind));

  // Stateful tiles sorted
  statefulTiles.sort(
    (a, b) => a.x - b.x || a.y - b.y || a.kind.localeCompare(b.kind),
  );

  return {
    roomX: room.roomX,
    roomY: room.roomY,
    width: room.width,
    height: room.height,
    pathId: room.pathId,
    entered: room.entered,
    tileGrid: tileGridHash,
    tileEntries,
    statefulTiles,
    entities,
    items,
    projectileCount: room.projectiles?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Main capture function
// ---------------------------------------------------------------------------

export function captureFingerprint(game: Game): GameFingerprint {
  const playerFPs: PlayerFP[] = [];
  for (const pid of Object.keys(game.players)) {
    playerFPs.push(playerFP(game.players[pid]));
  }
  playerFPs.sort((a, b) => (a.id ?? a.roomPathId).localeCompare(b.id ?? b.roomPathId));

  // Collect all rooms the save tracks (main path + active sidepaths via BFS),
  // same logic as collectRoomsForSaveAtCurrentDepth so before/after fingerprints are comparable.
  const allRooms = game.level ? collectRoomsForSaveAtCurrentDepth(game) : game.rooms;
  const roomFPs: RoomFP[] = [];
  for (const room of allRooms) {
    roomFPs.push(roomFP(room));
  }
  roomFPs.sort(
    (a, b) =>
      a.pathId.localeCompare(b.pathId) || a.roomX - b.roomX || a.roomY - b.roomY,
  );

  return {
    rngState: Random.state,
    depth: game.currentDepth,
    playerFingerprints: playerFPs,
    roomFingerprints: roomFPs,
  };
}
