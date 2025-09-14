import { ChatMessage, Game } from "../game";
import { Room, RoomType } from "../room/room";
import { Door } from "../tile/door";
import { LevelConstants } from "./levelConstants";
import { Random } from "../utility/random";
import { DownLadder } from "../tile/downLadder";
import {
  LevelParameterGenerator,
  LevelParameters,
} from "./levelParametersGenerator";
import { Level } from "./level";
import { GameConstants } from "../game/gameConstants";
import { EnvType } from "../constants/environmentTypes";
import { SkinType } from "../tile/tile";
import {
  PartitionGenerator,
  Partition,
  PartialLevel,
  PathType,
  PathParameters,
} from "./partitionGenerator";
import { LevelValidator, ValidationResult } from "./levelValidator";
import { GenerationVisualizer } from "./generationVisualizer";
import { PngPartitionGenerator } from "./pngPartitionGenerator";
import { GameplaySettings } from "../game/gameplaySettings";
import { SidePathOptions } from "./sidePathManager";

export class LevelGenerator {
  game: Game;
  seed: number;
  depthReached = 0;
  currentFloorFirstLevelID = 0;
  partialLevel: PartialLevel;
  levelParams: LevelParameters;
  partitionGenerator: PartitionGenerator;
  static ANIMATION_CONSTANT = 1;
  private validator: LevelValidator;
  private visualizer: GenerationVisualizer;
  private pngPartitionGenerator: PngPartitionGenerator;

  constructor() {
    // Don't initialize partitionGenerator here yet since we need game instance
    this.validator = null;
    this.visualizer = null;
    this.pngPartitionGenerator = new PngPartitionGenerator();
  }

  private setOpenWallsForPartitions = (
    partitions: Array<Partition>,
    mapWidth: number,
    mapHeight: number,
  ) => {
    for (const partition of partitions) {
      // Reset all walls to closed by default
      partition.isTopOpen = false;
      partition.isRightOpen = false;
      partition.isBottomOpen = false;
      partition.isLeftOpen = false;

      // Check if partition touches map boundaries
      if (partition.x === 0) {
        partition.isLeftOpen = true;
      }
      if (partition.y === 0) {
        partition.isTopOpen = true;
      }
      if (partition.x + partition.w === mapWidth) {
        partition.isRightOpen = true;
      }
      if (partition.y + partition.h === mapHeight) {
        partition.isBottomOpen = true;
      }
    }
  };

  createLevel = (
    depth: number,
    isMainPath: boolean = true,
    mapGroup: number,
    envType: EnvType,
    skipPopulation: boolean = false,
  ) => {
    let newLevel = new Level(
      this.game,
      depth,
      100,
      100,
      isMainPath,
      mapGroup,
      envType,
      skipPopulation,
    );
    return newLevel;
  };

  getRooms = (
    partitions: Array<Partition>,
    depth: number,
    mapGroup: number,
    envType: EnvType,
    pathId: string,
  ): Array<Room> => {
    let rooms: Array<Room> = [];

    for (let i = 0; i < partitions.length; i++) {
      let partition = partitions[i];

      let room = new Room(
        this.game,
        partition.x - 1,
        partition.y - 1,
        partition.w + 2,
        partition.h + 2,
        partition.type,
        depth,
        mapGroup,
        this.game.levels[depth],
        Random.rand,
        envType,
      );
      room.pathId = pathId || "main";
      rooms.push(room);
    }

    let doors_added: Array<Door> = [];

    partitions.forEach((partition, index) => {
      partition.connections.forEach((connection) => {
        let door = rooms[index].addDoor(connection.x, connection.y);
        let existingDoor = doors_added.find(
          (existing) => existing.x === door.x && existing.y === door.y,
        );
        if (existingDoor) {
          existingDoor.link(door);
          door.link(existingDoor);
        }
        doors_added.push(door);
      });
    });

    return rooms;
  };

  setSeed = (seed: number) => {
    this.seed = seed;
  };

  generate = async (
    game: Game,
    depth: number,
    isSidePath = false,
    callback: (linkedRoom: Room) => void,
    environment: EnvType = EnvType.DUNGEON,
    skipPopulation = false, // Add this parameter
    pathId?: string,
    opts?: SidePathOptions,
  ) => {
    // Initialize components with game instance
    if (!this.partitionGenerator) {
      this.partitionGenerator = new PartitionGenerator(game);
    }
    if (!this.validator) {
      this.validator = new LevelValidator(game);
    }
    if (!this.visualizer) {
      this.visualizer = this.partitionGenerator.getVisualizer();
    }

    this.levelParams = LevelParameterGenerator.getParameters(depth);
    this.depthReached = depth;

    // Set the random state based on the seed, depth, and pathId (for unique sidepaths)
    const pid = pathId ?? (isSidePath ? "side" : "main");
    let pathHash = 0 >>> 0;
    for (let i = 0; i < pid.length; i++) {
      pathHash = ((pathHash * 131) ^ pid.charCodeAt(i)) >>> 0;
    }
    Random.setState(((this.seed + depth) ^ pathHash) >>> 0);

    this.game = game;

    // Determine the map group
    let mapGroup =
      this.game.rooms.length > 0
        ? this.game.rooms[this.game.rooms.length - 1].mapGroup + 1
        : 0;

    // Generate partitions based on whether it's a side path or main path
    let partitions: Partition[];

    const shouldUsePNG = GameConstants.USE_PNG_LEVELS && !isSidePath;
    // Deterministic per-level roll that doesn't alter global RNG state
    const rollPNG = this.shouldUsePngForLevel(
      depth,
      pid,
      GameplaySettings.PNG_LEVEL_PROBABILITY,
    );
    if (shouldUsePNG && rollPNG) {
      // Use PNG-based level generation for MAIN PATHS ONLY
      const pngUrl = await this.selectRandomLevelForDepth(depth);

      if (pngUrl) {
        console.log(`Using PNG level generation from: ${pngUrl}`);
        partitions = await this.pngPartitionGenerator.generatePartitionsFromPng(
          pngUrl,
          game,
          depth,
          isSidePath,
        );
      }

      // Fallback to procedural generation if PNG generation fails or no PNG found
      if (!pngUrl || partitions.length === 0) {
        if (!pngUrl) {
          console.warn(
            `No PNG levels found for depth ${depth}, falling back to procedural generation`,
          );
        } else {
          console.warn(
            "PNG generation failed, falling back to procedural generation",
          );
        }
        partitions = await this.partitionGenerator.generateDungeonPartitions(
          game,
          this.levelParams.mapWidth,
          this.levelParams.mapHeight,
          depth,
          this.levelParams,
          // Allow main-path overrides via opts when not a side path
          isSidePath
            ? undefined
            : {
                branching: (opts as any)?.branching,
                loopiness: (opts as any)?.loopiness,
              },
        );
      }
    } else {
      // Use procedural generation for side paths OR when PNG is disabled
      if (isSidePath) {
        partitions = await this.partitionGenerator.generateCavePartitions(opts);
      } else {
        partitions = await this.partitionGenerator.generateDungeonPartitions(
          game,
          this.levelParams.mapWidth,
          this.levelParams.mapHeight,
          depth,
          this.levelParams,
          isSidePath
            ? undefined
            : {
                branching: (opts as any)?.branching,
                loopiness: (opts as any)?.loopiness,
              },
        );
      }
    }

    // Use validator instead of direct overlap checking
    const overlapValidation = this.validator.validateNoOverlaps(partitions);
    if (!overlapValidation.isValid) {
      console.warn(
        `Overlap validation failed: ${overlapValidation.errorMessage}`,
      );
    }
    let mainEnvType = depth > 4 ? EnvType.MAGMA_CAVE : EnvType.DUNGEON;
    let envType = !isSidePath ? mainEnvType : environment;
    // if (depth > 4) {
    //   envType = EnvType.MAGMA_CAVE;
    // }

    // Check for overlaps
    // if (this.partitionGenerator.checkOverlaps(partitions)) { // This line is removed as per the new_code
    //   console.warn("There are overlapping partitions.");
    // }

    // Get the levels based on the partitions
    let newLevel = this.createLevel(
      depth,
      !isSidePath,
      mapGroup,
      envType,
      skipPopulation,
    );

    if (isSidePath) {
      // create Level object ONLY to prepare rooms, but
      // DO NOT push to game.levels
    } else {
      this.game.levels.push(newLevel);
      this.game.registerLevel(newLevel);
    }

    let rooms = this.getRooms(partitions, depth, mapGroup, envType, pid);

    newLevel.setRooms(rooms);
    newLevel.populator.populateRooms();

    newLevel.setRoomSkins();
    //newLevel.loadRoomsIntoLevelArray();

    // Only call linkExitToStart for main paths
    if (newLevel.exitRoom) {
      newLevel.exitRoom.linkExitToStart();
    }

    // Update the current floor first level ID if it's not a cave
    if (!isSidePath) this.currentFloorFirstLevelID = this.game.rooms.length;

    // Add the new levels to the game rooms
    this.game.registerRooms(rooms);
    // Keep game.level in sync for convenience lookups
    this.game.level = this.game.levels[depth] || this.game.level;

    // Do NOT auto-generate sidepath caves here.
    // Sidepaths are generated on-demand when the player interacts with a DownLadder.

    // Return the start room or the rope cave room
    callback(
      isSidePath
        ? rooms.find((r) => r.type === RoomType.ROPECAVE)
        : rooms.find((r) => r.type === RoomType.START),
    );
  };

  /**
   * Deterministically decide if PNG-based generation should be used for this level.
   * Uses a local hash seeded by (seed, depth, pathId) to avoid touching global RNG state.
   */
  private shouldUsePngForLevel(
    depth: number,
    pathId: string,
    probability: number,
  ): boolean {
    // Mix seed, depth, and path string into a 32-bit state
    let h = (this.seed ^ depth) >>> 0;
    // Simple LCG/hash mix over pathId characters (deterministic)
    for (let i = 0; i < pathId.length; i++) {
      h = (Math.imul(h ^ pathId.charCodeAt(i), 1664525) + 1013904223) >>> 0;
    }
    // Map to [0,1)
    const r = (h >>> 0) / 4294967296;
    return r < probability;
  }

  generateFirstNFloors = async (game, numFloors, skipPopulation = false) => {
    // Deterministically generate each main path depth from 0..numFloors
    for (let depth = 0; depth <= numFloors; depth++) {
      await this.generate(
        game,
        depth,
        false,
        () => {},
        EnvType.DUNGEON,
        skipPopulation,
        undefined,
        {
          branching: GameplaySettings.MAIN_PATH_BRANCHING,
          loopiness: GameplaySettings.MAIN_PATH_LOOPINESS,
        },
      );
      // generate() updates game.rooms to this depth's rooms
    }
  };

  draw = (delta: number) => {
    if (this.visualizer) {
      this.visualizer.draw(delta);
    } else {
      // Fallback if visualizer not initialized
      Game.ctx.fillStyle = "rgba(0, 0, 0, 1)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
      this.game.drawTextScreen("generating level");
    }
  };

  private async selectRandomLevelForDepth(
    depth: number,
  ): Promise<string | null> {
    console.log(`Looking for PNG levels for depth ${depth}...`);

    // Try to find available variations for this depth
    const availableVariations: string[] = [];
    const maxVariations = 10; // Check up to 10 variations per depth

    for (let variation = 0; variation < maxVariations; variation++) {
      const filename = `${depth}_${variation}.png`;
      const fullPath = `res/levels/${filename}`;

      // Check if file exists by trying to load it
      if (await this.checkImageExists(fullPath)) {
        availableVariations.push(fullPath);
        console.log(`  ✓ Found variation: ${filename}`);
      }
    }

    if (availableVariations.length === 0) {
      console.log(`  ❌ No PNG levels found for depth ${depth}`);
      return null;
    }

    // Randomly select one of the available variations
    const selectedIndex = Math.floor(
      Random.rand() * availableVariations.length,
    );
    const selectedPath = availableVariations[selectedIndex];

    console.log(
      `  🎲 Selected ${selectedPath} (${selectedIndex + 1}/${availableVariations.length} available)`,
    );
    return selectedPath;
  }

  private async checkImageExists(imagePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
      // Set a timeout to avoid hanging
      setTimeout(() => {
        resolve(false);
      }, 1000);

      img.src = imagePath;
    });
  }
}

const getPathParameters = (
  pathType: PathType,
  depth: number,
): PathParameters => {
  const baseParams = LevelParameterGenerator.getParameters(depth);

  switch (pathType) {
    case PathType.MAIN_PATH:
      return {
        pathType: PathType.MAIN_PATH,
        mapWidth: baseParams.mapWidth,
        mapHeight: baseParams.mapHeight,
        roomCount: {
          min: baseParams.minRoomCount,
          max: baseParams.maxRoomCount,
        },
        splitProbabilities: [0.75, 1, 0.5],
        wallRemoveProbability: 0.5,
        maxRoomArea: baseParams.maxRoomArea,
        softMaxRoomArea: baseParams.softMaxRoomArea,
        connectionStyle: "linear",
        loopDoorCount: { min: 4, max: 8 },
      };

    case PathType.SIDE_PATH:
      return {
        pathType: PathType.SIDE_PATH,
        mapWidth: 50,
        mapHeight: 50,
        roomCount: { min: 5, max: 5 },
        splitProbabilities: [0.75, 1, 0.5],
        wallRemoveProbability: 0.5,
        maxRoomArea: 100,
        softMaxRoomArea: 80,
        connectionStyle: "branched",
        loopDoorCount: { min: 4, max: 8 },
      };

    case PathType.TUTORIAL:
      return {
        pathType: PathType.TUTORIAL,
        mapWidth: 7,
        mapHeight: 7,
        roomCount: { min: 1, max: 1 },
        splitProbabilities: [],
        wallRemoveProbability: 0,
        maxRoomArea: 49,
        softMaxRoomArea: 49,
        connectionStyle: "linear",
        loopDoorCount: { min: 0, max: 0 },
      };

    default:
      throw new Error(`Unknown path type: ${pathType}`);
  }
};
