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

    this.populator = new Populator(this);

    this.enemyParameters = this.getEnemyParameters();
    let mainPath = this.isMainPath ? "main" : "side";
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
    const downLadder = this.getDownLadder(
      this.rooms?.find((r) => r.type === RoomType.ROPEHOLE),
    );
    if (!downLadder) {
      console.error("No down ladder found");
      return;
    }

    const randomRoom =
      this.rooms[Math.floor(Math.random() * this.rooms.length)];
    const randomTile =
      randomRoom.getEmptyTiles()[randomRoom.getEmptyTiles().length - 1];

    const key = new Key(randomRoom, randomTile.x, randomTile.y);
    downLadder.lockable.setKey(key);

    randomRoom.items.push(key);
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
          this.levelArray[x][y] = room.roomArray[x][y];
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
    let currentDepth = this.depth;
    // Generate the enemy pool based on current depth
    const enemyPoolIds = this.generateEnemyPoolIds(currentDepth);

    // Create enemyTables where each level maps to the enemyPoolIds
    const enemyTables: Record<number, number[]> = {};

    for (let tableDepth = 0; tableDepth <= currentDepth; tableDepth++) {
      // Assign the same pool for all tables up to current depth
      enemyTables[tableDepth] = enemyPoolIds;
    }
    const newEnemies = enemyTables[currentDepth].filter(
      (id) => !this.game.encounteredEnemies.includes(id),
    );
    this.game.encounteredEnemies.push(...newEnemies);
    //console.log(
    //`encounteredEnemies for depth ${this.depth}: ${this.game.encounteredEnemies}`,
    //);

    return {
      enemyTables,
      maxDepthTable: currentDepth,
      minDepths: enemyMinimumDepth,
    };
  }

  /**
   * Generates the enemy pool IDs based on the current depth, introducing up to 2 new enemies each level.
   * @param depth The current depth level.
   * @returns An array of selected enemy IDs.
   */
  generateEnemyPoolIds(depth: number): number[] {
    const availableEnemies = Object.entries(enemyMinimumDepth)
      .filter(([enemyId, minDepth]) => depth >= minDepth)
      .map(([enemyId]) => Number(enemyId));

    // Determine which enemies are new (not yet encountered)
    const newEnemies = availableEnemies.filter(
      (id) => !this.game.encounteredEnemies.includes(id),
    );

    // Decide how many new enemies to introduce (1 or 2)
    const newEnemiesToAddCount = GameplaySettings.LIMIT_ENEMY_TYPES
      ? Math.min(newEnemies.length, 2)
      : newEnemies.length;
    const newEnemiesToAdd = this.getRandomElements(
      newEnemies,
      newEnemiesToAddCount,
    );

    // Add the new enemies to encounteredEnemies
    this.game.encounteredEnemies.push(...newEnemiesToAdd);

    // Log the newly added enemies for debugging
    // console.log(`New enemies introduced at depth ${depth}: ${newEnemiesToAdd}`);

    // Combine encountered enemies to form the enemy pool
    const enemyPoolIds = this.game.encounteredEnemies.slice();

    // Determine the number of enemy types for the current depth
    const numberOfTypes = GameplaySettings.LIMIT_ENEMY_TYPES
      ? this.getNumberOfEnemyTypes(depth)
      : enemyPoolIds.length;

    // Select the final set of enemy IDs for the pool
    const selectedEnemyIds = this.getRandomElements(
      enemyPoolIds,
      numberOfTypes,
    );

    // Ensure uniqueness and limit based on available enemies
    return Array.from(new Set(selectedEnemyIds)).slice(0, numberOfTypes);
  }

  /**
   * Determines the number of enemy types allowed based on the current depth.
   * @param depth The current depth level.
   * @returns The number of enemy types.
   */
  getNumberOfEnemyTypes(depth: number): number {
    // Example logic: depth 0 -> 2 types, depth 1 -> 4, depth 2 -> 6, etc.
    let numberOfTypes = depth === 0 ? 2 : Math.ceil(Math.sqrt(depth + 1)) + 4;
    //console.log(`numberOfTypes: ${numberOfTypes}`);
    return numberOfTypes;
  }

  /**
   * Utility function to get random elements from an array.
   * @param array The array to select from.
   * @param count The number of elements to select.
   * @returns An array of randomly selected elements.
   */
  getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  setRoomSkins() {
    for (let room of this.rooms) {
      room.skin = this.environment.skin;
      console.log(`room ${room.id} skin: ${room.skin}`);
    }
  }
}
