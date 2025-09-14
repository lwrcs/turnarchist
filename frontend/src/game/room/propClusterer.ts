import { Random } from "../utility/random";
import { Room } from "./room";

/**
 * Configuration options for clustering behavior
 */
export interface ClusteringOptions {
  /** Falloff function exponent (default: 2 for inverse square distance) */
  falloffExponent?: number;
  /** Base score added to all tiles to ensure some randomness (default: 0.1) */
  baseScore?: number;
  /** Maximum distance for influence calculation (default: 10) */
  maxInfluenceDistance?: number;
  /** Whether to use a seed position or start randomly (default: false) */
  useSeedPosition?: boolean;
  /** Seed position coordinates (used if useSeedPosition is true) */
  seedPosition?: { x: number; y: number };
}

/**
 * Handles clustering logic for prop placement
 */
export class PropClusterer {
  private room: Room;
  private options: Required<ClusteringOptions>;
  private placedPositions: { x: number; y: number }[] = [];
  private availableTiles: { x: number; y: number }[] = [];

  constructor(room: Room, options: ClusteringOptions = {}) {
    this.room = room;
    this.options = {
      falloffExponent: options.falloffExponent ?? 2,
      baseScore: options.baseScore ?? 0.1,
      maxInfluenceDistance: options.maxInfluenceDistance ?? 10,
      useSeedPosition: options.useSeedPosition ?? false,
      seedPosition: options.seedPosition ?? { x: 0, y: 0 },
    };
  }

  /**
   * Generates clustered positions for the specified number of props
   */
  generateClusteredPositions(numProps: number): { x: number; y: number }[] {
    this.placedPositions = [];
    this.availableTiles = this.getAvailableTiles();

    if (this.availableTiles.length === 0) {
      return [];
    }

    // Initialize with seed position or random position
    if (
      this.options.useSeedPosition &&
      this.isValidPosition(this.options.seedPosition)
    ) {
      this.placePosition(this.options.seedPosition);
    } else if (this.availableTiles.length > 0) {
      const randomIndex = Math.floor(
        Random.rand() * this.availableTiles.length,
      );
      const randomPosition = this.availableTiles.splice(randomIndex, 1)[0];
      this.placedPositions.push(randomPosition);
    }

    // Generate remaining positions
    for (let i = 1; i < numProps && this.availableTiles.length > 0; i++) {
      const position = this.selectNextPosition();
      if (position) {
        this.placePosition(position);
      } else {
        break; // No valid positions left
      }
    }

    return [...this.placedPositions];
  }

  /**
   * Gets all available tiles in the room
   */
  private getAvailableTiles(): { x: number; y: number }[] {
    const tiles = this.room.getEmptyTiles();
    return tiles.map((tile) => ({ x: tile.x, y: tile.y }));
  }

  /**
   * Checks if a position is valid and available
   */
  private isValidPosition(position: { x: number; y: number }): boolean {
    return this.availableTiles.some(
      (tile) => tile.x === position.x && tile.y === position.y,
    );
  }

  /**
   * Places a position and removes it from available tiles
   */
  private placePosition(position: { x: number; y: number }): void {
    this.placedPositions.push(position);
    this.availableTiles = this.availableTiles.filter(
      (tile) => !(tile.x === position.x && tile.y === position.y),
    );
  }

  /**
   * Selects the next position based on clustering algorithm
   */
  private selectNextPosition(): { x: number; y: number } | null {
    if (this.availableTiles.length === 0) {
      return null;
    }

    // Score each available tile based on proximity to placed entities
    const scoredTiles = this.availableTiles.map((tile) => ({
      position: tile,
      score: this.calculateTileScore(tile),
    }));

    // Normalize scores to create probability weights
    const totalScore = scoredTiles.reduce((sum, tile) => sum + tile.score, 0);

    if (totalScore <= 0) {
      // Fallback to uniform distribution if all scores are 0
      const randomIndex = Math.floor(
        Random.rand() * this.availableTiles.length,
      );
      return this.availableTiles.splice(randomIndex, 1)[0];
    }

    // Perform weighted random selection
    const randomValue = Random.rand() * totalScore;
    let cumulativeScore = 0;

    for (const tile of scoredTiles) {
      cumulativeScore += tile.score;
      if (cumulativeScore >= randomValue) {
        return tile.position;
      }
    }

    // Fallback to last tile
    return scoredTiles[scoredTiles.length - 1].position;
  }

  /**
   * Calculates the score for a tile based on its proximity to placed entities
   */
  private calculateTileScore(tile: { x: number; y: number }): number {
    let score = this.options.baseScore;

    for (const placed of this.placedPositions) {
      const distance = this.calculateDistance(tile, placed);

      if (distance <= this.options.maxInfluenceDistance) {
        // Use inverse power function for falloff
        const influence = 1 / Math.pow(distance, this.options.falloffExponent);
        score += influence;
      }
    }

    return score;
  }

  /**
   * Calculates Euclidean distance between two positions
   */
  private calculateDistance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
  ): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
