/**
 * Single source of truth for sidepath progression.
 *
 * Maps (depth, parentEnvironment) → what sidepath(s) to create, including
 * environment type and SidePathOptions. Consolidates logic previously spread
 * across roomPopulator.populateRooms(), roomPopulator.addDownladder(),
 * roomPopulator.getEnvDrivenSidePathOptions(), and roomPopulator.getNextSidePathEnvType().
 */

import { EnvType } from "../constants/environmentTypes";
import {
  type SidePathOptions,
  CASTLE_LIKE_ENV_TYPES,
  createCastleSidePathOptions,
  createDarkCastleSidePathOptions,
} from "./sidePathManager";
import { GameplaySettings } from "../game/gameplaySettings";

export interface SidePathSpec {
  environment: EnvType;
  options: SidePathOptions;
}

// ---------------------------------------------------------------------------
// Depth-based sidepath specs for DUNGEON parent environments
// ---------------------------------------------------------------------------

function getDungeonDepthSpec(depth: number, rand?: () => number): SidePathSpec | null {
  if (depth === 0 && GameplaySettings.TUTORIAL_ENABLED) {
    return {
      environment: EnvType.TUTORIAL,
      options: {
        caveRooms: 5,
        locked: true,
        envType: EnvType.TUTORIAL,
        linearity: 1,
        mapWidth: 20,
        mapHeight: 10,
      },
    };
  }

  if (depth === 0) {
    const baseSize = 25;
    const longSize = 35;
    const tall = rand ? rand() < 0.5 : Math.random() < 0.5;
    return {
      environment: EnvType.SEWER,
      options: {
        caveRooms: 1,
        envType: EnvType.SEWER,
        locked: false,
        terminal: true,
        noBoss: true,
        linearity: 0.5,
        mapWidth: tall ? baseSize : longSize,
        mapHeight: tall ? longSize : baseSize,
        giantRoomScale: 0.6,
        entranceInMainRoom: true,
        organicTunnelsAvoidCenter: true,
        softMargin: 5,
        tunnelRadiusScale: 0.5,
        squareBrush: true,
        angularMaze: true,
        tunnelMinRadius: 1,
        tunnelMaxRadius: 1.5,
        maxNodeRadius: 2,
        minNodeSeparation: 13,
        nodeCountTable: [5, 6, 7],
        enemyDensityScale: 0.2,
      },
    };
  }

  if (depth < 1 || depth > GameplaySettings.MAX_DEPTH_FOR_SIDEPATHS) {
    return null;
  }

  // Base options shared by all non-tutorial dungeon sidepaths
  const base: SidePathOptions = {
    caveRooms: 5,
    locked: true,
    linearity: 0,
    mapWidth: 100,
    mapHeight: 100,
    giantCentralRoom: true,
    giantRoomScale: 0.4,
  };

  switch (depth) {
    case 1:
      return {
        environment: EnvType.FOREST,
        options: {
          ...base,
          envType: EnvType.FOREST,
          caveRooms: 1,
          mapWidth: 50,
          mapHeight: 50,
          giantRoomScale: 0.6,
          linearity: 0.5,
          entranceInMainRoom: true,
          keyInMainRoom: true,
          exitInMainRoom: true,
          organicTunnelsAvoidCenter: true,
          softMargin: 5,
        },
      };

    case 2:
      return {
        environment: EnvType.CAVE,
        options: {
          ...base,
          envType: EnvType.CAVE,
          caveRooms: 1,
          mapWidth: 88,
          mapHeight: 88,
          linearity: 0.5,
          softMargin: 6,
        },
      };

    default:
      // Depth 3+: use the default env for this depth with base options
      return {
        environment: getDefaultSidePathEnv(depth),
        options: {
          ...base,
          envType: getDefaultSidePathEnv(depth),
        },
      };
  }
}

// ---------------------------------------------------------------------------
// Environment-driven sidepath specs (sidepath-of-sidepath chains)
// ---------------------------------------------------------------------------

/**
 * When inside a sidepath with a given environment, what further sidepath
 * should the exit ladder lead to?
 *
 * `numParentRooms` is needed for DARK_DUNGEON which scales cave rooms.
 */
function getEnvDrivenSpec(
  parentEnv: EnvType,
  numParentRooms?: number,
): SidePathSpec | null {
  switch (parentEnv) {
    case EnvType.FOREST:
      return {
        environment: EnvType.CASTLE,
        options: createCastleSidePathOptions(),
      };

    case EnvType.DARK_DUNGEON:
      return {
        environment: EnvType.DARK_CASTLE,
        options: {
          caveRooms: (numParentRooms ?? 5) * 2,
          locked: true,
          envType: EnvType.DARK_CASTLE,
          linearity: 0.8,
        },
      };

    case EnvType.DARK_CASTLE:
      // Previously defined in getNextSidePathEnvType but not wired into
      // getEnvDrivenSidePathOptions. Preserved here for future use.
      return {
        environment: EnvType.MAGMA_CAVE,
        options: {
          envType: EnvType.MAGMA_CAVE,
          caveRooms: 8,
          locked: true,
        },
      };

    // Terminal environments: no further sidepaths
    case EnvType.CAVE:
    case EnvType.CAVE_POCKET:
    case EnvType.CASTLE:
    case EnvType.MAGMA_CAVE:
    case EnvType.FLOODED_CAVE:
    case EnvType.TUTORIAL:
    case EnvType.DUNGEON:
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns 0–2 sidepath specs for the given (depth, parentEnvironment) combo.
 *
 * A DUNGEON level can produce both a depth-based sidepath (forest/cave/tutorial)
 * AND an env-driven sidepath, so this returns an array.
 *
 * `skipEnvDriven` should be true when the caller handles the env-driven exit
 * ladder itself (e.g. single-room sidepath mazes).
 */
export function getSidePathSpecs(
  depth: number,
  parentEnv: EnvType,
  opts?: { skipEnvDriven?: boolean; numParentRooms?: number; rand?: () => number },
): SidePathSpec[] {
  const specs: SidePathSpec[] = [];

  // Depth-based spec (only applies to DUNGEON parent on the main path)
  if (parentEnv === EnvType.DUNGEON) {
    const depthSpec = getDungeonDepthSpec(depth, opts?.rand);
    if (depthSpec) specs.push(depthSpec);
  }

  // Environment-driven spec (applies to any non-castle, non-terminal env)
  if (!opts?.skipEnvDriven && !CASTLE_LIKE_ENV_TYPES.has(parentEnv)) {
    const envSpec = getEnvDrivenSpec(parentEnv, opts?.numParentRooms);
    if (envSpec) specs.push(envSpec);
  }

  return specs;
}

/**
 * Default depth→environment mapping used when opts.envType is not set.
 * This is the fallback in `addDownladder` for the rare case where a
 * DownLadder is created without explicit environment configuration.
 */
export function getDefaultSidePathEnv(depth: number): EnvType {
  if (depth < 2) return EnvType.FOREST;
  if (depth === 2) return EnvType.CAVE;
  if (depth === 3) return EnvType.FLOODED_CAVE;
  // depth > 3: random, but since this is a pure function we default to FOREST.
  // Callers that need randomness should set envType explicitly via getSidePathSpecs.
  return EnvType.FOREST;
}

/**
 * For the env-driven exit ladder in single-room sidepath mazes.
 * Returns the spec for the next sidepath in the chain, or null if terminal.
 */
export function getEnvDrivenSidePathSpec(
  parentEnv: EnvType,
  numParentRooms?: number,
): SidePathSpec | null {
  if (CASTLE_LIKE_ENV_TYPES.has(parentEnv)) return null;
  return getEnvDrivenSpec(parentEnv, numParentRooms);
}
