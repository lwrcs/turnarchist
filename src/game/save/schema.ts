/**
 * Save schema types (target: V2)
 * ------------------------------------------------------------
 * Types only. No runtime behavior should live in this file.
 *
 * Key rules:
 * - All polymorphic values use stable string discriminators: `kind`.
 * - Cross-references are by stable string IDs: `...Gid`.
 * - Saves are versioned: `saveVersion`.
 */

export type SaveVersion = 2;

// Runtime marker to help tooling/watchers notice schema changes (types are erased at runtime).
export const SAVE_V2_SCHEMA_MARKER = 1 as const;

/** Base-36-ish opaque ID string. Do not assume structure beyond being a string. */
export type Gid = string;

export type SaveV2 = {
  saveVersion: SaveVersion;
  meta?: SaveMeta;
  worldSpec: WorldSpecV2;
  delta: WorldDeltaV2;
};

export type SaveMeta = {
  /** Optional semver or git hash, for debugging. */
  build?: string;
  /** Optional timestamp (ms since epoch). */
  savedAtMs?: number;
};

/**
 * Deterministic world definition.
 * This should be sufficient to re-generate the world geometry.
 */
export type WorldSpecV2 = {
  /** Main run seed (levelgen seed). */
  seed: number;
  /** RNG internal state at time of save. */
  rngState: number;
  /** Generator version string; bump when generation meaningfully changes. */
  genVersion: string;

  /** Current depth to generate up to / load into. */
  depth: number;

  /** Environment selection for the current depth (main path). */
  env: EnvKind;

  /**
   * Generation plan for main path floors 0..depth.
   * Optional for backward-compat with early V2 saves.
   */
  mainPathPlan?: Array<MainPathGenPlanV2>;

  /** Sidepaths that must be pre-generated deterministically. */
  sidepaths: Array<SidepathSpecV2>;
};

export type MainPathGenPlanV2 = {
  depth: number;
  kind: "png" | "procedural";
  pngUrl?: string;
};

export type SidepathSpecV2 = {
  pathId: string;
  /** Optional fixed room count for determinism. */
  rooms?: number;
};

/**
 * Mutable state layered on top of regenerated world.
 * This should include any state that can change during play and must persist.
 */
export type WorldDeltaV2 = {
  players: Record<string, PlayerSaveV2>;
  offlinePlayers: Record<string, PlayerSaveV2>;

  /**
   * Room-level mutable state. Rooms must be identified by stable `roomGid`.
   * Room ordering is never used as an identifier.
   */
  rooms: Array<RoomDeltaV2>;
};

export type RoomDeltaV2 = {
  roomGid: Gid;
  /** Deterministic locator within a generated level. Used to re-associate saved roomGid on load. */
  roomId: number;
  /**
   * Generated room origin in world tile coordinates.
   * Optional for backward-compat with early V2 saves.
   */
  roomX?: number;
  roomY?: number;
  pathId: string;
  mapGroup: number;
  entered: boolean;
  active: boolean;
  onScreen: boolean;

  /** Tile overrides (only for tiles whose runtime state can change). */
  tiles: Array<TileSaveV2>;

  /** Dynamic objects */
  enemies: Array<EnemySaveV2>;
  items: Array<ItemSaveV2>;
  projectiles: Array<ProjectileSaveV2>;
  hitWarnings: Array<HitWarningSaveV2>;
};

export type PlayerSaveV2 = {
  id: string;
  x: number;
  y: number;
  dead: boolean;
  direction: DirectionKind;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;

  /** Player position is anchored to a room by stable ID. */
  roomGid: Gid;

  inventory: InventorySaveV2;

  sightRadius: number;
  light?: PlayerLightSaveV2;
};

export type PlayerLightSaveV2 = {
  equipped: boolean;
  colorRgb: [number, number, number];
  brightness: number;
};

export type InventorySaveV2 = {
  isOpen: boolean;
  cols: number;
  rows: number;
  selX: number;
  selY: number;
  coins: number;
  expansion: number;

  /** Packed inventory slots by index. */
  slots: Array<ItemSaveV2 | null>;

  /**
   * If a weapon is equipped, this points at the slot index it occupies.
   * (Avoids referencing runtime object identity.)
   */
  equippedWeaponSlot?: number;
};

/**
 * Tile persistence uses discriminated unions.
 * IMPORTANT: only persist tiles whose runtime state changes and must be restored.
 */
export type TileSaveV2 =
  | DoorTileSaveV2
  | InsideLevelDoorTileSaveV2
  | ButtonTileSaveV2
  | DownLadderTileSaveV2
  | UpLadderTileSaveV2
  | SpikeTrapTileSaveV2
  | FountainTileSaveV2
  | CoffinTileSaveV2
  | WallTorchTileSaveV2
  | WindowTileSaveV2;

export type BaseTileSaveV2 = {
  kind: TileKind;
  x: number;
  y: number;
  gid?: Gid;
};

export type DoorTileSaveV2 = BaseTileSaveV2 & {
  kind: "door";
  gid: Gid;
  doorType: DoorKind;
  doorDir: DirectionKind;
  tunnelDoor: boolean;
  opened: boolean;
  locked: boolean;
  lock?: { lockType: LockKind; keyId: number };
  linkedDoorGid?: Gid;
};

export type InsideLevelDoorTileSaveV2 = BaseTileSaveV2 & {
  kind: "inside_level_door";
  gid: Gid;
  opened: boolean;
};

export type ButtonTileSaveV2 = BaseTileSaveV2 & {
  kind: "button";
  gid: Gid;
  linkedDoorGid?: Gid;
};

export type DownLadderTileSaveV2 = BaseTileSaveV2 & {
  kind: "down_ladder";
  gid?: Gid;
  isSidePath: boolean;
  environment: EnvKind;
  lock?: { lockType: LockKind; keyId: number };
  linkedRoomGid?: Gid;
};

export type UpLadderTileSaveV2 = BaseTileSaveV2 & {
  kind: "up_ladder";
  gid?: Gid;
  isRope: boolean;
  linkedRoomGid?: Gid;
};

export type SpikeTrapTileSaveV2 = BaseTileSaveV2 & {
  kind: "spike_trap";
  triggered: boolean;
};

export type FountainTileSaveV2 = BaseTileSaveV2 & {
  kind: "fountain";
  subTileX: number;
  subTileY: number;
};

export type CoffinTileSaveV2 = BaseTileSaveV2 & {
  kind: "coffin";
  subTileY: number;
};

export type WallTorchTileSaveV2 = BaseTileSaveV2 & {
  kind: "wall_torch";
  isBottomWall: boolean;
  frame: number;
};

export type WindowTileSaveV2 = BaseTileSaveV2 & {
  kind: "window";
  isBottomWall: boolean;
};

/**
 * Dynamic objects use registries keyed by `kind`.
 * The schema types define only the common envelope here;
 * specific kinds can extend via unions incrementally.
 */
export type EnemySaveV2 = EnemySaveEnvelopeV2 & (
  | BasicEnemySaveV2
  | ChestEnemySaveV2
  | VendingMachineEnemySaveV2
  | SpawnerEnemySaveV2
  | WizardEnemySaveV2
);

export type EnemySaveEnvelopeV2 = {
  kind: EnemyKind;
  gid: Gid;
  roomGid: Gid;
  x: number;
  y: number;
  direction: DirectionKind;
  health: number;
  maxHealth: number;
  dead: boolean;
};

export type BasicEnemySaveV2 = EnemySaveEnvelopeV2 & {
  kind: Exclude<EnemyKind, "chest" | "vending_machine" | "spawner" | "wizard">;
  alertTicks?: number;
  unconscious?: boolean;
  skipNextTurns?: number;
  shield?: { health: number };
  buffed?: boolean;
  buffedBefore?: boolean;
};

export type WizardTypeKind = "energy" | "fire" | "earth";

export type WizardEnemySaveV2 = EnemySaveEnvelopeV2 & {
  kind: "wizard";
  wizardType: WizardTypeKind;
  wizardState: number;
  seenPlayer: boolean;
  ticks: number;
  alertTicks?: number;
  skipNextTurns?: number;
  buffed?: boolean;
  buffedBefore?: boolean;
};

export type ChestEnemySaveV2 = EnemySaveEnvelopeV2 & {
  kind: "chest";
  opened: boolean;
  destroyable: boolean;
  /** Item gids that were spawned by this chest (optional explicit linkage). */
  spawnedItemGids?: Array<Gid>;
};

export type VendingMachineEnemySaveV2 = EnemySaveEnvelopeV2 & {
  kind: "vending_machine";
  open: boolean;
  quantity: number;
  isInfinite: boolean;
  costItems: Array<ItemSaveV2>;
  item: ItemSaveV2;
};

export type SpawnerEnemySaveV2 = EnemySaveEnvelopeV2 & {
  kind: "spawner";
  enemySpawnType: number;
};

export type ItemSaveV2 =
  | StackableItemSaveV2
  | EquipmentItemSaveV2
  | LightItemSaveV2
  | DivingHelmetItemSaveV2
  | HourglassItemSaveV2
  | WeaponItemSaveV2
  | ShieldItemSaveV2
  | KeyItemSaveV2;

export type ItemSaveEnvelopeV2 = {
  kind: ItemKind;
  gid: Gid;
  x: number;
  y: number;
  roomGid?: Gid;
  stackCount: number;
  pickedUp: boolean;
};

export type StackableItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: Exclude<
    ItemKind,
    | "key"
    | "torch"
    | "lantern"
    | "candle"
    | "glow_stick"
    | "glow_bugs"
    | "glowshrooms"
    | WeaponItemKind
    | ShieldItemKind
    | DivingHelmetItemSaveV2["kind"]
    | HourglassItemSaveV2["kind"]
  >;
};

export type EquipmentItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: Exclude<
    ItemKind,
    | "key"
    | "torch"
    | "lantern"
    | "candle"
    | "glow_stick"
    | "glow_bugs"
    | "glowshrooms"
    | WeaponItemKind
    | ShieldItemKind
    | DivingHelmetItemSaveV2["kind"]
    | HourglassItemSaveV2["kind"]
  >;
  equipped?: boolean;
};

export type LightItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: "torch" | "lantern" | "candle" | "glow_stick" | "glow_bugs" | "glowshrooms";
  fuel: number;
  equipped?: boolean;
};

export type DivingHelmetItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: "diving_helmet";
  equipped?: boolean;
  currentAir: number;
};

export type HourglassItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: "hourglass";
  durability: number;
  durabilityMax: number;
  broken: boolean;
};

export type WeaponStatusSaveV2 = {
  poison: boolean;
  blood: boolean;
  curse: boolean;
};

export type WeaponItemKind =
  | "dagger"
  | "sword"
  | "spear"
  | "dual_daggers"
  | "greataxe"
  | "warhammer"
  | "quarterstaff"
  | "scythe"
  | "crossbow"
  | "shotgun"
  | "slingshot"
  | "spellbook"
  | "pickaxe";

export type BaseWeaponItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: Exclude<WeaponItemKind, "crossbow">;
  durability: number;
  durabilityMax: number;
  broken: boolean;
  cooldown: number;
  cooldownMax: number;
  status: WeaponStatusSaveV2;
  equipped?: boolean;
};

export type CrossbowWeaponItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: "crossbow";
  durability: number;
  durabilityMax: number;
  broken: boolean;
  cooldown: number;
  cooldownMax: number;
  status: WeaponStatusSaveV2;
  equipped?: boolean;
  /** Crossbow's internal state-machine (enum ordinal). */
  crossbowState: number;
};

export type WeaponItemSaveV2 = BaseWeaponItemSaveV2 | CrossbowWeaponItemSaveV2;

export type ShieldItemKind = "occult_shield" | "wooden_shield";

export type ShieldItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: ShieldItemKind;
  equipped?: boolean;
  health: number;
  rechargeTurnCounter: number;
};

export type KeyItemSaveV2 = ItemSaveEnvelopeV2 & {
  kind: "key";
  /** Which lock this key matches. */
  doorId: number;
  /** Which depth this key is bound to (null means "not yet bound"). */
  depth: number | null;
  /** UI-only: whether the key is currently showing its path guide. */
  showPath: boolean;
};

export type EnemySpawnAnimationProjectileSaveV2 = {
  kind: "enemy_spawn_animation";
  gid: Gid;
  roomGid: Gid;
  x: number;
  y: number;
  dead: boolean;
  enemy: EnemySaveV2;
};

export type WizardFireballProjectileSaveV2 = {
  kind: "wizard_fireball";
  gid: Gid;
  roomGid: Gid;
  x: number;
  y: number;
  dead: boolean;
  parentGid: Gid;
  state: number;
  delay?: number;
};

export type ProjectileSaveV2 =
  | WizardFireballProjectileSaveV2
  | EnemySpawnAnimationProjectileSaveV2;

export type HitWarningSaveV2 = {
  x: number;
  y: number;
  dead: boolean;
};

/**
 * Stable string unions.
 * These start minimal and should be expanded as we implement registry coverage.
 */
export type EnvKind =
  | "dungeon"
  | "cave"
  | "forest"
  | "castle"
  | "glacier"
  | "dark_castle"
  | "placeholder"
  | "desert"
  | "magma_cave"
  | "dark_dungeon"
  | "tutorial"
  | "flooded_cave";

export type DirectionKind =
  | "down"
  | "up"
  | "right"
  | "left"
  | "down_right"
  | "up_left"
  | "up_right"
  | "down_left"
  | "center";

/**
 * Door "type" in the save should mirror runtime `DoorType` semantics, not a UI name.
 * This is intentionally separate from `TileKind` ("door" is still the tile kind).
 */
export type DoorKind = "door" | "locked_door" | "guarded_door" | "tunnel_door";

/**
 * Lock kind should mirror runtime `LockType` semantics (see `tile/lockable.ts`).
 * Keys are represented via `keyId` where applicable.
 */
export type LockKind = "none" | "locked" | "guarded" | "tunnel";

export type TileKind =
  | "door"
  | "inside_level_door"
  | "button"
  | "down_ladder"
  | "up_ladder"
  | "spike_trap"
  | "fountain"
  | "coffin"
  | "wall_torch"
  | "window";

export type EnemyKind =
  | "barrel"
  | "chest"
  | "vending_machine"
  | "spawner"
  | "wizard"
  | "zombie"
  | "occultist"
  | "exalter"
  // Enemies
  | "armored_skull"
  | "armored_zombie"
  | "beetle"
  | "bishop"
  | "boltcaster"
  | "charge"
  | "crab"
  | "crusher"
  | "frog"
  | "big_frog"
  | "glow_bug"
  | "king"
  | "knight"
  | "big_knight"
  | "mummy"
  | "pawn"
  | "queen"
  | "rook"
  | "skull"
  | "big_skull"
  | "big_zombie"
  | "spider"
  | "warden"
  // Props / objects (room.entities)
  | "crate"
  | "dark_crate"
  | "pot"
  | "dark_pot"
  | "pumpkin"
  | "tomb_stone"
  | "furnace"
  | "fishing_spot"
  | "mushrooms_prop"
  | "potted_plant"
  // Resources (room.entities)
  | "coal_resource"
  | "gold_resource"
  | "iron_resource"
  | "emerald_resource"
  | "zircon_resource"
  | "amber_resource"
  | "garnet_resource"
  | "rock_resource"
  | "cave_rock_resource"
  | "obsidian_resource";

export const ITEM_KIND_VALUES_V2 = [
  // Resources/consumables/etc (envelope only)
  "coal",
  "coin",
  "key",
  "golden_key",
  "blue_potion",
  "green_potion",
  "health_potion",
  "hourglass",
  "apple",
  "fish",
  "mushrooms",
  "weapon_poison",
  "weapon_blood",
  "weapon_curse",
  "spellbook_page",
  "weapon_fragments",
  "backpack",
  "torch",
  "lantern",
  "candle",
  "glow_stick",
  "glow_bugs",
  "glowshrooms",
  "geode",
  "stone",
  "blue_gem",
  "green_gem",
  "red_gem",
  "orange_gem",
  "gold_ore",
  "iron_ore",
  "gold_bar",
  "iron_bar",
  "fishing_rod",
  "hammer",
  // Equipment (envelope only)
  "gold_ring",
  "emerald_ring",
  "zircon_ring",
  "amber_ring",
  "garnet_ring",
  // Special equipment (custom state)
  "diving_helmet",
  // weapons
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
  // shields
  "occult_shield",
  "wooden_shield",
] as const;

export type ItemKind = (typeof ITEM_KIND_VALUES_V2)[number];

export type ProjectileKind = "wizard_fireball" | "enemy_spawn_animation";


