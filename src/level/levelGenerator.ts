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
  ) => {
    let newLevel = new Level(
      this.game,
      depth,
      100,
      100,
      isMainPath,
      mapGroup,
      envType,
    );
    return newLevel;
  };

  getRooms = (
    partitions: Array<Partition>,
    depth: number,
    mapGroup: number,
    envType: EnvType,
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

    // Set the random state based on the seed and depth
    Random.setState(this.seed + depth);

    this.game = game;

    // Determine the map group
    let mapGroup =
      this.game.rooms.length > 0
        ? this.game.rooms[this.game.rooms.length - 1].mapGroup + 1
        : 0;

    // Generate partitions based on whether it's a side path or main path
    let partitions: Partition[];

    const shouldUsePNG = GameConstants.USE_PNG_LEVELS && !isSidePath;
    const rollPNG = Random.rand() < 0.25;
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
        );
      }
    } else {
      // Use procedural generation for side paths OR when PNG is disabled
      if (isSidePath) {
        partitions = await this.partitionGenerator.generateCavePartitions(
          50,
          50,
        );
      } else {
        partitions = await this.partitionGenerator.generateDungeonPartitions(
          game,
          this.levelParams.mapWidth,
          this.levelParams.mapHeight,
          depth,
          this.levelParams,
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

    let envType = environment;

    // Check for overlaps
    // if (this.partitionGenerator.checkOverlaps(partitions)) { // This line is removed as per the new_code
    //   console.warn("There are overlapping partitions.");
    // }

    // Get the levels based on the partitions
    let newLevel = this.createLevel(depth, !isSidePath, mapGroup, envType);

    if (isSidePath) {
      // create Level object ONLY to prepare rooms, but
      // DO NOT push to game.levels
    } else {
      this.game.levels.push(newLevel);
    }

    let rooms = this.getRooms(partitions, depth, mapGroup, envType);

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
    this.game.rooms = rooms;

    // Generate the rope hole if it exists
    for (let room of rooms) {
      if (room.type === RoomType.ROPEHOLE) {
        for (let x = room.roomX; x < room.roomX + room.width; x++) {
          for (let y = room.roomY; y < room.roomY + room.height; y++) {
            let tile = room.roomArray[x][y];
            if (tile instanceof DownLadder && tile.isSidePath) {
              tile.generate();

              callback(
                isSidePath
                  ? rooms.find((r) => r.type === RoomType.ROPECAVE)
                  : rooms.find((r) => r.type === RoomType.START),
              );
            }
          }
        }
      }
    }

    // Return the start room or the rope cave room
    callback(
      isSidePath
        ? rooms.find((r) => r.type === RoomType.ROPECAVE)
        : rooms.find((r) => r.type === RoomType.START),
    );
  };

  generateFirstNFloors = async (game, numFloors) => {
    await this.generate(game, 0, false, () => {});
    for (let i = 0; i < numFloors; i++) {
      let foundRoom = this.game.rooms
        .slice()
        .reverse()
        .find((room) => room.type === RoomType.DOWNLADDER);

      if (foundRoom) {
        for (
          let x = foundRoom.roomX;
          x < foundRoom.roomX + foundRoom.width;
          x++
        ) {
          for (
            let y = foundRoom.roomY;
            y < foundRoom.roomY + foundRoom.height;
            y++
          ) {
            let tile = foundRoom.roomArray[x][y];
            if (tile instanceof DownLadder) {
              tile.generate();
              break;
            }
          }
        }
      }
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
