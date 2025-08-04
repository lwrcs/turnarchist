import { GameConstants } from "../game/gameConstants";
import { Game } from "../game";
import { Utils } from "../utility/utils";
import { Random } from "../utility/random";

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number; // velocity x
  vy: number; // velocity y
  mass: number;
  id: number;
}

export class LevelImageGenerator {
  private rooms: Room[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private settled: boolean = false;

  constructor(width: number = 100, height: number = 100) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    (this.ctx as any).webkitImageSmoothingEnabled = false;
    (this.ctx as any).mozImageSmoothingEnabled = false;
    (this.ctx as any).msImageSmoothingEnabled = false;
  }

  // Generate room size using normal distribution for rectangles
  private generateRoomSize(): { width: number; height: number } {
    const minSize = 2;
    const maxSize = 25;

    // Use normal distribution for both width and height independently
    // This creates rectangles with varied proportions
    const width = Math.max(
      minSize,
      Math.min(maxSize, Utils.randomNormalInt(minSize, maxSize, { median: 6 })),
    );
    const height = Math.max(
      minSize,
      Math.min(maxSize, Utils.randomNormalInt(minSize, maxSize, { median: 6 })),
    );

    return { width, height };
  }

  // Calculate mass based on room size (larger rooms = more mass)
  private calculateMass(width: number, height: number): number {
    return width * height * 0.1;
  }

  // Generate rooms with physics properties
  generateRooms(
    numRooms: number,
    rand: () => number = Random.rand,
    startingPattern: "center" | "split" | "corners" = "center",
  ): void {
    this.rooms = [];
    this.settled = false;

    for (let i = 0; i < numRooms; i++) {
      const { width, height } = this.generateRoomSize();
      const mass = this.calculateMass(width, height);

      let x: number, y: number;

      // Different starting patterns
      switch (startingPattern) {
        case "split":
          if (i < numRooms / 2) {
            // Top right
            x = this.width * 0.6 + rand() * this.width * 0.3;
            y = this.height * 0.1 + rand() * this.height * 0.3;
          } else {
            // Bottom left
            x = this.width * 0.1 + rand() * this.width * 0.3;
            y = this.height * 0.6 + rand() * this.height * 0.3;
          }
          break;
        case "corners":
          const corner = Math.floor(rand() * 4);
          switch (corner) {
            case 0: // Top left
              x = this.width * 0.1 + rand() * this.width * 0.2;
              y = this.height * 0.1 + rand() * this.height * 0.2;
              break;
            case 1: // Top right
              x = this.width * 0.7 + rand() * this.width * 0.2;
              y = this.height * 0.1 + rand() * this.height * 0.2;
              break;
            case 2: // Bottom left
              x = this.width * 0.1 + rand() * this.width * 0.2;
              y = this.height * 0.7 + rand() * this.height * 0.2;
              break;
            case 3: // Bottom right
              x = this.width * 0.7 + rand() * this.width * 0.2;
              y = this.height * 0.7 + rand() * this.height * 0.2;
              break;
          }
          break;
        default: // center
          x = this.width * 0.3 + rand() * this.width * 0.4;
          y = this.height * 0.3 + rand() * this.height * 0.4;
      }

      this.rooms.push({
        x,
        y,
        width,
        height,
        vx: 0,
        vy: 0,
        mass,
        id: i,
      });
    }
  }

  // Check if two rooms collide (including 1-pixel border requirement)
  private roomsCollide(room1: Room, room2: Room): boolean {
    return !(
      room1.x + room1.width + 1 <= room2.x ||
      room2.x + room2.width + 1 <= room1.x ||
      room1.y + room1.height + 1 <= room2.y ||
      room2.y + room2.height + 1 <= room1.y
    );
  }

  // Check if two rooms should be snapped together (very close)
  private shouldSnap(room1: Room, room2: Room): boolean {
    const SNAP_DISTANCE = 3; // If closer than this, snap together

    // Check horizontal snapping
    const horizontalGap = Math.min(
      Math.abs(room1.x + room1.width + 1 - room2.x),
      Math.abs(room2.x + room2.width + 1 - room1.x),
    );

    // Check vertical snapping
    const verticalGap = Math.min(
      Math.abs(room1.y + room1.height + 1 - room2.y),
      Math.abs(room2.y + room2.height + 1 - room1.y),
    );

    const overlapsHorizontally = !(
      room1.x + room1.width < room2.x || room2.x + room2.width < room1.x
    );

    const overlapsVertically = !(
      room1.y + room1.height < room2.y || room2.y + room2.height < room1.y
    );

    return (
      (horizontalGap < SNAP_DISTANCE && overlapsVertically) ||
      (verticalGap < SNAP_DISTANCE && overlapsHorizontally)
    );
  }

  // Snap two rooms together with proper 1-pixel border
  private snapRooms(room1: Room, room2: Room): void {
    const overlapsHorizontally = !(
      room1.x + room1.width < room2.x || room2.x + room2.width < room1.x
    );

    const overlapsVertically = !(
      room1.y + room1.height < room2.y || room2.y + room2.height < room1.y
    );

    if (overlapsHorizontally) {
      // Snap vertically
      if (room1.y < room2.y) {
        // room1 above room2
        const targetY = room1.y + room1.height + 1;
        room2.y = targetY;
        room2.vy = 0;
        room1.vy = 0;
      } else {
        // room2 above room1
        const targetY = room2.y + room2.height + 1;
        room1.y = targetY;
        room1.vy = 0;
        room2.vy = 0;
      }
    } else if (overlapsVertically) {
      // Snap horizontally
      if (room1.x < room2.x) {
        // room1 left of room2
        const targetX = room1.x + room1.width + 1;
        room2.x = targetX;
        room2.vx = 0;
        room1.vx = 0;
      } else {
        // room2 left of room1
        const targetX = room2.x + room2.width + 1;
        room1.x = targetX;
        room1.vx = 0;
        room2.vx = 0;
      }
    }
  }

  // Apply collision response between two rooms
  private resolveCollision(room1: Room, room2: Room): void {
    // Calculate overlap
    const overlapX = Math.min(
      room1.x + room1.width + 1 - room2.x,
      room2.x + room2.width + 1 - room1.x,
    );
    const overlapY = Math.min(
      room1.y + room1.height + 1 - room2.y,
      room2.y + room2.height + 1 - room1.y,
    );

    // Resolve collision by moving along the axis with minimum overlap
    if (overlapX < overlapY) {
      // Horizontal separation
      const direction = room1.x < room2.x ? -1 : 1;
      const totalMass = room1.mass + room2.mass;
      const separation = overlapX / 2;

      room1.x += direction * separation * (room2.mass / totalMass);
      room2.x -= direction * separation * (room1.mass / totalMass);

      // Add some velocity for natural movement
      room1.vx += direction * 0.1 * (room2.mass / totalMass);
      room2.vx -= direction * 0.1 * (room1.mass / totalMass);
    } else {
      // Vertical separation
      const direction = room1.y < room2.y ? -1 : 1;
      const totalMass = room1.mass + room2.mass;
      const separation = overlapY / 2;

      room1.y += direction * separation * (room2.mass / totalMass);
      room2.y -= direction * separation * (room1.mass / totalMass);

      // Add some velocity for natural movement
      room1.vy += direction * 0.1 * (room2.mass / totalMass);
      room2.vy -= direction * 0.1 * (room1.mass / totalMass);
    }
  }

  // Run physics simulation
  simulatePhysics(iterations: number = 1000): void {
    const damping = 0.95;
    const minVelocity = 0.01;

    for (let iter = 0; iter < iterations; iter++) {
      let hasMovement = false;

      // Apply forces and resolve collisions
      for (let i = 0; i < this.rooms.length; i++) {
        for (let j = i + 1; j < this.rooms.length; j++) {
          if (this.roomsCollide(this.rooms[i], this.rooms[j])) {
            this.resolveCollision(this.rooms[i], this.rooms[j]);
            hasMovement = true;
          }
        }
      }

      // Apply snapping every iteration - rooms that are close enough stick together
      for (let i = 0; i < this.rooms.length; i++) {
        for (let j = i + 1; j < this.rooms.length; j++) {
          if (this.shouldSnap(this.rooms[i], this.rooms[j])) {
            this.snapRooms(this.rooms[i], this.rooms[j]);
          }
        }
      }

      // Update positions and apply damping
      for (const room of this.rooms) {
        room.x += room.vx;
        room.y += room.vy;
        room.vx *= damping;
        room.vy *= damping;

        // Keep rooms within bounds
        room.x = Math.max(1, Math.min(this.width - room.width - 1, room.x));
        room.y = Math.max(1, Math.min(this.height - room.height - 1, room.y));

        if (
          Math.abs(room.vx) > minVelocity ||
          Math.abs(room.vy) > minVelocity
        ) {
          hasMovement = true;
        }
      }

      // Check if system has settled
      if (!hasMovement) {
        console.log(`Physics settled after ${iter} iterations`);
        break;
      }
    }

    // Final pass: ensure all positions are integers for pixel-perfect rendering
    for (const room of this.rooms) {
      room.x = Math.round(room.x);
      room.y = Math.round(room.y);
    }

    this.settled = true;
  }

  // Generate PNG image data
  generatePNG(): HTMLCanvasElement {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Ensure pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;

    // Draw white rectangles for rooms
    this.ctx.fillStyle = "white";
    for (const room of this.rooms) {
      this.ctx.fillRect(
        Math.floor(room.x),
        Math.floor(room.y),
        room.width,
        room.height,
      );
    }

    return this.canvas;
  }

  // Save PNG to organized directory structure
  savePNG(filename?: string): void {
    const canvas = this.generatePNG();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFilename = filename || `level_${timestamp}.png`;

    // Create organized download
    const link = document.createElement("a");
    link.download = `generated_levels/${finalFilename}`;
    link.href = canvas.toDataURL("image/png");

    // Add to page temporarily and click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also log the data URL for manual saving if needed
    console.log(
      `Generated level PNG (${this.width}x${this.height}):`,
      link.href,
    );
    console.log(`Suggested save path: generated_levels/${finalFilename}`);
  }

  // Draw the level using Game.ctx for debugging/visualization
  draw(offsetX: number = 0, offsetY: number = 0, scale: number = 2): void {
    if (!Game.ctx) return;

    Game.ctx.save();

    // Disable smoothing for pixel-perfect rendering
    Game.ctx.imageSmoothingEnabled = false;
    (Game.ctx as any).webkitImageSmoothingEnabled = false;
    (Game.ctx as any).mozImageSmoothingEnabled = false;
    (Game.ctx as any).msImageSmoothingEnabled = false;

    // Clear area
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    Game.ctx.fillRect(
      offsetX,
      offsetY,
      this.width * scale,
      this.height * scale,
    );

    // Draw grid for reference
    Game.ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
    Game.ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x += 10) {
      Game.ctx.beginPath();
      Game.ctx.moveTo(offsetX + x * scale, offsetY);
      Game.ctx.lineTo(offsetX + x * scale, offsetY + this.height * scale);
      Game.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y += 10) {
      Game.ctx.beginPath();
      Game.ctx.moveTo(offsetX, offsetY + y * scale);
      Game.ctx.lineTo(offsetX + this.width * scale, offsetY + y * scale);
      Game.ctx.stroke();
    }

    // Draw rooms with different colors to show rectangles better
    for (const room of this.rooms) {
      // Room fill - use different colors for different aspect ratios
      const aspectRatio = room.width / room.height;
      let hue: number;

      if (aspectRatio > 1.5) {
        // Wide rectangle - blue tones
        hue = 200 + ((room.id * 30) % 60);
      } else if (aspectRatio < 0.67) {
        // Tall rectangle - red tones
        hue = 0 + ((room.id * 30) % 60);
      } else {
        // Square-ish - green tones
        hue = 100 + ((room.id * 30) % 60);
      }

      Game.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      Game.ctx.fillRect(
        offsetX + Math.floor(room.x) * scale,
        offsetY + Math.floor(room.y) * scale,
        room.width * scale,
        room.height * scale,
      );

      // Room border
      Game.ctx.strokeStyle = "white";
      Game.ctx.lineWidth = 1;
      Game.ctx.strokeRect(
        offsetX + Math.floor(room.x) * scale,
        offsetY + Math.floor(room.y) * scale,
        room.width * scale,
        room.height * scale,
      );

      // Room ID and dimensions text
      if (scale >= 2) {
        Game.ctx.fillStyle = "white";
        Game.ctx.font = "10px monospace";
        Game.ctx.textAlign = "center";
        Game.ctx.fillText(
          `${room.id}`,
          offsetX + (room.x + room.width / 2) * scale,
          offsetY + (room.y + room.height / 2) * scale - 2,
        );

        // Show dimensions for rectangles
        if (scale >= 3) {
          Game.ctx.font = "8px monospace";
          Game.ctx.fillText(
            `${room.width}×${room.height}`,
            offsetX + (room.x + room.width / 2) * scale,
            offsetY + (room.y + room.height / 2) * scale + 8,
          );
        }
      }
    }

    Game.ctx.restore();
  }

  // Generate a complete random level
  static generateRandomLevel(
    width: number = 80,
    height: number = 60,
    numRooms: number = 15,
    rand: () => number = Random.rand,
    pattern: "center" | "split" | "corners" = "center",
  ): LevelImageGenerator {
    const generator = new LevelImageGenerator(width, height);
    generator.generateRooms(numRooms, rand, pattern);
    generator.simulatePhysics();
    return generator;
  }

  // Get room data for external use
  getRooms(): Room[] {
    return [...this.rooms];
  }

  // Check if rooms are accessible (basic connectivity check)
  areRoomsAccessible(): boolean {
    if (this.rooms.length === 0) return true;
    if (this.rooms.length === 1) return true;

    // Simple flood fill to check connectivity
    const visited = new Set<number>();
    const queue = [0]; // Start with first room
    visited.add(0);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentRoom = this.rooms[currentId];

      // Check adjacent rooms (exactly 1 pixel apart = touching with 1px border)
      for (let i = 0; i < this.rooms.length; i++) {
        if (visited.has(i)) continue;

        const otherRoom = this.rooms[i];

        // Check if rooms are exactly adjacent (1 pixel gap)
        const horizontallyAdjacent =
          Math.abs(currentRoom.x + currentRoom.width + 1 - otherRoom.x) < 1 ||
          Math.abs(otherRoom.x + otherRoom.width + 1 - currentRoom.x) < 1;

        const verticallyAdjacent =
          Math.abs(currentRoom.y + currentRoom.height + 1 - otherRoom.y) < 1 ||
          Math.abs(otherRoom.y + otherRoom.height + 1 - currentRoom.y) < 1;

        const overlapsHorizontally = !(
          currentRoom.x + currentRoom.width < otherRoom.x ||
          otherRoom.x + otherRoom.width < currentRoom.x
        );

        const overlapsVertically = !(
          currentRoom.y + currentRoom.height < otherRoom.y ||
          otherRoom.y + otherRoom.height < currentRoom.y
        );

        if (
          (horizontallyAdjacent && overlapsVertically) ||
          (verticallyAdjacent && overlapsHorizontally)
        ) {
          visited.add(i);
          queue.push(i);
        }
      }
    }

    return visited.size === this.rooms.length;
  }
}
