import { Barrel } from "../entity/object/barrel";
import { BigSkullEnemy } from "../entity/enemy/bigSkullEnemy";
import { ChargeEnemy, ChargeEnemyState } from "../entity/enemy/chargeEnemy";
import { CoalResource } from "../entity/resource/coalResource";
import { Crate } from "../entity/object/crate";
import { EmeraldResource } from "../entity/resource/emeraldResource";
import { Entity, EntityDirection } from "../entity/entity";
import { GoldResource } from "../entity/resource/goldResource";
import { KnightEnemy } from "../entity/enemy/knightEnemy";
import { PottedPlant } from "../entity/object/pottedPlant";
import { Pot } from "../entity/object/pot";
import { SkullEnemy } from "../entity/enemy/skullEnemy";
import { CrabEnemy } from "../entity/enemy/crabEnemy";
import { Spawner } from "../entity/enemy/spawner";
import { VendingMachine } from "../entity/object/vendingMachine";
import { WizardEnemy, WizardState } from "../entity/enemy/wizardEnemy";
import { ZombieEnemy } from "../entity/enemy/zombieEnemy";
import { Direction, Game } from "../game";
import { HitWarning } from "../drawable/hitWarning";
import { Inventory } from "../inventory/inventory";
import { Armor } from "../item/armor";
import { BlueGem } from "../item/resource/bluegem";
import { Candle } from "../item/light/candle";
import { Coal } from "../item/resource/coal";
import { Coin } from "../item/coin";
import { Equippable } from "../item/equippable";
import { Gold } from "../item/resource/gold";
import { GoldenKey } from "../item/goldenKey";
import { GreenGem } from "../item/resource/greengem";
import { Heart } from "../item/usable/heart";
import { Item } from "../item/item";
import { Key } from "../item/key";
import { Lantern } from "../item/light/lantern";
import { RedGem } from "../item/resource/redgem";
import { Torch } from "../item/light/torch";
import { Room } from "../room/room";
import { LevelGenerator } from "../level/levelGenerator";
import { Player, PlayerDirection } from "../player/player";
import { EnemySpawnAnimation } from "../projectile/enemySpawnAnimation";
import { Projectile } from "../projectile/projectile";
import { WizardFireball } from "../projectile/wizardFireball";
import { Random } from "../utility/random";
import { Dagger } from "../item/weapon/dagger";
import { DualDagger } from "../item/weapon/dualdagger";
import { Shotgun } from "../item/weapon/shotgun";
import { Spear } from "../item/weapon/spear";
import { Weapon } from "../item/weapon/weapon";
import { Pickaxe } from "../item/tool/pickaxe";
import { Backpack } from "../item/backpack";
import { TutorialListener } from "./tutorialListener";
import { DoorType } from "../tile/door";
import { Mushrooms } from "../entity/object/mushrooms";
import { Pumpkin } from "../entity/object/pumpkin";
import { Block } from "../entity/object/block";
import { EnergyWizardEnemy } from "../entity/enemy/energyWizard";
import { Level } from "../level/level";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { ArmoredSkullEnemy } from "../entity/enemy/armoredSkullEnemy";
import { ArmoredzombieEnemy } from "../entity/enemy/armoredzombieEnemy";
import { BigKnightEnemy } from "../entity/enemy/bigKnightEnemy";
import { BigZombieEnemy } from "../entity/enemy/bigZombieEnemy";
import { BishopEnemy } from "../entity/enemy/bishopEnemy";
import { FireWizardEnemy } from "../entity/enemy/fireWizard";
import { FrogEnemy } from "../entity/enemy/frogEnemy";
import { GlowBugEnemy } from "../entity/enemy/glowBugEnemy";
import { MummyEnemy } from "../entity/enemy/mummyEnemy";
import { OccultistEnemy } from "../entity/enemy/occultistEnemy";
import { QueenEnemy } from "../entity/enemy/queenEnemy";
import { RookEnemy } from "../entity/enemy/rookEnemy";
import { SpiderEnemy } from "../entity/enemy/spiderEnemy";
import { Apple } from "../item/usable/apple";
import { BestiaryBook } from "../item/bestiaryBook";
import { BombItem } from "../item/bombItem";
import { EntitySpawner } from "../item/entitySpawner";
import { Fish } from "../item/usable/fish";
import { FishingRod } from "../item/tool/fishingRod";
import { Geode } from "../item/resource/geode";
import { GlowBugs } from "../item/light/glowBugs";
import { GodStone } from "../item/godStone";
import { GoldBar } from "../item/resource/goldBar";
import { GoldRing } from "../item/jewelry/goldRing";
import { GarnetRing } from "../item/jewelry/garnetRing";
import { ZirconRing } from "../item/jewelry/zirconRing";
import { EmeraldRing } from "../item/jewelry/emeraldRing";
import { AmberRing } from "../item/jewelry/amberRing";
import { GreenPotion } from "../item/usable/greenPotion";
import { Greataxe } from "../item/weapon/greataxe";
import { Hourglass } from "../item/usable/hourglass";
import { OrangeGem } from "../item/resource/orangegem";
import { Scythe } from "../item/weapon/scythe";
import { ScytheHandle } from "../item/weapon/scytheHandle";
import { ScytheBlade } from "../item/weapon/scytheBlade";
import { Shrooms } from "../item/usable/shrooms";
import { Slingshot } from "../item/weapon/slingshot";
import { Spellbook } from "../item/weapon/spellbook";
import { SpellbookPage } from "../item/usable/spellbookPage";
import { Stone } from "../item/resource/stone";
import { Sword } from "../item/weapon/sword";
import { Warhammer } from "../item/weapon/warhammer";
import { WeaponBlood } from "../item/usable/weaponBlood";
import { WeaponPoison } from "../item/usable/weaponPoison";
import { WeaponFragments } from "../item/usable/weaponFragments";
import { BluePotion } from "../item/usable/bluePotion";
import { Bush } from "../entity/object/bush";
import { FishingSpot } from "../entity/object/fishingSpot";
import { Furnace } from "../entity/object/furnace";
import { Sprout } from "../entity/object/sprout";
import { TombStone } from "../entity/object/tombStone";
import { DecoBlock } from "../entity/object/decoBlock";
import { Tree } from "../entity/object/tree";
import { ChestLayer } from "../entity/object/chestLayer";
import { Bomb } from "../entity/object/bomb";
import { DownladderMaker } from "../entity/downladderMaker";
import { Rock } from "../entity/resource/rockResource";
import { Hammer } from "../item/tool/hammer";
import { EnvType } from "../constants/environmentTypes";
import { SkinType } from "../tile/tile";
import { Enemy } from "../entity/enemy/enemy";
import { Chest } from "../entity/object/chest";

// Add tile imports
import { Tile } from "../tile/tile";
import { Floor } from "../tile/floor";
import { Wall } from "../tile/wall";
import { WallTorch } from "../tile/wallTorch";
import { Door } from "../tile/door";
import { DownLadder } from "../tile/downLadder";
import { UpLadder } from "../tile/upLadder";
import { Pool } from "../tile/pool";
import { Chasm } from "../tile/chasm";
import { SpawnFloor } from "../tile/spawnfloor";
import { SpikeTrap } from "../tile/spiketrap";
import { Spike } from "../tile/spike";
import { Trapdoor } from "../tile/trapdoor";
import { InsideLevelDoor } from "../tile/insideLevelDoor";
import { GoldenDoor } from "../tile/goldenDoor";
import { FountainTile } from "../tile/fountainTile";
import { Button } from "../tile/button";
import { CoffinTile } from "../tile/coffinTile";
import { Bones } from "../tile/bones";
import { Puddle } from "../tile/decorations/puddle";
import { Decoration } from "../tile/decorations/decoration";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { WardenEnemy } from "../entity/enemy/wardenEnemy";
import { EnemyShield } from "../projectile/enemyShield";

export class HitWarningState {
  x: number;
  y: number;
  dead: boolean;

  constructor(hw: HitWarning) {
    this.x = hw.x;
    this.y = hw.y;
    this.dead = hw.dead;
  }
}

let loadHitWarning = (hws: HitWarningState, game: Game): HitWarning => {
  let hw = new HitWarning(game, hws.x, hws.y, hws.x, hws.y);
  hw.dead = hws.dead;
  return hw;
};

export enum ProjectileType {
  SPAWN,
  WIZARD,
}

export class ProjectileState {
  type: ProjectileType;
  x: number;
  y: number;
  dead: boolean;
  roomID: number;
  roomGID?: string;
  enemySpawn: EnemyState;
  wizardState: number;
  wizardParentID: number;
  wizardParentGID?: string;
  // enemy shields are not persisted anymore

  constructor(projectile: Projectile, game: Game) {
    this.x = projectile.x;
    this.y = projectile.y;
    this.dead = projectile.dead;
    if (projectile instanceof EnemySpawnAnimation) {
      this.type = ProjectileType.SPAWN;
      this.roomID = game.rooms.indexOf(projectile.room);
      this.roomGID = projectile.room?.globalId;
      this.enemySpawn = new EnemyState(projectile.enemy, game);
    }
    if (projectile instanceof WizardFireball) {
      this.type = ProjectileType.WIZARD;
      this.wizardState = projectile.state;
      this.roomID = game.rooms.indexOf(projectile.parent.room);
      this.roomGID = projectile.parent.room?.globalId;
      this.wizardParentID = projectile.parent.room.entities.indexOf(
        projectile.parent,
      );
      this.wizardParentGID = (projectile.parent as any).globalId;
    }
  }
}

let loadProjectile = (ps: ProjectileState, game: Game): Projectile => {
  if (ps.type === ProjectileType.SPAWN) {
    let room =
      (ps.roomGID && game.roomsById?.get(ps.roomGID)) || game.rooms[ps.roomID];
    let enemy = loadEnemy(ps.enemySpawn, game);
    let p = new EnemySpawnAnimation(room, enemy, ps.x, ps.y);
    p.dead = ps.dead;
    return p;
  }
  if (ps.type === ProjectileType.WIZARD) {
    let wizardRoom =
      (ps.roomGID && game.roomsById?.get(ps.roomGID)) || game.rooms[ps.roomID];
    let wizard = ps.wizardParentGID
      ? (wizardRoom.entities.find(
          (e) => (e as any).globalId === ps.wizardParentGID,
        ) as EnergyWizardEnemy)
      : (wizardRoom.entities[ps.wizardParentID] as EnergyWizardEnemy);
    let p = new WizardFireball(wizard, ps.x, ps.y);
    p.state = ps.wizardState;
    return p;
  }
};

export enum EnemyType {
  BARREL,
  BIGSKULL,
  CHARGE,
  CHEST,
  COAL,
  CRATE,
  EMERALD,
  GOLD,
  KNIGHT,
  PLANT,
  POT,
  SKULL,
  CRAB,
  SPAWNER,
  VENDINGMACHINE,
  WIZARD,
  ZOMBIE,
  ARMOREDSKULL,
  ARMOREDZOMBIE,
  BIGKNIGHT,
  BIGZOMBIE,
  BISHOP,
  ENERGYWIZARD,
  FIREWIZARD,
  FROG,
  GLOWBUG,
  MUMMY,
  OCCULTIST,
  QUEEN,
  ROOK,
  SPIDER,
  BUSH,
  FISHING_SPOT,
  FURNACE,
  PUMPKIN,
  SPROUT,
  TOMBSTONE,
  DECO_BLOCK,
  TREE,
  CHEST_LAYER,
  BOMB,
  BLOCK,
  DOWNLADDER_MAKER,
  ROCK,
  MUSHROOMS,
  WARDEN,
}

export class EnemyState {
  type: EnemyType;
  roomID: number;
  roomGID?: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isShielded?: boolean;
  shieldHealth?: number;
  shieldedBefore?: boolean;
  unconscious: boolean;
  direction: Direction;
  dead: boolean;
  skipNextTurns: number;
  destroyable: boolean;
  hasDrop: boolean;
  drop: ItemState;
  alertTicks: number;
  ticks: number;
  seenPlayer: boolean;
  targetPlayerID: string;
  ticksSinceFirstHit: number;
  drops: Array<ItemState>;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  visualTargetX: number;
  visualTargetY: number;
  chargeEnemyState: ChargeEnemyState;
  enemySpawnType: number;
  isPlayerOpened: boolean;
  playerOpenedID: string;
  open: boolean;
  costItems: Array<ItemState>;
  item: ItemState;
  isInf: boolean;
  quantity: number;
  wizardState: WizardState;
  // Persist explicit opened state for chests for clarity/forward-compatibility
  chestOpened?: boolean;

  constructor(enemy: Entity, game: Game) {
    this.roomID = game.rooms.indexOf(enemy.room);
    this.roomGID = enemy.room?.globalId;
    this.x = enemy.x;
    this.y = enemy.y;
    this.health = enemy.health;
    this.maxHealth = enemy.maxHealth;
    // Persist shield state on the enemy rather than saving EnemyShield projectile
    try {
      this.isShielded = (enemy as any).shielded === true;
      this.shieldHealth = (enemy as any).shield?.health ?? undefined;
    } catch {}
    this.shieldedBefore = (enemy as any).shieldedBefore;
    this.unconscious = (enemy as Enemy).unconscious;
    this.direction = enemy.direction;
    this.dead = enemy.dead;
    this.skipNextTurns = enemy.skipNextTurns;
    this.destroyable = enemy.destroyable;
    this.hasDrop = false;
    if (enemy.drop) {
      this.hasDrop = true;
      this.drop = new ItemState(enemy.drop, game);
    }
    this.alertTicks = enemy.alertTicks;
    if (enemy instanceof Barrel) this.type = EnemyType.BARREL;
    if (enemy instanceof BigSkullEnemy) {
      this.type = EnemyType.BIGSKULL;
      this.ticks = enemy.ticks;
      this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
      this.seenPlayer = enemy.seenPlayer;
      if (enemy.seenPlayer) {
        this.targetPlayerID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.targetPlayer,
        );
        if (!this.targetPlayerID)
          this.targetPlayerID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.targetPlayer,
          );
      }
      this.drops = [];
      for (const d of enemy.drops) {
        if (d) {
          this.drops.push(new ItemState(d, game));
        }
      }
    }
    if (enemy instanceof ChargeEnemy) {
      this.type = EnemyType.CHARGE;
      this.ticks = enemy.ticks;
      this.chargeEnemyState = enemy.state;
      this.startX = enemy.startX;
      this.startY = enemy.startY;
      this.targetX = enemy.targetX;
      this.targetY = enemy.targetY;
      this.visualTargetX = enemy.visualTargetX;
      this.visualTargetY = enemy.visualTargetY;
    }
    if (enemy instanceof Chest) this.type = EnemyType.CHEST;
    // Explicitly persist whether a chest has been opened (derived from health)
    if (enemy instanceof Chest) {
      this.chestOpened = enemy.health <= 2;
    }
    if (enemy instanceof CoalResource) this.type = EnemyType.COAL;
    if (enemy instanceof Crate) this.type = EnemyType.CRATE;
    if (enemy instanceof EmeraldResource) this.type = EnemyType.EMERALD;
    if (enemy instanceof GoldResource) this.type = EnemyType.GOLD;
    if (enemy instanceof KnightEnemy) {
      this.type = EnemyType.KNIGHT;
      this.ticks = enemy.ticks;
      this.seenPlayer = enemy.seenPlayer;
      if (enemy.seenPlayer) {
        this.targetPlayerID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.targetPlayer,
        );
        if (!this.targetPlayerID)
          this.targetPlayerID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.targetPlayer,
          );
      }
    }
    if (enemy instanceof PottedPlant) this.type = EnemyType.PLANT;
    if (enemy instanceof Pot) this.type = EnemyType.POT;
    if (enemy instanceof SkullEnemy) {
      this.type = EnemyType.SKULL;
      this.ticks = enemy.ticks;
      this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
      this.seenPlayer = enemy.seenPlayer;
      if (enemy.seenPlayer) {
        this.targetPlayerID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.targetPlayer,
        );
        if (!this.targetPlayerID)
          this.targetPlayerID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.targetPlayer,
          );
      }
    }
    if (enemy instanceof CrabEnemy) {
      this.type = EnemyType.CRAB;
      this.ticks = enemy.ticks;
      this.seenPlayer = enemy.seenPlayer;
      if (enemy.seenPlayer) {
        this.targetPlayerID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.targetPlayer,
        );
        if (!this.targetPlayerID)
          this.targetPlayerID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.targetPlayer,
          );
      }
    }
    if (enemy instanceof Spawner) {
      this.type = EnemyType.SPAWNER;
      this.ticks = enemy.ticks;
      this.seenPlayer = enemy.seenPlayer;
      this.enemySpawnType = enemy.enemySpawnType;
    }
    if (enemy instanceof VendingMachine) {
      this.type = EnemyType.VENDINGMACHINE;
      this.isPlayerOpened = false;
      if (enemy.playerOpened) {
        this.isPlayerOpened = true;
        this.playerOpenedID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.playerOpened,
        );
        if (!this.playerOpenedID)
          this.playerOpenedID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.playerOpened,
          );
      }
      this.open = enemy.open;
      this.costItems = [];
      for (const item of enemy.costItems) {
        if (item) {
          this.costItems.push(new ItemState(item, game));
        }
      }
      if (enemy.item) {
        this.item = new ItemState(enemy.item, game);
      }
      this.isInf = enemy.isInf;
      this.quantity = enemy.quantity;
    }
    if (enemy instanceof WizardEnemy) {
      this.type = EnemyType.WIZARD;
      this.ticks = enemy.ticks;
      this.wizardState = enemy.state;
      this.seenPlayer = enemy.seenPlayer;
    }
    if (enemy instanceof ZombieEnemy) {
      this.type = EnemyType.ZOMBIE;
      this.ticks = enemy.ticks;
      this.seenPlayer = enemy.seenPlayer;
      if (enemy.seenPlayer) {
        this.targetPlayerID = Object.keys(game.players).find(
          (key) => game.players[key] === enemy.targetPlayer,
        );
        if (!this.targetPlayerID)
          this.targetPlayerID = Object.keys(game.offlinePlayers).find(
            (key) => game.offlinePlayers[key] === enemy.targetPlayer,
          );
      }
    }
    if (enemy instanceof ArmoredSkullEnemy) this.type = EnemyType.ARMOREDSKULL;
    if (enemy instanceof ArmoredzombieEnemy)
      this.type = EnemyType.ARMOREDZOMBIE;
    if (enemy instanceof BigKnightEnemy) this.type = EnemyType.BIGKNIGHT;
    if (enemy instanceof BigZombieEnemy) this.type = EnemyType.BIGZOMBIE;
    if (enemy instanceof BishopEnemy) this.type = EnemyType.BISHOP;
    if (enemy instanceof EnergyWizardEnemy) this.type = EnemyType.ENERGYWIZARD;
    if (enemy instanceof FireWizardEnemy) this.type = EnemyType.FIREWIZARD;
    if (enemy instanceof FrogEnemy) this.type = EnemyType.FROG;
    if (enemy instanceof GlowBugEnemy) this.type = EnemyType.GLOWBUG;
    if (enemy instanceof MummyEnemy) this.type = EnemyType.MUMMY;
    if (enemy instanceof OccultistEnemy) {
      this.type = EnemyType.OCCULTIST;
      // No extra data needed; beams/shields handled at projectile level
    }
    if (enemy instanceof QueenEnemy) this.type = EnemyType.QUEEN;
    if (enemy instanceof RookEnemy) this.type = EnemyType.ROOK;
    if (enemy instanceof SpiderEnemy) this.type = EnemyType.SPIDER;
    if (enemy instanceof Bush) this.type = EnemyType.BUSH;
    if (enemy instanceof FishingSpot) this.type = EnemyType.FISHING_SPOT;
    if (enemy instanceof Furnace) this.type = EnemyType.FURNACE;
    if (enemy instanceof Pumpkin) this.type = EnemyType.PUMPKIN;
    if (enemy instanceof Sprout) this.type = EnemyType.SPROUT;
    if (enemy instanceof TombStone) this.type = EnemyType.TOMBSTONE;
    if (enemy instanceof DecoBlock) this.type = EnemyType.DECO_BLOCK;
    if (enemy instanceof Tree) this.type = EnemyType.TREE;
    if (enemy instanceof ChestLayer) this.type = EnemyType.CHEST_LAYER;
    if (enemy instanceof Bomb) this.type = EnemyType.BOMB;
    if (enemy instanceof Block) this.type = EnemyType.BLOCK;
    if (enemy instanceof DownladderMaker)
      this.type = EnemyType.DOWNLADDER_MAKER;
    if (enemy instanceof Rock) this.type = EnemyType.ROCK;
    if (enemy instanceof Mushrooms) this.type = EnemyType.MUSHROOMS;
    if (enemy instanceof WardenEnemy) this.type = EnemyType.WARDEN;
  }
}

let loadEnemy = (es: EnemyState, game: Game): Entity => {
  let enemy;
  let room =
    (es.roomGID && game.roomsById?.get(es.roomGID)) || game.rooms[es.roomID];
  if (es.type === EnemyType.BARREL) enemy = new Barrel(room, game, es.x, es.y);
  if (es.type === EnemyType.BIGSKULL) {
    enemy = new BigSkullEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
    enemy.seenPlayer = es.seenPlayer;
    if (es.seenPlayer) {
      enemy.targetPlayer = game.players[es.targetPlayerID];
      if (!enemy.targetPlayer)
        enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
    }
    enemy.drops = [];
    for (const d of es.drops) {
      if (d) {
        enemy.drops.push(loadItem(d, game));
      }
    }
  }
  if (es.type === EnemyType.CHARGE) {
    enemy = new ChargeEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.state = es.chargeEnemyState;
    enemy.startX = es.startX;
    enemy.startY = es.startY;
    enemy.targetX = es.targetX;
    enemy.targetY = es.targetY;
    enemy.visualTargetX = es.visualTargetX;
    enemy.visualTargetY = es.visualTargetY;
  }
  if (es.type === EnemyType.CHEST) enemy = new Chest(room, game, es.x, es.y);
  // Restore chest open visuals based on saved health only; do not regenerate loot
  if (enemy instanceof Chest) {
    const shouldBeOpen = es.health <= 2;
    if (shouldBeOpen) {
      (enemy as any).tileX = 6; // final opened frame
      (enemy as any).tileY = 2;
      (enemy as any).opening = false;
    }
  }
  if (es.type === EnemyType.COAL)
    enemy = new CoalResource(room, game, es.x, es.y);
  if (es.type === EnemyType.CRATE) enemy = new Crate(room, game, es.x, es.y);
  if (es.type === EnemyType.EMERALD)
    enemy = new EmeraldResource(room, game, es.x, es.y);
  if (es.type === EnemyType.GOLD)
    enemy = new GoldResource(room, game, es.x, es.y);
  if (es.type === EnemyType.KNIGHT) {
    enemy = new KnightEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.seenPlayer = es.seenPlayer;
    if (es.seenPlayer) {
      enemy.targetPlayer = game.players[es.targetPlayerID];
      if (!enemy.targetPlayer)
        enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
    }
  }
  if (es.type === EnemyType.PLANT)
    enemy = new PottedPlant(room, game, es.x, es.y);
  if (es.type === EnemyType.POT) enemy = new Pot(room, game, es.x, es.y);
  if (es.type === EnemyType.SKULL) {
    enemy = new SkullEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
    enemy.seenPlayer = es.seenPlayer;
    if (es.seenPlayer) {
      enemy.targetPlayer = game.players[es.targetPlayerID];
      if (!enemy.targetPlayer)
        enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
    }
  }
  if (es.type === EnemyType.CRAB) {
    enemy = new CrabEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.seenPlayer = es.seenPlayer;
    if (es.seenPlayer) {
      enemy.targetPlayer = game.players[es.targetPlayerID];
      if (!enemy.targetPlayer)
        enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
    }
  }
  if (es.type === EnemyType.SPAWNER) {
    enemy = new Spawner(room, game, es.x, es.y, [es.enemySpawnType]);
    enemy.ticks = es.ticks;
    enemy.seenPlayer = es.seenPlayer;
    enemy.enemySpawnType = es.enemySpawnType;
  }
  if (es.type === EnemyType.VENDINGMACHINE) {
    let item = loadItem(es.item, game);
    enemy = new VendingMachine(room, game, es.x, es.y, item);
    if (es.isPlayerOpened) {
      enemy.playerOpened = game.players[es.playerOpenedID];
      if (!enemy.playerOpened)
        enemy.playerOpened = game.offlinePlayers[es.playerOpenedID];
    }
    enemy.open = es.open;
    enemy.costItems = [];
    for (const item of es.costItems) {
      if (item) {
        enemy.costItems.push(loadItem(item, game));
      }
    }
    enemy.isInf = es.isInf;
    enemy.quantity = es.quantity;
  }

  if (es.type === EnemyType.ZOMBIE) {
    enemy = new ZombieEnemy(room, game, es.x, es.y);
    enemy.ticks = es.ticks;
    enemy.seenPlayer = es.seenPlayer;
    if (es.seenPlayer) {
      enemy.targetPlayer = game.players[es.targetPlayerID];
      if (!enemy.targetPlayer)
        enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
    }
  }
  if (es.type === EnemyType.ARMOREDSKULL)
    enemy = new ArmoredSkullEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.ARMOREDZOMBIE)
    enemy = new ArmoredzombieEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.BIGKNIGHT)
    enemy = new BigKnightEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.BIGZOMBIE)
    enemy = new BigZombieEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.BISHOP)
    enemy = new BishopEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.ENERGYWIZARD)
    enemy = new EnergyWizardEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.FIREWIZARD)
    enemy = new FireWizardEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.FROG) enemy = new FrogEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.GLOWBUG)
    enemy = new GlowBugEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.MUMMY)
    enemy = new MummyEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.OCCULTIST)
    enemy = new OccultistEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.WARDEN)
    enemy = new WardenEnemy(room, game, es.x, es.y);

  if (es.type === EnemyType.QUEEN)
    enemy = new QueenEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.ROOK) enemy = new RookEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.SPIDER)
    enemy = new SpiderEnemy(room, game, es.x, es.y);
  if (es.type === EnemyType.BUSH) enemy = new Bush(room, game, es.x, es.y);
  if (es.type === EnemyType.FISHING_SPOT)
    enemy = new FishingSpot(room, game, es.x, es.y);
  if (es.type === EnemyType.FURNACE)
    enemy = new Furnace(room, game, es.x, es.y);
  if (es.type === EnemyType.PUMPKIN)
    enemy = new Pumpkin(room, game, es.x, es.y);
  if (es.type === EnemyType.SPROUT) enemy = new Sprout(room, game, es.x, es.y);
  if (es.type === EnemyType.TOMBSTONE)
    enemy = new TombStone(room, game, es.x, es.y);
  if (es.type === EnemyType.DECO_BLOCK)
    enemy = new DecoBlock(room, game, es.x, es.y);
  if (es.type === EnemyType.TREE) enemy = new Tree(room, game, es.x, es.y);
  if (es.type === EnemyType.CHEST_LAYER)
    enemy = new ChestLayer(room, game, es.x, es.y);
  if (es.type === EnemyType.BOMB) enemy = new Bomb(room, game, es.x, es.y);
  if (es.type === EnemyType.BLOCK) enemy = new Block(room, game, es.x, es.y);
  if (es.type === EnemyType.DOWNLADDER_MAKER)
    enemy = new DownladderMaker(room, game, es.x, es.y);
  if (es.type === EnemyType.ROCK) enemy = new Rock(room, game, es.x, es.y);
  if (es.type === EnemyType.MUSHROOMS)
    enemy = new Mushrooms(room, game, es.x, es.y);

  if (!enemy) {
    console.error(
      "Unknown enemy type:",
      es.type,
      "EnemyType enum value:",
      EnemyType[es.type],
      "Falling back to barrel",
    );
    enemy = new Barrel(room, game, es.x, es.y);
  }

  enemy.x = es.x;
  enemy.y = es.y;
  enemy.health = es.health;
  enemy.maxHealth = es.maxHealth;
  (enemy as any).shieldedBefore = es.shieldedBefore;
  // Rebuild shields if needed
  try {
    if ((es as any).isShielded) {
      const sh = (es as any).shieldHealth ?? 1;
      if (!(enemy as any).shielded) {
        (enemy as any).applyShield(sh, true);
      }
    }
  } catch {}
  (enemy as Enemy).unconscious = es.unconscious;
  enemy.direction = es.direction;
  enemy.dead = es.dead;
  enemy.skipNextTurns = es.skipNextTurns;
  // Restore destroyable so chests can be broken after opened
  if (typeof (es as any).destroyable === "boolean") {
    enemy.destroyable = (es as any).destroyable;
  }
  if (es.hasDrop) enemy.drop = loadItem(es.drop, game);
  enemy.alertTicks = es.alertTicks;

  return enemy;
};

export class RoomState {
  roomID: number;
  roomGID?: string;
  pathId?: string;
  entered: boolean;
  envType?: EnvType;
  skin?: SkinType;
  enemies: Array<EnemyState>;
  items: Array<ItemState>;
  projectiles: Array<ProjectileState>;
  hitwarnings: Array<HitWarningState>;
  active: boolean;
  onScreen: boolean;
  lightingUpdateInProgress?: boolean;
  mapGroup: number;
  tiles: Array<Array<TileState | null>>; // Only save specific tile types

  constructor(room: Room, game: Game) {
    this.roomID = game.rooms.indexOf(room);
    this.roomGID = room.globalId;
    this.pathId = (room as any).pathId || "main";
    this.entered = room.entered;
    this.envType = room.envType;
    this.skin = room.skin;
    this.active = room.active;
    this.onScreen = room.onScreen;
    this.mapGroup = room.mapGroup;
    this.enemies = [];
    this.items = [];
    this.projectiles = [];
    this.hitwarnings = [];

    // Save only chasms, pools, and walls
    this.tiles = [];
    for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
      this.tiles[x] = [];
      for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
        const tile = room.roomArray[x]?.[y];
        if (tile && this.shouldSaveTile(tile)) {
          this.tiles[x][y] = new TileState(tile, game);
        } else {
          this.tiles[x][y] = null;
        }
      }
    }

    for (const enemy of room.entities)
      this.enemies.push(new EnemyState(enemy, game));
    for (const item of room.items) {
      if (item) {
        this.items.push(new ItemState(item, game));
      }
    }
    for (const projectile of room.projectiles) {
      if (projectile instanceof EnemyShield) continue; // do not save shields
      this.projectiles.push(new ProjectileState(projectile, game));
    }
    for (const hw of room.hitwarnings)
      this.hitwarnings.push(new HitWarningState(hw));
  }

  // Helper method to determine which tiles should be saved
  private shouldSaveTile(tile: Tile): boolean {
    return (
      tile instanceof Chasm ||
      tile instanceof Pool ||
      tile instanceof Wall ||
      tile instanceof DownLadder ||
      tile instanceof UpLadder ||
      tile instanceof Floor ||
      tile instanceof WallTorch ||
      tile instanceof SpawnFloor ||
      tile instanceof Door ||
      tile instanceof SpikeTrap
    );
  }
}

let loadRoom = (room: Room, roomState: RoomState, game: Game) => {
  if (roomState.pathId) (room as any).pathId = roomState.pathId;
  room.entered = roomState.entered;
  if (roomState.envType !== undefined) {
    room.envType = roomState.envType as EnvType;
    room.skin = room.envType as unknown as SkinType;
  }
  room.active = roomState.active;
  room.onScreen = roomState.onScreen;
  room.skin = roomState.skin;

  // Load only saved tiles (chasms, pools, walls), overwriting generated tiles
  if (roomState.tiles) {
    // Reset lights before reconstructing tiles that add their own light sources
    try {
      (room as any).lightSources = [];
    } catch {}
    for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
      for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
        const tileState = roomState.tiles[x]?.[y];
        if (tileState) {
          // Only overwrite if we have a saved tile; defer door linking until after grid load
          const loadedTile = loadTile(tileState, room, game);
          room.roomArray[x][y] = loadedTile;
        }
        // If no saved tile state, keep the generated tile as-is
      }
    }

    // Second pass: link doors by saved linkedDoorGID
    try {
      const gidToDoor = new Map<string, Door>();
      for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
        for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
          const ts = roomState.tiles[x]?.[y];
          const t = room.roomArray[x]?.[y];
          if (ts && ts.type === TileType.DOOR && t instanceof Door) {
            const gid = ts.properties.globalId as string | undefined;
            if (gid) gidToDoor.set(gid, t);
          }
          // Re-add light sources for tiles that carry lights
          if (
            t &&
            (t as any).lightSource &&
            !(room as any).lightSources?.includes((t as any).lightSource)
          ) {
            (room as any).lightSources.push((t as any).lightSource);
          }
        }
      }
      for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
        for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
          const ts = roomState.tiles[x]?.[y];
          const t = room.roomArray[x]?.[y];
          if (ts && ts.type === TileType.DOOR && t instanceof Door) {
            const linkedGid = ts.properties.linkedDoorGID as string | null;
            if (linkedGid && gidToDoor.has(linkedGid)) {
              t.link(gidToDoor.get(linkedGid));
            }
          }
        }
      }
    } catch {}

    // Rebuild room.doors array from reconstructed tiles to support door-light propagation
    try {
      const doorsInRoom: Door[] = [];
      for (let x = room.roomX - 1; x < room.roomX + room.width + 1; x++) {
        for (let y = room.roomY - 1; y < room.roomY + room.height + 1; y++) {
          const t = room.roomArray[x]?.[y];
          if (t instanceof Door) doorsInRoom.push(t);
        }
      }
      (room as any).doors = doorsInRoom;
    } catch {}
  }

  room.entities = [];
  room.items = [];
  room.projectiles = [];
  room.hitwarnings = [];
  // Defer Occultist loading until after other entities so shields can reattach reliably
  const nonOccultists = roomState.enemies.filter(
    (es) => es.type !== EnemyType.OCCULTIST,
  );
  const occultists = roomState.enemies.filter(
    (es) => es.type === EnemyType.OCCULTIST,
  );
  for (const enemy of nonOccultists) room.entities.push(loadEnemy(enemy, game));
  for (const enemy of occultists) room.entities.push(loadEnemy(enemy, game));
  for (const item of roomState.items) {
    if (item) {
      room.items.push(loadItem(item, game, undefined, room));
    }
  }
  // Link chest drop references to existing room items for opened chests
  try {
    // First pass: group items by potential chest source tag if present
    const byChestKey = new Map<string, Item[]>();
    for (const it of room.items) {
      const sx = (it as any)?.sourceChestX as number | undefined;
      const sy = (it as any)?.sourceChestY as number | undefined;
      if (sx !== undefined && sy !== undefined) {
        const key = `${sx},${sy}`;
        const arr = byChestKey.get(key) || [];
        arr.push(it);
        byChestKey.set(key, arr);
      }
    }
    for (const e of room.entities) {
      if (e instanceof Chest && e.health <= 2) {
        const key = `${e.x},${e.y}`;
        const tagged = byChestKey.get(key);
        if (tagged && tagged.length) {
          (e as any).drops = tagged.slice();
          continue;
        }
        // Fallback: associate items sitting on the chest tile
        (e as any).drops = room.items.filter(
          (it) => it && it.x === e.x && it.y === e.y,
        );
      }
    }
  } catch {}
  for (const projectile of roomState.projectiles) {
    const loaded = loadProjectile(projectile, game);
    if (loaded && !(loaded as any).dead) {
      room.projectiles.push(loaded);
    }
  }
  for (const hw of roomState.hitwarnings)
    room.hitwarnings.push(loadHitWarning(hw, game));

  // After entities and projectiles are in place, recreate occultist beams without duplicates/self-beams
  try {
    const occultists = room.entities.filter(
      (e) => e instanceof OccultistEnemy,
    ) as OccultistEnemy[];
    const shielded = room.entities.filter(
      (e) => e instanceof Enemy && (e as Enemy).shielded && !e.dead,
    ) as Enemy[];

    // Clear prior lists
    for (const oc of occultists) (oc as any).shieldedEnemies = [];

    // Assign each shielded enemy to its nearest other occultist (if any)
    const assignments = new Map<OccultistEnemy, Enemy[]>();
    for (const s of shielded) {
      let nearest: OccultistEnemy | null = null;
      let best = Number.POSITIVE_INFINITY;
      for (const oc of occultists) {
        if (oc === (s as any)) continue; // no self-beam
        const dist = Math.max(Math.abs(oc.x - s.x), Math.abs(oc.y - s.y));
        if (dist < best) {
          best = dist;
          nearest = oc;
        }
      }
      if (nearest) {
        const arr = assignments.get(nearest) || [];
        arr.push(s);
        assignments.set(nearest, arr);
      }
    }

    // Create beams per occultist for its assigned shielded allies, and set shieldedEnemies
    for (const [oc, allies] of assignments.entries()) {
      (oc as any).shieldedEnemies = allies.slice();
      if ((oc as any).createBeam && allies.length) {
        (oc as any).createBeam(allies);
      }
    }
  } catch {}

  // Reset lighting state to prevent recursion issues
  room.calculateWallInfo();
  room.updateLighting();
};

export enum ItemType {
  ARMOR,
  BLUEGEM,
  CANDLE,
  COAL,
  COIN,
  GOLD,
  GOLDENKEY,
  GREENGEM,
  KEY,
  LANTERN,
  REDGEM,
  TORCH,
  DAGGER,
  DUALDAGGER,
  SHOTGUN,
  SPEAR,
  PICKAXE,
  BACKPACK,
  SPELLBOOK,
  WEAPON_FRAGMENTS,
  WARHAMMER,
  HAMMER,
  WEAPON_POISON,
  WEAPON_BLOOD,
  HEART,
  MUSHROOMS,
  STONE,
  BLUE_POTION,
  APPLE,
  BESTIARY_BOOK,
  BOMB_ITEM,
  ENTITY_SPAWNER,
  FISH,
  FISHING_ROD,
  GEODE,
  GLOW_BUGS,
  GOD_STONE,
  GOLD_BAR,
  GOLD_RING,
  GARNET_RING,
  ZIRCON_RING,
  EMERALD_RING,
  AMBER_RING,
  GREEN_POTION,
  GREATAXE,
  HOURGLASS,
  ORANGE_GEM,
  SCYTHE,
  SCYTHE_HANDLE,
  SCYTHE_BLADE,
  SLINGSHOT,
  SPELLBOOK_PAGE,
  SWORD,
}

export class ItemState {
  type: ItemType;
  x: number;
  y: number;
  roomID: number;
  roomGID?: string;
  stackCount: number;
  pickedUp: boolean;
  // Optional metadata to support chest-drop persistence
  sourceChestX?: number;
  sourceChestY?: number;
  equipped: boolean;

  constructor(item: Item, game: Game) {
    // Add null check at the beginning
    if (!item) {
      throw new Error("Cannot create ItemState from null item");
    }

    if (item instanceof Armor) this.type = ItemType.ARMOR;
    if (item instanceof BlueGem) this.type = ItemType.BLUEGEM;
    if (item instanceof Candle) this.type = ItemType.CANDLE;
    if (item instanceof Coal) this.type = ItemType.COAL;
    if (item instanceof Coin) this.type = ItemType.COIN;
    if (item instanceof Gold) this.type = ItemType.GOLD;
    if (item instanceof GoldenKey) this.type = ItemType.GOLDENKEY;
    if (item instanceof GreenGem) this.type = ItemType.GREENGEM;
    if (item instanceof Heart) this.type = ItemType.HEART;
    if (item instanceof Key) this.type = ItemType.KEY;
    if (item instanceof Lantern) this.type = ItemType.LANTERN;
    if (item instanceof RedGem) this.type = ItemType.REDGEM;
    if (item instanceof Torch) this.type = ItemType.TORCH;
    if (item instanceof Dagger) this.type = ItemType.DAGGER;
    if (item instanceof DualDagger) this.type = ItemType.DUALDAGGER;
    if (item instanceof Shotgun) this.type = ItemType.SHOTGUN;
    if (item instanceof Spear) this.type = ItemType.SPEAR;
    if (item instanceof Pickaxe) this.type = ItemType.PICKAXE;
    if (item instanceof Backpack) this.type = ItemType.BACKPACK;
    // Add new item type checks:
    if (item instanceof Apple) this.type = ItemType.APPLE;
    if (item instanceof BestiaryBook) this.type = ItemType.BESTIARY_BOOK;
    if (item instanceof BombItem) this.type = ItemType.BOMB_ITEM;
    if (item instanceof EntitySpawner) this.type = ItemType.ENTITY_SPAWNER;
    if (item instanceof Fish) this.type = ItemType.FISH;
    if (item instanceof FishingRod) this.type = ItemType.FISHING_ROD;
    if (item instanceof Geode) this.type = ItemType.GEODE;
    if (item instanceof GlowBugs) this.type = ItemType.GLOW_BUGS;
    if (item instanceof GodStone) this.type = ItemType.GOD_STONE;
    if (item instanceof GoldBar) this.type = ItemType.GOLD_BAR;
    if (item instanceof GoldRing) this.type = ItemType.GOLD_RING;
    if (item instanceof GarnetRing) this.type = ItemType.GARNET_RING;
    if (item instanceof ZirconRing) this.type = ItemType.ZIRCON_RING;
    if (item instanceof EmeraldRing) this.type = ItemType.EMERALD_RING;
    if (item instanceof AmberRing) this.type = ItemType.AMBER_RING;
    if (item instanceof GreenPotion) this.type = ItemType.GREEN_POTION;
    if (item instanceof Greataxe) this.type = ItemType.GREATAXE;
    if (item instanceof Hourglass) this.type = ItemType.HOURGLASS;
    if (item instanceof OrangeGem) this.type = ItemType.ORANGE_GEM;
    if (item instanceof Scythe) this.type = ItemType.SCYTHE;
    if (item instanceof ScytheHandle) this.type = ItemType.SCYTHE_HANDLE;
    if (item instanceof ScytheBlade) this.type = ItemType.SCYTHE_BLADE;
    if (item instanceof Shrooms) this.type = ItemType.MUSHROOMS; // Maps to existing MUSHROOMS
    if (item instanceof Slingshot) this.type = ItemType.SLINGSHOT;
    if (item instanceof Spellbook) this.type = ItemType.SPELLBOOK; // Maps to existing SPELLBOOK
    if (item instanceof SpellbookPage) this.type = ItemType.SPELLBOOK_PAGE;
    if (item instanceof Stone) this.type = ItemType.STONE; // Maps to existing STONE
    if (item instanceof Sword) this.type = ItemType.SWORD;
    if (item instanceof Warhammer) this.type = ItemType.WARHAMMER; // Maps to existing WARHAMMER
    if (item instanceof WeaponBlood) this.type = ItemType.WEAPON_BLOOD; // Maps to existing WEAPON_BLOOD
    if (item instanceof WeaponPoison) this.type = ItemType.WEAPON_POISON; // Maps to existing WEAPON_POISON
    if (item instanceof WeaponFragments) this.type = ItemType.WEAPON_FRAGMENTS; // Maps to existing WEAPON_FRAGMENTS
    if (item instanceof BluePotion) this.type = ItemType.BLUE_POTION; // Maps to existing BLUE_POTION

    this.equipped = item instanceof Equippable && item.equipped;
    this.x = item.x;
    this.y = item.y;
    this.roomID = game.rooms.indexOf(item.level);
    this.roomGID = item.level?.globalId;
    this.stackCount = item.stackCount;
    this.pickedUp = item.pickedUp;
    try {
      // Tag items spawned by an opened chest to allow re-association on load
      const levelRoom = item.level;
      const candidateChest = levelRoom?.entities?.find(
        (e) =>
          e instanceof Chest &&
          e.health <= 2 &&
          e.x === item.x &&
          e.y === item.y,
      ) as any;
      if (candidateChest) {
        this.sourceChestX = candidateChest.x;
        this.sourceChestY = candidateChest.y;
      }
    } catch {}
  }
}

let loadItem = (
  i: ItemState,
  game: Game,
  player?: Player,
  targetRoom?: Room,
): Item => {
  let room =
    targetRoom ||
    (i.roomGID && game.roomsById?.get(i.roomGID)) ||
    (i.roomID !== -1 ? game.rooms[i.roomID] : null);
  let item;
  if (i.type === ItemType.ARMOR) item = new Armor(room, i.x, i.y);
  if (i.type === ItemType.BLUEGEM) item = new BlueGem(room, i.x, i.y);
  if (i.type === ItemType.CANDLE) item = new Candle(room, i.x, i.y);
  if (i.type === ItemType.COAL) item = new Coal(room, i.x, i.y);
  if (i.type === ItemType.COIN) item = new Coin(room, i.x, i.y);
  if (i.type === ItemType.GOLD) item = new Gold(room, i.x, i.y);
  if (i.type === ItemType.GOLDENKEY) item = new GoldenKey(room, i.x, i.y);
  if (i.type === ItemType.GREENGEM) item = new GreenGem(room, i.x, i.y);
  if (i.type === ItemType.HEART) item = new Heart(room, i.x, i.y);
  if (i.type === ItemType.KEY) item = new Key(room, i.x, i.y);
  if (i.type === ItemType.LANTERN) item = new Lantern(room, i.x, i.y);
  if (i.type === ItemType.REDGEM) item = new RedGem(room, i.x, i.y);
  if (i.type === ItemType.TORCH) item = new Torch(room, i.x, i.y);
  if (i.type === ItemType.DAGGER) item = new Dagger(room, i.x, i.y);
  if (i.type === ItemType.DUALDAGGER) item = new DualDagger(room, i.x, i.y);
  if (i.type === ItemType.SHOTGUN) item = new Shotgun(room, i.x, i.y);
  if (i.type === ItemType.SPEAR) item = new Spear(room, i.x, i.y);
  if (i.type === ItemType.PICKAXE) item = new Pickaxe(room, i.x, i.y);
  if (i.type === ItemType.BACKPACK) item = new Backpack(room, i.x, i.y);
  // Add new item loading cases:
  if (i.type === ItemType.APPLE) item = new Apple(room, i.x, i.y);
  if (i.type === ItemType.BESTIARY_BOOK)
    item = new BestiaryBook(room, i.x, i.y);
  if (i.type === ItemType.BOMB_ITEM) item = new BombItem(room, i.x, i.y);
  if (i.type === ItemType.ENTITY_SPAWNER)
    item = new EntitySpawner(room, i.x, i.y);
  if (i.type === ItemType.FISH) item = new Fish(room, i.x, i.y);
  if (i.type === ItemType.FISHING_ROD) item = new FishingRod(room, i.x, i.y);
  if (i.type === ItemType.GEODE) item = new Geode(room, i.x, i.y);
  if (i.type === ItemType.GLOW_BUGS) item = new GlowBugs(room, i.x, i.y);
  if (i.type === ItemType.GOD_STONE) item = new GodStone(room, i.x, i.y);
  if (i.type === ItemType.GOLD_BAR) item = new GoldBar(room, i.x, i.y);
  if (i.type === ItemType.GOLD_RING) item = new GoldRing(room, i.x, i.y);
  if (i.type === ItemType.GARNET_RING) item = new GarnetRing(room, i.x, i.y);
  if (i.type === ItemType.ZIRCON_RING) item = new ZirconRing(room, i.x, i.y);
  if (i.type === ItemType.EMERALD_RING) item = new EmeraldRing(room, i.x, i.y);
  if (i.type === ItemType.AMBER_RING) item = new AmberRing(room, i.x, i.y);
  if (i.type === ItemType.GREEN_POTION) item = new GreenPotion(room, i.x, i.y);
  if (i.type === ItemType.GREATAXE) item = new Greataxe(room, i.x, i.y);
  if (i.type === ItemType.HOURGLASS) item = new Hourglass(room, i.x, i.y);
  if (i.type === ItemType.ORANGE_GEM) item = new OrangeGem(room, i.x, i.y);
  if (i.type === ItemType.SCYTHE) item = new Scythe(room, i.x, i.y);
  if (i.type === ItemType.SCYTHE_HANDLE)
    item = new ScytheHandle(room, i.x, i.y);
  if (i.type === ItemType.SCYTHE_BLADE) item = new ScytheBlade(room, i.x, i.y);
  if (i.type === ItemType.MUSHROOMS) item = new Shrooms(room, i.x, i.y);
  if (i.type === ItemType.SLINGSHOT) item = new Slingshot(room, i.x, i.y);
  if (i.type === ItemType.SPELLBOOK) item = new Spellbook(room, i.x, i.y);
  if (i.type === ItemType.SPELLBOOK_PAGE)
    item = new SpellbookPage(room, i.x, i.y);
  if (i.type === ItemType.STONE) item = new Stone(room, i.x, i.y);
  if (i.type === ItemType.SWORD) item = new Sword(room, i.x, i.y);
  if (i.type === ItemType.BLUE_POTION) item = new BluePotion(room, i.x, i.y);
  if (i.type === ItemType.WEAPON_FRAGMENTS)
    item = new WeaponFragments(room, i.x, i.y);
  if (i.type === ItemType.WARHAMMER) item = new Warhammer(room, i.x, i.y);
  if (i.type === ItemType.HAMMER) item = new Hammer(room, i.x, i.y);
  if (i.type === ItemType.WEAPON_POISON)
    item = new WeaponPoison(room, i.x, i.y);
  if (i.type === ItemType.WEAPON_BLOOD) item = new WeaponBlood(room, i.x, i.y);

  if (!item) {
    console.error(
      "Unknown item type:",
      i.type,
      "ItemType enum value:",
      ItemType[i.type],
      "Falling back to coal",
    );
    item = new Coal(room, i.x, i.y);
  }

  // Ensure game reference always exists
  if (item && !(item as any).game) {
    (item as any).game = game;
  }
  // Ensure level reference exists for inventory-only items
  if (!room && item && !item.level) {
    const savedLocal = game.players?.[game.localPlayerID];
    const fallbackRoom = (savedLocal as any)?.getRoom
      ? (savedLocal as any).getRoom()
      : game.rooms[game.players[game.localPlayerID].levelID];
    item.level = fallbackRoom;
  }

  if (i.equipped) item.equipped = true;
  if (item instanceof Equippable) item.setWielder(player);
  // Ensure all items have a valid game reference
  if (item && !(item as any).game) {
    (item as any).game = game;
  }
  item.stackCount = i.stackCount;
  item.pickedUp = i.pickedUp;
  return item;
};

export class InventoryState {
  isOpen: boolean;
  cols: number;
  rows: number;
  selX: number;
  selY: number;
  equipAnimAmount: Array<number>;
  isWeaponEquipped: boolean;
  weaponI: number;
  coins: number;
  items: Array<ItemState | null>;

  constructor(inventory: Inventory, game: Game) {
    this.isOpen = inventory.isOpen;
    this.cols = inventory.cols;
    this.rows = inventory.rows;
    this.equipAnimAmount = inventory.equipAnimAmount.map((x) => x);
    this.isWeaponEquipped = false;
    if (inventory.weapon) {
      this.isWeaponEquipped = true;
      this.weaponI = inventory.items.indexOf(inventory.weapon);
    }
    this.coins = inventory.coins;
    this.selX = inventory.selX;
    this.selY = inventory.selY;
    this.items = Array<ItemState | null>(inventory.cols * inventory.rows);
    for (let idx = 0; idx < inventory.cols * inventory.rows; idx++) {
      this.items[idx] = null;
    }
    for (const item of inventory.items) {
      if (item) {
        this.items[inventory.items.indexOf(item)] = new ItemState(item, game);
      }
    }
  }
}

let loadInventory = (inventory: Inventory, i: InventoryState, game: Game) => {
  inventory.clear(); // keeps correct length
  for (let idx = 0; idx < i.items.length; idx++) {
    const itemState = i.items[idx];
    if (itemState) {
      const loadedItem = loadItem(itemState, game, inventory.player);
      // Ensure inventory items reference the player's current room and game
      if (!loadedItem.level) {
        const playerRoom = game.rooms[inventory.player.levelID];
        loadedItem.level = playerRoom;
      }
      if (!(loadedItem as any).game) {
        (loadedItem as any).game = game;
      }
      inventory.items[idx] = loadedItem;
      if (loadedItem instanceof Weapon && inventory.weapon === null) {
        loadedItem.toggleEquip();
        inventory.weapon = loadedItem;
      }
    } else {
      inventory.items[idx] = null;
    }
  }

  inventory.isOpen = i.isOpen;
  inventory.cols = i.cols;
  inventory.rows = i.rows;
  inventory.selX = i.selX;
  inventory.selY = i.selY;
  inventory.equipAnimAmount = i.equipAnimAmount.map((x) => x);
  inventory.coins = i.coins;

  // Set weapon reference after all items are loaded
  if (i.isWeaponEquipped && i.weaponI < inventory.items.length) {
    inventory.weapon = inventory.items[i.weaponI] as Weapon;
  }
};

export class PlayerState {
  x: number;
  y: number;
  dead: boolean;
  roomID: number;
  roomGID?: string;
  mapGroup?: number;
  roomIndexInGroup?: number;
  direction: Direction;
  health: number;
  maxHealth: number;
  lastTickHealth: number;
  inventory: InventoryState;
  hasOpenVendingMachine: boolean;
  openVendingMachineRoomID: number;
  openVendingMachineRoomGID?: string;
  openVendingMachineID: number;
  openVendingMachineGID?: string;
  sightRadius: number;
  lightEquipped?: boolean;
  lightColor?: [number, number, number];
  lightBrightness?: number;

  constructor(player: Player, game: Game) {
    this.x = player.x;
    this.y = player.y;
    this.dead = player.dead;
    const resolvedRoom = (player as any)?.getRoom
      ? (player as any).getRoom()
      : game.rooms[player.levelID];
    this.roomGID = resolvedRoom?.globalId;
    this.roomID = resolvedRoom
      ? game.rooms.indexOf(resolvedRoom)
      : player.levelID;
    this.mapGroup = resolvedRoom?.mapGroup;
    const playerRoom = resolvedRoom;
    if (playerRoom) {
      const groupRooms = game.rooms
        .filter((r) => r.mapGroup === playerRoom.mapGroup)
        .sort((a, b) => a.id - b.id);
      this.roomIndexInGroup = groupRooms.findIndex((r) => r === playerRoom);
    }
    this.direction = player.direction;
    this.health = player.health;
    this.maxHealth = player.maxHealth;
    this.lastTickHealth = player.lastTickHealth;
    this.inventory = new InventoryState(player.inventory, game);
    this.hasOpenVendingMachine = false;
    if (player.openVendingMachine) {
      this.hasOpenVendingMachine = true;
      this.openVendingMachineRoomID = game.rooms.indexOf(
        player.openVendingMachine.room,
      );
      this.openVendingMachineRoomGID = player.openVendingMachine.room?.globalId;
      this.openVendingMachineID =
        player.openVendingMachine.room.entities.indexOf(
          player.openVendingMachine,
        );
      this.openVendingMachineGID = (player.openVendingMachine as any).globalId;
    }
    this.sightRadius = player.sightRadius;
    // Persist player light settings used by room.updateLighting()
    this.lightEquipped = (player as any).lightEquipped;
    this.lightColor = (player as any).lightColor;
    this.lightBrightness = (player as any).lightBrightness;
  }
}

let loadPlayer = (id: string, p: PlayerState, game: Game): Player => {
  let player = new Player(game, p.x, p.y, id === game.localPlayerID);
  player.dead = p.dead;

  // Prefer GID if available
  if (p.roomGID && game.roomsById?.has(p.roomGID)) {
    const room = game.roomsById.get(p.roomGID);
    (player as any).roomGID = p.roomGID;
    player.levelID = game.rooms.indexOf(room);
  } else {
    // Sidepath-aware resolution: prefer group match and relative order
    let resolvedRoom: Room | undefined;
    if (p.mapGroup !== undefined) {
      const groupRooms = game.rooms
        .filter((r) => r.mapGroup === p.mapGroup)
        .sort((a, b) => a.id - b.id);
      if (groupRooms.length) {
        if (
          p.roomIndexInGroup !== undefined &&
          p.roomIndexInGroup < groupRooms.length
        ) {
          resolvedRoom = groupRooms[p.roomIndexInGroup];
        } else {
          resolvedRoom =
            groupRooms.find((r) => r.id === p.roomID) || groupRooms[0];
        }
      }
    }
    if (!resolvedRoom) {
      const coord = game.rooms.find((r) => r.tileInside(p.x, p.y));
      if (coord) {
        resolvedRoom = coord;
      }
    }
    if (!resolvedRoom) {
      resolvedRoom = game.rooms[p.roomID];
    }
    (player as any).roomGID = resolvedRoom?.globalId;
    player.levelID = resolvedRoom ? game.rooms.indexOf(resolvedRoom) : 0;
  }
  // Ensure player depth matches the currently generated level depth
  if (game.level) {
    player.depth = game.level.depth;
  }
  player.direction = p.direction;
  player.health = p.health;
  player.maxHealth = p.maxHealth;
  player.lastTickHealth = p.lastTickHealth;
  loadInventory(player.inventory, p.inventory, game);
  if (p.hasOpenVendingMachine) {
    const vmRoom =
      (p.openVendingMachineRoomGID &&
        game.roomsById?.get(p.openVendingMachineRoomGID)) ||
      game.rooms[p.openVendingMachineRoomID];
    player.openVendingMachine = p.openVendingMachineGID
      ? (vmRoom.entities.find(
          (e) => (e as any).globalId === p.openVendingMachineGID,
        ) as VendingMachine)
      : (vmRoom.entities[p.openVendingMachineID] as VendingMachine);
  }
  player.sightRadius = p.sightRadius;
  // Restore player light settings (used by room.updateLighting)
  if (typeof p.lightEquipped === "boolean")
    (player as any).lightEquipped = p.lightEquipped;
  if (Array.isArray(p.lightColor))
    (player as any).lightColor = p.lightColor as any;
  if (typeof p.lightBrightness === "number")
    (player as any).lightBrightness = p.lightBrightness as any;

  // Set the player's room reference (this might be needed by some player methods)
  // Note: This will be set properly when the game.room is assigned in loadGameState
  // but we can set it here for consistency
  // player.room = game.rooms[player.levelID]; // Only if Player class has a room property

  return player;
};

export class LevelState {
  depth: number;
  width: number;
  height: number;
  isMainPath: boolean;
  mapGroup: number;
  envType: EnvType;
  levelGID?: string;

  constructor(level: Level) {
    this.depth = level.depth;
    this.width = level.width;
    this.height = level.height;
    this.isMainPath = level.isMainPath;
    this.mapGroup = level.mapGroup;
    this.envType = level.environment.type;
    this.levelGID = (level as any).globalId;
  }
}

const loadLevel = (level: Level, levelState: LevelState) => {
  level.depth = levelState.depth;
  level.width = levelState.width;
  level.height = levelState.height;
  level.isMainPath = levelState.isMainPath;
  level.mapGroup = levelState.mapGroup;
  level.environment.type = levelState.envType;
  level.environment.skin = levelState.envType as unknown as SkinType;
};

export class GameState {
  seed: number;
  randomState: number;
  players: Record<string, PlayerState>;
  offlinePlayers: Record<string, PlayerState>;
  level: LevelState;
  rooms: Array<RoomState>;
  levelGID?: string;
  roomGIDs?: string[];
  currentPathId?: string;
  sidepathMeta?: Array<{ pathId: string; rooms: number }>;

  constructor() {
    this.seed = 0;
    this.randomState = 0;
    this.players = {};
    this.offlinePlayers = {};
    this.level = null;
    this.rooms = [];
  }
}

export const createGameState = (game: Game): GameState => {
  // Prevent saving while replaying to avoid corrupting baseState or user saves
  try {
    if ((game as any).replayManager?.isReplaying?.()) {
      console.warn("🔄 SAVE: Skipped createGameState during replay");
      return null as any;
    }
  } catch {}

  try {
    let gs = new GameState();

    // Save basic game properties
    gs.seed = game.levelgen.seed;
    gs.randomState = Random.state;

    // Save level state
    if (game.level) {
      gs.level = new LevelState(game.level);
      gs.levelGID = (game.level as any).globalId;
    } else {
      console.warn("🔄 SAVE: No game.level found!");
    }

    // Save players

    for (const i in game.players) {
      try {
        const pr = game.players[i];
        const playerRoom = game.rooms[pr.levelID];

        gs.players[i] = new PlayerState(game.players[i], game);
      } catch (error) {
        console.error(`❌ SAVE: Error saving player ${i}:`, error);
        throw error;
      }
    }

    // Save offline players
    for (const i in game.offlinePlayers) {
      try {
        gs.offlinePlayers[i] = new PlayerState(game.offlinePlayers[i], game);
      } catch (error) {
        console.error(`❌ SAVE: Error saving offline player ${i}:`, error);
        throw error;
      }
    }

    // Persist current path
    try {
      (gs as any).currentPathId = (game as any).currentPathId || "main";
    } catch {}

    // Save rooms
    try {
      const groupCounts: Record<number, number> = {};
      for (const r of game.rooms) {
        groupCounts[r.mapGroup] = (groupCounts[r.mapGroup] || 0) + 1;
      }
    } catch {}
    for (let roomIndex = 0; roomIndex < game.rooms.length; roomIndex++) {
      const room = game.rooms[roomIndex];
      try {
        room.catchUp();
        const roomState = new RoomState(room, game);
        gs.rooms.push(roomState);
        (gs.roomGIDs ||= []).push(room.globalId);
      } catch (error) {
        console.error(`❌ SAVE: Error saving room ${roomIndex}:`, error);
        throw error;
      }
    }

    // Save sidepath metadata: count rooms per non-main pathId
    try {
      const byPid = new Map<string, number>();
      for (const rs of gs.rooms) {
        const pid = ((rs as any).pathId as string) || "main";
        if (pid === "main") continue;
        byPid.set(pid, (byPid.get(pid) || 0) + 1);
      }
      (gs as any).sidepathMeta = Array.from(byPid.entries()).map(
        ([pathId, rooms]) => ({ pathId, rooms }),
      );
    } catch {}

    return gs;
  } catch (error) {
    console.error("❌ SAVE: Fatal error in createGameState:", error);
    throw error;
  }
};

export const loadGameState = (
  game: Game,
  activeUsernames: Array<string>,
  gameState: GameState,
  newWorld: boolean,
) => {
  try {
    // Clear existing rooms

    game.rooms = []; // Use standard array syntax
    game.roomsById = new Map();
    game.levels = [];
    game.levelsById = new Map();
    // Also reset input listener arrays to avoid duplicate mouse handlers after load
    try {
      const InputMod = require("./input");
      (InputMod.Input.mouseDownListeners as any).length = 0;
      (InputMod.Input.mouseRightClickListeners as any).length = 0;
      (InputMod.Input.mouseLeftClickListeners as any).length = 0;
      (InputMod.Input.mouseMoveListeners as any).length = 0;
      (InputMod.Input.mouseUpListeners as any).length = 0;
    } catch {}

    // Initialize level generator

    game.levelgen = new LevelGenerator();
    game.levelgen.setSeed(gameState.seed);

    // Handle missing level state
    if (!gameState.level) {
      console.warn("🔄 LOAD: No level state found, creating default");
      const tempLevel = new Level(game, 0, 1, 1, true, 0, EnvType.DUNGEON);
      gameState.level = new LevelState(tempLevel);
    } else {
    }

    if (newWorld) {
      gameState.level.depth = 0;
    } else {
      // Restore random state BEFORE level generation for existing worlds

      Random.setState(gameState.randomState);
    }

    globalEventBus.emit(EVENTS.LEVEL_GENERATION_STARTED, {});

    return game.levelgen
      .generateFirstNFloors(game, gameState.level.depth, !newWorld)
      .then(async () => {
        // Ensure seed and Random.state remain as in the save
        try {
          game.levelgen.setSeed(gameState.seed);
          Random.setState(gameState.randomState);
        } catch {}

        globalEventBus.emit(EVENTS.LEVEL_GENERATION_COMPLETED, {});

        // Pre-generate sidepaths deterministically by saved pathIds (avoids coordinate mismatch)
        try {
          const roomStates = gameState.rooms || [];
          // Collect unique non-main pathIds and their smallest saved mapGroup to preserve ordering
          const pathIdToMinGroup = new Map<string, number>();
          for (const rs of roomStates) {
            const pid = (rs as any).pathId as string | undefined;
            if (!pid || pid === "main") continue;
            const mg = (rs as any).mapGroup as number | undefined;
            if (typeof mg !== "number") continue;
            const prev = pathIdToMinGroup.get(pid);
            if (prev === undefined || mg < prev) pathIdToMinGroup.set(pid, mg);
          }
          const sidepaths = Array.from(pathIdToMinGroup.entries())
            .map(([pid, mg]) => ({ pid, mg }))
            .sort((a, b) => a.mg - b.mg);

          // Collect rooms for all generated sidepaths, since generate() replaces game.rooms each time
          const collectedSideRooms: Room[] = [];

          for (const sp of sidepaths) {
            const alreadyExists = game.rooms.some(
              (r) => (r as any).pathId === sp.pid,
            );
            if (alreadyExists) continue;
            const beforeCount = game.rooms.length;

            await game.levelgen.generate(
              game,
              gameState.level.depth,
              true,
              () => {},
              gameState.level.envType,
              !newWorld,
              sp.pid,
              // Use saved sidepath room count if available for determinism
              (gameState as any).sidepathMeta
                ? {
                    caveRooms:
                      (gameState as any).sidepathMeta.find(
                        (m) => m.pathId === sp.pid,
                      )?.rooms ?? undefined,
                  }
                : undefined,
            );
            const afterCount = game.rooms.length;
            const added = game.rooms.filter(
              (r) => (r as any).pathId === sp.pid,
            );
            // Stash now because subsequent generate() calls will overwrite game.rooms
            for (const r of added) collectedSideRooms.push(r);
          }

          // Merge any newly generated rooms into the active level
          const activeLevel = game.levels[gameState.level.depth];
          if (activeLevel) {
            const existingGids = new Set(
              activeLevel.rooms.map((r) => r.globalId),
            );
            const newRooms = collectedSideRooms
              .filter((r) => !existingGids.has(r.globalId))
              // Preserve path grouping order from save: sort by (pathId, mapGroup, id)
              .sort((a, b) => {
                const pa = (a as any).pathId || "main";
                const pb = (b as any).pathId || "main";
                if (pa !== pb) return pa < pb ? -1 : 1;
                if (a.mapGroup !== b.mapGroup) return a.mapGroup - b.mapGroup;
                return a.id - b.id;
              });
            let merged = 0;
            let startId = activeLevel.rooms.length;
            for (const r of newRooms) {
              r.id = startId + merged;
              activeLevel.rooms.push(r);
              merged++;
            }
            game.rooms = activeLevel.rooms;
            game.roomsById = new Map(game.rooms.map((r) => [r.globalId, r]));

            try {
              const byPath: Record<string, number> = {} as any;
              const byGroup: Record<number, number> = {} as any;
              for (const r of game.rooms) {
                const pid = (r as any).pathId || "main";
                byPath[pid] = (byPath[pid] || 0) + 1;
                byGroup[r.mapGroup] = (byGroup[r.mapGroup] || 0) + 1;
              }
            } catch {}
          }
        } catch (e) {
          console.warn("⚠️ LOAD: Sidepath generation by pathId failed", e);
        }

        if (!newWorld) {
          // Pre-pass: align generated room GIDs with saved roomGIDs so GID-based linking works
          try {
            const newRoomsByGid = new Map<string, Room>();
            for (const rs of gameState.rooms) {
              if (!rs?.roomGID) continue;
              // Try to find the intended generated room using the same resolution we use later
              let candidate =
                (rs.roomGID && game.getRoomById(rs.roomGID)) ||
                game.rooms.find(
                  (r) =>
                    r.mapGroup === (rs as any).mapGroup &&
                    (r as any).pathId === ((rs as any).pathId || "main") &&
                    r.id === rs.roomID,
                ) ||
                game.rooms.find(
                  (r) =>
                    r.mapGroup === (rs as any).mapGroup && r.id === rs.roomID,
                ) ||
                game.rooms.find((r) => r.id === rs.roomID);
              if (candidate && (candidate as any).globalId !== rs.roomGID) {
                try {
                  IdGenerator.reserve(rs.roomGID);
                  (candidate as any).globalId = rs.roomGID;
                } catch {}
              }
            }
            // Rebuild roomsById map with possibly updated GIDs
            game.roomsById = new Map(game.rooms.map((r) => [r.globalId, r]));
          } catch {}

          // Load players

          for (const playerId in gameState.players) {
            try {
              const player = loadPlayer(
                playerId,
                gameState.players[playerId],
                game,
              );
              game.players[playerId] = player;
            } catch (error) {
              console.error(
                `❌ LOAD: Error loading player ${playerId}:`,
                error,
              );
              throw error;
            }
          }

          // Load offline players

          for (const playerId in gameState.offlinePlayers) {
            try {
              const offlinePlayer = loadPlayer(
                playerId,
                gameState.offlinePlayers[playerId],
                game,
              );
              game.offlinePlayers[playerId] = offlinePlayer;
            } catch (error) {
              console.error(
                `❌ LOAD: Error loading offline player ${playerId}:`,
                error,
              );
              throw error;
            }
          }

          // Load room states

          try {
            for (const roomState of gameState.rooms) {
              let resolvedBy = "";
              let room: Room | undefined = undefined;
              const wantedPid = (roomState as any).pathId || "main";
              if (roomState.roomGID) {
                const r0 = game.getRoomById(roomState.roomGID);
                if (r0) {
                  room = r0;
                  resolvedBy = "gid";
                }
              }
              if (!room) {
                const r1 = game.rooms.find(
                  (r) =>
                    r.mapGroup === roomState.mapGroup &&
                    (r as any).pathId === wantedPid &&
                    r.id === roomState.roomID,
                );
                if (r1) {
                  room = r1;
                  resolvedBy = "group+path+id";
                }
              }
              if (!room) {
                const r2 = game.rooms.find(
                  (r) =>
                    r.mapGroup === roomState.mapGroup &&
                    r.id === roomState.roomID,
                );
                if (r2) {
                  room = r2;
                  resolvedBy = "group+id";
                }
              }
              if (!room) {
                const r3 = game.rooms.find((r) => r.id === roomState.roomID);
                if (r3) {
                  room = r3;
                  resolvedBy = "id";
                }
              }

              const roomCandidate = room;
              // use the resolved candidate
              const roomFinal = roomCandidate;
              const roomRef = roomFinal;
              if (roomRef) {
                // Ensure pathId is restored
                if ((roomState as any).pathId)
                  (roomRef as any).pathId = (roomState as any).pathId;
                // Temporarily set context so any loaders that reference game.room are safe
                const prevRoom = game.room;
                try {
                  game.room = roomRef;
                  loadRoom(roomRef, roomState, game);
                } finally {
                  game.room = prevRoom;
                }
              } else {
              }
            }
            // Global post-pass to link doors across rooms by GID
            try {
              const allDoorsByGid = new Map<string, Door>();
              const pending: Array<Door> = [];
              const byCoord = new Map<string, Door[]>();
              for (const r of game.rooms) {
                for (let x = r.roomX - 1; x < r.roomX + r.width + 1; x++) {
                  for (let y = r.roomY - 1; y < r.roomY + r.height + 1; y++) {
                    const t = r.roomArray[x]?.[y];
                    if (t instanceof Door) {
                      const gid = (t as any).globalId as string | undefined;
                      if (gid) allDoorsByGid.set(gid, t);
                      if ((t as any)._pendingLinkedDoorGID) pending.push(t);
                      const key = `${x},${y}`;
                      const arr = byCoord.get(key) || [];
                      arr.push(t);
                      byCoord.set(key, arr);
                    }
                  }
                }
              }
              // Link by explicit GID first
              for (const d of pending) {
                const targetGid = (d as any)._pendingLinkedDoorGID as
                  | string
                  | null;
                if (targetGid && allDoorsByGid.has(targetGid)) {
                  d.link(allDoorsByGid.get(targetGid));
                }
                (d as any)._pendingLinkedDoorGID = null;
              }
              // Fallback: link doors sharing the same world coordinate
              for (const [key, doors] of byCoord.entries()) {
                if (doors.length === 2) {
                  const [a, b] = doors;
                  if (!(a as any).linkedDoor) a.link(b as Door);
                  if (!(b as any).linkedDoor) b.link(a as Door);
                }
              }
            } catch (e) {
              console.warn("⚠️ LOAD: Global door linking failed", e);
            }
          } catch (error) {
            console.error("❌ LOAD: Error loading room states:", error);
            throw error;
          }

          // Set local player and current room

          if (activeUsernames.includes(game.localPlayerID)) {
            const localPlayer = game.players[game.localPlayerID];
            if (localPlayer) {
              if (game.rooms.length > 0) {
                // Resolve via roomGID (stable), else by saved mapGroup+roomID where available (sidepaths),
                // else spatial by coordinates, else fallback by index or first room
                const savedLocal = gameState.players[game.localPlayerID];
                const gidRoom = savedLocal?.roomGID
                  ? game.getRoomById(savedLocal.roomGID)
                  : undefined;
                // Prefer sidepath grouping + relative order if present
                let groupAndIdRoom: Room | undefined = undefined;
                if (savedLocal?.mapGroup !== undefined) {
                  const groupRooms = game.rooms
                    .filter((r) => r.mapGroup === savedLocal.mapGroup)
                    .sort((a, b) => a.id - b.id);

                  if (groupRooms.length) {
                    if (
                      savedLocal?.roomIndexInGroup !== undefined &&
                      savedLocal.roomIndexInGroup < groupRooms.length
                    ) {
                      groupAndIdRoom = groupRooms[savedLocal.roomIndexInGroup];
                    } else if (savedLocal?.roomID !== undefined) {
                      groupAndIdRoom =
                        groupRooms.find((r) => r.id === savedLocal.roomID) ||
                        groupRooms[0];
                    }
                  }
                }
                const coordRoom = game.rooms.find((r) =>
                  r.tileInside(localPlayer.x, localPlayer.y),
                );
                if (!gidRoom && !groupAndIdRoom && coordRoom) {
                }
                const indexRoom =
                  localPlayer.levelID < game.rooms.length
                    ? game.rooms[localPlayer.levelID]
                    : undefined;
                const resolvedRoom =
                  gidRoom ||
                  groupAndIdRoom ||
                  coordRoom ||
                  indexRoom ||
                  game.rooms[0];

                game.room = resolvedRoom;
                localPlayer.levelID = game.rooms.indexOf(resolvedRoom);
                // Restore active path
                try {
                  (game as any).currentPathId =
                    (gameState as any).currentPathId ||
                    resolvedRoom.pathId ||
                    "main";
                } catch {}

                // Force-correct depth/level mapping on load
                game.updateLevel(game.room);
                game.currentDepth = game.level.depth;
                localPlayer.depth = game.level.depth;
                if (!resolvedRoom.tileInside(localPlayer.x, localPlayer.y)) {
                  const center = resolvedRoom.getRoomCenter();
                  localPlayer.moveSnap(center.x, center.y);
                }
                game.room.enterLevel(localPlayer, {
                  x: localPlayer.x,
                  y: localPlayer.y,
                });
                localPlayer.map.updateSeenTiles();
                // Refresh lighting to include player's equipped light source immediately after placement
                try {
                  game.room.updateLighting();
                } catch {}

                // Validate player position
                const tile =
                  game.room.roomArray[localPlayer.x]?.[localPlayer.y];
                if (!tile || tile.isSolid()) {
                  console.warn(
                    "🔄 LOAD: Player in invalid position, moving to room center",
                  );
                  const roomCenter = game.room.getRoomCenter();
                  localPlayer.moveSnap(roomCenter.x, roomCenter.y);
                } else {
                }
              } else {
                console.error(
                  "❌ LOAD: Invalid levelID for local player:",
                  localPlayer.levelID,
                );
                throw new Error(
                  `Invalid levelID ${localPlayer.levelID} for local player`,
                );
              }
            }
          }
        } else {
          game.players[game.localPlayerID] = new Player(game, 0, 0, true);
          game.room = game.rooms[game.players[game.localPlayerID].levelID];
          game.room.enterLevel(game.players[game.localPlayerID]);
          game.players[game.localPlayerID].map.updateSeenTiles();
          game.players[game.localPlayerID].map.saveMapData();
        }

        // Update lighting (guard nulls)
        try {
          game.room?.updateLighting?.();
        } catch {}

        // Clear chat
        game.chat = [];

        return game;
      })
      .catch((error) => {
        console.error("❌ LOAD: Level generation failed:", error);
        throw error;
      });
  } catch (error) {
    console.error("❌ LOAD: Fatal error in loadGameState:", error);
    throw error;
  }
};

export enum TileType {
  FLOOR,
  WALL,
  WALL_TORCH,
  DOOR,
  DOWN_LADDER,
  UP_LADDER,
  POOL,
  CHASM,
  SPAWN_FLOOR,
  SPIKE_TRAP,
  SPIKE,
  TRAP_DOOR,
  BONES,
}
export class TileState {
  type: TileType;
  x: number;
  y: number;
  // Store tile-specific properties as a generic object
  properties: Record<string, any>;

  constructor(tile: Tile, game: Game) {
    // Add null check at the beginning
    if (!tile) {
      throw new Error("Cannot create TileState from null tile");
    }

    this.x = tile.x;
    this.y = tile.y;
    this.properties = {};

    // Determine tile type and extract relevant properties
    if (tile instanceof Floor) {
      this.type = TileType.FLOOR;
    } else if (tile instanceof WallTorch) {
      this.type = TileType.WALL_TORCH;
      this.properties.isBottomWall = (tile as any).isBottomWall;
      this.properties.frame = (tile as any).frame;
    } else if (tile instanceof Wall) {
      this.type = TileType.WALL;
    } else if (tile instanceof Door) {
      this.type = TileType.DOOR;
      // Persist the canonical door type. Door class uses `type`, not `doorType`.
      this.properties.doorType = (tile as any).type;
      this.properties.type = (tile as any).type; // compatibility alias
      // Persist both legacy isOpen and canonical opened/locked flags
      this.properties.isOpen = (tile as any).isOpen;
      this.properties.opened = (tile as any).opened;
      this.properties.locked = (tile as any).locked;
      // Persist lockable module details if present
      this.properties.lockType = (tile as any).lockable?.lockType;
      this.properties.keyID = (tile as any).lockable?.keyID;
      this.properties.doorDir = (tile as any).doorDir;
      this.properties.tunnelDoor = (tile as any).tunnelDoor;
      this.properties.globalId = (tile as any).globalId;
      this.properties.linkedDoorGID =
        (tile as any).linkedDoor?.globalId || null;
    } else if (tile instanceof DownLadder) {
      this.type = TileType.DOWN_LADDER;
      this.properties.isSidePath = (tile as any).isSidePath;
      this.properties.environment = (tile as any).environment;
      this.properties.lockType = (tile as any).lockable?.lockType;
      this.properties.keyID = (tile as any).lockable?.keyID;
      const linkedRoom: Room | null = (tile as any).linkedRoom || null;
      this.properties.linkedRoomGID = linkedRoom ? linkedRoom.globalId : null;
    } else if (tile instanceof UpLadder) {
      this.type = TileType.UP_LADDER;
      // Persist rope state and explicit link to target room by GID for reliability
      this.properties.isRope = (tile as any).isRope || false;
      const linkedRoom: Room | null = (tile as any).linkedRoom || null;
      this.properties.linkedRoomGID = linkedRoom ? linkedRoom.globalId : null;
    } else if (tile instanceof Pool) {
      this.type = TileType.POOL;
      // Reconstruct edge information from tileX, tileY values
      const baseTileX = (tile as any).skin === 1 ? 24 : 20;
      const baseTileY = 4;
      this.properties.leftEdge = (tile as any).tileX < baseTileX;
      this.properties.rightEdge = (tile as any).tileX > baseTileX;
      this.properties.topEdge = (tile as any).topEdge; // This is stored
      this.properties.bottomEdge = (tile as any).tileY > baseTileY;
    } else if (tile instanceof Chasm) {
      this.type = TileType.CHASM;
      // Reconstruct edge information from tileX, tileY values
      const baseTileX = (tile as any).skin === 1 ? 24 : 20;
      const baseTileY = 1;
      this.properties.leftEdge = (tile as any).tileX < baseTileX;
      this.properties.rightEdge = (tile as any).tileX > baseTileX;
      this.properties.topEdge = (tile as any).topEdge; // This is stored
      this.properties.bottomEdge = (tile as any).tileY > baseTileY;
    } else if (tile instanceof SpawnFloor) {
      this.type = TileType.SPAWN_FLOOR;
    } else if (tile instanceof SpikeTrap) {
      this.type = TileType.SPIKE_TRAP;
      this.properties.triggered = (tile as any).triggered;
    } else if (tile instanceof Spike) {
      this.type = TileType.SPIKE;
    } else if (tile instanceof Trapdoor) {
      this.type = TileType.TRAP_DOOR;
    } else if (tile instanceof Bones) {
      this.type = TileType.BONES;
    } else {
      // Default fallback
      this.type = TileType.FLOOR;
      console.warn(
        "Unknown tile type, defaulting to FLOOR:",
        tile.constructor.name,
      );
    }
  }
}

let loadTile = (ts: TileState, room: Room, game: Game): Tile => {
  let tile: Tile;

  switch (ts.type) {
    case TileType.FLOOR:
      tile = new Floor(room, ts.x, ts.y);
      break;
    case TileType.WALL:
      tile = new Wall(room, ts.x, ts.y);
      break;
    case TileType.WALL_TORCH:
      tile = new WallTorch(room, ts.x, ts.y, ts.properties.isBottomWall);
      (tile as any).frame = ts.properties.frame || 0;
      break;
    case TileType.DOOR:
      // Prefer `doorType`, fallback to `type` if older saves
      const _doorType =
        (ts.properties.doorType as DoorType | undefined) ??
        (ts.properties.type as DoorType | undefined) ??
        DoorType.DOOR;
      tile = new Door(room, game, ts.x, ts.y, ts.properties.doorDir, _doorType);
      (tile as any).isOpen = ts.properties.isOpen || false;
      if (typeof ts.properties.opened === "boolean")
        (tile as any).opened = ts.properties.opened;
      if (typeof ts.properties.locked === "boolean")
        (tile as any).locked = ts.properties.locked;
      // Restore lockable details if present
      try {
        if ((tile as any).lockable && ts.properties.lockType !== undefined) {
          (tile as any).lockable.lockType = ts.properties.lockType;
          (tile as any).lockable.keyID = ts.properties.keyID;
        }
      } catch {}
      // Stash pending link target for global post-load linking
      (tile as any)._pendingLinkedDoorGID = ts.properties.linkedDoorGID || null;
      // Restore globalId for determinism across save/load
      if (ts.properties.globalId) {
        try {
          IdGenerator.reserve(ts.properties.globalId);
          (tile as any).globalId = ts.properties.globalId;
        } catch {}
      }
      break;
    case TileType.DOWN_LADDER:
      tile = new DownLadder(
        room,
        game,
        ts.x,
        ts.y,
        ts.properties.isSidePath || false,
        ts.properties.environment,
        ts.properties.lockType,
        undefined,
        // lockStateOverride ensures saved lockType/keyID are restored exactly
        { lockType: ts.properties.lockType, keyID: ts.properties.keyID },
      );
      if (ts.properties.linkedRoomGID) {
        const linked = game.roomsById?.get(ts.properties.linkedRoomGID);
        if (linked) (tile as any).linkedRoom = linked;
      }
      break;
    case TileType.UP_LADDER:
      tile = new UpLadder(room, game, ts.x, ts.y);
      (tile as any).isRope = !!ts.properties.isRope;
      if (ts.properties.linkedRoomGID) {
        const linked = game.roomsById?.get(ts.properties.linkedRoomGID);
        if (linked) (tile as any).linkedRoom = linked;
      }
      break;
    case TileType.POOL:
      tile = new Pool(
        room,
        ts.x,
        ts.y,
        ts.properties.leftEdge || false,
        ts.properties.rightEdge || false,
        ts.properties.topEdge || false,
        ts.properties.bottomEdge || false,
      );
      break;
    case TileType.CHASM:
      tile = new Chasm(
        room,
        ts.x,
        ts.y,
        ts.properties.leftEdge || false,
        ts.properties.rightEdge || false,
        ts.properties.topEdge || false,
        ts.properties.bottomEdge || false,
      );
      break;
    case TileType.SPAWN_FLOOR:
      tile = new SpawnFloor(room, ts.x, ts.y);
      break;

    case TileType.SPIKE_TRAP:
      tile = new SpikeTrap(room, ts.x, ts.y);
      (tile as any).triggered = ts.properties.triggered || false;
      break;
    case TileType.SPIKE:
      tile = new Spike(room, ts.x, ts.y);
      break;

    case TileType.BONES:
      tile = new Bones(room, ts.x, ts.y);
      break;

    default:
      console.error(
        "Unknown tile type:",
        ts.type,
        "TileType enum value:",
        TileType[ts.type],
        "Falling back to floor",
      );
      tile = new Floor(room, ts.x, ts.y);
      break;
  }
  tile.skin = room.skin;

  return tile;
};
