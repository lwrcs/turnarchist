import { CrabEnemy } from "./entity/enemy/crabEnemy";
import { FrogEnemy } from "./entity/enemy/frogEnemy";
import { ZombieEnemy } from "./entity/enemy/zombieEnemy";
import { SkullEnemy } from "./entity/enemy/skullEnemy";
import { EnergyWizardEnemy } from "./entity/enemy/energyWizard";
import { ChargeEnemy } from "./entity/enemy/chargeEnemy";
import { Spawner } from "./entity/enemy/spawner";
import { BishopEnemy } from "./entity/enemy/bishopEnemy";
import { ArmoredzombieEnemy } from "./entity/enemy/armoredzombieEnemy";
import { BigSkullEnemy } from "./entity/enemy/bigSkullEnemy";
import { QueenEnemy } from "./entity/enemy/queenEnemy";
import { KnightEnemy } from "./entity/enemy/knightEnemy";
import { BigKnightEnemy } from "./entity/enemy/bigKnightEnemy";
import { FireWizardEnemy } from "./entity/enemy/fireWizard";

export const enemyClasses = {
  1: CrabEnemy,
  2: FrogEnemy,
  3: ZombieEnemy,
  4: SkullEnemy,
  5: EnergyWizardEnemy,
  6: ChargeEnemy,
  7: Spawner,
  8: BishopEnemy,
  9: ArmoredzombieEnemy,
  10: BigSkullEnemy,
  11: QueenEnemy,
  12: KnightEnemy,
  13: BigKnightEnemy,
  14: FireWizardEnemy,
};

export const enemyMinimumDepth: Record<number, number> = {
  1: 0, // CrabEnemy
  2: 0, // FrogEnemy
  3: 0, // ZombieEnemy
  4: 0, // SkullEnemy
  5: 1, // EnergyWizardEnemy
  6: 2, // ChargeEnemy
  7: 1, // Spawner
  8: 1, // BishopEnemy
  9: 1, // ArmoredzombieEnemy
  10: 3, // BigSkullEnemy
  11: 2, // QueenEnemy
  12: 2, // KnightEnemy
  13: 3, // BigKnightEnemy
  14: 3, // FireWizardEnemy
};

export interface LevelParameters {
  minRoomCount: number;
  maxRoomCount: number;
  maxRoomArea: number;
  mapWidth: number;
  mapHeight: number;
  splitProbabilities: number[];
  wallRemoveProbability: number;
  numLoopDoorsRange: [number, number];
  numberOfRooms: number;
}

export interface EnemyParameters {
  enemyTables: Record<number, number[]>;
  maxDepthTable: number;
  minDepths: Record<number, number>;
}

export class LevelParameterGenerator {
  /**
   * Generates level parameters based on the current depth.
   * @param depth The current depth level.
   * @returns An object conforming to the LevelParameters interface.
   */
  static getParameters(depth: number): LevelParameters {
    return {
      minRoomCount: depth > 0 ? 4 : 5,
      maxRoomCount: depth > 0 ? 12 : 8,
      maxRoomArea: depth > 0 ? 120 : 40,
      mapWidth: depth > 0 ? 35 : 25,
      mapHeight: depth > 0 ? 35 : 25,
      splitProbabilities: [0.75, 1.0, 0.25], // Example probabilities
      wallRemoveProbability: depth > 0 ? 0.5 : 1,
      numLoopDoorsRange: [4, 8], // Random between 4 and 8
      numberOfRooms: depth > 0 ? 5 : 3,
    };
  }

  /**
   * Generates enemy parameters based on the current depth.
   * @param depth The current depth level.
   * @returns An object conforming to the EnemyParameters interface.
   */
  static getEnemyParameters(depth: number): EnemyParameters {
    // Generate the enemy pool based on current depth
    const enemyPoolIds = LevelParameterGenerator.generateEnemyPoolIds(depth);

    // Create enemyTables where each level maps to the enemyPoolIds
    const enemyTables: Record<number, number[]> = {};

    for (let tableDepth = 0; tableDepth <= depth; tableDepth++) {
      // Assign the same pool for all tables up to current depth
      enemyTables[tableDepth] = enemyPoolIds;
    }

    return {
      enemyTables,
      maxDepthTable: depth,
      minDepths: enemyMinimumDepth,
    };
  }

  /**
   * Generates the enemy pool IDs based on the current depth.
   * @param depth The current depth level.
   * @returns An array of selected enemy IDs.
   */
  static generateEnemyPoolIds(depth: number): number[] {
    const availableEnemies = Object.entries(enemyMinimumDepth)
      .filter(([enemyId, minDepth]) => depth >= minDepth)
      .map(([enemyId]) => Number(enemyId));

    const numberOfTypes = LevelParameterGenerator.getNumberOfEnemyTypes(depth);
    const selectedEnemyIds = LevelParameterGenerator.getRandomElements(
      availableEnemies,
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
  static getNumberOfEnemyTypes(depth: number): number {
    // Example logic: depth 0 -> 2 types, depth 1 -> 4, depth 2 -> 6, etc.
    return 2 + depth * 2;
  }

  /**
   * Utility function to get random elements from an array.
   * @param array The array to select from.
   * @param count The number of elements to select.
   * @returns An array of randomly selected elements.
   */
  static getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
}
