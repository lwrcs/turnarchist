import { Room } from "./room";
import { Game } from "./game";
import { Entity, EntityType } from "./entity/entity";
import { Item } from "./item/item";
import { DoorType } from "./tile/door";
import { Tile } from "./tile/tile";
import { Enemy } from "./entity/enemy/enemy";
import { LevelParameterGenerator } from "./levelParametersGenerator";

export interface EnemyParameters {
  enemyTables: Record<number, number[]>;
  maxDepthTable: number;
  minDepths: Record<number, number>;
}

export const enemyMinimumDepth: Record<number, number> = {
  1: 0, // CrabEnemy
  2: 0, // FrogEnemy
  3: 0, // ZombieEnemy
  4: 0, // SkullEnemy
  5: 1, // EnergyWizardEnemy
  6: 2, // ChargeEnemy
  7: 200, // Spawner (200 is a placeholder, as it's not used in the level generation)
  8: 1, // BishopEnemy
  9: 1, // ArmoredzombieEnemy
  10: 3, // BigSkullEnemy
  11: 2, // QueenEnemy
  12: 2, // KnightEnemy
  13: 3, // BigKnightEnemy
  14: 3, // FireWizardEnemy
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
  //environmentData: environmentData;
  //enemySpawnPool: Array<entitySpawnData>;
  enemyParameters: EnemyParameters;
  constructor(game: Game, depth: number, width: number, height: number) {
    this.game = game;
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.rooms = game.rooms;
    this.initializeLevelArray();
    //this.loadRoomsIntoLevelArray();
    console.log(`depth: ${this.depth}`);
    this.enemyParameters = this.getEnemyParameters();
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
    let currentDepth = this.depth <= 7 ? this.depth : 8;
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
    console.log(
      `encounteredEnemies for depth ${this.depth}: ${this.game.encounteredEnemies}`,
    );

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
    const newEnemiesToAddCount = Math.min(newEnemies.length, 2);
    const newEnemiesToAdd = this.getRandomElements(
      newEnemies,
      newEnemiesToAddCount,
    );

    // Add the new enemies to encounteredEnemies
    this.game.encounteredEnemies.push(...newEnemiesToAdd);

    // Log the newly added enemies for debugging
    console.log(`New enemies introduced at depth ${depth}: ${newEnemiesToAdd}`);

    // Combine encountered enemies to form the enemy pool
    const enemyPoolIds = this.game.encounteredEnemies.slice();

    // Determine the number of enemy types for the current depth
    const numberOfTypes = this.getNumberOfEnemyTypes(depth);

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
    let numberOfTypes = depth === 0 ? 2 : Math.ceil(Math.sqrt(depth + 1)) + 2;
    console.log(`numberOfTypes: ${numberOfTypes}`);
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
}
