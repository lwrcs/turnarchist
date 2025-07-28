import {
  Partition,
  PartitionConnection,
  PartialLevel,
} from "./partitionGenerator";
import { RoomType } from "../room/room";
import { Random } from "../utility/random";
import { Game } from "../game";

interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

// Color-to-RoomType mapping for level designers
const COLOR_TO_ROOM_TYPE: { [color: string]: RoomType } = {
  // Core room types
  "rgb(0, 255, 0)": RoomType.START, // Green - Starting room
  "rgb(255, 0, 0)": RoomType.BOSS, // Red - Boss room
  "rgb(0, 0, 255)": RoomType.DOWNLADDER, // Blue - Stairs down
  "rgb(0, 255, 255)": RoomType.UPLADDER, // Cyan - Stairs up

  // Special rooms
  "rgb(255, 255, 0)": RoomType.TREASURE, // Yellow - Treasure room
  "rgb(255, 0, 255)": RoomType.SHOP, // Magenta - Shop
  "rgb(128, 0, 128)": RoomType.FOUNTAIN, // Purple - Fountain room
  "rgb(139, 69, 19)": RoomType.COFFIN, // Brown - Coffin room
  "rgb(255, 165, 0)": RoomType.KEYROOM, // Orange - Key room

  // Puzzle and special mechanics
  "rgb(64, 64, 64)": RoomType.PUZZLE, // Dark gray - Puzzle room
  "rgb(0, 0, 0)": RoomType.CHESSBOARD, // Black - Chess room
  "rgb(192, 192, 192)": RoomType.MAZE, // Light gray - Maze
  "rgb(255, 192, 203)": RoomType.SPAWNER, // Pink - Spawner room

  // Environment types
  "rgb(34, 139, 34)": RoomType.GRASS, // Forest green - Grass room
  "rgb(101, 67, 33)": RoomType.CAVE, // Dark brown - Cave
  "rgb(85, 107, 47)": RoomType.GRAVEYARD, // Olive - Graveyard
  "rgb(46, 125, 50)": RoomType.FOREST, // Green - Forest

  // Corridors and connections
  "rgb(160, 160, 160)": RoomType.CORRIDOR, // Gray - Corridor
  "rgb(255, 87, 34)": RoomType.SPIKECORRIDOR, // Red-orange - Spike corridor

  // Cave system
  "rgb(121, 85, 72)": RoomType.BIGCAVE, // Light brown - Big cave
  "rgb(78, 52, 46)": RoomType.ROPECAVE, // Dark brown - Rope cave
  "rgb(156, 102, 68)": RoomType.ROPEHOLE, // Medium brown - Rope hole
  "rgb(141, 110, 99)": RoomType.ROPEUP, // Tan - Rope up

  // Tutorial and misc
  "rgb(173, 216, 230)": RoomType.TUTORIAL, // Light blue - Tutorial
  "rgb(250, 250, 250)": RoomType.BIGDUNGEON, // Near white - Big dungeon

  // Default fallback
  "rgb(255, 255, 255)": RoomType.DUNGEON, // White - Standard dungeon room
};

export class PngPartitionGenerator {
  public async generatePartitionsFromPng(
    imageUrl: string,
    game: Game,
    depth: number,
    isSidePath: boolean = false, // Add this parameter
  ): Promise<Partition[]> {
    console.log("=== PNG PARTITION GENERATION START ===");
    console.log(`Processing image: ${imageUrl}`);
    console.log(`Game depth: ${depth}`);
    console.log(`Is side path: ${isSidePath}`);

    try {
      console.log("Step 1: Loading image data...");
      const imageData = await this.loadImageData(imageUrl);
      console.log(
        `✓ Image loaded: ${imageData.width}x${imageData.height} pixels`,
      );

      console.log("Step 2: Finding rectangles...");
      const rectangles = this.findRectangles(imageData);
      console.log(`✓ Found ${rectangles.length} rectangles:`, rectangles);

      console.log("Step 3: Creating partitions from rectangles...");
      const rawPartitions = this.createPartitionsFromRectangles(
        rectangles,
        isSidePath,
      );
      console.log(`✓ Created ${rawPartitions.length} raw partitions`);

      if (rawPartitions.length === 0) {
        console.error("❌ No partitions created from image!");
        return [];
      }

      console.log("Step 4: Processing partitions for gameplay...");
      const partialLevel = new PartialLevel();
      partialLevel.partitions = rawPartitions;

      await this.processPartitionsForGameplay(partialLevel, game, isSidePath);
      console.log(
        `✓ Final processed partitions: ${partialLevel.partitions.length}`,
      );

      console.log("=== PNG PARTITION GENERATION COMPLETE ===");
      return partialLevel.partitions;
    } catch (error) {
      console.error("❌ Error in PNG partition generation:", error);
      console.error("Stack trace:", error.stack);
      return [];
    }
  }

  private loadImageData(imageUrl: string): Promise<ImageData> {
    console.log(`  Loading image from: ${imageUrl}`);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "Anonymous";

      image.onload = () => {
        console.log(
          `  ✓ Image loaded successfully: ${image.width}x${image.height}`,
        );
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, image.width, image.height);
          console.log(
            `  ✓ Image data extracted: ${imageData.data.length} bytes`,
          );
          resolve(imageData);
        } catch (error) {
          console.error("  ❌ Error processing image:", error);
          reject(error);
        }
      };

      image.onerror = (err) => {
        console.error(`  ❌ Failed to load image: ${err}`);
        reject(new Error(`Failed to load image at ${imageUrl}: ${err}`));
      };

      image.src = imageUrl;
      console.log("  Image loading initiated...");
    });
  }

  private findRectangles(imageData: ImageData): Rectangle[] {
    console.log("  Finding rectangles in image...");
    const { width, height, data } = imageData;
    const visited = new Array(width * height).fill(false);
    const rectangles: Rectangle[] = [];

    console.log(`  Scanning ${width}x${height} pixels (${data.length} bytes)`);

    let transparentPixels = 0;
    let processedPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (visited[index]) {
          continue;
        }

        const pixelIndex = index * 4;
        const alpha = data[pixelIndex + 3];

        if (alpha === 0) {
          transparentPixels++;
          continue;
        }

        processedPixels++;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const color = `rgb(${r}, ${g}, ${b})`;

        console.log(
          `  Processing pixel at (${x}, ${y}): color ${color}, alpha ${alpha}`,
        );

        let rectW = 1;
        while (
          x + rectW < width &&
          !visited[y * width + (x + rectW)] &&
          this.isSameColor(data, pixelIndex, (y * width + x + rectW) * 4)
        ) {
          rectW++;
        }

        let rectH = 1;
        while (y + rectH < height) {
          let isRowSolid = true;
          for (let i = 0; i < rectW; i++) {
            if (
              visited[(y + rectH) * width + (x + i)] ||
              !this.isSameColor(
                data,
                pixelIndex,
                ((y + rectH) * width + x + i) * 4,
              )
            ) {
              isRowSolid = false;
              break;
            }
          }
          if (isRowSolid) {
            rectH++;
          } else {
            break;
          }
        }

        // Mark all pixels in this rectangle as visited
        for (let j = 0; j < rectH; j++) {
          for (let i = 0; i < rectW; i++) {
            visited[(y + j) * width + (x + i)] = true;
          }
        }

        const rectangle = { x, y, w: rectW, h: rectH, color };
        rectangles.push(rectangle);
        console.log(
          `  ✓ Found rectangle: ${rectW}x${rectH} at (${x}, ${y}) with color ${color}`,
        );
      }
    }

    console.log(`  ✓ Rectangle finding complete:`);
    console.log(`    - Transparent pixels: ${transparentPixels}`);
    console.log(`    - Processed pixels: ${processedPixels}`);
    console.log(`    - Total rectangles found: ${rectangles.length}`);

    return rectangles;
  }

  private isSameColor(
    data: Uint8ClampedArray,
    index1: number,
    index2: number,
  ): boolean {
    const same =
      data[index1] === data[index2] &&
      data[index1 + 1] === data[index2 + 1] &&
      data[index1 + 2] === data[index2 + 2] &&
      data[index1 + 3] === data[index2 + 3];
    return same;
  }

  private createPartitionsFromRectangles(
    rectangles: Rectangle[],
    isSidePath: boolean,
  ): Partition[] {
    console.log("  Creating partitions from rectangles...");
    console.log(`  Side path mode: ${isSidePath}`);

    if (rectangles.length === 0) {
      console.warn("  ⚠️  No rectangles to create partitions from!");
      return [];
    }

    const partitions = rectangles.map((rect, index) => {
      console.log(`  Processing rectangle ${index + 1}/${rectangles.length}:`);
      console.log(`    Position: (${rect.x}, ${rect.y})`);
      console.log(`    Size: ${rect.w}x${rect.h}`);
      console.log(`    Color: ${rect.color}`);

      const partition = new Partition(
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        rect.color,
      );

      if (isSidePath) {
        // For side paths, use cave-appropriate color mappings
        const caveRoomType = this.getCaveRoomTypeFromColor(rect.color);
        partition.type = caveRoomType;
        console.log(`    ✓ Cave room type assigned: ${caveRoomType}`);
      } else {
        // For main paths, use the existing color mapping
        const roomType = COLOR_TO_ROOM_TYPE[rect.color];
        if (roomType) {
          partition.type = roomType;
          console.log(`    ✓ Main path room type assigned: ${roomType}`);
        } else {
          partition.type = RoomType.DUNGEON;
          console.log(
            `    ⚠️  Unknown color, defaulted to: ${RoomType.DUNGEON}`,
          );
        }
      }

      console.log(`    ✓ Partition created with area: ${partition.area()}`);
      return partition;
    });

    console.log(`  ✓ Created ${partitions.length} partitions`);
    return partitions;
  }

  private getCaveRoomTypeFromColor(color: string): RoomType {
    // Cave-specific color mappings
    switch (color) {
      case "rgb(0, 255, 0)": // Green - Cave spawn point
        return RoomType.ROPECAVE;
      case "rgb(0, 255, 255)": // Cyan - Up ladder (exit to main path)
        return RoomType.UPLADDER;
      case "rgb(255, 255, 0)": // Yellow - Treasure room
        return RoomType.TREASURE;
      case "rgb(255, 0, 255)": // Magenta - Shop
        return RoomType.SHOP;
      default:
        return RoomType.CAVE; // Default cave room
    }
  }

  private async processPartitionsForGameplay(
    partialLevel: PartialLevel,
    game: Game,
    isSidePath: boolean,
  ): Promise<void> {
    console.log("  === GAMEPLAY PROCESSING START ===");
    console.log(`  Side path mode: ${isSidePath}`);

    if (partialLevel.partitions.length === 0) {
      console.error("  ❌ No partitions to process!");
      return;
    }

    console.log(
      `  Processing ${partialLevel.partitions.length} partitions for gameplay`,
    );

    if (isSidePath) {
      await this.processCavePartitions(partialLevel, game);
    } else {
      await this.processMainPathPartitions(partialLevel, game);
    }

    console.log("  === GAMEPLAY PROCESSING COMPLETE ===");
  }

  private async processCavePartitions(partialLevel: PartialLevel, game: Game) {
    console.log("  Processing as CAVE system...");

    // Log all room types found
    const roomTypeCounts: { [key: string]: number } = {};
    partialLevel.partitions.forEach((p) => {
      roomTypeCounts[p.type] = (roomTypeCounts[p.type] || 0) + 1;
    });
    console.log("  Cave room type distribution:", roomTypeCounts);

    // Find or assign ROPECAVE room
    let spawn = partialLevel.partitions.find(
      (p) => p.type === RoomType.ROPECAVE,
    );

    if (!spawn && partialLevel.partitions.length > 0) {
      console.log(
        "  No ROPECAVE room specified, assigning to smallest room...",
      );
      partialLevel.partitions.sort((a, b) => a.area() - b.area());
      spawn = partialLevel.partitions[0];
      spawn.type = RoomType.ROPECAVE;
      spawn.fillStyle = "rgb(0, 255, 0)";
      console.log(`  ✓ Assigned ROPECAVE to room at (${spawn.x}, ${spawn.y})`);
    }

    // Make sure all other rooms are CAVE type (unless they're special rooms like TREASURE)
    partialLevel.partitions.forEach((p) => {
      if (p !== spawn && p.type === RoomType.DUNGEON) {
        p.type = RoomType.CAVE;
        console.log(`  Converted DUNGEON to CAVE at (${p.x}, ${p.y})`);
      }
    });

    console.log("  Updating visual styles...");
    this.updatePartitionVisualStyles(partialLevel.partitions);

    // CRITICAL: Move ROPECAVE room to index 0 for proper spawning
    if (spawn) {
      const startIndex = partialLevel.partitions.indexOf(spawn);
      if (startIndex > 0) {
        console.log(
          `  Moving ROPECAVE room from index ${startIndex} to index 0`,
        );
        partialLevel.partitions.splice(startIndex, 1);
        partialLevel.partitions.unshift(spawn);
        console.log(`  ✓ ROPECAVE room is now at index 0`);
      } else {
        console.log(`  ✓ ROPECAVE room already at index 0`);
      }
    }

    // Connect partitions using cave logic
    if (spawn) {
      console.log("  Connecting cave partitions...");
      await this.connectCavePartitions(partialLevel, spawn);
      console.log(
        `  ✓ Cave connection complete. Remaining partitions: ${partialLevel.partitions.length}`,
      );
    }

    // Add cave loops
    if (partialLevel.partitions.length > 0) {
      console.log("  Adding cave loop connections...");
      await this.addLoopConnections(partialLevel);
    }

    // Calculate distances (no stair room for caves)
    if (partialLevel.partitions.length > 0 && spawn) {
      console.log("  Calculating cave distances...");
      await this.calculateDistances(partialLevel, spawn);
      await this.addSpecialRooms(partialLevel);
    }
  }

  private async processMainPathPartitions(
    partialLevel: PartialLevel,
    game: Game,
  ) {
    console.log("  Processing as MAIN PATH...");

    // Log all room types found
    const roomTypeCounts: { [key: string]: number } = {};
    partialLevel.partitions.forEach((p) => {
      roomTypeCounts[p.type] = (roomTypeCounts[p.type] || 0) + 1;
    });
    console.log("  Room type distribution:", roomTypeCounts);

    // Find START and BOSS rooms from color assignments
    let spawn = partialLevel.partitions.find((p) => p.type === RoomType.START);
    let boss = partialLevel.partitions.find((p) => p.type === RoomType.BOSS);

    console.log(`  Found START room: ${spawn ? "YES" : "NO"}`);
    console.log(`  Found BOSS room: ${boss ? "YES" : "NO"}`);

    // If no START room was specified by color, assign the smallest room
    if (!spawn && partialLevel.partitions.length > 0) {
      console.log("  No START room specified, finding smallest room...");
      partialLevel.partitions.sort((a, b) => a.area() - b.area());
      spawn = partialLevel.partitions[0];
      spawn.type = RoomType.START;
      spawn.fillStyle = "rgb(0, 255, 0)";
      console.log(
        `  ✓ Assigned START to smallest room at (${spawn.x}, ${spawn.y}) with area ${spawn.area()}`,
      );
    }

    // If no BOSS room was specified by color, assign the largest room
    if (!boss && partialLevel.partitions.length > 1) {
      console.log("  No BOSS room specified, finding largest room...");
      partialLevel.partitions.sort((a, b) => a.area() - b.area());
      boss = partialLevel.partitions[partialLevel.partitions.length - 1];
      if (boss.type === RoomType.DUNGEON) {
        boss.type = RoomType.BOSS;
        boss.fillStyle = "red";
        console.log(
          `  ✓ Assigned BOSS to largest room at (${boss.x}, ${boss.y}) with area ${boss.area()}`,
        );
      } else {
        console.log(
          `  ⚠️  Largest room is already ${boss.type}, not assigning BOSS`,
        );
        boss = null;
      }
    }

    console.log("  Updating visual styles...");
    this.updatePartitionVisualStyles(partialLevel.partitions);

    // CRITICAL: Move START room to index 0 for proper spawning
    if (spawn) {
      const startIndex = partialLevel.partitions.indexOf(spawn);
      if (startIndex > 0) {
        console.log(`  Moving START room from index ${startIndex} to index 0`);
        // Remove START room from current position
        partialLevel.partitions.splice(startIndex, 1);
        // Insert at beginning
        partialLevel.partitions.unshift(spawn);
        console.log(`  ✓ START room is now at index 0`);
      } else {
        console.log(`  ✓ START room already at index 0`);
      }
    }

    // Connect partitions
    if (spawn) {
      console.log("  Connecting partitions...");
      await this.connectPartitions(partialLevel, spawn);
      console.log(
        `  ✓ Connection phase complete. Remaining partitions: ${partialLevel.partitions.length}`,
      );
    } else {
      console.error("  ❌ No spawn room found, cannot connect partitions!");
    }

    // Add loop connections
    if (partialLevel.partitions.length > 0) {
      console.log("  Adding loop connections...");
      await this.addLoopConnections(partialLevel);
      console.log("  ✓ Loop connections added");
    }

    // Add stair room
    const hasStairRoom = partialLevel.partitions.some(
      (p) => p.type === RoomType.DOWNLADDER,
    );
    console.log(`  Existing stair room: ${hasStairRoom ? "YES" : "NO"}`);

    if (!hasStairRoom && partialLevel.partitions.length > 0) {
      console.log("  Adding automatic stair room...");
      await this.addStairRoom(partialLevel, game);
      console.log(
        `  ✓ Stair room processing complete. Final partitions: ${partialLevel.partitions.length}`,
      );
    }

    // Calculate distances
    if (partialLevel.partitions.length > 0 && spawn) {
      console.log("  Calculating distances...");
      await this.calculateDistances(partialLevel, spawn);

      console.log("  Adding special rooms...");
      await this.addSpecialRooms(partialLevel);

      console.log("  ✓ Distance calculation complete");

      // Log final distances
      partialLevel.partitions.forEach((p) => {
        console.log(
          `    ${p.type} at (${p.x}, ${p.y}): distance ${p.distance}`,
        );
      });
    }
  }

  private updatePartitionVisualStyles(partitions: Partition[]) {
    console.log("    Updating visual styles...");
    for (const partition of partitions) {
      const oldStyle = partition.fillStyle;
      switch (partition.type) {
        case RoomType.START:
          partition.fillStyle = "rgb(0, 255, 0)";
          break;
        case RoomType.BOSS:
          partition.fillStyle = "red";
          break;
        case RoomType.DOWNLADDER:
        case RoomType.UPLADDER:
          partition.fillStyle = "blue";
          break;
        case RoomType.TREASURE:
          partition.fillStyle = "rgb(255, 215, 0)";
          break;
        case RoomType.SHOP:
          partition.fillStyle = "rgb(255, 0, 255)";
          break;
        case RoomType.FOUNTAIN:
          partition.fillStyle = "rgb(128, 0, 128)";
          break;
        case RoomType.CAVE:
        case RoomType.BIGCAVE:
          partition.fillStyle = "rgb(101, 67, 33)";
          break;
        default:
          partition.fillStyle = "white";
          break;
      }

      if (oldStyle !== partition.fillStyle) {
        console.log(
          `      Updated ${partition.type} style: ${oldStyle} -> ${partition.fillStyle}`,
        );
      }
    }
  }

  private async connectPartitions(
    partialLevel: PartialLevel,
    spawn: Partition,
  ) {
    console.log("    === PNG CONNECTION WITH DEAD ENDS ===");

    let connected = [spawn];
    let frontier = [spawn];
    let connectionsMade = 0;

    while (frontier.length > 0) {
      let room = frontier[0];
      frontier.splice(0, 1);

      console.log(`    Processing ${room.type} at (${room.x}, ${room.y})`);

      // Find all unconnected rooms that are adjacent to this room
      const adjacentRooms = partialLevel.partitions.filter((p) => {
        return (
          p !== room &&
          connected.indexOf(p) === -1 &&
          this.arePartitionsAdjacent(room, p)
        );
      });

      console.log(
        `      Found ${adjacentRooms.length} adjacent unconnected rooms`,
      );

      // AGGRESSIVE: Connect to ALL adjacent rooms, not just 1-2
      for (let i = 0; i < adjacentRooms.length; i++) {
        const target = adjacentRooms[i];
        const adjacencyInfo = this.arePartitionsAdjacent(room, target);

        if (adjacencyInfo) {
          const connectionPoint = adjacencyInfo.connectionPoint;

          console.log(
            `      ✓ Connecting to ${target.type} at (${connectionPoint.x}, ${connectionPoint.y})`,
          );

          // Create bidirectional connections
          room.connections.push(
            new PartitionConnection(
              connectionPoint.x,
              connectionPoint.y,
              target,
            ),
          );
          target.connections.push(
            new PartitionConnection(connectionPoint.x, connectionPoint.y, room),
          );

          // Set wall openings
          room.setOpenWall(
            new PartitionConnection(
              connectionPoint.x,
              connectionPoint.y,
              target,
            ),
          );
          target.setOpenWall(
            new PartitionConnection(connectionPoint.x, connectionPoint.y, room),
          );

          frontier.push(target);
          connected.push(target);
          connectionsMade++;
        }
      }

      console.log(
        `      Room completed with ${room.connections.length} total connections`,
      );
    }

    console.log(
      `    ✓ Connected ${connected.length}/${partialLevel.partitions.length} rooms`,
    );

    // PRESERVE UNCONNECTED ROOMS: Don't remove them, just log them
    const unconnected = partialLevel.partitions.filter(
      (p) => p.connections.length === 0,
    );

    if (unconnected.length > 0) {
      console.log(
        `    📍 Found ${unconnected.length} isolated rooms (keeping as dead ends):`,
      );
      unconnected.forEach((partition) => {
        console.log(
          `      - ${partition.type} at (${partition.x}, ${partition.y})`,
        );
        // Make them accessible by connecting to the nearest connected room
        this.connectIsolatedRoom(
          partition,
          partialLevel.partitions.filter((p) => p.connections.length > 0),
        );
      });
    }

    console.log(
      `    Final result: ${partialLevel.partitions.length} total rooms preserved`,
    );
  }

  private connectIsolatedRoom(
    isolatedRoom: Partition,
    connectedRooms: Partition[],
  ) {
    // Find the closest connected room and create a connection
    let closestRoom = null;
    let closestDistance = Infinity;

    for (const room of connectedRooms) {
      const distance =
        Math.abs(isolatedRoom.x - room.x) + Math.abs(isolatedRoom.y - room.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestRoom = room;
      }
    }

    if (closestRoom) {
      // Create a connection point between the rooms
      const connectionX = Math.floor((isolatedRoom.x + closestRoom.x) / 2);
      const connectionY = Math.floor((isolatedRoom.y + closestRoom.y) / 2);

      console.log(
        `      ✓ Linking isolated ${isolatedRoom.type} to ${closestRoom.type} via (${connectionX}, ${connectionY})`,
      );

      isolatedRoom.connections.push(
        new PartitionConnection(connectionX, connectionY, closestRoom),
      );
      closestRoom.connections.push(
        new PartitionConnection(connectionX, connectionY, isolatedRoom),
      );
    }
  }

  private async connectCavePartitions(
    partialLevel: PartialLevel,
    spawn: Partition,
  ) {
    console.log("    Connecting cave partitions...");
    let connected = [spawn];
    let frontier = [spawn];
    const maxRooms = partialLevel.partitions.length; // Connect all available rooms

    while (frontier.length > 0 && connected.length < maxRooms) {
      let room = frontier[0];
      frontier.splice(0, 1);

      console.log(
        `    Processing cave room ${room.type} at (${room.x}, ${room.y})`,
      );

      // Find adjacent unconnected rooms
      const adjacentRooms = partialLevel.partitions.filter((p) => {
        return (
          p !== room &&
          connected.indexOf(p) === -1 &&
          this.arePartitionsAdjacent(room, p)
        );
      });

      const maxConnections = Math.min(
        adjacentRooms.length,
        Math.floor(Random.rand() * 2 + 1),
      );

      for (let i = 0; i < maxConnections && connected.length < maxRooms; i++) {
        const target = adjacentRooms[i];
        const adjacencyInfo = this.arePartitionsAdjacent(room, target);

        if (adjacencyInfo) {
          const connectionPoint = adjacencyInfo.connectionPoint;

          room.connections.push(
            new PartitionConnection(
              connectionPoint.x,
              connectionPoint.y,
              target,
            ),
          );
          target.connections.push(
            new PartitionConnection(connectionPoint.x, connectionPoint.y, room),
          );

          frontier.push(target);
          connected.push(target);
          console.log(`    ✓ Cave connection: ${room.type} <-> ${target.type}`);
        }
      }
    }

    // Remove unconnected rooms
    partialLevel.partitions = partialLevel.partitions.filter(
      (p) => p.connections.length > 0,
    );
    console.log(
      `    ✓ Cave connection complete: ${connected.length} rooms connected`,
    );
  }

  /**
   * Check if two partitions are adjacent and return connection info
   */
  private arePartitionsAdjacent(
    p1: Partition,
    p2: Partition,
  ): {
    direction: string;
    connectionPoint: { x: number; y: number };
  } | null {
    // Check if they're horizontally adjacent (side by side)
    if (p1.y < p2.y + p2.h && p2.y < p1.y + p1.h) {
      // p1 is to the left of p2
      if (p1.x + p1.w === p2.x || p1.x + p1.w === p2.x - 1) {
        const overlapStart = Math.max(p1.y, p2.y);
        const overlapEnd = Math.min(p1.y + p1.h, p2.y + p2.h);
        const connectionY = Math.floor(
          overlapStart + (overlapEnd - overlapStart) / 2,
        );
        return {
          direction: "horizontal",
          connectionPoint: { x: p1.x + p1.w, y: connectionY },
        };
      }
      // p2 is to the left of p1
      if (p2.x + p2.w === p1.x || p2.x + p2.w === p1.x - 1) {
        const overlapStart = Math.max(p1.y, p2.y);
        const overlapEnd = Math.min(p1.y + p1.h, p2.y + p2.h);
        const connectionY = Math.floor(
          overlapStart + (overlapEnd - overlapStart) / 2,
        );
        return {
          direction: "horizontal",
          connectionPoint: { x: p2.x + p2.w, y: connectionY },
        };
      }
    }

    // Check if they're vertically adjacent (top/bottom)
    if (p1.x < p2.x + p2.w && p2.x < p1.x + p1.w) {
      // p1 is above p2
      if (p1.y + p1.h === p2.y || p1.y + p1.h === p2.y - 1) {
        const overlapStart = Math.max(p1.x, p2.x);
        const overlapEnd = Math.min(p1.x + p1.w, p2.x + p2.w);
        const connectionX = Math.floor(
          overlapStart + (overlapEnd - overlapStart) / 2,
        );
        return {
          direction: "vertical",
          connectionPoint: { x: connectionX, y: p1.y + p1.h },
        };
      }
      // p2 is above p1
      if (p2.y + p2.h === p1.y || p2.y + p2.h === p1.y - 1) {
        const overlapStart = Math.max(p1.x, p2.x);
        const overlapEnd = Math.min(p1.x + p1.w, p2.x + p2.w);
        const connectionX = Math.floor(
          overlapStart + (overlapEnd - overlapStart) / 2,
        );
        return {
          direction: "vertical",
          connectionPoint: { x: connectionX, y: p2.y + p2.h },
        };
      }
    }

    return null;
  }

  /**
   * Enhanced loop connections that work better with PNG layouts
   */
  private async addLoopConnections(partialLevel: PartialLevel) {
    console.log("    Adding PNG-optimized loop connections...");
    if (partialLevel.partitions.length === 0) {
      return;
    }

    // Build adjacency map
    const adjacencyMap = new Map<Partition, Partition[]>();

    partialLevel.partitions.forEach((p1) => {
      const adjacent = partialLevel.partitions.filter((p2) => {
        return p2 !== p1 && this.arePartitionsAdjacent(p1, p2);
      });
      adjacencyMap.set(p1, adjacent);
    });

    let loopsAdded = 0;
    const maxLoops = Math.min(
      4,
      Math.floor(partialLevel.partitions.length / 2),
    );

    console.log(`    Attempting up to ${maxLoops} loop connections`);

    for (let i = 0; i < maxLoops; i++) {
      // Pick a random room
      const roomIndex = Math.floor(
        Random.rand() * partialLevel.partitions.length,
      );
      const room = partialLevel.partitions[roomIndex];

      // Find adjacent rooms that aren't already connected
      const adjacentRooms = adjacencyMap.get(room) || [];
      const unconnectedAdjacent = adjacentRooms.filter(
        (p) => !room.connections.some((c) => c.other === p),
      );

      if (unconnectedAdjacent.length > 0) {
        const target =
          unconnectedAdjacent[
            Math.floor(Random.rand() * unconnectedAdjacent.length)
          ];
        const adjacencyInfo = this.arePartitionsAdjacent(room, target);

        if (adjacencyInfo) {
          const connectionPoint = adjacencyInfo.connectionPoint;

          room.connections.push(
            new PartitionConnection(
              connectionPoint.x,
              connectionPoint.y,
              target,
            ),
          );
          target.connections.push(
            new PartitionConnection(connectionPoint.x, connectionPoint.y, room),
          );

          room.setOpenWall(
            new PartitionConnection(
              connectionPoint.x,
              connectionPoint.y,
              target,
            ),
          );
          target.setOpenWall(
            new PartitionConnection(connectionPoint.x, connectionPoint.y, room),
          );

          loopsAdded++;
          console.log(
            `    ✓ Loop ${loopsAdded}: ${room.type} <-> ${target.type}`,
          );
        }
      }
    }

    console.log(`    ✓ Added ${loopsAdded} loop connections`);
  }

  private async addStairRoom(partialLevel: PartialLevel, game: Game) {
    console.log("    Adding stair room...");

    const hasBoss = partialLevel.partitions.some(
      (p) => p.type === RoomType.BOSS,
    );
    const hasStairs = partialLevel.partitions.some(
      (p) => p.type === RoomType.DOWNLADDER,
    );

    console.log(`    Has boss room: ${hasBoss}`);
    console.log(`    Has existing stairs: ${hasStairs}`);

    if (!hasBoss || hasStairs) {
      console.log("    Skipping stair room addition");
      return;
    }

    let boss = partialLevel.partitions.find((p) => p.type === RoomType.BOSS);
    console.log(`    Boss room at (${boss.x}, ${boss.y})`);

    let found_stair = false;
    const max_stair_tries = 5;
    const stairRoomWidth = 5;
    const stairRoomHeight = 5;

    for (let stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
      const stairX = Game.rand(boss.x - 1, boss.x + boss.w - 2, Random.rand);
      const stairY = boss.y - stairRoomHeight - 1;

      console.log(
        `    Stair attempt ${stair_tries + 1}: trying position (${stairX}, ${stairY})`,
      );

      let stair = new Partition(
        stairX,
        stairY,
        stairRoomWidth,
        stairRoomHeight,
        "white",
      );
      stair.type = RoomType.DOWNLADDER;
      stair.fillStyle = "blue";

      const overlaps = partialLevel.partitions.some((p) => p.overlaps(stair));
      console.log(`    Overlap check: ${overlaps ? "OVERLAPS" : "CLEAR"}`);

      if (!overlaps) {
        found_stair = true;
        partialLevel.partitions.push(stair);

        const connectionX = stair.x + 1;
        const connectionY = stair.y + stairRoomHeight;

        stair.connections.push(
          new PartitionConnection(connectionX, connectionY, boss),
        );
        boss.connections.push(
          new PartitionConnection(connectionX, connectionY, stair),
        );

        stair.setOpenWall(
          new PartitionConnection(connectionX, connectionY, boss),
        );
        boss.setOpenWall(
          new PartitionConnection(connectionX, connectionY, stair),
        );

        console.log(
          `    ✓ Stair room added at (${stairX}, ${stairY}) connected to boss`,
        );
        break;
      }
    }

    if (!found_stair) {
      console.log("    ❌ Could not place stair room after all attempts");
    }
  }

  private async calculateDistances(
    partialLevel: PartialLevel,
    spawn: Partition,
  ) {
    console.log("    Calculating distances from spawn...");
    let frontier = [spawn];
    let seen = [];
    spawn.distance = 0;

    let processedRooms = 0;

    while (frontier.length > 0) {
      let room = frontier[0];
      frontier.splice(0, 1);
      seen.push(room);
      processedRooms++;

      console.log(
        `    Processing room ${processedRooms}: ${room.type} at distance ${room.distance}`,
      );

      for (let c of room.connections) {
        let other = c.other;
        const newDistance = room.distance + 1;
        if (newDistance < other.distance) {
          other.distance = newDistance;
          console.log(`    Updated ${other.type} distance to ${newDistance}`);
        }
        if (seen.indexOf(other) === -1) {
          frontier.push(other);
        }
      }
    }

    console.log(
      `    ✓ Distance calculation complete for ${processedRooms} rooms`,
    );
  }

  private async addSpecialRooms(partialLevel: PartialLevel) {
    console.log("    Adding special rooms...");
    let specialRoomsAdded = 0;

    for (const p of partialLevel.partitions) {
      if (p.type === RoomType.DUNGEON) {
        if (p.distance > 4 && p.area() <= 30 && Random.rand() < 0.1) {
          p.type = RoomType.TREASURE;
          specialRoomsAdded++;
          console.log(
            `    ✓ Converted DUNGEON to TREASURE at (${p.x}, ${p.y}), distance ${p.distance}`,
          );
        }
      }
    }

    console.log(`    ✓ Added ${specialRoomsAdded} special rooms`);
  }

  // Utility method to get color mapping documentation
  public static getColorGuide(): string {
    const guide = Object.entries(COLOR_TO_ROOM_TYPE)
      .map(([color, type]) => `${color} -> ${type}`)
      .join("\n");

    return `PNG Level Designer Color Guide:\n${guide}`;
  }
}
