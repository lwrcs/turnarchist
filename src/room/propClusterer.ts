import { Random } from "../utility/random";
import { Room } from "./room";
import { Wall } from "../tile/wall";

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
  /** Enable clustering bias toward walls using quadratic falloff (default: false) */
  clusterTowardsWalls?: boolean;
  /** Maximum distance from walls to apply wall bias (default: 10) */
  wallMaxDistance?: number;
  /** Bias strength toward walls (default: 1) */
  wallWeight?: number;
  /** Do not reward tiles closer than this distance to a wall (default: 0) */
  wallDeadzone?: number;
  /** Use only inner walls for attraction (default: false) */
  onlyInnerWalls?: boolean;
  /** Distance metric for wall proximity (default: "euclidean") */
  wallDistanceMetric?: "euclidean" | "manhattan";
  /** Enable structured debugging and capture of internal state (default: false) */
  debugEnabled?: boolean;
  /** Log concise debug info to console during generation (default: false) */
  debugLogToConsole?: boolean;
  /** Collect wall grid and per-iteration top-N scores (default: false) */
  debugCollectDetails?: boolean;
  /** Number of top candidates to capture per iteration (default: 5) */
  debugTopN?: number;
  /** Weight multiplier for proximity to previously placed entities (default: 1) */
  entityWeight?: number;
  /** How to pick the initial seed tile (default: 'random') */
  seedStrategy?: "random" | "bestWall";
  /** If true, attract to floor tiles adjacent to walls instead of wall tiles (default: false) */
  wallAdjacentOnly?: boolean;
  /** Band width in tiles for strong wall attraction; distances beyond band drop sharply (default: undefined) */
  wallBandSize?: number;
}

export interface PropClustererDebugIteration {
  iteration: number;
  availableTiles: number;
  placedSoFar: number;
  totalScore: number;
  usedFallback: boolean;
  selected: { x: number; y: number } | null;
  top?: Array<{
    position: { x: number; y: number };
    total: number;
    base: number;
    entities: number;
    wall: number;
  }>;
}

export interface PropClustererDebugReport {
  config: Required<ClusteringOptions>;
  seedUsed: { x: number; y: number } | null;
  wallsFound: number;
  wallGridStats?: {
    min: number;
    max: number;
    avg: number;
    nonZeroCount: number;
  };
  iterations: PropClustererDebugIteration[];
  wallTargetMode?: "wall" | "adjacentFloor";
}

export interface EffectivenessAnalysisOptions {
  /** Normalized threshold (0..1) on wall score to consider a tile "near wall" (default: 0.7) */
  wallScoreThresholdNormalized?: number;
  /** Max distance (tiles) to count a neighbor prop as supportive (default: 2) */
  neighborMaxDistance?: number;
  /** Weight for neighbor influence in combined score (default: 1) */
  neighborWeight?: number;
  /** Combine mode: 'max' uses max(wall, neighbor), 'sum' adds them and clamps to 1 (default: 'max') */
  combineMode?: "max" | "sum";
}

export interface EffectivenessPerProp {
  position: { x: number; y: number };
  wallScoreNormalized: number; // 0..1
  neighborScore: number; // 0..1, proximity to wall-adjacent neighbor
  combinedScore: number; // 0..1
}

export interface ClusteringEffectivenessReport {
  total: number;
  params: Required<EffectivenessAnalysisOptions> & {
    wallWeightUsed: number;
    wallTargetMode: "wall" | "adjacentFloor";
  };
  perProp: EffectivenessPerProp[];
  summary: {
    avgWall: number;
    avgNeighbor: number;
    avgCombined: number;
    pctNearWall: number; // percent with wallScoreNormalized >= threshold
    pctCombinedHigh: number; // percent with combined >= threshold
  };
}

/**
 * Handles clustering logic for prop placement
 */
export class PropClusterer {
  private room: Room;
  private options: Required<ClusteringOptions>;
  private placedPositions: { x: number; y: number }[] = [];
  private availableTiles: { x: number; y: number }[] = [];
  private wallProximityScoreGrid: number[][] | null = null; // indexed by [x][y] in room-local coords
  private debugReport: PropClustererDebugReport | null = null;

  constructor(room: Room, options: ClusteringOptions = {}) {
    this.room = room;
    this.options = {
      falloffExponent: options.falloffExponent ?? 2,
      baseScore: options.baseScore ?? 0.1,
      maxInfluenceDistance: options.maxInfluenceDistance ?? 10,
      useSeedPosition: options.useSeedPosition ?? false,
      seedPosition: options.seedPosition ?? { x: 0, y: 0 },
      clusterTowardsWalls: options.clusterTowardsWalls ?? false,
      wallMaxDistance: options.wallMaxDistance ?? 10,
      wallWeight: options.wallWeight ?? 1,
      wallDeadzone: options.wallDeadzone ?? 0,
      onlyInnerWalls: options.onlyInnerWalls ?? false,
      wallDistanceMetric: options.wallDistanceMetric ?? "euclidean",
      debugEnabled: options.debugEnabled ?? false,
      debugLogToConsole: options.debugLogToConsole ?? false,
      debugCollectDetails: options.debugCollectDetails ?? false,
      debugTopN: options.debugTopN ?? 5,
      entityWeight: options.entityWeight ?? 1,
      seedStrategy: options.seedStrategy ?? "random",
      wallAdjacentOnly: options.wallAdjacentOnly ?? false,
      wallBandSize: options.wallBandSize ?? undefined,
    };
  }

  /**
   * Generates clustered positions for the specified number of props
   */
  generateClusteredPositions(numProps: number): { x: number; y: number }[] {
    this.placedPositions = [];
    this.availableTiles = this.getAvailableTiles();
    if (this.options.debugEnabled) {
      this.debugReport = {
        config: this.options,
        seedUsed: null,
        wallsFound: 0,
        wallGridStats: undefined,
        iterations: [],
      };
    } else {
      this.debugReport = null;
    }
    // Precompute wall proximity grid once per run if requested
    this.wallProximityScoreGrid = this.options.clusterTowardsWalls
      ? this.computeWallProximityScores()
      : null;

    if (this.availableTiles.length === 0) {
      return [];
    }

    // Initialize with seed position or random position
    if (
      this.options.useSeedPosition &&
      this.isValidPosition(this.options.seedPosition)
    ) {
      this.placePosition(this.options.seedPosition);
      if (this.debugReport)
        this.debugReport.seedUsed = { ...this.options.seedPosition };
    } else if (this.availableTiles.length > 0) {
      if (
        this.options.seedStrategy === "bestWall" &&
        this.wallProximityScoreGrid
      ) {
        let best: { x: number; y: number } | null = null;
        let bestScore = -Infinity;
        for (const tile of this.availableTiles) {
          const lx = tile.x - this.room.roomX;
          const ly = tile.y - this.room.roomY;
          if (
            lx >= 0 &&
            ly >= 0 &&
            lx < this.wallProximityScoreGrid.length &&
            ly < this.wallProximityScoreGrid[0].length
          ) {
            const s = this.wallProximityScoreGrid[lx][ly];
            if (s > bestScore) {
              best = tile;
              bestScore = s;
            }
          }
        }
        const seed =
          best ||
          this.availableTiles[
            Math.floor(Random.rand() * this.availableTiles.length)
          ];
        this.placePosition(seed);
        if (this.debugReport) this.debugReport.seedUsed = { ...seed };
      } else {
        const randomIndex = Math.floor(
          Random.rand() * this.availableTiles.length,
        );
        const randomPosition = this.availableTiles.splice(randomIndex, 1)[0];
        this.placedPositions.push(randomPosition);
        if (this.debugReport) this.debugReport.seedUsed = { ...randomPosition };
      }
    }

    // Generate remaining positions
    for (let i = 1; i < numProps && this.availableTiles.length > 0; i++) {
      const position = this.selectNextPosition(i);
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
  private selectNextPosition(
    iteration: number,
  ): { x: number; y: number } | null {
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
      const fallback = this.availableTiles.splice(randomIndex, 1)[0];
      this.captureDebugIteration(
        iteration,
        totalScore,
        true,
        fallback,
        scoredTiles,
      );
      return fallback;
    }

    // Perform weighted random selection
    const randomValue = Random.rand() * totalScore;
    let cumulativeScore = 0;

    for (const tile of scoredTiles) {
      cumulativeScore += tile.score;
      if (cumulativeScore >= randomValue) {
        this.captureDebugIteration(
          iteration,
          totalScore,
          false,
          tile.position,
          scoredTiles,
        );
        return tile.position;
      }
    }

    // Fallback to last tile
    const last = scoredTiles[scoredTiles.length - 1].position;
    this.captureDebugIteration(iteration, totalScore, true, last, scoredTiles);
    return last;
  }

  /**
   * Calculates the score for a tile based on its proximity to placed entities
   */
  private calculateTileScore(tile: { x: number; y: number }): number {
    let score = this.options.baseScore;

    let entitiesInfluence = 0;
    for (const placed of this.placedPositions) {
      const distance = this.calculateDistance(tile, placed);
      if (distance <= this.options.maxInfluenceDistance) {
        entitiesInfluence +=
          1 / Math.pow(distance, this.options.falloffExponent);
      }
    }
    if (entitiesInfluence > 0)
      score += entitiesInfluence * this.options.entityWeight;

    // Add wall proximity bias (quadratic falloff toward walls)
    if (this.wallProximityScoreGrid) {
      const lx = tile.x - this.room.roomX;
      const ly = tile.y - this.room.roomY;
      if (
        lx >= 0 &&
        ly >= 0 &&
        lx < this.wallProximityScoreGrid.length &&
        ly < this.wallProximityScoreGrid[0].length
      ) {
        score += this.wallProximityScoreGrid[lx][ly];
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

  /**
   * Builds a room-local grid [x][y] of scores in [0, wallWeight] based on
   * proximity to the nearest wall tile, using quadratic falloff.
   */
  private computeWallProximityScores(): number[][] {
    const startX = this.room.roomX;
    const startY = this.room.roomY;
    const width = this.room.width;
    const height = this.room.height;

    // Collect wall tiles within room bounds
    const walls: Wall[] = [];
    for (let gx = startX; gx < startX + width; gx++) {
      const col = this.room.roomArray[gx];
      if (!col) continue;
      for (let gy = startY; gy < startY + height; gy++) {
        const t = col[gy];
        if (t instanceof Wall) {
          if (this.options.onlyInnerWalls ? t.isInnerWall() : true) {
            walls.push(t);
          }
        }
      }
    }

    // Optionally target floor tiles adjacent to walls for a tighter band near walls
    type Point = { x: number; y: number };
    const targets: Point[] = [];
    if (this.options.wallAdjacentOnly) {
      for (let gx = startX; gx < startX + width; gx++) {
        const col = this.room.roomArray[gx];
        if (!col) continue;
        for (let gy = startY; gy < startY + height; gy++) {
          const t = col[gy];
          if (!t || t.isSolid()) continue;
          const left = this.room.roomArray[gx - 1]?.[gy];
          const right = this.room.roomArray[gx + 1]?.[gy];
          const up = this.room.roomArray[gx]?.[gy - 1];
          const down = this.room.roomArray[gx]?.[gy + 1];
          if (
            (left instanceof Wall &&
              (!this.options.onlyInnerWalls || left.isInnerWall())) ||
            (right instanceof Wall &&
              (!this.options.onlyInnerWalls || right.isInnerWall())) ||
            (up instanceof Wall &&
              (!this.options.onlyInnerWalls || up.isInnerWall())) ||
            (down instanceof Wall &&
              (!this.options.onlyInnerWalls || down.isInnerWall()))
          ) {
            targets.push({ x: gx, y: gy });
          }
        }
      }
    }

    const grid: number[][] = new Array(width);
    for (let lx = 0; lx < width; lx++) {
      grid[lx] = new Array(height);
      for (let ly = 0; ly < height; ly++) {
        const gx = startX + lx;
        const gy = startY + ly;

        const score = this.wallScoreForGlobalTile(gx, gy, walls, targets);
        grid[lx][ly] = score;
      }
    }

    if (this.debugReport) {
      this.debugReport.wallsFound = walls.length;
      this.debugReport.wallTargetMode = this.options.wallAdjacentOnly
        ? "adjacentFloor"
        : "wall";
      if (this.options.debugCollectDetails) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        let sum = 0;
        let count = 0;
        for (let lx = 0; lx < width; lx++) {
          for (let ly = 0; ly < height; ly++) {
            const v = grid[lx][ly];
            if (v > 0) {
              if (v < min) min = v;
              if (v > max) max = v;
              sum += v;
              count++;
            }
          }
        }
        this.debugReport.wallGridStats = {
          min: count ? min : 0,
          max: count ? max : 0,
          avg: count ? sum / count : 0,
          nonZeroCount: count,
        };
      }
      if (this.options.debugLogToConsole) {
        console.log(
          "[PropClusterer] walls:",
          walls.length,
          "gridStats:",
          this.debugReport.wallGridStats,
        );
      }
    }

    return grid;
  }

  /** Returns the precomputed wall proximity grid (room-local [x][y]). */
  getWallProximityScores(): number[][] | null {
    return this.wallProximityScoreGrid;
  }

  /** Returns the last debug report for external inspection. */
  getLastDebugReport(): PropClustererDebugReport | null {
    return this.debugReport;
  }

  private wallScoreForGlobalTile(
    gx: number,
    gy: number,
    walls: Wall[],
    adjacentTargets: { x: number; y: number }[],
  ): number {
    if (walls.length === 0) return 0;

    let minDist = Number.POSITIVE_INFINITY;
    if (this.options.wallAdjacentOnly) {
      for (let i = 0; i < adjacentTargets.length; i++) {
        const p = adjacentTargets[i];
        const dx = gx - p.x;
        const dy = gy - p.y;
        const d =
          this.options.wallDistanceMetric === "manhattan"
            ? Math.abs(dx) + Math.abs(dy)
            : Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) minDist = d;
      }
    } else {
      for (let i = 0; i < walls.length; i++) {
        const w = walls[i];
        const dx = gx - w.x;
        const dy = gy - w.y;
        const d =
          this.options.wallDistanceMetric === "manhattan"
            ? Math.abs(dx) + Math.abs(dy)
            : Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) minDist = d;
      }
    }

    const maxD = Math.max(0.0001, this.options.wallMaxDistance);
    const deadzone = Math.max(0, this.options.wallDeadzone);

    if (minDist > maxD) return 0;
    if (minDist < deadzone) return 0;

    // If a tighter band is requested, use band-limited quadratic
    const band = this.options.wallBandSize;
    if (band && band > 0) {
      const normBand = Math.min(1, Math.max(0, (minDist - deadzone) / band));
      const quadBand = 1 - normBand * normBand;
      return this.options.wallWeight * Math.max(0, quadBand);
    }

    // Default quadratic over [deadzone, maxD]
    const norm = (minDist - deadzone) / (maxD - deadzone);
    const quadFalloff = 1 - norm * norm;
    return this.options.wallWeight * Math.max(0, quadFalloff);
  }

  /**
   * Analyze how well placements adhere to walls or to props near walls.
   * Returns per-prop scores (0..1) and a concise summary.
   */
  analyzeEffectiveness(
    placements?: { x: number; y: number }[],
    options: EffectivenessAnalysisOptions = {},
  ): ClusteringEffectivenessReport {
    const usedPlacements =
      placements && placements.length ? placements : this.placedPositions;

    const analysisOptions: Required<EffectivenessAnalysisOptions> = {
      wallScoreThresholdNormalized: options.wallScoreThresholdNormalized ?? 0.7,
      neighborMaxDistance: options.neighborMaxDistance ?? 2,
      neighborWeight: options.neighborWeight ?? 1,
      combineMode: options.combineMode ?? "max",
    } as Required<EffectivenessAnalysisOptions>;

    // Ensure we have a wall proximity grid reflecting current options
    const grid =
      this.wallProximityScoreGrid || this.computeWallProximityScores();
    const wallWeight = Math.max(1e-6, this.options.wallWeight);

    const perProp: EffectivenessPerProp[] = [];

    // Precompute normalized wall scores for all placements
    const normWallScores: number[] = usedPlacements.map((p) => {
      const lx = p.x - this.room.roomX;
      const ly = p.y - this.room.roomY;
      const g =
        lx >= 0 && ly >= 0 && grid && lx < grid.length && ly < grid[0].length
          ? grid[lx][ly]
          : 0;
      return Math.max(0, Math.min(1, g / wallWeight));
    });

    // Identify which props are considered near wall
    const isWallAdjacent: boolean[] = normWallScores.map(
      (n) => n >= analysisOptions.wallScoreThresholdNormalized,
    );

    // For each prop, find nearest wall-adjacent neighbor and compute neighborScore (0..1)
    for (let i = 0; i < usedPlacements.length; i++) {
      const p = usedPlacements[i];
      const wallScoreNormalized = normWallScores[i];

      let bestNeighborDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < usedPlacements.length; j++) {
        if (i === j) continue;
        if (!isWallAdjacent[j]) continue;
        const q = usedPlacements[j];
        const d = this.calculateDistance(p, q);
        if (d < bestNeighborDist) bestNeighborDist = d;
      }

      let neighborScore = 0;
      if (bestNeighborDist !== Number.POSITIVE_INFINITY) {
        const maxD = Math.max(analysisOptions.neighborMaxDistance, 1e-6);
        if (bestNeighborDist <= maxD) {
          const norm = Math.max(0, Math.min(1, bestNeighborDist / maxD));
          neighborScore = 1 - norm * norm; // quadratic falloff
        }
      }

      // Combine wall and neighbor components
      let combined: number;
      if (analysisOptions.combineMode === "sum") {
        combined = Math.min(
          1,
          wallScoreNormalized + neighborScore * analysisOptions.neighborWeight,
        );
      } else {
        combined = Math.max(
          wallScoreNormalized,
          neighborScore * analysisOptions.neighborWeight,
        );
      }

      perProp.push({
        position: { x: p.x, y: p.y },
        wallScoreNormalized,
        neighborScore,
        combinedScore: combined,
      });
    }

    // Summaries
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const avgWall = avg(perProp.map((r) => r.wallScoreNormalized));
    const avgNeighbor = avg(perProp.map((r) => r.neighborScore));
    const avgCombined = avg(perProp.map((r) => r.combinedScore));
    const threshold = analysisOptions.wallScoreThresholdNormalized;
    const pctNearWall =
      perProp.filter((r) => r.wallScoreNormalized >= threshold).length /
      Math.max(1, perProp.length);
    const pctCombinedHigh =
      perProp.filter((r) => r.combinedScore >= threshold).length /
      Math.max(1, perProp.length);

    const report: ClusteringEffectivenessReport = {
      total: perProp.length,
      params: {
        ...analysisOptions,
        wallWeightUsed: wallWeight,
        wallTargetMode: this.options.wallAdjacentOnly
          ? "adjacentFloor"
          : "wall",
      },
      perProp,
      summary: {
        avgWall,
        avgNeighbor,
        avgCombined,
        pctNearWall,
        pctCombinedHigh,
      },
    };

    if (this.options.debugLogToConsole) {
      console.log("[PropClusterer] effectiveness:", {
        total: report.total,
        params: report.params,
        summary: {
          avgWall: Number(avgWall.toFixed(3)),
          avgNeighbor: Number(avgNeighbor.toFixed(3)),
          avgCombined: Number(avgCombined.toFixed(3)),
          pctNearWall: Number((pctNearWall * 100).toFixed(1)) + "%",
          pctCombinedHigh: Number((pctCombinedHigh * 100).toFixed(1)) + "%",
        },
      });
    }

    return report;
  }

  private captureDebugIteration(
    iteration: number,
    totalScore: number,
    usedFallback: boolean,
    selected: { x: number; y: number } | null,
    scoredTiles: Array<{ position: { x: number; y: number }; score: number }>,
  ): void {
    if (!this.options.debugEnabled || !this.debugReport) return;

    const entry: PropClustererDebugIteration = {
      iteration,
      availableTiles: this.availableTiles.length,
      placedSoFar: this.placedPositions.length,
      totalScore,
      usedFallback,
      selected,
    };

    if (this.options.debugCollectDetails) {
      const topN = Math.max(0, this.options.debugTopN || 0);
      if (topN > 0) {
        // Copy and sort descending by score to get top candidates
        const sorted = scoredTiles
          .slice(0)
          .sort((a, b) => b.score - a.score)
          .slice(0, topN);
        entry.top = sorted.map((t) => {
          const breakdown = this.breakdownTileScore(t.position);
          return {
            position: { ...t.position },
            total: breakdown.total,
            base: breakdown.base,
            entities: breakdown.entities,
            wall: breakdown.wall,
          };
        });
      }
    }

    this.debugReport.iterations.push(entry);
    if (this.options.debugLogToConsole) {
      const top0 = entry.top && entry.top[0];
      console.log(
        "[PropClusterer] iter",
        iteration,
        "avail=",
        entry.availableTiles,
        "placed=",
        entry.placedSoFar,
        "totalScore=",
        totalScore.toFixed(3),
        usedFallback ? "(fallback)" : "",
        top0
          ? {
              topPos: top0.position,
              base: Number(top0.base.toFixed(3)),
              entities: Number(top0.entities.toFixed(3)),
              wall: Number(top0.wall.toFixed(3)),
              total: Number(top0.total.toFixed(3)),
            }
          : undefined,
      );
    }
  }

  private breakdownTileScore(tile: { x: number; y: number }): {
    base: number;
    entities: number;
    wall: number;
    total: number;
  } {
    const base = this.options.baseScore;
    let entities = 0;
    for (const placed of this.placedPositions) {
      const distance = this.calculateDistance(tile, placed);
      if (distance <= this.options.maxInfluenceDistance) {
        entities += 1 / Math.pow(distance, this.options.falloffExponent);
      }
    }
    let wall = 0;
    if (this.wallProximityScoreGrid) {
      const lx = tile.x - this.room.roomX;
      const ly = tile.y - this.room.roomY;
      if (
        lx >= 0 &&
        ly >= 0 &&
        lx < this.wallProximityScoreGrid.length &&
        ly < this.wallProximityScoreGrid[0].length
      ) {
        wall = this.wallProximityScoreGrid[lx][ly];
      }
    }
    const total = base + entities * this.options.entityWeight + wall;
    return { base, entities, wall, total };
  }
}
