import type { Result, SaveLoadError } from "./errors";
import { err, ok } from "./errors";
import { ITEM_KIND_VALUES_V2 } from "./schema";
import type {
  DoorKind,
  EnemyKind,
  EnemySaveV2,
  EnvKind,
  Gid,
  HitWarningSaveV2,
  InventorySaveV2,
  ItemKind,
  ItemSaveV2,
  LockKind,
  PlayerSaveV2,
  ProjectileKind,
  ProjectileSaveV2,
  RoomDeltaV2,
  SaveV2,
  SaveVersion,
  ShieldItemKind,
  TileKind,
  TileSaveV2,
  WeaponItemKind,
  WizardTypeKind,
  WorldDeltaV2,
  WorldSpecV2,
} from "./schema";

const SAVE_VERSION: SaveVersion = 2;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";

const get = (o: Record<string, unknown>, k: string): unknown => o[k];

const isErr = <T>(
  r: Result<T>,
): r is { ok: false; error: SaveLoadError } => r.ok === false;

const isOneOf = <T extends string>(v: unknown, allowed: readonly T[]): v is T => {
  if (!isString(v)) return false;
  for (const a of allowed) if (a === v) return true;
  return false;
};

const asGid = (v: unknown, path: string): Result<Gid> =>
  isString(v) && v.length > 0
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Expected non-empty string", path });

const ENV_KINDS = [
  "dungeon",
  "cave",
  "forest",
  "castle",
  "glacier",
  "dark_castle",
  "placeholder",
  "desert",
  "magma_cave",
  "dark_dungeon",
  "tutorial",
  "flooded_cave",
] as const satisfies readonly EnvKind[];

const DIRECTION_KINDS = [
  "down",
  "up",
  "right",
  "left",
  "down_right",
  "up_left",
  "up_right",
  "down_left",
  "center",
] as const satisfies readonly PlayerSaveV2["direction"][];

const DOOR_KINDS = [
  "door",
  "locked_door",
  "guarded_door",
  "tunnel_door",
] as const satisfies readonly DoorKind[];

const LOCK_KINDS = ["none", "locked", "guarded", "tunnel"] as const satisfies readonly LockKind[];

const TILE_KINDS = [
  "door",
  "inside_level_door",
  "button",
  "down_ladder",
  "up_ladder",
  "spike_trap",
  "fountain",
  "coffin",
  "wall_torch",
  "window",
] as const satisfies readonly TileKind[];

const ENEMY_KINDS = [
  "barrel",
  "chest",
  "vending_machine",
  "spawner",
  "wizard",
  "zombie",
  "occultist",
  "exalter",
  "armored_skull",
  "armored_zombie",
  "beetle",
  "bishop",
  "boltcaster",
  "charge",
  "crab",
  "crusher",
  "frog",
  "big_frog",
  "glow_bug",
  "king",
  "knight",
  "big_knight",
  "mummy",
  "pawn",
  "queen",
  "rook",
  "skull",
  "big_skull",
  "big_zombie",
  "spider",
  "warden",
  "crate",
  "dark_crate",
  "pot",
  "dark_pot",
  "pumpkin",
  "tomb_stone",
  "furnace",
  "fishing_spot",
  "mushrooms_prop",
  "potted_plant",
  "coal_resource",
  "gold_resource",
  "iron_resource",
  "emerald_resource",
  "zircon_resource",
  "amber_resource",
  "garnet_resource",
  "rock_resource",
  "cave_rock_resource",
  "obsidian_resource",
] as const satisfies readonly EnemyKind[];

const ITEM_KINDS = [
  ...ITEM_KIND_VALUES_V2,
] as const satisfies readonly ItemKind[];

type LightItemKindLocal = Extract<
  ItemKind,
  "torch" | "lantern" | "candle" | "glow_stick" | "glow_bugs" | "glowshrooms"
>;
const LIGHT_ITEM_KINDS = [
  "torch",
  "lantern",
  "candle",
  "glow_stick",
  "glow_bugs",
  "glowshrooms",
] as const satisfies readonly LightItemKindLocal[];

const isLightItemKind = (k: ItemKind): k is LightItemKindLocal => {
  for (const v of LIGHT_ITEM_KINDS) if (v === k) return true;
  return false;
};

const WEAPON_ITEM_KINDS = [
  "dagger",
  "sword",
  "spear",
  "dual_daggers",
  "greataxe",
  "warhammer",
  "quarterstaff",
  "scythe",
  "crossbow",
  "shotgun",
  "slingshot",
  "spellbook",
  "pickaxe",
] as const satisfies readonly WeaponItemKind[];

const isWeaponItemKind = (k: ItemKind): k is WeaponItemKind => {
  for (const v of WEAPON_ITEM_KINDS) if (v === k) return true;
  return false;
};

const SHIELD_ITEM_KINDS = ["occult_shield", "wooden_shield"] as const satisfies readonly ShieldItemKind[];
const isShieldItemKind = (k: ItemKind): k is ShieldItemKind => {
  for (const v of SHIELD_ITEM_KINDS) if (v === k) return true;
  return false;
};

const PROJECTILE_KINDS = ["wizard_fireball", "enemy_spawn_animation"] as const satisfies readonly ProjectileKind[];

const WIZARD_TYPE_KINDS = ["energy", "fire", "earth"] as const satisfies readonly WizardTypeKind[];

const asEnvKind = (v: unknown, path: string): Result<EnvKind> =>
  isOneOf(v, ENV_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid env kind", path });

const asDirectionKind = (v: unknown, path: string): Result<PlayerSaveV2["direction"]> =>
  isOneOf(v, DIRECTION_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid direction kind", path });

const asDoorKind = (v: unknown, path: string): Result<DoorKind> =>
  isOneOf(v, DOOR_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid door kind", path });

const asLockKind = (v: unknown, path: string): Result<LockKind> =>
  isOneOf(v, LOCK_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid lock kind", path });

const asEnemyKind = (v: unknown, path: string): Result<EnemyKind> =>
  isOneOf(v, ENEMY_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid enemy kind", path });

const asItemKind = (v: unknown, path: string): Result<ItemKind> =>
  isOneOf(v, ITEM_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid item kind", path });

const asProjectileKind = (v: unknown, path: string): Result<ProjectileKind> =>
  isOneOf(v, PROJECTILE_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid projectile kind", path });

const asWizardTypeKind = (v: unknown, path: string): Result<WizardTypeKind> =>
  isOneOf(v, WIZARD_TYPE_KINDS)
    ? ok(v)
    : err({ kind: "InvalidSchema", message: "Invalid wizard type kind", path });

export const parseSaveV2Json = (raw: string): Result<SaveV2> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "JSON parse failed";
    return err({ kind: "InvalidJson", message: msg });
  }
  return validateSaveV2(parsed);
};

export const validateSaveV2 = (v: unknown): Result<SaveV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "Save must be an object", path: "$" });
  }

  const saveVersionU = get(v, "saveVersion");
  if (!isNumber(saveVersionU)) {
    return err({
      kind: "InvalidSchema",
      message: "saveVersion must be a number",
      path: "$.saveVersion",
    });
  }
  if (saveVersionU !== SAVE_VERSION) {
    return err({
      kind: "UnsupportedVersion",
      message: `Unsupported saveVersion: ${saveVersionU}`,
      saveVersion: saveVersionU,
    });
  }

  const worldSpecR = validateWorldSpecV2(get(v, "worldSpec"), "$.worldSpec");
  if (isErr(worldSpecR)) return err(worldSpecR.error);

  const deltaR = validateWorldDeltaV2(get(v, "delta"), "$.delta");
  if (isErr(deltaR)) return err(deltaR.error);

  const metaU = get(v, "meta");
  let meta: SaveV2["meta"] | undefined = undefined;
  if (metaU !== undefined) {
    if (!isRecord(metaU)) {
      return err({
        kind: "InvalidSchema",
        message: "meta must be an object if present",
        path: "$.meta",
      });
    }
    const buildU = get(metaU, "build");
    let build: string | undefined = undefined;
    if (buildU !== undefined) {
      if (!isString(buildU)) {
        return err({
          kind: "InvalidSchema",
          message: "meta.build must be a string if present",
          path: "$.meta.build",
        });
      }
      build = buildU;
    }

    const savedAtMsU = get(metaU, "savedAtMs");
    let savedAtMs: number | undefined = undefined;
    if (savedAtMsU !== undefined) {
      if (!isNumber(savedAtMsU)) {
        return err({
          kind: "InvalidSchema",
          message: "meta.savedAtMs must be a number if present",
          path: "$.meta.savedAtMs",
        });
      }
      savedAtMs = savedAtMsU;
    }

    meta = { build, savedAtMs };
  }

  return ok({
    saveVersion: SAVE_VERSION,
    meta,
    worldSpec: worldSpecR.value,
    delta: deltaR.value,
  });
};

const validateWorldSpecV2 = (v: unknown, path: string): Result<WorldSpecV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "worldSpec must be an object", path });
  }
  const seed = get(v, "seed");
  const rngState = get(v, "rngState");
  const genVersion = get(v, "genVersion");
  const depth = get(v, "depth");
  const envU = get(v, "env");
  const mainPathPlanU = get(v, "mainPathPlan");
  const sidepaths = get(v, "sidepaths");

  if (!isNumber(seed))
    return err({ kind: "InvalidSchema", message: "seed must be a number", path: `${path}.seed` });
  if (!isNumber(rngState))
    return err({
      kind: "InvalidSchema",
      message: "rngState must be a number",
      path: `${path}.rngState`,
    });
  if (!isString(genVersion))
    return err({
      kind: "InvalidSchema",
      message: "genVersion must be a string",
      path: `${path}.genVersion`,
    });
  if (!isNumber(depth))
    return err({
      kind: "InvalidSchema",
      message: "depth must be a number",
      path: `${path}.depth`,
    });
  const envR = asEnvKind(envU, `${path}.env`);
  if (isErr(envR)) return err(envR.error);
  if (!Array.isArray(sidepaths))
    return err({
      kind: "InvalidSchema",
      message: "sidepaths must be an array",
      path: `${path}.sidepaths`,
    });

  const sidepathOut: WorldSpecV2["sidepaths"] = [];
  for (let i = 0; i < sidepaths.length; i++) {
    const sp = sidepaths[i];
    const spPath = `${path}.sidepaths[${i}]`;
    if (!isRecord(sp)) {
      return err({ kind: "InvalidSchema", message: "sidepath must be an object", path: spPath });
    }
    const pathId = get(sp, "pathId");
    const roomsU = get(sp, "rooms");
    if (!isString(pathId) || pathId.length === 0) {
      return err({
        kind: "InvalidSchema",
        message: "pathId must be a non-empty string",
        path: `${spPath}.pathId`,
      });
    }
    if (roomsU !== undefined && !isNumber(roomsU)) {
      return err({
        kind: "InvalidSchema",
        message: "rooms must be a number if present",
        path: `${spPath}.rooms`,
      });
    }
    const rooms: number | undefined =
      roomsU === undefined ? undefined : isNumber(roomsU) ? roomsU : undefined;
    sidepathOut.push({ pathId, rooms });
  }

  let mainPathPlan: WorldSpecV2["mainPathPlan"] | undefined = undefined;
  if (mainPathPlanU !== undefined) {
    if (!Array.isArray(mainPathPlanU)) {
      return err({
        kind: "InvalidSchema",
        message: "mainPathPlan must be an array if present",
        path: `${path}.mainPathPlan`,
      });
    }
    const out: NonNullable<WorldSpecV2["mainPathPlan"]> = [];
    for (let i = 0; i < mainPathPlanU.length; i++) {
      const row = mainPathPlanU[i];
      const rowPath = `${path}.mainPathPlan[${i}]`;
      if (!isRecord(row)) {
        return err({ kind: "InvalidSchema", message: "mainPathPlan entry must be an object", path: rowPath });
      }
      const d = get(row, "depth");
      const kind = get(row, "kind");
      const pngUrlU = get(row, "pngUrl");
      if (!isNumber(d)) return err({ kind: "InvalidSchema", message: "depth must be number", path: `${rowPath}.depth` });
      if (kind !== "png" && kind !== "procedural")
        return err({ kind: "InvalidSchema", message: "kind must be 'png' or 'procedural'", path: `${rowPath}.kind` });
      if (pngUrlU !== undefined && !isString(pngUrlU))
        return err({ kind: "InvalidSchema", message: "pngUrl must be string if present", path: `${rowPath}.pngUrl` });
      if (kind === "png" && (pngUrlU === undefined || (pngUrlU as string).length === 0))
        return err({ kind: "InvalidSchema", message: "pngUrl required when kind='png'", path: `${rowPath}.pngUrl` });
      out.push({ depth: d, kind, pngUrl: kind === "png" ? (pngUrlU as string) : undefined });
    }
    mainPathPlan = out;
  }

  return ok({
    seed,
    rngState,
    genVersion,
    depth,
    env: envR.value,
    mainPathPlan,
    sidepaths: sidepathOut,
  });
};

const validateWorldDeltaV2 = (v: unknown, path: string): Result<WorldDeltaV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "delta must be an object", path });
  }

  const playersU = get(v, "players");
  const offlinePlayersU = get(v, "offlinePlayers");
  const roomsU = get(v, "rooms");

  if (!isRecord(playersU))
    return err({
      kind: "InvalidSchema",
      message: "players must be an object map",
      path: `${path}.players`,
    });
  if (!isRecord(offlinePlayersU))
    return err({
      kind: "InvalidSchema",
      message: "offlinePlayers must be an object map",
      path: `${path}.offlinePlayers`,
    });
  if (!Array.isArray(roomsU))
    return err({
      kind: "InvalidSchema",
      message: "rooms must be an array",
      path: `${path}.rooms`,
    });

  const players: Record<string, PlayerSaveV2> = {};
  for (const [playerId, raw] of Object.entries(playersU)) {
    const pr = validatePlayerSaveV2(raw, `${path}.players.${playerId}`, playerId);
    if (isErr(pr)) return err(pr.error);
    players[playerId] = pr.value;
  }

  const offlinePlayers: Record<string, PlayerSaveV2> = {};
  for (const [playerId, raw] of Object.entries(offlinePlayersU)) {
    const pr = validatePlayerSaveV2(raw, `${path}.offlinePlayers.${playerId}`, playerId);
    if (isErr(pr)) return err(pr.error);
    offlinePlayers[playerId] = pr.value;
  }

  const rooms: Array<RoomDeltaV2> = [];
  for (let i = 0; i < roomsU.length; i++) {
    const rr = validateRoomDeltaV2(roomsU[i], `${path}.rooms[${i}]`);
    if (isErr(rr)) return err(rr.error);
    rooms.push(rr.value);
  }

  return ok({ players, offlinePlayers, rooms });
};

const validatePlayerSaveV2 = (
  v: unknown,
  path: string,
  id: string,
): Result<PlayerSaveV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "player must be an object", path });
  }

  const x = get(v, "x");
  const y = get(v, "y");
  const dead = get(v, "dead");
  const directionU = get(v, "direction");
  const health = get(v, "health");
  const maxHealth = get(v, "maxHealth");
  const mana = get(v, "mana");
  const maxMana = get(v, "maxMana");
  const roomGidU = get(v, "roomGid");
  const inventoryU = get(v, "inventory");
  const sightRadius = get(v, "sightRadius");

  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be a number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be a number", path: `${path}.y` });
  if (!isBoolean(dead))
    return err({ kind: "InvalidSchema", message: "dead must be a boolean", path: `${path}.dead` });
  const dirR = asDirectionKind(directionU, `${path}.direction`);
  if (isErr(dirR)) return err(dirR.error);
  if (!isNumber(health))
    return err({ kind: "InvalidSchema", message: "health must be a number", path: `${path}.health` });
  if (!isNumber(maxHealth))
    return err({
      kind: "InvalidSchema",
      message: "maxHealth must be a number",
      path: `${path}.maxHealth`,
    });
  if (!isNumber(mana)) return err({ kind: "InvalidSchema", message: "mana must be a number", path: `${path}.mana` });
  if (!isNumber(maxMana))
    return err({
      kind: "InvalidSchema",
      message: "maxMana must be a number",
      path: `${path}.maxMana`,
    });
  const roomGidR = asGid(roomGidU, `${path}.roomGid`);
  if (isErr(roomGidR)) return err(roomGidR.error);

  const invR = validateInventorySaveV2(inventoryU, `${path}.inventory`);
  if (isErr(invR)) return err(invR.error);

  if (!isNumber(sightRadius))
    return err({
      kind: "InvalidSchema",
      message: "sightRadius must be a number",
      path: `${path}.sightRadius`,
    });

  const lightU = get(v, "light");
  let light: PlayerSaveV2["light"] = undefined;
  if (lightU !== undefined) {
    if (!isRecord(lightU)) {
      return err({
        kind: "InvalidSchema",
        message: "light must be an object if present",
        path: `${path}.light`,
      });
    }
    const equipped = get(lightU, "equipped");
    const colorRgb = get(lightU, "colorRgb");
    const brightness = get(lightU, "brightness");
    if (!isBoolean(equipped))
      return err({
        kind: "InvalidSchema",
        message: "light.equipped must be boolean",
        path: `${path}.light.equipped`,
      });
    if (
      !Array.isArray(colorRgb) ||
      colorRgb.length !== 3 ||
      !isNumber(colorRgb[0]) ||
      !isNumber(colorRgb[1]) ||
      !isNumber(colorRgb[2])
    ) {
      return err({
        kind: "InvalidSchema",
        message: "light.colorRgb must be [number, number, number]",
        path: `${path}.light.colorRgb`,
      });
    }
    if (!isNumber(brightness))
      return err({
        kind: "InvalidSchema",
        message: "light.brightness must be number",
        path: `${path}.light.brightness`,
      });
    light = {
      equipped,
      colorRgb: [colorRgb[0], colorRgb[1], colorRgb[2]],
      brightness,
    };
  }

  return ok({
    id,
    x,
    y,
    dead,
    direction: dirR.value,
    health,
    maxHealth,
    mana,
    maxMana,
    roomGid: roomGidR.value,
    inventory: invR.value,
    sightRadius,
    light,
  });
};

const validateInventorySaveV2 = (v: unknown, path: string): Result<InventorySaveV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "inventory must be an object", path });
  }
  const isOpen = get(v, "isOpen");
  const cols = get(v, "cols");
  const rows = get(v, "rows");
  const selX = get(v, "selX");
  const selY = get(v, "selY");
  const coins = get(v, "coins");
  const expansion = get(v, "expansion");
  const slotsU = get(v, "slots");
  const equippedWeaponSlotU = get(v, "equippedWeaponSlot");

  if (!isBoolean(isOpen))
    return err({ kind: "InvalidSchema", message: "isOpen must be boolean", path: `${path}.isOpen` });
  if (!isNumber(cols))
    return err({ kind: "InvalidSchema", message: "cols must be number", path: `${path}.cols` });
  if (!isNumber(rows))
    return err({ kind: "InvalidSchema", message: "rows must be number", path: `${path}.rows` });
  if (!isNumber(selX))
    return err({ kind: "InvalidSchema", message: "selX must be number", path: `${path}.selX` });
  if (!isNumber(selY))
    return err({ kind: "InvalidSchema", message: "selY must be number", path: `${path}.selY` });
  if (!isNumber(coins))
    return err({ kind: "InvalidSchema", message: "coins must be number", path: `${path}.coins` });
  if (!isNumber(expansion))
    return err({
      kind: "InvalidSchema",
      message: "expansion must be number",
      path: `${path}.expansion`,
    });
  if (!Array.isArray(slotsU))
    return err({ kind: "InvalidSchema", message: "slots must be array", path: `${path}.slots` });

  let equippedWeaponSlot: number | undefined = undefined;
  if (equippedWeaponSlotU !== undefined) {
    if (!isNumber(equippedWeaponSlotU)) {
      return err({
        kind: "InvalidSchema",
        message: "equippedWeaponSlot must be number if present",
        path: `${path}.equippedWeaponSlot`,
      });
    }
    equippedWeaponSlot = equippedWeaponSlotU;
  }

  const slots: InventorySaveV2["slots"] = [];
  for (let i = 0; i < slotsU.length; i++) {
    const s = slotsU[i];
    if (s === null) {
      slots.push(null);
      continue;
    }
    const itemR = validateItemSaveV2(s, `${path}.slots[${i}]`);
    if (isErr(itemR)) return err(itemR.error);
    slots.push(itemR.value);
  }

  return ok({
    isOpen,
    cols,
    rows,
    selX,
    selY,
    coins,
    expansion,
    slots,
    equippedWeaponSlot,
  });
};

const validateItemSaveV2 = (v: unknown, path: string): Result<ItemSaveV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "item must be an object", path });
  }
  const kindR = asItemKind(get(v, "kind"), `${path}.kind`);
  if (isErr(kindR)) return err(kindR.error);
  const gidR = asGid(get(v, "gid"), `${path}.gid`);
  if (isErr(gidR)) return err(gidR.error);
  const x = get(v, "x");
  const y = get(v, "y");
  const stackCount = get(v, "stackCount");
  const pickedUp = get(v, "pickedUp");
  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be number", path: `${path}.y` });
  if (!isNumber(stackCount))
    return err({
      kind: "InvalidSchema",
      message: "stackCount must be number",
      path: `${path}.stackCount`,
    });
  if (!isBoolean(pickedUp))
    return err({
      kind: "InvalidSchema",
      message: "pickedUp must be boolean",
      path: `${path}.pickedUp`,
    });

  const roomGidU = get(v, "roomGid");
  let roomGid: Gid | undefined = undefined;
  if (roomGidU !== undefined) {
    const rg = asGid(roomGidU, `${path}.roomGid`);
    if (isErr(rg)) return err(rg.error);
    roomGid = rg.value;
  }

  const equippedU = get(v, "equipped");
  let equipped: boolean | undefined = undefined;
  if (equippedU !== undefined) {
    if (!isBoolean(equippedU)) {
      return err({
        kind: "InvalidSchema",
        message: "equipped must be boolean if present",
        path: `${path}.equipped`,
      });
    }
    equipped = equippedU;
  }

  if (kindR.value === "key") {
    const doorIdU = get(v, "doorId");
    const depthU = get(v, "depth");
    const showPathU = get(v, "showPath");
    if (!isNumber(doorIdU))
      return err({ kind: "InvalidSchema", message: "doorId must be number", path: `${path}.doorId` });
    if (!(depthU === null || isNumber(depthU)))
      return err({ kind: "InvalidSchema", message: "depth must be number|null", path: `${path}.depth` });
    if (!isBoolean(showPathU))
      return err({ kind: "InvalidSchema", message: "showPath must be boolean", path: `${path}.showPath` });
    const depth: number | null = depthU === null ? null : (depthU as number);
    return ok({
      kind: "key",
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      equipped,
      doorId: doorIdU,
      depth,
      showPath: showPathU,
    });
  }

  if (isLightItemKind(kindR.value)) {
    const fuelU = get(v, "fuel");
    if (!isNumber(fuelU))
      return err({ kind: "InvalidSchema", message: "fuel must be number", path: `${path}.fuel` });
    return ok({
      kind: kindR.value,
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      equipped,
      fuel: fuelU,
    });
  }

  if (kindR.value === "diving_helmet") {
    const airU = get(v, "currentAir");
    if (!isNumber(airU)) {
      return err({
        kind: "InvalidSchema",
        message: "currentAir must be number",
        path: `${path}.currentAir`,
      });
    }
    return ok({
      kind: "diving_helmet",
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      equipped,
      currentAir: airU,
    });
  }

  if (kindR.value === "hourglass") {
    const durabilityU = get(v, "durability");
    const durabilityMaxU = get(v, "durabilityMax");
    const brokenU = get(v, "broken");
    if (!isNumber(durabilityU))
      return err({ kind: "InvalidSchema", message: "durability must be number", path: `${path}.durability` });
    if (!isNumber(durabilityMaxU))
      return err({
        kind: "InvalidSchema",
        message: "durabilityMax must be number",
        path: `${path}.durabilityMax`,
      });
    if (!isBoolean(brokenU))
      return err({ kind: "InvalidSchema", message: "broken must be boolean", path: `${path}.broken` });

    return ok({
      kind: "hourglass",
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      durability: durabilityU,
      durabilityMax: durabilityMaxU,
      broken: brokenU,
    });
  }

  if (isWeaponItemKind(kindR.value)) {
    const durabilityU = get(v, "durability");
    const durabilityMaxU = get(v, "durabilityMax");
    const brokenU = get(v, "broken");
    const cooldownU = get(v, "cooldown");
    const cooldownMaxU = get(v, "cooldownMax");
    const statusU = get(v, "status");

    if (!isNumber(durabilityU))
      return err({
        kind: "InvalidSchema",
        message: "durability must be number",
        path: `${path}.durability`,
      });
    if (!isNumber(durabilityMaxU))
      return err({
        kind: "InvalidSchema",
        message: "durabilityMax must be number",
        path: `${path}.durabilityMax`,
      });
    if (!isBoolean(brokenU))
      return err({
        kind: "InvalidSchema",
        message: "broken must be boolean",
        path: `${path}.broken`,
      });
    if (!isNumber(cooldownU))
      return err({
        kind: "InvalidSchema",
        message: "cooldown must be number",
        path: `${path}.cooldown`,
      });
    if (!isNumber(cooldownMaxU))
      return err({
        kind: "InvalidSchema",
        message: "cooldownMax must be number",
        path: `${path}.cooldownMax`,
      });
    if (!isRecord(statusU))
      return err({
        kind: "InvalidSchema",
        message: "status must be object",
        path: `${path}.status`,
      });

    const poisonU = get(statusU, "poison");
    const bloodU = get(statusU, "blood");
    const curseU = get(statusU, "curse");
    if (!isBoolean(poisonU))
      return err({
        kind: "InvalidSchema",
        message: "status.poison must be boolean",
        path: `${path}.status.poison`,
      });
    if (!isBoolean(bloodU))
      return err({
        kind: "InvalidSchema",
        message: "status.blood must be boolean",
        path: `${path}.status.blood`,
      });
    if (!isBoolean(curseU))
      return err({
        kind: "InvalidSchema",
        message: "status.curse must be boolean",
        path: `${path}.status.curse`,
      });

    if (kindR.value === "crossbow") {
      const crossbowStateU = get(v, "crossbowState");
      if (
        !isNumber(crossbowStateU) ||
        !Number.isInteger(crossbowStateU) ||
        crossbowStateU < 0 ||
        crossbowStateU > 3
      ) {
        return err({
          kind: "InvalidSchema",
          message: "crossbowState must be integer in [0..3]",
          path: `${path}.crossbowState`,
        });
      }

      return ok({
        kind: "crossbow",
        gid: gidR.value,
        x,
        y,
        roomGid,
        stackCount,
        pickedUp,
        equipped,
        durability: durabilityU,
        durabilityMax: durabilityMaxU,
        broken: brokenU,
        cooldown: cooldownU,
        cooldownMax: cooldownMaxU,
        status: { poison: poisonU, blood: bloodU, curse: curseU },
        crossbowState: crossbowStateU,
      });
    }

    return ok({
      kind: kindR.value,
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      equipped,
      durability: durabilityU,
      durabilityMax: durabilityMaxU,
      broken: brokenU,
      cooldown: cooldownU,
      cooldownMax: cooldownMaxU,
      status: { poison: poisonU, blood: bloodU, curse: curseU },
    });
  }

  if (isShieldItemKind(kindR.value)) {
    const healthU = get(v, "health");
    const rtcU = get(v, "rechargeTurnCounter");
    if (!isNumber(healthU))
      return err({
        kind: "InvalidSchema",
        message: "health must be number",
        path: `${path}.health`,
      });
    if (!isNumber(rtcU))
      return err({
        kind: "InvalidSchema",
        message: "rechargeTurnCounter must be number",
        path: `${path}.rechargeTurnCounter`,
      });
    return ok({
      kind: kindR.value,
      gid: gidR.value,
      x,
      y,
      roomGid,
      stackCount,
      pickedUp,
      equipped,
      health: healthU,
      rechargeTurnCounter: rtcU,
    });
  }

  return ok({
    kind: kindR.value,
    gid: gidR.value,
    x,
    y,
    roomGid,
    stackCount,
    pickedUp,
    equipped,
  });
};

const validateRoomDeltaV2 = (v: unknown, path: string): Result<RoomDeltaV2> => {
  if (!isRecord(v)) {
    return err({ kind: "InvalidSchema", message: "room must be an object", path });
  }
  const roomGidR = asGid(get(v, "roomGid"), `${path}.roomGid`);
  if (isErr(roomGidR)) return err(roomGidR.error);
  const roomIdU = get(v, "roomId");
  const pathId = get(v, "pathId");
  const mapGroup = get(v, "mapGroup");
  const entered = get(v, "entered");
  const active = get(v, "active");
  const onScreen = get(v, "onScreen");
  const roomXU = get(v, "roomX");
  const roomYU = get(v, "roomY");

  if (!isNumber(roomIdU))
    return err({ kind: "InvalidSchema", message: "roomId must be number", path: `${path}.roomId` });
  if (!isString(pathId) || pathId.length === 0)
    return err({
      kind: "InvalidSchema",
      message: "pathId must be non-empty string",
      path: `${path}.pathId`,
    });
  if (!isNumber(mapGroup))
    return err({ kind: "InvalidSchema", message: "mapGroup must be number", path: `${path}.mapGroup` });
  if (!isBoolean(entered))
    return err({
      kind: "InvalidSchema",
      message: "entered must be boolean",
      path: `${path}.entered`,
    });
  if (!isBoolean(active))
    return err({ kind: "InvalidSchema", message: "active must be boolean", path: `${path}.active` });
  if (!isBoolean(onScreen))
    return err({
      kind: "InvalidSchema",
      message: "onScreen must be boolean",
      path: `${path}.onScreen`,
    });

  let roomX: number | undefined = undefined;
  if (roomXU !== undefined) {
    if (!isNumber(roomXU))
      return err({ kind: "InvalidSchema", message: "roomX must be number if present", path: `${path}.roomX` });
    roomX = roomXU;
  }
  let roomY: number | undefined = undefined;
  if (roomYU !== undefined) {
    if (!isNumber(roomYU))
      return err({ kind: "InvalidSchema", message: "roomY must be number if present", path: `${path}.roomY` });
    roomY = roomYU;
  }

  const tilesU = get(v, "tiles");
  const enemiesU = get(v, "enemies");
  const itemsU = get(v, "items");
  const projectilesU = get(v, "projectiles");
  const hitWarningsU = get(v, "hitWarnings");

  if (!Array.isArray(tilesU))
    return err({ kind: "InvalidSchema", message: "tiles must be array", path: `${path}.tiles` });
  if (!Array.isArray(enemiesU))
    return err({ kind: "InvalidSchema", message: "enemies must be array", path: `${path}.enemies` });
  if (!Array.isArray(itemsU))
    return err({ kind: "InvalidSchema", message: "items must be array", path: `${path}.items` });
  if (!Array.isArray(projectilesU))
    return err({
      kind: "InvalidSchema",
      message: "projectiles must be array",
      path: `${path}.projectiles`,
    });
  if (!Array.isArray(hitWarningsU))
    return err({
      kind: "InvalidSchema",
      message: "hitWarnings must be array",
      path: `${path}.hitWarnings`,
    });

  const tiles: TileSaveV2[] = [];
  for (let i = 0; i < tilesU.length; i++) {
    const tr = validateTileSaveV2(tilesU[i], `${path}.tiles[${i}]`);
    if (isErr(tr)) return err(tr.error);
    tiles.push(tr.value);
  }

  const enemies: EnemySaveV2[] = [];
  for (let i = 0; i < enemiesU.length; i++) {
    const er = validateEnemySaveV2(enemiesU[i], `${path}.enemies[${i}]`);
    if (isErr(er)) return err(er.error);
    enemies.push(er.value);
  }

  const items: ItemSaveV2[] = [];
  for (let i = 0; i < itemsU.length; i++) {
    const ir = validateItemSaveV2(itemsU[i], `${path}.items[${i}]`);
    if (isErr(ir)) return err(ir.error);
    items.push(ir.value);
  }

  const projectiles: ProjectileSaveV2[] = [];
  for (let i = 0; i < projectilesU.length; i++) {
    const pr = validateProjectileSaveV2(projectilesU[i], `${path}.projectiles[${i}]`);
    if (isErr(pr)) return err(pr.error);
    projectiles.push(pr.value);
  }

  const hitWarnings: HitWarningSaveV2[] = [];
  for (let i = 0; i < hitWarningsU.length; i++) {
    const hr = validateHitWarningSaveV2(hitWarningsU[i], `${path}.hitWarnings[${i}]`);
    if (isErr(hr)) return err(hr.error);
    hitWarnings.push(hr.value);
  }

  return ok({
    roomGid: roomGidR.value,
    roomId: roomIdU,
    roomX,
    roomY,
    pathId,
    mapGroup,
    entered,
    active,
    onScreen,
    tiles,
    enemies,
    items,
    projectiles,
    hitWarnings,
  });
};

const validateTileSaveV2 = (v: unknown, path: string): Result<TileSaveV2> => {
  if (!isRecord(v)) return err({ kind: "InvalidSchema", message: "tile must be an object", path });
  const kindU = get(v, "kind");
  if (!isOneOf(kindU, TILE_KINDS)) {
    return err({ kind: "InvalidSchema", message: "Invalid tile kind", path: `${path}.kind` });
  }
  const kind = kindU;
  const x = get(v, "x");
  const y = get(v, "y");
  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be number", path: `${path}.y` });

  const gidU = get(v, "gid");
  let gid: Gid | undefined = undefined;
  if (gidU !== undefined) {
    const g = asGid(gidU, `${path}.gid`);
    if (isErr(g)) return err(g.error);
    gid = g.value;
  }

  switch (kind) {
    case "door": {
      const doorGidR = asGid(get(v, "gid"), `${path}.gid`);
      if (isErr(doorGidR)) return err(doorGidR.error);
      const doorTypeR = asDoorKind(get(v, "doorType"), `${path}.doorType`);
      if (isErr(doorTypeR)) return err(doorTypeR.error);
      const doorDirR = asDirectionKind(get(v, "doorDir"), `${path}.doorDir`);
      if (isErr(doorDirR)) return err(doorDirR.error);
      const tunnelDoor = get(v, "tunnelDoor");
      const opened = get(v, "opened");
      const locked = get(v, "locked");
      if (!isBoolean(tunnelDoor))
        return err({ kind: "InvalidSchema", message: "tunnelDoor must be boolean", path: `${path}.tunnelDoor` });
      if (!isBoolean(opened))
        return err({ kind: "InvalidSchema", message: "opened must be boolean", path: `${path}.opened` });
      if (!isBoolean(locked))
        return err({ kind: "InvalidSchema", message: "locked must be boolean", path: `${path}.locked` });

      const lockU = get(v, "lock");
      let lock: { lockType: LockKind; keyId: number } | undefined = undefined;
      if (lockU !== undefined) {
        if (!isRecord(lockU)) {
          return err({ kind: "InvalidSchema", message: "lock must be object", path: `${path}.lock` });
        }
        const lockTypeR = asLockKind(get(lockU, "lockType"), `${path}.lock.lockType`);
        if (isErr(lockTypeR)) return err(lockTypeR.error);
        const keyId = get(lockU, "keyId");
        if (!isNumber(keyId)) {
          return err({ kind: "InvalidSchema", message: "keyId must be number", path: `${path}.lock.keyId` });
        }
        lock = { lockType: lockTypeR.value, keyId };
      }

      const linkedDoorGidU = get(v, "linkedDoorGid");
      let linkedDoorGid: Gid | undefined = undefined;
      if (linkedDoorGidU !== undefined) {
        const lg = asGid(linkedDoorGidU, `${path}.linkedDoorGid`);
        if (isErr(lg)) return err(lg.error);
        linkedDoorGid = lg.value;
      }

      return ok({
        kind: "door",
        gid: doorGidR.value,
        x,
        y,
        doorType: doorTypeR.value,
        doorDir: doorDirR.value,
        tunnelDoor,
        opened,
        locked,
        lock,
        linkedDoorGid,
      });
    }
    case "inside_level_door": {
      const doorGidR = asGid(get(v, "gid"), `${path}.gid`);
      if (isErr(doorGidR)) return err(doorGidR.error);
      const opened = get(v, "opened");
      if (!isBoolean(opened))
        return err({ kind: "InvalidSchema", message: "opened must be boolean", path: `${path}.opened` });
      return ok({ kind: "inside_level_door", gid: doorGidR.value, x, y, opened });
    }
    case "button": {
      const buttonGidR = asGid(get(v, "gid"), `${path}.gid`);
      if (isErr(buttonGidR)) return err(buttonGidR.error);
      const linkedDoorGidU = get(v, "linkedDoorGid");
      let linkedDoorGid: Gid | undefined = undefined;
      if (linkedDoorGidU !== undefined) {
        const lg = asGid(linkedDoorGidU, `${path}.linkedDoorGid`);
        if (isErr(lg)) return err(lg.error);
        linkedDoorGid = lg.value;
      }
      return ok({ kind: "button", gid: buttonGidR.value, x, y, linkedDoorGid });
    }
    case "down_ladder": {
      const isSidePath = get(v, "isSidePath");
      if (!isBoolean(isSidePath))
        return err({ kind: "InvalidSchema", message: "isSidePath must be boolean", path: `${path}.isSidePath` });
      const envR = asEnvKind(get(v, "environment"), `${path}.environment`);
      if (isErr(envR)) return err(envR.error);
      const lockU = get(v, "lock");
      let lock: { lockType: LockKind; keyId: number } | undefined = undefined;
      if (lockU !== undefined) {
        if (!isRecord(lockU)) {
          return err({ kind: "InvalidSchema", message: "lock must be object", path: `${path}.lock` });
        }
        const lockTypeR = asLockKind(get(lockU, "lockType"), `${path}.lock.lockType`);
        if (isErr(lockTypeR)) return err(lockTypeR.error);
        const keyId = get(lockU, "keyId");
        if (!isNumber(keyId)) {
          return err({ kind: "InvalidSchema", message: "keyId must be number", path: `${path}.lock.keyId` });
        }
        lock = { lockType: lockTypeR.value, keyId };
      }
      const linkedRoomGidU = get(v, "linkedRoomGid");
      let linkedRoomGid: Gid | undefined = undefined;
      if (linkedRoomGidU !== undefined) {
        const lg = asGid(linkedRoomGidU, `${path}.linkedRoomGid`);
        if (isErr(lg)) return err(lg.error);
        linkedRoomGid = lg.value;
      }
      return ok({
        kind: "down_ladder",
        gid,
        x,
        y,
        isSidePath,
        environment: envR.value,
        lock,
        linkedRoomGid,
      });
    }
    case "up_ladder": {
      const isRope = get(v, "isRope");
      if (!isBoolean(isRope))
        return err({ kind: "InvalidSchema", message: "isRope must be boolean", path: `${path}.isRope` });
      const linkedRoomGidU = get(v, "linkedRoomGid");
      let linkedRoomGid: Gid | undefined = undefined;
      if (linkedRoomGidU !== undefined) {
        const lg = asGid(linkedRoomGidU, `${path}.linkedRoomGid`);
        if (isErr(lg)) return err(lg.error);
        linkedRoomGid = lg.value;
      }
      return ok({ kind: "up_ladder", gid, x, y, isRope, linkedRoomGid });
    }
    case "spike_trap": {
      const triggered = get(v, "triggered");
      if (!isBoolean(triggered))
        return err({ kind: "InvalidSchema", message: "triggered must be boolean", path: `${path}.triggered` });
      return ok({ kind: "spike_trap", gid, x, y, triggered });
    }
    case "fountain": {
      const subTileX = get(v, "subTileX");
      const subTileY = get(v, "subTileY");
      if (!isNumber(subTileX))
        return err({ kind: "InvalidSchema", message: "subTileX must be number", path: `${path}.subTileX` });
      if (!isNumber(subTileY))
        return err({ kind: "InvalidSchema", message: "subTileY must be number", path: `${path}.subTileY` });
      return ok({ kind: "fountain", gid, x, y, subTileX, subTileY });
    }
    case "coffin": {
      const subTileY = get(v, "subTileY");
      if (!isNumber(subTileY))
        return err({ kind: "InvalidSchema", message: "subTileY must be number", path: `${path}.subTileY` });
      return ok({ kind: "coffin", gid, x, y, subTileY });
    }
    case "wall_torch": {
      const isBottomWall = get(v, "isBottomWall");
      const frame = get(v, "frame");
      if (!isBoolean(isBottomWall))
        return err({ kind: "InvalidSchema", message: "isBottomWall must be boolean", path: `${path}.isBottomWall` });
      if (!isNumber(frame))
        return err({ kind: "InvalidSchema", message: "frame must be number", path: `${path}.frame` });
      return ok({ kind: "wall_torch", gid, x, y, isBottomWall, frame });
    }
    case "window": {
      const isBottomWall = get(v, "isBottomWall");
      if (!isBoolean(isBottomWall))
        return err({ kind: "InvalidSchema", message: "isBottomWall must be boolean", path: `${path}.isBottomWall` });
      return ok({ kind: "window", gid, x, y, isBottomWall });
    }
    default: {
      return err({ kind: "InvalidSchema", message: "Invalid tile kind", path: `${path}.kind` });
    }
  }
};

const validateEnemySaveV2 = (v: unknown, path: string): Result<EnemySaveV2> => {
  if (!isRecord(v)) return err({ kind: "InvalidSchema", message: "enemy must be an object", path });
  const kindR = asEnemyKind(get(v, "kind"), `${path}.kind`);
  if (isErr(kindR)) return err(kindR.error);
  const gidR = asGid(get(v, "gid"), `${path}.gid`);
  if (isErr(gidR)) return err(gidR.error);
  const roomGidR = asGid(get(v, "roomGid"), `${path}.roomGid`);
  if (isErr(roomGidR)) return err(roomGidR.error);
  const x = get(v, "x");
  const y = get(v, "y");
  const directionU = get(v, "direction");
  const health = get(v, "health");
  const maxHealth = get(v, "maxHealth");
  const dead = get(v, "dead");
  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be number", path: `${path}.y` });
  const dirR = asDirectionKind(directionU, `${path}.direction`);
  if (isErr(dirR)) return err(dirR.error);
  if (!isNumber(health)) return err({ kind: "InvalidSchema", message: "health must be number", path: `${path}.health` });
  if (!isNumber(maxHealth))
    return err({ kind: "InvalidSchema", message: "maxHealth must be number", path: `${path}.maxHealth` });
  if (!isBoolean(dead)) return err({ kind: "InvalidSchema", message: "dead must be boolean", path: `${path}.dead` });

  const kind = kindR.value;
  if (kind === "chest") {
    const opened = get(v, "opened");
    const destroyable = get(v, "destroyable");
    if (!isBoolean(opened))
      return err({ kind: "InvalidSchema", message: "opened must be boolean", path: `${path}.opened` });
    if (!isBoolean(destroyable))
      return err({ kind: "InvalidSchema", message: "destroyable must be boolean", path: `${path}.destroyable` });
    return ok({
      kind,
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      direction: dirR.value,
      health,
      maxHealth,
      dead,
      opened,
      destroyable,
      spawnedItemGids: undefined,
    });
  }
  if (kind === "vending_machine") {
    const openU = get(v, "open");
    const quantity = get(v, "quantity");
    const isInfiniteU = get(v, "isInfinite");
    const costItemsU = get(v, "costItems");
    const itemU = get(v, "item");
    if (!isBoolean(openU))
      return err({ kind: "InvalidSchema", message: "open must be boolean", path: `${path}.open` });
    if (!isNumber(quantity))
      return err({ kind: "InvalidSchema", message: "quantity must be number", path: `${path}.quantity` });
    if (!isBoolean(isInfiniteU))
      return err({ kind: "InvalidSchema", message: "isInfinite must be boolean", path: `${path}.isInfinite` });
    if (!Array.isArray(costItemsU))
      return err({ kind: "InvalidSchema", message: "costItems must be array", path: `${path}.costItems` });
    const costItems: ItemSaveV2[] = [];
    for (let i = 0; i < costItemsU.length; i++) {
      const ir = validateItemSaveV2(costItemsU[i], `${path}.costItems[${i}]`);
      if (isErr(ir)) return err(ir.error);
      costItems.push(ir.value);
    }
    const itemR = validateItemSaveV2(itemU, `${path}.item`);
    if (isErr(itemR)) return err(itemR.error);
    return ok({
      kind,
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      direction: dirR.value,
      health,
      maxHealth,
      dead,
      open: openU,
      quantity,
      isInfinite: isInfiniteU,
      costItems,
      item: itemR.value,
    });
  }
  if (kind === "spawner") {
    const enemySpawnTypeU = get(v, "enemySpawnType");
    if (!isNumber(enemySpawnTypeU)) {
      return err({
        kind: "InvalidSchema",
        message: "enemySpawnType must be number",
        path: `${path}.enemySpawnType`,
      });
    }
    return ok({
      kind,
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      direction: dirR.value,
      health,
      maxHealth,
      dead,
      enemySpawnType: enemySpawnTypeU,
    });
  }

  if (kind === "wizard") {
    const wizardTypeR = asWizardTypeKind(get(v, "wizardType"), `${path}.wizardType`);
    if (isErr(wizardTypeR)) return err(wizardTypeR.error);

    const wizardStateU = get(v, "wizardState");
    const seenPlayerU = get(v, "seenPlayer");
    const ticksU = get(v, "ticks");
    if (!isNumber(wizardStateU))
      return err({ kind: "InvalidSchema", message: "wizardState must be number", path: `${path}.wizardState` });
    if (!isBoolean(seenPlayerU))
      return err({ kind: "InvalidSchema", message: "seenPlayer must be boolean", path: `${path}.seenPlayer` });
    if (!isNumber(ticksU))
      return err({ kind: "InvalidSchema", message: "ticks must be number", path: `${path}.ticks` });

    const alertTicksU = get(v, "alertTicks");
    const skipNextTurnsU = get(v, "skipNextTurns");
    const buffedU = get(v, "buffed");
    const buffedBeforeU = get(v, "buffedBefore");

    let alertTicks: number | undefined = undefined;
    if (alertTicksU !== undefined) {
      if (!isNumber(alertTicksU))
        return err({
          kind: "InvalidSchema",
          message: "alertTicks must be number if present",
          path: `${path}.alertTicks`,
        });
      alertTicks = alertTicksU;
    }

    let skipNextTurns: number | undefined = undefined;
    if (skipNextTurnsU !== undefined) {
      if (!isNumber(skipNextTurnsU))
        return err({
          kind: "InvalidSchema",
          message: "skipNextTurns must be number if present",
          path: `${path}.skipNextTurns`,
        });
      skipNextTurns = skipNextTurnsU;
    }

    let buffed: boolean | undefined = undefined;
    if (buffedU !== undefined) {
      if (!isBoolean(buffedU))
        return err({ kind: "InvalidSchema", message: "buffed must be boolean if present", path: `${path}.buffed` });
      buffed = buffedU;
    }

    let buffedBefore: boolean | undefined = undefined;
    if (buffedBeforeU !== undefined) {
      if (!isBoolean(buffedBeforeU))
        return err({
          kind: "InvalidSchema",
          message: "buffedBefore must be boolean if present",
          path: `${path}.buffedBefore`,
        });
      buffedBefore = buffedBeforeU;
    }

    return ok({
      kind,
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      direction: dirR.value,
      health,
      maxHealth,
      dead,
      wizardType: wizardTypeR.value,
      wizardState: wizardStateU,
      seenPlayer: seenPlayerU,
      ticks: ticksU,
      alertTicks,
      skipNextTurns,
      buffed,
      buffedBefore,
    });
  }

  // Basic enemy kinds
  return ok({
    kind,
    gid: gidR.value,
    roomGid: roomGidR.value,
    x,
    y,
    direction: dirR.value,
    health,
    maxHealth,
    dead,
    alertTicks: undefined,
    unconscious: undefined,
    skipNextTurns: undefined,
    shield: undefined,
    buffed: undefined,
    buffedBefore: undefined,
  });
};

const validateProjectileSaveV2 = (v: unknown, path: string): Result<ProjectileSaveV2> => {
  if (!isRecord(v)) return err({ kind: "InvalidSchema", message: "projectile must be object", path });
  const kindR = asProjectileKind(get(v, "kind"), `${path}.kind`);
  if (isErr(kindR)) return err(kindR.error);
  const gidR = asGid(get(v, "gid"), `${path}.gid`);
  if (isErr(gidR)) return err(gidR.error);
  const roomGidR = asGid(get(v, "roomGid"), `${path}.roomGid`);
  if (isErr(roomGidR)) return err(roomGidR.error);
  const x = get(v, "x");
  const y = get(v, "y");
  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be number", path: `${path}.y` });

  if (kindR.value === "wizard_fireball") {
    const deadU = get(v, "dead");
    if (!isBoolean(deadU))
      return err({ kind: "InvalidSchema", message: "dead must be boolean", path: `${path}.dead` });
    const parentGidR = asGid(get(v, "parentGid"), `${path}.parentGid`);
    if (isErr(parentGidR)) return err(parentGidR.error);
    const stateU = get(v, "state");
    if (!isNumber(stateU))
      return err({ kind: "InvalidSchema", message: "state must be number", path: `${path}.state` });
    const delayU = get(v, "delay");
    let delay: number | undefined = undefined;
    if (delayU !== undefined) {
      if (!isNumber(delayU))
        return err({ kind: "InvalidSchema", message: "delay must be number if present", path: `${path}.delay` });
      delay = delayU;
    }

    return ok({
      kind: "wizard_fireball",
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      dead: deadU,
      parentGid: parentGidR.value,
      state: stateU,
      delay,
    });
  }

  if (kindR.value === "enemy_spawn_animation") {
    const deadU = get(v, "dead");
    if (!isBoolean(deadU))
      return err({ kind: "InvalidSchema", message: "dead must be boolean", path: `${path}.dead` });
    const enemyU = get(v, "enemy");
    const er = validateEnemySaveV2(enemyU, `${path}.enemy`);
    if (isErr(er)) return err(er.error);
    return ok({
      kind: "enemy_spawn_animation",
      gid: gidR.value,
      roomGid: roomGidR.value,
      x,
      y,
      dead: deadU,
      enemy: er.value,
    });
  }

  return err({ kind: "InvalidSchema", message: "Unhandled projectile kind", path: `${path}.kind` });
};

const validateHitWarningSaveV2 = (v: unknown, path: string): Result<HitWarningSaveV2> => {
  if (!isRecord(v)) return err({ kind: "InvalidSchema", message: "hitWarning must be object", path });
  const x = get(v, "x");
  const y = get(v, "y");
  const dead = get(v, "dead");
  if (!isNumber(x)) return err({ kind: "InvalidSchema", message: "x must be number", path: `${path}.x` });
  if (!isNumber(y)) return err({ kind: "InvalidSchema", message: "y must be number", path: `${path}.y` });
  if (!isBoolean(dead))
    return err({ kind: "InvalidSchema", message: "dead must be boolean", path: `${path}.dead` });
  return ok({ x, y, dead });
};
