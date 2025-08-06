import { Room, RoomType } from "../room/room";
import { Game } from "../game";
import { Entity, EntityType } from "../entity/entity";
import { Item } from "../item/item";
import { DoorType } from "../tile/door";
import { Tile } from "../tile/tile";
import { Enemy } from "../entity/enemy/enemy";
import { LevelParameterGenerator } from "./levelParametersGenerator";
import { Environment } from "./environment";
import { EnvType } from "../constants/environmentTypes";
import { Populator } from "../room/roomPopulator";
import { GameplaySettings } from "../game/gameplaySettings";
import { DownLadder } from "../tile/downLadder";
import { Key } from "../item/key";
import { Lockable } from "../tile/lockable";
import { Random } from "../utility/random";

export interface EnemyParameters {
  enemyTables: Record<number, number[]>;
  maxDepthTable: number;
  minDepths: Record<number, number>;
}

export const enemyMinimumDepth: Record<number, number> = {
  1: 0, // CrabEnemy
  2: 1, // FrogEnemy
  3: 0, // ZombieEnemy
  4: 0, // SkullEnemy
  5: 1, // EnergyWizardEnemy
  6: 2, // ChargeEnemy
  7: 1, // RookEnemy
  8: 1, // BishopEnemy
  9: 1, // ArmoredzombieEnemy
  10: 2, // BigSkullEnemy
  11: 2, // QueenEnemy
  12: 1, // KnightEnemy
  13: 2, // BigKnightEnemy
  14: 2, // FireWizardEnemy
  15: 2, // ArmoredSkullEnemy  16: 2, // ArmoredKnightEnemy
};
/*
interface enemySpawnPoolData {
  maxCount: number;
  minCount: number;
}

interface environmentData {
  name: string;
  preferredEnemies: Array<Enemy>;
  preferredEntities: Array<Entity>;
  entityBlacklist: Array<Entity>;
  enemySpawnPoolData: enemySpawnPoolData;
  roomData: roomData;
}

interface entitySpawnData {
  enemy: Enemy;
  spawnChance: number;
  maximumCount: number;
}
*/

export class Level {
  depth: number;
  levelArray: (Tile | null)[][];
  width: number;
  height: number;
  game: Game;
  rooms: Room[];
  environment: Environment;
  exitRoom: Room;
  startRoom: Room;
  enemyParameters: EnemyParameters;
  isMainPath: boolean = true;
  mapGroup: number;
  populator: Populator;

  constructor(
    game: Game,
    depth: number,
    width: number,
    height: number,
    isMainPath: boolean = true,
    mapGroup: number,
    env: EnvType,
    skipPopulation: boolean = false,
  ) {
    this.game = game;
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.rooms = [];
    this.isMainPath = isMainPath;
    this.initializeLevelArray();
    this.mapGroup = mapGroup;
    this.environment = new Environment(env);
    if (!skipPopulation) {
      this.populator = new Populator(this);
    }

    this.enemyParameters = this.getEnemyParameters();
    //let mainPath = this.isMainPath ? "main" : "side";
  }
  getDownLadder(room: Room): DownLadder {
    if (!room || room.type !== RoomType.ROPEHOLE) {
      console.error("Room is not a rope hole");
      return null;
    }

    // Then check ROPEHOLE rooms
    //let room = this.rooms.find((room) => room.type === RoomType.ROPEHOLE);

    if (room) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          const tile = room.roomArray[x][y];
          if (tile instanceof DownLadder) {
            return tile;
          }
        }
      }
    }

    console.error("No down ladder found");
    return null;
  }

  distributeKeys() {
    // Search the entire level array for down ladders
    let downLadder: DownLadder | null = null;
    for (let room of this.rooms) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          const tile = room.roomArray[x][y];
          if (tile instanceof DownLadder) {
            console.log(`Found down ladder at position (${x}, ${y})`);
            downLadder = tile;
            break;
          }
        }
        if (downLadder) break;
      }
    }

    if (!downLadder) {
      console.error("No down ladder found in level array");
      return;
    }

    this.distributeKey(downLadder);
  }

  distributeKey(downLadder: DownLadder) {
    const rooms = this.rooms.filter(
      (r) =>
        r.type !== RoomType.START &&
        r.type !== RoomType.DOWNLADDER &&
        r.type !== RoomType.ROPEHOLE,
    );

    const disableCoords = {
      disableX: downLadder.x,
      disableY: downLadder.y,
      disableRoom: downLadder.room,
    };

    if (rooms.length === 0) {
      console.error("No eligible rooms found for key placement");
      return;
    }

    const randomRoom = rooms[Math.floor(Random.rand() * rooms.length)];

    let emptyTiles = randomRoom.getEmptyTiles();
    if (disableCoords.disableRoom === randomRoom) {
      emptyTiles = emptyTiles.filter(
        (t) => t.x !== disableCoords.disableX && t.y !== disableCoords.disableY,
      );
    }

    if (emptyTiles.length === 0) {
      console.error(
        `No empty tiles found in room ${randomRoom.id} for key placement`,
      );
      return;
    }

    const randomIndex = Math.floor(Random.rand() * emptyTiles.length);
    const randomTile = emptyTiles[randomIndex];

    const key = new Key(randomRoom, randomTile.x, randomTile.y);
    downLadder.lockable.setKey(key);

    randomRoom.items.push(key);
    console.log("Key successfully distributed and linked to down ladder");
    //this.game.player.inventory.addItem(key);
  }

  setExitRoom() {
    if (this.isMainPath) {
      this.exitRoom = this.rooms.find(
        (room) => room.type === RoomType.DOWNLADDER,
      );
    } else {
      this.exitRoom = this.rooms.find(
        (room) => room.type === RoomType.UPLADDER,
      );
    }
  }

  setStartRoom() {
    if (this.isMainPath) {
      this.startRoom = this.rooms.find((room) => room.type === RoomType.START);
    } else {
      this.startRoom = this.rooms.find(
        (room) => room.type === RoomType.ROPECAVE,
      );
    }
  }

  setRooms(rooms: Room[]) {
    this.rooms = rooms;
    this.setExitRoom();
    this.setStartRoom();
    rooms.forEach((room) => {
      room.id = this.rooms.indexOf(room);
    });
  }

  initializeLevelArray = () => {
    // Create a 300x300 grid for depth 0
    this.levelArray = [];
    for (let x = 0; x < this.width; x++) {
      this.levelArray[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.levelArray[x][y] = null;
      }
    }
  };

  loadRoomsIntoLevelArray = () => {
    for (let room of this.rooms) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          // Add bounds checking
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            // Ensure room array has valid tiles at these coordinates
            if (room.roomArray[x] && room.roomArray[x][y]) {
              this.levelArray[x][y] = room.roomArray[x][y];
            } else {
              console.warn(
                `Room array missing tile at (${x}, ${y}) for room ${room.id}`,
              );
            }
          } else {
            console.warn(
              `Room coordinates (${x}, ${y}) are outside level bounds (${this.width}, ${this.height})`,
            );
          }
        }
      }
    }
  };

  /**
   * Generates enemy parameters based on the current depth.
   * @param depth The current depth level.
   * @returns An object conforming to the EnemyParameters interface.
   */
  getEnemyParameters(): EnemyParameters {
    // This can now be simplified or deprecated since Populator handles everything
    return {
      enemyTables: {},
      maxDepthTable: this.depth,
      minDepths: enemyMinimumDepth,
    };
  }

  setRoomSkins() {
    for (let room of this.rooms) {
      room.skin = this.environment.skin;
    }
  }
}
