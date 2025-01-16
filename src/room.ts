// #region imports
import { Wall } from "./tile/wall";
import { LevelConstants } from "./levelConstants";
import { Floor } from "./tile/floor";
import { Direction, Game, LevelState } from "./game";
import { Door, DoorType } from "./tile/door";
import { Tile, SkinType } from "./tile/tile";
import { KnightEnemy } from "./entity/enemy/knightEnemy";
import { Entity, EntityType } from "./entity/entity";
import { Chest } from "./entity/object/chest";
import { Item } from "./item/item";
import { GoldenKey } from "./item/goldenKey";
import { SpawnFloor } from "./tile/spawnfloor";
import { Spike } from "./tile/spike";
import { GameConstants } from "./gameConstants";
import { SkullEnemy } from "./entity/enemy/skullEnemy";
import { Barrel } from "./entity/object/barrel";
import { Crate } from "./entity/object/crate";
import { Armor } from "./item/armor";
import { Particle } from "./particle/particle";
import { Projectile } from "./projectile/projectile";
import { SpikeTrap } from "./tile/spiketrap";
import { FountainTile } from "./tile/fountainTile";
import { CoffinTile } from "./tile/coffinTile";
import { PottedPlant } from "./entity/object/pottedPlant";
import { InsideLevelDoor } from "./tile/insideLevelDoor";
import { Button } from "./tile/button";
import { HitWarning } from "./hitWarning";
import { UpLadder } from "./tile/upLadder";
import { DownLadder } from "./tile/downLadder";
import { CoalResource } from "./entity/resource/coalResource";
import { GoldResource } from "./entity/resource/goldResource";
import { EmeraldResource } from "./entity/resource/emeraldResource";
import { Chasm } from "./tile/chasm";
import { Spawner } from "./entity/enemy/spawner";
import { VendingMachine } from "./entity/object/vendingMachine";
import { WallTorch } from "./tile/wallTorch";
import { LightSource } from "./lightSource";
import { ChargeEnemy } from "./entity/enemy/chargeEnemy";
import { Shotgun } from "./weapon/shotgun";
import { Heart } from "./item/heart";
import { Spear } from "./weapon/spear";
import { Drawable } from "./drawable";
import { Player, PlayerDirection } from "./player";
import { CrabEnemy } from "./entity/enemy/crabEnemy";
import { ZombieEnemy } from "./entity/enemy/zombieEnemy";
import { BigSkullEnemy } from "./entity/enemy/bigSkullEnemy";
import { Random } from "./random";
import { Lantern } from "./item/lantern";
import { DualDagger } from "./weapon/dualdagger";
import { Pot } from "./entity/object/pot";
import { BishopEnemy } from "./entity/enemy/bishopEnemy";
import { Rock } from "./entity/resource/rockResource";
import { Mushrooms } from "./entity/object/mushrooms";
import { ArmoredzombieEnemy } from "./entity/enemy/armoredzombieEnemy";
import { TombStone } from "./entity/object/tombStone";
import { Pumpkin } from "./entity/object/pumpkin";
import { QueenEnemy } from "./entity/enemy/queenEnemy";
import { FrogEnemy } from "./entity/enemy/frogEnemy";
import { BigKnightEnemy } from "./entity/enemy/bigKnightEnemy";
import { Enemy } from "./entity/enemy/enemy";
import { FireWizardEnemy } from "./entity/enemy/fireWizard";
import { EnergyWizardEnemy } from "./entity/enemy/energyWizard";
import { ReverbEngine } from "./reverb";
import { astar } from "./astarclass";
import { Level } from "./level";
import { Warhammer } from "./weapon/warhammer";
import { Spellbook } from "./weapon/spellbook";
import { Torch } from "./item/torch";
import { RookEnemy } from "./entity/enemy/rookEnemy";
import { BeamEffect } from "./beamEffect";
import { EnvType } from "./environment";
import { Pickaxe } from "./weapon/pickaxe";
import { OccultistEnemy } from "./entity/enemy/occultistEnemy";
import { Puddle } from "./tile/decorations/puddle";
import { Decoration } from "./tile/decorations/decoration";
import { Bomb } from "./entity/object/bomb";
import { Sound } from "./sound";
import { Block } from "./entity/object/block";
import { Bestiary } from "./bestiary";
import { ArmoredSkullEnemy } from "./entity/enemy/armoredSkullEnemy";

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
  // Add other enemy mappings here
};

export enum RoomType {
  START,
  DUNGEON,
  BOSS,
  BIGDUNGEON,
  TREASURE,
  FOUNTAIN,
  COFFIN,
  GRASS,
  PUZZLE,
  KEYROOM,
  CHESSBOARD,
  MAZE,
  CORRIDOR,
  SPIKECORRIDOR,
  UPLADDER,
  DOWNLADDER,
  SHOP,
  BIGCAVE,
  CAVE,
  SPAWNER,
  ROPEHOLE,
  ROPECAVE,
  TUTORIAL,
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

interface RoomDimensions {
  width: number;
  height: number;
}

interface EntitySpawnConfig {
  name: Entity["name"];
  weight: number;
}

export interface EnemyStatic {
  add(room: Room, game: Game, x: number, y: number, ...rest: any[]): void;
}

// #endregion

export class Room {
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
  savePoint: Room;
  lastEnemyCount: number;
  outerWalls: Array<Wall>;
  level: Level;
  id: number;
  tunnelDoor: Door = null; // this is the door that connects the start room to the exit room
  active: boolean;
  onScreen: boolean;
  lastLightingUpdate: number;
  walls: Array<Wall>;
  decorations: Array<Decoration>;
  blurOffsetX: number = 5;
  blurOffsetY: number = 5;
  lastDraw: number = 0;
  drawTimestamp: number = 0;
  drawInterval: number = 4;

  // Add a list to keep track of BeamEffect instances
  beamEffects: BeamEffect[] = [];

  // Add this property to track created mask canvases
  private maskCanvases: HTMLCanvasElement[] = [];

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
  ) {
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
    this.skin = this.level.environment.skin;
    if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
      this.skin = SkinType.CAVE;
    this.buildEmptyRoom();

    // #endregion
  }

  // #region TILE ADDING METHODS

  private buildEmptyRoom() {
    // fill in wall and floor
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (
          this.pointInside(
            x,
            y,
            this.roomX + 1,
            this.roomY + 1,
            this.width - 2,
            this.height - 2,
          )
        ) {
          this.roomArray[x][y] = new Floor(this, x, y);
        } else {
          this.roomArray[x][y] = new Wall(
            this,
            x,
            y,
            this.getWallType(
              x,
              y,
              this.roomX,
              this.roomY,
              this.width,
              this.height,
            ),
          );
        }
      }
    }
  }

  private removeWall = (x: number, y: number) => {
    if (this.roomArray[x][y] instanceof Wall) {
      this.roomArray[x][y] = null;
    }
    //this.innerWalls = this.innerWalls.filter((w) => w.x !== x && w.y !== y);
    //this.outerWalls = this.outerWalls.filter((w) => w.x !== x && w.y !== y);
  };

  private getWallType = (
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
  ): Array<WallDirection> => {
    let directions: Array<WallDirection> = [];
    if (pointY === rectY && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.NORTH);
    if (pointY === rectY + height && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.SOUTH);
    if (pointX === rectX && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.WEST);
    if (pointX === rectX + width && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.EAST);
    return directions;
  };

  private addWallBlocks(rand: () => number) {
    let numBlocks = Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
    if (this.width > 8 && rand() > 0.5) numBlocks *= 4;
    for (let i = 0; i < numBlocks; i++) {
      let blockW = Math.min(
        Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand),
        this.width - 4,
      );
      let blockH = Math.min(blockW + Game.rand(-2, 2, rand), this.height - 4);

      let x = Game.rand(
        this.roomX + 2,
        this.roomX + this.width - blockW - 2,
        rand,
      );
      let y = Game.rand(
        this.roomY + 2,
        this.roomY + this.height - blockH - 2,
        rand,
      );
      let neighborCount = (wall: Wall) => {
        let count = 0;
        for (let xx = wall.x - 1; xx <= wall.x + 1; xx++) {
          for (let yy = wall.y - 1; yy <= wall.y + 1; yy++) {
            if (
              this.roomArray[xx]?.[yy] instanceof Wall &&
              !(xx === wall.x && yy === wall.y)
            )
              count++;
          }
        }
        return count;
      };

      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          let w = new Wall(this, xx, yy);
          this.roomArray[xx][yy] = w;
          this.innerWalls.push(w);
        }
      }
      this.innerWalls.forEach((wall) => {
        if (neighborCount(wall) <= 1) {
          this.removeWall(wall.x, wall.y);
          this.roomArray[wall.x][wall.y] = new Floor(this, wall.x, wall.y);
          this.innerWalls = this.innerWalls.filter((w) => w !== wall);
        }
      });
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

    for (let i = 0; i < numTorches; i++) {
      if (walls.length == 0) return;
      const randomIndex = Game.rand(0, walls.length - 1, rand);
      const t = walls.splice(randomIndex, 1)[0];
      const x = t.x;
      const y = t.y;
      this.roomArray[x][y] = new WallTorch(this, x, y);
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
      console.log("door not added");
    }
    room.roomArray[d.x][d.y] = d;

    return d;
  };

  // ... start of file ...

  private addSpikeTraps(numSpikes: number, rand: () => number) {
    if (this.level.environment.type === EnvType.FOREST) return;
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
        console.log(`No tiles left to spawn enemies`);
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
        let type = Game.randTable(tables[d], Math.random);

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
            ZombieEnemy.add(this, this.game, x, y);
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
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ];
    if (this.depth > 1) {
      let occultistAmount = Game.randTable(occultistAmounts, rand);
      //console.log(`Adding ${occultistAmount} occultists`);
      this.addOccultists(occultistAmount, rand);
    }
  }

  private addRandomEnemies() {
    let numEmptyTiles = this.getEmptyTiles().length;

    let numEnemies = Math.ceil(
      numEmptyTiles * Math.min(this.depth * 0.1 + 0.5, 0.15), //this.depth * 0.01 is starting value
    );
    if (numEnemies > numEmptyTiles / 2) numEnemies = numEmptyTiles / 2;
    this.addEnemies(numEnemies, Math.random);
  }

  private addSpawners(numSpawners: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }
    for (let i = 0; i < numSpawners; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      let spawnTable = this.level
        .getEnemyParameters()
        .enemyTables[this.depth].filter((t) => t !== 7);
      Spawner.add(this, this.game, x, y, spawnTable);
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
      OccultistEnemy.add(this, this.game, x, y);
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

    const { x, y } = this.getRandomEmptyPosition(tiles);
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
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.entities.push(new Chest(this, this.game, x, y));
    }
  }

  private addObstacles(numObstacles: number, rand: () => number) {
    // add crates/barrels
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numObstacles; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      const env = this.level.environment.type; //bootleg variable to start to vary the environments
      switch (
        Game.randTable(
          [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 5, 5,
            6, 6, 6, 6, 6, 6, 6,
          ],
          rand,
        )
      ) {
        case 1:
          if (env === EnvType.FOREST) break;
          Crate.add(this, this.game, x, y);
          break;
        case 2:
          if (env === EnvType.FOREST) break;

          Barrel.add(this, this.game, x, y);
          break;
        case 3:
          if (env === EnvType.CAVE) break;
          TombStone.add(this, this.game, x, y, 1);
          break;
        case 4:
          if (env === EnvType.CAVE) break;

          TombStone.add(this, this.game, x, y, 0);
          break;
        case 5:
          if (env === EnvType.CAVE) break;

          Pumpkin.add(this, this.game, x, y);
          break;
        case 6:
          Block.add(this, this.game, x, y);
          break;
      }
    }
  }

  addBombs(numBombs: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < this.getEmptyTiles().length; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      Bomb.add(this, this.game, x, y);
    }
  }

  private addPlants(numPlants: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numPlants; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);

      let r = rand();
      if (r <= 0.45) PottedPlant.add(this, this.game, x, y);
      else if (r <= 0.65) Pot.add(this, this.game, x, y);
      else if (r <= 0.75) Rock.add(this, this.game, x, y);
      else if (r <= 0.97) Mushrooms.add(this, this.game, x, y);
      else Chest.add(this, this.game, x, y);
    }
  }

  private addDecorations(numDecorations: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numDecorations; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.decorations.push(new Puddle(this, x, y));
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
  ) {
    const pos = this.getRandomEmptyPosition(this.getEmptyTiles());

    let x = placeX ? placeX : pos.x;
    let y = placeY ? placeY : pos.y;

    let table =
      this.depth > 0
        ? [1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        : [1, 1, 1];
    let type = Game.randTable(table, rand);
    switch (type) {
      case 1:
        VendingMachine.add(this, this.game, x, y, new Heart(this, x, y));
        break;
      case 2:
        VendingMachine.add(this, this.game, x, y, new Lantern(this, x, y));
        break;
      case 3:
        VendingMachine.add(this, this.game, x, y, new Armor(this, x, y));
        break;
      case 4:
        VendingMachine.add(this, this.game, x, y, new DualDagger(this, x, y));
        break;
      case 5:
        VendingMachine.add(this, this.game, x, y, new Spear(this, x, y));
        break;
      case 6:
        VendingMachine.add(this, this.game, x, y, new Shotgun(this, x, y));
        break;
      case 7:
        VendingMachine.add(this, this.game, x, y, new Warhammer(this, x, y));
        break;
      case 8:
        VendingMachine.add(this, this.game, x, y, new Spellbook(this, x, y));
        break;
      case 9:
        VendingMachine.add(this, this.game, x, y, new Torch(this, x, y));
        break;
    }
  }

  // #endregion

  // #region POPULATING METHODS

  linkExitToStart = () => {
    //if (this.type === RoomType.ROPEHOLE) return;
    if (
      this.addDoorWithOffset(
        this.level.startRoom.roomX +
          Math.floor(this.level.startRoom.width / 2) +
          1,
        this.level.startRoom.roomY,
        this.level.startRoom,
        true,
      ) &&
      this.addDoorWithOffset(
        this.roomX + Math.floor(this.width / 2) - 1,
        this.roomY,
        this,
        true,
      )
    ) {
      this.tunnelDoor.linkedDoor = this.level.startRoom.tunnelDoor;
      this.tunnelDoor.linkedDoor.linkedDoor = this.tunnelDoor;
    }
  };

  populateEmpty = (rand: () => number) => {
    this.addTorchesByArea();
  };

  populateDungeon = (rand: () => number) => {
    //this.addChests(10, rand);
    let factor = Game.rand(1, 36, rand);

    if (factor < 30) this.addWallBlocks(rand);
    if (factor % 4 === 0) this.addChasms(rand);
    this.addTorchesByArea();
    if (factor > 15)
      this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 3], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
    let numPlants = Math.ceil(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    //this.addDecorations(Game.randTable([0, 0, 0, 1, 1, 2, 3], rand), rand);
    this.addObstacles(numObstacles, rand);

    if (factor <= 6) this.addVendingMachine(rand);
    this.addRandomEnemies();

    this.removeDoorObstructions();
  };

  populateBoss = (rand: () => number) => {
    this.addTorchesByArea();

    this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.2);
    let numPlants = Math.floor(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    this.addObstacles(numObstacles, rand);

    this.addRandomEnemies();
  };

  populateBigDungeon = (rand: () => number) => {
    if (Game.rand(1, 4, rand) === 1) this.addChasms(rand);
    this.addTorchesByArea();

    if (Game.rand(1, 4, rand) === 1)
      this.addPlants(
        Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
        rand,
      );
    if (Game.rand(1, 3, rand) === 1)
      this.addSpikeTraps(Game.randTable([3, 5, 7, 8], rand), rand);
    this.addRandomEnemies();

    this.addObstacles(Game.randTable([0, 0, 1, 1, 2, 3, 5], rand), rand);
    this.removeDoorObstructions();
  };

  populateSpawner = (rand: () => number) => {
    this.addTorchesByArea();

    Spawner.add(
      this,
      this.game,
      Math.floor(this.roomX + this.width / 2),
      Math.floor(this.roomY + this.height / 2),
    );
    this.removeDoorObstructions();
  };

  populateKeyRoom = (rand: () => number) => {
    this.addRandomTorches("medium");

    this.items.push(
      new GoldenKey(
        this,
        Math.floor(this.roomX + this.width / 2),
        Math.floor(this.roomY + this.height / 2),
      ),
    );
  };

  populateFountain = (rand: () => number) => {
    this.addRandomTorches("medium");

    let centerX = Math.floor(this.roomX + this.width / 2);
    let centerY = Math.floor(this.roomY + this.height / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        this.roomArray[x][y] = new FountainTile(
          this,
          x,
          y,
          x - (centerX - 1),
          y - (centerY - 1),
        );
      }
    }

    this.addPlants(Game.randTable([0, 0, 1, 2], rand), rand);
  };

  placeCoffin = (x: number, y: number) => {
    this.roomArray[x][y] = new CoffinTile(this, x, y, 0);
    this.roomArray[x][y + 1] = new CoffinTile(this, x, y + 1, 1);
  };

  populateCoffin = (rand: () => number) => {
    this.addRandomTorches("medium");

    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2 - 2),
      Math.floor(this.roomY + this.height / 2),
    );
    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2),
      Math.floor(this.roomY + this.height / 2),
    );
    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2) + 2,
      Math.floor(this.roomY + this.height / 2),
    );
  };

  populatePuzzle = (rand: () => number) => {
    let d;

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      let y = this.roomY + Math.floor(this.height / 2);
      if (x === this.roomX + Math.floor(this.width / 2)) {
        d = new InsideLevelDoor(this, this.game, x, y + 1);
        this.roomArray[x][y + 1] = d;
      } else {
        this.roomArray[x][y] = new Wall(this, x, y);
      }
    }

    let x = Game.rand(this.roomX, this.roomX + this.width - 1, rand);
    let y = Game.rand(
      this.roomY + Math.floor(this.height / 2) + 3,
      this.roomY + this.height - 2,
      rand,
    );

    this.roomArray[x][y] = new Button(this, x, y, d);

    let crateTiles = this.getEmptyTiles().filter(
      (t) =>
        t.x >= this.roomX + 1 &&
        t.x <= this.roomX + this.width - 2 &&
        t.y >= this.roomY + Math.floor(this.height / 2) + 3 &&
        t.y <= this.roomY + this.height - 2,
    );
    let numCrates = Game.randTable([1, 2, 2, 3, 4], rand);

    for (let i = 0; i < numCrates; i++) {
      let t = crateTiles.splice(
        Game.rand(0, crateTiles.length - 1, rand),
        1,
      )[0];
      if (t) this.entities.push(new Crate(this, this.game, t.x, t.y));
    }
    this.addPlants(
      Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
      rand,
    );
    this.removeDoorObstructions();
  };

  populateSpikeCorridor = (rand: () => number) => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        this.roomArray[x][y] = new SpikeTrap(this, x, y, Game.rand(0, 3, rand));
      }
    }
    this.removeDoorObstructions();
    this.addRandomTorches("medium");
  };

  populateTreasure = (rand: () => number) => {
    this.addRandomTorches("medium");

    this.addChests(Game.randTable([4, 4, 5, 5, 5, 6, 8], rand), rand);
    this.addPlants(Game.randTable([0, 1, 2, 4, 5, 6], rand), rand);
  };

  populateCave = (rand: () => number) => {
    let factor = Game.rand(1, 36, rand);

    this.addWallBlocks(rand);

    if (factor > 15)
      this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles * Game.randTable([0.25, 0.3, 0.35], rand),
    );
    this.addEnemies(numEnemies, rand);
    if (this.level.environment.type === EnvType.CAVE)
      this.addResources(
        (numEmptyTiles - numEnemies) * Game.randTable([0.1, 0.2, 0.3], rand),
        rand,
      );
    this.removeDoorObstructions();
  };

  populateUpLadder = (rand: () => number) => {
    this.addRandomTorches("medium");

    const { x, y } = this.getRoomCenter();
    this.roomArray[x - 1][y - 1] = new UpLadder(this, this.game, x - 1, y - 1);
  };

  populateDownLadder = (rand: () => number) => {
    this.addTorches(1, rand, this.roomX + 3, this.roomY);

    const { x, y } = this.getRoomCenter();
    this.roomArray[x + 1][y - 1] = new DownLadder(
      this,
      this.game,
      x + 1,
      y - 1,
    );

    const numChests = Math.ceil(Math.random() * 5);

    let tiles = this.getEmptyTiles();
    tiles = tiles.filter((tile) => tile.x !== x || tile.y !== y);
    let weaponDropped = false;
    let toolDropped = false;
    let lightDropped = false;
    for (let i = 0; i < numChests; i++) {
      if (tiles.length > 0) {
        const { x, y } = this.getRandomEmptyPosition(tiles);

        let chest = new Chest(this, this.game, x, y);

        if (!weaponDropped) {
          chest.getDrop(["weapon"], true);
          weaponDropped = true;
        } else {
          chest.getDrop(
            ["consumable", "gem", "light", "tool", "fuel", "backpack"],
            true,
          );
        }

        tiles.filter((tile) => tile.x !== x && tile.y !== y);
        this.entities.push(chest);
      }
    }
  };

  populateRopeHole = (rand: () => number) => {
    this.addRandomTorches("medium");

    const { x, y } = this.getRoomCenter();
    let d = new DownLadder(this, this.game, x, y);
    d.isRope = true;
    this.roomArray[x][y] = d;
  };

  populateRopeCave = (rand: () => number) => {
    const { x, y } = this.getRoomCenter();
    let upLadder = new UpLadder(this, this.game, x, y);
    upLadder.isRope = true;
    this.roomArray[x][y] = upLadder;

    this.removeDoorObstructions();
  };

  populateShop = (rand: () => number) => {
    this.addTorches(2, rand);

    const { x, y } = this.getRoomCenter();
    VendingMachine.add(this, this.game, x - 2, y - 1, new Shotgun(this, 0, 0));
    VendingMachine.add(this, this.game, x + 2, y - 1, new Heart(this, 0, 0));
    VendingMachine.add(this, this.game, x - 2, y + 2, new Armor(this, 0, 0));
    VendingMachine.add(this, this.game, x + 2, y + 2, new Spear(this, 0, 0));

    this.removeDoorObstructions();
  };

  // Many populate methods start with adding torches using the same pattern
  private addRandomTorches(
    intensity: "none" | "low" | "medium" | "high" = "medium",
  ): void {
    const torchPatterns = {
      none: [0, 0, 0],
      low: [0, 0, 0, 1, 1],
      medium: [0, 0, 0, 1, 1, 2, 2, 3],
      high: [1, 1, 2, 2, 3, 3, 4],
    };
    const randTorches = Game.randTable(torchPatterns[intensity], Random.rand);
    this.addTorches(randTorches, Random.rand);
  }

  private addTorchesByArea = () => {
    let numTorches = Math.max(
      1,
      Math.floor(Math.sqrt(this.roomArea) / 3) -
        Math.floor(Math.sqrt(this.depth)),
    );
    if (this.depth === 0) {
      if (Math.random() < 0.25) {
        numTorches = 0;
      }
    } else {
      // Exponential falloff starting at depth 1, approaching 90% chance
      const falloffRate = 0.4; // Controls how quickly it approaches 90%
      const maxChance = 0.9;
      const chance =
        maxChance * (1 - Math.exp(-falloffRate * (this.depth - 1)));
      if (Math.random() < chance) {
        numTorches = 0;
      }
    }
    console.log("numTorches:" + numTorches, "roomArea" + this.roomArea);
    this.addTorches(numTorches, Random.rand);
  };

  // Used in populateDungeon, populateCave, etc. NOT IN USE
  private populateWithEntities(config: {
    enemyDensity: number;
    obstacleDensity: number;
    plantDensity: number;
  }): void {
    const numEmptyTiles = this.getEmptyTiles().length;
    const numEnemies = Math.ceil(numEmptyTiles * config.enemyDensity);
    const numObstacles = Math.ceil(numEmptyTiles * config.obstacleDensity);
    const numPlants = Math.ceil(numEmptyTiles * config.plantDensity);

    this.addEnemies(numEnemies, Random.rand);
    this.addObstacles(numObstacles, Random.rand);
    this.addPlants(numPlants, Random.rand);
  }

  populate = (rand: () => number) => {
    this.name = "";
    switch (this.type) {
      case RoomType.START:
        //this.addNewEnemy(EnemyType.zombie);
        //this.addNewEnemy(EnemyType.occultist);
        //this.addNewEnemy(EnemyType.occultist);

        //   this.addNewEnemy(EnemyType.occultist);

        if (this.depth !== 0) {
          this.populateUpLadder(rand);
          //this.addVendingMachine(rand, this.roomX + 1, this.roomY + 1);
          this.placeVendingMachineInWall();
        }

        this.populateEmpty(rand);
        this.name = "FLOOR " + -this.depth;
        if (this.level.environment.type === EnvType.CAVE) {
          const { x, y } = this.getRoomCenter();
          let sign = Math.random() < 0.5 ? -1 : 1;
          let offsetX = Math.floor(Math.random()) * sign;
          let offsetY = offsetX !== 0 ? 0 : sign;
          this.items.push(new Pickaxe(this, x + offsetX, y + offsetY));
        }
        break;
      case RoomType.BOSS:
        this.populateBoss(rand);
        this.name = "BOSS";
        break;
      case RoomType.DUNGEON:
        if (
          this.level.environment.type === EnvType.CAVE &&
          Math.random() <= 0.2
        ) {
          this.populateCave(rand);
        } else {
          this.populateDungeon(rand);
        }
        break;
      case RoomType.BIGDUNGEON:
        this.populateBigDungeon(rand);
        break;
      case RoomType.FOUNTAIN:
        this.populateFountain(rand);
        break;
      case RoomType.COFFIN:
        this.populateCoffin(rand);
        break;
      case RoomType.PUZZLE:
        this.populatePuzzle(rand);
        break;
      case RoomType.SPIKECORRIDOR:
        this.populateSpikeCorridor(rand);
        break;
      case RoomType.TREASURE:
        this.populateTreasure(rand);
        break;
      case RoomType.KEYROOM:
        this.populateKeyRoom(rand);
        break;
      case RoomType.GRASS:
        this.populateDungeon(rand);
        break;
      case RoomType.BIGCAVE:
        this.populateCave(rand);
      case RoomType.CAVE:
        this.populateCave(rand);
        break;
      case RoomType.UPLADDER:
        this.populateUpLadder(rand);
        this.name = "FLOOR " + -this.depth;

        break;
      case RoomType.DOWNLADDER:
        this.populateDownLadder(rand);
        this.name = "FLOOR " + -this.depth;
        break;
      case RoomType.ROPEHOLE:
        this.populateRopeHole(rand);
        break;
      case RoomType.ROPECAVE:
        this.populateRopeCave(rand);
        break;
      case RoomType.SHOP:
        /* shop rates:
         * 10 coal for an gold coin
         * 1 gold for 10 coins
         * 1 emerald for 100 coins
         *
         * shop items:
         * 1 empty heart   4 ^ (maxHealth + maxHealth ^ 1.05 ^ maxHealth - 2.05) coins
         * fill all hearts  1 coin
         * better torch    5 ^ (torchLevel + 1.05 ^ torchLevel - 2.05) coins
         * weapons
         */

        this.populateShop(rand);
        break;
      case RoomType.SPAWNER:
        this.populateSpawner(rand);
        break;
    }
    this.message = this.name;
  };

  // #endregion

  // #region ENTERING / EXITING ROOM METHODS

  exitLevel = () => {
    this.game.onResize(); // stupid hack to keep fps high
    for (let door of this.doors) {
      if (
        door.linkedDoor.lightSource !== null &&
        !door.linkedDoor.room.active &&
        door.linkedDoor.room.entered
      ) {
        door.linkedDoor.lightSource.b = 0;
        door.linkedDoor.lightSource.r = 0;

        door.room.updateLighting();
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

    this.alertEnemiesOnEntry();
    this.message = this.name;
    player.map.saveMapData();
    this.setReverb();
    this.active = true;

    this.updateLighting();
  };

  enterLevel = (player: Player) => {
    this.game.updateLevel();
    player.moveSnap(this.getRoomCenter().x, this.getRoomCenter().y);
    this.onEnterRoom(player);
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
  };

  alertEnemiesOnEntry = () => {
    for (const e of this.entities) {
      if (e instanceof Enemy) e.lookForPlayer(false);
    }
  };

  // #endregion

  // #region LOGIC METHODS

  tick = (player: Player) => {
    this.updateLighting();
    player.updateSlowMotion();
    this.lastEnemyCount = this.entities.filter(
      (e) => e instanceof Enemy,
    ).length;
    for (const h of this.hitwarnings) {
      h.tick();
    }
    for (const p of this.projectiles) {
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

    this.turn = TurnState.computerTurn;

    //player.actionTab.setState(ActionState.WAIT);
    //sets the action tab state to Ready
    this.playerTurnTime = Date.now();
    this.playerTicked = player;

    // Update Beam Effects lighting

    //console.log("updating lighting");

    this.updateLighting();

    player.map.saveMapData();
    this.clearDeadStuff();
  };

  computerTurn = () => {
    // take computer turn
    for (const e of this.entities) {
      e.tick();
    }
    this.entities = this.entities.filter((e) => !e.dead);
    for (const i of this.items) {
      i.tick();
    }

    for (const h of this.hitwarnings) {
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
      if (
        this.roomArray[p.x] &&
        this.roomArray[p.x][p.y] &&
        this.roomArray[p.x][p.y].isSolid()
      )
        p.dead = true;
      for (const i in this.game.players) {
        if (
          this.level.rooms[this.game.players[i].levelID] === this &&
          p.x === this.game.players[i].x &&
          p.y === this.game.players[i].y
        ) {
          p.hitPlayer(this.game.players[i]);
        }
      }
      for (const e of this.entities) {
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

    this.checkForNoEnemies();
    //console.log(this.entities.filter((e) => e instanceof Enemy).length);

    this.turn = TurnState.playerTurn;
  };

  update = () => {
    if (this.turn == TurnState.computerTurn) {
      if (
        Date.now() - this.playerTurnTime >=
        LevelConstants.COMPUTER_TURN_DELAY
      ) {
        this.computerTurn();
      }
    }
  };

  clearDeadStuff = () => {
    this.deadEntities = this.deadEntities.filter((e) => !e.dead);
    this.entities = this.entities.filter((e) => !e.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.hitwarnings = this.hitwarnings.filter((h) => !h.dead);
    this.particles = this.particles.filter((p) => !p.dead);
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
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
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
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
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
      d.lightSource.r = 0;
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
      [Direction.LEFT]: { x: -1, y: 0 },
      [Direction.RIGHT]: { x: 1, y: 0 },
    };
    let linkedDoors: Door[] = [];
    this.doors.forEach((d) => {
      if (d.linkedDoor && d.room.entered) linkedDoors.push(d.linkedDoor);
    });

    this.doors.forEach((d) => {
      d.lightSource.b = 0.1;
    });

    for (const d of linkedDoors) {
      d.lightSource.c = this.tileValuesToLightSource(
        d.linkedDoor.x,
        d.linkedDoor.y,
        this,
      ).color;
      d.lightSource.b = this.tileValuesToLightSource(
        d.linkedDoor.x,
        d.linkedDoor.y,
        this,
      ).brightness;
      d.lightSource.r = LevelConstants.LIGHTING_MAX_DISTANCE;
    }

    let connectedRooms: Set<Room> = new Set(
      this.doors
        .filter((d) => d && d.linkedDoor) // Ensure door and linkedDoor exist
        .map((d) => d.linkedDoor.room)
        .filter((r) => r), // Ensure room exists
    );

    for (const r of Array.from(connectedRooms)) {
      if (r.entered) r.updateLighting();
    }
  };

  updateLighting = () => {
    if (!this.onScreen) return;
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

    for (const l of this.lightSources) {
      if (l.shouldUpdate()) {
        for (let i = 0; i < 360; i += LevelConstants.LIGHTING_ANGLE_STEP) {
          this.castTintAtAngle(i, l.x, l.y, l.r, l.c, l.b); // RGB color in sRGB
        }
      }
    }

    let lightingAngleStep = LevelConstants.LIGHTING_ANGLE_STEP;

    for (const p in this.game.players) {
      let player = this.game.players[p];
      if (this === this.level.rooms[player.levelID]) {
        //console.log(`i: ${player.angle}`);
        for (let i = 0; i < 360; i += lightingAngleStep) {
          let lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;
          let lightBrightness = 5;
          if (player.lightEquipped) {
            lightColor = LevelConstants.TORCH_LIGHT_COLOR;
            lightBrightness = player.lightBrightness;
          }
          this.castTintAtAngle(
            i,
            player.x + 0.5,
            player.y + 0.5,
            /*
            Math.min(
              Math.max(
                player.sightRadius - this.depth + 2,
                Player.minSightRadius,
              ),
              10,
            ),
            */
            LevelConstants.LIGHTING_MAX_DISTANCE,
            lightColor, // RGB color in sRGB
            lightBrightness, // intensity
          );
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
  };

  updateLightSources = (lightSource?: LightSource, remove?: boolean) => {
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
            lightSource.b,
          ); // RGB color in sRGB
        } else {
          this.unCastTintAtAngle(
            i,
            lightSource.x,
            lightSource.y,
            lightSource.r,
            lightSource.c,
            lightSource.b,
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
    action: "cast" | "unCast" = "cast",
  ) => {
    const dx = Math.cos((angle * Math.PI) / 180);
    const dy = Math.sin((angle * Math.PI) / 180);

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

      const tile = this.roomArray[currentX][currentY];
      if (tile.isOpaque()) {
        return; // Stop processing through opaque tiles
      } else if (Math.random() < 1 - tile.opacity) {
        return;
      }

      // Handle i=0 separately to ensure correct intensity
      let intensity: number;
      if (i === 0) {
        intensity = brightness * 0.1;
      } else {
        intensity = brightness / Math.E ** (i - 0.25);
      }
      if (intensity < 0.005) intensity = 0;

      if (intensity <= 0) continue;

      if (!this.renderBuffer[currentX]) {
        this.renderBuffer[currentX] = [];
      }
      if (!this.renderBuffer[currentX][currentY]) {
        this.renderBuffer[currentX][currentY] = [];
      }

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
    const StackBlur = require("stackblur-canvas");
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
    StackBlur.canvasRGBA(canvas, 0, 0, width, height, Math.floor(r / 2));
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
  ) => {
    this.processTintAtAngle(
      angle,
      px,
      py,
      radius,
      color,
      brightness / 3,
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
  ) => {
    this.processTintAtAngle(
      angle,
      px,
      py,
      radius,
      color,
      brightness / 3, // added this
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
    if (this.active) {
      HitWarning.updateFrame(delta);
    } else if (!this.active) {
      this.drawInterval = 30;
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
    Game.ctx.save();
    // Clear the offscreen color canvas
    this.colorOffscreenCtx.clearRect(
      0,
      0,
      this.colorOffscreenCanvas.width,
      this.colorOffscreenCanvas.height,
    );

    let lastFillStyle = "";
    const offsetX = this.blurOffsetX;
    const offsetY = this.blurOffsetY;

    // Draw all color rectangles without any filters
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
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

    // Draw the blurred color layer directly without masking
    Game.ctx.globalCompositeOperation =
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation;
    //Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = 0.6; // 0.6;
    if (!GameConstants.ctxBlurEnabled) {
      this.applyGaussianBlur(this.colorOffscreenCanvas, 12);
    } else {
      Game.ctx.filter = "blur(6px)";
    }
    Game.ctx.drawImage(
      this.colorOffscreenCanvas,
      (this.roomX - offsetX) * GameConstants.TILESIZE,
      (this.roomY - offsetY) * GameConstants.TILESIZE,
    );

    //draw slight haze
    Game.ctx.globalCompositeOperation = "lighten";
    Game.ctx.globalAlpha = 0.05;
    if (!GameConstants.ctxBlurEnabled)
      this.applyGaussianBlur(this.colorOffscreenCanvas, 24);
    else Game.ctx.filter = "blur(12px)";
    Game.ctx.drawImage(
      this.colorOffscreenCanvas,
      (this.roomX - offsetX) * GameConstants.TILESIZE,
      (this.roomY - offsetY) * GameConstants.TILESIZE,
    );
    this.colorOffscreenCtx.clearRect(
      0,
      0,
      this.colorOffscreenCanvas.width,
      this.colorOffscreenCanvas.height,
    );

    Game.ctx.restore();
  };

  drawShadeLayer = () => {
    if (this.game.isMobile) return;
    if (!this.onScreen) return;
    Game.ctx.save();
    // Clear the offscreen shade canvas
    this.shadeOffscreenCtx.clearRect(
      0,
      0,
      this.shadeOffscreenCanvas.width,
      this.shadeOffscreenCanvas.height,
    );

    let lastFillStyle = "";
    const offsetX = this.blurOffsetX;
    const offsetY = this.blurOffsetY;

    // Draw all shade rectangles without any filters
    for (let x = this.roomX - 2; x < this.roomX + this.width + 4; x++) {
      for (let y = this.roomY - 2; y < this.roomY + this.height + 4; y++) {
        let alpha =
          this.softVis[x] && this.softVis[x][y] ? this.softVis[x][y] : 0;
        if (
          this.roomArray[x] &&
          this.roomArray[x][y] &&
          this.roomArray[x][y] instanceof WallTorch
        )
          continue;
        //if (alpha === 0) continue; // Skip if no visibility adjustment
        let factor = !GameConstants.SMOOTH_LIGHTING ? 2 : 0.5;
        let computedAlpha = alpha ** factor;
        // if (computedAlpha <= 0) continue; // Skip if alpha is effectively zero

        let fillX = x;
        let fillY = y;
        let fillWidth = 1;
        let fillHeight = 1;
        if (
          this.roomArray[x] &&
          this.roomArray[x][y] &&
          this.roomArray[x][y] instanceof Wall
        ) {
          const wall = this.roomArray[x][y] as Wall;
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
                fillX = x + 0.5;
                fillWidth = 0.5;
                break;
              case Direction.RIGHT:
                fillX = x + 0;
                fillWidth = 0.5;
                break;
              case Direction.DOWN_LEFT:
                fillX = x + 0.5;
                fillY = y - 0.5;
                fillWidth = 0.5;
                fillHeight = 1.5;
                break;
              case Direction.DOWN_RIGHT:
                fillX = x;
                fillY = y - 0.5;
                fillWidth = 0.5;
                fillHeight = 1.5;
                break;
              case Direction.UP_LEFT:
                fillX = x + 0.5;
                fillY = y - 0.5;
                fillWidth = 0.5;
                fillHeight = 0.5;
                break;
              case Direction.UP_RIGHT:
                fillX = x - 0.5;
                fillY = y - 0.5;
                fillWidth = 0.5;
                fillHeight = 0.5;
                break;
            }
          }
        }
        /*
        if (
          this.roomArray[x] &&
          this.roomArray[x][y] &&
          this.roomArray[x][y] instanceof Door &&
          !(this.roomArray[x][y] as Door).opened &&
          !(this.roomArray[x][y] as Door).linkedDoor.room.entered
        ) {
          //computedAlpha = 1;
          switch ((this.roomArray[x][y] as Door).doorDir) {
            case Direction.UP:
              fillY = y - 0.75;
              fillX = x - 0.5;
              fillHeight = 2;
              fillWidth = 1.5;

              break;
            case Direction.DOWN:
              fillX = x;
              fillY = y + 0.5;
              fillHeight = 2;
              fillWidth = 1.5;
              break;
            case Direction.LEFT:
              fillX = x;
              fillY = y - 0.5;
              fillWidth = 2;
              fillHeight = 2;
              break;
            case Direction.RIGHT:
              fillX = x - 0.5;
              fillY = y - 0.5;
              fillWidth = 2;
              fillHeight = 2;
              break;
          }
        }
        */

        const fillStyle = `rgba(0, 0, 0, ${computedAlpha})`;

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

    // Draw the blurred shade layer directly without masking
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = 1;
    if (!GameConstants.ctxBlurEnabled)
      this.applyGaussianBlur(this.shadeOffscreenCanvas, 10);
    else Game.ctx.filter = "blur(5px)";
    Game.ctx.drawImage(
      this.shadeOffscreenCanvas,
      (this.roomX - offsetX - 1) * GameConstants.TILESIZE,
      (this.roomY - offsetY - 1) * GameConstants.TILESIZE,
    );

    Game.ctx.restore();
  };

  drawBloomLayer = (delta: number) => {
    if (this.game.isMobile) return;
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

    // Draw all shade rectangles without any filters
    const allEntities = this.entities.concat(this.deadEntities);
    if (allEntities.length > 0)
      for (let e of this.entities) {
        if (e.hasBloom) {
          e.updateBloom(delta);
          this.bloomOffscreenCtx.globalAlpha =
            1 * (1 - this.softVis[e.x][e.y]) * e.softBloomAlpha;
          this.bloomOffscreenCtx.fillStyle = e.bloomColor;

          this.bloomOffscreenCtx.fillRect(
            (e.x - e.drawX - this.roomX + offsetX + 0.5 - e.bloomSize / 2) *
              GameConstants.TILESIZE,
            (e.y -
              e.drawY -
              this.roomY -
              0.5 +
              offsetY +
              0.5 -
              e.bloomSize / 2) *
              GameConstants.TILESIZE +
              e.bloomOffsetY,
            GameConstants.TILESIZE * e.bloomSize,
            GameConstants.TILESIZE * e.bloomSize,
          );
        }
      }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.roomArray[x][y].hasBloom) {
          this.roomArray[x][y].updateBloom(delta);
          this.bloomOffscreenCtx.globalAlpha =
            1 * (1 - this.softVis[x][y]) * this.roomArray[x][y].softBloomAlpha;
          this.bloomOffscreenCtx.fillStyle = this.roomArray[x][y].bloomColor;

          this.bloomOffscreenCtx.fillRect(
            (x - this.roomX + offsetX) * GameConstants.TILESIZE,
            (y - this.roomY - 0.25 + offsetY) * GameConstants.TILESIZE,
            GameConstants.TILESIZE,
            GameConstants.TILESIZE * 0.75,
          );
        }
      }
    }

    if (this.projectiles.length > 0)
      for (let p of this.projectiles) {
        if (p.hasBloom) {
          p.updateBloom(delta);
          this.bloomOffscreenCtx.globalAlpha =
            1 * (1 - this.softVis[p.x][p.y]) * p.softBloomAlpha;
          this.bloomOffscreenCtx.fillStyle = p.bloomColor;

          this.bloomOffscreenCtx.fillRect(
            (p.x - this.roomX + offsetX) * GameConstants.TILESIZE,
            (p.y - this.roomY + offsetY) * GameConstants.TILESIZE,
            GameConstants.TILESIZE,
            GameConstants.TILESIZE,
          );
        }
      }

    // Draw the blurred shade layer directly without masking
    if (!GameConstants.ctxBlurEnabled)
      this.applyGaussianBlur(this.bloomOffscreenCanvas, 16);
    else Game.ctx.filter = "blur(8px)";
    Game.ctx.globalCompositeOperation = "screen";

    Game.ctx.globalAlpha = 1;
    Game.ctx.drawImage(
      this.bloomOffscreenCanvas,
      (this.roomX - offsetX) * GameConstants.TILESIZE,
      (this.roomY - offsetY) * GameConstants.TILESIZE,
    );
    this.bloomOffscreenCtx.fillStyle = "rgba(0, 0, 0, 1)";
    this.bloomOffscreenCtx.fillRect(
      0,
      0,
      this.bloomOffscreenCanvas.width,
      this.bloomOffscreenCanvas.height,
    );
    Game.ctx.restore();
  };

  drawEntities = (delta: number, skipLocalPlayer?: boolean) => {
    Game.ctx.save();
    let tiles = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.roomArray[x][y].drawUnderPlayer(delta);
        tiles.push(this.roomArray[x][y]);
      }
    }

    let drawables = new Array<Drawable>();
    let entities = new Array<Entity>();
    entities = entities.concat(this.entities, this.deadEntities);

    drawables = drawables.concat(
      tiles,
      this.decorations,
      entities,
      this.hitwarnings,
      this.projectiles,
      this.particles,
      this.items,
    );
    for (const i in this.game.players) {
      if (this.game.rooms[this.game.players[i].levelID] === this) {
        if (
          !(
            skipLocalPlayer &&
            this.game.players[i] === this.game.players[this.game.localPlayerID]
          )
        )
          drawables.push(this.game.players[i]);
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
        if (a instanceof Player) {
          return 1;
        } else if (b instanceof Player) {
          return -1;
        } else if (a instanceof Entity) {
          return 1;
        } else if (b instanceof Entity) {
          return -1;
        } else return 0;
      } else {
        return a.drawableY - b.drawableY;
      }
    });

    for (const d of drawables) {
      d.draw(delta);
    }

    this.drawAbovePlayer(delta);
    for (const i of this.items) {
      i.drawTopLayer(delta);
    }
    Game.ctx.restore();
  };

  drawAbovePlayer = (delta: number) => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        //if (this.softVis[x][y] < 1) this.roomArray[x][y].drawAbovePlayer(delta);
      }
    }
  };

  drawShade = (delta: number) => {
    Game.ctx.save();
    let bestSightRadius = 0;
    for (const p in this.game.players) {
      Game.ctx.globalCompositeOperation = "source-over"; // "soft-light";
      Game.ctx.globalAlpha = 1;
      if (
        this.level.rooms[this.game.players[p].levelID] === this &&
        this.game.players[p].defaultSightRadius > bestSightRadius
      ) {
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

  drawOverShade = (delta: number) => {
    Game.ctx.save();
    for (const e of this.entities) {
      e.drawTopLayer(delta); // health bars
    }

    for (const p of this.projectiles) {
      p.drawTopLayer(delta);
    }
    //Game.ctx.globalCompositeOperation = "overlay";
    for (const h of this.hitwarnings) {
      h.drawTopLayer(delta);
    }
    //Game.ctx.globalCompositeOperation = "source-over";

    for (const s of this.particles) {
      s.drawTopLayer(delta);
    }
    // draw over dithered shading
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.roomArray[x][y].drawAboveShading(delta);
      }
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

  // src/room.ts
  createWallMask = (): HTMLCanvasElement => {
    const maskCanvas = document.createElement("canvas");
    this.maskCanvases.push(maskCanvas); // <-- Track the canvas
    maskCanvas.width = this.width * GameConstants.TILESIZE;
    maskCanvas.height = this.height * GameConstants.TILESIZE;
    const ctx = maskCanvas.getContext("2d");
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

            if (!hasWallAbove && hasWallBelow) {
              innerWallType = "topInner";
            } else if (hasWallAbove && !hasWallBelow) {
              innerWallType = "bottomInner";
            } else if (hasWallAbove && hasWallBelow) {
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

  private pointInside(
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

  checkForNoEnemies = () => {
    let enemies = this.entities.filter((e) => e instanceof Enemy);
    if (enemies.length === 0 && this.lastEnemyCount > 0) {
      // if (this.doors[0].type === DoorType.GUARDEDDOOR) {
      this.doors.forEach((d) => {
        if (d.type === DoorType.GUARDEDDOOR) {
          d.unGuard();
          this.game.pushMessage(
            "The foes have been slain and the door allows you passage.",
          );
        }
      });
    }
  };

  // This pattern appears in multiple methods like addVendingMachine, addChests, addSpikes, etc.
  private getRandomEmptyPosition(tiles: Tile[]): { x: number; y: number } {
    if (tiles.length === 0) return null;
    const tile = tiles.splice(
      Game.rand(0, tiles.length - 1, Random.rand),
      1,
    )[0];
    return { x: tile.x, y: tile.y };
  }

  // Used in populateUpLadder, populateDownLadder, populateRopeHole, populateRopeCave
  private getRoomCenter(): { x: number; y: number } {
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
        if (door === otherDoor || door === null || otherDoor === null) break;
        const pathObstacles = this.findPath(door, otherDoor);
        if (pathObstacles.length > 0) {
        }
        obstacles.push(...pathObstacles);
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

  // avoid blocking doorways with unbreakable entities
  findPath = (startTile: Tile, targetTile: Tile): Array<Entity> => {
    let disablePositions = Array<astar.Position>();
    let obstacleCandidates = [];

    for (const e of this.entities) {
      if (e instanceof VendingMachine || e instanceof Rock) {
        disablePositions.push({ x: e.x, y: e.y } as astar.Position);
        obstacleCandidates.push(e);
      }
    }

    // Create a grid of the room
    let grid = [];
    for (let x = 0; x < this.roomX + this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.roomY + this.height; y++) {
        if (this.roomArray[x] && this.roomArray[x][y])
          grid[x][y] = this.roomArray[x][y];
        else grid[x][y] = false;
      }
    }

    let moves = astar.AStar.search(
      grid,
      startTile,
      targetTile,
      disablePositions,
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
        case Direction.RIGHT | Direction.LEFT:
          // Offsets along the y-axis for vertical walls
          offsetOptions.push({ dx: 0, dy: 1 }, { dx: 0, dy: -1 });
          break;
        case Direction.UP | Direction.DOWN:
          // Offsets along the x-axis for horizontal walls
          offsetOptions.push({ dx: 1, dy: 0 }, { dx: -1, dy: 0 });
          break;
      }

      // Shuffle the offset options to randomize placement
      const shuffledOffsets = offsetOptions.sort(() => Math.random() - 0.5);

      for (const offset of shuffledOffsets) {
        const newX = x + offset.dx;
        const newY = y + offset.dy;

        // Ensure the new position is within bounds and not on the edge
        const isWithinBounds =
          newX > room.roomX &&
          newX < room.roomX + room.width - 1 &&
          newY > room.roomY &&
          newY < room.roomY + room.height - 1;

        if (isWithinBounds && !(room.roomArray[newX]?.[newY] instanceof Door)) {
          // Offset the door placement
          return room.addDoor(newX, newY, room, tunnelDoor);
        }
      }

      return null;
    }

    // If no door exists at the desired position, place it normally
    return room.addDoor(x, y, room, tunnelDoor);
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
  placeVendingMachineInWall(): void {
    const emptyWalls = this.getEmptyWall();
    if (emptyWalls.length === 0) return;

    // Select a random empty wall
    const selectedWall = Game.randTable(emptyWalls, Random.rand);
    if (!selectedWall) return;

    // Remove the selected wall
    const removedWallInfo = this.removeEmptyWall(selectedWall);
    if (!removedWallInfo) return;

    const { x, y } = removedWallInfo;

    // Create and add the VendingMachine
    this.addVendingMachine(Random.rand, x, y);
  }
}
