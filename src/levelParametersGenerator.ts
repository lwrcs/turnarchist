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
import { RookEnemy } from "./entity/enemy/rookEnemy";

export const enemyClasses = {
  1: CrabEnemy,
  2: FrogEnemy,
  3: ZombieEnemy,
  4: SkullEnemy,
  5: EnergyWizardEnemy,
  6: ChargeEnemy,
  7: RookEnemy,
  8: BishopEnemy,
  9: ArmoredzombieEnemy,
  10: BigSkullEnemy,
  11: QueenEnemy,
  12: KnightEnemy,
  13: BigKnightEnemy,
  14: FireWizardEnemy,
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
  softMaxRoomArea: number;
}

export class LevelParameterGenerator {
  /**
   * Generates level parameters based on the current depth.
   * @param depth The current depth level.
   * @returns An object conforming to the LevelParameters interface.
   */
  static getParameters(depth: number): LevelParameters {
    return {
      minRoomCount: depth > 0 ? 0 : 0,
      maxRoomCount: depth > 0 ? 12 : 5,
      maxRoomArea: depth > 0 ? 120 + 10 * depth : 40,
      mapWidth: 25 + 5 * depth,
      mapHeight: 25 + 5 * depth,
      splitProbabilities: [0.75, 1.0, 0.25], // Example probabilities
      wallRemoveProbability: depth > 0 ? 0.1 : 1,
      numLoopDoorsRange: [4, 8], // Random between 4 and 8
      numberOfRooms: depth > 0 ? 5 : 3,
      softMaxRoomArea: depth > 0 ? 0.5 * (120 + 10 * depth) : 20,
    };
  }
}
