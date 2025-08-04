import { Barrel } from "../entity/object/barrel";
import { BigSkullEnemy } from "../entity/enemy/bigSkullEnemy";
import { ChargeEnemy, ChargeEnemyState } from "../entity/enemy/chargeEnemy";
import { Chest } from "../entity/object/chest";
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
  enemySpawn: EnemyState;
  wizardState: number;
  wizardParentID: number;

  constructor(projectile: Projectile, game: Game) {
    this.x = projectile.x;
    this.y = projectile.y;
    this.dead = projectile.dead;
    if (projectile instanceof EnemySpawnAnimation) {
      this.type = ProjectileType.SPAWN;
      this.roomID = game.rooms.indexOf(projectile.room);
      this.enemySpawn = new EnemyState(projectile.enemy, game);
    }
    if (projectile instanceof WizardFireball) {
      this.type = ProjectileType.WIZARD;
      this.wizardState = projectile.state;
      this.roomID = game.rooms.indexOf(projectile.parent.room);
      this.wizardParentID = projectile.parent.room.entities.indexOf(
        projectile.parent,
      );
    }
  }
}

let loadProjectile = (ps: ProjectileState, game: Game): Projectile => {
  if (ps.type === ProjectileType.SPAWN) {
    let room = game.rooms[ps.roomID];
    let enemy = loadEnemy(ps.enemySpawn, game);
    let p = new EnemySpawnAnimation(room, enemy, ps.x, ps.y);
    p.dead = ps.dead;
    return p;
  }
  if (ps.type === ProjectileType.WIZARD) {
    let wizard = game.rooms[ps.roomID].entities[
      ps.wizardParentID
    ] as EnergyWizardEnemy;
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
}

export class EnemyState {
  type: EnemyType;
  roomID: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  unconscious: boolean;
  direction: Direction;
  dead: boolean;
  skipNextTurns: number;
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

  constructor(enemy: Entity, game: Game) {
    this.roomID = game.rooms.indexOf(enemy.room);
    this.x = enemy.x;
    this.y = enemy.y;
    this.health = enemy.health;
    this.maxHealth = enemy.maxHealth;
    this.unconscious = (enemy as Enemy).unconscious;
    this.direction = enemy.direction;
    this.dead = enemy.dead;
    this.skipNextTurns = enemy.skipNextTurns;
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
    if (enemy instanceof OccultistEnemy) this.type = EnemyType.OCCULTIST;
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
  }
}

let loadEnemy = (es: EnemyState, game: Game): Entity => {
  let enemy;
  let room = game.rooms[es.roomID];
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
  (enemy as Enemy).unconscious = es.unconscious;
  enemy.direction = es.direction;
  enemy.dead = es.dead;
  enemy.skipNextTurns = es.skipNextTurns;
  if (es.hasDrop) enemy.drop = loadItem(es.drop, game);
  enemy.alertTicks = es.alertTicks;

  return enemy;
};

export class RoomState {
  roomID: number;
  entered: boolean;
  enemies: Array<EnemyState>;
  items: Array<ItemState>;
  projectiles: Array<ProjectileState>;
  hitwarnings: Array<HitWarningState>;
  active: boolean;
  onScreen: boolean;
  lightingUpdateInProgress?: boolean;

  constructor(room: Room, game: Game) {
    this.roomID = game.rooms.indexOf(room);
    this.entered = room.entered;
    this.active = room.active;
    this.onScreen = room.onScreen;
    this.enemies = [];
    this.items = [];
    this.projectiles = [];
    this.hitwarnings = [];
    for (const enemy of room.entities)
      this.enemies.push(new EnemyState(enemy, game));
    for (const item of room.items) {
      if (item) {
        this.items.push(new ItemState(item, game));
      }
    }
    for (const projectile of room.projectiles)
      this.projectiles.push(new ProjectileState(projectile, game));
    for (const hw of room.hitwarnings)
      this.hitwarnings.push(new HitWarningState(hw));
  }
}

let loadRoom = (room: Room, roomState: RoomState, game: Game) => {
  room.entered = roomState.entered;
  room.active = roomState.active;
  room.onScreen = roomState.onScreen;
  room.entities = [];
  room.items = [];
  room.projectiles = [];
  room.hitwarnings = [];
  for (const enemy of roomState.enemies)
    room.entities.push(loadEnemy(enemy, game));
  for (const item of roomState.items) {
    if (item) {
      room.items.push(loadItem(item, game));
    }
  }
  for (const projectile of roomState.projectiles)
    room.projectiles.push(loadProjectile(projectile, game));
  for (const hw of roomState.hitwarnings)
    room.hitwarnings.push(loadHitWarning(hw, game));

  // Reset lighting state to prevent recursion issues
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
  stackCount: number;
  pickedUp: boolean;
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
    this.stackCount = item.stackCount;
    this.pickedUp = item.pickedUp;
  }
}

let loadItem = (i: ItemState, game: Game, player?: Player): Item => {
  let room = i.roomID !== -1 ? game.rooms[i.roomID] : null;
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

  if (i.equipped) item.equipped = true;
  if (item instanceof Equippable) item.setWielder(player);
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
  items: Array<ItemState>;

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
    this.items = Array<ItemState>();
    for (const item of inventory.items) {
      // Filter out null items
      if (item) {
        this.items.push(new ItemState(item, game));
      }
    }
  }
}

let loadInventory = (inventory: Inventory, i: InventoryState, game: Game) => {
  inventory.clear();
  inventory.isOpen = i.isOpen;
  inventory.cols = i.cols;
  inventory.rows = i.rows;
  inventory.selX = i.selX;
  inventory.selY = i.selY;
  inventory.equipAnimAmount = i.equipAnimAmount.map((x) => x);
  inventory.coins = i.coins;

  // Load items - make sure to maintain proper inventory structure
  for (const itemState of i.items) {
    if (itemState) {
      // Additional null check
      const loadedItem = loadItem(itemState, game, inventory.player);
      if (loadedItem) {
        inventory.items.push(loadedItem);
      }
    }
  }

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
  direction: Direction;
  health: number;
  maxHealth: number;
  lastTickHealth: number;
  inventory: InventoryState;
  hasOpenVendingMachine: boolean;
  openVendingMachineRoomID: number;
  openVendingMachineID: number;
  sightRadius: number;

  constructor(player: Player, game: Game) {
    this.x = player.x;
    this.y = player.y;
    this.dead = player.dead;
    this.roomID = player.levelID;
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
      this.openVendingMachineID =
        player.openVendingMachine.room.entities.indexOf(
          player.openVendingMachine,
        );
    }
    this.sightRadius = player.sightRadius;
  }
}

let loadPlayer = (id: string, p: PlayerState, game: Game): Player => {
  let player = new Player(game, p.x, p.y, id === game.localPlayerID);
  player.dead = p.dead;

  player.levelID = p.roomID;
  if (player.levelID < game.levelgen.currentFloorFirstLevelID) {
    // catch up to the current level
    player.levelID = game.levelgen.currentFloorFirstLevelID;
    player.x =
      game.rooms[player.levelID].roomX +
      Math.floor(game.rooms[player.levelID].width / 2);
    player.y =
      game.rooms[player.levelID].roomY +
      Math.floor(game.rooms[player.levelID].height / 2);
  }
  player.direction = p.direction;
  player.health = p.health;
  player.maxHealth = p.maxHealth;
  player.lastTickHealth = p.lastTickHealth;
  loadInventory(player.inventory, p.inventory, game);
  if (p.hasOpenVendingMachine) {
    player.openVendingMachine = game.rooms[p.openVendingMachineRoomID].entities[
      p.openVendingMachineID
    ] as VendingMachine;
  }
  player.sightRadius = p.sightRadius;

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

  constructor(level: Level) {
    this.depth = level.depth;
    this.width = level.width;
    this.height = level.height;
    this.isMainPath = level.isMainPath;
    this.mapGroup = level.mapGroup;
    this.envType = level.environment.type;
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
  let gs = new GameState();
  gs.seed = game.levelgen.seed; // random state for generating levels
  gs.randomState = Random.state; // current random state
  gs.level = new LevelState(game.level);
  for (const i in game.players)
    gs.players[i] = new PlayerState(game.players[i], game);
  for (const i in game.offlinePlayers) {
    gs.offlinePlayers[i] = new PlayerState(game.offlinePlayers[i], game);
  }
  for (let room of game.rooms) {
    room.catchUp();
    gs.rooms.push(new RoomState(room, game));
  }
  return gs;
};

export const loadGameState = (
  game: Game,
  activeUsernames: Array<string>,
  gameState: GameState,
  newWorld: boolean,
) => {
  game.rooms = Array<Room>();

  game.levelgen = new LevelGenerator();
  game.levelgen.setSeed(gameState.seed);

  // If gameState.level is null, we need to create a default level state
  if (!gameState.level) {
    // This is a simplified assumption. We create a new level with default parameters
    // since we don't have a level object to create a state from.
    // This part might need adjustment based on how a "default" level is defined.
    const tempLevel = new Level(game, 0, 1, 1, true, 0, EnvType.DUNGEON);
    gameState.level = new LevelState(tempLevel);
  }

  if (newWorld) gameState.level.depth = 0;
  globalEventBus.emit(EVENTS.LEVEL_GENERATION_STARTED, {});
  game.levelgen.generateFirstNFloors(game, gameState.level.depth).then(() => {
    globalEventBus.emit(EVENTS.LEVEL_GENERATION_COMPLETED, {});
    if (!newWorld) {
      if (gameState.level) {
        loadLevel(game.level, gameState.level);
      }
      if (gameState.players) {
        for (const i in gameState.players) {
          if (activeUsernames.includes(i))
            game.players[i] = loadPlayer(i, gameState.players[i], game);
          else
            game.offlinePlayers[i] = loadPlayer(i, gameState.players[i], game);
        }
      }
      if (gameState.offlinePlayers) {
        for (const i in gameState.offlinePlayers) {
          if (i === game.localPlayerID)
            game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
          else if (activeUsernames.includes(i))
            game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
          else
            game.offlinePlayers[i] = loadPlayer(
              i,
              gameState.offlinePlayers[i],
              game,
            );
        }
      }
      for (let roomState of gameState.rooms) {
        for (let i = 0; i < game.rooms.length; i++) {
          if (i === roomState.roomID) {
            loadRoom(game.rooms[i], roomState, game);
          }
        }
      }
      if (
        !(game.localPlayerID in gameState.players) &&
        !(game.localPlayerID in gameState.offlinePlayers)
      ) {
        // we're not in the gamestate, create a new player
        game.players[game.localPlayerID] = new Player(game, 0, 0, true);
        game.players[game.localPlayerID].levelID =
          game.levelgen.currentFloorFirstLevelID;
        game.players[game.localPlayerID].x =
          game.rooms[game.levelgen.currentFloorFirstLevelID].roomX +
          Math.floor(
            game.rooms[game.levelgen.currentFloorFirstLevelID].width / 2,
          );
        game.players[game.localPlayerID].y =
          game.rooms[game.levelgen.currentFloorFirstLevelID].roomY +
          Math.floor(
            game.rooms[game.levelgen.currentFloorFirstLevelID].height / 2,
          );
        game.room = game.rooms[game.levelgen.currentFloorFirstLevelID];

        game.room.enterLevel(game.players[game.localPlayerID]);
        game.players[game.localPlayerID].map.updateSeenTiles();
        game.players[game.localPlayerID].map.saveMapData();
      } else {
        // Set the current room based on the loaded player's levelID
        const localPlayer = game.players[game.localPlayerID];
        game.room = game.rooms[localPlayer.levelID];

        // Properly initialize the room for the loaded player
        // Update the game level reference
        game.updateLevel(game.room);

        // Do the room setup without moving the player (keep saved position)
        game.room.onEnterRoom(localPlayer);

        // Update the player's map data
        localPlayer.map.updateSeenTiles();
        localPlayer.map.saveMapData();

        // Optional: Add validation after the room setup
        const tile = game.room.roomArray[localPlayer.x]?.[localPlayer.y];
        if (!tile || tile.isSolid()) {
          console.warn(
            "Player loaded in invalid position, moving to room center",
          );
          const roomCenter = game.room.getRoomCenter();
          localPlayer.moveSnap(roomCenter.x, roomCenter.y);
        }
      }
    } else {
      // stub game state, start a new world
      game.players[game.localPlayerID] = new Player(game, 0, 0, true);
      game.room = game.rooms[game.players[game.localPlayerID].levelID];
      game.room.enterLevel(game.players[game.localPlayerID]);
      game.players[game.localPlayerID].map.updateSeenTiles();
      game.players[game.localPlayerID].map.saveMapData();
    }
    Random.setState(gameState.randomState);
    game.room.updateLighting();
    let p = game.players[game.localPlayerID];
    //game.room.items.push(new Key(game.room, p.x - 1, p.y + 1));

    //choose one door to lock
    /*
    let locked = false;
    game.room.doors.forEach((door) => {
      if (!locked) {
        door.lock();
        locked = true;
      }
    });
    */

    game.chat = [];
  });
};
