import { Game } from "../game";
import { Room, RoomType } from "../room/room";
import { Random } from "../utility/random";
import { LevelParameters } from "./levelParametersGenerator";
import { GameConstants } from "../game/gameConstants";
import { LevelValidator, ValidationResult } from "./levelValidator";
import { GenerationVisualizer } from "./generationVisualizer";
import { SidePathOptions } from "./sidePathManager";

export enum PathType {
  MAIN_PATH, // Has exit room (current dungeon)
  SIDE_PATH, // No exit room (current cave/ropehole)
  TUTORIAL, // Special case
}

export interface PathParameters {
  pathType: PathType;
  mapWidth: number;
  mapHeight: number;
  roomCount: { min: number; max: number };
  splitProbabilities: number[];
  wallRemoveProbability: number;
  maxRoomArea: number;
  softMaxRoomArea: number;
  connectionStyle: "linear" | "branched";
  loopDoorCount: { min: number; max: number };
}

export class PartitionConnection {
  x: number;
  y: number;
  other: Partition;

  constructor(x: number, y: number, other: Partition) {
    this.x = x;
    this.y = y;
    this.other = other;
  }
}

export class Partition {
  x: number;
  y: number;
  w: number;
  h: number;
  type: RoomType;
  fillStyle: string;
  connections: Array<PartitionConnection>;
  distance: number;
  isTopOpen: boolean;
  isRightOpen: boolean;
  isBottomOpen: boolean;
  isLeftOpen: boolean;
  pathIndex: number;

  constructor(x: number, y: number, w: number, h: number, fillStyle: string) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fillStyle = fillStyle;
    this.type = RoomType.DUNGEON;
    this.connections = [];
    this.distance = 1000;
    this.isTopOpen = true;
    this.isRightOpen = true;
    this.isBottomOpen = true;
    this.isLeftOpen = true;
    this.pathIndex = 0;
  }

  split = async (): Promise<Array<Partition>> => {
    // Remove the setTimeout - animation is now handled by visualizer
    // The visualizer will handle the delay through createAnimationDelay('partition')

    // Reset open walls when a partition is split
    this.isTopOpen = true;
    this.isRightOpen = true;
    this.isBottomOpen = true;
    this.isLeftOpen = true;

    // This function generates a random number around the center (0.5) within a certain width (0.6).
    let rand_mid = () => {
      let center = 0.5;
      let width = 0.6;
      return (Random.rand() - 0.5) * width + center;
    };

    let MIN_SIZE = 4;

    if (this.w > this.h) {
      let w1 = Math.floor(rand_mid() * this.w);
      let w2 = this.w - w1 - 1;
      if (w1 < MIN_SIZE || w2 < MIN_SIZE) return [this];
      return [
        new Partition(this.x, this.y, w1, this.h, this.fillStyle),
        new Partition(this.x + w1 + 1, this.y, w2, this.h, this.fillStyle),
      ];
    } else {
      let h1 = Math.floor(rand_mid() * this.h);
      let h2 = this.h - h1 - 1;
      if (h1 < MIN_SIZE || h2 < MIN_SIZE) return [this];
      return [
        new Partition(this.x, this.y, this.w, h1, this.fillStyle),
        new Partition(this.x, this.y + h1 + 1, this.w, h2, this.fillStyle),
      ];
    }
  };

  point_in = (x: number, y: number): boolean => {
    return (
      x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
    );
  };

  point_next_to = (x: number, y: number): boolean => {
    return (
      (x >= this.x - 1 &&
        x < this.x + this.w + 1 &&
        y >= this.y &&
        y < this.y + this.h) ||
      (x >= this.x &&
        x < this.x + this.w &&
        y >= this.y - 1 &&
        y < this.y + this.h + 1)
    );
  };

  area = (): number => {
    return this.w * this.h;
  };

  overlaps = (other: Partition): boolean => {
    return (
      other.x < this.x + this.w + 1 &&
      other.x + other.w > this.x - 1 &&
      other.y < this.y + this.h + 1 &&
      other.y + other.h > this.y - 1
    );
  };

  setOpenWall = (connection: PartitionConnection) => {
    if (
      connection.y === this.y - 1 &&
      connection.x >= this.x &&
      connection.x < this.x + this.w
    ) {
      this.isTopOpen = false;
    }
    if (
      connection.y === this.y + this.h &&
      connection.x >= this.x &&
      connection.x < this.x + this.w
    ) {
      this.isBottomOpen = false;
    }
    if (
      connection.x === this.x + this.w &&
      connection.y >= this.y &&
      connection.y < this.y + this.h
    ) {
      this.isRightOpen = false;
    }
    if (
      connection.x === this.x - 1 &&
      connection.y >= this.y &&
      connection.y < this.y + this.h
    ) {
      this.isLeftOpen = false;
    }
  };

  get_branch_point = (): { x: number; y: number } => {
    let points = [];
    for (let x = this.x; x < this.x + this.w; x++) {
      points.push({ x: x, y: this.y - 1 });
      points.push({ x: x, y: this.y + this.h });
    }
    for (let y = this.y; y < this.y + this.h; y++) {
      points.push({ x: this.x - 1, y: y });
      points.push({ x: this.x + this.w, y: y });
    }
    points = points.filter(
      (p) =>
        !this.connections.some(
          (c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1,
        ),
    );
    // IMPORTANT: do not use Array.sort with a random comparator.
    // JS engines may call the comparator an implementation-dependent number of times,
    // which makes generation nondeterministic even with a deterministic RNG.
    if (points.length === 0) return { x: this.x, y: this.y };
    const idx = Math.floor(Random.rand() * points.length);
    return points[idx];
  };
}

export class PartialLevel {
  partitions: Array<Partition>;

  constructor() {
    this.partitions = [];
  }
}

export class PartitionGenerator {
  private validator: LevelValidator;
  private visualizer: GenerationVisualizer;

  constructor(game: Game) {
    this.validator = new LevelValidator(game);
    this.visualizer = new GenerationVisualizer(game);
  }

  async generateDungeonPartitions(
    game: Game,
    mapWidth: number,
    mapHeight: number,
    depth: number,
    params: LevelParameters,
    controls?: { branching?: number; loopiness?: number },
  ): Promise<Partition[]> {
    // Single-room dungeon mode: when the selected room count is 1, generate exactly one
    // START partition and let population place both ladders inside it.
    // This intentionally bypasses boss/stair-room logic which assumes multi-room layouts.
    if (params?.maxRoomCount <= 1) {
      const p = new Partition(0, 0, mapWidth, mapHeight, "white");
      p.type = RoomType.START;
      return [p];
    }

    const partialLevel = new PartialLevel();
    let validationResult: ValidationResult;
    let attempts = 0;

    this.visualizer.updateProgress("Starting dungeon generation", 0);

    do {
      attempts++;
      this.visualizer.updateProgress(
        `Generating candidate ${attempts}`,
        attempts * 0.1,
      );

      await this.generateDungeonCandidate(
        game,
        partialLevel,
        mapWidth,
        mapHeight,
        depth,
        params,
        controls,
      );

      validationResult = this.validator.validateDungeonPartitions(
        partialLevel.partitions,
        params,
      );

      // Update visualization state
      this.visualizer.setVisualizationState(
        partialLevel.partitions,
        mapWidth / 2,
        mapHeight / 2,
        "validating",
        0.8,
      );

      // If validation fails, the loop will continue and regenerate
    } while (!validationResult.isValid);

    this.visualizer.updateProgress("Finalizing generation", 0.9);
    await this.visualizer.createAnimationDelay("large");

    this.visualizer.createVisualEffect("generation_complete");
    this.visualizer.updateProgress("Generation complete", 1.0);

    console.log("finished generation");
    return partialLevel.partitions;
  }

  async generateCavePartitions(opts: SidePathOptions): Promise<Partition[]> {
    const partialLevel = new PartialLevel();
    let validationResult: ValidationResult;
    let attempts = 0;
    const mapWidth = opts.mapWidth ?? 50;
    const mapHeight = opts.mapHeight ?? 50;
    const numRooms = opts.caveRooms ?? 8;

    // Single-room cave/sidepath mode: `caveRooms = 1` should mean exactly one ROPECAVE room.
    // The default cave algorithm always splits many partitions first, then prunes by connectivity,
    // which breaks when numRooms<=1 (spawn would have no connections and gets filtered out).
    if (numRooms <= 1) {
      const CAVE_OFFSET = 100;
      const p = new Partition(CAVE_OFFSET, CAVE_OFFSET, mapWidth, mapHeight, "white");
      p.type = RoomType.ROPECAVE;
      return [p];
    }
    const hasLinearity = typeof opts.linearity === "number";
    const branching =
      typeof opts.branching === "number"
        ? opts.branching
        : hasLinearity
          ? Math.max(0, Math.min(1, 1 - (opts.linearity as number)))
          : 0.5; // default: 50% chance of second door
    const loopiness =
      typeof opts.loopiness === "number"
        ? opts.loopiness
        : hasLinearity
          ? Math.max(0, Math.min(1, 1 - (opts.linearity as number)))
          : 0.5; // default: moderate loops

    this.visualizer.updateProgress("Starting cave generation", 0);

    do {
      attempts++;
      this.visualizer.updateProgress(
        `Generating cave candidate ${attempts}`,
        attempts * 0.1,
      );

      if (opts.giantCentralRoom) {
        await this.generateCaveCandidateWithGiantCenter(
          partialLevel,
          mapWidth,
          mapHeight,
          numRooms,
          branching,
          loopiness,
          opts.giantRoomScale ?? 0.65,
        );
      } else {
        await this.generateCaveCandidate(
          partialLevel,
          mapWidth,
          mapHeight,
          numRooms,
          branching,
          loopiness,
        );
      }

      validationResult = this.validator.validateCavePartitions(
        partialLevel.partitions,
        numRooms,
      );

      // Update visualization state
      this.visualizer.setVisualizationState(
        partialLevel.partitions,
        mapWidth / 2,
        mapHeight / 2,
        "validating cave",
        0.8,
      );

      // If validation fails, the loop will continue and regenerate
    } while (!validationResult.isValid);

    this.visualizer.updateProgress("Cave generation complete", 1.0);
    return partialLevel.partitions;
  }

  generateTutorialPartitions(
    height: number = 7,
    width: number = 7,
  ): Partition[] {
    const partitions = [new Partition(0, 0, height, width, "white")];
    partitions[0].type = RoomType.TUTORIAL;

    // Validate tutorial partitions
    const validationResult =
      this.validator.validateTutorialPartitions(partitions);
    if (!validationResult.isValid) {
      throw new Error(
        `Tutorial validation failed: ${validationResult.errorMessage}`,
      );
    }

    return partitions;
  }

  private async generateDungeonCandidate(
    game: Game,
    partialLevel: PartialLevel,
    map_w: number,
    map_h: number,
    depth: number,
    params: LevelParameters,
    controls?: { branching?: number; loopiness?: number },
  ) {
    const {
      minRoomCount,
      maxRoomCount,
      maxRoomArea,
      splitProbabilities,
      wallRemoveProbability,
      softMaxRoomArea,
    } = params;

    partialLevel.partitions = [new Partition(0, 0, map_w, map_h, "white")];

    this.visualizer.updateProgress("Splitting partitions", 0.1);
    this.visualizer.setVisualizationState(
      partialLevel.partitions,
      map_w / 2,
      map_h / 2,
      "splitting",
    );

    // Use splitProbabilities for splitting
    while (partialLevel.partitions.length < params.maxRoomCount) {
      for (let i = 0; i < splitProbabilities.length; i++) {
        partialLevel.partitions = await this.splitPartitions(
          partialLevel.partitions,
          splitProbabilities[i],
        );

        // Update visualization after each split
        this.visualizer.setVisualizationState(
          partialLevel.partitions,
          map_w / 2,
          map_h / 2,
          "splitting",
          0.1 + (i / splitProbabilities.length) * 0.2,
        );
      }
    }

    // IMPORTANT: don't use `forEach(async ...)` here.
    // It won't await, which makes generation nondeterministic and racy.
    for (let i = 0; i < 100; i++) {
      let changed = false;
      const next: Partition[] = [];
      for (const partition of partialLevel.partitions) {
        const roomArea = Random.rand() > 0.95 ? softMaxRoomArea : maxRoomArea;
        if (partition.area() > roomArea) {
          changed = true;
          const split = await this.splitPartition(partition, 0.5);
          next.push(...split);
        } else {
          next.push(partition);
        }
      }
      partialLevel.partitions = next;
      if (!changed) break;
    }

    this.visualizer.updateProgress("Removing wall rooms", 0.4);
    partialLevel.partitions = this.removeWallRooms(
      partialLevel.partitions,
      map_w,
      map_h,
      wallRemoveProbability,
    );

    await this.visualizer.createAnimationDelay("large");

    if (partialLevel.partitions.length === 0) {
      partialLevel.partitions = [];
      return;
    }

    this.visualizer.updateProgress("Assigning room types", 0.5);
    // Sort and assign room types
    partialLevel.partitions.sort((a, b) => a.area() - b.area());
    this.visualizer.updatePartitionStyles(partialLevel.partitions);

    if (partialLevel.partitions.length === 0) {
      partialLevel.partitions = [];
      return;
    }

    let spawn = partialLevel.partitions[0];
    if (!spawn) {
      partialLevel.partitions = [];
      return;
    }

    spawn.type = RoomType.START;
    spawn.fillStyle = "rgb(0, 255, 0)";
    if (partialLevel.partitions.length > 1) {
      partialLevel.partitions[partialLevel.partitions.length - 1].type =
        RoomType.BOSS;
      partialLevel.partitions[partialLevel.partitions.length - 1].fillStyle =
        "red";
    }

    this.visualizer.updateProgress("Connecting partitions", 0.6);
    await this.connectPartitions(partialLevel, spawn, controls?.branching);

    this.visualizer.updateProgress("Adding loop connections", 0.7);
    if (partialLevel.partitions.length > 0) {
      await this.addLoopConnections(partialLevel, controls?.loopiness);
    }

    this.visualizer.updateProgress("Adding stair room", 0.8);
    if (partialLevel.partitions.length > 0) {
      await this.addStairRoom(partialLevel, game);
    }

    this.visualizer.updateProgress("Calculating distances", 0.9);
    if (partialLevel.partitions.length > 0) {
      await this.calculateDistances(partialLevel, spawn);
      await this.addSpecialRooms(partialLevel);
    }
  }

  private async generateCaveCandidate(
    partialLevel: PartialLevel,
    map_w: number,
    map_h: number,
    num_rooms: number,
    branching: number = 0.5,
    loopiness: number = 0.5,
  ) {
    const CAVE_OFFSET = 100;
    partialLevel.partitions = [
      new Partition(CAVE_OFFSET, CAVE_OFFSET, map_w, map_h, "white"),
    ];

    for (let i = 0; i < 9; i++) {
      partialLevel.partitions = await this.splitPartitions(
        partialLevel.partitions,
        0.75,
      );
    }

    partialLevel.partitions.sort((a, b) => a.area() - b.area());

    if (partialLevel.partitions.length === 0) {
      throw new Error("No partitions generated.");
    }

    let spawn = partialLevel.partitions[0];
    spawn.type = RoomType.ROPECAVE;
    for (let i = 1; i < partialLevel.partitions.length; i++) {
      partialLevel.partitions[i].type = RoomType.CAVE;
    }

    await this.connectCavePartitions(partialLevel, spawn, num_rooms, branching);
    await this.addCaveLoops(partialLevel, loopiness);
    await this.calculateDistances(partialLevel, spawn);
  }

  // Variant that creates a giant central room and smaller surrounding rooms connected to it
  private async generateCaveCandidateWithGiantCenter(
    partialLevel: PartialLevel,
    map_w: number,
    map_h: number,
    num_rooms: number,
    branching: number = 0.5,
    loopiness: number = 0.5,
    giantScale: number = 0.65,
  ) {
    const CAVE_OFFSET = 100;
    partialLevel.partitions = [];

    // Create the giant center room
    const gW = Math.max(
      6,
      Math.floor(map_w * Math.max(0.4, Math.min(0.9, giantScale))),
    );
    const gH = Math.max(
      6,
      Math.floor(map_h * Math.max(0.4, Math.min(0.9, giantScale))),
    );
    const gx = CAVE_OFFSET + Math.floor((map_w - gW) / 2);
    const gy = CAVE_OFFSET + Math.floor((map_h - gH) / 2);
    const center = new Partition(gx, gy, gW, gH, "white");
    center.type = RoomType.BIGCAVE; // central hub is not the entry; entry will be a smaller room
    partialLevel.partitions.push(center);

    // Create peripheral rooms ADJACENT to the center on one side (to ensure valid door coords)
    const targetCount = Math.max(4, num_rooms - 1);
    let attempts = 0;
    while (partialLevel.partitions.length < targetCount + 1 && attempts < 400) {
      attempts++;
      const w = Math.max(
        3,
        Math.floor(Random.rand() * Math.max(3, map_w * 0.25) + 3),
      );
      const h = Math.max(
        3,
        Math.floor(Random.rand() * Math.max(3, map_h * 0.25) + 3),
      );

      // pick a side to attach: 0=left,1=right,2=top,3=bottom
      const side = Math.floor(Random.rand() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        // attach to left: p.x + p.w === center.x - 1
        x = center.x - 1 - w;
        const minY = Math.max(CAVE_OFFSET, center.y - h + 1);
        const maxY = Math.min(CAVE_OFFSET + map_h - h, center.y + center.h - 1);
        if (minY > maxY) continue;
        y =
          CAVE_OFFSET +
          Game.rand(minY - CAVE_OFFSET, maxY - CAVE_OFFSET, Random.rand);
      } else if (side === 1) {
        // attach to right: p.x === center.x + center.w + 1
        x = center.x + center.w + 1;
        const minY = Math.max(CAVE_OFFSET, center.y - h + 1);
        const maxY = Math.min(CAVE_OFFSET + map_h - h, center.y + center.h - 1);
        if (minY > maxY) continue;
        y =
          CAVE_OFFSET +
          Game.rand(minY - CAVE_OFFSET, maxY - CAVE_OFFSET, Random.rand);
      } else if (side === 2) {
        // attach to top: p.y + p.h === center.y - 1
        y = center.y - 1 - h;
        const minX = Math.max(CAVE_OFFSET, center.x - w + 1);
        const maxX = Math.min(CAVE_OFFSET + map_w - w, center.x + center.w - 1);
        if (minX > maxX) continue;
        x =
          CAVE_OFFSET +
          Game.rand(minX - CAVE_OFFSET, maxX - CAVE_OFFSET, Random.rand);
      } else {
        // attach to bottom: p.y === center.y + center.h + 1
        y = center.y + center.h + 1;
        const minX = Math.max(CAVE_OFFSET, center.x - w + 1);
        const maxX = Math.min(CAVE_OFFSET + map_w - w, center.x + center.w - 1);
        if (minX > maxX) continue;
        x =
          CAVE_OFFSET +
          Game.rand(minX - CAVE_OFFSET, maxX - CAVE_OFFSET, Random.rand);
      }

      // Bounds check
      if (x < CAVE_OFFSET || y < CAVE_OFFSET) continue;
      if (x + w > CAVE_OFFSET + map_w || y + h > CAVE_OFFSET + map_h) continue;

      const p = new Partition(x, y, w, h, "white");
      p.type = RoomType.CAVE;
      // Ensure no overlap with existing
      if (!partialLevel.partitions.some((other) => other.overlaps(p))) {
        partialLevel.partitions.push(p);
      }
    }

    // Connect all rooms to the center using boundary coords compatible with addDoor()
    for (let i = 1; i < partialLevel.partitions.length; i++) {
      const p = partialLevel.partitions[i];
      let cx = 0;
      let cy = 0;
      if (p.x + p.w === center.x - 1) {
        // left of center
        cx = center.x - 1; // shared boundary column
        cy = Math.max(
          center.y,
          Math.min(p.y + Math.floor(p.h / 2), center.y + center.h - 1),
        );
      } else if (p.x === center.x + center.w + 1) {
        // right of center
        cx = center.x + center.w; // shared boundary column
        cy = Math.max(
          center.y,
          Math.min(p.y + Math.floor(p.h / 2), center.y + center.h - 1),
        );
      } else if (p.y + p.h === center.y - 1) {
        // above center
        cy = center.y - 1; // shared boundary row
        cx = Math.max(
          center.x,
          Math.min(p.x + Math.floor(p.w / 2), center.x + center.w - 1),
        );
      } else if (p.y === center.y + center.h + 1) {
        // below center
        cy = center.y + center.h; // shared boundary row
        cx = Math.max(
          center.x,
          Math.min(p.x + Math.floor(p.w / 2), center.x + center.w - 1),
        );
      } else {
        // not adjacent; skip
        continue;
      }
      center.connections.push(new PartitionConnection(cx, cy, p));
      p.connections.push(new PartitionConnection(cx, cy, center));
    }

    // Select a small peripheral room as the ROPECAVE (entry) if any exist
    const peripherals = partialLevel.partitions.filter((p) => p !== center);
    if (peripherals.length > 0) {
      let entry = peripherals[0];
      for (let i = 1; i < peripherals.length; i++) {
        if (peripherals[i].area() < entry.area()) entry = peripherals[i];
      }
      entry.type = RoomType.ROPECAVE;
      // Random chance to convert a different peripheral into a GEMCAVE
      if (peripherals.length > 1 && Random.rand() < 0.33) {
        const candidates = peripherals.filter((p) => p !== entry);
        if (candidates.length > 0) {
          const gemIndex = Game.rand(0, candidates.length - 1, Random.rand);
          candidates[gemIndex].type = RoomType.GEMCAVE;
        }
      }
    } else {
      // Fallback: if no peripherals created, use center as entry
      center.type = RoomType.ROPECAVE;
    }

    // Add additional connections/loops using existing helpers for some variety
    await this.addCaveLoops(partialLevel, loopiness);

    // Distances from center
    await this.calculateDistances(partialLevel, center);
  }

  private async splitPartitions(
    partitions: Array<Partition>,
    prob: number,
  ): Promise<Array<Partition>> {
    for (let partition of partitions) {
      if (Random.rand() < prob) {
        this.visualizer.createVisualEffect("partition_split", partition);
        partitions = partitions.filter((p) => p !== partition);
        partitions = partitions.concat(await partition.split());
      }
    }
    return partitions;
  }

  private async splitPartition(
    partition: Partition,
    prob: number,
  ): Promise<Array<Partition>> {
    if (Random.rand() < prob) {
      return await partition.split();
    } else {
      return [partition];
    }
  }

  private getWallRooms(
    partitions: Array<Partition>,
    mapWidth: number,
    mapHeight: number,
  ): Array<Partition> {
    return partitions.filter((partition) => {
      const isPathClear = (
        direction: "left" | "right" | "top" | "bottom",
      ): boolean => {
        switch (direction) {
          case "left":
            for (let y = partition.y; y < partition.y + partition.h; y++) {
              let blocked = partitions.some((other) => {
                if (other === partition) return false;
                return (
                  other.y <= y &&
                  y < other.y + other.h &&
                  other.x + other.w > 0 &&
                  other.x + other.w <= partition.x
                );
              });
              if (!blocked) return true;
            }
            return false;
          case "right":
            for (let y = partition.y; y < partition.y + partition.h; y++) {
              let blocked = partitions.some((other) => {
                if (other === partition) return false;
                return (
                  other.y <= y &&
                  y < other.y + other.h &&
                  other.x < mapWidth &&
                  other.x >= partition.x + partition.w
                );
              });
              if (!blocked) return true;
            }
            return false;
          case "top":
            for (let x = partition.x; x < partition.x + partition.w; x++) {
              let blocked = partitions.some((other) => {
                if (other === partition) return false;
                return (
                  other.x <= x &&
                  x < other.x + other.w &&
                  other.y + other.h > 0 &&
                  other.y + other.h <= partition.y
                );
              });
              if (!blocked) return true;
            }
            return false;
          case "bottom":
            for (let x = partition.x; x < partition.x + partition.w; x++) {
              let blocked = partitions.some((other) => {
                if (other === partition) return false;
                return (
                  other.x <= x &&
                  x < other.x + other.w &&
                  other.y < mapHeight &&
                  other.y >= partition.y + partition.h
                );
              });
              if (!blocked) return true;
            }
            return false;
          default:
            return false;
        }
      };

      const openPaths = [
        isPathClear("left"),
        isPathClear("right"),
        isPathClear("top"),
        isPathClear("bottom"),
      ].filter(Boolean).length;

      return openPaths === 1;
    });
  }

  private removeWallRooms(
    partitions: Array<Partition>,
    w: number,
    h: number,
    prob: number = 1.0,
  ): Array<Partition> {
    const wallRooms = this.getWallRooms(partitions, w, h);

    for (const wallRoom of wallRooms) {
      if (Random.rand() < prob) {
        partitions = partitions.filter((p) => p !== wallRoom);
      }
    }

    return partitions;
  }

  private async connectPartitions(
    partialLevel: PartialLevel,
    spawn: Partition,
    branching?: number,
  ) {
    let connected = [spawn];
    let frontier = [spawn];
    let found_boss = false;

    while (frontier.length > 0 && !found_boss) {
      let room = frontier[0];
      if (room !== spawn) {
        this.visualizer.createVisualEffect("room_connected", room);
      }
      frontier.splice(0, 1);

      let doors_found = 0;
      // Default behavior kept if branching is undefined
      const num_doors =
        branching === undefined
          ? Math.floor(Random.rand() * 2 + 1)
          : 1 + (Random.rand() < Math.max(0, Math.min(1, branching)) ? 1 : 0);
      let tries = 0;
      const max_tries = 1000;

      while (doors_found < num_doors && tries < max_tries) {
        let point = room.get_branch_point();
        for (const p of partialLevel.partitions) {
          if (
            p !== room &&
            connected.indexOf(p) === -1 &&
            p.point_next_to(point.x, point.y)
          ) {
            room.connections.push(new PartitionConnection(point.x, point.y, p));
            p.connections.push(new PartitionConnection(point.x, point.y, room));

            room.setOpenWall(new PartitionConnection(point.x, point.y, p));
            p.setOpenWall(new PartitionConnection(point.x, point.y, room));

            frontier.push(p);
            connected.push(p);
            doors_found++;
            if (p.type === RoomType.BOSS) {
              found_boss = true;
              this.visualizer.createVisualEffect("boss_found", p);
            }
            break;
          }
        }
        tries++;
      }

      await this.visualizer.createAnimationDelay("pathfinding");
    }

    // Remove unconnected rooms
    for (const partition of partialLevel.partitions) {
      if (partition.connections.length === 0) {
        partialLevel.partitions = partialLevel.partitions.filter(
          (p) => p !== partition,
        );
      }
    }
  }

  private async connectCavePartitions(
    partialLevel: PartialLevel,
    spawn: Partition,
    num_rooms: number,
    branching: number = 0.5,
  ) {
    let connected = [spawn];
    let frontier = [spawn];

    while (frontier.length > 0 && connected.length < num_rooms) {
      let room = frontier[0];
      frontier.splice(0, 1);

      let doors_found = 0;
      // branching controls probability of a second door
      const pSecondDoor = Math.max(0, Math.min(1, branching));
      const num_doors = 1 + (Random.rand() < pSecondDoor ? 1 : 0);
      let tries = 0;
      const max_tries = 1000;

      while (
        doors_found < num_doors &&
        tries < max_tries &&
        connected.length < num_rooms
      ) {
        let point = room.get_branch_point();
        if (!point) break;

        for (const p of partialLevel.partitions) {
          if (
            p !== room &&
            connected.indexOf(p) === -1 &&
            p.point_next_to(point.x, point.y)
          ) {
            room.connections.push(new PartitionConnection(point.x, point.y, p));
            p.connections.push(new PartitionConnection(point.x, point.y, room));
            frontier.push(p);
            connected.push(p);
            doors_found++;
            break;
          }
        }
        tries++;
      }
    }

    // Remove unconnected rooms
    partialLevel.partitions = partialLevel.partitions.filter(
      (partition) => partition.connections.length > 0,
    );

    if (partialLevel.partitions.length === 0) {
      throw new Error("No valid rooms after filtering.");
    }
  }

  private async addLoopConnections(
    partialLevel: PartialLevel,
    loopiness?: number,
  ) {
    // Check if we have any partitions to work with
    if (partialLevel.partitions.length === 0) {
      return;
    }

    let num_loop_doors =
      loopiness === undefined
        ? Math.floor(Random.rand() * 4 + 4)
        : Math.floor(
            (Random.rand() * 4 + 4) * Math.max(0, Math.min(1, loopiness)),
          );
    for (let i = 0; i < num_loop_doors; i++) {
      // Double-check array length in case partitions were removed during iteration
      if (partialLevel.partitions.length === 0) {
        break;
      }

      let roomIndex = Math.floor(
        Random.rand() * partialLevel.partitions.length,
      );
      let room = partialLevel.partitions[roomIndex];

      // Safety check to ensure room exists
      if (!room) {
        continue;
      }

      let found_door = false;
      let tries = 0;
      const max_tries = 10;

      let not_already_connected = partialLevel.partitions.filter(
        (p) => p && !room.connections.some((c) => c.other === p),
      );

      while (!found_door && tries < max_tries) {
        let point = room.get_branch_point();
        if (!point) {
          break; // Skip if no valid branch point found
        }

        for (const p of not_already_connected) {
          if (p && p !== room && p.point_next_to(point.x, point.y)) {
            room.connections.push(new PartitionConnection(point.x, point.y, p));
            p.connections.push(new PartitionConnection(point.x, point.y, room));

            room.setOpenWall(new PartitionConnection(point.x, point.y, p));
            p.setOpenWall(new PartitionConnection(point.x, point.y, room));

            found_door = true;
            break;
          }
        }
        tries++;
      }
    }
  }

  private async addCaveLoops(
    partialLevel: PartialLevel,
    loopiness: number = 0.5,
  ) {
    // Check if we have any partitions to work with
    if (partialLevel.partitions.length === 0) {
      return;
    }

    let num_loop_doors = Math.floor(
      (Random.rand() * 4 + 4) * Math.max(0, Math.min(1, loopiness)),
    );
    for (let i = 0; i < num_loop_doors; i++) {
      // Double-check array length in case partitions were removed during iteration
      if (partialLevel.partitions.length === 0) {
        break;
      }

      let roomIndex = Math.floor(
        Random.rand() * partialLevel.partitions.length,
      );
      let room = partialLevel.partitions[roomIndex];

      // Safety check to ensure room exists
      if (!room) {
        continue;
      }

      let found_door = false;
      let tries = 0;
      const max_tries = 100;

      let not_already_connected = partialLevel.partitions.filter(
        (p) => p && !room.connections.some((c) => c.other === p),
      );

      while (!found_door && tries < max_tries) {
        let point = room.get_branch_point();
        if (!point) {
          break; // Skip if no valid branch point found
        }

        for (const p of not_already_connected) {
          if (p && p !== room && p.point_next_to(point.x, point.y)) {
            room.connections.push(new PartitionConnection(point.x, point.y, p));
            p.connections.push(new PartitionConnection(point.x, point.y, room));
            found_door = true;
            break;
          }
        }
        tries++;
      }
    }
  }

  private async addStairRoom(partialLevel: PartialLevel, game: Game) {
    if (!partialLevel.partitions.some((p) => p.type === RoomType.BOSS)) {
      partialLevel.partitions = [];
      return;
    }

    let boss = partialLevel.partitions.find((p) => p.type === RoomType.BOSS);
    let found_stair = false;
    const max_stair_tries = 5;
    const stairRoomWidth = 7;
    const stairRoomHeight = 5;

    for (let stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
      let stair = new Partition(
        Game.rand(boss.x - 1, boss.x + boss.w - 2, Random.rand),
        boss.y - stairRoomHeight - 1,
        stairRoomWidth,
        stairRoomHeight,
        "white",
      );
      stair.type = RoomType.DOWNLADDER;
      stair.fillStyle = "blue";

      if (!partialLevel.partitions.some((p) => p.overlaps(stair))) {
        found_stair = true;
        partialLevel.partitions.push(stair);
        stair.connections.push(
          new PartitionConnection(stair.x + 1, stair.y + stairRoomHeight, boss),
        );
        boss.connections.push(
          new PartitionConnection(
            stair.x + 1,
            stair.y + stairRoomHeight,
            stair,
          ),
        );

        stair.setOpenWall(
          new PartitionConnection(stair.x + 1, stair.y + stairRoomHeight, boss),
        );
        boss.setOpenWall(
          new PartitionConnection(
            stair.x + 1,
            stair.y + stairRoomHeight,
            stair,
          ),
        );
        break;
      }
    }

    if (!found_stair) {
      console.log("No stair found");
      partialLevel.partitions = [];
    }
  }

  private async calculateDistances(
    partialLevel: PartialLevel,
    spawn: Partition,
  ) {
    let frontier = [spawn];
    let seen = [];
    spawn.distance = 0;

    while (frontier.length > 0) {
      let room = frontier[0];
      frontier.splice(0, 1);
      seen.push(room);

      for (let c of room.connections) {
        let other = c.other;
        other.distance = Math.min(other.distance, room.distance + 1);
        if (seen.indexOf(other) === -1) frontier.push(other);
      }
    }
  }

  private async addSpecialRooms(partialLevel: PartialLevel) {
    let added_rope_hole = false;
    for (const p of partialLevel.partitions) {
      if (p.type === RoomType.DUNGEON) {
        if (p.distance > 4 && p.area() <= 30 && Random.rand() < 0) {
          p.type = RoomType.TREASURE;
        } /*else if (!added_rope_hole) {
          p.type = RoomType.ROPEHOLE;
          added_rope_hole = true;
        }*/
      }
    }

    await this.visualizer.createAnimationDelay("large");
  }

  // Add method to get visualizer (for external access)
  getVisualizer(): GenerationVisualizer {
    return this.visualizer;
  }
}
