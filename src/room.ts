import { Wall } from "./tile/wall";
import { LevelConstants } from "./levelConstants";
import { Floor } from "./tile/floor";
import { Direction, Game, LevelState } from "./game";
import { Door, DoorType } from "./tile/door";
import { Tile, SkinType } from "./tile/tile";
import { Trapdoor } from "./tile/trapdoor";
import { KnightEnemy } from "./entity/enemy/knightEnemy";
import { Entity, EntityType } from "./entity/entity";
import { Chest } from "./entity/object/chest";
import { Item } from "./item/item";
import { GoldenKey } from "./item/goldenKey";
import { SpawnFloor } from "./tile/spawnfloor";
//import { GoldenDoor } from "./tile/goldenDoor";
import { Spike } from "./tile/spike";
import { GameConstants } from "./gameConstants";
import { WizardEnemy } from "./entity/enemy/wizardEnemy";
import { SkullEnemy } from "./entity/enemy/skullEnemy";
import { Barrel } from "./entity/object/barrel";
import { Crate } from "./entity/object/crate";
import { Input } from "./input";
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
import { Backpack } from "./item/backpack";
import { DoorDir } from "./tile/door";
//import { ActionState, ActionTab } from "./actionTab";
import { TombStone } from "./entity/object/tombStone";
import { Pumpkin } from "./entity/object/pumpkin";
import { QueenEnemy } from "./entity/enemy/queenEnemy";
import { FrogEnemy } from "./entity/enemy/frogEnemy";
import { BigKnightEnemy } from "./entity/enemy/bigKnightEnemy";
import { EventEmitter } from "./eventEmitter";
import { Enemy } from "./entity/enemy/enemy";
import { FireWizardEnemy } from "./entity/enemy/fireWizard";
import { Dagger } from "./weapon/dagger";
import { TutorialListener } from "./tutorialListener";
import { globalEventBus } from "./eventBus";
import { RedGem } from "./item/redgem";
import { EnergyWizardEnemy } from "./entity/enemy/energyWizard";
import { ReverbEngine } from "./reverb";
import { astar } from "./astarclass";
import { Level } from "./level";
import { Warhammer } from "./weapon/warhammer";
import { Spellbook } from "./weapon/spellbook";
import { Torch } from "./item/torch";
import { RookEnemy } from "./entity/enemy/rookEnemy";
import { BeamEffect } from "./beamEffect";

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
  items: Array<Item>;
  doors: Array<Door>; // (Door | BottomDoor) just a reference for mapping, still access through levelArray
  projectiles: Array<Projectile>;
  particles: Array<Particle>;
  hitwarnings: Array<HitWarning>;
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
  shadeColor = "black";
  innerWalls: Array<Wall>;
  //actionTab: ActionTab;
  wallInfo: Map<string, WallInfo> = new Map();
  savePoint: Room;
  lastEnemyCount: number;
  outerWalls: Array<Wall>;
  level: Level;
  onMainPath: boolean = false;
  pathIndex: number = 0;
  coordinatesWithLightingChanges: { x: number; y: number }[];

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

  // Add a list to keep track of BeamEffect instances
  beamEffects: BeamEffect[] = [];

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
    onMainPath = false,
    pathIndex: number = 0,
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

    this.roomArray = [];
    for (let x = this.roomX - 1; x < this.roomX + this.width + 1; x++) {
      this.roomArray[x] = [];
      for (let y = this.roomY - 1; y < this.roomY + this.height + 1; y++) {
        this.roomArray[x][y] = null;
      }
    }
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
    this.renderBuffer = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      this.renderBuffer[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.renderBuffer[x][y] = [];
      }
    }

    this.skin = SkinType.DUNGEON;
    if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
      this.skin = SkinType.CAVE;
    this.buildEmptyRoom();

    this.onMainPath = onMainPath;
    this.pathIndex = pathIndex;
    this.coordinatesWithLightingChanges = [];
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

  /**
   * Checks if a room can be placed at the specified position with the given dimensions.
   *
   * @param x - The x-coordinate of the door which the new room will branch from.
   * @param y - The y-coordinate of the door which the new room will branch from.
   * @param width - The width of the room.
   * @param height - The height of the room.
   * @returns `true` if the room can be placed without overlapping; otherwise, `false`.
   */

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

  removeWall = (x: number, y: number) => {
    if (this.roomArray[x][y] instanceof Wall) {
      this.roomArray[x][y] = null;
    }
    //this.innerWalls = this.innerWalls.filter((w) => w.x !== x && w.y !== y);
    //this.outerWalls = this.outerWalls.filter((w) => w.x !== x && w.y !== y);
  };
  getWallType = (
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

  private addTorches(numTorches: number, rand: () => number) {
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
      let t, x, y;
      if (walls.length == 0) return;
      t = walls.splice(Game.rand(0, walls.length - 1, rand), 1)[0];
      x = t.x;
      y = t.y;
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

  private addChests(numChests: number, rand: () => number) {
    // add chests
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numChests; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.entities.push(new Chest(this, this.game, x, y));
    }
  }

  private addSpikeTraps(numSpikes: number, rand: () => number) {
    // add spikes
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.roomArray[x][y] = new SpikeTrap(this, x, y);
    }
  }

  private addSpikes(numSpikes: number, rand: () => number) {
    // add spikes
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      this.roomArray[x][y] = new Spike(this, x, y);
    }
  }

  hasPlayer(player: Player): boolean {
    for (let tile of this.roomArray) {
      if (tile instanceof Player) {
        return true;
      }
    }
    return false;
  }

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
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3,
    ];
    if (this.depth > 0) {
      let spawnerAmount = Game.randTable(spawnerAmounts, Math.random);
      console.log(`Adding ${spawnerAmount} spawners`);
      this.addSpawners(spawnerAmount, Math.random);
    }
  }
  private addSpawners(numSpawners: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    if (tiles === null) {
      console.log(`No tiles left to spawn spawners`);
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
      console.log(`No tiles left to spawn enemies.`);
      return;
    }

    const { x, y } = this.getRandomEmptyPosition(tiles);
    EnemyClass.add(this, this.game, x, y);
  };

  private addObstacles(numObstacles: number, rand: () => number) {
    // add crates/barrels
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numObstacles; i++) {
      const { x, y } = this.getRandomEmptyPosition(tiles);
      switch (
        Game.randTable(
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 5, 5],
          rand,
        )
      ) {
        case 1:
          Crate.add(this, this.game, x, y);
          break;
        case 2:
          Barrel.add(this, this.game, x, y);
          break;
        case 3:
          TombStone.add(this, this.game, x, y, 1);
          break;
        case 4:
          TombStone.add(this, this.game, x, y, 0);
          break;
        case 5:
          Pumpkin.add(this, this.game, x, y);
          break;
      }
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

  private addVendingMachine(rand: () => number) {
    const { x, y } = this.getRandomEmptyPosition(this.getEmptyTiles());
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

  populateEmpty = (rand: () => number) => {
    this.addRandomTorches("medium");
  };

  populateDungeon = (rand: () => number) => {
    //this.addChests(10, rand);
    let factor = Game.rand(1, 36, rand);

    if (factor < 30) this.addWallBlocks(rand);
    if (factor % 4 === 0) this.addChasms(rand);
    this.addRandomTorches("medium");

    if (factor > 15)
      this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 3], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
    let numPlants = Math.ceil(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    this.addObstacles(numObstacles, rand);
    let numEnemies = Math.ceil(
      (numEmptyTiles - numTotalObstacles) *
        Math.min(this.depth * 0.1 + 0.1, 0.35), //this.depth * 0.01 is starting value
    );
    this.addEnemies(numEnemies, rand);

    if (factor <= 6) this.addVendingMachine(rand);

    const obstacles = this.checkDoorObstructions();
    if (obstacles.length > 0) {
      for (let obstacle of obstacles) {
        console.log(`Removing obstacle at (${obstacle.x},${obstacle.y})`);
        this.entities = this.entities.filter((e) => e !== obstacle);
        obstacle = null;
      }
    }
  };
  populateBoss = (rand: () => number) => {
    this.addRandomTorches("medium");

    this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.2);
    let numPlants = Math.floor(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    this.addObstacles(numObstacles, rand);
    let numEnemies = Math.ceil(
      (numEmptyTiles - numTotalObstacles) *
        Math.min(this.depth * 0.05 + 0.2, 0.5),
    );
    this.addEnemies(numEnemies, rand);
  };
  populateBigDungeon = (rand: () => number) => {
    if (Game.rand(1, 4, rand) === 1) this.addChasms(rand);
    this.addRandomTorches("medium");

    if (Game.rand(1, 4, rand) === 1)
      this.addPlants(
        Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
        rand,
      );
    if (Game.rand(1, 3, rand) === 1)
      this.addSpikeTraps(Game.randTable([3, 5, 7, 8], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles *
        (this.depth * 0.5 + 0.5) *
        Game.randTable([0.05, 0.05, 0.06, 0.07, 0.1], rand),
    );
    this.addEnemies(numEnemies, rand);
    if (numEnemies > 0)
      this.addObstacles(numEnemies / Game.rand(1, 2, rand), rand);
    else this.addObstacles(Game.randTable([0, 0, 1, 1, 2, 3, 5], rand), rand);
  };

  populateSpawner = (rand: () => number) => {
    this.addRandomTorches("medium");

    Spawner.add(
      this,
      this.game,
      Math.floor(this.roomX + this.width / 2),
      Math.floor(this.roomY + this.height / 2),
    );
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

      this.entities.push(new Crate(this, this.game, t.x, t.y));
    }
    this.addPlants(
      Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
      rand,
    );
  };
  populateSpikeCorridor = (rand: () => number) => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        this.roomArray[x][y] = new SpikeTrap(this, x, y, Game.rand(0, 3, rand));
      }
    }

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
    this.addResources(
      (numEmptyTiles - numEnemies) * Game.randTable([0.5, 0.6, 0.7, 0.8], rand),
      rand,
    );
  };
  populateUpLadder = (rand: () => number) => {
    this.addRandomTorches("medium");

    const { x, y } = this.getRoomCenter();
    this.roomArray[x][y] = new UpLadder(this, this.game, x, y);
  };
  populateDownLadder = (rand: () => number) => {
    this.addRandomTorches("medium");
    const { x, y } = this.getRoomCenter();
    this.roomArray[x][y] = new DownLadder(this, this.game, x, y);
    const numChests = Math.floor(Math.random() * 4);

    let tiles = this.getEmptyTiles();
    tiles = tiles.filter((tile) => tile.x !== x || tile.y !== y);
    let weaponDropped = false;
    for (let i = 0; i < 5; i++) {
      if (tiles.length > 0) {
        const { x, y } = this.getRandomEmptyPosition(tiles);

        let chest = new Chest(this, this.game, x, y);

        if (!weaponDropped) {
          chest.getDrop(["weapon"], true);
          weaponDropped = true;
        } else chest.getDrop(["consumables"], true);
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
  };
  populateShop = (rand: () => number) => {
    this.addTorches(2, rand);

    const { x, y } = this.getRoomCenter();
    VendingMachine.add(this, this.game, x - 2, y - 1, new Shotgun(this, 0, 0));
    VendingMachine.add(this, this.game, x + 2, y - 1, new Heart(this, 0, 0));
    VendingMachine.add(this, this.game, x - 2, y + 2, new Armor(this, 0, 0));
    VendingMachine.add(this, this.game, x + 2, y + 2, new Spear(this, 0, 0));

    const obstacles = this.checkDoorObstructions();
    if (obstacles.length > 0) {
    }
    for (let obstacle of obstacles) {
      this.entities = this.entities.filter((e) => e !== obstacle);
      obstacle = null;
    }
  };

  populate = (rand: () => number) => {
    this.name = "";
    switch (this.type) {
      case RoomType.START:
        this.populateEmpty(rand);
        this.name = "FLOOR " + -this.depth;
        break;
      case RoomType.BOSS:
        this.populateBoss(rand);
        this.name = "BOSS";
        break;
      case RoomType.DUNGEON:
        this.populateDungeon(rand);
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

  addDoor = (x: number, y: number) => {
    let d;
    let t = DoorType.DOOR;
    if (this.type === RoomType.BOSS) t = DoorType.GUARDEDDOOR;
    if (this.type === RoomType.KEYROOM) t = DoorType.LOCKEDDOOR;
    if (x === this.roomX) {
      d = new Door(this, this.game, x, y, Direction.RIGHT, t);
      this.roomArray[x + 1][y] = new SpawnFloor(this, x + 1, y);
    } else if (x === this.roomX + this.width - 1) {
      d = new Door(this, this.game, x, y, Direction.LEFT, t);
      this.roomArray[x - 1][y] = new SpawnFloor(this, x - 1, y);
    } else if (y === this.roomY) {
      d = new Door(this, this.game, x, y, Direction.UP, t);
      this.roomArray[x][y + 1] = new SpawnFloor(this, x, y + 1);
    } else if (y === this.roomY + this.height - 1) {
      d = new Door(this, this.game, x, y, Direction.DOWN, t);
      this.roomArray[x][y - 1] = new SpawnFloor(this, x, y - 1);
    }

    this.doors.push(d);
    if (this.roomArray[d.x] == undefined) {
    }
    this.roomArray[d.x][d.y] = d;

    return d;
  };

  alertEnemiesOnEntry = () => {
    for (const e of this.entities) {
      if (e instanceof Enemy) e.lookForPlayer();
    }
  };

  exitLevel = () => {
    this.particles.splice(0, this.particles.length);
  };

  enterLevel = (player: Player) => {
    player.moveSnap(this.getRoomCenter().x, this.getRoomCenter().y);

    this.clearDeadStuff();
    this.updateLighting();
    this.entered = true;
    this.calculateWallInfo();
    this.message = this.name;
    player.map.saveMapData();
    this.setReverb();
  };

  enterLevelThroughDoor = (player: Player, door: any, side?: number) => {
    if (door instanceof Door && door.doorDir === Direction.UP) {
      //if top door
      (door as Door).opened = true;
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

    this.clearDeadStuff();
    this.calculateWallInfo();
    this.updateLighting();
    this.entered = true;

    this.particles = [];

    this.alertEnemiesOnEntry();
    this.message = this.name;
    player.map.saveMapData();
    this.setReverb();
  };

  enterLevelThroughLadder = (player: Player, ladder: any) => {
    player.moveSnap(ladder.x, ladder.y + 1);

    this.clearDeadStuff();
    this.calculateWallInfo();
    this.updateLighting();
    this.entered = true;

    this.message = this.name;
    player.map.saveMapData();
    this.setReverb();
  };

  getEmptyTiles = (): Tile[] => {
    let returnVal: Tile[] = [];
    for (let x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        if (
          !this.roomArray[x][y].isSolid() &&
          !(this.roomArray[x][y] instanceof SpikeTrap) &&
          !(this.roomArray[x][y] instanceof SpawnFloor)
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
          diffR *= 0.1 * delta;
          this.softCol[x][y][0] = this.clamp(Math.round(softR - diffR), 0, 255);
        }
        if (flagG) {
          diffG *= 0.1 * delta;
          this.softCol[x][y][1] = this.clamp(Math.round(softG - diffG), 0, 255);
        }
        if (flagB) {
          diffB *= 0.1 * delta;
          this.softCol[x][y][2] = this.clamp(Math.round(softB - diffB), 0, 255);
        }
      }
    }
  };

  updateLighting = () => {
    // Start timing the initial setup
    //console.time("updateLighting: Initial Setup");

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
    // End timing the processing of light sources
    //console.timeEnd("updateLighting: Process LightSources");

    // Start timing the processing of player lighting
    //console.time("updateLighting: Process Players");
    let lightingAngleStep = LevelConstants.LIGHTING_ANGLE_STEP;

    for (const p in this.game.players) {
      let player = this.game.players[p];
      if (this === this.game.rooms[player.levelID]) {
        //console.log(`i: ${player.angle}`);
        for (let i = 0; i < 360; i += lightingAngleStep) {
          let lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;
          if (player.lightEquipped)
            lightColor = LevelConstants.TORCH_LIGHT_COLOR;
          this.castTintAtAngle(
            i,
            player.x + 0.5,
            player.y + 0.5,
            Math.min(
              Math.max(
                player.sightRadius - this.depth + 2,
                Player.minSightRadius,
              ),
              10,
            ),
            lightColor, // RGB color in sRGB
            5, // intensity
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

  castShadowsAtAngle = (
    angle: number,
    px: number,
    py: number,
    radius: number,
    oldVis: number[][],
  ) => {
    let dx = Math.cos((angle * Math.PI) / 180);
    let dy = Math.sin((angle * Math.PI) / 180);
    let onOpaqueSection = false;
    for (let i = 0; i < radius + 1.5; i++) {
      if (!this.isPositionInRoom(px, py)) return; // we're outside the level

      let tile = this.roomArray[Math.floor(px)][Math.floor(py)];
      if (tile.isOpaque()) {
        if (i > 0) onOpaqueSection = true;
      } else if (onOpaqueSection) {
        return;
      }

      this.vis[Math.floor(px)][Math.floor(py)] = Math.min(
        this.vis[Math.floor(px)][Math.floor(py)],
        Math.min(i / radius, 1),
      );

      px += dx;
      py += dy;
    }
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
      }

      // Handle i=0 separately to ensure correct intensity
      let intensity: number;
      if (i === 0) {
        intensity = brightness * 0.1;
      } else {
        intensity = brightness / Math.E ** i;
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
    this.processTintAtAngle(angle, px, py, radius, color, brightness, "cast");
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
    this.processTintAtAngle(angle, px, py, radius, color, brightness, "unCast");
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

  private clamp = (value: number, min: number = 0, max: number = 1): number => {
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

  blur3x3 = (
    array: Array<Array<number>>,
    weights: Array<Array<number>>,
  ): Array<Array<number>> => {
    let blurredArray = [];
    for (let x = 0; x < array.length; x++) {
      blurredArray[x] = [];
      for (let y = 0; y < array[0].length; y++) {
        if (array[x][y] === 0) {
          blurredArray[x][y] = 0;
          continue;
        }
        let total = 0;
        let totalWeights = 0;
        for (let xx = -1; xx <= 1; xx++) {
          for (let yy = -1; yy <= 1; yy++) {
            if (
              x + xx >= 0 &&
              x + xx < array.length &&
              y + yy >= 0 &&
              y + yy < array[0].length
            ) {
              total += array[x + xx][y + yy] * weights[xx + 1][yy + 1];
              totalWeights += weights[xx + 1][yy + 1];
            }
          }
        }
        blurredArray[x][y] = total / totalWeights;
      }
    }
    return blurredArray;
  };

  rgbToLuminance = (color: [number, number, number]): number => {
    //map to 1-0 range
    return 1 - (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
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

  tick = (player: Player) => {
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
    this.entities = this.entities.filter((e) => !e.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.hitwarnings = this.hitwarnings.filter((h) => !h.dead);
    this.particles = this.particles.filter((p) => !p.dead);
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
      if (this.roomArray[p.x][p.y].isSolid()) p.dead = true;
      for (const i in this.game.players) {
        if (
          this.game.rooms[this.game.players[i].levelID] === this &&
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

  draw = (delta: number) => {
    HitWarning.updateFrame(delta);
    this.fadeRgb(delta);
    this.fadeLighting(delta);
  };

  drawColorLayer = () => {
    Game.ctx.save();
    Game.ctx.globalCompositeOperation =
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATION as GlobalCompositeOperation; //"soft-light";
    Game.ctx.globalAlpha = 0.75;
    let lastFillStyle = "";
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        const [r, g, b] = this.softCol[x][y];
        if (r === 0 && g === 0 && b === 0) continue; // Skip if no color
        const alpha = 1 - this.vis[x][y];
        const fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        if (fillStyle !== lastFillStyle) {
          Game.ctx.fillStyle = fillStyle;
          lastFillStyle = fillStyle;
        }
        Game.ctx.fillRect(
          x * GameConstants.TILESIZE,
          y * GameConstants.TILESIZE,
          GameConstants.TILESIZE,
          GameConstants.TILESIZE,
        );
      }
    }
    Game.ctx.restore();
  };

  drawEntities = (delta: number, skipLocalPlayer?: boolean) => {
    Game.ctx.save();
    let tiles = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.softVis[x][y] < 1) this.roomArray[x][y].drawUnderPlayer(delta);
        tiles.push(this.roomArray[x][y]);
      }
    }

    let drawables = new Array<Drawable>();

    drawables = drawables.concat(
      tiles,
      this.entities,
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
      if (a instanceof Floor) {
        return -1;
      } else if (b instanceof Floor) {
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

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.softVis[x][y] < 1) this.roomArray[x][y].drawAbovePlayer(delta);
      }
    }
    for (const i of this.items) {
      i.drawTopLayer(delta);
    }
    Game.ctx.restore();
  };

  drawShade = (delta: number) => {
    Game.ctx.save();
    let bestSightRadius = 0;
    for (const p in this.game.players) {
      Game.ctx.globalCompositeOperation = "source-over"; // "soft-light";
      Game.ctx.globalAlpha = 1;
      if (
        this.game.rooms[this.game.players[p].levelID] === this &&
        this.game.players[p].defaultSightRadius > bestSightRadius
      ) {
        bestSightRadius = this.game.players[p].defaultSightRadius;
      }
    }
    let shadingAlpha = Math.max(0, Math.min(0.8, 2 / bestSightRadius));
    if (GameConstants.ALPHA_ENABLED) {
      Game.ctx.globalAlpha = 0.25;
      Game.ctx.fillStyle = this.shadeColor;
      Game.ctx.fillRect(
        (this.roomX - LevelConstants.SCREEN_W) * GameConstants.TILESIZE,
        (this.roomY - LevelConstants.SCREEN_H) * GameConstants.TILESIZE,
        (this.width + 2 * LevelConstants.SCREEN_W) * GameConstants.TILESIZE,
        (this.height + 2 * LevelConstants.SCREEN_H) * GameConstants.TILESIZE,
      );
      Game.ctx.globalAlpha = 1;
      Game.ctx.globalCompositeOperation = "source-over";
    }
    Game.ctx.restore();
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

  calculateWallInfo() {
    this.wallInfo.clear();
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        const tile = this.getTile(x, y);
        if (tile instanceof Wall || tile instanceof WallTorch) {
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
  // Many populate methods start with adding torches using the same pattern
  private addRandomTorches(
    intensity: "none" | "low" | "medium" | "high" = "medium",
  ): void {
    const torchPatterns = {
      none: [0, 0, 0],
      low: [0, 0, 0, 1, 1],
      medium: [0, 0, 0, 1, 1, 2, 2, 3, 4],
      high: [1, 1, 2, 2, 3, 4, 4],
    };
    const randTorches = Game.randTable(torchPatterns[intensity], Random.rand);
    this.addTorches(randTorches, Random.rand);
  }

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

  checkDoorObstructions = () => {
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
    return obstacles;
  };

  findPath = (startTile: Tile, targetTile: Tile): Array<Entity> => {
    let disablePositions = Array<astar.Position>();
    let obstacleCandidates = [];

    for (const e of this.entities) {
      if (e instanceof VendingMachine || e instanceof Rock) {
        disablePositions.push({ x: e.x, y: e.y } as astar.Position);
        obstacleCandidates.push(e);
      }
    }

    /*
    for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
      for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
        if (
          this.room.roomArray[xx][yy] instanceof SpikeTrap &&
          (this.room.roomArray[xx][yy] as SpikeTrap).on
        ) {
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
      */
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

    // Find a path to the target player
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

  // Could encapsulate the common drawing logic NOT IN USE
  private drawLayer(
    delta: number,
    condition: (x: number, y: number) => boolean,
    method: string,
  ): void {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (condition(x, y)) {
          this.roomArray[x][y][method](delta);
        }
      }
    }
  }

  /**
   * Adds a new BeamEffect to the room.
   *
   * @param x1 - Starting tile X coordinate.
   * @param y1 - Starting tile Y coordinate.
   * @param x2 - Ending tile X coordinate.
   * @param y2 - Ending tile Y coordinate.
   */
  public addBeamEffect(x1: number, y1: number, x2: number, y2: number): void {
    const beam = new BeamEffect(x1, y1, x2, y2);
    this.beamEffects.push(beam);
  }
}
