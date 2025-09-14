import { Partition } from "./partitionGenerator";
import { RoomType } from "../room/room";
import { LevelParameters } from "./levelParametersGenerator";
import { Game } from "../game";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorType?: ValidationErrorType;
}

export enum ValidationErrorType {
  INSUFFICIENT_ROOMS = "INSUFFICIENT_ROOMS",
  BOSS_ROOM_MISSING = "BOSS_ROOM_MISSING",
  BOSS_TOO_CLOSE = "BOSS_TOO_CLOSE",
  OVERLAPPING_PARTITIONS = "OVERLAPPING_PARTITIONS",
  EMPTY_PARTITIONS = "EMPTY_PARTITIONS",
  STAIR_ROOM_MISSING = "STAIR_ROOM_MISSING",
  INSUFFICIENT_CAVE_ROOMS = "INSUFFICIENT_CAVE_ROOMS",
}

export class LevelValidator {
  private game: Game;
  private enableDebugMessages: boolean;

  constructor(game: Game, enableDebugMessages: boolean = false) {
    this.game = game;
    this.enableDebugMessages =
      enableDebugMessages || document.cookie.includes("showgeneration=true");
  }

  /**
   * Validates dungeon partitions against the provided parameters
   */
  validateDungeonPartitions(
    partitions: Partition[],
    params: LevelParameters,
  ): ValidationResult {
    // Check for empty partitions
    const emptyCheck = this.validateNotEmpty(partitions);
    if (!emptyCheck.isValid) return emptyCheck;

    // Check minimum room count
    const roomCountCheck = this.validateMinimumRoomCount(
      partitions,
      params.minRoomCount,
    );
    if (!roomCountCheck.isValid) return roomCountCheck;

    // Check boss room existence
    const bossExistenceCheck = this.validateBossRoomExists(partitions);
    if (!bossExistenceCheck.isValid) return bossExistenceCheck;

    // Check boss room distance
    const bossDistanceCheck = this.validateBossRoomDistance(partitions, 3);
    if (!bossDistanceCheck.isValid) return bossDistanceCheck;

    // Check for overlapping partitions
    const overlapCheck = this.validateNoOverlaps(partitions);
    if (!overlapCheck.isValid) return overlapCheck;

    // Check for stair room (required for dungeon completion)
    const stairCheck = this.validateStairRoomExists(partitions);
    if (!stairCheck.isValid) return stairCheck;

    return { isValid: true };
  }

  /**
   * Validates cave partitions
   */
  validateCavePartitions(
    partitions: Partition[],
    requiredRoomCount: number,
  ): ValidationResult {
    // Check for empty partitions
    const emptyCheck = this.validateNotEmpty(partitions);
    if (!emptyCheck.isValid) return emptyCheck;

    // Check minimum room count for caves
    const roomCountCheck = this.validateMinimumRoomCount(
      partitions,
      requiredRoomCount,
    );
    if (!roomCountCheck.isValid) {
      return {
        isValid: false,
        errorMessage: `Cave needs at least ${requiredRoomCount} rooms, got ${partitions.length}`,
        errorType: ValidationErrorType.INSUFFICIENT_CAVE_ROOMS,
      };
    }

    // Check for overlapping partitions
    const overlapCheck = this.validateNoOverlaps(partitions);
    if (!overlapCheck.isValid) return overlapCheck;

    // Validate that we have a rope cave starting room
    const ropeCaveCheck = this.validateRopeCaveExists(partitions);
    if (!ropeCaveCheck.isValid) return ropeCaveCheck;

    return { isValid: true };
  }

  /**
   * Validates tutorial partitions
   */
  validateTutorialPartitions(partitions: Partition[]): ValidationResult {
    // Check for empty partitions
    const emptyCheck = this.validateNotEmpty(partitions);
    if (!emptyCheck.isValid) return emptyCheck;

    // Tutorial should have exactly 1 room
    if (partitions.length !== 1) {
      return {
        isValid: false,
        errorMessage: `Tutorial should have exactly 1 room, got ${partitions.length}`,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }

    // Check that the room is marked as tutorial
    const tutorialRoom = partitions[0];
    if (tutorialRoom.type !== RoomType.TUTORIAL) {
      return {
        isValid: false,
        errorMessage: "Tutorial room is not marked with TUTORIAL type",
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }

    return { isValid: true };
  }

  /**
   * Validates that partitions array is not empty
   */
  validateNotEmpty(partitions: Partition[]): ValidationResult {
    if (!partitions || partitions.length === 0) {
      const errorMessage = "No partitions generated";
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.EMPTY_PARTITIONS,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates minimum room count requirement
   */
  validateMinimumRoomCount(
    partitions: Partition[],
    minRoomCount: number,
  ): ValidationResult {
    if (partitions.length < minRoomCount) {
      const errorMessage = `Not enough rooms: need ${minRoomCount}, got ${partitions.length}`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that a boss room exists
   */
  validateBossRoomExists(partitions: Partition[]): ValidationResult {
    const hasBossRoom = partitions.some((p) => p.type === RoomType.BOSS);
    if (!hasBossRoom) {
      const errorMessage = "Boss room unreachable or missing";
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.BOSS_ROOM_MISSING,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that boss room is at minimum distance from spawn
   */
  validateBossRoomDistance(
    partitions: Partition[],
    minDistance: number,
  ): ValidationResult {
    const bossRoom = partitions.find((p) => p.type === RoomType.BOSS);
    if (!bossRoom) {
      return this.validateBossRoomExists(partitions); // This will return the appropriate error
    }

    if (bossRoom.distance < minDistance) {
      const errorMessage = `Boss room too close to spawn: distance ${bossRoom.distance}, minimum ${minDistance}`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.BOSS_TOO_CLOSE,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that partitions don't overlap
   */
  validateNoOverlaps(partitions: Partition[]): ValidationResult {
    for (let i = 0; i < partitions.length; i++) {
      for (let j = i + 1; j < partitions.length; j++) {
        const a = partitions[i];
        const b = partitions[j];
        if (
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y
        ) {
          const errorMessage = `Overlapping partitions detected: partition ${i} overlaps with partition ${j}`;
          this.logValidationError(errorMessage);
          return {
            isValid: false,
            errorMessage,
            errorType: ValidationErrorType.OVERLAPPING_PARTITIONS,
          };
        }
      }
    }
    return { isValid: true };
  }

  /**
   * Validates that a stair room exists for dungeon completion
   */
  validateStairRoomExists(partitions: Partition[]): ValidationResult {
    const hasStairRoom = partitions.some((p) => p.type === RoomType.DOWNLADDER);
    if (!hasStairRoom) {
      const errorMessage = "Stair room missing - dungeon cannot be completed";
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.STAIR_ROOM_MISSING,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that a rope cave starting room exists
   */
  validateRopeCaveExists(partitions: Partition[]): ValidationResult {
    const hasRopeCave = partitions.some((p) => p.type === RoomType.ROPECAVE);
    if (!hasRopeCave) {
      const errorMessage = "Rope cave starting room missing";
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_CAVE_ROOMS,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates room connectivity by checking that all rooms have connections
   */
  validateConnectivity(partitions: Partition[]): ValidationResult {
    const unconnectedRooms = partitions.filter(
      (partition) => partition.connections.length === 0,
    );

    if (unconnectedRooms.length > 0) {
      const errorMessage = `Found ${unconnectedRooms.length} unconnected rooms`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that required room types are present
   */
  validateRequiredRoomTypes(
    partitions: Partition[],
    requiredTypes: RoomType[],
  ): ValidationResult {
    const presentTypes = new Set(partitions.map((p) => p.type));
    const missingTypes = requiredTypes.filter(
      (type) => !presentTypes.has(type),
    );

    if (missingTypes.length > 0) {
      const errorMessage = `Missing required room types: ${missingTypes.join(", ")}`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }
    return { isValid: true };
  }

  /**
   * Comprehensive validation for partition quality
   */
  validatePartitionQuality(partitions: Partition[]): ValidationResult {
    // Check for degenerate partitions (too small)
    const minSize = 4;
    const tooSmallPartitions = partitions.filter(
      (p) => p.w < minSize || p.h < minSize,
    );

    if (tooSmallPartitions.length > 0) {
      const errorMessage = `Found ${tooSmallPartitions.length} partitions smaller than minimum size ${minSize}`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }

    // Check for partitions with negative dimensions
    const invalidPartitions = partitions.filter(
      (p) => p.w <= 0 || p.h <= 0 || p.x < 0 || p.y < 0,
    );

    if (invalidPartitions.length > 0) {
      const errorMessage = `Found ${invalidPartitions.length} partitions with invalid dimensions`;
      this.logValidationError(errorMessage);
      return {
        isValid: false,
        errorMessage,
        errorType: ValidationErrorType.INSUFFICIENT_ROOMS,
      };
    }

    return { isValid: true };
  }

  /**
   * Logs validation errors if debug messages are enabled
   */
  private logValidationError(message: string): void {
    if (this.enableDebugMessages) {
      console.warn(`[LevelValidator] ${message}`);
      if (this.game && this.game.pushMessage) {
        this.game.pushMessage(message);
      }
    }
  }

  /**
   * Validates and provides detailed reporting for debugging
   */
  validateWithDetailedReport(
    partitions: Partition[],
    params: LevelParameters,
    type: "dungeon" | "cave" | "tutorial" = "dungeon",
  ): ValidationResult & { details: string[] } {
    const details: string[] = [];

    details.push(`Validating ${type} with ${partitions.length} partitions`);

    if (type === "dungeon") {
      details.push(`Required minimum rooms: ${params.minRoomCount}`);
      details.push(`Required maximum rooms: ${params.maxRoomCount}`);
    }

    const result =
      type === "dungeon"
        ? this.validateDungeonPartitions(partitions, params)
        : type === "cave"
          ? this.validateCavePartitions(partitions, 8)
          : this.validateTutorialPartitions(partitions);

    if (!result.isValid) {
      details.push(`Validation failed: ${result.errorMessage}`);
    } else {
      details.push("Validation passed");
    }

    return {
      ...result,
      details,
    };
  }
}
