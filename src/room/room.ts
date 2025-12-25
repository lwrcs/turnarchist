// #region imports
import { Wall } from "../tile/wall";
import { LevelConstants } from "../level/levelConstants";
import { Floor } from "../tile/floor";
import { Direction, Game, LevelState } from "../game";
import { Door, DoorType } from "../tile/door";
import { Tile, SkinType } from "../tile/tile";
import { KnightEnemy } from "../entity/enemy/knightEnemy";
import { Entity, EntityType } from "../entity/entity";
import { Chest } from "../entity/object/chest";
import { Item } from "../item/item";
import { GoldenKey } from "../item/goldenKey";
import { SpawnFloor } from "../tile/spawnfloor";
import { Spike } from "../tile/spike";
import { GameConstants } from "../game/gameConstants";
import { SkullEnemy } from "../entity/enemy/skullEnemy";
import { Barrel } from "../entity/object/barrel";
import { Crate } from "../entity/object/crate";
import { Armor } from "../item/armor";
import { Particle } from "../particle/particle";
import { Projectile } from "../projectile/projectile";
import { SpikeTrap } from "../tile/spiketrap";
import { FountainTile } from "../tile/fountainTile";
import { CoffinTile } from "../tile/coffinTile";
import { PottedPlant } from "../entity/object/pottedPlant";
import { InsideLevelDoor } from "../tile/insideLevelDoor";
import { Button } from "../tile/button";
import { HitWarning } from "../drawable/hitWarning";
import { UpLadder } from "../tile/upLadder";
import { DownLadder } from "../tile/downLadder";
import { CoalResource } from "../entity/resource/coalResource";
import { GoldResource } from "../entity/resource/goldResource";
import { EmeraldResource } from "../entity/resource/emeraldResource";
import { Chasm } from "../tile/chasm";
import { Spawner } from "../entity/enemy/spawner";
import { VendingMachine } from "../entity/object/vendingMachine";
import { WallTorch } from "../tile/wallTorch";
import { LightSource } from "../lighting/lightSource";
import { ChargeEnemy } from "../entity/enemy/chargeEnemy";
import { Shotgun } from "../item/weapon/shotgun";
import { Heart } from "../item/usable/heart";
import { Spear } from "../item/weapon/spear";
import { Drawable } from "../drawable/drawable";
import { Player, PlayerDirection } from "../player/player";
import { CrabEnemy } from "../entity/enemy/crabEnemy";
import { ZombieEnemy } from "../entity/enemy/zombieEnemy";
import { BigSkullEnemy } from "../entity/enemy/bigSkullEnemy";
import { Random } from "../utility/random";
import { Lantern } from "../item/light/lantern";
import { DualDagger } from "../item/weapon/dualdagger";
import { Pot } from "../entity/object/pot";
import { BishopEnemy } from "../entity/enemy/bishopEnemy";
import { Rock } from "../entity/resource/rockResource";
import { Mushrooms } from "../entity/object/mushrooms";
import { ArmoredzombieEnemy } from "../entity/enemy/armoredzombieEnemy";
import { TombStone } from "../entity/object/tombStone";
import { Pumpkin } from "../entity/object/pumpkin";
import { QueenEnemy } from "../entity/enemy/queenEnemy";
import { FrogEnemy } from "../entity/enemy/frogEnemy";
import { BigKnightEnemy } from "../entity/enemy/bigKnightEnemy";
import { Enemy } from "../entity/enemy/enemy";
import { FireWizardEnemy } from "../entity/enemy/fireWizard";
import { EnergyWizardEnemy } from "../entity/enemy/energyWizard";
import { ReverbEngine } from "../sound/reverb";
import { astar } from "../utility/astarclass";
import { Level } from "../level/level";
import { Warhammer } from "../item/weapon/warhammer";
import { Spellbook } from "../item/weapon/spellbook";
import { Torch } from "../item/light/torch";
import { RookEnemy } from "../entity/enemy/rookEnemy";
import { BeamEffect } from "../projectile/beamEffect";
import { EnvType } from "../constants/environmentTypes";
import { Pickaxe } from "../item/tool/pickaxe";
import { OccultistEnemy } from "../entity/enemy/occultistEnemy";
import { Puddle } from "../tile/decorations/puddle";
import { Decoration } from "../tile/decorations/decoration";
import { Bomb } from "../entity/object/bomb";
import { Sound } from "../sound/sound";
import { Block } from "../entity/object/block";
import { Bestiary } from "../game/bestiary";
import { ArmoredSkullEnemy } from "../entity/enemy/armoredSkullEnemy";
import { MummyEnemy } from "../entity/enemy/mummyEnemy";
import { SpiderEnemy } from "../entity/enemy/spiderEnemy";
import { RoomBuilder } from "./roomBuilder";
import { BigZombieEnemy } from "../entity/enemy/bigZombieEnemy";
import { Bush } from "../entity/object/bush";
import { Sprout } from "../entity/object/sprout";
import { Candle } from "../item/light/candle";
import { GlowBugEnemy } from "../entity/enemy/glowBugEnemy";
import { GameplaySettings } from "../game/gameplaySettings";
import { ItemGroup } from "../item/itemGroup";
import { Sword } from "../item/weapon/sword";
import { WebGLBlurRenderer } from "../gui/webglBlurRenderer";
import { Utils } from "../utility/utils";
import { Tree } from "../entity/object/tree";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { WardenEnemy } from "../entity/enemy/wardenEnemy";
import { CrusherEnemy } from "../entity/enemy/crusherEnemy";
import { PawnEnemy } from "../entity/enemy/pawnEnemy";
import { BeetleEnemy } from "../entity/enemy/beetleEnemy";
import { BigFrogEnemy } from "../entity/enemy/bigFrogEnemy";
import { Key } from "../item/key";
import { ExalterEnemy } from "../entity/enemy/exalterEnemy";
import { KingEnemy } from "../entity/enemy/kingEnemy";
import { BoltcasterEnemy } from "../entity/enemy/boltcasterEnemy";
import { EarthWizardEnemy } from "../entity/enemy/earthWizard";
import { Backpack } from "../item/backpack";
import { Coal } from "../item/resource/coal";
import { Passageway } from "../tile/passageway";
import { TallSucculent } from "../entity/object/tallSucculent";

// #endregion

// #region Enums & Interfaces
/**
 * Enumeration of available enemy types.
 */
export enum EnemyType {
  crab = "crab",
  frog = "frog",
  zombie = "zombie",
  skull = "skull",
  energyWizard = "energywizard",
  charge = "charge",
  rook = "rook",
  bishop = "bishop",
  armoredzombie = "armoredzombie",
  bigskull = "bigskull",
  queen = "queen",
  knight = "knight",
  bigknight = "bigknight",
  firewizard = "firewizard",
  spawner = "spawner",
  occultist = "occultist",
  bomb = "bomb",
  armoredskull = "armoredskull",
  mummy = "mummy",
  spider = "spider",
  bigzombie = "bigzombie",
  glowbug = "glowbug",
  tree = "tree",
  tombStone = "tombstone",
  warden = "warden",
  crusher = "crusher",
  pawn = "pawn",
  beetle = "beetle",
  bigfrog = "bigfrog",
  exalter = "exalter",
  king = "king",
  chest = "chest",
  boltcaster = "boltcaster",
  earthwizard = "earthwizard",
  tallSucculent = "succulent",
  // Add other enemy types here
}

/**
 * Mapping of enemy types to their corresponding classes.
 */
export const EnemyTypeMap: { [key in EnemyType]: EnemyStatic } = {
  [EnemyType.crab]: CrabEnemy,
  [EnemyType.frog]: FrogEnemy,
  [EnemyType.zombie]: ZombieEnemy,
  [EnemyType.skull]: SkullEnemy,
  [EnemyType.energyWizard]: EnergyWizardEnemy,
  [EnemyType.charge]: ChargeEnemy,
  [EnemyType.rook]: RookEnemy,
  [EnemyType.bishop]: BishopEnemy,
  [EnemyType.armoredzombie]: ArmoredzombieEnemy,
  [EnemyType.bigskull]: BigSkullEnemy,
  [EnemyType.queen]: QueenEnemy,
  [EnemyType.knight]: KnightEnemy,
  [EnemyType.bigknight]: BigKnightEnemy,
  [EnemyType.firewizard]: FireWizardEnemy,
  [EnemyType.spawner]: Spawner,
  [EnemyType.occultist]: OccultistEnemy,
  [EnemyType.bomb]: Bomb,
  [EnemyType.armoredskull]: ArmoredSkullEnemy,
  [EnemyType.mummy]: MummyEnemy,
  [EnemyType.spider]: SpiderEnemy,
  [EnemyType.bigzombie]: BigZombieEnemy,
  [EnemyType.glowbug]: GlowBugEnemy,
  [EnemyType.tree]: Tree,
  [EnemyType.tombStone]: TombStone,
  [EnemyType.warden]: WardenEnemy,
  [EnemyType.crusher]: CrusherEnemy,
  [EnemyType.pawn]: PawnEnemy,
  [EnemyType.beetle]: BeetleEnemy,
  [EnemyType.bigfrog]: BigFrogEnemy,
  [EnemyType.exalter]: ExalterEnemy,
  [EnemyType.king]: KingEnemy,
  [EnemyType.chest]: Chest,
  [EnemyType.boltcaster]: BoltcasterEnemy,
  [EnemyType.earthwizard]: EarthWizardEnemy,
  [EnemyType.tallSucculent]: TallSucculent,
  // Add other enemy mappings here
};

export enum RoomType {
  START = "START",
  DUNGEON = "DUNGEON",
  BOSS = "BOSS",
  BIGDUNGEON = "BIGDUNGEON",
  TREASURE = "TREASURE",
  FOUNTAIN = "FOUNTAIN",
  COFFIN = "COFFIN",
  GRASS = "GRASS",
  PUZZLE = "PUZZLE",
  KEYROOM = "KEYROOM",
  CHESSBOARD = "CHESSBOARD",
  MAZE = "MAZE",
  CORRIDOR = "CORRIDOR",
  SPIKECORRIDOR = "SPIKECORRIDOR",
  UPLADDER = "UPLADDER",
  DOWNLADDER = "DOWNLADDER",
  SHOP = "SHOP",
  BIGCAVE = "BIGCAVE",
  CAVE = "CAVE",
  SPAWNER = "SPAWNER",
  ROPEHOLE = "ROPEHOLE",
  ROPECAVE = "ROPECAVE",
  TUTORIAL = "TUTORIAL",
  GRAVEYARD = "GRAVEYARD",
  FOREST = "FOREST",
  ROPEUP = "ROPEUP",
  GEMCAVE = "GEMCAVE",
}

export enum TurnState {
  playerTurn,
  computerTurn,
}

export interface WallInfo {
  isTopWall: boolean;
  isBottomWall: boolean;
  isLeftWall: boolean;
  isRightWall: boolean;
  isInnerWall: boolean;
  isBelowDoorWall: boolean;
  isDoorWall: boolean;
  innerWallType: string | null;
  shouldDrawBottom: boolean;
  isAboveDoorWall: boolean;
}

export enum WallDirection {
  NORTH = "North",
  EAST = "East",
  SOUTH = "South",
  WEST = "West",
  TOPLEFT = "TopLeft",
  TOPRIGHT = "TopRight",
  BOTTOMLEFT = "BottomLeft",
  BOTTOMRIGHT = "BottomRight",
}

export interface EnemyStatic {
  add(room: Room, game: Game, x: number, y: number, ...rest: any[]): void;
}

// #endregion

// Add this interface after the existing interfaces
interface BlurCache {
  color6px: HTMLCanvasElement | null;
  color12px: HTMLCanvasElement | null;
  shade5px: HTMLCanvasElement | null;
  bloom8px: HTMLCanvasElement | null;
  color8px: HTMLCanvasElement | null;
  isValid: boolean;
  lastLightingUpdate: number;
}

export class Room {
  globalId: string;
  // Path identifier to group rooms that belong to the same path/sidepath
  pathId: string;
  roomArray: Tile[][];

  softVis: number[][]; // this is the one we use for drawing (includes smoothing)
  vis: number[][]; // visibility ranges from 0 (fully visible) to 1 (fully black)
  softCol: [number, number, number][][];
  col: [number, number, number][][];
  renderBuffer: [number, number, number, number][][][]; // Array of color arrays (r,g,b,alpha) for each x,y position
  oldVis: number[][];
  oldCol: [number, number, number][][];

  entities: Array<Entity>;
  deadEntities: Array<Entity>;
  items: Array<Item>;
  doors: Array<Door>; // (Door | BottomDoor) just a reference for mapping, still access through levelArray
  projectiles: Array<Projectile>;
  particles: Array<Particle>;
  hitwarnings: Array<HitWarning>;
  private colorOffscreenCanvas: HTMLCanvasElement;
  private colorOffscreenCtx: CanvasRenderingContext2D;

  private shadeOffscreenCanvas: HTMLCanvasElement;
  private shadeOffscreenCtx: CanvasRenderingContext2D;
  // Temporary canvas used when Canvas2D filter blur is required for sliced drawing
  private shadeBlurTempCanvas?: HTMLCanvasElement;
  private shadeBlurTempCtx?: CanvasRenderingContext2D;
  // Temporary canvas to apply per-slice gradient masking (post-blur) efficiently
  private shadeSliceTempCanvas?: HTMLCanvasElement;
  private shadeSliceTempCtx?: CanvasRenderingContext2D;
  // Border tiles around shade content for sliced shading (ensures blur has room to spill)
  private shadeSliceBorderTiles: number = 1;
  private bloomOffscreenCanvas: HTMLCanvasElement;
  private bloomOffscreenCtx: CanvasRenderingContext2D;

  currentSpawnerCount: number;

  game: Game;
  roomX: number;
  roomY: number;
  width: number;
  height: number;
  type: RoomType;
  depth: number;
  mapGroup: number;
  name: string = "";
  message: string;
  turn: TurnState;
  playerTurnTime: number;
  playerTicked: Player;
  skin: SkinType;
  entered: boolean; // has the player entered this level
  lightSources: Array<LightSource>;
  shadeColor = "#000000";
  innerWalls: Array<Wall>;
  wallInfo: Map<string, WallInfo> = new Map();

  // #region Z DEBUG (stacked layer test geometry)
  /**
   * When `GameConstants.Z_DEBUG_MODE` is enabled, these sets define per-coordinate
   * overrides for z-layer rendering/collision.
   */
  zDebugUpperFloors?: Set<string>;
  /**
   * Per-tile override map for z=1 during Z_DEBUG_MODE.
   * If present, every (x,y) inside the room should have an entry (Floor or Air).
   */
  zDebugZ1Tiles?: Map<string, Tile>;
  zDebugUpStairs?: Set<string>; // triggers z 0 -> 1
  zDebugDownStairs?: Set<string>; // triggers z 1 -> 0 (typically placed on upper floors)
  /** Linked z-debug stairs endpoints (single pair for now). */
  zDebugStairLink?: {
    up: { x: number; y: number };
    down: { x: number; y: number };
  };

  private zKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  isSolidAt(x: number, y: number, zLayer: number): boolean {
    const tile = this.roomArray[x]?.[y];
    if (!tile) return true;

    // Doors are only accessible from the same z-layer.
    // Tiles are still shared across layers for now, so this blocks moving through (or onto)
    // a door when you're on a different z than the door's `z` property.
    if (tile instanceof Door && (tile.z ?? 0) !== zLayer) {
      return true;
    }

    // Z-debug: allow stepping onto the "hanging" down-stairs tile on z=1,
    // even if the z=1 override tile at that coordinate is Air (solid).
    if (
      GameConstants.Z_DEBUG_MODE &&
      zLayer === 1 &&
      this.zDebugDownStairs &&
      this.zDebugDownStairs.has(this.zKey(x, y))
    ) {
      return false;
    }

    if (GameConstants.Z_DEBUG_MODE && zLayer === 1 && this.zDebugZ1Tiles) {
      const override = this.zDebugZ1Tiles.get(this.zKey(x, y));
      // If missing (shouldn't happen), treat as solid to be safe.
      return override ? override.isSolid() : true;
    }

    // Z-debug: allow stepping "into" the embedded wall-stairs on z=0
    if (
      GameConstants.Z_DEBUG_MODE &&
      zLayer === 0 &&
      this.zDebugUpStairs &&
      this.zDebugUpStairs.has(this.zKey(x, y))
    ) {
      return false;
    }

    if (
      GameConstants.Z_DEBUG_MODE &&
      zLayer === 1 &&
      this.zDebugUpperFloors &&
      this.zDebugUpperFloors.has(this.zKey(x, y))
    ) {
      return false;
    }

    return tile.isSolid();
  }

  /**
   * Z-debug per-step trigger (stairs that are only active on a specific z-layer).
   * Call this after a successful move.
   */
  applyZDebugStep(player: Player, x: number, y: number) {
    if (!GameConstants.Z_DEBUG_MODE) return;
    const key = this.zKey(x, y);
    if (player.z === 0 && this.zDebugUpStairs?.has(key)) {
      player.move(x, y, 1);

      //player.z = 1;
      // Up-stairs: switch to z=1 but stay on the same (x,y) wall tile.
      // Z changed; refresh lighting (lighting is computed for the active z-layer).
      this.updateLighting({ x: player.x, y: player.y });
      return;
    }
    if (player.z === 1 && this.zDebugDownStairs?.has(key)) {
      player.move(x, y, 0);
      //player.z = 0;
      // Down-stairs: switch to z=0 but stay on the same (x,y) ledge tile.
      // Z changed; refresh lighting (lighting is computed for the active z-layer).
      this.updateLighting({ x: player.x, y: player.y });
      return;
    }
  }
  // #endregion
  savePoint: Room;
  lastEnemyCount: number;
  outerWalls: Array<Wall>;
  level: Level;
  id: number;
  tunnelDoor: Door = null; // this is the door that connects the start room to the exit room
  active: boolean;
  onScreen: boolean;
  private visibleTileMinX?: number;
  private visibleTileMaxX?: number;
  private visibleTileMinY?: number;
  private visibleTileMaxY?: number;
  lastLightingUpdate: number;
  walls: Array<Wall>;
  decorations: Array<Decoration>;
  blurOffsetX: number = 5;
  blurOffsetY: number = 5;
  lastDraw: number = 0;
  drawTimestamp: number = 0;
  drawInterval: number = 4;
  builder: RoomBuilder;
  envType: EnvType;
  keyPathDots: Array<{ x: number; y: number }>;

  underwater: boolean = false;

  // Add a list to keep track of BeamEffect instances
  beamEffects: BeamEffect[] = [];
  // Prevent unbounded particle growth when particles are spawned during render-time
  // (e.g. bubbles) but turn/tick cleanup isn't running (idle, menus, replay, etc).
  private particleCleanupAccumulator: number = 0;

  // Add this property to track created mask canvases
  // Note: older versions tracked every created mask canvas, which could leak memory if called repeatedly.
  // Keep a single reusable wall mask canvas instead.
  private wallMaskCanvas?: HTMLCanvasElement;
  private wallMaskCtx?: CanvasRenderingContext2D;

  // Add blur cache property
  private blurCache: BlurCache = {
    color6px: null,
    color12px: null,
    shade5px: null,
    bloom8px: null,
    color8px: null,
    isValid: false,
    lastLightingUpdate: 0,
  };
  private isUpdatingLighting: boolean = false;
  // Estimated number of tiles touched during lighting for dynamic tuning
  estimatedLightingTiles: number = 0;
  // Fast lookup for opaque entities blocking light this frame (when enabled)
  private opaqueEntityPositions?: Set<string>;

  constructor(
    game: Game,
    x: number,
    y: number,
    w: number,
    h: number,
    type: RoomType,
    depth: number,
    mapGroup: number,
    level: Level,
    rand = Random.rand,
    envType: EnvType,
  ) {
    this.globalId = IdGenerator.generate("R");
    this.pathId = "main";
    this.game = game;
    this.roomX = x; //Math.floor(- this.width / 2);
    this.roomY = y; //Math.floor(- this.height / 2);
    this.width = w;
    this.height = h;
    this.type = type;
    this.depth = depth;
    this.mapGroup = mapGroup;

    this.entered = false;
    this.turn = TurnState.playerTurn;
    this.playerTurnTime = Date.now();

    this.items = Array<Item>();
    this.projectiles = Array<Projectile>();
    this.hitwarnings = Array<HitWarning>();
    this.particles = Array<Particle>();
    this.doors = Array<Door>();
    this.entities = Array<Entity>();
    this.lightSources = Array<LightSource>();
    this.innerWalls = Array<Wall>();
    this.level = level;
    this.id = 0;
    this.currentSpawnerCount = 0;
    this.deadEntities = Array<Entity>();
    this.active = false;
    this.lastLightingUpdate = 0;
    this.walls = Array<Wall>();
    this.decorations = Array<Decoration>();
    this.underwater = envType === EnvType.FLOODED_CAVE;
    // Initialize Color Offscreen Canvas
    this.colorOffscreenCanvas = document.createElement("canvas");
    this.colorOffscreenCanvas.width =
      (this.width + 10) * GameConstants.TILESIZE;
    this.colorOffscreenCanvas.height =
      (this.height + 10) * GameConstants.TILESIZE;
    const colorCtx = this.colorOffscreenCanvas.getContext("2d");
    if (!colorCtx) {
      throw new Error("Failed to initialize color offscreen canvas context.");
    }
    this.colorOffscreenCtx = colorCtx;

    // Initialize Shade Offscreen Canvas
    this.shadeOffscreenCanvas = document.createElement("canvas");
    this.shadeOffscreenCanvas.width =
      (this.width + 10) * GameConstants.TILESIZE;
    this.shadeOffscreenCanvas.height =
      (this.height + 10) * GameConstants.TILESIZE;
    const shadeCtx = this.shadeOffscreenCanvas.getContext("2d");
    if (!shadeCtx) {
      throw new Error("Failed to initialize shade offscreen canvas context.");
    }
    this.shadeOffscreenCtx = shadeCtx;

    // Initialize Bloom Offscreen Canvas
    this.bloomOffscreenCanvas = document.createElement("canvas");
    this.bloomOffscreenCanvas.width =
      (this.width + 10) * GameConstants.TILESIZE;
    this.bloomOffscreenCanvas.height =
      (this.height + 10) * GameConstants.TILESIZE;
    const bloomCtx = this.bloomOffscreenCanvas.getContext("2d");
    if (!bloomCtx) {
      throw new Error("Failed to initialize bloom offscreen canvas context.");
    }
    this.bloomOffscreenCtx = bloomCtx;

    // #region initialize arrays

    //initialize room array

    this.roomArray = [];
    for (let x = this.roomX - 1; x < this.roomX + this.width + 1; x++) {
      this.roomArray[x] = [];
      for (let y = this.roomY - 1; y < this.roomY + this.height + 1; y++) {
        this.roomArray[x][y] = null;
      }
    }

    //initialize visibility & color arrays, as well as their soft variants
    this.vis = [];
    this.softVis = [];
    this.col = [];
    this.softCol = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      this.vis[x] = [];
      this.softVis[x] = [];
      this.col[x] = [];
      this.softCol[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.vis[x][y] = 1;
        this.softVis[x][y] = 1;
        this.col[x][y] = [0, 0, 0];
        this.softCol[x][y] = [0, 0, 0];
      }
    }

    //initialize the render buffer array
    this.renderBuffer = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      this.renderBuffer[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.renderBuffer[x][y] = [];
      }
    }

    //initialize the skin for the given environment
    this.envType = envType;
    this.skin = envType as unknown as SkinType;
    if (this.envType === EnvType.TUTORIAL) {
      this.skin = SkinType.DUNGEON as SkinType;
    }
    /*
    if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE) {
      this.skin = SkinType.CAVE;
    }
    if (this.type === RoomType.ROPEUP || this.type === RoomType.FOREST) {
      this.skin = SkinType.FOREST;
    }
    */

    this.builder = new RoomBuilder(this);

    // #endregion
  }

  playMusic = () => {
    if (this.envType === EnvType.FOREST) {
      Sound.stopMusic();

      Sound.playForestMusic();
    } else if (this.envType === EnvType.CAVE) {
      Sound.stopMusic();

      Sound.playCaveMusic();
    } else if (this.envType === EnvType.CASTLE) {
      Sound.stopMusic();

      Sound.playCastleMusic();
    } else {
      Sound.stopMusic();
    }
  };

  // #region TILE ADDING METHODS

  removeWall = (x: number, y: number) => {
    if (this.roomArray[x][y] instanceof Wall) {
      this.roomArray[x][y] = null;
    }
    //this.innerWalls = this.innerWalls.filter((w) => w.x !== x && w.y !== y);
    //this.outerWalls = this.outerWalls.filter((w) => w.x !== x && w.y !== y);
  };

  private addDoorTorches(x: number, y: number, doorDir: Direction) {
    if (doorDir !== Direction.UP && doorDir !== Direction.DOWN) {
      return;
    }

    if (x && y) {
      this.calculateWallInfo();
      const leftWallInfo = this.wallInfo.get(`${x - 1},${y}`);
      const rightWallInfo = this.wallInfo.get(`${x + 1},${y}`);
      const leftTile = this.roomArray[x - 1]?.[y];
      const rightTile = this.roomArray[x + 1]?.[y];
      const leftOpen = leftWallInfo?.isLeftWall === false;
      const rightOpen = rightWallInfo?.isRightWall === false;

      if (leftOpen) {
        this.roomArray[x - 1][y] = new WallTorch(this, x - 1, y);
      }

      if (rightOpen) {
        this.roomArray[x + 1][y] = new WallTorch(this, x + 1, y);
      }
    }
  }

  private addTorches(
    numTorches: number,
    rand: () => number,
    placeX?: number,
    placeY?: number,
  ) {
    if (
      this.level.environment.type === EnvType.FOREST &&
      this.type !== RoomType.DOWNLADDER
    )
      return;

    if (
      placeX !== undefined &&
      placeY !== undefined &&
      this.roomArray[placeX]?.[placeY] instanceof Wall
    ) {
      this.roomArray[placeX][placeY] = new WallTorch(this, placeX, placeY);

      return;
    }

    let walls = [];
    for (let xx = this.roomX + 1; xx < this.roomX + this.width - 2; xx++) {
      for (let yy = this.roomY; yy < this.roomY + this.height - 1; yy++) {
        if (
          this.roomArray[xx][yy] instanceof Wall &&
          !(this.roomArray[xx][yy + 1] instanceof Wall)
        ) {
          walls.push(this.roomArray[xx][yy]);
        }
      }
    }
    let bottomWalls = [];
    // Separate loop for bottom wall
    for (let xx = this.roomX + 1; xx < this.roomX + this.width - 2; xx++) {
      const yy = this.roomY + this.height - 1; // Bottom wall
      if (
        this.roomArray[xx][yy] instanceof Wall &&
        !(this.roomArray[xx][yy + 1] instanceof Wall)
      ) {
        bottomWalls.push(this.roomArray[xx][yy]);
      }
    }

    // Randomly distribute torches between walls and bottom walls
    const wallTorches = Game.rand(0, numTorches, rand);
    const bottomWallTorches = numTorches - wallTorches;

    for (let i = 0; i < wallTorches; i++) {
      if (walls.length == 0) break;
      const randomIndex = Game.rand(0, walls.length - 1, rand);
      const t = walls.splice(randomIndex, 1)[0];
      const x = t.x;
      const y = t.y;
      this.roomArray[x][y] = new WallTorch(this, x, y);
    }
    for (let i = 0; i < bottomWallTorches; i++) {
      if (bottomWalls.length == 0) break;
      const randomIndex = Game.rand(0, bottomWalls.length - 1, rand);
      const t = bottomWalls.splice(randomIndex, 1)[0];
      const x = t.x;
      const y = t.y;
      this.roomArray[x][y] = new WallTorch(this, x, y, true);
    }
  }

  private addChasms(rand: () => number) {
    // add chasms
    let w = Game.rand(2, 4, rand);
    let h = Game.rand(2, 4, rand);
    let xmin = this.roomX + 2;
    let xmax = this.roomX + this.width - w - 2;
    let ymin = this.roomY + 2;
    let ymax = this.roomY + this.height - h - 2;
    if (xmax < xmin || ymax < ymin) return;
    let x = Game.rand(xmin, xmax, rand);
    let y = Game.rand(ymin, ymax, rand);

    for (let xx = x - 1; xx < x + w + 1; xx++) {
      for (let yy = y - 1; yy < y + h + 1; yy++) {
        // add a floor border
        if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h) {
          if (!(this.roomArray[xx][yy] instanceof SpawnFloor))
            this.roomArray[xx][yy] = new Floor(this, xx, yy);
        } else
          this.roomArray[xx][yy] = new Chasm(
            this,
            xx,
            yy,
            xx === x,
            xx === x + w - 1,
            yy === y,
            yy === y + h - 1,
          );
      }
    }
  }

  addDoor = (
    x: number,
    y: number,
    room: Room = this,
    tunnelDoor: boolean = false,
  ) => {
    let d;
    let t = DoorType.DOOR;
    if (room.type === RoomType.BOSS) t = DoorType.GUARDEDDOOR;
    if (room.type === RoomType.KEYROOM) t = DoorType.LOCKEDDOOR;
    if (tunnelDoor) t = DoorType.TUNNELDOOR;
    if (x === room.roomX) {
      d = new Door(room, room.game, x, y, Direction.RIGHT, t);
      room.roomArray[x + 1][y] = new SpawnFloor(room, x + 1, y);
    } else if (x === room.roomX + room.width - 1) {
      d = new Door(room, room.game, x, y, Direction.LEFT, t);
      room.roomArray[x - 1][y] = new SpawnFloor(room, x - 1, y);
    } else if (y === room.roomY) {
      d = new Door(room, room.game, x, y, Direction.UP, t);
      room.roomArray[x][y + 1] = new SpawnFloor(room, x, y + 1);
    } else if (y === room.roomY + room.height - 1) {
      d = new Door(room, room.game, x, y, Direction.DOWN, t);
      room.roomArray[x][y - 1] = new SpawnFloor(room, x, y - 1);
    }

    if (tunnelDoor) {
      room.tunnelDoor = d;
    }

    room.doors.push(d);
    if (room.roomArray[d.x] == undefined) {
      //console.log("door not added");
    }
    room.roomArray[d.x][d.y] = d;

    return d;
  };

  // ... start of file ...

  private addSpikeTraps(numSpikes: number, rand: () => number) {
    if (
      this.level.environment.type === EnvType.FOREST ||
      this.envType === EnvType.FOREST
    )
      return;
    // add spikes
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.roomArray[x][y] = new SpikeTrap(this, x, y);
    }
  }

  // #endregion

  // #region ADDING ENTITIES

  // Function to add enemies to the room
  private addEnemies(numEnemies: number, rand: () => number) {
    if (GameplaySettings.NO_ENEMIES === true) return;
    if (this.envType === EnvType.FOREST) numEnemies /= 2;
    // Get all empty tiles in the room
    let tiles = this.getEmptyTiles();
    if (tiles === null) return;
    //don't put enemies near the entrances so you don't get screwed instantly

    // Create a Set to store coordinates that should be excluded
    const excludedCoords = new Set<string>();

    // For each door, add coordinates in a 5x5 area around it to excluded set
    for (const door of this.doors) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          excludedCoords.add(`${door.x + dx},${door.y + dy}`);
        }
      }
    }

    // Filter tiles that aren't in the excluded set
    tiles = tiles.filter((tile) => !excludedCoords.has(`${tile.x},${tile.y}`));
    // Loop through the number of enemies to be added
    for (let i = 0; i < numEnemies; i++) {
      let rerolls = 1;

      if (tiles.length === 0) {
        console.warn(`No tiles left to spawn enemies`);
        break;
      }
      let emptyTiles = this.getRandomEmptyPosition(tiles);
      if (emptyTiles.x === null || emptyTiles.y === null) {
        i = numEnemies;
        break;
      }
      const { x, y } = emptyTiles;

      // Define the enemy tables for each depth level
      let tables = this.level.enemyParameters.enemyTables;
      // Define the maximum depth level
      let max_depth_table = this.level.enemyParameters.maxDepthTable;
      // Get the current depth level, capped at the maximum
      let d = Math.min(this.depth, max_depth_table);
      // If there is a table for the current depth level
      if (tables[d] && tables[d].length > 0) {
        // Function to add an enemy to the room
        let addEnemy = (enemy: Entity): boolean => {
          // Check if the enemy overlaps with any other enemies
          for (let xx = 0; xx < enemy.w; xx++) {
            for (let yy = 0; yy < enemy.h; yy++) {
              if (!tiles.some((tt) => tt.x === x + xx && tt.y === y + yy)) {
                // If it does, increment the enemy count and return false
                numEnemies++;
                return false;
              }
            }
          }
          // If it doesn't, add the enemy to the room, remove the tiles used from the available pool, and return true
          this.entities.push(enemy);
          for (let xx = 0; xx < enemy.w; xx++) {
            for (let yy = 0; yy < enemy.h; yy++) {
              tiles = tiles.filter((t) => !(t.x === x + xx && t.y === y + yy));
            }
          }
          return true;
        };

        // Randomly select an enemy type from the table
        let type = Game.randTable(tables[d], Random.rand);

        switch (type) {
          case 1:
            CrabEnemy.add(this, this.game, x, y);
            break;
          case 2:
            FrogEnemy.add(this, this.game, x, y);
            break;
          case 3:
            ZombieEnemy.add(this, this.game, x, y);
            break;
          case 4:
            SkullEnemy.add(this, this.game, x, y);
            break;
          case 5:
            EnergyWizardEnemy.add(this, this.game, x, y);
            break;
          case 6:
            ChargeEnemy.add(this, this.game, x, y);
            break;
          case 7:
            RookEnemy.add(this, this.game, x, y);
            break;
          case 8:
            BishopEnemy.add(this, this.game, x, y);
            break;
          case 9:
            ArmoredzombieEnemy.add(this, this.game, x, y);
            break;
          case 10:
            if (addEnemy(new BigSkullEnemy(this, this.game, x, y))) {
              // clear out some space
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.roomArray[x + xx][y + yy] = new Floor(
                    this,
                    x + xx,
                    y + yy,
                  ); // remove any walls
                }
              }
            }
            break;
          case 11:
            QueenEnemy.add(this, this.game, x, y);
            break;
          case 12:
            KnightEnemy.add(this, this.game, x, y);
            break;
          case 13:
            if (addEnemy(new BigKnightEnemy(this, this.game, x, y))) {
              // clear out some space
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.roomArray[x + xx][y + yy] = new Floor(
                    this,
                    x + xx,
                    y + yy,
                  ); // remove any walls
                }
              }
            }
            break;
          case 14:
            ArmoredSkullEnemy.add(this, this.game, x, y);
            break;
          case 15:
            FireWizardEnemy.add(this, this.game, x, y);
            break;
        }
      }
    }
    let spawnerAmounts = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
      2, 2, 3, 3, 4, 5, 3,
    ];
    if (this.depth > 0) {
      let spawnerAmount = Game.randTable(spawnerAmounts, rand);
      //console.log(`Adding ${spawnerAmount} spawners`);
      this.addSpawners(spawnerAmount, rand);
    }
    let occultistAmounts = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    if (this.depth > 1) {
      let occultistAmount = Game.randTable(occultistAmounts, rand);
      //console.log(`Adding ${occultistAmount} occultists`);
      this.addOccultists(occultistAmount, rand);
    }
  }

  private addRandomEnemies() {
    let numEmptyTiles = this.getEmptyTiles().length;
    /*
    let numEnemies = Math.ceil(
      numEmptyTiles * Math.min(this.depth * 0.1 + 0.5, 0.15), //this.depth * 0.01 is starting value
    );
    */
    const factor = Math.min((this.depth + 2) * 0.05, 0.3);
    const numEnemies = Math.ceil(
      Math.max(
        Utils.randomNormalInt(0, numEmptyTiles * factor),
        numEmptyTiles * factor,
      ),
    );
    //if (numEnemies > numEmptyTiles / 2) numEnemies = numEmptyTiles / 2;
    this.addEnemies(numEnemies, Random.rand);
  }

  private addSpawners(numSpawners: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }
    for (let i = 0; i < numSpawners; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      let spawnTable = this.level.populator
        .getEnemyPoolForDepth(Math.max(0, this.depth - 1))
        .filter((t) => t !== 7);
      const spawner = Spawner.add(this, this.game, x, y, spawnTable);
      return spawner;
    }
  }
  private addOccultists(numOccultists: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }
    for (let i = 0; i < numOccultists; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      const occultist = OccultistEnemy.add(this, this.game, x, y);
      return occultist;
    }
  }

  private addBosses(depth: number) {
    if (GameplaySettings.NO_ENEMIES === true) return;
    let tiles = this.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }

    let bosses = ["reaper", "queen", "bigskullenemy", "bigzombieenemy"];
    if (depth > 0) {
      bosses.push("occultist");
      bosses.filter((b) => b !== "queen");
    }
    const boss = Game.randTable(bosses, Random.rand);

    const { x, y } = boss.startsWith("big")
      ? this.getBigRandomEmptyPosition(tiles)
      : this.getRandomEmptyPosition(tiles);

    switch (boss) {
      case "reaper":
        const spawner = this.addSpawners(1, Random.rand);
        spawner.dropTable = ["weapon", "equipment"];
        spawner.dropChance = 1;
        break;
      case "queen":
        const queen = QueenEnemy.add(this, this.game, x, y);
        queen.dropTable = ["weapon", "equipment"];
        queen.dropChance = 1;
        break;
      case "bigskullenemy":
        const bigSkull = BigSkullEnemy.add(this, this.game, x, y);
        bigSkull.dropTable = [
          "weapon",
          "equipment",
          "consumable",
          "gem",
          "tool",
        ];

        break;
      case "occultist":
        const occultist = this.addOccultists(1, Random.rand);
        occultist.dropTable = ["weapon", "equipment"];
        occultist.dropChance = 1;

        break;
      case "bigzombieenemy":
        const bigZombie = BigZombieEnemy.add(this, this.game, x, y);
        bigZombie.dropTable = [
          "weapon",
          "equipment",
          "consumable",
          "gem",
          "tool",
        ];
        bigZombie.dropChance = 1;
        break;
    }
  }
  //used for spawn commands, implement elsewhere later
  /**
   * Adds a new enemy to the room based on the provided enemy type string.
   *
   * @param enemyType - The string identifier for the enemy type.
   */
  addNewEnemy = (enemyType: EnemyType): void => {
    const EnemyClass = EnemyTypeMap[enemyType];
    if (!EnemyClass) {
      console.error(`Enemy type "${enemyType}" is not recognized.`);
      return;
    }

    const tiles = this.getEmptyTiles();
    if (!tiles || tiles.length === 0) {
      // console.log(`No tiles left to spawn enemies.`);
      return;
    }

    let position = this.getRandomEmptyPosition(tiles);
    if (!position) {
      return;
    }
    let { x, y } = position;

    if (enemyType === EnemyType.bigzombie) {
      position = this.getBigRandomEmptyPosition(tiles);
      if (!position) {
        return;
      }
      ({ x, y } = position);
    }

    EnemyClass.add(this, this.game, x, y);
  };

  addNewSpawner = (enemyType: EnemyType): void => {
    const EnemyClass = EnemyTypeMap[enemyType];
    if (!EnemyClass) {
      //console.error(`Enemy type "${enemyType}" is not recognized.`);
      return;
    }

    const tiles = this.getEmptyTiles();
    if (!tiles || tiles.length === 0) {
      // console.log(`No tiles left to spawn enemies.`);
      return;
    }

    const { x, y } = this.getRandomEmptyPosition(tiles);
    Spawner.add(this, this.game, x, y);
  };

  private addChests(numChests: number, rand: () => number) {
    // add chests
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numChests; i++) {
      const position = this.getRandomEmptyPosition(tiles);
      if (!position) {
        // No more empty tiles available, break out of loop
        break;
      }
      const { x, y } = position;
      this.entities.push(new Chest(this, this.game, x, y));
    }
  }

  addBombs(numBombs: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < this.getEmptyTiles().length; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      Bomb.add(this, this.game, x, y);
    }
  }

  private addResources(numResources: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numResources; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);

      let r = rand();
      if (r <= (10 - this.depth ** 3) / 10)
        CoalResource.add(this, this.game, x, y);
      else if (r <= (10 - (this.depth - 2) ** 3) / 10)
        GoldResource.add(this, this.game, x, y);
      else EmeraldResource.add(this, this.game, x, y);
    }
  }

  private addVendingMachine(
    rand: () => number,
    placeX?: number,
    placeY?: number,
    item?: Item,
  ) {
    if (this.height <= 2 || this.width <= 2) return;
    const pos = this.getRandomEmptyPosition(this.getEmptyTiles());

    let x = placeX ? placeX : pos.x;
    let y = placeY ? placeY : pos.y;

    let table =
      this.depth > 0
        ? [
            1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 3,
            4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7, 7,
          ]
        : [1, 1, 1];
    let type = Game.randTable(table, rand);
    if (item) {
      VendingMachine.add(this, this.game, x, y, item);
      return;
    }
    switch (type) {
      case 1:
        VendingMachine.add(this, this.game, x, y, new Heart(this, x, y));
        break;
      case 2:
        VendingMachine.add(this, this.game, x, y, new Candle(this, x, y));
        break;
      case 3:
        VendingMachine.add(this, this.game, x, y, new Armor(this, x, y));
        break;
      case 4:
        VendingMachine.add(this, this.game, x, y, new Spear(this, x, y));
        break;
      case 5:
        VendingMachine.add(this, this.game, x, y, new Torch(this, x, y));
        break;
      case 6:
        VendingMachine.add(this, this.game, x, y, new Backpack(this, x, y));
        break;
      case 7:
        VendingMachine.add(this, this.game, x, y, new Lantern(this, x, y));
        break;
      case 8:
        VendingMachine.add(this, this.game, x, y, new Coal(this, x, y));
        break;
    }
  }

  // #endregion

  // #region ENTERING / EXITING ROOM METHODS

  linkExitToStart = (startRoom?: Room) => {
    //if (this.type === RoomType.ROPEHOLE) return;
    if (!startRoom) startRoom = this.level.startRoom;
    if (
      this.addDoorWithOffset(
        startRoom.roomX + Math.floor(startRoom.width / 2) + 1,
        startRoom.roomY,
        startRoom,
        true,
      ) &&
      this.addDoorWithOffset(
        this.roomX + Math.floor(this.width / 2) - 1,
        this.roomY,
        this,
        true,
      )
    ) {
      startRoom.tunnelDoor.startRoom = true;
      this.tunnelDoor.linkedDoor = startRoom.tunnelDoor;
      startRoom.tunnelDoor.linkedDoor = this.tunnelDoor;
    }
  };

  exitLevel = () => {
    //this.game.onResize(); // stupid hack to keep fps high

    Game.shade_canvases = {};
    Game.text_rendering_canvases = {};

    for (let door of this.doors) {
      if (!door || !door.linkedDoor) continue;
      const ld = door.linkedDoor;
      if (!ld.lightSource) continue;
      if (!ld.room) continue;
      if (!ld.room.active && ld.room.entered) {
        ld.lightSource.b = 0;
        ld.lightSource.r = 0;
        // Update the linked room's lighting since we changed its door light
        ld.room.updateLighting();
      }
    }
    this.active = false;

    this.updateLighting();

    this.particles.splice(0, this.particles.length);
    this.disableFuseSounds();
  };

  disableFuseSounds = () => {
    for (const b of this.entities.filter((e) => e instanceof Bomb)) {
      //if (!bomb.soundPaused) {
      //bomb.soundPaused = true;
      const bomb = b as Bomb;
      Sound.stopSound(bomb.fuseSound);
      //}
    }
  };

  enableFuseSounds = () => {
    for (const b of this.entities.filter((e) => e instanceof Bomb)) {
      //if (!bomb.soundPaused) {
      //bomb.soundPaused = true;

      const bomb = b as Bomb;
      if (bomb.lit) {
        Sound.playWithReverb(bomb.fuseSound);
      }
    }
  };

  onEnterRoom = (player: Player) => {
    this.enableFuseSounds();
    for (let room of this.level.rooms) {
      room.roomOnScreen(player);
    }

    this.entered = true;

    this.clearDeadStuff();
    this.calculateWallInfo();
    this.resetDoorLightSources();

    this.particles = [];
    this.syncKeyPathParticles();

    this.alertEnemiesOnEntry();
    this.message = this.name;
    this.setReverb();
    this.active = true;
    player.map.saveMapData();

    //this.invalidateBlurCache(); // Invalidate cache when room becomes active

    this.updateLighting();
  };

  enterLevel = (player: Player, position?: { x: number; y: number }) => {
    this.game.updateLevel(this);

    const ladderUsed = this.game.transitioningLadder;

    // Prefer explicit entry position from ladder transition, then provided arg, then center
    let ladderEntry = (this as any).__entryPositionFromLadder as
      | { x: number; y: number }
      | undefined;
    const oxygenAnchor = ladderEntry ? { ...ladderEntry } : undefined;
    if (ladderEntry) {
      delete (this as any).__entryPositionFromLadder;
    }
    let roomCenter = ladderEntry || position || this.getRoomCenter();

    if (this.roomArray[roomCenter.x][roomCenter.y].isSolid()) {
      roomCenter = this.getRandomEmptyPosition(this.getEmptyTiles());
    }

    let x = roomCenter.x;
    let y = roomCenter.y;

    // If no explicit position given, choose the linked UpLadder for DownLadder transitions,
    // otherwise fall back to spawning on an unlocked DownLadder tile.
    if (!position && !ladderEntry) {
      let spawnAssigned = false;
      if (ladderUsed instanceof DownLadder) {
        const entryCoords =
          ladderUsed.entryUpLadderPos ?? this.findPrimaryUpLadderCoords();
        if (entryCoords) {
          x = entryCoords.x;
          y = entryCoords.y;
          spawnAssigned = true;
        }
      }

      if (!spawnAssigned) {
        for (let i = this.roomX; i < this.roomX + this.width; i++) {
          for (let j = this.roomY; j < this.roomY + this.height; j++) {
            const tile = this.roomArray[i]?.[j];
            if (tile instanceof DownLadder && !tile.lockable.isLocked()) {
              x = tile.x;
              y = tile.y;
              spawnAssigned = true;
              break;
            }
          }
          if (spawnAssigned) break;
        }
      }
    }

    player.moveSnap(x, y);
    const oxygenLine = player.getOxygenLine();
    const lineDropped = oxygenLine?.isDisconnectedFromPlayer() ?? false;

    if (!lineDropped) {
      player.anchorOxygenLineToPlayer(-Math.PI / 2);
    }
    this.onEnterRoom(player);
    this.playMusic();

    if (ladderUsed instanceof DownLadder) {
      if (this.underwater) {
        const anchorCoords = oxygenAnchor ?? this.findPrimaryUpLadderCoords();
        if (anchorCoords) {
          if (!lineDropped && !oxygenLine?.isAttached?.()) {
            player.attachOxygenLine(this, anchorCoords.x, anchorCoords.y, {
              kind: "upLadder",
              angle: Math.PI / 2,
            });
            player.anchorOxygenLineToPlayer(-Math.PI / 2);
          }
        } else if (!lineDropped) {
          player.detachOxygenLine();
        }
      } else if (!lineDropped) {
        player.detachOxygenLine();
      }
    } else if (
      !lineDropped &&
      (ladderUsed instanceof UpLadder || !this.underwater)
    ) {
      player.detachOxygenLine();
    }
    if (!lineDropped) {
      oxygenLine?.update(true);
    }
  };

  enterLevelThroughDoor = (player: Player, door: Door, side?: number) => {
    // console.log(door.linkedDoor.x, door.linkedDoor.y, door.x, door.y);
    if (door.doorDir === door.linkedDoor.doorDir) {
      door.opened = true;
      player.moveSnap(door.x, door.y + 1);
      setTimeout(() => {
        player.direction = Direction.DOWN;
      }, 150);
    }
    if (door instanceof Door && door.doorDir === Direction.UP) {
      //if top door
      door.opened = true;
      player.moveNoSmooth(door.x, door.y + 1);
    } else if (door instanceof Door && door.doorDir === Direction.DOWN) {
      //if bottom door
      player.moveNoSmooth(door.x, door.y - 1);
    } else if (
      door instanceof Door &&
      [Direction.RIGHT, Direction.LEFT].includes(door.doorDir)
    ) {
      // if side door
      player.moveNoSmooth(door.x + side, door.y);
    }
    this.onEnterRoom(player);
    const oxygenLine = player.getOxygenLine();
    const lineDropped = oxygenLine?.isDisconnectedFromPlayer() ?? false;
    if (!lineDropped) {
      player.anchorOxygenLineToPlayer(-Math.PI / 2);
      if (!this.underwater) {
        player.detachOxygenLine();
      }
      oxygenLine?.update(true);
    }
    this.updateOxygenLineBeams();
  };

  findPrimaryUpLadderCoords(): { x: number; y: number } | undefined {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        const tile = this.roomArray[x]?.[y];
        if (tile instanceof UpLadder) {
          return { x: tile.x, y: tile.y };
        }
      }
    }
    return undefined;
  }

  alertEnemiesOnEntry = () => {
    for (const e of this.entities) {
      if (e instanceof Enemy) e.lookForPlayer(false);
    }
  };

  // #endregion

  // #region LOGIC METHODS

  tick = (player: Player) => {
    const activeZ = player.z;
    this.updateLighting();
    player.updateSlowMotion();
    this.syncKeyPathParticles();

    this.lastEnemyCount = this.entities.filter(
      (e) => e instanceof Enemy && (e.z ?? 0) === activeZ,
    ).length;
    for (const h of this.hitwarnings) {
      if (this.isWithinEnemyInteractionRange(h.x, h.y)) h.tick();
    }
    for (const p of this.projectiles) {
      if (p.z !== activeZ) continue;
      p.tick();
    }

    this.clearDeadStuff();
    this.calculateWallInfo();

    this.entities = this.entities.filter((e) => !e.dead);

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.roomArray[x][y].tick();
      }
    }

    for (const e of this.entities) {
      if (e.z !== activeZ) continue;
      e.shouldSeeThrough();
    }

    this.turn = TurnState.computerTurn;

    this.playerTurnTime = Date.now();
    this.playerTicked = player;

    this.updateLighting();
    player.map.saveMapData();

    this.clearDeadStuff();
  };

  computerTurn = () => {
    const activeZ = (this.playerTicked as any)?.z ?? this.getActiveZ();
    // take computer turn
    for (const e of this.entities) {
      if (e.z !== activeZ) continue;
      if (e instanceof Enemy) {
        if (!this.isWithinEnemyInteractionRange(e.x, e.y)) continue;
      }
      e.tick();
    }

    this.entities = this.entities.filter((e) => !e.dead);

    for (const e of this.entities) {
      if (e.z !== activeZ) continue;
      if (e instanceof Enemy) {
        if (!this.isWithinEnemyInteractionRange(e.x, e.y)) continue;
        e.makeHitWarnings();
      }
    }

    for (const i of this.items) {
      if (i.z !== activeZ) continue;
      i.tick();
    }

    for (const p in this.game.players) {
      for (const i of this.game.players[p].inventory.items) {
        if (i) i.tick();
      }
    }

    for (const h of this.hitwarnings) {
      if (!this.isWithinEnemyInteractionRange(h.x, h.y)) continue;
      if (
        !this.roomArray[h.x] ||
        !this.roomArray[h.x][h.y] ||
        this.roomArray[h.x][h.y].isSolid()
      ) {
        h.dead = true;
      }
      h.removeOverlapping();
    }

    for (const p of this.projectiles) {
      if (p.z !== activeZ) continue;
      if (
        this.roomArray[p.x] &&
        this.roomArray[p.x][p.y] &&
        this.roomArray[p.x][p.y].isSolid()
      )
        p.dead = true;
      for (const i in this.game.players) {
        const pl = this.game.players[i];
        if (pl.z !== activeZ) continue;
        if (
          (this.game.players[i] as any).getRoom?.() === this &&
          p.x === this.game.players[i].x &&
          p.y === this.game.players[i].y
        ) {
          p.hitPlayer(this.game.players[i]);
        }
      }
      for (const e of this.entities) {
        if (e.z !== activeZ) continue;
        if (p.x === e.x && p.y === e.y) {
          p.hitEnemy(e);
        }
      }
    }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.roomArray[x][y].tickEnd();
      }
    }
    this.entities = this.entities.filter((e) => !e.dead); // enemies may be killed by spiketrap

    this.clearDeadStuff();

    this.playerTicked.finishTick();

    // After inventory ticks (keys update keyPathDots), sync key path particles

    this.checkForNoEnemies();
    //console.log(this.entities.filter((e) => e instanceof Enemy).length);

    this.turn = TurnState.playerTurn;
    this.updateLighting();
    for (const e of this.entities) {
      if (((e as any).z ?? 0) !== activeZ) continue;
      e.shouldSeeThrough();
    }
  };

  private getActiveZ(): number {
    try {
      const p = this.game?.players?.[this.game?.localPlayerID];
      return p?.z ?? 0;
    } catch {
      return 0;
    }
  }

  private isWithinEnemyInteractionRange(x: number, y: number): boolean {
    try {
      const range = GameplaySettings.MAXIMUM_ENEMY_INTERACTION_DISTANCE;
      const player = this.game.players[this.game.localPlayerID];
      if (!player) return true;
      const dx = x - player.x;
      const dy = y - player.y;
      return dx * dx + dy * dy <= range * range;
    } catch {
      return true;
    }
  }

  update = () => {
    if (this.turn == TurnState.computerTurn) {
      const delay = (this.game as any).replayManager?.isReplaying?.()
        ? GameConstants.REPLAY_COMPUTER_TURN_DELAY
        : LevelConstants.COMPUTER_TURN_DELAY;
      if (Date.now() - this.playerTurnTime >= delay) {
        this.computerTurn();
      }
    }
  };

  clearDeadStuff = () => {
    this.deadEntities = this.deadEntities.filter((e) => e && !e.dead);
    this.entities = this.entities.filter((e) => e && !e.dead);
    this.projectiles = this.projectiles.filter((p) => p && !p.dead);
    this.lightSources = this.lightSources.filter((ls) => ls && !ls.dead);
    this.hitwarnings = this.hitwarnings.filter((h) => h && !h.dead);
    this.particles = this.particles.filter((p) => p && !p.dead);
  };

  /**
   * Aligns KeyPathParticles with `this.keyPathDots`. Adds particles for any
   * positions missing a live particle and marks particles not on the path as dead.
   */
  syncKeyPathParticles = (activeKey?: Key, activePlayer?: Player) => {
    // Determine which key (if any) is the active one. Only one key may be active.
    let selectedKey: Key | null = null;
    let selectedPlayer: Player | null = null;

    if (activeKey && activePlayer) {
      selectedKey = activeKey;
      selectedPlayer = activePlayer;
    } else {
      // Fallback: find the first key with showPath=true on the current floor
      for (const p of Object.values(this.game.players)) {
        for (const i of p.inventory.items) {
          if (i instanceof Key && i.showPath) {
            if (i.depth === null) i.depth = p.depth;
            if (i.depth === p.depth) {
              selectedKey = i;
              selectedPlayer = p;
              break;
            }
          }
        }
        if (selectedKey) break;
      }
    }

    // If no active key on this floor, clear path particles and exit
    if (!selectedKey || !selectedPlayer) {
      let had = false;
      for (const p of this.particles) {
        if (p.constructor?.name === "KeyPathParticle") {
          p.dead = true;
          had = true;
        }
      }
      return;
    }

    // Update this room's path dots using only the selected key and player
    selectedKey.updatePathToDoor(selectedPlayer);

    const showPath = selectedKey.showPath === true;
    const path = this.keyPathDots as
      | Array<{ x: number; y: number }>
      | undefined;
    if (!path || path.length === 0 || !showPath) {
      // When no path, mark existing key-path particles as dead
      let had = false;
      for (const p of this.particles) {
        if (p.constructor?.name === "KeyPathParticle") {
          p.dead = true;
          had = true;
        }
      }
      return;
    }

    // Mark any existing KeyPathParticles not on the current path as dead
    const positions = new Set<string>((path || []).map((p) => `${p.x},${p.y}`));
    for (const p of this.particles) {
      if (p.constructor?.name === "KeyPathParticle") {
        const key = `${Math.floor(p.x)},${Math.floor(p.y + 0.25)}`; // reverse the y-offset used in ctor
        if (!positions.has(key)) {
          p.dead = true;
        }
      }
    }

    // Add particles for any path positions lacking one
    const hasParticleAt = (x: number, y: number): boolean => {
      if (!showPath) return false;
      for (const p of this.particles) {
        if (
          p.constructor?.name === "KeyPathParticle" &&
          Math.floor(p.x) === x &&
          Math.floor(p.y + 0.25) === y &&
          !p.dead
        )
          return true;
      }
      return false;
    };
    for (const pos of path) {
      if (!hasParticleAt(pos.x, pos.y)) {
        const particle =
          new (require("../particle/keyPathParticle").KeyPathParticle)(
            pos.x,
            pos.y,
          );
        particle.room = this;
        this.particles.push(particle);
        if (Math.random() < 0.1)
          console.log(
            `Room.syncKeyPathParticles: spawned at (${pos.x},${pos.y})`,
          );
      }
    }
  };

  catchUp = () => {
    if (this.turn === TurnState.computerTurn) this.computerTurn(); // player skipped computer's turn, catch up
  };

  tickHitWarnings = () => {
    for (const h of this.hitwarnings) {
      if (h.parent && (h.parent.dead || h.parent.unconscious)) {
        h.tick();
      }
    }
  };

  // #endregion

  // #region LIGHTING METHODS

  fadeLighting = (delta: number) => {
    const bufferTiles = 2;
    const { minX, maxX, minY, maxY } = this.getVisibleTileBounds(bufferTiles);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        let visDiff = this.softVis[x][y] - this.vis[x][y];
        let softVis = this.softVis[x][y];
        let flag = false;
        if (Math.abs(visDiff) > 0.01) flag = true;

        if (!flag) continue;

        visDiff *= 0.05 * delta;

        softVis -= visDiff;

        if (softVis < 0) softVis = 0;
        if (softVis > 1) softVis = 1;

        this.softVis[x][y] = softVis;

        // if (this.softVis[x][y] < 0.01) this.softVis[x][y] = 0;
      }
    }
  };

  fadeRgb = (delta: number) => {
    const bufferTiles = 2;
    const { minX, maxX, minY, maxY } = this.getVisibleTileBounds(bufferTiles);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const [softR, softG, softB] = this.softCol[x][y];
        const [targetR, targetG, targetB] = this.col[x][y];

        // Calculate differences
        let diffR = softR - targetR;
        let diffG = softG - targetG;
        let diffB = softB - targetB;

        let flagR = false;
        let flagG = false;
        let flagB = false;
        if (Math.abs(diffR) > 0.001) flagR = true;
        if (Math.abs(diffG) > 0.001) flagG = true;
        if (Math.abs(diffB) > 0.001) flagB = true;

        if (!flagR && !flagG && !flagB) {
          continue;
        }

        // Apply smoothing similar to fadeLighting
        if (flagR) {
          diffR *= 0.05 * delta;
          this.softCol[x][y][0] = this.clamp(Math.round(softR - diffR), 0, 255);
        }
        if (flagG) {
          diffG *= 0.05 * delta;
          this.softCol[x][y][1] = this.clamp(Math.round(softG - diffG), 0, 255);
        }
        if (flagB) {
          diffB *= 0.05 * delta;
          this.softCol[x][y][2] = this.clamp(Math.round(softB - diffB), 0, 255);
        }
      }
    }
  };

  resetDoorLightSources = () => {
    this.doors.forEach((d) => {
      if (d && d.lightSource) d.lightSource.r = 0;
      if (d && d.linkedDoor && d.linkedDoor.lightSource)
        d.linkedDoor.lightSource.r = 0;
    });
  };

  tileValuesToLightSource = (x: number, y: number, room: Room) => {
    if (!room.roomArray[x]) return null;
    if (!room.roomArray[x][y]) return null;
    const color = room.col[x][y];
    const brightness = (1 - room.vis[x][y]) / 4;
    const radius = 9;
    return { color, brightness, radius };
  };

  updateDoorLightSources = () => {
    //works from inactive rooms onto their connected rooms
    if (!this.active) return;

    const directionOffsets = {
      [Direction.UP]: { x: 0, y: -1 },
      [Direction.DOWN]: { x: 0, y: 1 },
      [Direction.LEFT]: { x: 1, y: 0 },
      [Direction.RIGHT]: { x: -1, y: 0 },
    };
    let linkedDoors: Door[] = [];
    this.doors.forEach((d) => {
      if (
        d.linkedDoor &&
        d.room.entered &&
        this.isTileOnScreen(
          d.linkedDoor.x,
          d.linkedDoor.y,
          LevelConstants.LIGHTING_MAX_DISTANCE,
        )
      )
        linkedDoors.push(d.linkedDoor);
    });

    this.doors.forEach((d) => {
      d.lightSource.b = 0.1;
    });

    for (const d of linkedDoors) {
      const srcDoor = d.linkedDoor; // door on this room's side
      const dirOff = directionOffsets[srcDoor.doorDir] || { x: 0, y: 0 };
      // Sample one tile inside this room from the door, i.e., opposite of door facing
      const sampleX = srcDoor.x - dirOff.x;
      const sampleY = srcDoor.y - dirOff.y;

      let vals = this.tileValuesToLightSource(sampleX, sampleY, this);
      if (!vals)
        vals = this.tileValuesToLightSource(srcDoor.x, srcDoor.y, this);
      if (vals) {
        d.lightSource.c = vals.color;
        d.lightSource.b = vals.brightness;
        d.lightSource.r = LevelConstants.LIGHTING_MAX_DISTANCE;
      }
    }

    let connectedRooms: Set<Room> = new Set(
      this.doors
        .filter((d) => d && d.linkedDoor) // Ensure door and linkedDoor exist
        .map((d) => d.linkedDoor.room)
        .filter((r) => r), // Ensure room exists
    );

    // Update connected rooms once to propagate door light without infinite recursion
    for (const r of Array.from(connectedRooms)) {
      if (r.entered && !r.isUpdatingLighting) r.updateLighting();
    }
  };

  setLightingAngleStep = () => {
    if (!this.active) return;
    // Estimate total tiles we will compute for lighting this frame
    const roomTiles = this.width * this.height;

    // Count players currently in this room
    const activeZ = this.getActiveZ();
    const playersInRoom = Object.values(this.game.players || {}).filter(
      (p) => p?.getRoom?.() === this && (p?.z ?? 0) === activeZ,
    ).length;

    // Rays per emitter at the current angular resolution
    const raysPerEmitter = Math.ceil(360 / LevelConstants.LIGHTING_ANGLE_STEP);

    // Estimate steps per ray by summing radii of lights (capped) and players
    let totalRayDistance = 0;
    for (const ls of this.lightSources) {
      totalRayDistance += Math.min(ls.r, LevelConstants.LIGHTING_MAX_DISTANCE);
    }
    totalRayDistance += playersInRoom * LevelConstants.LIGHTING_MAX_DISTANCE;

    // Total tiles touched by rays plus per-tile blending work
    const estimatedRayTiles = totalRayDistance * raysPerEmitter;
    const tilesToCompute = roomTiles + estimatedRayTiles;

    // Store for diagnostics/dynamic tuning usage
    this.estimatedLightingTiles = tilesToCompute;

    //console.log(
    //  `Estimated lighting tiles: ${this.estimatedLightingTiles} (room: ${roomTiles}, rays: ${estimatedRayTiles}, players: ${playersInRoom})`,
    //);
  };

  updateLighting = (source?: { x: number; y: number }) => {
    if (!this.onScreen) return;
    // If a specific source is provided, skip lighting update if it's off-screen with buffer
    if (source) {
      const buffer = LevelConstants.LIGHTING_MAX_DISTANCE;
      if (!this.isTileOnScreen(source.x, source.y, buffer)) return;
    }
    if (this.isUpdatingLighting) return;
    this.isUpdatingLighting = true;
    const activeZ = this.getActiveZ();

    // Invalidate cache when lighting is updated
    this.invalidateBlurCache();

    // Start timing the initial setup
    //console.time("updateLighting: Initial Setup");
    this.updateDoorLightSources();

    let oldVis = [];
    let oldCol = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      oldVis[x] = [];
      oldCol[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        oldVis[x][y] = this.vis[x][y];
        oldCol[x][y] = this.col[x][y];

        this.vis[x][y] = 1;
        this.col[x][y] = [1, 1, 1];
        this.renderBuffer[x][y] = [];
      }
    }
    // End timing the initial setup
    //console.timeEnd("updateLighting: Initial Setup");

    // Start timing the processing of light sources
    //console.time("updateLighting: Process LightSources");
    // Prune orphaned light sources. Allow a small neighborhood check so
    // lights slightly offset from their owning tile (e.g., bottom-wall torches)
    // are not removed incorrectly.
    try {
      this.lightSources = this.lightSources.filter((ls) => {
        const lx = Math.floor(ls.x);
        const ly = Math.floor(ls.y);
        // quick in-bounds check
        if (
          lx < this.roomX - 1 ||
          lx > this.roomX + this.width ||
          ly < this.roomY - 1 ||
          ly > this.roomY + this.height
        )
          return false;

        // keep if any nearby tile exists
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (this.roomArray[lx + dx]?.[ly + dy]) return true;
          }
        }
        return false;
      });
    } catch {}

    // Build per-frame opaque entity set for fast membership when ENEMIES_BLOCK_LIGHT
    if (GameConstants.ENEMIES_BLOCK_LIGHT) {
      const set = new Set<string>();
      for (const e of this.entities) {
        // Z: entities block light regardless of the light source's z-layer.
        // Lighting is still computed per active-z for tiles/players, but occluders apply across layers.
        if ((e as any).opaque && this.isTileOnScreen(e.x, e.y, 7)) {
          const w = Math.max(1, (e as any).w || 1);
          const h = Math.max(1, (e as any).h || 1);
          for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
              set.add(`${e.x + dx},${e.y + dy}`);
            }
          }
        }
      }
      this.opaqueEntityPositions = set;
    } else {
      this.opaqueEntityPositions = undefined;
    }

    for (const l of this.lightSources) {
      if (l.shouldUpdate()) {
        for (let i = 0; i < 360; i += LevelConstants.LIGHTING_ANGLE_STEP) {
          this.castTintAtAngle(
            i,
            l.x,
            l.y,
            l.r,
            l.c,
            l.b * LevelConstants.LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION,
            l.falloffDecay,
          ); // RGB color in sRGB
        }
      }
    }
    //console.timeEnd("updateLighting: Process LightSources");
    //console.time("updateLighting: Process Players");
    this.setLightingAngleStep();

    let lightingAngleStep = LevelConstants.LIGHTING_ANGLE_STEP;

    for (const p in this.game.players) {
      let player = this.game.players[p];
      if ((player as any).getRoom?.() === this) {
        if ((player?.z ?? 0) !== activeZ) continue;
        let lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;
        let lightBrightness = 5;
        if (player.lightEquipped) {
          lightColor = player.lightColor;
          lightBrightness = player.lightBrightness;
        }

        const playerFov = this.getPlayerLightingFov(player);
        const facingAngle =
          playerFov < GameConstants.DEFAULT_LIGHTING_FOV_DEGREES
            ? this.getPlayerFacingAngle(player)
            : null;

        if (
          playerFov < GameConstants.DEFAULT_LIGHTING_FOV_DEGREES &&
          facingAngle !== null
        ) {
          this.castDirectionalPlayerLight(
            player,
            facingAngle,
            playerFov,
            lightingAngleStep,
            lightColor,
            lightBrightness,
            player.lightFalloffDecay,
          );
        } else {
          for (let i = 0; i < 360; i += lightingAngleStep) {
            this.castTintAtAngle(
              i,
              player.x + 0.5,
              player.y + 0.5,
              LevelConstants.LIGHTING_MAX_DISTANCE,
              lightColor,
              lightBrightness *
                LevelConstants.LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION,
              player.lightFalloffDecay,
            );
          }
        }
      }
    }
    // End timing the processing of player lighting
    //console.timeEnd("updateLighting: Process Players");

    // Start timing the blending of colors
    //console.time("updateLighting: Blend Colors Array");
    const roomX = this.roomX;
    const roomY = this.roomY;
    const width = this.width;
    const height = this.height;
    const renderBuffer = this.renderBuffer;

    for (let x = roomX; x < roomX + width; x++) {
      for (let y = roomY; y < roomY + height; y++) {
        this.col[x][y] = this.blendColorsArray(renderBuffer[x][y]);
      }
    }
    // End timing the blending of colors
    //console.timeEnd("updateLighting: Blend Colors Array");

    // Start timing the conversion to luminance
    //console.time("updateLighting: Convert to Luminance");
    for (let x = roomX; x < roomX + width; x++) {
      for (let y = roomY; y < roomY + height; y++) {
        this.vis[x][y] = this.rgbToLuminance(this.col[x][y]);
      }
    }
    // End timing the conversion to luminance
    //console.timeEnd("updateLighting: Convert to Luminance");
    this.updateDoorLightSources();
    // Bump lighting update version so blur cache can detect changes
    this.lastLightingUpdate++;
    this.isUpdatingLighting = false;
  };

  private castDirectionalPlayerLight = (
    player: Player,
    facingAngle: number,
    fovDegrees: number,
    angleStep: number,
    lightColor: [number, number, number],
    lightBrightness: number,
    falloffDecay: number,
  ) => {
    const originX = player.x + 0.5;
    const originY = player.y + 0.5;
    const halfFov = fovDegrees / 2;
    const span = Math.max(fovDegrees, angleStep);

    for (let offset = 0; offset <= span; offset += angleStep) {
      const angle = this.normalizeDegrees(facingAngle - halfFov + offset);
      this.castTintAtAngle(
        angle,
        originX,
        originY,
        LevelConstants.LIGHTING_MAX_DISTANCE,
        lightColor,
        lightBrightness * LevelConstants.LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION,
        falloffDecay,
      );
    }
  };

  private getPlayerLightingFov = (player: Player): number => {
    if (
      GameConstants.NARROWED_LIGHTING_FOV &&
      this.underwater &&
      !player.dead
    ) {
      return GameConstants.UNDERWATER_LIGHTING_FOV_DEGREES;
    }
    // Use equipped light's FOV when available, otherwise default
    if (player.lightEquipped && typeof player.lightFov === "number") {
      return player.lightFov;
    }
    return GameConstants.DEFAULT_LIGHTING_FOV_DEGREES;
  };

  private getPlayerFacingAngle = (player: Player): number | null => {
    const mouseAngle = this.getMouseFacingAngle(player);
    if (mouseAngle !== null) return mouseAngle;
    return this.directionToDegrees(player.direction);
  };

  private getMouseFacingAngle = (player: Player): number | null => {
    const inputHandler = player.inputHandler;
    if (
      !inputHandler ||
      inputHandler.mostRecentMoveInput !== "mouse" ||
      GameConstants.isMobile ||
      !GameConstants.MOVE_WITH_MOUSE
    ) {
      return null;
    }

    const angleDegrees = this.normalizeDegrees(
      (inputHandler.mouseAngle() * 180) / Math.PI,
    );
    const octant = this.getOctantFromAngle(angleDegrees);
    return octant * 45;
  };

  private directionToDegrees = (direction?: Direction): number | null => {
    switch (direction) {
      case Direction.RIGHT:
        return 0;
      case Direction.DOWN_RIGHT:
        return 45;
      case Direction.DOWN:
        return 90;
      case Direction.DOWN_LEFT:
        return 135;
      case Direction.LEFT:
        return 180;
      case Direction.UP_LEFT:
        return 225;
      case Direction.UP:
        return 270;
      case Direction.UP_RIGHT:
        return 315;
      default:
        return null;
    }
  };

  private getOctantFromAngle = (angle: number): number => {
    const normalized = this.normalizeDegrees(angle);
    return Math.floor((normalized + 22.5) / 45) % 8;
  };

  private normalizeDegrees = (angle: number): number => {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  updateLightSources = (lightSource?: LightSource, remove?: boolean) => {
    if (
      lightSource &&
      this.isTileOnScreen(
        lightSource.x,
        lightSource.y,
        LevelConstants.LIGHTING_MAX_DISTANCE,
      ) === false
    )
      return;

    this.oldCol = [];
    this.oldVis = [];
    this.oldCol = this.col;
    this.oldVis = this.vis;
    if (lightSource) {
      for (let i = 0; i < 360; i += LevelConstants.LIGHTING_ANGLE_STEP) {
        if (!remove) {
          this.castTintAtAngle(
            i,
            lightSource.x,
            lightSource.y,
            lightSource.r,
            lightSource.c,
            lightSource.b *
              LevelConstants.LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION,
            lightSource.falloffDecay,
          ); // RGB color in sRGB
        } else {
          this.unCastTintAtAngle(
            i,
            lightSource.x,
            lightSource.y,
            lightSource.r,
            lightSource.c,
            lightSource.b *
              LevelConstants.LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION,
            lightSource.falloffDecay,
          );
        }
      }
    }
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.col[x][y] = this.blendColorsArray(this.renderBuffer[x][y]);
      }
    }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.vis[x][y] = this.rgbToLuminance(this.col[x][y]);
      }
    }
  };

  revertLightSources = () => {
    //console.log("reverting lighting");
    this.oldCol = [];
    this.oldVis = [];
    this.col = this.oldCol;
    this.vis = this.oldVis;
  };

  /**
   * Casts or uncategorizes a tint from a light source at a specific angle.
   *
   * @param angle - The angle in degrees at which to cast or uncast the tint.
   * @param px - The x-coordinate of the light source.
   * @param py - The y-coordinate of the light source.
   * @param radius - The radius of the light's influence.
   * @param color - The RGB color tuple representing the tint.
   * @param brightness - The brightness of the light source.
   * @param action - 'cast' to add tint, 'unCast' to remove tint.
   */
  private processTintAtAngle = (
    angle: number,
    px: number,
    py: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
    falloffDecay: number = 1,
    action: "cast" | "unCast" = "cast",
  ) => {
    const dx = Math.cos((angle * Math.PI) / 180);
    const dy = Math.sin((angle * Math.PI) / 180);
    // Lighting is currently computed for the local active z-layer only.
    const activeZ = this.getActiveZ();

    // Convert input color from sRGB to linear RGB
    const linearColor: [number, number, number] = [
      this.sRGBToLinear(color[0]),
      this.sRGBToLinear(color[1]),
      this.sRGBToLinear(color[2]),
    ];

    for (
      let i = 0;
      i <= Math.min(LevelConstants.LIGHTING_MAX_DISTANCE, radius);
      i++
    ) {
      const currentX = Math.floor(px + dx * i);
      const currentY = Math.floor(py + dy * i);

      if (!this.isPositionInRoom(currentX, currentY)) return; // Outside the room

      // Z-aware tile lookup for lighting blockers:
      // - Default: tiles are shared across layers
      // - Z_DEBUG_MODE: use the z=1 override tile map (Floor/Air) when activeZ === 1
      let tile = this.roomArray[currentX][currentY];
      if (GameConstants.Z_DEBUG_MODE && activeZ === 1 && this.zDebugZ1Tiles) {
        const override = this.zDebugZ1Tiles.get(this.zKey(currentX, currentY));
        if (override) tile = override;
      }

      // Handle i=0 separately to ensure correct intensity
      let intensity: number;
      // Exponential falloff with origin boost preserved
      if (i === 0) {
        intensity = brightness * 0.1;
      } else {
        intensity = brightness * Math.exp(-falloffDecay * (i - 0.25));
      }
      if (intensity < 0.005) intensity = 0;

      if (intensity <= 0) continue;

      if (!this.renderBuffer[currentX]) {
        this.renderBuffer[currentX] = [];
      }
      if (!this.renderBuffer[currentX][currentY]) {
        this.renderBuffer[currentX][currentY] = [];
      }

      // Inner walls block light explicitly and terminate the ray
      if (tile instanceof Wall && tile.isInnerWall()) {
        const weightedLinearColor: [number, number, number, number] = [
          linearColor[0],
          linearColor[1],
          linearColor[2],
          intensity,
        ];

        if (action === "cast") {
          this.renderBuffer[currentX][currentY].push(weightedLinearColor);
        } else if (action === "unCast") {
          this.renderBuffer[currentX][currentY] = this.renderBuffer[currentX][
            currentY
          ].filter(
            (colorEntry) =>
              !(
                Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
                Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
                Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
                Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
              ),
          );
        }
        return; // Terminate after processing the opaque wall
      }

      if (GameConstants.ENEMIES_BLOCK_LIGHT && this.opaqueEntityPositions) {
        // O(1) membership check instead of scanning entities
        if (this.opaqueEntityPositions.has(`${currentX},${currentY}`)) {
          //intensity = intensity * (1 - entity.opacity);
          // Set the intensity for this tile and then terminate to create shadow effect
          const weightedLinearColor: [number, number, number, number] = [
            linearColor[0],
            linearColor[1],
            linearColor[2],
            intensity,
          ];

          if (action === "cast") {
            this.renderBuffer[currentX][currentY].push(weightedLinearColor);
          } else if (action === "unCast") {
            this.renderBuffer[currentX][currentY] = this.renderBuffer[currentX][
              currentY
            ].filter(
              (colorEntry) =>
                !(
                  Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
                  Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
                  Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
                  Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
                ),
            );
          }
          return; // Terminate after processing the opaque entity
        }
      }
      //end processing opaque entities

      const weightedLinearColor: [number, number, number, number] = [
        linearColor[0],
        linearColor[1],
        linearColor[2],
        intensity,
      ];

      if (action === "cast") {
        this.renderBuffer[currentX][currentY].push(weightedLinearColor);
      } else if (action === "unCast") {
        this.renderBuffer[currentX][currentY] = this.renderBuffer[currentX][
          currentY
        ].filter(
          (colorEntry) =>
            !(
              Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
              Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
              Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
              Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
            ),
        );
      }
    }
  };

  /**
   * Applies Gaussian blur to the specified offscreen canvas.
   *
   * @param {HTMLCanvasElement} canvas - The offscreen canvas to blur.
   * @param {number} radius - The radius of the blur.
   */
  applyGaussianBlur(canvas: HTMLCanvasElement, radius: number): void {
    //DEPRECATED
    //const StackBlur = require("stackblur-canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context for Gaussian blur.");
    }

    // Get the image data from the canvas
    const width = canvas.width;
    const height = canvas.height;
    //const imageData = ctx.getImageData(0, 0, width, height);
    let r = radius;
    if (!GameConstants.BLUR_ENABLED) r = 0;
    // Apply StackBlur
    //StackBlur.canvasRGBA(canvas, 0, 0, width, height, Math.floor(r / 2));
  }

  /**
   * Casts a tint from a light source at a specific angle.
   *
   * @param angle - The angle in degrees at which to cast the tint.
   * @param px - The x-coordinate of the light source.
   * @param py - The y-coordinate of the light source.
   * @param radius - The radius of the light's influence.
   * @param color - The RGB color tuple representing the tint.
   * @param brightness - The brightness of the light source.
   */
  castTintAtAngle = (
    angle: number,
    px: number,
    py: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
    falloffDecay: number = 1,
  ) => {
    this.processTintAtAngle(
      angle,
      px,
      py,
      radius,
      color,
      brightness / 3,
      falloffDecay,
      "cast",
    );
  };

  /**
   * Uncasts a tint from a light source at a specific angle.
   *
   * @param angle - The angle in degrees at which to uncast the tint.
   * @param px - The x-coordinate of the light source.
   * @param py - The y-coordinate of the light source.
   * @param radius - The radius of the light's influence.
   * @param color - The RGB color tuple representing the tint.
   * @param brightness - The brightness of the light source.
   */
  unCastTintAtAngle = (
    angle: number,
    px: number,
    py: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
    falloffDecay: number = 1,
  ) => {
    this.processTintAtAngle(
      angle,
      px,
      py,
      radius,
      color,
      brightness / 3, // added this
      falloffDecay,
      "unCast",
    );
  };

  private sRGBToLinear = (value: number): number => {
    const normalized = value / 255;
    if (normalized <= 0.04045) {
      return normalized / 12.92;
    } else {
      return Math.pow((normalized + 0.055) / 1.055, 2.2);
    }
  };

  private linearToSRGB = (value: number): number => {
    if (value <= 0.0031308) {
      return Math.round(12.92 * value * 255);
    } else {
      return Math.round(
        (1.055 * Math.pow(value, 1 / 2.2 /*gamma*/) - 0.055) * 255,
      );
    }
  };

  clamp = (value: number, min: number = 0, max: number = 1): number => {
    return Math.min(Math.max(value, min), max);
  };

  /**
   * Blends an array of RGB colors into a single color without excessive darkness or clipping to white.
   *
   * @param colors - An array of RGB tuples to blend.
   * @returns A single RGB tuple representing the blended color.
   */
  private blendColorsArray = (
    colors: [red: number, green: number, blue: number, alpha: number][],
  ): [red: number, green: number, blue: number] => {
    if (colors.length === 0) return [0, 0, 0];

    // Sum all color channels in linear RGB
    const sum = colors.reduce(
      (accumulator, color) => [
        accumulator[0] + color[0] * color[3],
        accumulator[1] + color[1] * color[3],
        accumulator[2] + color[2] * color[3],
      ],
      [0, 0, 0],
    );

    // Apply scaling factor to manage overall brightness
    const scalingFactor = 0.45 * 2.5; // Adjust as needed
    const scaledSum = [
      sum[0] * scalingFactor,
      sum[1] * scalingFactor,
      sum[2] * scalingFactor,
    ];

    // Clamp each channel to [0, 1] to prevent overflow
    const clampedSum: [number, number, number] = [
      this.clamp(scaledSum[0], 0, 1),
      this.clamp(scaledSum[1], 0, 1),
      this.clamp(scaledSum[2], 0, 1),
    ];
    // Convert back to sRGB
    return [
      this.linearToSRGB(clampedSum[0]),
      this.linearToSRGB(clampedSum[1]),
      this.linearToSRGB(clampedSum[2]),
    ];
  };

  rgbToLuminance = (color: [number, number, number]): number => {
    //map to 1-0 range
    return 1 - (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
  };

  draw = (delta: number) => {
    if (!this.onScreen) return;

    if (this.active) {
      HitWarning.updateFrame(delta);
      this.drawInterval = 4;
    } else if (!this.active) {
      this.drawInterval = 8;
    }

    this.drawTimestamp += delta;

    if (this.drawTimestamp - this.lastDraw >= this.drawInterval) {
      this.fadeRgb(delta + this.drawInterval);
      this.fadeLighting(delta + this.drawInterval);
      this.lastDraw = this.drawTimestamp;
    }
  };
  // added a multiplier to the input rgb values to avoid clipping to white
  drawColorLayer = () => {
    if (!this.onScreen) return;

    Game.ctx.save();
    // Clear the offscreen color canvas
    this.colorOffscreenCtx.clearRect(
      0,
      0,
      this.colorOffscreenCanvas.width,
      this.colorOffscreenCanvas.height,
    );

    let lastFillStyle = "";
    // Match original shade layer positioning using the blur offsets
    const offsetX = this.blurOffsetX;
    const offsetY = this.blurOffsetY;

    // Draw only on-screen tiles (with a buffer) into the offscreen color canvas
    const bufferTiles = 3;
    const { minX, maxX, minY, maxY } = this.getVisibleTileBounds(bufferTiles);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const [r, g, b] = this.softCol[x][y];
        if (r === 0 && g === 0 && b === 0) continue; // Skip if no color

        const fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;

        if (fillStyle !== lastFillStyle) {
          this.colorOffscreenCtx.fillStyle = fillStyle;
          lastFillStyle = fillStyle;
        }

        this.colorOffscreenCtx.fillRect(
          (x - this.roomX + offsetX) * GameConstants.TILESIZE,
          (y - this.roomY + offsetY) * GameConstants.TILESIZE,
          GameConstants.TILESIZE,
          GameConstants.TILESIZE,
        );
      }
    }

    // Choose blur method based on setting
    if (GameConstants.USE_WEBGL_BLUR) {
      // Use WebGL blur with caching
      const blurRenderer = WebGLBlurRenderer.getInstance();

      // Check if we can use cached results
      if (
        this.shouldUseBlurCache() &&
        this.blurCache.color6px &&
        this.blurCache.color12px
      ) {
        // Use cached blurred results
        Game.ctx.globalCompositeOperation = "soft-light";
        Game.ctx.globalAlpha = 0.6;
        Game.ctx.drawImage(
          this.blurCache.color6px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );

        Game.ctx.globalCompositeOperation = "lighten";
        Game.ctx.globalAlpha = 0.05;
        Game.ctx.drawImage(
          this.blurCache.color12px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );
      } else {
        // Generate new blur and cache if inactive
        Game.ctx.globalCompositeOperation = "soft-light";
        Game.ctx.globalAlpha = 0.6;

        // Apply 6px blur using WebGL
        const blurred8px = blurRenderer.applyBlur(this.colorOffscreenCanvas, 8);
        Game.ctx.drawImage(
          blurred8px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );

        // Cache the result if room is inactive
        if (!this.active) {
          this.cacheBlurResult("color8px", blurred8px);
        }

        Game.ctx.globalCompositeOperation = "lighten";
        Game.ctx.globalAlpha = 0.05;

        // Apply 12px blur using WebGL
        const blurred12px = blurRenderer.applyBlur(
          this.colorOffscreenCanvas,
          12,
        );
        Game.ctx.drawImage(
          blurred12px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );

        // Cache the result if room is inactive
        if (!this.active) {
          this.cacheBlurResult("color12px", blurred12px);
        }
      }
    } else {
      // Use Canvas2D blur (fallback) - matching original settings
      Game.ctx.globalCompositeOperation =
        GameConstants.COLOR_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation;
      Game.ctx.globalAlpha = 0.6;

      if (GameConstants.ctxBlurEnabled) {
        Game.ctx.filter = "blur(6px)";
      }

      Game.ctx.drawImage(
        this.colorOffscreenCanvas,
        (this.roomX - offsetX) * GameConstants.TILESIZE,
        (this.roomY - offsetY) * GameConstants.TILESIZE,
      );

      // Draw slight haze
      Game.ctx.globalCompositeOperation = "lighten";
      Game.ctx.globalAlpha = 0.05;

      if (GameConstants.ctxBlurEnabled) {
        Game.ctx.filter = "blur(12px)";
      }

      Game.ctx.drawImage(
        this.colorOffscreenCanvas,
        (this.roomX - offsetX) * GameConstants.TILESIZE,
        (this.roomY - offsetY) * GameConstants.TILESIZE,
      );

      Game.ctx.filter = "none";
    }

    this.colorOffscreenCtx.clearRect(
      0,
      0,
      this.colorOffscreenCanvas.width,
      this.colorOffscreenCanvas.height,
    );

    Game.ctx.restore();
  };

  drawShadeLayer = () => {
    if (GameConstants.isIOS || !GameConstants.SHADE_ENABLED) return;
    if (GameConstants.SHADE_INLINE_IN_ENTITY_LAYER) return; // handled inline in drawEntities
    if (!this.onScreen) return;
    if (GameConstants.SHADING_DISABLED) return;

    Game.ctx.save();

    Game.ctx.globalCompositeOperation =
      GameConstants.SHADE_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation;

    // Clear the offscreen shade canvas
    this.shadeOffscreenCtx.clearRect(
      0,
      0,
      this.shadeOffscreenCanvas.width,
      this.shadeOffscreenCanvas.height,
    );

    const offsetX = this.shadeSliceBorderTiles;
    const offsetY = this.shadeSliceBorderTiles;

    let lastFillStyle = "";

    // Draw only tiles on-screen (with a larger buffer for blur spill) into the offscreen shade canvas
    const shadeBufferTiles = 4;
    for (let x = this.roomX - 2; x < this.roomX + this.width + 4; x++) {
      for (let y = this.roomY - 2; y < this.roomY + this.height + 4; y++) {
        if (!this.isTileOnScreen(x, y, shadeBufferTiles)) continue;
        const tile = this.roomArray[x]?.[y];
        //if (!tile) return;

        let alpha =
          this.softVis[x] && this.softVis[x][y] ? this.softVis[x][y] : 0;
        if (tile instanceof WallTorch) continue;
        let factor = !GameConstants.SMOOTH_LIGHTING ? 2 : 2;
        let smoothFactor = !GameConstants.SMOOTH_LIGHTING ? 0 : 1;
        let computedAlpha = alpha ** factor * smoothFactor;

        let fillX = x;
        let fillY = y;
        let fillWidth = 1;
        let fillHeight = 1;
        if (tile instanceof Wall) {
          const wall = tile as Wall;
          if (!this.innerWalls.includes(wall)) {
            switch (wall.direction) {
              case Direction.UP:
                fillY = y - 0.5;
                fillHeight = 0.5;
                break;
              case Direction.DOWN:
                fillY = y - 0.5;
                fillHeight = 1.5;
                break;
              case Direction.LEFT:
                fillX = x + 0.25;
                fillWidth = 0.75;
                break;
              case Direction.RIGHT:
                fillX = x;
                fillWidth = 0.75;
                break;
              case Direction.DOWN_LEFT:
                fillX = x + 0.25;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 1.5;
                break;
              case Direction.DOWN_RIGHT:
                fillX = x;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 1.5;
                break;
              case Direction.UP_LEFT:
                fillX = x + 0.25;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 0.5;
                break;
              case Direction.UP_RIGHT:
                fillX = x - 0.5;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 0.5;
                break;
            }
          }
        } else if (tile instanceof Door) {
          const door = tile as Door;
          if (door.opened === true) computedAlpha = computedAlpha / 2;
          switch (door.doorDir) {
            case Direction.UP:
              fillY = y - 0.5;
              fillHeight = 1.5;
              break;
            case Direction.DOWN:
              fillY = y - 0.5;
              fillHeight = 1.5;
              break;
            case Direction.RIGHT:
              fillX = x - 0.5;
              fillY = y - 1.25;
              fillWidth = 1.5;
              fillHeight = 2;
              break;
            case Direction.LEFT:
              fillX = x;
              fillY = y - 1.25;
              fillWidth = 1.5;
              fillHeight = 2;
              break;
          }
        }
        const alphaMultiplier = !GameConstants.SMOOTH_LIGHTING ? 0.5 : 1.25;

        const fillStyle = `rgba(0, 0, 0, ${computedAlpha * alphaMultiplier})`;

        if (fillStyle !== lastFillStyle) {
          this.shadeOffscreenCtx.fillStyle = fillStyle;
          lastFillStyle = fillStyle;
        }

        this.shadeOffscreenCtx.fillRect(
          (fillX - this.roomX + offsetX) * GameConstants.TILESIZE,
          (fillY - this.roomY + offsetY) * GameConstants.TILESIZE,
          fillWidth * GameConstants.TILESIZE,
          fillHeight * GameConstants.TILESIZE,
        );
      }
    }

    // Choose blur method based on setting
    if (GameConstants.USE_WEBGL_BLUR) {
      // Use WebGL blur with caching
      const blurRenderer = WebGLBlurRenderer.getInstance();

      // Check if we can use cached results
      if (this.shouldUseBlurCache() && this.blurCache.shade5px) {
        // Use cached blurred result
        Game.ctx.globalAlpha = 1;
        Game.ctx.drawImage(
          this.blurCache.shade5px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );
      } else {
        // Generate new blur and cache if inactive
        Game.ctx.globalAlpha = 1;

        // Apply 5px blur using WebGL
        const blurred5px = blurRenderer.applyBlur(this.shadeOffscreenCanvas, 5);
        Game.ctx.drawImage(
          blurred5px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );

        // Cache the result if room is inactive
        if (!this.active) {
          this.cacheBlurResult("shade5px", blurred5px);
        }
      }
    } else {
      // Use Canvas2D blur (fallback) - matching original settings
      Game.ctx.globalAlpha = 1;

      const blurAmount = !GameConstants.SMOOTH_LIGHTING ? 5 : 5;

      if (GameConstants.ctxBlurEnabled) {
        Game.ctx.filter = `blur(${blurAmount}px)`;
      }

      Game.ctx.drawImage(
        this.shadeOffscreenCanvas,
        (this.roomX - offsetX) * GameConstants.TILESIZE,
        (this.roomY - offsetY) * GameConstants.TILESIZE,
      );

      Game.ctx.filter = "none";
    }

    Game.ctx.restore();
  };

  // Build the unblurred shade offscreen using the exact logic as drawShadeLayer's fill pass
  private buildShadeOffscreenForSlicing = () => {
    // Clear the offscreen shade canvas
    this.shadeOffscreenCtx.clearRect(
      0,
      0,
      this.shadeOffscreenCanvas.width,
      this.shadeOffscreenCanvas.height,
    );

    const offsetX = this.blurOffsetX;
    const offsetY = this.blurOffsetY;

    let lastFillStyle = "";

    // Respect on-screen bounds with a small buffer to accommodate blur spill
    const shadeBufferTiles = 4;
    const { minX, maxX, minY, maxY } =
      this.getVisibleTileBounds(shadeBufferTiles);
    for (
      let x = Math.max(this.roomX - 2, minX);
      x <= Math.min(this.roomX + this.width + 3, maxX);
      x++
    ) {
      for (
        let y = Math.max(this.roomY - 2, minY);
        y <= Math.min(this.roomY + this.height + 3, maxY);
        y++
      ) {
        const tile = this.roomArray[x]?.[y];
        let alpha =
          this.softVis[x] && this.softVis[x][y] ? this.softVis[x][y] : 0;
        if (tile instanceof WallTorch) continue;
        let factor = !GameConstants.SMOOTH_LIGHTING ? 2 : 1;
        let smoothFactor = !GameConstants.SMOOTH_LIGHTING ? 0 : 1;
        let computedAlpha = alpha ** factor * smoothFactor;

        let fillX = x;
        let fillY = y;
        let fillWidth = 1;
        let fillHeight = 1;
        if (tile instanceof Wall) {
          const wall = tile as Wall;
          if (!this.innerWalls.includes(wall)) {
            switch (wall.direction) {
              case Direction.UP:
                fillY = y - 0.5;
                fillHeight = 0.5;
                break;
              case Direction.DOWN:
                fillY = y - 0.5;
                fillHeight = 1.5;
                break;
              case Direction.LEFT:
                fillX = x + 0.25;
                fillWidth = 0.75;
                break;
              case Direction.RIGHT:
                fillX = x;
                fillWidth = 0.75;
                break;
              case Direction.DOWN_LEFT:
                fillX = x + 0.25;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 1.5;
                break;
              case Direction.DOWN_RIGHT:
                fillX = x;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 1.5;
                break;
              case Direction.UP_LEFT:
                fillX = x + 0.25;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 0.5;
                break;
              case Direction.UP_RIGHT:
                fillX = x - 0.5;
                fillY = y - 0.5;
                fillWidth = 0.75;
                fillHeight = 0.5;
                break;
            }
          }
        } else if (tile instanceof Door) {
          const door = tile as Door;
          if (door.opened === true) {
            computedAlpha = computedAlpha / 2;
            switch (door.doorDir) {
              case Direction.UP:
                fillY = y - 1.5;
                fillHeight = 1.5;
                fillWidth = 2;
                fillX = x - 0.5;
                break;
              case Direction.DOWN:
                fillY = y - 0.5;
                fillHeight = 1.5;
                fillWidth = 2;
                fillX = x - 0.5;
                break;
              case Direction.RIGHT:
                fillX = x - 2;
                fillY = y - 2;
                fillWidth = 3;
                fillHeight = 3;
                break;
              case Direction.LEFT:
                fillX = x;
                fillY = y - 2;
                fillWidth = 3;
                fillHeight = 3;
                break;
            }
          } else {
            switch (door.doorDir) {
              case Direction.UP:
                fillY = y - 0.5;
                fillHeight = 1.5;
                break;
              case Direction.DOWN:
                fillY = y - 1;
                fillHeight = 3;
                fillWidth = 3;
                fillX = x - 0.5;
                break;
              case Direction.RIGHT:
                fillX = x - 2;
                fillY = y - 2;
                fillWidth = 3;
                fillHeight = 3;
                break;
              case Direction.LEFT:
                fillX = x;
                fillY = y - 2;
                fillWidth = 3;
                fillHeight = 3;
                break;
            }
          }
        }
        const alphaMultiplier = !GameConstants.SMOOTH_LIGHTING ? 0.5 : 1;
        const fillStyle = `rgba(0, 0, 0, ${computedAlpha * alphaMultiplier})`;
        if (fillStyle !== lastFillStyle) {
          this.shadeOffscreenCtx.fillStyle = fillStyle;
          lastFillStyle = fillStyle;
        }
        fillY += 1;
        fillX += 1;
        this.shadeOffscreenCtx.fillRect(
          (fillX - this.roomX + offsetX) * GameConstants.TILESIZE,
          (fillY - this.roomY + offsetY) * GameConstants.TILESIZE,
          fillWidth * GameConstants.TILESIZE,
          fillHeight * GameConstants.TILESIZE,
        );
      }
    }
  };

  // Returns a blurred shade canvas to sample slices from, reusing the WebGL blur/cache when possible
  private getBlurredShadeSourceForSlicing = (): HTMLCanvasElement => {
    if (GameConstants.USE_WEBGL_BLUR) {
      const blurRenderer = WebGLBlurRenderer.getInstance();
      if (this.shouldUseBlurCache() && this.blurCache.shade5px) {
        return this.blurCache.shade5px as HTMLCanvasElement;
      } else {
        // Blur radius should match layer draw
        const blurred5px = blurRenderer.applyBlur(this.shadeOffscreenCanvas, 8);
        if (!this.active) this.cacheBlurResult("shade5px", blurred5px);
        return blurred5px;
      }
    } else {
      // Canvas2D blur path: we cannot use ctx.filter during main slicing draws.
      // So we pre-blur into a temporary canvas once.
      if (!this.shadeBlurTempCanvas) {
        this.shadeBlurTempCanvas = document.createElement("canvas");
        this.shadeBlurTempCanvas.width = this.shadeOffscreenCanvas.width;
        this.shadeBlurTempCanvas.height = this.shadeOffscreenCanvas.height;
        this.shadeBlurTempCtx = this.shadeBlurTempCanvas.getContext(
          "2d",
        ) as CanvasRenderingContext2D;
      }
      const tctx = this.shadeBlurTempCtx as CanvasRenderingContext2D;
      tctx.clearRect(
        0,
        0,
        this.shadeBlurTempCanvas!.width,
        this.shadeBlurTempCanvas!.height,
      );
      if (GameConstants.ctxBlurEnabled) {
        tctx.filter = `blur(5px)`;
      } else {
        tctx.filter = "none";
      }
      // Draw offscreen into temp at 0,0 (coordinates already include internal padding)
      tctx.drawImage(this.shadeOffscreenCanvas, 0, 0);
      tctx.filter = "none";
      return this.shadeBlurTempCanvas as HTMLCanvasElement;
    }
  };

  // Draw shade slices directly above a given tile
  private drawShadeSliceForTile = (
    shadeSrc: HTMLCanvasElement,
    tileX: number,
    tileY: number,
    fadeDir?: "left" | "right" | "up" | "down",
  ) => {
    const ts = GameConstants.TILESIZE;
    // Source position in the blurred offscreen matches drawShadeLayer mapping
    const sx = (tileX + 1 - this.roomX + this.blurOffsetX) * ts;
    const sy = (tileY + 1 - this.roomY + this.blurOffsetY) * ts;
    const dx = tileX * ts;
    const dy = tileY * ts;
    if (!fadeDir) {
      Game.ctx.drawImage(shadeSrc, sx, sy, ts, ts, dx, dy, ts, ts);
      return;
    }

    // Lazy init temp slice canvas
    if (!this.shadeSliceTempCanvas) {
      this.shadeSliceTempCanvas = document.createElement("canvas");
      this.shadeSliceTempCanvas.width = ts;
      this.shadeSliceTempCanvas.height = ts;
      this.shadeSliceTempCtx = this.shadeSliceTempCanvas.getContext(
        "2d",
      ) as CanvasRenderingContext2D;
    }
    const tctx = this.shadeSliceTempCtx as CanvasRenderingContext2D;
    tctx.clearRect(0, 0, ts, ts);
    // Copy slice into temp
    tctx.globalCompositeOperation = "source-over";
    tctx.drawImage(shadeSrc, sx, sy, ts, ts, 0, 0, ts, ts);
    // Apply gradient alpha mask (destination-in)
    let grad: CanvasGradient | null = null;
    if (fadeDir === "right") {
      grad = tctx.createLinearGradient(0, 0, ts, 0);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
    } else if (fadeDir === "left") {
      grad = tctx.createLinearGradient(0, 0, ts, 0);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
    } else if (fadeDir === "up") {
      grad = tctx.createLinearGradient(0, 0, 0, ts);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
    } else if (fadeDir === "down") {
      grad = tctx.createLinearGradient(0, 0, 0, ts);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
    }
    if (grad) {
      tctx.globalCompositeOperation = "destination-in";
      tctx.fillStyle = grad;
      tctx.fillRect(0, 0, ts, ts);
    }
    // Blit to main ctx
    Game.ctx.drawImage(this.shadeSliceTempCanvas as HTMLCanvasElement, dx, dy);
  };

  drawBloomLayer = (delta: number, zLayer: number = this.getActiveZ()) => {
    if (!this.onScreen) return;

    Game.ctx.save();
    // Clear the offscreen shade canvas
    this.bloomOffscreenCtx.clearRect(
      0,
      0,
      this.bloomOffscreenCanvas.width,
      this.bloomOffscreenCanvas.height,
    );
    const offsetX = this.blurOffsetX;
    const offsetY = this.blurOffsetY;

    let lastFillStyle = "";

    // Draw bloom for entities on the requested z-layer only.
    const entitiesOnLayer = this.entities
      .concat(this.deadEntities)
      .filter((e) => (e?.z ?? 0) === zLayer);
    for (const e of entitiesOnLayer) {
      if (!e.hasBloom) continue;
      e.updateBloom(delta);
      this.bloomOffscreenCtx.globalAlpha =
        1 * (1 - this.softVis[e.x][e.y]) * e.softBloomAlpha;
      this.bloomOffscreenCtx.fillStyle = e.bloomColor;

      this.bloomOffscreenCtx.fillRect(
        (e.x - e.drawX - this.roomX + offsetX + 0.5 - e.bloomSize / 2) *
          GameConstants.TILESIZE,
        (e.y - e.drawY - this.roomY - 0.5 + offsetY + 0.5 - e.bloomSize / 2) *
          GameConstants.TILESIZE +
          e.bloomOffsetY,
        GameConstants.TILESIZE * e.bloomSize,
        GameConstants.TILESIZE * e.bloomSize,
      );
    }

    // Player bloom derived from equipped light (uses Drawable bloom smoothing)
    for (const key in this.game.players) {
      const player = this.game.players[key];
      if (player.getRoom() !== this) continue;
      if ((player?.z ?? 0) !== zLayer) continue;

      //player.hasBloom = true;
      const [r, g, b] = this.softCol[player.x][player.y] || [255, 255, 255];
      player.bloomColor = `rgba(${r}, ${g}, ${b}, 1)`;
      player.bloomAlpha = 0.5;
      player.updateBloom(delta);

      this.bloomOffscreenCtx.globalAlpha = player.softBloomAlpha;
      this.bloomOffscreenCtx.fillStyle = player.bloomColor;
      this.bloomOffscreenCtx.fillRect(
        (player.x - player.drawX - this.roomX + offsetX) *
          GameConstants.TILESIZE,
        (player.y - player.drawY - this.roomY + offsetY - 0.5) *
          GameConstants.TILESIZE,

        GameConstants.TILESIZE,
        GameConstants.TILESIZE,
      );
    }

    const shadeBufferTiles = 4;
    const { minX, maxX, minY, maxY } =
      this.getVisibleTileBounds(shadeBufferTiles);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (this.roomArray[x][y].hasBloom) {
          this.roomArray[x][y].updateBloom(delta);
          this.bloomOffscreenCtx.globalAlpha =
            1 * (1 - this.softVis[x][y]) * this.roomArray[x][y].softBloomAlpha;
          this.bloomOffscreenCtx.fillStyle = this.roomArray[x][y].bloomColor;

          this.bloomOffscreenCtx.fillRect(
            (x - this.roomX + offsetX) * GameConstants.TILESIZE,
            (y -
              this.roomY -
              0.25 +
              offsetY -
              this.roomArray[x][y].bloomOffsetY) *
              GameConstants.TILESIZE,
            GameConstants.TILESIZE,
            GameConstants.TILESIZE * 0.75,
          );
        }
      }
    }

    for (const p of this.projectiles) {
      if ((p?.z ?? 0) !== zLayer) continue;
      if (!p.hasBloom) continue;
      p.updateBloom(delta);
      this.bloomOffscreenCtx.globalAlpha =
        1 * (1 - this.softVis[p.x][p.y]) * p.softBloomAlpha;
      this.bloomOffscreenCtx.fillStyle = p.bloomColor;

      this.bloomOffscreenCtx.fillRect(
        (p.x - this.roomX + offsetX) * GameConstants.TILESIZE,
        (p.y - this.roomY + offsetY + p.bloomOffsetY) * GameConstants.TILESIZE,
        GameConstants.TILESIZE,
        GameConstants.TILESIZE,
      );
    }

    // Choose blur method based on setting
    if (GameConstants.USE_WEBGL_BLUR) {
      // Use WebGL blur with caching
      const blurRenderer = WebGLBlurRenderer.getInstance();

      // Check if we can use cached results
      if (this.shouldUseBlurCache() && this.blurCache.bloom8px) {
        // Use cached blurred result
        Game.ctx.globalCompositeOperation = "screen";
        Game.ctx.globalAlpha = 1;
        Game.ctx.drawImage(
          this.blurCache.bloom8px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );
      } else {
        // Generate new blur and cache if inactive
        Game.ctx.globalCompositeOperation = "screen";
        Game.ctx.globalAlpha = 1;

        // Apply 8px blur using WebGL
        const blurred8px = blurRenderer.applyBlur(this.bloomOffscreenCanvas, 8);
        Game.ctx.drawImage(
          blurred8px,
          (this.roomX - offsetX) * GameConstants.TILESIZE,
          (this.roomY - offsetY) * GameConstants.TILESIZE,
        );

        // Cache the result if room is inactive
        if (!this.active) {
          this.cacheBlurResult("bloom8px", blurred8px);
        }
      }
    } else {
      // Use Canvas2D blur (fallback) - matching original settings
      Game.ctx.globalCompositeOperation = "screen";
      Game.ctx.globalAlpha = 1;

      if (GameConstants.ctxBlurEnabled) {
        Game.ctx.filter = "blur(8px)";
      }

      Game.ctx.drawImage(
        this.bloomOffscreenCanvas,
        (this.roomX - offsetX) * GameConstants.TILESIZE,
        (this.roomY - offsetY) * GameConstants.TILESIZE,
      );

      Game.ctx.filter = "none";
    }

    this.bloomOffscreenCtx.fillStyle = "rgba(0, 0, 0, 1)";
    this.bloomOffscreenCtx.fillRect(
      0,
      0,
      this.bloomOffscreenCanvas.width,
      this.bloomOffscreenCanvas.height,
    );
    Game.ctx.restore();
  };

  drawEntities = (
    delta: number,
    skipLocalPlayer?: boolean,
    zLayer: number = this.game?.players?.[this.game.localPlayerID]?.z ?? 0,
  ) => {
    if (!this.onScreen) return;

    // Render-time particle cleanup (in-place, avoids allocations).
    // Note: turn-time cleanup exists in `clearDeadStuff()`, but that may not run
    // while the game is idling; bubbles are spawned from `Player.draw()`.
    this.particleCleanupAccumulator += delta;
    if (this.particleCleanupAccumulator >= 10) {
      this.particleCleanupAccumulator = 0;
      if (this.particles.length > 0) {
        let w = 0;
        for (let r = 0; r < this.particles.length; r++) {
          const p = this.particles[r];
          if (p && !p.dead) {
            this.particles[w++] = p;
          }
        }
        if (w !== this.particles.length) this.particles.length = w;
      }
    }

    this.updateOxygenLineBeams();

    Game.ctx.save();
    // If using inline sliced shade, prepare the blurred shade source once
    let useInlineShade =
      GameConstants.SHADE_ENABLED && GameConstants.SHADE_INLINE_IN_ENTITY_LAYER;
    let shadeSrc: HTMLCanvasElement | null = null;
    if (useInlineShade && !GameConstants.SHADING_DISABLED) {
      // Build unblurred shade and get blurred source
      this.buildShadeOffscreenForSlicing();
      shadeSrc = this.getBlurredShadeSourceForSlicing();
    }

    let tiles = [];
    // Iterate only within the currently visible tile bounds (with a small buffer)
    const tileBuffer = 3;
    const { minX, maxX, minY, maxY } = this.getVisibleTileBounds(tileBuffer);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const tile = this.roomArray[x][y];
        // Z-debug: on z=1, use the explicit z=1 tilemap (Floor vs Air)
        if (GameConstants.Z_DEBUG_MODE && zLayer === 1 && this.zDebugZ1Tiles) {
          const override = this.zDebugZ1Tiles.get(this.zKey(x, y));
          if (override) {
            // Air draws nothing; only collect non-solid tiles for drawables.
            if (!override.isSolid()) {
              override.drawUnderPlayer(delta);
              tiles.push(override);
            }
            continue;
          }
        }

        tile.drawUnderPlayer(delta);
        tiles.push(tile);
      }
    }

    let drawables: Drawable[] = [];
    const activeZ =
      this.game?.players?.[this.game.localPlayerID]?.z ?? zLayer ?? 0;
    const entities: Entity[] = ([] as Entity[]).concat(
      this.entities,
      this.deadEntities,
    );
    const entitiesOnLayer = entities.filter((e) => (e?.z ?? 0) === zLayer);
    const projectilesOnLayer = this.projectiles.filter(
      (p) => (p?.z ?? 0) === zLayer,
    );
    const itemsOnLayer = this.items.filter((i) => (i?.z ?? 0) === zLayer);
    const particlesOnLayer = this.particles.filter(
      (p) => ((p as any)?.worldZ ?? 0) === zLayer,
    );
    const hitwarningsOnLayer = zLayer === activeZ ? this.hitwarnings : [];

    drawables.push(
      ...tiles,
      ...this.decorations,
      ...entitiesOnLayer,
      ...hitwarningsOnLayer,
      ...projectilesOnLayer,
      ...particlesOnLayer,
      ...itemsOnLayer,
    );

    // Filter out drawables that are completely off-screen (with a small tile buffer)
    drawables = drawables.filter((d) => {
      const dx = (d as any).x;
      const dy = (d as any).y;
      if (typeof dx !== "number" || typeof dy !== "number") return true;
      const dw = Math.max(1, Math.ceil((d as any)?.w || 1));
      const dh = Math.max(1, Math.ceil((d as any)?.h || 1));
      const bufferTiles = 3;
      for (let ox = 0; ox < dw; ox++) {
        for (let oy = 0; oy < dh; oy++) {
          if (this.isTileOnScreen(dx + ox, dy + oy, bufferTiles)) return true;
        }
      }
      return false;
    });

    for (const i in this.game.players) {
      const player = this.game.players[i];
      if (player.getRoom?.() === this) {
        if ((player.z ?? 0) !== zLayer) continue;
        if (
          !(
            skipLocalPlayer &&
            player === this.game.players[this.game.localPlayerID]
          )
        )
          drawables.push(player);
      }
    }

    drawables.sort((a, b) => {
      if (a instanceof Floor || a instanceof SpawnFloor) {
        return -1;
      } else if (b instanceof Floor || b instanceof SpawnFloor) {
        return 1;
      } else if (a instanceof Decoration) {
        return -1;
      } else if (b instanceof Decoration) {
        return 1;
      }
      if (Math.abs(a.drawableY - b.drawableY) < 0.1) {
        const aAbove = (a as any).shouldDrawAbovePlayer === true;
        const bAbove = (b as any).shouldDrawAbovePlayer === true;
        // Special-case: when tied in Y, draw flagged objects above players
        if (a instanceof Player && bAbove) {
          return -1; // player before flagged -> flagged drawn later
        } else if (b instanceof Player && aAbove) {
          return 1; // flagged after player
        }
        // Default near-equal behavior
        if (a instanceof Player) {
          return 1;
        } else if (b instanceof Player) {
          return -1;
        } else if (a instanceof Entity) {
          return 1;
        } else if (b instanceof Entity) {
          return -1;
        } else if (a instanceof Particle) {
          return 1;
        } else if (b instanceof Particle) {
          return -1;
        } else return 0;
      } else {
        return a.drawableY - b.drawableY;
      }
    });

    // Draw in sorted order; apply inline tile shade immediately after each tile
    for (const d of drawables) {
      d.draw(delta);
      if (useInlineShade && shadeSrc && d instanceof Tile) {
        const tx = (d as Tile).x;
        const ty = (d as Tile).y;
        const sv =
          this.softVis[tx] && this.softVis[tx][ty] ? this.softVis[tx][ty] : 0;
        if (sv > 0) {
          const prevOp = Game.ctx
            .globalCompositeOperation as GlobalCompositeOperation;
          if (
            prevOp !==
            (GameConstants.SHADE_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation)
          ) {
            Game.ctx.globalCompositeOperation =
              GameConstants.SHADE_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation;
          }

          const prevAlpha = Game.ctx.globalAlpha;
          Game.ctx.globalAlpha = 1;

          let fade: "left" | "right" | "up" | "down" | undefined;
          if (d instanceof Door && d.opened) {
            switch (d.doorDir) {
              case Direction.LEFT:
                fade = "left";
                break;
              case Direction.RIGHT:
                fade = "right";
                break;
              case Direction.UP:
                fade = undefined;
                break;
              case Direction.DOWN:
                // No gradient mask for down doors
                fade = "down";
                break;
            }
          } else if (d instanceof Wall) {
            const info = this.wallInfo.get(`${tx},${ty}`);
            if (info && (info as any).isBelowDoorWall) {
              const below = this.roomArray[tx]?.[ty + 1];
              if (below instanceof Door && below.opened) {
                if (below.doorDir === Direction.LEFT) fade = "left";
                else if (below.doorDir === Direction.RIGHT) fade = "right";
              }
            }
          }

          this.drawShadeSliceForTile(shadeSrc, tx, ty, fade);
          Game.ctx.globalAlpha = prevAlpha;
          if (
            prevOp !==
            (GameConstants.SHADE_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation)
          ) {
            Game.ctx.globalCompositeOperation = prevOp;
          }
        }
      }
    }

    // Z-debug: draw stairs markers last so they're visible even if embedded in walls.
    if (GameConstants.Z_DEBUG_MODE) {
      if (zLayer === 0 && this.zDebugUpStairs) {
        for (const key of this.zDebugUpStairs) {
          const [sx, sy] = key.split(",").map((v) => parseInt(v, 10));
          if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
          Game.drawFX(2, 0, 1, 1, sx, sy, 1, 1);
        }
      }
      if (zLayer === 1 && this.zDebugDownStairs) {
        for (const key of this.zDebugDownStairs) {
          const [sx, sy] = key.split(",").map((v) => parseInt(v, 10));
          if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
          Game.drawFX(3, 0, 1, 1, sx, sy, 1, 1);
        }
      }
    }

    this.drawAbovePlayer(delta);
    for (const i of itemsOnLayer) {
      i.drawTopLayer(delta);
    }
    for (const t of drawables) {
      if (t instanceof Passageway) {
        t.drawFloodedCaveFX();
      }
    }
    Game.ctx.restore();
  };

  private updateOxygenLineBeams = () => {
    if (!this.active) return;
    for (const player of Object.values(this.game.players)) {
      const playerRoom =
        (player as any).getRoom?.() ??
        this.game.levels[player.depth]?.rooms[player.levelID];
      if (playerRoom !== this) continue;
      const oxygenLine = (player as any).getOxygenLine?.();
      if (oxygenLine?.isDisconnectedFromPlayer?.()) continue;
      const activeTraversalIndex =
        oxygenLine?.getActiveTraversalIndex?.() ?? undefined;
      const startPos = player.getInterpolatedTilePosition();
      const startX = startPos.x;
      const startY = startPos.y - player.getOxygenAttachmentOffset();
      for (const projectile of this.projectiles) {
        if (
          projectile instanceof BeamEffect &&
          projectile.type === "oxygen-line" &&
          projectile.parent === player
        ) {
          const startIsPlayer =
            projectile.startAttachment === "player" ||
            this.isNear(projectile.x, projectile.y, startX, startY);
          const canAttachToPlayer =
            projectile.oxygenTraversalIndex === undefined ||
            projectile.oxygenTraversalIndex === activeTraversalIndex;
          if (startIsPlayer && canAttachToPlayer) {
            projectile.startAttachment = "player";
            projectile.x = startX;
            projectile.y = startY;
          }
        }
      }
    }
  };

  private isNear(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    epsilon: number = 0.05,
  ): boolean {
    return Math.abs(x1 - x2) <= epsilon && Math.abs(y1 - y2) <= epsilon;
  }

  drawAbovePlayer = (delta: number) => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        //if (this.softVis[x][y] < 1) this.roomArray[x][y].drawAbovePlayer(delta);
      }
    }
  };

  drawUnderwater = (delta: number) => {
    if (!this.onScreen) return;
    if (!this.underwater) {
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.globalAlpha = 0.3;
      Game.ctx.fillStyle = "#003B6F";
      Game.ctx.fillRect(
        (this.roomX + 0.5) * GameConstants.TILESIZE,
        this.roomY * GameConstants.TILESIZE,
        (this.width - 1) * GameConstants.TILESIZE,
        (this.height - 0.5) * GameConstants.TILESIZE,
      );
      Game.ctx.restore();
    }
  };

  drawShade = (delta: number) => {
    if (!this.onScreen) return;

    Game.ctx.save();
    let bestSightRadius = 0;
    for (const p in this.game.players) {
      Game.ctx.globalCompositeOperation = "source-over"; // "soft-light";
      Game.ctx.globalAlpha = 1;
      const player = this.game.players[p];
      const playerRoom = (player as any).getRoom
        ? (player as any).getRoom()
        : this.level.rooms[player.levelID];
      if (playerRoom === this && player.defaultSightRadius > bestSightRadius) {
        bestSightRadius = this.game.players[p].defaultSightRadius;
      }
    }
    let shadingAlpha = Math.max(0, Math.min(0.8, 2 / bestSightRadius));
    if (GameConstants.ALPHA_ENABLED) {
      Game.ctx.globalAlpha = 0.25; //this.shadeOpacity();
      //Game.ctx.resetTransform();
      //Game.ctx.fillStyle = "#4a5d23"; // hex dark misty green
      Game.ctx.fillStyle = this.shadeColor;
      Game.ctx.fillRect(
        this.roomX * GameConstants.TILESIZE,
        (this.roomY - 1) * GameConstants.TILESIZE,
        this.width * GameConstants.TILESIZE,
        (this.height + 1) * GameConstants.TILESIZE,
      );
      Game.ctx.globalAlpha = 1;
      Game.ctx.globalCompositeOperation = "source-over";
    }
    Game.ctx.restore();
  };

  shadeOpacity = () => {
    if (this.active) {
      return 0.25;
    } else {
      return 0.25;
    }
  };

  drawOverShade = (
    delta: number,
    zLayer: number = this.game?.players?.[this.game.localPlayerID]?.z ?? 0,
  ) => {
    const activeZ = this.game?.players?.[this.game.localPlayerID]?.z ?? zLayer;
    Game.ctx.save();
    for (const e of this.entities) {
      if ((e?.z ?? 0) !== zLayer) continue;
      e.drawTopLayer(delta); // health bars
    }

    for (const p of this.projectiles) {
      if ((p?.z ?? 0) !== zLayer) continue;
      p.drawTopLayer(delta);
    }
    //Game.ctx.globalCompositeOperation = "overlay";
    if (zLayer === activeZ) {
      for (const h of this.hitwarnings) {
        h.drawTopLayer(delta);
      }
    }
    //Game.ctx.globalCompositeOperation = "source-over";

    for (const s of this.particles) {
      if (((s as any)?.worldZ ?? 0) !== zLayer) continue;
      s.drawTopLayer(delta);
    }
    // draw over dithered shading
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.roomArray[x][y].drawAboveShading(delta);
      }
    }
    //added for coin animation
    for (const i of this.items) {
      if ((i?.z ?? 0) !== zLayer) continue;
      i.drawAboveShading(delta);
    }

    Game.ctx.restore();
  };

  // for stuff rendered on top of the player
  drawTopLayer = (delta: number) => {
    Game.ctx.save();

    // gui stuff

    // room name
    let old = Game.ctx.font;
    Game.ctx.font = GameConstants.SCRIPT_FONT_SIZE + "px Script";
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(
      this.message,
      GameConstants.WIDTH / 2 - Game.measureText(this.name).width / 2,
      5,
    );
    Game.ctx.font = old;
    Game.ctx.restore();
  };

  drawTopBeams = (
    delta: number,
    zLayer: number = this.game?.players?.[this.game.localPlayerID]?.z ?? 0,
  ) => {
    for (const projectile of this.projectiles) {
      if ((projectile?.z ?? 0) !== zLayer) continue;
      if (projectile instanceof BeamEffect && projectile.drawOnTop) {
        projectile.drawTopLayer(delta);
      }
    }
  };

  hasTopBeams = (): boolean => {
    for (const projectile of this.projectiles) {
      if (projectile instanceof BeamEffect && projectile.drawOnTop) {
        return true;
      }
    }
    return false;
  };

  // src/room.ts
  createWallMask = (): HTMLCanvasElement => {
    // Reuse a single mask canvas to avoid allocating a new canvas repeatedly.
    if (!this.wallMaskCanvas) {
      this.wallMaskCanvas = document.createElement("canvas");
      this.wallMaskCtx = this.wallMaskCanvas.getContext("2d") as
        | CanvasRenderingContext2D
        | undefined;
    }
    const maskCanvas = this.wallMaskCanvas;
    maskCanvas.width = this.width * GameConstants.TILESIZE;
    maskCanvas.height = this.height * GameConstants.TILESIZE;
    const ctx = this.wallMaskCtx;
    if (!ctx) {
      throw new Error("Failed to create mask canvas context.");
    }

    // Fill the canvas with opaque color
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.fillRect(
      this.roomX * GameConstants.TILESIZE,
      this.roomY * GameConstants.TILESIZE,
      maskCanvas.width,
      maskCanvas.height,
    );

    // Make wall areas transparent
    /*
    for (let x = this.roomX - 1; x < this.roomX + 1 + this.width; x++) {
      for (let y = this.roomY - 1; y < this.roomY + 1 + this.height; y++) {
        const tile = this.getTile(x, y);
        if (tile instanceof Wall) {
          let offsetY = 0;
          if (tile.direction === Direction.DOWN) offsetY = 1;
          ctx.clearRect(
            (x - this.roomX) * GameConstants.TILESIZE,
            (y - 1 - this.roomY) * GameConstants.TILESIZE,
            GameConstants.TILESIZE,
            GameConstants.TILESIZE,
          );
        }
      }
    }
      */
    return maskCanvas;
  };

  //calculate wall info for proper wall rendering
  calculateWallInfo() {
    this.wallInfo.clear();
    // IMPORTANT: calculateWallInfo() is called frequently (e.g. each tick).
    // Reset `this.walls` to avoid unbounded growth and memory leaks over long play sessions.
    if (this.walls) this.walls.length = 0;
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        const tile = this.getTile(x, y);
        if (tile instanceof Wall || tile instanceof WallTorch) {
          this.walls.push(tile);
          const isTopWall = y === this.roomY;
          const isBottomWall = y === this.roomY + this.height - 1;
          const isLeftWall = x === this.roomX;
          const isRightWall = x === this.roomX + this.width - 1;
          const isInnerWall =
            !isTopWall && !isBottomWall && !isLeftWall && !isRightWall;
          const isBelowDoorWall =
            y < this.roomY + this.height - 1 && this.getTile(x, y + 1)?.isDoor;
          const isAboveDoorWall =
            y < this.roomY + this.height - 1 && this.getTile(x, y - 1)?.isDoor;
          const isDoorWall =
            y < this.roomY + this.height && this.getTile(x, y + 1)?.isDoor;

          let innerWallType = null;
          if (isInnerWall) {
            const hasWallAbove = this.getTile(x, y - 1) instanceof Wall;
            const hasWallBelow = this.getTile(x, y + 1) instanceof Wall;
            const hasBottomWallBelow = y === this.roomY + this.height - 2;

            if (!hasWallAbove && (hasWallBelow || hasBottomWallBelow)) {
              innerWallType = "topInner";
            } else if (hasWallAbove && !hasWallBelow && !hasBottomWallBelow) {
              innerWallType = "bottomInner";
            } else if (hasWallAbove && (hasWallBelow || hasBottomWallBelow)) {
              innerWallType = "surroundedInner";
            } else {
              innerWallType = "isolatedInner";
            }
          }

          this.wallInfo.set(`${x},${y}`, {
            isTopWall,
            isBottomWall,
            isLeftWall,
            isRightWall,
            isInnerWall,
            isBelowDoorWall,
            isDoorWall,
            innerWallType,
            isAboveDoorWall,
            shouldDrawBottom:
              isDoorWall ||
              isBelowDoorWall ||
              (isTopWall && !isLeftWall && !isRightWall) ||
              isInnerWall,
          });
        }
      }
    }
  }

  /**
   * Finds and returns the darkest and lightest tiles in the room based on their visibility.
   * Loops through the roomArray, sums all the vis values, sorts them, and identifies the extremes.
   *
   * @returns An object containing the darkest and lightest tiles with their coordinates and vis values.
   */
  getExtremeLuminance = (): {
    darkest: { x: number; y: number; vis: number } | null;
    lightest: { x: number; y: number; vis: number } | null;
  } => {
    const visValues: { x: number; y: number; vis: number }[] = [];

    // Loop through each tile in the room
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.vis[x] && this.vis[x][y] !== undefined) {
          visValues.push({ x, y, vis: this.vis[x][y] });
        }
      }
    }

    if (visValues.length === 0) {
      return { darkest: null, lightest: null };
    }

    // Sort the vis values in ascending order
    visValues.sort((a, b) => a.vis - b.vis);

    return {
      darkest: visValues[visValues.length - 1],
      lightest: visValues[0],
    };
  };

  /**
   * Finds and returns the darkest and lightest tiles adjacent to a given point.
   * It checks the tiles above, below, to the left, and to the right of the specified point.
   *
   * @param px - The x-coordinate of the reference point.
   * @param py - The y-coordinate of the reference point.
   * @returns An object containing the darkest and lightest adjacent tiles with their coordinates and vis values,
   *          or null if no valid adjacent tiles are found.
   */
  getExtremeLuminanceFromPoint = (
    px: number,
    py: number,
  ): {
    darkest: { x: number; y: number; vis: number } | null;
    lightest: { x: number; y: number; vis: number } | null;
  } => {
    const adjacentPositions = [
      { x: px, y: py - 1 }, // Up
      { x: px, y: py + 1 }, // Down
      { x: px - 1, y: py }, // Left
      { x: px + 1, y: py }, // Right
    ];

    const visValues: { x: number; y: number; vis: number }[] = [];

    adjacentPositions.forEach((pos) => {
      const { x, y } = pos;
      if (this.vis[x] && this.vis[x][y] !== undefined) {
        if (this.roomArray[x] && this.roomArray[x][y]) {
          if (this.roomArray[x][y] instanceof Floor) {
            visValues.push({ x, y, vis: this.vis[x][y] });
          }
        }
      }
    });

    if (visValues.length === 0) {
      return { darkest: null, lightest: null };
    }

    // Sort the vis values in ascending order
    visValues.sort((a, b) => a.vis - b.vis);

    return {
      darkest: visValues[visValues.length - 1],
      lightest: visValues[0],
    };
  };

  getAverageLuminance = (): number => {
    let total = 0;
    let count = 0;
    for (let x = this.roomX - 2; x <= this.roomX + 2; x++) {
      if (this.roomArray[x] && this.roomArray[x][this.roomY]) {
        for (let y = this.roomY - 2; y <= this.roomY + 2; y++) {
          if (this.vis[x][y]) {
            total += this.vis[x][y];
            count++;
          }
        }
      }
    }
    return total / count;
  };

  // #endregion

  // #region UTILITIES

  pointInside(
    x: number,
    y: number,
    rX: number,
    rY: number,
    rW: number,
    rH: number,
  ): boolean {
    if (x < rX || x >= rX + rW) return false;
    if (y < rY || y >= rY + rH) return false;
    return true;
  }

  tileInside = (tileX: number, tileY: number): boolean => {
    return this.pointInside(
      tileX,
      tileY,
      this.roomX,
      this.roomY,
      this.width,
      this.height,
    );
  };

  getEmptyTiles = (): Tile[] => {
    let returnVal: Tile[] = [];
    for (let x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        if (
          !this.roomArray[x][y].isSolid() &&
          !(this.roomArray[x][y] instanceof SpikeTrap) &&
          !(this.roomArray[x][y] instanceof SpawnFloor) &&
          !(this.roomArray[x][y] instanceof UpLadder) &&
          !(this.roomArray[x][y] instanceof DownLadder)
        ) {
          returnVal.push(this.roomArray[x][y]);
        }
      }
    }
    for (const e of this.entities) {
      returnVal = returnVal.filter((t) => !e.pointIn(t.x, t.y));
    }
    return returnVal;
  };

  getTile = (x: number, y: number) => {
    if (this.roomArray[x]) return this.roomArray[x][y];
    else return undefined;
  };

  getBossDoor = () => {
    for (const door of this.doors) {
      if (door.linkedDoor.room.type === RoomType.DOWNLADDER)
        return { x: door.x, y: door.y, doorDir: door.doorDir };
    }
    return null;
  };

  path = (): Room[] => {
    // Traverse rooms via linked doors (BFS), tracking visited by room globalId
    const visited = new Set<string>();
    const connectedRooms: Room[] = [];
    const queue: Room[] = [this as unknown as Room];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const gid = (current as any).globalId as string | undefined;
      if (!gid || visited.has(gid)) continue;

      visited.add(gid);
      connectedRooms.push(current);

      try {
        const doors = (current as any).doors as Array<any>;
        if (!doors) continue;
        for (const door of doors) {
          const linked = (door as any)?.linkedDoor;
          const nextRoom = linked && (linked as any).room;
          if (nextRoom) {
            const nextGid = (nextRoom as any).globalId as string | undefined;
            if (nextGid && !visited.has(nextGid)) {
              queue.push(nextRoom);
            }
          }
        }
      } catch {}
    }

    return connectedRooms;
  };

  /**
   * Returns true if this room contains an ladder tile.
   */
  hasLadder = (ladderType: "up" | "down"): boolean => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      if (!this.roomArray[x]) continue;
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        const t = this.roomArray[x][y];
        if (t instanceof UpLadder && ladderType === "up") return true;
        if (t instanceof DownLadder && ladderType === "down" && t.isSidePath)
          return true;
      }
    }
    return false;
  };

  hasKey = (): boolean => {
    for (const item of this.items) {
      if (item instanceof Key) return true;
    }
    return false;
  };

  /**
   * Computes the shortest number of room hops (through linked doors) to reach
   * a room that contains an `UpLadder`. Returns 0 if this room already has one,
   * or null if no such room is reachable.
   */
  getDistanceToNearestLadder = (ladderType: "up" | "down"): number | null => {
    const currentRoom = this;
    if (currentRoom.hasLadder(ladderType)) return 0;

    const visited = new Set<string>();
    const queue: Array<{ room: Room; dist: number }> = [];

    visited.add(currentRoom.globalId);
    queue.push({ room: currentRoom, dist: 0 });

    while (queue.length > 0) {
      const { room, dist } = queue.shift();
      for (const d of room.doors) {
        const nextRoom = d && d.linkedDoor && d.linkedDoor.room;
        if (!nextRoom) continue;
        const gid = nextRoom.globalId;
        if (visited.has(gid)) continue;
        if (nextRoom.hasLadder(ladderType)) {
          return dist + 1;
        }
        visited.add(gid);
        queue.push({ room: nextRoom, dist: dist + 1 });
      }
    }

    return null;
  };

  hasNoEnemies = () => {
    const activeZ = this.getActiveZ();
    let enemies = this.entities.filter(
      (e) => e instanceof Enemy && ((e as any).z ?? 0) === activeZ,
    );
    const cleared = enemies.length === 0 && this.lastEnemyCount > 0;

    return cleared;
  };

  roomCleared = () => {
    const activeZ = this.getActiveZ();
    const enemies = this.entities.filter(
      (e) => e instanceof Enemy && ((e as any).z ?? 0) === activeZ,
    );
    return enemies.length === 0;
  };

  hasHitwarning = (x: number, y: number): boolean => {
    /*
    for (const e of this.entities) {
      if (e instanceof Enemy && e.x === x && e.y === y) danger += 1;
    }
    */
    for (const h of this.hitwarnings) {
      if (h.x === x && h.y === y && !h.dead) return true;
    }
    return false;
  };

  hasEnemy = (x: number, y: number, z: number = this.getActiveZ()): boolean => {
    for (const e of this.entities) {
      if (
        e instanceof Enemy &&
        e.x === x &&
        e.y === y &&
        ((e as any).z ?? 0) === z
      )
        return true;
    }
    return false;
  };

  /**
   * Checks if a tile at the given coordinates is empty (not solid and no entities).
   * This is a comprehensive check that combines tile solidity and entity presence.
   *
   * @param x - The x-coordinate to check
   * @param y - The y-coordinate to check
   * @returns True if the tile is empty (walkable and no entities), false otherwise
   */
  isTileEmpty = (x: number, y: number): boolean => {
    // First check if the position exists in the room array
    if (!this.roomArray[x] || !this.roomArray[x][y]) {
      return false;
    }

    const tile = this.roomArray[x][y];

    // Check if the tile is solid
    if (tile.isSolid()) {
      return false;
    }

    // Check for specific tile types that should be considered non-empty
    if (
      tile instanceof SpikeTrap ||
      tile instanceof SpawnFloor ||
      tile instanceof UpLadder ||
      tile instanceof DownLadder
    ) {
      return false;
    }

    // Check if there are any entities at this position
    for (const entity of this.entities) {
      if (entity.pointIn(x, y)) {
        return false;
      }
    }

    return true;
  };

  hasEnemyInRadius = (x: number, y: number): boolean => {
    const radius = 3;
    const radiusSquared = radius * radius; // Calculate once

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        // Check if point is within radius (circular check)
        if (dx * dx + dy * dy <= radiusSquared) {
          const checkX = x + dx;
          const checkY = y + dy;

          // Add bounds checking if needed
          if (this.hasEnemy(checkX, checkY)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  checkForNoEnemies = () => {
    if (this.hasNoEnemies()) {
      const isBoss = this.type === RoomType.BOSS;
      let bossFlag = false;
      this.doors.forEach((d) => {
        if (d.type === DoorType.GUARDEDDOOR) {
          d.unGuard(isBoss);
          bossFlag = true;
          if (isBoss) {
            this.game.startCameraAnimation(
              this.getBossDoor().x,
              this.getBossDoor().y,
              175,
            );
          }
        }
      });
      if (bossFlag) {
        this.game.pushMessage(
          "The foes have been slain and the door allows you passage.",
        );
      }
    }
  };

  // This pattern appears in multiple methods like addVendingMachine, addChests, addSpikes, etc.
  getRandomEmptyPosition(
    tiles: Tile[],
    ignore?: { x: number; y: number },
  ): { x: number; y: number } | null {
    if (tiles.length === 0) return null;
    const tile = tiles.splice(
      Game.rand(0, tiles.length - 1, Random.rand),
      1,
    )[0];
    if (ignore && tile.x === ignore.x && tile.y === ignore.y) {
      return this.getRandomEmptyPosition(tiles, ignore);
    }
    return { x: tile.x, y: tile.y };
  }

  getBigRandomEmptyPosition(tiles: Tile[]): {
    x: number;
    y: number;
  } {
    if (tiles.length === 0) return null;

    // Create a set for O(1) lookup of tile coordinates
    const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));

    // Find all tiles that can be the top-left corner of a 2x2 patch
    const bigTilePositions = tiles.filter((t) => {
      // Check if this tile and the 3 adjacent tiles (right, below, diagonal) are all empty
      return (
        tileSet.has(`${t.x + 1},${t.y}`) && // right
        tileSet.has(`${t.x},${t.y + 1}`) && // below
        tileSet.has(`${t.x + 1},${t.y + 1}`)
      ); // diagonal
    });

    if (bigTilePositions.length === 0) return null;

    // Randomly select one of the valid 2x2 positions
    const selectedTile =
      bigTilePositions[Game.rand(0, bigTilePositions.length - 1, Random.rand)];
    return { x: selectedTile.x, y: selectedTile.y };
  }

  /**
   * Returns the top-left coordinates of an empty rectangular area of size w x h, or null if none.
   * Uses only the provided tiles array, which should come from getEmptyTiles() or a filtered variant.
   */
  getEmptyAreaPosition(
    tiles: Tile[],
    w: number,
    h: number,
  ): { x: number; y: number } | null {
    if (!tiles || tiles.length === 0) return null;
    if (w <= 0 || h <= 0) return null;

    // Build a set for O(1) membership checks
    const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));

    // Candidate top-left tiles must themselves be empty
    const candidates = tiles.filter((t) => {
      // Early bounds check using room limits
      if (
        t.x + w > this.roomX + this.width ||
        t.y + h > this.roomY + this.height ||
        t.x < this.roomX ||
        t.y < this.roomY
      )
        return false;

      // Ensure entire w x h area is in the tile set
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          if (!tileSet.has(`${t.x + dx},${t.y + dy}`)) return false;
        }
      }
      return true;
    });

    if (candidates.length === 0) return null;
    const pick = candidates[Game.rand(0, candidates.length - 1, Random.rand)];
    return { x: pick.x, y: pick.y };
  }
  // Used in populateUpLadder, populateDownLadder, populateRopeHole, populateRopeCave
  getRoomCenter(): { x: number; y: number } {
    return {
      x: Math.floor(this.roomX + this.width / 2),
      y: Math.floor(this.roomY + this.height / 2),
    };
  }

  // Used in multiple methods including castShadowsAtAngle
  isPositionInRoom(x: number, y: number): boolean {
    return !(
      Math.floor(x) < this.roomX ||
      Math.floor(x) >= this.roomX + this.width ||
      Math.floor(y) < this.roomY ||
      Math.floor(y) >= this.roomY + this.height
    );
  }

  pathIsBlockedBy(tile: Tile, otherTile: Tile): Entity[] {
    const entities = [];
    if (tile.isSolid()) entities.push(tile);
    if (otherTile.isSolid()) entities.push(otherTile);
    return entities;
  }

  // checks for obstructions between doors and finds paths avoiding obstacles.

  removeDoorObstructions = () => {
    let obstacles = [];
    for (const door of this.doors) {
      for (const otherDoor of this.doors) {
        if (door === otherDoor || door === null || otherDoor === null) continue; // Fixed: use continue instead of break
        const pathObstacles = this.findPath(door, otherDoor);
        if (pathObstacles.length > 0) {
          obstacles.push(...pathObstacles); // Fixed: actually collect the obstacles
        }
      }
    }
    if (obstacles.length > 0) {
      for (let obstacle of obstacles) {
        // console.log(`Removing obstacle at (${obstacle.x},${obstacle.y})`);
        this.entities = this.entities.filter((e) => e !== obstacle);
        obstacle = null;
      }
    }
  };

  hasUpladder = () => {
    return this.roomArray.some((row) =>
      row.some((tile) => tile instanceof UpLadder),
    );
  };

  // avoid blocking doorways with unbreakable entities
  findPath = (
    startTile: Tile,
    targetTile: Tile,
    additionalBlockedPositions?: astar.Position[],
  ): Array<Entity> => {
    let disablePositions = Array<astar.Position>();
    let obstacleCandidates = [];

    // Expand entity types that can block paths
    for (const e of this.entities) {
      if (
        e instanceof VendingMachine ||
        e instanceof Rock ||
        e instanceof Barrel ||
        e instanceof Crate ||
        e instanceof Block ||
        e instanceof TombStone ||
        e instanceof PottedPlant
      ) {
        disablePositions.push({ x: e.x, y: e.y } as astar.Position);
        obstacleCandidates.push(e);
      }
    }

    // Add any additional blocked positions (for testing if a position would block)
    if (additionalBlockedPositions) {
      disablePositions.push(...additionalBlockedPositions);
    }

    // Create a grid of the room - Fixed bounds
    let grid = [];
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        const roomX = this.roomX + x;
        const roomY = this.roomY + y;
        if (this.roomArray[roomX] && this.roomArray[roomX][roomY])
          grid[x][y] = this.roomArray[roomX][roomY];
        else grid[x][y] = false;
      }
    }

    // Adjust start and target positions to grid coordinates
    const startGridPos = {
      x: startTile.x - this.roomX,
      y: startTile.y - this.roomY,
    };
    const targetGridPos = {
      x: targetTile.x - this.roomX,
      y: targetTile.y - this.roomY,
    };

    // Adjust disabled positions to grid coordinates
    const gridDisabledPositions = disablePositions.map((pos) => ({
      x: pos.x - this.roomX,
      y: pos.y - this.roomY,
    }));

    let moves = astar.AStar.search(
      grid,
      startGridPos,
      targetGridPos,
      gridDisabledPositions,
      false,
      false,
      false,
    );

    if (moves.length === 0) {
      return obstacleCandidates;
    } else {
      return [];
    }
  };

  /**
   * Checks if placing an entity at the given coordinates would block any door-to-door paths.
   * This is useful for preventing placement of objects that would obstruct navigation.
   *
   * @param x - The x-coordinate to test
   * @param y - The y-coordinate to test
   * @returns True if placing an entity here would block a door, false otherwise
   */
  wouldBlockDoor = (x: number, y: number): boolean => {
    // If there are fewer than 2 doors, no paths to block
    if (this.doors.length < 2) {
      return false;
    }

    // Test each pair of doors
    for (let i = 0; i < this.doors.length; i++) {
      for (let j = i + 1; j < this.doors.length; j++) {
        const door1 = this.doors[i];
        const door2 = this.doors[j];

        if (!door1 || !door2) continue;

        // First test: can we find a path WITHOUT the blocking position?
        const obstaclesWithoutBlock = this.findPath(door1, door2);

        // If there's already no path without our test position, skip this door pair
        if (obstaclesWithoutBlock.length > 0) {
          continue;
        }

        // Second test: can we find a path WITH the blocking position?
        const additionalBlockedPos = [{ x, y }];
        const obstaclesWithBlock = this.findPath(
          door1,
          door2,
          additionalBlockedPos,
        );

        // If path existed without block but doesn't exist with block, then this position blocks the door
        if (obstaclesWithBlock.length > 0) {
          console.warn("DOOR WOULD BE BLOCKED!");
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Gets empty tiles that don't block door-to-door paths.
   * This is a filtered version of getEmptyTiles() that excludes positions that would obstruct navigation.
   *
   * @returns Array of tiles that are empty and don't block door paths
   */
  getEmptyTilesNotBlockingDoors = (): Tile[] => {
    const emptyTiles = this.getEmptyTiles();
    return emptyTiles.filter((tile) => !this.wouldBlockDoor(tile.x, tile.y));
  };

  // #endregion

  // #region KEY PATHFINDING HELPERS

  /**
   * Finds the shortest sequence of doors to traverse from this room to the target room.
   * Returns an ordered array of doors that begins with a door in this room and ends with
   * the door that enters the target room. If no path is found, returns null.
   * If samePathOnly is true, restrict traversal to rooms that share the same pathId.
   */
  findShortestDoorPathTo = (
    target: Room,
    samePathOnly: boolean = true,
  ): Door[] | null => {
    if (!target) return null;
    if (target === (this as unknown as Room)) return [];

    try {
      const start: Room = this as unknown as Room;
      const targetGid = (target as any).globalId as string | undefined;
      const startPathId = (start as any).pathId;

      const queue: Room[] = [start];
      const visited = new Set<string>();
      const prev = new Map<
        string,
        { prevRoomGID: string | null; viaDoor: Door | null }
      >();

      const setIfUnset = (
        gid: string,
        value: { prevRoomGID: string | null; viaDoor: Door | null },
      ) => {
        if (!prev.has(gid)) prev.set(gid, value);
      };

      const getRoomGID = (r: Room | undefined) =>
        (r as any)?.globalId as string | undefined;

      const allowRoom = (r: Room) =>
        !samePathOnly || (r as any).pathId === startPathId;

      const startGid = getRoomGID(start);
      if (!startGid) return null;
      visited.add(startGid);
      setIfUnset(startGid, { prevRoomGID: null, viaDoor: null });

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        const currentGid = getRoomGID(current);
        if (!currentGid) continue;

        if (current === target) {
          // Reconstruct door path by backtracking from target to start
          const doors: Door[] = [];
          let cursorGid: string | undefined = currentGid;
          while (cursorGid && cursorGid !== startGid) {
            const entry = prev.get(cursorGid);
            if (!entry) break;
            if (entry.viaDoor) doors.push(entry.viaDoor);
            cursorGid = entry.prevRoomGID || undefined;
          }
          doors.reverse();
          return doors;
        }

        const doors = (current as any).doors as Array<Door> | undefined;
        if (!doors) continue;
        for (const door of doors) {
          const nextRoom = (door as any)?.linkedDoor?.room as Room | undefined;
          if (!nextRoom) continue;
          if (!allowRoom(nextRoom)) continue;
          const nextGid = getRoomGID(nextRoom);
          if (!nextGid || visited.has(nextGid)) continue;
          visited.add(nextGid);
          setIfUnset(nextGid, { prevRoomGID: currentGid, viaDoor: door });
          queue.push(nextRoom);
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  // getWalkableNeighborNear removed: we now allow dots on doors and downladders

  /**
   * Builds an in-room path (list of world tile positions) from (sx,sy) to (tx,ty).
   * Uses the room's A* configuration. If the target tile is not walkable, pass a
   * walkable adjacent tile as the target and append the original target afterwards for display.
   */
  buildTilePathPositions = (
    sx: number,
    sy: number,
    tx: number,
    ty: number,
  ): Array<{ x: number; y: number }> => {
    // Build grid mirroring findPath()
    const grid: any[][] = [];
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        const roomX = this.roomX + x;
        const roomY = this.roomY + y;
        if (this.roomArray[roomX] && this.roomArray[roomX][roomY])
          grid[x][y] = this.roomArray[roomX][roomY];
        else grid[x][y] = false;
      }
    }

    const startGridPos = { x: sx - this.roomX, y: sy - this.roomY };
    const targetGridPos = { x: tx - this.roomX, y: ty - this.roomY };

    const moves = astar.AStar.search(
      grid,
      startGridPos,
      targetGridPos,
      undefined,
      false,
      false,
      false,
    );

    const path = moves.map((m) => ({
      x: m.pos.x + this.roomX,
      y: m.pos.y + this.roomY,
    }));
    return path;
  };

  // #endregion

  // #region MISC

  /**
   * Adds a new BeamEffect to the room.
   *
   * @param x1 - Starting tile X coordinate.
   * @param y1 - Starting tile Y coordinate.
   * @param x2 - Ending tile X coordinate.
   * @param y2 - Ending tile Y coordinate.
   */
  public addBeamEffect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    parent: Entity,
  ): void {
    const beam = new BeamEffect(x1, y1, x2, y2, parent);
    this.beamEffects.push(beam);
  }

  public async changeReverb(newImpulsePath: string) {
    await ReverbEngine.setReverbImpulse(newImpulsePath);
  }
  get roomArea() {
    let area = (this.width - 2) * (this.height - 2);
    let openTiles = [];
    for (let x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        if (this.roomArray[x][y] instanceof Floor) openTiles.push({ x, y });
      }
    }
    //console.log(area, openTiles.length);
    return openTiles.length;
  }
  /**
   * Determines if the room is currently on screen.
   * Uses a buffer of 2 tiles beyond the room's dimensions to account for partial visibility.
   *
   * @returns {boolean} - True if the room is on screen, otherwise false.
   */
  public roomOnScreen(player: Player) {
    const tileSize = GameConstants.TILESIZE;

    // Calculate room boundaries with a buffer of 2 tiles
    const roomLeft = (this.roomX - 2) * tileSize;
    const roomRight = (this.roomX + this.width + 2) * tileSize;
    const roomTop = (this.roomY - 2) * tileSize;
    const roomBottom = (this.roomY + this.height + 2) * tileSize;

    // Convert player position from tiles to pixels
    const playerPosX = player.x * tileSize;
    const playerPosY = player.y * tileSize;

    // Calculate camera position in pixels
    const cameraX =
      playerPosX -
      player.drawX +
      0.5 * tileSize -
      0.5 * GameConstants.WIDTH -
      this.game.screenShakeX; // X-coordinate of the camera's top-left corner
    const cameraY =
      playerPosY -
      player.drawY +
      0.5 * tileSize -
      0.5 * GameConstants.HEIGHT - // Corrected from WIDTH to HEIGHT
      this.game.screenShakeY; // Y-coordinate of the camera's top-left corner
    const cameraWidth = GameConstants.WIDTH; // Corrected from innerWidth
    const cameraHeight = GameConstants.HEIGHT; // Corrected from innerHeight

    // Define the camera's boundaries
    const cameraLeft = cameraX;
    const cameraRight = cameraX + cameraWidth;
    const cameraTop = cameraY;
    const cameraBottom = cameraY + cameraHeight;

    // Check if the room's boundaries overlap with the camera's view
    const isOverlapping = !(
      roomRight < cameraLeft ||
      roomLeft > cameraRight ||
      roomBottom < cameraTop ||
      roomTop > cameraBottom
    );

    this.onScreen = isOverlapping;
  }

  // Returns true if a given tile coordinate is on screen, with optional buffer in tiles
  public isTileOnScreen(
    x: number,
    y: number,
    bufferTiles: number = 0,
  ): boolean {
    const tileSize = GameConstants.TILESIZE;

    // Convert player position from tiles to pixels
    const playerPosX = this.game.players[this.game.localPlayerID]
      ? this.game.players[this.game.localPlayerID].x * tileSize
      : 0;
    const playerPosY = this.game.players[this.game.localPlayerID]
      ? this.game.players[this.game.localPlayerID].y * tileSize
      : 0;

    // Use same camera computation as roomOnScreen
    const cameraX =
      playerPosX -
      (this.game.players[this.game.localPlayerID]?.drawX || 0) +
      0.5 * tileSize -
      0.5 * GameConstants.WIDTH -
      this.game.screenShakeX;
    const cameraY =
      playerPosY -
      (this.game.players[this.game.localPlayerID]?.drawY || 0) +
      0.5 * tileSize -
      0.5 * GameConstants.HEIGHT -
      this.game.screenShakeY;
    const cameraWidth = GameConstants.WIDTH;
    const cameraHeight = GameConstants.HEIGHT;

    const bufferPx = bufferTiles * tileSize;
    const cameraLeft = cameraX - bufferPx;
    const cameraRight = cameraX + cameraWidth + bufferPx;
    const cameraTop = cameraY - bufferPx;
    const cameraBottom = cameraY + cameraHeight + bufferPx;

    // Tile bounds in pixels
    const tileLeft = x * tileSize;
    const tileRight = tileLeft + tileSize;
    const tileTop = y * tileSize;
    const tileBottom = tileTop + tileSize;

    // Axis-aligned rectangle intersection test
    const intersects = !(
      tileRight < cameraLeft ||
      tileLeft > cameraRight ||
      tileBottom < cameraTop ||
      tileTop > cameraBottom
    );
    return intersects;
  }

  // Returns inclusive bounds for tiles visible on screen with an optional buffer.
  // The bounds are clamped to the room tile rectangle.
  public getVisibleTileBounds(bufferTiles: number = 0): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const tileSize = GameConstants.TILESIZE;

    // Convert player position from tiles to pixels
    const playerPosX = this.game.players[this.game.localPlayerID]
      ? this.game.players[this.game.localPlayerID].x * tileSize
      : 0;
    const playerPosY = this.game.players[this.game.localPlayerID]
      ? this.game.players[this.game.localPlayerID].y * tileSize
      : 0;

    // Compute camera in pixels (top-left origin)
    const cameraX =
      playerPosX -
      (this.game.players[this.game.localPlayerID]?.drawX || 0) +
      0.5 * tileSize -
      0.5 * GameConstants.WIDTH -
      this.game.screenShakeX;
    const cameraY =
      playerPosY -
      (this.game.players[this.game.localPlayerID]?.drawY || 0) +
      0.5 * tileSize -
      0.5 * GameConstants.HEIGHT -
      this.game.screenShakeY;
    const cameraWidth = GameConstants.WIDTH;
    const cameraHeight = GameConstants.HEIGHT;

    // Expand by buffer in pixels
    const bufferPx = bufferTiles * tileSize;
    const cameraLeft = cameraX - bufferPx;
    const cameraRight = cameraX + cameraWidth + bufferPx;
    const cameraTop = cameraY - bufferPx;
    const cameraBottom = cameraY + cameraHeight + bufferPx;

    // Convert to tile indices (inclusive). Use floor for min, ceil for max.
    let minX = Math.floor(cameraLeft / tileSize);
    let maxX = Math.ceil(cameraRight / tileSize) - 1;
    let minY = Math.floor(cameraTop / tileSize);
    let maxY = Math.ceil(cameraBottom / tileSize) - 1;

    // Clamp to room bounds
    const roomMinX = this.roomX;
    const roomMaxX = this.roomX + this.width - 1;
    const roomMinY = this.roomY;
    const roomMaxY = this.roomY + this.height - 1;

    if (minX < roomMinX) minX = roomMinX;
    if (maxX > roomMaxX) maxX = roomMaxX;
    if (minY < roomMinY) minY = roomMinY;
    if (maxY > roomMaxY) maxY = roomMaxY;

    return { minX, maxX, minY, maxY };
  }

  private setReverb() {
    const roomArea = this.roomArea;
    if (roomArea < 10) {
      this.changeReverb(`res/SFX/impulses/small.mp3`);
    } else if (roomArea < 55) {
      this.changeReverb(`res/SFX/impulses/medium.mp3`);
    } else {
      this.changeReverb(`res/SFX/impulses/large.mp3`);
    }
  }

  // #endregion

  /**
   * Adds a door with offset to prevent overlapping doors.
   * If a door already exists at the desired (x, y) position, it offsets the door randomly to either side.
   * Ensures the new door is at least one tile away from the room's edge based on its direction.
   *
   * @param x - The x-coordinate for the door placement.
   * @param y - The y-coordinate for the door placement.
   * @param room - The Room object where the door is being placed. Defaults to the current room.
   * @param tunnelDoor - Whether the door is a tunnel door. Defaults to false.
   * @returns The created Door object or null if placement failed.
   */
  addDoorWithOffset = (
    x: number,
    y: number,
    room: Room = this,
    tunnelDoor: boolean = false,
  ) => {
    // Helper function to check if any vending machine is at a position
    const hasVendingMachineAt = (checkX: number, checkY: number): boolean => {
      return room.entities.some(
        (entity) =>
          entity instanceof VendingMachine &&
          entity.x === checkX &&
          entity.y === checkY,
      );
    };

    // Check if a door already exists at the desired position
    if (room.roomArray[x]?.[y] instanceof Door) {
      // Determine the direction based on the door's position
      let direction: Direction | null = null;
      if (x === room.roomX) {
        direction = Direction.RIGHT;
      } else if (x === room.roomX + room.width - 1) {
        direction = Direction.LEFT;
      } else if (y === room.roomY) {
        direction = Direction.DOWN;
      } else if (y === room.roomY + room.height - 1) {
        direction = Direction.UP;
      }

      if (!direction) {
        // console.log("Invalid door position.");
        return null;
      }

      // Define possible offset adjustments based on door direction
      const offsetOptions: Array<{ dx: number; dy: number }> = [];
      switch (direction) {
        case Direction.RIGHT:
        case Direction.LEFT:
          // Offsets along the y-axis for vertical walls
          offsetOptions.push({ dx: 0, dy: 1 }, { dx: 0, dy: -1 });
          break;
      }

      // Shuffle the offset options to randomize placement
      const shuffledOffsets = offsetOptions.sort(() => Random.rand() - 0.5);

      // Check if original position has vending machine
      if (hasVendingMachineAt(x, y)) {
        return null;
      }

      for (const offset of shuffledOffsets) {
        const newX = x + offset.dx;
        const newY = y + offset.dy;

        // Ensure the new position is within bounds and not on the edge
        const isWithinBounds =
          newX > room.roomX &&
          newX < room.roomX + room.width - 1 &&
          newY > room.roomY &&
          newY < room.roomY + room.height - 1;

        if (
          isWithinBounds &&
          !(room.roomArray[newX]?.[newY] instanceof Door) &&
          !hasVendingMachineAt(newX, newY)
        ) {
          // Offset the door placement
          return room.addDoor(newX, newY, room, tunnelDoor);
        }
      }

      return null;
    }

    // Check for vending machine at original position before placing door normally
    if (hasVendingMachineAt(x, y)) {
      return null;
    }

    // If no door exists at the desired position and no vending machine, place it normally
    return room.addDoor(x, y, room, tunnelDoor);
  };

  findPathToDoor = (door: Door) => {
    let disablePositions = Array<astar.Position>();
    for (const e of this.entities) {
      disablePositions.push({ x: e.x, y: e.y } as astar.Position);
    }
    const path = astar.AStar.search(
      this.roomArray,
      this,
      door,
      [],
      false,
      false,
      false,
    );
    return path;
  };

  /**
   * Finds all wall tiles that do not have a door in them or adjacent to them.
   * @returns An array of wall tiles without doors or adjacent doors.
   */
  getEmptyWall(): Wall[] {
    const emptyWalls: Wall[] = [];

    for (let x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
      for (let y = this.roomY - 1; y < this.roomY + this.height - 1; y++) {
        const tile = this.roomArray[x][y];

        if (tile instanceof Wall || tile instanceof WallTorch) {
          // Check if the current wall tile is not a door
          if (!(tile instanceof Door)) {
            // Check adjacent tiles for doors
            const adjacentTiles = [
              this.roomArray[x + 1]?.[y],
              this.roomArray[x - 1]?.[y],
              this.roomArray[x]?.[y + 1],
              this.roomArray[x]?.[y - 1],
            ];

            const hasAdjacentDoor = adjacentTiles.some(
              (adjTile) => adjTile instanceof Door,
            );

            if (!hasAdjacentDoor) {
              emptyWalls.push(tile);
            }
          }
        }
      }
    }
    return emptyWalls;
  }

  pointExists = (x: number, y: number) => {
    return this.roomArray[x] && this.roomArray[x][y];
  };

  /**
   * Removes a specified empty wall from the room.
   * @param wall - The wall tile to remove.
   * @returns An object containing the x and y coordinates of the removed wall.
   */
  removeEmptyWall(wall: Wall): { x: number; y: number } | null {
    if (!(wall instanceof Wall)) return null;

    const { x, y } = wall;

    // Replace the wall with a Floor tile to maintain room integrity
    this.roomArray[x][y] = new Floor(this, x, y);

    // Remove from innerWalls or outerWalls if applicable
    const initialInnerWallsCount = this.innerWalls.length;
    this.innerWalls = this.innerWalls.filter((w) => w !== wall);
    const finalInnerWallsCount = this.innerWalls.length;

    return { x, y };
  }

  /**
   * Places a VendingMachine in an empty wall.
   */
  placeVendingMachineInWall(item?: Item): void {
    let emptyWalls = this.getEmptyWall();
    emptyWalls = emptyWalls.filter((wall) => {
      const wallInfo = wall.wallInfo();
      return wallInfo && !wallInfo.isInnerWall;
    });
    if (emptyWalls.length === 0) return;

    // Select a random empty wall
    const selectedWall = Game.randTable(emptyWalls, Random.rand);
    if (!selectedWall) return;

    // Remove the selected wall
    const removedWallInfo = this.removeEmptyWall(selectedWall);
    if (!removedWallInfo) return;

    const { x, y } = removedWallInfo;

    // Create and add the VendingMachine
    this.addVendingMachine(Random.rand, x, y, item);
  }

  // Add methods to manage blur cache
  private invalidateBlurCache = () => {
    this.blurCache.isValid = false;
    this.blurCache.lastLightingUpdate = this.lastLightingUpdate;
  };

  private shouldUseBlurCache = (): boolean => {
    return (
      !this.active &&
      this.blurCache.isValid &&
      this.blurCache.lastLightingUpdate === this.lastLightingUpdate
    );
  };

  readonly getPlayer = () => {
    for (const i in this.game.players) {
      if ((this.game.players[i] as any).getRoom?.() === this) {
        return this.game.players[i];
      }
    }
    return null;
  };

  private cacheBlurResult = (
    type: "color6px" | "color12px" | "shade5px" | "bloom8px" | "color8px",
    canvas: HTMLCanvasElement,
  ) => {
    if (!this.active) {
      // Clone the canvas to cache it
      const cachedCanvas = document.createElement("canvas");
      cachedCanvas.width = canvas.width;
      cachedCanvas.height = canvas.height;
      const ctx = cachedCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
        this.blurCache[type] = cachedCanvas;
        this.blurCache.isValid = true;
        this.blurCache.lastLightingUpdate = this.lastLightingUpdate;
      }
    }
  };
}
