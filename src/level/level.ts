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
import { UpLadder } from "../tile/upLadder";
import { Key } from "../item/key";
import { Lockable } from "../tile/lockable";
import { Random } from "../utility/random";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import type { SidePathOptions } from "./sidePathManager";

export interface EnemyParameters {
  enemyTables: Record<number, number[]>;
  maxDepthTable: number;
  minDepths: Record<number, number>;
}

const enemyMinimumDepth: Record<number, number> = {
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
  16: 2, // SpiderEnemy
  17: 2, // MummyEnemy
  18: 3, // WardenEnemy
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
  globalId: string;
  depth: number;
  levelArray: (Tile | null)[][];
  width: number;
  height: number;
  game: Game;
  rooms: Room[];
  roomsById: Map<string, Room>;
  // Group rooms by path identifier
  paths: Map<string, Room[]> = new Map();
  pathsById: Map<string, Map<string, Room>> = new Map();
  environment: Environment;
  exitRoom: Room;
  startRoom: Room;
  enemyParameters: EnemyParameters;
  isMainPath: boolean = true;
  mapGroup: number;
  populator: Populator;
  skipPopulation: boolean = false;
  generationOptions?: SidePathOptions;
  organicTunnelsAvoidCenter: boolean;

  constructor(
    game: Game,
    depth: number,
    width: number,
    height: number,
    isMainPath: boolean = true,
    mapGroup: number,
    env: EnvType,
    skipPopulation: boolean = false,
    generationOptions?: SidePathOptions,
  ) {
    this.game = game;
    this.globalId = IdGenerator.generate("L");
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.rooms = [];
    this.roomsById = new Map();
    this.isMainPath = isMainPath;
    this.initializeLevelArray();
    this.mapGroup = mapGroup;
    this.environment = new Environment(env);
    this.populator = new Populator(this, skipPopulation);
    this.skipPopulation = skipPopulation;
    this.generationOptions = generationOptions;
    this.organicTunnelsAvoidCenter =
      generationOptions?.organicTunnelsAvoidCenter ??
      GameplaySettings.ORGANIC_TUNNELS_AVOID_CENTER_DEFAULT;

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

  /**
   * Finds the first sidepath DownLadder whose lockable.keyID matches the provided keyID
   * within the same path of the provided origin room. Returns the ladder tile and its room.
   */
  findSidepathDownLadderByKeyID = (
    origin: Room,
    keyID: number,
  ): { ladder: DownLadder; room: Room } | null => {
    if (!origin || keyID === null || keyID === undefined) return null;
    // Search rooms reachable on the same path as origin
    const rooms = origin.path();
    console.log(
      `findSidepathDownLadderByKeyID: origin=${(origin as any).globalId} keyID=${keyID} roomsInPath=${rooms.length}`,
    );
    for (const r of rooms) {
      for (let x = r.roomX; x < r.roomX + r.width; x++) {
        for (let y = r.roomY; y < r.roomY + r.height; y++) {
          const tile = r.roomArray[x][y];
          if (tile instanceof DownLadder && tile.isSidePath) {
            const dlKey = tile.lockable?.keyID;
            if (dlKey === keyID) {
              console.log(
                `findSidepathDownLadderByKeyID: MATCH room=${(r as any).globalId} at (${x},${y}) keyID=${dlKey}`,
              );
              return { ladder: tile, room: r };
            } else {
              // Log near misses occasionally
              if (Math.random() < 0.02)
                console.log(
                  `findSidepathDownLadderByKeyID: saw sidepath downladder key=${dlKey}, want=${keyID} in room ${(r as any).globalId}`,
                );
            }
          }
        }
      }
    }
    console.log(
      `findSidepathDownLadderByKeyID: NO MATCH for keyID=${keyID} from origin ${(origin as any).globalId}`,
    );
    return null;
  };

  getKeyRoom(room: Room): Room | null {
    const rooms = room.path();
    for (const room of rooms) {
      if (room.hasKey()) return room;
    }
    return null;
  }

  distributeKey(downLadder: DownLadder, room?: Room) {
    if (this.skipPopulation) return;

    const disableCoords = {
      disableX: downLadder.x,
      disableY: downLadder.y,
      disableRoom: downLadder.room,
    };

    const rooms = downLadder.room.path();

    if (rooms.length === 0) {
      console.error("No eligible rooms found for key placement");
      return;
    }

    const randomRoom = this.getFurthestFromLadders(downLadder.room);
    const roomToDistributeKey = room ? room : randomRoom;

    let emptyTiles = roomToDistributeKey.getEmptyTiles();
    if (disableCoords.disableRoom === roomToDistributeKey) {
      emptyTiles = emptyTiles.filter(
        (t) => t.x !== disableCoords.disableX && t.y !== disableCoords.disableY,
      );
    }

    if (emptyTiles.length === 0) {
      console.error(
        `No empty tiles found in room ${roomToDistributeKey.id} for key placement, unlocking downladder ${downLadder.room.id}`,
        downLadder.lockable.removeLock(),
      );
      return;
    }

    const randomIndex = Math.floor(Random.rand() * emptyTiles.length);
    const randomTile = emptyTiles[randomIndex];

    const key = new Key(roomToDistributeKey, randomTile.x, randomTile.y);
    downLadder.lockable.setKey(key);

    roomToDistributeKey.items.push(key);
    //console.log("Key successfully distributed and linked to down ladder");
    //this.game.player.inventory.addItem(key);
  }

  setExitRoom(mainPath = true) {
    if (mainPath) {
      // Prefer tile presence over RoomType so a room can contain a down ladder without
      // being classified as a DOWNLADDER room (needed for single-room levels).
      this.exitRoom =
        this.rooms.find((room) => (room as any).hasMainDownLadder?.()) ??
        this.rooms.find((room) => room.type === RoomType.DOWNLADDER);
    } else {
      this.exitRoom = this.getLadderRoom(
        this.rooms[this.rooms.length - 1],
        "down",
      );
    }
  }

  setStartRoom(mainPath = true) {
    if (mainPath) {
      // Prefer a non-rope UpLadder tile if present; otherwise fall back to START room.
      let start: Room | undefined;
      for (const room of this.rooms) {
        for (let x = room.roomX; x < room.roomX + room.width; x++) {
          for (let y = room.roomY; y < room.roomY + room.height; y++) {
            const t = room.roomArray[x]?.[y];
            if (t instanceof UpLadder && !(t as any).isRope) {
              start = room;
              break;
            }
          }
          if (start) break;
        }
        if (start) break;
      }
      this.startRoom =
        start ??
        this.rooms.find((room) => room.type === RoomType.START) ??
        this.rooms.find((room) => room.type === RoomType.UPLADDER);
    } else {
      this.startRoom = this.getLadderRoom(
        this.rooms[this.rooms.length - 1],
        "up",
      );
    }
  }

  /**
   * Recompute start/exit rooms after population has placed ladder tiles.
   * This is safe for existing generation (RoomType fallbacks) and necessary
   * for single-room levels where ladders are not encoded via RoomType.
   */
  refreshStartExitRooms(mainPath = true) {
    this.setExitRoom(mainPath);
    this.setStartRoom(mainPath);
  }

  getLadderRoom = (room: Room, ladderType: "up" | "down"): Room | null => {
    for (const r of room.path()) {
      if (r.hasLadder(ladderType)) return r;
    }
    return null;
  };

  setRooms(rooms: Room[]) {
    this.rooms = rooms;
    this.setExitRoom();
    this.setStartRoom();
    this.roomsById.clear();
    this.paths.clear();
    this.pathsById.clear();
    rooms.forEach((room) => {
      room.id = this.rooms.indexOf(room);
      this.roomsById.set(room.globalId, room);
      const pid = room.pathId || "main";
      if (!this.paths.has(pid)) this.paths.set(pid, []);
      if (!this.pathsById.has(pid)) this.pathsById.set(pid, new Map());
      this.paths.get(pid)!.push(room);
      this.pathsById.get(pid)!.set(room.globalId, room);
    });
    this.game.roomsById = new Map(rooms.map((r) => [r.globalId, r]));
  }

  getRoomById(id: string): Room | undefined {
    return this.roomsById.get(id);
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

  getFurthestFromLadder = (ladderType: "up" | "down"): Room | null => {
    let furthestRoom: Room | null = null;
    // Allow 0-distance rooms (e.g., single-room levels where the ladder is in this room).
    let furthestDistance = -Infinity;

    for (const room of this.rooms) {
      const distance = room.getDistanceToNearestLadder(ladderType);
      if (distance === null || distance === undefined) continue;
      if (distance > furthestDistance) {
        furthestDistance = distance;
        furthestRoom = room;
      }
    }
    return furthestRoom;
  };

  getFurthestFromLadders = (downLadderRoom: Room): Room | null => {
    let furthestRoom: Room | null = null;
    let furthestMinDistance = -Infinity;

    // Consider all rooms in the level. We want the room whose minimum distance
    // to both ladder types is maximized. If only one ladder type exists, we
    // fall back to maximizing distance to the one that exists.
    const rooms = downLadderRoom.path();

    let distanceToUp = 0;
    let distanceToDown = 0;
    for (const room of rooms) {
      const upDistance = room.getDistanceToNearestLadder("up");
      const downDistance = room.getDistanceToNearestLadder("down");

      distanceToUp = upDistance;
      distanceToDown = downDistance;

      const distances: number[] = [];
      if (upDistance !== null && upDistance !== undefined)
        distances.push(upDistance);
      if (downDistance !== null && downDistance !== undefined)
        distances.push(downDistance);

      if (distances.length === 0) continue; // no ladders present anywhere

      const minDistance = Math.min(...distances);

      if (minDistance > furthestMinDistance) {
        furthestMinDistance = minDistance;
        furthestRoom = room;
      }
    }
    const up = furthestRoom?.getDistanceToNearestLadder("up");
    const down = furthestRoom?.getDistanceToNearestLadder("down");
    console.log("furthestRoom", furthestRoom?.globalId, {
      up,
      down,
      furthestMinDistance,
    });
    return furthestRoom;
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
