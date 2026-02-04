import type { Entity } from "../../../entity/entity";
import { Barrel } from "../../../entity/object/barrel";
import { Bomb } from "../../../entity/object/bomb";
import { Block } from "../../../entity/object/block";
import { Bush } from "../../../entity/object/bush";
import { Chest } from "../../../entity/object/chest";
import { Crate } from "../../../entity/object/crate";
import { DarkCrate } from "../../../entity/object/darkCrate";
import { DecoBlock } from "../../../entity/object/decoBlock";
import { CaveBlock } from "../../../entity/object/caveBlock";
import { ObsidianBlock } from "../../../entity/object/obsidianBlock";
import { Rubble } from "../../../entity/object/rubble";
import { Pot } from "../../../entity/object/pot";
import { DarkPot } from "../../../entity/object/darkPot";
import { DarkVase } from "../../../entity/object/darkVase";
import { Candelabra } from "../../../entity/object/candelabra";
import { Pumpkin } from "../../../entity/object/pumpkin";
import { TombStone } from "../../../entity/object/tombStone";
import { Furnace } from "../../../entity/object/furnace";
import { FishingSpot } from "../../../entity/object/fishingSpot";
import { Mushrooms } from "../../../entity/object/mushrooms";
import { Glowshrooms } from "../../../entity/object/glowshrooms";
import { PottedPlant } from "../../../entity/object/pottedPlant";
import { Sprout } from "../../../entity/object/sprout";
import { LilyPlant } from "../../../entity/object/lilyPlant";
import { Tree } from "../../../entity/object/tree";
import { BigTree } from "../../../entity/object/bigTree";
import { TallSucculent } from "../../../entity/object/tallSucculent";
import { Succulent } from "../../../entity/object/succulent";
import { SmallBush } from "../../../entity/object/smallBush";
import { PawnStatue } from "../../../entity/object/pawnStatue";
import { RookStatue } from "../../../entity/object/rookStatue";
import { BishopStatue } from "../../../entity/object/bishopStatue";
import { FallenPillar } from "../../../entity/object/fallenPillar";
import { VendingMachine } from "../../../entity/object/vendingMachine";
import { CoalResource } from "../../../entity/resource/coalResource";
import { GoldResource } from "../../../entity/resource/goldResource";
import { IronResource } from "../../../entity/resource/ironResource";
import { EmeraldResource } from "../../../entity/resource/emeraldResource";
import { ZirconResource } from "../../../entity/resource/zirconResource";
import { AmberResource } from "../../../entity/resource/amberResource";
import { GarnetResource } from "../../../entity/resource/garnetResource";
import { Rock } from "../../../entity/resource/rockResource";
import { CaveRock } from "../../../entity/resource/caveRockResource";
import { ObsidianResource } from "../../../entity/resource/obsidianResource";
import { Spawner } from "../../../entity/enemy/spawner";
import { ArmoredSkullEnemy } from "../../../entity/enemy/armoredSkullEnemy";
import { ArmoredzombieEnemy } from "../../../entity/enemy/armoredzombieEnemy";
import { BeetleEnemy } from "../../../entity/enemy/beetleEnemy";
import { BishopEnemy } from "../../../entity/enemy/bishopEnemy";
import { BoltcasterEnemy } from "../../../entity/enemy/boltcasterEnemy";
import { ChargeEnemy } from "../../../entity/enemy/chargeEnemy";
import { CrabEnemy } from "../../../entity/enemy/crabEnemy";
import { CrusherEnemy } from "../../../entity/enemy/crusherEnemy";
import { FrogEnemy } from "../../../entity/enemy/frogEnemy";
import { BigFrogEnemy } from "../../../entity/enemy/bigFrogEnemy";
import { GlowBugEnemy } from "../../../entity/enemy/glowBugEnemy";
import { KingEnemy } from "../../../entity/enemy/kingEnemy";
import { KnightEnemy } from "../../../entity/enemy/knightEnemy";
import { BigKnightEnemy } from "../../../entity/enemy/bigKnightEnemy";
import { MummyEnemy } from "../../../entity/enemy/mummyEnemy";
import { PawnEnemy } from "../../../entity/enemy/pawnEnemy";
import { QueenEnemy } from "../../../entity/enemy/queenEnemy";
import { RookEnemy } from "../../../entity/enemy/rookEnemy";
import { SkullEnemy } from "../../../entity/enemy/skullEnemy";
import { BigSkullEnemy } from "../../../entity/enemy/bigSkullEnemy";
import { BigZombieEnemy } from "../../../entity/enemy/bigZombieEnemy";
import { SpiderEnemy } from "../../../entity/enemy/spiderEnemy";
import { WardenEnemy } from "../../../entity/enemy/wardenEnemy";
import { WizardEnemy } from "../../../entity/enemy/wizardEnemy";
import { WizardState as WizardEnemyState } from "../../../entity/enemy/wizardEnemy";
import { FireWizardEnemy } from "../../../entity/enemy/fireWizard";
import { EarthWizardEnemy } from "../../../entity/enemy/earthWizard";
import { EnergyWizardEnemy } from "../../../entity/enemy/energyWizard";
import { ZombieEnemy } from "../../../entity/enemy/zombieEnemy";
import { OccultistEnemy } from "../../../entity/enemy/occultistEnemy";
import { ExalterEnemy } from "../../../entity/enemy/exalterEnemy";
import { Enemy } from "../../../entity/enemy/enemy";
import type { LoadContext, SaveContext } from "../context";
import type { BasicEnemySaveV2, EnemyKind, EnemySaveV2, ItemSaveV2 } from "../schema";
import { directionToDirectionKind, directionKindToDirection } from "../mappers";
import { enemyRegistryV2, type EnemyCodecV2 } from "./enemies";
import { getItemKindV2, registerBuiltinItemCodecsV2 } from "./itemsBuiltins";
import { itemRegistryV2 } from "./items";
import type { Room } from "../../../room/room";
import type { Game } from "../../../game";

const asWizardEnemyState = (n: number): WizardEnemyState => {
  // WizardEnemyState is a numeric enum. Validate range explicitly.
  if (!Number.isFinite(n) || n < 0 || n > 3) return WizardEnemyState.attack;
  switch (n) {
    case 0:
      return WizardEnemyState.idle;
    case 1:
      return WizardEnemyState.attack;
    case 2:
      return WizardEnemyState.justAttacked;
    case 3:
      return WizardEnemyState.teleport;
    default:
      return WizardEnemyState.attack;
  }
};

const entityToKind = (e: Entity): EnemyKind | null => {
  if (e instanceof Barrel) return "barrel";
  if (e instanceof Bomb) return "bomb";
  if (e instanceof Block) return "block";
  if (e instanceof DecoBlock) return "deco_block";
  if (e instanceof CaveBlock) return "cave_block";
  if (e instanceof ObsidianBlock) return "obsidian_block";
  if (e instanceof Rubble) return "rubble";
  if (e instanceof Bush) return "bush";
  if (e instanceof SmallBush) return "small_bush";
  if (e instanceof Sprout) return "sprout";
  if (e instanceof LilyPlant) return "lily_plant";
  if (e instanceof Tree) return "tree";
  if (e instanceof BigTree) return "big_tree";
  if (e instanceof TallSucculent) return "tall_succulent";
  if (e instanceof Succulent) return "succulent";
  if (e instanceof DarkVase) return "dark_vase";
  if (e instanceof Candelabra) return "candelabra";
  if (e instanceof PawnStatue) return "pawn_statue";
  if (e instanceof RookStatue) return "rook_statue";
  if (e instanceof BishopStatue) return "bishop_statue";
  if (e instanceof FallenPillar) return "fallen_pillar";
  if (e instanceof Chest) return "chest";
  if (e instanceof VendingMachine) return "vending_machine";
  if (e instanceof Spawner) return "spawner";
  if (e instanceof WizardEnemy) return "wizard";
  if (e instanceof ZombieEnemy) return "zombie";
  if (e instanceof OccultistEnemy) return "occultist";
  if (e instanceof ExalterEnemy) return "exalter";
  if (e instanceof ArmoredSkullEnemy) return "armored_skull";
  if (e instanceof ArmoredzombieEnemy) return "armored_zombie";
  if (e instanceof BeetleEnemy) return "beetle";
  if (e instanceof BishopEnemy) return "bishop";
  if (e instanceof BoltcasterEnemy) return "boltcaster";
  if (e instanceof ChargeEnemy) return "charge";
  if (e instanceof CrabEnemy) return "crab";
  if (e instanceof CrusherEnemy) return "crusher";
  if (e instanceof FrogEnemy) return "frog";
  if (e instanceof BigFrogEnemy) return "big_frog";
  if (e instanceof GlowBugEnemy) return "glow_bug";
  if (e instanceof KingEnemy) return "king";
  if (e instanceof KnightEnemy) return "knight";
  if (e instanceof BigKnightEnemy) return "big_knight";
  if (e instanceof MummyEnemy) return "mummy";
  if (e instanceof PawnEnemy) return "pawn";
  if (e instanceof QueenEnemy) return "queen";
  if (e instanceof RookEnemy) return "rook";
  if (e instanceof SkullEnemy) return "skull";
  if (e instanceof BigSkullEnemy) return "big_skull";
  if (e instanceof BigZombieEnemy) return "big_zombie";
  if (e instanceof SpiderEnemy) return "spider";
  if (e instanceof WardenEnemy) return "warden";
  if (e instanceof Crate) return "crate";
  if (e instanceof DarkCrate) return "dark_crate";
  if (e instanceof Pot) return "pot";
  if (e instanceof DarkPot) return "dark_pot";
  if (e instanceof Pumpkin) return "pumpkin";
  if (e instanceof TombStone) return "tomb_stone";
  if (e instanceof Furnace) return "furnace";
  if (e instanceof FishingSpot) return "fishing_spot";
  if (e instanceof Mushrooms) return "mushrooms_prop";
  if (e instanceof Glowshrooms) return "glowshrooms_prop";
  if (e instanceof PottedPlant) return "potted_plant";
  if (e instanceof CoalResource) return "coal_resource";
  if (e instanceof GoldResource) return "gold_resource";
  if (e instanceof IronResource) return "iron_resource";
  if (e instanceof EmeraldResource) return "emerald_resource";
  if (e instanceof ZirconResource) return "zircon_resource";
  if (e instanceof AmberResource) return "amber_resource";
  if (e instanceof GarnetResource) return "garnet_resource";
  if (e instanceof Rock) return "rock_resource";
  if (e instanceof CaveRock) return "cave_rock_resource";
  if (e instanceof ObsidianResource) return "obsidian_resource";
  return null;
};

export const registerBuiltinEnemyCodecsV2 = (): void => {
  const register = (kind: EnemyKind, codec: EnemyCodecV2) => {
    if (!enemyRegistryV2.has(kind)) enemyRegistryV2.register(kind, codec);
  };

  // Ensure item codecs exist before vending_machine tries to encode its items.
  registerBuiltinItemCodecsV2();

  type EntityCtor<T extends Entity> = new (room: Room, game: Game, x: number, y: number) => T;

  type BasicEnemyKind = Exclude<EnemyKind, "chest" | "vending_machine" | "spawner" | "wizard">;

  const saveBasic = (kind: BasicEnemyKind, value: Entity): BasicEnemySaveV2 => {
    const isEnemy = value instanceof Enemy;
    return {
      kind,
      gid: value.globalId,
      roomGid: value.room.globalId,
      x: value.x,
      y: value.y,
      direction: directionToDirectionKind(value.direction),
      health: value.health,
      maxHealth: value.maxHealth,
      dead: value.dead,
      seenPlayer: isEnemy && value.seenPlayer === true ? true : undefined,
      heardPlayer: isEnemy && value.heardPlayer === true ? true : undefined,
      aggro: isEnemy && value.aggro === true ? true : undefined,
      ticks: isEnemy && typeof value.ticks === "number" ? value.ticks : undefined,
      alertTicks: typeof value.alertTicks === "number" ? value.alertTicks : undefined,
      unconscious: value.unconscious === true ? true : undefined,
      skipNextTurns: typeof value.skipNextTurns === "number" ? value.skipNextTurns : undefined,
      shield: value.shield ? { health: value.shield.health } : undefined,
      buffed: value.buffed === true ? true : undefined,
      buffedBefore: value.buffedBefore === true ? true : undefined,
    } satisfies BasicEnemySaveV2;
  };

  const spawnBasic = <T extends Entity>(Ctor: EntityCtor<T>, value: EnemySaveV2, room: Room, ctx: LoadContext): T => {
    const e = new Ctor(room, ctx.game, value.x, value.y);
    e.dead = value.dead;
    e.health = value.health;
    e.maxHealth = value.maxHealth;
    e.direction = directionKindToDirection(value.direction);
    // NOTE: do NOT set seenPlayer/aggro here, because many enemies require targetPlayer to be valid
    // when seenPlayer is true. We restore those safely in a post-pass in loadV2 after players exist.
    if (e instanceof Enemy && "ticks" in value && typeof value.ticks === "number") e.ticks = value.ticks;
    if ("alertTicks" in value && typeof value.alertTicks === "number") e.alertTicks = value.alertTicks;
    if ("unconscious" in value && typeof value.unconscious === "boolean") e.unconscious = value.unconscious;
    if ("skipNextTurns" in value && typeof value.skipNextTurns === "number") e.skipNextTurns = value.skipNextTurns;
    if ("buffedBefore" in value && typeof value.buffedBefore === "boolean") e.buffedBefore = value.buffedBefore;
    if ("buffed" in value && typeof value.buffed === "boolean") e.buffed = value.buffed;
    if ("shield" in value && typeof value.shield === "object" && value.shield !== null && "health" in value.shield) {
      const sh = value.shield;
      const healthU = (sh as { health?: unknown }).health;
      if (typeof healthU === "number") e.applyShield(healthU, true);
    }
    e.globalId = value.gid;
    return e;
  };

  const registerBasic = <T extends Entity>(kind: BasicEnemyKind, Ctor: EntityCtor<T>): void => {
    register(kind, {
      save: (value) => {
        if (!(value instanceof Ctor)) throw new Error(`${kind} codec received wrong entity type`);
        return saveBasic(kind, value);
      },
      spawn: (value, room, ctx) => {
        if (value.kind !== kind) throw new Error(`${kind} codec spawn received wrong kind`);
        return spawnBasic(Ctor, value, room, ctx);
      },
    });
  };

  // Barrel (basic envelope)
  registerBasic("barrel", Barrel);
  registerBasic("bomb", Bomb);
  registerBasic("block", Block);
  registerBasic("deco_block", DecoBlock);
  registerBasic("cave_block", CaveBlock);
  registerBasic("obsidian_block", ObsidianBlock);
  registerBasic("rubble", Rubble);
  registerBasic("bush", Bush);
  registerBasic("small_bush", SmallBush);
  registerBasic("sprout", Sprout);
  registerBasic("lily_plant", LilyPlant);
  registerBasic("tree", Tree);
  registerBasic("big_tree", BigTree);
  registerBasic("tall_succulent", TallSucculent);
  registerBasic("succulent", Succulent);
  registerBasic("dark_vase", DarkVase);
  registerBasic("candelabra", Candelabra);
  registerBasic("pawn_statue", PawnStatue);
  registerBasic("rook_statue", RookStatue);
  registerBasic("bishop_statue", BishopStatue);
  registerBasic("fallen_pillar", FallenPillar);

  // Chest
  register("chest", {
    save: (value) => {
      if (!(value instanceof Chest)) throw new Error("chest codec received non-Chest");
      const opened = value.health <= 2;
      const spawnedItemGids =
        opened && Array.isArray(value.drops)
          ? value.drops
              .filter((d) => d && d.pickedUp !== true && value.room.items.includes(d))
              .map((d) => d.globalId)
          : undefined;
      return {
        kind: "chest",
        gid: value.globalId,
        roomGid: value.room.globalId,
        x: value.x,
        y: value.y,
        direction: directionToDirectionKind(value.direction),
        health: value.health,
        maxHealth: value.maxHealth,
        dead: value.dead,
        opened,
        destroyable: value.destroyable,
        spawnedItemGids,
      };
    },
    spawn: (value, room, ctx) => {
      if (value.kind !== "chest") throw new Error("chest codec spawn received non-chest save");
      const c = new Chest(room, ctx.game, value.x, value.y);
      c.dead = value.dead;
      c.health = value.health;
      c.maxHealth = value.maxHealth;
      c.direction = directionKindToDirection(value.direction);
      c.destroyable = value.destroyable;
      c.globalId = value.gid;
      return c;
    },
  });

  // Vending machine (persists embedded items)
  register("vending_machine", {
    save: (value, ctx) => {
      if (!(value instanceof VendingMachine)) throw new Error("vending_machine codec received non-VendingMachine");
      const encodeItem = (it: Entity["drop"]): ItemSaveV2 | null => {
        if (!it) return null;
        const kind = getItemKindV2(it);
        if (!kind) return null;
        const codec = itemRegistryV2.get(kind);
        if (!codec) return null;
        return codec.save(it, ctx);
      };

      const itemSave = encodeItem(value.item);
      if (!itemSave) throw new Error("vending_machine codec: could not encode item");
      const costItems: ItemSaveV2[] = [];
      for (const it of value.costItems) {
        const s = encodeItem(it);
        if (s) costItems.push(s);
      }

      return {
        kind: "vending_machine",
        gid: value.globalId,
        roomGid: value.room.globalId,
        x: value.x,
        y: value.y,
        direction: directionToDirectionKind(value.direction),
        health: value.health,
        maxHealth: value.maxHealth,
        dead: value.dead,
        open: value.open === true,
        quantity: value.quantity,
        isInfinite: value.isInf === true,
        costItems,
        item: itemSave,
      };
    },
    spawn: (value, room, ctx) => {
      if (value.kind !== "vending_machine") throw new Error("vending_machine codec spawn received wrong kind");
      const decodeItem = (s: ItemSaveV2): ItemSaveV2 | null => s;
      const itemCodec = itemRegistryV2.get(value.item.kind);
      if (!itemCodec) throw new Error("vending_machine codec spawn: missing item codec");
      const item = itemCodec.spawn(value.item, room, { game: ctx.game });
      const vm = new VendingMachine(room, ctx.game, value.x, value.y, item);
      vm.dead = value.dead;
      vm.health = value.health;
      vm.maxHealth = value.maxHealth;
      vm.direction = directionKindToDirection(value.direction);
      vm.open = value.open;
      vm.quantity = value.quantity;
      vm.isInf = value.isInfinite;
      vm.costItems = [];
      for (const cis of value.costItems) {
        const ccodec = itemRegistryV2.get(cis.kind);
        if (!ccodec) continue;
        vm.costItems.push(ccodec.spawn(cis, room, { game: ctx.game }));
      }
      vm.globalId = value.gid;
      return vm;
    },
  });

  // Spawner
  register("spawner", {
    save: (value) => {
      if (!(value instanceof Spawner)) throw new Error("spawner codec received non-Spawner");
      return {
        kind: "spawner",
        gid: value.globalId,
        roomGid: value.room.globalId,
        x: value.x,
        y: value.y,
        direction: directionToDirectionKind(value.direction),
        health: value.health,
        maxHealth: value.maxHealth,
        dead: value.dead,
        enemySpawnType: value.enemySpawnType,
        ticks: value.ticks,
        spawnFrequency: value.spawnFrequency,
        spawnOffset: value.spawnOffset,
        nextSpawnTick: value.nextSpawnTick,
        seenPlayer: value.seenPlayer,
      };
    },
    spawn: (value, room, ctx) => {
      if (value.kind !== "spawner") throw new Error("spawner codec spawn received non-spawner save");
      const s = new Spawner(room, ctx.game, value.x, value.y);
      s.dead = value.dead;
      s.health = value.health;
      s.maxHealth = value.maxHealth;
      s.direction = directionKindToDirection(value.direction);
      s.enemySpawnType = value.enemySpawnType;
      if (typeof value.ticks === "number") s.ticks = value.ticks;
      if (typeof value.spawnFrequency === "number") s.spawnFrequency = value.spawnFrequency;
      if (typeof value.spawnOffset === "number") s.spawnOffset = value.spawnOffset;
      if (typeof value.nextSpawnTick === "number") s.nextSpawnTick = value.nextSpawnTick;
      if (typeof value.seenPlayer === "boolean") s.seenPlayer = value.seenPlayer;
      s.globalId = value.gid;
      return s;
    },
  });

  // Wizard (energy/fire/earth)
  register("wizard", {
    save: (value) => {
      if (!(value instanceof WizardEnemy)) throw new Error("wizard codec received non-WizardEnemy");
      const wizardType =
        value instanceof FireWizardEnemy
          ? "fire"
          : value instanceof EarthWizardEnemy
            ? "earth"
            : "energy";

      return {
        kind: "wizard",
        gid: value.globalId,
        roomGid: value.room.globalId,
        x: value.x,
        y: value.y,
        direction: directionToDirectionKind(value.direction),
        health: value.health,
        maxHealth: value.maxHealth,
        dead: value.dead,
        wizardType,
        wizardState: value.state,
        seenPlayer: value.seenPlayer,
        ticks: value.ticks,
        alertTicks: value.alertTicks,
        skipNextTurns: value.skipNextTurns,
        buffed: value.buffed,
        buffedBefore: value.buffedBefore,
      } satisfies EnemySaveV2;
    },
    spawn: (value, room, ctx) => {
      if (value.kind !== "wizard") throw new Error("wizard codec spawn received non-wizard save");
      const w =
        value.wizardType === "fire"
          ? new FireWizardEnemy(room, ctx.game, value.x, value.y)
          : value.wizardType === "earth"
            ? new EarthWizardEnemy(room, ctx.game, value.x, value.y)
            : new EnergyWizardEnemy(room, ctx.game, value.x, value.y);

      w.dead = value.dead;
      w.health = value.health;
      w.maxHealth = value.maxHealth;
      w.direction = directionKindToDirection(value.direction);
      w.state = asWizardEnemyState(value.wizardState);
      w.seenPlayer = value.seenPlayer;
      w.ticks = value.ticks;
      if (value.alertTicks !== undefined) w.alertTicks = value.alertTicks;
      if (value.skipNextTurns !== undefined) w.skipNextTurns = value.skipNextTurns;
      if (value.buffed !== undefined) w.buffed = value.buffed;
      if (value.buffedBefore !== undefined) w.buffedBefore = value.buffedBefore;

      w.globalId = value.gid;
      return w;
    },
  });

  // Zombie (basic envelope)
  register("zombie", {
    save: (value) => {
      if (!(value instanceof ZombieEnemy)) throw new Error("zombie codec received non-ZombieEnemy");
      return {
        kind: "zombie",
        gid: value.globalId,
        roomGid: value.room.globalId,
        x: value.x,
        y: value.y,
        direction: directionToDirectionKind(value.direction),
        health: value.health,
        maxHealth: value.maxHealth,
        dead: value.dead,
        seenPlayer: value.seenPlayer,
        heardPlayer: value.heardPlayer,
        aggro: value.aggro,
        ticks: value.ticks,
        alertTicks: value.alertTicks,
        unconscious: value.unconscious,
        skipNextTurns: value.skipNextTurns,
        buffed: value.buffed,
        buffedBefore: value.buffedBefore,
      } satisfies EnemySaveV2;
    },
    spawn: (value, room, ctx) => {
      if (value.kind !== "zombie") throw new Error("zombie codec spawn received non-zombie save");
      const z = new ZombieEnemy(room, ctx.game, value.x, value.y);
      z.dead = value.dead;
      z.health = value.health;
      z.maxHealth = value.maxHealth;
      z.direction = directionKindToDirection(value.direction);
      if ("ticks" in value && typeof value.ticks === "number") z.ticks = value.ticks;
      if (value.alertTicks !== undefined) z.alertTicks = value.alertTicks;
      if (value.unconscious !== undefined) z.unconscious = value.unconscious;
      if (value.skipNextTurns !== undefined) z.skipNextTurns = value.skipNextTurns;
      if (value.buffed !== undefined) z.buffed = value.buffed;
      if (value.buffedBefore !== undefined) z.buffedBefore = value.buffedBefore;
      z.globalId = value.gid;
      return z;
    },
  });

  // Other enemies / entities using basic envelope
  registerBasic("occultist", OccultistEnemy);
  registerBasic("exalter", ExalterEnemy);
  registerBasic("armored_skull", ArmoredSkullEnemy);
  registerBasic("armored_zombie", ArmoredzombieEnemy);
  registerBasic("beetle", BeetleEnemy);
  registerBasic("bishop", BishopEnemy);
  registerBasic("boltcaster", BoltcasterEnemy);
  registerBasic("charge", ChargeEnemy);
  registerBasic("crab", CrabEnemy);
  registerBasic("crusher", CrusherEnemy);
  registerBasic("frog", FrogEnemy);
  registerBasic("big_frog", BigFrogEnemy);
  registerBasic("glow_bug", GlowBugEnemy);
  registerBasic("king", KingEnemy);
  registerBasic("knight", KnightEnemy);
  registerBasic("big_knight", BigKnightEnemy);
  registerBasic("mummy", MummyEnemy);
  registerBasic("pawn", PawnEnemy);
  registerBasic("queen", QueenEnemy);
  registerBasic("rook", RookEnemy);
  registerBasic("skull", SkullEnemy);
  registerBasic("big_skull", BigSkullEnemy);
  registerBasic("big_zombie", BigZombieEnemy);
  registerBasic("spider", SpiderEnemy);
  registerBasic("warden", WardenEnemy);

  registerBasic("crate", Crate);
  registerBasic("dark_crate", DarkCrate);
  registerBasic("pot", Pot);
  registerBasic("dark_pot", DarkPot);
  registerBasic("pumpkin", Pumpkin);
  registerBasic("tomb_stone", TombStone);
  registerBasic("furnace", Furnace);
  registerBasic("fishing_spot", FishingSpot);
  registerBasic("mushrooms_prop", Mushrooms);
  registerBasic("potted_plant", PottedPlant);

  registerBasic("coal_resource", CoalResource);
  registerBasic("gold_resource", GoldResource);
  registerBasic("iron_resource", IronResource);
  registerBasic("emerald_resource", EmeraldResource);
  registerBasic("zircon_resource", ZirconResource);
  registerBasic("amber_resource", AmberResource);
  registerBasic("garnet_resource", GarnetResource);
  registerBasic("rock_resource", Rock);
  registerBasic("cave_rock_resource", CaveRock);
  registerBasic("obsidian_resource", ObsidianResource);
};

export const getEnemyKindV2 = (e: Entity): EnemyKind | null => entityToKind(e);


