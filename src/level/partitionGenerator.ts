import { Game } from "../game";
import { Room, RoomType } from "../room/room";
import { Random } from "../utility/random";
import { LevelParameters } from "./levelParametersGenerator";
import { GameConstants } from "../game/gameConstants";
import { LevelValidator, ValidationResult } from "./levelValidator";
import { GenerationVisualizer } from "./generationVisualizer";
import { SidePathOptions } from "./sidePathManager";
import { EnvType } from "../constants/environmentTypes";

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

  async generateCavePartitions(opts?: SidePathOptions): Promise<Partition[]> {
    const effectiveOpts: SidePathOptions = { ...(opts ?? {}) };
    const partialLevel = new PartialLevel();
    let validationResult: ValidationResult;
    let attempts = 0;
    const mapWidth = effectiveOpts.mapWidth ?? 50;
    const mapHeight = effectiveOpts.mapHeight ?? 50;
    const numRooms = effectiveOpts.caveRooms ?? 8;

    // Single-room cave/sidepath mode: `caveRooms = 1` should mean exactly one ROPECAVE room.
    // The default cave algorithm always splits many partitions first, then prunes by connectivity,
    // which breaks when numRooms<=1 (spawn would have no connections and gets filtered out).
    if (numRooms <= 1) {
      const CAVE_OFFSET = 100;
      const p = new Partition(
        CAVE_OFFSET,
        CAVE_OFFSET,
        mapWidth,
        mapHeight,
        "white",
      );
      p.type = RoomType.ROPECAVE;
      return [p];
    }
    const hasLinearity = typeof effectiveOpts.linearity === "number";
    const branching =
      typeof effectiveOpts.branching === "number"
        ? effectiveOpts.branching
        : hasLinearity
          ? Math.max(0, Math.min(1, 1 - (effectiveOpts.linearity as number)))
          : 0.5; // default: 50% chance of second door
    const loopiness =
      typeof effectiveOpts.loopiness === "number"
        ? effectiveOpts.loopiness
        : hasLinearity
          ? Math.max(0, Math.min(1, 1 - (effectiveOpts.linearity as number)))
          : 0.5; // default: moderate loops

    this.visualizer.updateProgress("Starting cave generation", 0);

    do {
      attempts++;
      if (attempts > 250) {
        throw new Error(
          `Cave generation failed after ${attempts} attempts (general cap).`,
        );
      }
      this.visualizer.updateProgress(
        `Generating cave candidate ${attempts}`,
        attempts * 0.1,
      );

      try {
        if (effectiveOpts.giantCentralRoom) {
          await this.generateCaveCandidateWithGiantCenter(
            partialLevel,
            mapWidth,
            mapHeight,
            numRooms,
            branching,
            loopiness,
            effectiveOpts.giantRoomScale ?? 0.65,
            effectiveOpts,
          );
        } else {
          await this.generateCaveCandidate(
            partialLevel,
            mapWidth,
            mapHeight,
            numRooms,
            branching,
            loopiness,
            effectiveOpts,
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("No valid rooms after filtering.")) {
          if (attempts >= 50) {
            throw new Error(
              `Cave generation failed after ${attempts} attempts: ${msg}`,
            );
          }
          console.warn(
            `[generateCavePartitions] Candidate rejected - retrying (attempt=${attempts}): ${msg}`,
          );
          partialLevel.partitions = [];
          validationResult = { isValid: false, errorMessage: msg };
          continue;
        }
        throw e;
      }

      // For xySymmetry layouts the room count is determined by BSP+mirror,
      // not directly by caveRooms. Accept any result with >= 4 partitions.
      const validationRoomTarget =
        effectiveOpts.xySymmetry === true ? 4 : numRooms;
      validationResult = this.validator.validateCavePartitions(
        partialLevel.partitions,
        validationRoomTarget,
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
    opts?: SidePathOptions,
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

    let xySymmetry: {
      xAxisLine: number;
      yAxisLine: number;
      centralRoom: Partition | null;
    } | null = null;
    if (opts?.xySymmetry === true) {
      this.pruneToSpawnQuadrantForXYSymmetry(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        spawn,
        num_rooms,
        opts,
      );
      const sym = this.applyCaveXYSymmetry(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        spawn,
        opts?.xySymmetryCentralRoomSize,
      );
      spawn = sym.spawn;
      xySymmetry = {
        xAxisLine: sym.xAxisLine,
        yAxisLine: sym.yAxisLine,
        centralRoom: sym.centralRoom,
      };
    }

    if (xySymmetry) {
      // If a central room was requested but not placed, reject this candidate
      // so the outer retry loop generates a new one.
      if (
        opts?.xySymmetryCentralRoomSize &&
        opts.xySymmetryCentralRoomSize >= 3 &&
        !xySymmetry.centralRoom
      ) {
        throw new Error("No valid rooms after filtering.");
      }
      this.connectCavePartitionsXYSymmetric(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        spawn,
        xySymmetry.xAxisLine,
        xySymmetry.yAxisLine,
        xySymmetry.centralRoom,
      );
    } else {
      await this.connectCavePartitions(
        partialLevel,
        spawn,
        num_rooms,
        branching,
      );
      await this.addCaveLoops(partialLevel, loopiness);
    }
    await this.calculateDistances(partialLevel, spawn);

    // Castle sidepath: place a boss one room before the furthest room so that the
    // final "exit" room is behind a guarded door (same guarding mechanism as main path).
    this.assignCastleSidepathBoss(partialLevel, spawn, opts?.envType);
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
    opts?: SidePathOptions,
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

    // Optional symmetry pass (will override the giant-center connectivity pattern).
    if (opts?.xySymmetry === true) {
      const symStart =
        partialLevel.partitions.find((p) => p.type === RoomType.ROPECAVE) ??
        center;
      this.pruneToSpawnQuadrantForXYSymmetry(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        symStart,
        num_rooms,
        opts,
      );
      const sym = this.applyCaveXYSymmetry(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        symStart,
        opts?.xySymmetryCentralRoomSize,
      );
      if (
        opts?.xySymmetryCentralRoomSize &&
        opts.xySymmetryCentralRoomSize >= 3 &&
        !sym.centralRoom
      ) {
        throw new Error("No valid rooms after filtering.");
      }
      this.connectCavePartitionsXYSymmetric(
        partialLevel,
        CAVE_OFFSET,
        map_w,
        map_h,
        sym.spawn,
        sym.xAxisLine,
        sym.yAxisLine,
        sym.centralRoom,
      );
    }

    // Add additional connections/loops using existing helpers for some variety.
    // Symmetric layouts intentionally skip random loop-adding to preserve symmetry.
    if (opts?.xySymmetry !== true) {
      await this.addCaveLoops(partialLevel, loopiness);
    }

    // In giant-center mode, the entry can be a peripheral ROPECAVE room; use that as spawn.
    const spawn =
      partialLevel.partitions.find((p) => p.type === RoomType.ROPECAVE) ??
      center;
    // Distances should be measured from the actual entry room so "furthest room"
    // and boss/exit selection are consistent with sidepath flow.
    await this.calculateDistances(partialLevel, spawn);
    this.assignCastleSidepathBoss(partialLevel, spawn, opts?.envType);
  }

  private applyCaveXYSymmetry(
    partialLevel: PartialLevel,
    origin: number,
    map_w: number,
    map_h: number,
    spawn: Partition,
    centralRoomSize?: number,
  ): {
    spawn: Partition;
    xAxisLine: number;
    yAxisLine: number;
    centralRoom: Partition | null;
  } {
    const rawSize =
      centralRoomSize !== undefined && centralRoomSize >= 3
        ? centralRoomSize
        : 0;
    // Central room must be odd-sized for integer-aligned symmetry.
    let roomDim = rawSize > 0 ? rawSize | 1 : 0;
    let halfDim = roomDim > 0 ? Math.floor(roomDim / 2) : 0;
    // Use a soft, small axis-padding hint to avoid very large inter-room voids.
    // The actual central room size is selected later from post-mirror geometry.
    const centralPadding = halfDim > 0 ? Math.min(2, halfDim + 1) : 0;

    const xAxisLine = this.applyCaveAxisSymmetry(
      partialLevel,
      origin,
      map_w,
      map_h,
      "x",
      spawn,
      centralPadding,
    );
    const yAxisLine = this.applyCaveAxisSymmetry(
      partialLevel,
      origin,
      map_w,
      map_h,
      "y",
      spawn,
      centralPadding,
    );

    // Normalize: ensure exactly one ROPECAVE (the spawn).
    for (const p of partialLevel.partitions) {
      if (p !== spawn && p.type === RoomType.ROPECAVE) {
        p.type = RoomType.CAVE;
      }
    }
    spawn.type = RoomType.ROPECAVE;

    // Snapshot geometric gaps around the symmetry axes (post-mirror, pre-center).
    const leftFar = partialLevel.partitions
      .map((p) => p.x + p.w - 1)
      .filter((edge) => edge < xAxisLine)
      .reduce<number | null>(
        (best, v) => (best === null || v > best ? v : best),
        null,
      );
    const rightNear = partialLevel.partitions
      .map((p) => p.x)
      .filter((edge) => edge > xAxisLine)
      .reduce<number | null>(
        (best, v) => (best === null || v < best ? v : best),
        null,
      );
    const topFar = partialLevel.partitions
      .map((p) => p.y + p.h - 1)
      .filter((edge) => edge < yAxisLine)
      .reduce<number | null>(
        (best, v) => (best === null || v > best ? v : best),
        null,
      );
    const bottomNear = partialLevel.partitions
      .map((p) => p.y)
      .filter((edge) => edge > yAxisLine)
      .reduce<number | null>(
        (best, v) => (best === null || v < best ? v : best),
        null,
      );
    const xGap =
      leftFar !== null && rightNear !== null ? rightNear - leftFar - 1 : null;
    const yGap =
      topFar !== null && bottomNear !== null ? bottomNear - topFar - 1 : null;

    // Place a central boss room at the axis intersection if configured.
    let centralRoom: Partition | null = null;
    if (roomDim > 0) {
      const maxHalfX = Math.floor(
        Math.min(xAxisLine - origin, origin + map_w - 1 - xAxisLine),
      );
      const maxHalfY = Math.floor(
        Math.min(yAxisLine - origin, origin + map_h - 1 - yAxisLine),
      );
      const maxHalf = Math.max(0, Math.min(maxHalfX, maxHalfY));
      const maxOddDim = maxHalf > 0 ? 2 * maxHalf + 1 : 0;
      const preferredDim = roomDim > 0 ? roomDim : 9;

      const rangesOverlap = (a0: number, a1: number, b0: number, b1: number) =>
        Math.max(a0, b0) <= Math.min(a1, b1);

      type CentralCandidate = {
        dim: number;
        cx: number;
        cy: number;
        leftCount: number;
        rightCount: number;
        topCount: number;
        bottomCount: number;
      };

      const evaluateAt = (
        dim: number,
        cx: number,
        cy: number,
      ): CentralCandidate | null => {
        if (
          cx < origin ||
          cy < origin ||
          cx + dim > origin + map_w ||
          cy + dim > origin + map_h
        ) {
          return null;
        }

        const central = new Partition(cx, cy, dim, dim, "white");
        const hasOverlap = partialLevel.partitions.some((p) =>
          p.overlaps(central),
        );
        if (hasOverlap) return null;

        const x0 = cx;
        const x1 = cx + dim - 1;
        const y0 = cy;
        const y1 = cy + dim - 1;

        let leftCount = 0;
        let rightCount = 0;
        let topCount = 0;
        let bottomCount = 0;
        for (const p of partialLevel.partitions) {
          const px0 = p.x;
          const px1 = p.x + p.w - 1;
          const py0 = p.y;
          const py1 = p.y + p.h - 1;
          if (cx === px1 + 2 && rangesOverlap(py0, py1, y0, y1)) leftCount++;
          if (p.x === x1 + 2 && rangesOverlap(py0, py1, y0, y1)) rightCount++;
          if (cy === py1 + 2 && rangesOverlap(px0, px1, x0, x1)) topCount++;
          if (p.y === y1 + 2 && rangesOverlap(px0, px1, x0, x1)) bottomCount++;
        }

        return { dim, cx, cy, leftCount, rightCount, topCount, bottomCount };
      };

      // The central room must contain the axis intersection (xAxisLine, yAxisLine).
      // Instead of only centering on the intersection, scan all valid placements
      // within the gap so the room can slide toward nearby partitions for adjacency.
      const cxMin = (dim: number): number =>
        Math.max(origin, xAxisLine - dim + 1);
      const cxMax = (dim: number): number =>
        Math.min(origin + map_w - dim, xAxisLine);
      const cyMin = (dim: number): number =>
        Math.max(origin, yAxisLine - dim + 1);
      const cyMax = (dim: number): number =>
        Math.min(origin + map_h - dim, yAxisLine);

      let best: CentralCandidate | null = null;
      const candidateScore = (c: CentralCandidate): number => {
        const sideCount =
          (c.leftCount > 0 ? 1 : 0) +
          (c.rightCount > 0 ? 1 : 0) +
          (c.topCount > 0 ? 1 : 0) +
          (c.bottomCount > 0 ? 1 : 0);
        const hasHorizontal = c.leftCount > 0 && c.rightCount > 0;
        const hasVertical = c.topCount > 0 && c.bottomCount > 0;
        const fullAxisConnectivity = hasHorizontal && hasVertical;
        const axisPairCount = (hasHorizontal ? 1 : 0) + (hasVertical ? 1 : 0);
        const distPenalty = Math.abs(c.dim - preferredDim);
        return (
          (fullAxisConnectivity ? 100000 : 0) +
          axisPairCount * 10000 +
          sideCount * 1000 -
          distPenalty * 10 +
          c.dim
        );
      };
      for (let dim = maxOddDim; dim >= 3; dim -= 2) {
        // Build a focused set of X/Y positions to check: the edges of each
        // existing partition that are within the gap dictate the only coordinates
        // where a BSP +2 adjacency can form.
        const xPositions = new Set<number>();
        const yPositions = new Set<number>();
        const lo = cxMin(dim);
        const hi = cxMax(dim);
        const tlo = cyMin(dim);
        const thi = cyMax(dim);
        for (const p of partialLevel.partitions) {
          // cx that would make left edge adjacent to p's right edge: cx = (p.x+p.w-1) + 2
          const cxFromLeft = p.x + p.w + 1;
          if (cxFromLeft >= lo && cxFromLeft <= hi) xPositions.add(cxFromLeft);
          // cx that would make right edge adjacent to p's left edge: cx+dim-1+2 = p.x → cx = p.x-dim-1
          const cxFromRight = p.x - dim - 1;
          if (cxFromRight >= lo && cxFromRight <= hi)
            xPositions.add(cxFromRight);
          // cy that would make top edge adjacent to p's bottom edge: cy = (p.y+p.h-1) + 2
          const cyFromTop = p.y + p.h + 1;
          if (cyFromTop >= tlo && cyFromTop <= thi) yPositions.add(cyFromTop);
          // cy that would make bottom edge adjacent to p's top edge: cy+dim-1+2 = p.y → cy = p.y-dim-1
          const cyFromBottom = p.y - dim - 1;
          if (cyFromBottom >= tlo && cyFromBottom <= thi)
            yPositions.add(cyFromBottom);
        }
        // Always include the axis-centered position as a fallback.
        const half = Math.floor(dim / 2);
        const centeredCx = xAxisLine - half;
        const centeredCy = yAxisLine - half;
        if (centeredCx >= lo && centeredCx <= hi) xPositions.add(centeredCx);
        if (centeredCy >= tlo && centeredCy <= thi) yPositions.add(centeredCy);

        for (const cx of xPositions) {
          for (const cy of yPositions) {
            const candidate = evaluateAt(dim, cx, cy);
            if (!candidate) continue;
            if (!best || candidateScore(candidate) > candidateScore(best)) {
              best = candidate;
            }
          }
        }
      }

      if (best) {
        const central = new Partition(
          best.cx,
          best.cy,
          best.dim,
          best.dim,
          "white",
        );
        central.type = RoomType.BOSS;
        central.fillStyle = "red";
        central.connections = [];
        central.distance = 1000;
        partialLevel.partitions.push(central);
        centralRoom = central;
        console.log(
          `[xySymmetry] Added central boss room at (${best.cx},${best.cy},${best.dim},${best.dim}) neighbors L=${best.leftCount} R=${best.rightCount} T=${best.topCount} B=${best.bottomCount} gaps x=${xGap ?? "n/a"} y=${yGap ?? "n/a"}`,
        );
      } else {
        console.warn(
          `[xySymmetry] Could not place central room at axis intersection with valid adjacency; skipping (gaps x=${xGap ?? "n/a"} y=${yGap ?? "n/a"})`,
        );
      }
    }

    // ---- Post-mirror symmetry verification ----
    this.verifyXYSymmetry(partialLevel, xAxisLine, yAxisLine, centralRoom);

    return { spawn, xAxisLine, yAxisLine, centralRoom };
  }

  private verifyXYSymmetry(
    partialLevel: PartialLevel,
    xAxisLine: number,
    yAxisLine: number,
    centralRoom: Partition | null,
  ): void {
    const keyOf = (x: number, y: number, w: number, h: number) =>
      `${x},${y},${w},${h}`;
    const existing = new Set(
      partialLevel.partitions.map((p) => keyOf(p.x, p.y, p.w, p.h)),
    );

    let xFails = 0;
    let yFails = 0;
    let xyFails = 0;
    for (const p of partialLevel.partitions) {
      if (p === centralRoom) continue;
      const mx = 2 * xAxisLine - (p.x + p.w - 1);
      const my = 2 * yAxisLine - (p.y + p.h - 1);
      if (!existing.has(keyOf(mx, p.y, p.w, p.h))) xFails++;
      if (!existing.has(keyOf(p.x, my, p.w, p.h))) yFails++;
      if (!existing.has(keyOf(mx, my, p.w, p.h))) xyFails++;
    }
    if (xFails + yFails + xyFails > 0) {
      console.warn(
        `[xySymmetry] VERIFY: xMirrorMissing=${xFails} yMirrorMissing=${yFails} xyMirrorMissing=${xyFails} total=${partialLevel.partitions.length} axes=(${xAxisLine},${yAxisLine})`,
      );
    } else {
      console.log(
        `[xySymmetry] VERIFY: perfect symmetry confirmed (${partialLevel.partitions.length} partitions, axes=${xAxisLine},${yAxisLine})`,
      );
    }
  }

  private pruneToSpawnQuadrantForXYSymmetry(
    partialLevel: PartialLevel,
    origin: number,
    map_w: number,
    map_h: number,
    spawn: Partition,
    desiredTotalRooms: number,
    opts?: SidePathOptions,
  ): void {
    const parts = partialLevel.partitions;
    if (!parts || parts.length === 0) return;

    const midX = (p: Partition): number => p.x + (p.w - 1) / 2;
    const midY = (p: Partition): number => p.y + (p.h - 1) / 2;
    const centerX = origin + (map_w - 1) / 2;
    const centerY = origin + (map_h - 1) / 2;

    const spawnOnLeft = midX(spawn) < centerX;
    const spawnOnTop = midY(spawn) < centerY;

    const inSpawnQuadrant = (p: Partition): boolean => {
      const left = midX(p) < centerX;
      const top = midY(p) < centerY;
      return left === spawnOnLeft && top === spawnOnTop;
    };

    const quadrant = parts.filter(inSpawnQuadrant);
    if (!quadrant.includes(spawn)) quadrant.unshift(spawn);

    // Pick extra partitions per quadrant to compensate for mirrors that may
    // go out of bounds when central room padding pushes the axis line outward.
    const centralRoomConfigured =
      typeof opts?.xySymmetryCentralRoomSize === "number" &&
      opts.xySymmetryCentralRoomSize >= 3;
    const mirrorLossBuffer = centralRoomConfigured ? 2 : 0;
    const desiredQuadrant = Math.max(
      2,
      Math.ceil(desiredTotalRooms / 4) + mirrorLossBuffer,
    );

    // ---- Shape controls (hollow center / plus-shape preference) ----
    const defaultVoid = Math.max(2, Math.floor(Math.min(map_w, map_h) * 0.12));
    const defaultArm = Math.max(1, Math.floor(Math.min(map_w, map_h) * 0.04));
    const voidHalfSize =
      typeof opts?.xySymmetryCenterVoidHalfSize === "number"
        ? Math.floor(opts.xySymmetryCenterVoidHalfSize)
        : defaultVoid;
    const armHalfThickness =
      typeof opts?.xySymmetryArmHalfThickness === "number"
        ? Math.floor(opts.xySymmetryArmHalfThickness)
        : defaultArm;

    const distToAxis = (p: Partition, axis: "x" | "y", c: number): number => {
      if (axis === "x") {
        const x0 = p.x;
        const x1 = p.x + p.w - 1;
        if (x0 <= c && c <= x1) return 0;
        return Math.min(Math.abs(x0 - c), Math.abs(x1 - c));
      }
      const y0 = p.y;
      const y1 = p.y + p.h - 1;
      if (y0 <= c && c <= y1) return 0;
      return Math.min(Math.abs(y0 - c), Math.abs(y1 - c));
    };

    const sx = midX(spawn);
    const sy = midY(spawn);
    const distToSpawn = (p: Partition): number =>
      Math.abs(midX(p) - sx) + Math.abs(midY(p) - sy);

    const inArmX = (p: Partition): boolean =>
      distToAxis(p, "x", centerX) <= armHalfThickness;
    const inArmY = (p: Partition): boolean =>
      distToAxis(p, "y", centerY) <= armHalfThickness;

    const rangesOverlap = (a0: number, a1: number, b0: number, b1: number) =>
      Math.max(a0, b0) <= Math.min(a1, b1);
    const canPotentiallyConnect = (a: Partition, b: Partition): boolean => {
      const ax1 = a.x + a.w - 1;
      const ay1 = a.y + a.h - 1;
      const bx1 = b.x + b.w - 1;
      const by1 = b.y + b.h - 1;
      const horizGap = b.x === ax1 + 2 || a.x === bx1 + 2;
      const vertGap = b.y === ay1 + 2 || a.y === by1 + 2;
      const overlapY = rangesOverlap(a.y, ay1, b.y, by1);
      const overlapX = rangesOverlap(a.x, ax1, b.x, bx1);
      return (horizGap && overlapY) || (vertGap && overlapX);
    };

    const score = (p: Partition): number => {
      if (p === spawn) return Number.POSITIVE_INFINITY;
      const ax = inArmX(p);
      const ay = inArmY(p);
      const armReward = ax !== ay ? 200 : ax && ay ? -250 : 0;
      const dx = distToAxis(p, "x", centerX);
      const dy = distToAxis(p, "y", centerY);
      const centerPenalty =
        dx <= voidHalfSize + 2 && dy <= voidHalfSize + 2 ? 120 : 0;
      return -distToSpawn(p) + armReward - centerPenalty;
    };

    // Build BSP-adjacency graph within the quadrant.
    const adjMap = new Map<Partition, Partition[]>();
    for (const p of quadrant) adjMap.set(p, []);
    for (let i = 0; i < quadrant.length; i++) {
      for (let j = i + 1; j < quadrant.length; j++) {
        if (canPotentiallyConnect(quadrant[i], quadrant[j])) {
          adjMap.get(quadrant[i])!.push(quadrant[j]);
          adjMap.get(quadrant[j])!.push(quadrant[i]);
        }
      }
    }

    // BFS flood-fill from spawn, always expanding to the highest-scored
    // BSP-adjacent neighbor first. This guarantees the picked set is a
    // connected subgraph that connectCavePartitions can always wire up.
    const picked = new Set<Partition>([spawn]);
    const frontier = new Set<Partition>();
    for (const n of adjMap.get(spawn) ?? []) frontier.add(n);

    while (picked.size < desiredQuadrant && frontier.size > 0) {
      let best: Partition | null = null;
      let bestScore = -Infinity;
      for (const p of frontier) {
        const s = score(p);
        if (s > bestScore) {
          bestScore = s;
          best = p;
        }
      }
      if (!best) break;
      frontier.delete(best);
      picked.add(best);
      for (const n of adjMap.get(best) ?? []) {
        if (!picked.has(n)) frontier.add(n);
      }
    }

    for (const p of picked) {
      if (p !== spawn) p.type = RoomType.CAVE;
      p.connections = [];
      p.distance = 1000;
    }
    spawn.type = RoomType.ROPECAVE;

    console.log(
      `[xySymmetry] prune quadrant: totalBefore=${parts.length} quadrantSize=${quadrant.length} picked=${picked.size} desiredQuadrant=${desiredQuadrant}`,
    );

    partialLevel.partitions = Array.from(picked);
  }

  private applyCaveAxisSymmetry(
    partialLevel: PartialLevel,
    origin: number,
    map_w: number,
    map_h: number,
    axis: "x" | "y",
    spawn: Partition,
    centralPadding: number = 0,
  ): number {
    const parts = partialLevel.partitions;
    if (!parts || parts.length === 0) return 0;

    const maxX = origin + map_w - 1;
    const maxY = origin + map_h - 1;

    const center =
      axis === "x" ? origin + (map_w - 1) / 2 : origin + (map_h - 1) / 2;
    const spawnMid =
      axis === "x" ? spawn.x + (spawn.w - 1) / 2 : spawn.y + (spawn.h - 1) / 2;
    const spawnIsLowSide = spawnMid < center;

    // Choose an axis line that guarantees mirrors stay in-bounds.
    // Keep the full candidate set whenever possible; if requested central padding
    // is too large, clamp it down instead of dropping partitions.
    const maxCoord = axis === "x" ? maxX : maxY;
    const start = (p: Partition): number => (axis === "x" ? p.x : p.y);
    const far = (p: Partition): number =>
      axis === "x" ? p.x + p.w - 1 : p.y + p.h - 1;
    const extent = (p: Partition): number =>
      axis === "x" ? p.x + p.w : p.y + p.h;
    const clamp = (v: number, lo: number, hi: number): number =>
      Math.max(lo, Math.min(hi, v));

    let axisLine: number;
    const candidate = parts.slice();

    if (spawnIsLowSide) {
      const minStart = Math.min(...candidate.map(start));
      const maxExtent = Math.max(...candidate.map(extent));
      const axisMaxBound = Math.floor((maxCoord + minStart) / 2);
      const paddedMinAxis = maxExtent + Math.max(0, centralPadding);
      const axisMinBound = Math.min(paddedMinAxis, axisMaxBound);
      // Pick the nearest feasible axis to the kept set to maximize overlap and
      // avoid oversized center voids caused by center-biased axis choices.
      axisLine = axisMinBound;
      console.log(
        `[xySymmetry] axis=${axis} lowSide bounds=[${axisMinBound},${axisMaxBound}] chosen=${axisLine} center=${Math.floor(center)} pad=${centralPadding}`,
      );
    } else {
      const maxFar = Math.max(...candidate.map(far));
      const minStart = Math.min(...candidate.map(start));
      const axisMinBound = Math.ceil((origin + maxFar) / 2);
      const paddedMaxAxis = minStart - 1 - Math.max(0, centralPadding);
      const axisMaxBound = Math.max(paddedMaxAxis, axisMinBound);
      // Symmetric counterpart of low-side behavior: keep axis as close as possible
      // to the source set (from the high side) to maximize overlap.
      axisLine = axisMaxBound;
      console.log(
        `[xySymmetry] axis=${axis} highSide bounds=[${axisMinBound},${axisMaxBound}] chosen=${axisLine} center=${Math.floor(center)} pad=${centralPadding}`,
      );
    }

    // Exclude partitions that cross or touch the axis line — they can't
    // mirror cleanly and produce overlaps that break symmetry.
    const kept = spawnIsLowSide
      ? candidate.filter((p) => far(p) < axisLine || p === spawn)
      : candidate.filter((p) => start(p) > axisLine || p === spawn);

    if (!kept.includes(spawn)) {
      console.warn(
        `[xySymmetry] axis=${axis} bail: spawn not kept (kept=${kept.length}) axisLine=${axisLine}`,
      );
      return axisLine;
    }

    const next: Partition[] = [];
    for (const p of kept) {
      p.connections = [];
      p.distance = 1000;
      next.push(p);
    }

    const mirrorOne = (p: Partition): Partition | null => {
      if (axis === "x") {
        const newX = 2 * axisLine - (p.x + p.w - 1);
        if (newX < origin || newX + p.w - 1 > maxX) return null;
        const m = new Partition(newX, p.y, p.w, p.h, p.fillStyle);
        m.type = p.type === RoomType.ROPECAVE ? RoomType.CAVE : p.type;
        m.fillStyle = p.fillStyle;
        return m;
      } else {
        const newY = 2 * axisLine - (p.y + p.h - 1);
        if (newY < origin || newY + p.h - 1 > maxY) return null;
        const m = new Partition(p.x, newY, p.w, p.h, p.fillStyle);
        m.type = p.type === RoomType.ROPECAVE ? RoomType.CAVE : p.type;
        m.fillStyle = p.fillStyle;
        return m;
      }
    };

    let mirrorNull = 0;
    let mirrorDup = 0;
    let mirrorOverlap = 0;
    for (const p of kept) {
      const m = mirrorOne(p);
      if (!m) {
        mirrorNull++;
        continue;
      }
      if (m.x === p.x && m.y === p.y && m.w === p.w && m.h === p.h) {
        mirrorDup++;
        continue;
      }
      if (next.some((o) => o.overlaps(m))) {
        mirrorOverlap++;
        continue;
      }
      next.push(m);
    }

    // Symmetry verification: every kept partition must have produced a
    // valid mirror (not null/dup/overlap). If not, the result is asymmetric.
    if (mirrorNull + mirrorOverlap > 0) {
      console.warn(
        `[xySymmetry] axis=${axis} ASYMMETRIC: null=${mirrorNull} overlap=${mirrorOverlap} — dropping offending source partitions`,
      );
      // Rebuild: only keep source partitions whose mirrors were successfully added.
      const mirroredSet = new Set<string>();
      for (const p of next) {
        if (!kept.includes(p)) {
          mirroredSet.add(`${p.x},${p.y},${p.w},${p.h}`);
        }
      }
      const cleanKept: Partition[] = [];
      const cleanNext: Partition[] = [];
      for (const p of kept) {
        const m = mirrorOne(p);
        if (!m) continue;
        const mKey = `${m.x},${m.y},${m.w},${m.h}`;
        const isDup = m.x === p.x && m.y === p.y && m.w === p.w && m.h === p.h;
        if (isDup || mirroredSet.has(mKey)) {
          cleanKept.push(p);
          if (!isDup) cleanNext.push(p);
          else cleanNext.push(p);
        }
      }
      // Rebuild from scratch with only clean pairs.
      next.length = 0;
      for (const p of kept) {
        const m = mirrorOne(p);
        if (!m) {
          if (p === spawn) next.push(p);
          continue;
        }
        const isDup = m.x === p.x && m.y === p.y && m.w === p.w && m.h === p.h;
        if (isDup) {
          next.push(p);
          continue;
        }
        if (!next.some((o) => o.overlaps(p))) next.push(p);
        if (!next.some((o) => o.overlaps(m))) next.push(m);
      }
    }

    partialLevel.partitions = next;
    console.log(
      `[xySymmetry] axis=${axis} axisLine=${axisLine} kept=${kept.length} mirroredAdded=${next.length - kept.length} totalAfter=${next.length}`,
    );
    if (mirrorNull + mirrorDup + mirrorOverlap > 0) {
      console.log(
        `[xySymmetry] axis=${axis} mirrorStats null=${mirrorNull} dup=${mirrorDup} overlap=${mirrorOverlap}`,
      );
    }
    return axisLine;
  }

  private assignCastleSidepathBoss(
    partialLevel: PartialLevel,
    spawn: Partition,
    envType: EnvType | undefined,
  ): void {
    if (envType !== EnvType.CASTLE) return;
    if (!spawn) return;

    // If a central BOSS room was already placed by the symmetry pass, pick
    // the best exit room from its connections (farthest from spawn on the
    // perimeter) and mark it.
    const prePlacedBoss = partialLevel.partitions.find(
      (p) => p.type === RoomType.BOSS,
    );
    if (prePlacedBoss) {
      const neighbors = prePlacedBoss.connections
        .map((c) => c.other)
        .filter(
          (p) =>
            p &&
            p !== spawn &&
            p.type !== RoomType.ROPECAVE &&
            Number.isFinite(p.distance),
        );
      if (neighbors.length === 0) return;
      let exit = neighbors[0];
      for (let i = 1; i < neighbors.length; i++) {
        if (neighbors[i].distance > exit.distance) exit = neighbors[i];
      }
      exit.type = RoomType.CAVE;
      this.constrainCastleExitToBoss(exit, prePlacedBoss);
      return;
    }

    // Fallback: no pre-placed boss. Use distance-based heuristic.
    let exit: Partition | null = null;
    let maxDist = -Infinity;
    for (const p of partialLevel.partitions) {
      if (!p || p === spawn) continue;
      const d = p.distance;
      if (d === null || d === undefined) continue;
      if (!Number.isFinite(d)) continue;
      if (d > maxDist) {
        maxDist = d;
        exit = p;
      }
    }
    if (!exit || !Number.isFinite(exit.distance)) return;
    if (exit.distance < 2) return;

    const desiredBossDist = exit.distance - 1;
    const candidates = exit.connections
      .map((c) => c.other)
      .filter((p) => p && p.distance === desiredBossDist && p !== spawn);
    if (candidates.length === 0) return;

    let boss = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (candidates[i].area() > boss.area()) boss = candidates[i];
    }

    boss.type = RoomType.BOSS;
    boss.fillStyle = "red";
    if (exit.type !== RoomType.ROPECAVE) {
      exit.type = RoomType.CAVE;
    }
    this.constrainCastleExitToBoss(exit, boss);
  }

  /**
   * Castle rule: the selected exit room must only connect to the boss room.
   * Keep all other boss connections untouched so main traversal still reaches boss.
   */
  private constrainCastleExitToBoss(exit: Partition, boss: Partition): void {
    const edgeFromExit = exit.connections.find((c) => c.other === boss) ?? null;
    const edgeFromBoss = boss.connections.find((c) => c.other === exit) ?? null;
    const doorX = edgeFromExit?.x ?? edgeFromBoss?.x;
    const doorY = edgeFromExit?.y ?? edgeFromBoss?.y;
    if (doorX === undefined || doorY === undefined) return;

    // Remove reciprocal links from all non-boss neighbors of exit.
    for (const c of exit.connections) {
      if (c.other === boss) continue;
      c.other.connections = c.other.connections.filter(
        (oc) => oc.other !== exit,
      );
    }

    // Exit keeps exactly one edge: to boss.
    exit.connections = [new PartitionConnection(doorX, doorY, boss)];

    // Boss may keep many edges, but ensure exactly one edge back to exit.
    const bossWithoutExit = boss.connections.filter((c) => c.other !== exit);
    boss.connections = [
      ...bossWithoutExit,
      new PartitionConnection(doorX, doorY, exit),
    ];
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

  private connectCavePartitionsXYSymmetric(
    partialLevel: PartialLevel,
    origin: number,
    map_w: number,
    map_h: number,
    spawn: Partition,
    xAxisLine: number,
    yAxisLine: number,
    centralRoom: Partition | null,
  ): void {
    const parts = partialLevel.partitions;
    if (!parts || parts.length === 0) return;

    // Reset connections so the result is purely symmetric/deterministic.
    for (const p of parts) p.connections = [];

    const keyOf = (p: Partition): string => `${p.x},${p.y},${p.w},${p.h}`;
    const byKey = new Map<string, Partition>();
    for (const p of parts) byKey.set(keyOf(p), p);

    const rangesOverlap = (a0: number, a1: number, b0: number, b1: number) =>
      Math.max(a0, b0) <= Math.min(a1, b1);

    const doorBetween = (
      a: Partition,
      b: Partition,
    ): { x: number; y: number } | null => {
      const ax1 = a.x + a.w - 1;
      const ay1 = a.y + a.h - 1;
      const bx1 = b.x + b.w - 1;
      const by1 = b.y + b.h - 1;

      // b is to the right of a (1-tile BSP gap)
      if (b.x === ax1 + 2 && rangesOverlap(a.y, ay1, b.y, by1)) {
        const y0 = Math.max(a.y, b.y);
        const y1 = Math.min(ay1, by1);
        return { x: ax1 + 1, y: Math.floor((y0 + y1) / 2) };
      }
      // b is to the left of a
      if (a.x === bx1 + 2 && rangesOverlap(a.y, ay1, b.y, by1)) {
        const y0 = Math.max(a.y, b.y);
        const y1 = Math.min(ay1, by1);
        return { x: bx1 + 1, y: Math.floor((y0 + y1) / 2) };
      }
      // b is below a
      if (b.y === ay1 + 2 && rangesOverlap(a.x, ax1, b.x, bx1)) {
        const x0 = Math.max(a.x, b.x);
        const x1 = Math.min(ax1, bx1);
        return { x: Math.floor((x0 + x1) / 2), y: ay1 + 1 };
      }
      // b is above a
      if (a.y === by1 + 2 && rangesOverlap(a.x, ax1, b.x, bx1)) {
        const x0 = Math.max(a.x, b.x);
        const x1 = Math.min(ax1, bx1);
        return { x: Math.floor((x0 + x1) / 2), y: by1 + 1 };
      }

      return null;
    };

    const addConn = (a: Partition, b: Partition, x: number, y: number) => {
      const already =
        a.connections.some((c) => c.other === b && c.x === x && c.y === y) ||
        b.connections.some((c) => c.other === a && c.x === x && c.y === y);
      if (already) return;
      const ab = new PartitionConnection(x, y, b);
      const ba = new PartitionConnection(x, y, a);
      a.connections.push(ab);
      b.connections.push(ba);
      a.setOpenWall(ab);
      b.setOpenWall(ba);
    };

    // ---- Build a deterministic tree inside the spawn quadrant ----
    const midX = (p: Partition): number => p.x + (p.w - 1) / 2;
    const midY = (p: Partition): number => p.y + (p.h - 1) / 2;
    const spawnOnLeft = midX(spawn) < xAxisLine;
    const spawnOnTop = midY(spawn) < yAxisLine;
    const inSpawnQuadrant = (p: Partition): boolean => {
      const left = midX(p) < xAxisLine;
      const top = midY(p) < yAxisLine;
      return left === spawnOnLeft && top === spawnOnTop;
    };

    const base = parts.filter(inSpawnQuadrant);
    if (!base.includes(spawn)) base.push(spawn);
    base.sort((a, b) => {
      const ka = keyOf(a);
      const kb = keyOf(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    type BaseEdge = {
      a: Partition;
      b: Partition;
      pt: { x: number; y: number };
    };
    const baseEdges: BaseEdge[] = [];

    const visited = new Set<Partition>([spawn]);
    const queue: Partition[] = [spawn];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (!cur) break;
      for (const n of base) {
        if (visited.has(n) || n === cur) continue;
        const pt = doorBetween(cur, n);
        if (!pt) continue;
        visited.add(n);
        queue.push(n);
        baseEdges.push({ a: cur, b: n, pt });
      }
    }

    // If the quadrant set isn't fully connected under the doorBetween predicate,
    // connect remaining partitions by any available BSP-adjacent edge.
    while (visited.size < base.length) {
      let bridged = false;
      for (const a of base) {
        if (!visited.has(a)) continue;
        for (const b of base) {
          if (visited.has(b) || a === b) continue;
          const pt = doorBetween(a, b);
          if (!pt) continue;
          visited.add(b);
          queue.push(b);
          baseEdges.push({ a, b, pt });
          bridged = true;
          break;
        }
        if (bridged) break;
      }
      if (!bridged) break;
    }

    const transformPartition = (
      p: Partition,
      mirrorX: boolean,
      mirrorY: boolean,
    ): Partition | null => {
      const x = mirrorX ? 2 * xAxisLine - (p.x + p.w - 1) : p.x;
      const y = mirrorY ? 2 * yAxisLine - (p.y + p.h - 1) : p.y;
      return byKey.get(`${x},${y},${p.w},${p.h}`) ?? null;
    };

    const transformPoint = (
      pt: { x: number; y: number },
      mirrorX: boolean,
      mirrorY: boolean,
    ): { x: number; y: number } => {
      const x = mirrorX ? 2 * xAxisLine - pt.x : pt.x;
      const y = mirrorY ? 2 * yAxisLine - pt.y : pt.y;
      return { x, y };
    };

    for (const e of baseEdges) {
      for (const mx of [false, true]) {
        for (const my of [false, true]) {
          const aT = transformPartition(e.a, mx, my);
          const bT = transformPartition(e.b, mx, my);
          if (!aT || !bT) continue;
          const pt = transformPoint(e.pt, mx, my);
          addConn(aT, bT, pt.x, pt.y);
        }
      }
    }

    // Bridge across symmetry axes when rooms are BSP-adjacent to their mirror.
    // This is essential when no central room is present (centralPadding=0),
    // otherwise the layout would be four disconnected quadrants.
    for (const p of parts) {
      const mx = transformPartition(p, true, false);
      if (mx && mx !== p) {
        const pt = doorBetween(p, mx);
        if (pt) addConn(p, mx, pt.x, pt.y);
      }
      const my = transformPartition(p, false, true);
      if (my && my !== p) {
        const pt = doorBetween(p, my);
        if (pt) addConn(p, my, pt.x, pt.y);
      }
    }

    // Ensure the central room (if any) is connected. It is a fixed point of the symmetry,
    // so connecting it to all BSP-adjacent neighbors preserves symmetry.
    if (centralRoom) {
      for (const p of parts) {
        if (p === centralRoom) continue;
        const pt = doorBetween(centralRoom, p);
        if (!pt) continue;
        addConn(centralRoom, p, pt.x, pt.y);
      }
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
