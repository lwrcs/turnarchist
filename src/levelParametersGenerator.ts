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
}
