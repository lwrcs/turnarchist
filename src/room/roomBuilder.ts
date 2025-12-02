import { Game } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import { Floor } from "../tile/floor";
import { Wall } from "../tile/wall";
import { Random } from "../utility/random";
import { Room, WallDirection } from "./room";

export class RoomBuilder {
  room: Room;
  constructor(room: Room) {
    this.room = room;
    this.buildEmptyRoom();
  }

  private buildEmptyRoom() {
    // fill in wall and floor
    for (let x = this.room.roomX; x < this.room.roomX + this.room.width; x++) {
      for (
        let y = this.room.roomY;
        y < this.room.roomY + this.room.height;
        y++
      ) {
        if (
          this.room.pointInside(
            x,
            y,
            this.room.roomX + 1,
            this.room.roomY + 1,
            this.room.width - 2,
            this.room.height - 2,
          )
        ) {
          this.room.roomArray[x][y] = new Floor(this.room, x, y);
        } else {
          this.room.roomArray[x][y] = new Wall(
            this.room,
            x,
            y,
            this.getWallType(
              x,
              y,
              this.room.roomX,
              this.room.roomY,
              this.room.width,
              this.room.height,
            ),
          );
        }
      }
    }
  }

  getWallType = (
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
  ): Array<WallDirection> => {
    let directions: Array<WallDirection> = [];
    if (pointY === rectY && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.NORTH);
    if (pointY === rectY + height && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.SOUTH);
    if (pointX === rectX && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.WEST);
    if (pointX === rectX + width && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.EAST);
    return directions;
  };

  addWallBlocks(rand: () => number) {
    this.addWallBlocksStandard(rand);
  }

  private countWallNeighbors = (wall: Wall): number => {
    let count = 0;
    for (let xx = wall.x - 1; xx <= wall.x + 1; xx++) {
      for (let yy = wall.y - 1; yy <= wall.y + 1; yy++) {
        if (
          this.room.roomArray[xx]?.[yy] instanceof Wall &&
          !(xx === wall.x && yy === wall.y)
        )
          count++;
      }
    }
    return count;
  };

  // Original behavior moved here; used by addWallBlocks
  addWallBlocksStandard(rand: () => number) {
    let numBlocks = Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
    if (this.room.width > 8 && rand() > 0.5) numBlocks *= 4;
    for (let i = 0; i < numBlocks; i++) {
      let blockW = Math.min(
        Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand),
        this.room.width - 4,
      );
      let blockH = Math.min(
        blockW + Game.rand(-2, 2, rand),
        this.room.height - 4,
      );

      let x = Game.rand(
        this.room.roomX + 2,
        this.room.roomX + this.room.width - blockW - 2,
        rand,
      );
      let y = Game.rand(
        this.room.roomY + 2,
        this.room.roomY + this.room.height - blockH - 2,
        rand,
      );

      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          let w = new Wall(this.room, xx, yy);
          this.room.roomArray[xx][yy] = w;
          this.room.innerWalls.push(w);
        }
      }
      this.room.innerWalls.forEach((wall) => {
        if (this.countWallNeighbors(wall) <= 1) {
          this.room.removeWall(wall.x, wall.y);
          this.room.roomArray[wall.x][wall.y] = new Floor(
            this.room,
            wall.x,
            wall.y,
          );
          this.room.innerWalls = this.room.innerWalls.filter((w) => w !== wall);
        }
      });
    }
  }

  // Variation: creates smaller, jagged clusters with carved gaps; same placement constraints
  addWallBlocksVariant(rand: () => number) {
    let numBlocks = Game.randTable([2, 2, 3, 3, 4, 5], rand);
    if (this.room.width > 10 && rand() > 0.5) numBlocks += 2;
    for (let i = 0; i < numBlocks; i++) {
      // Favor smaller widths/heights to form jagged shapes
      let baseW = Game.randTable([1, 2, 2, 2, 3, 3], rand);
      let blockW = Math.min(Math.max(1, baseW), this.room.width - 4);
      let blockH = Math.min(
        Math.max(1, baseW + Game.rand(-1, 1, rand)),
        this.room.height - 4,
      );

      let x = Game.rand(
        this.room.roomX + 2,
        this.room.roomX + this.room.width - blockW - 2,
        rand,
      );
      let y = Game.rand(
        this.room.roomY + 2,
        this.room.roomY + this.room.height - blockH - 2,
        rand,
      );

      // Place a ragged block by skipping some interior cells randomly
      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          // Keep edges of the block more solid, randomize interior
          const isEdge =
            xx === x ||
            yy === y ||
            xx === x + blockW - 1 ||
            yy === y + blockH - 1;
          if (isEdge || rand() > 0.35) {
            let w = new Wall(this.room, xx, yy);
            this.room.roomArray[xx][yy] = w;
            this.room.innerWalls.push(w);
          }
        }
      }

      // Carve 1-2 holes to ensure flow through clusters
      const holes = Game.randTable([0, 1, 1, 2], rand);
      for (let h = 0; h < holes; h++) {
        const hx = Game.rand(x + 1, Math.max(x + 1, x + blockW - 2), rand);
        const hy = Game.rand(y + 1, Math.max(y + 1, y + blockH - 2), rand);
        if (this.room.roomArray[hx]?.[hy] instanceof Wall) {
          this.room.removeWall(hx, hy);
          this.room.roomArray[hx][hy] = new Floor(this.room, hx, hy);
          this.room.innerWalls = this.room.innerWalls.filter(
            (w) => !(w.x === hx && w.y === hy),
          );
        }
      }

      // Prune more aggressively to avoid single spurs and self-locking
      this.room.innerWalls.forEach((wall) => {
        if (this.countWallNeighbors(wall) <= 2) {
          this.room.removeWall(wall.x, wall.y);
          this.room.roomArray[wall.x][wall.y] = new Floor(
            this.room,
            wall.x,
            wall.y,
          );
          this.room.innerWalls = this.room.innerWalls.filter((w) => w !== wall);
        }
      });
    }
  }

  // --- Organic tunnels variant ---
  // Fills interior with walls, then carves organic tunnels that connect all doors,
  // with variable-width passages and pockets.
  addWallBlocksOrganicTunnels(rand: () => number) {
    const debug = GameplaySettings.ORGANIC_TUNNELS_DEBUG === true;
    if (debug)
      console.log("[OrganicTunnels] start", { room: this.room.globalId });
    // Step 1: fill interior with walls we can carve from
    this.fillInteriorWithWalls();

    // Step 2: compute entry points just inside each door
    const entries = this.getDoorEntryPoints(rand);
    if (debug) console.log("[OrganicTunnels] entries", entries);
    if (entries.length === 0) return; // nothing to connect

    const usePerimeterRouting =
      this.room.level?.organicTunnelsAvoidCenter === true;

    if (entries.length === 1) {
      // Single-door room: carve a few meandering pockets from the entry
      const origin = entries[0];
      const targets = this.generatePocketTargets(origin, 4, rand);
      for (const t of targets) {
        this.carveOrganicPath(origin.x, origin.y, t.x, t.y, rand, {
          baseRadius: 1.2,
          radiusJitter: 1.0,
          pocketChance: 0.25,
          pocketRadius: [2, 3],
        });
      }
      return;
    }

    if (usePerimeterRouting) {
      if (debug) console.log("[OrganicTunnels] perimeter routing enabled");
      this.buildPerimeterBiasedNetwork(entries, rand);
    } else {
      // Step 3: create central spoof hubs and connect entries to hubs, hubs to each other
      const hubs = this.getCenterSpoofEntries(rand, [1, 2]);
      if (debug) console.log("[OrganicTunnels] hubs", hubs);

      if (hubs.length === 0) {
        // Fallback: single hub at true center
        const cx = Math.floor(this.room.roomX + this.room.width / 2);
        const cy = Math.floor(this.room.roomY + this.room.height / 2);
        if (this.isInterior(cx, cy)) hubs.push({ x: cx, y: cy });
      }

      // Connect every door entry to its nearest hub
      for (const entry of entries) {
        let bestHub = hubs[0];
        let bestD = this.distance(entry, bestHub);
        for (let i = 1; i < hubs.length; i++) {
          const d = this.distance(entry, hubs[i]);
          if (d < bestD) {
            bestD = d;
            bestHub = hubs[i];
          }
        }
        this.carveOrganicPath(entry.x, entry.y, bestHub.x, bestHub.y, rand, {
          baseRadius: 1.3,
          radiusJitter: 1.2,
          pocketChance: 0.2,
          pocketRadius: [2, 4],
        });
      }

      // Connect hubs together (MST across hubs)
      if (hubs.length > 1) {
        const hubEdges = this.minimumSpanningEdges(hubs);
        if (debug) console.log("[OrganicTunnels] hub edges", hubEdges);
        for (const e of hubEdges) {
          this.carveOrganicPath(e.a.x, e.a.y, e.b.x, e.b.y, rand, {
            baseRadius: 1.4,
            radiusJitter: 1.1,
            pocketChance: 0.25,
            pocketRadius: [2, 5],
          });
        }
      }
    }

    // Step 4: optional extra pockets along the network
    const extraPockets = Game.randTable([0, 0, 1, 2], rand);
    for (let i = 0; i < extraPockets; i++) {
      const pivot = entries[Game.rand(0, entries.length - 1, rand)];
      const t = this.randomInteriorPointNear(pivot, 6, rand);
      this.carveDisk(t.x, t.y, Game.randTable([2, 3, 3, 4], rand));
    }
    // Clean up jagged wall spurs
    const pruned = this.pruneWallsWithSingleNeighbor(true);
    if (debug)
      console.log("[OrganicTunnels] pruned single-neighbor walls:", pruned);
    if (debug) console.log("[OrganicTunnels] done");
  }

  // --- helpers ---
  private isInterior(x: number, y: number): boolean {
    return (
      x > this.room.roomX &&
      y > this.room.roomY &&
      x < this.room.roomX + this.room.width - 1 &&
      y < this.room.roomY + this.room.height - 1
    );
  }

  private fillInteriorWithWalls() {
    for (
      let x = this.room.roomX + 1;
      x < this.room.roomX + this.room.width - 1;
      x++
    ) {
      for (
        let y = this.room.roomY + 1;
        y < this.room.roomY + this.room.height - 1;
        y++
      ) {
        if (!(this.room.roomArray[x][y] instanceof Wall)) {
          const w = new Wall(this.room, x, y);
          this.room.roomArray[x][y] = w;
          this.room.innerWalls.push(w);
        }
      }
    }
  }

  private carveDisk(cx: number, cy: number, radius: number) {
    const r2 = radius * radius;
    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.floor(cy - radius);
    const maxY = Math.ceil(cy + radius);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (!this.isInterior(x, y)) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          if (this.room.roomArray[x][y] instanceof Wall) {
            this.room.removeWall(x, y);
          }
          this.room.roomArray[x][y] = new Floor(this.room, x, y);
          this.room.innerWalls = this.room.innerWalls.filter(
            (w) => w.x !== x || w.y !== y,
          );
        }
      }
    }
  }

  private getDoorEntryPoints(
    rand?: () => number,
  ): Array<{ x: number; y: number }> {
    const entries: Array<{ x: number; y: number }> = [];
    const left = this.room.roomX;
    const right = this.room.roomX + this.room.width - 1;
    const top = this.room.roomY;
    const bottom = this.room.roomY + this.room.height - 1;
    for (const d of this.room.doors || []) {
      const x = (d as any).x as number;
      const y = (d as any).y as number;
      if (x === left && this.isInterior(x + 1, y))
        entries.push({ x: x + 1, y });
      else if (x === right && this.isInterior(x - 1, y))
        entries.push({ x: x - 1, y });
      else if (y === top && this.isInterior(x, y + 1))
        entries.push({ x, y: y + 1 });
      else if (y === bottom && this.isInterior(x, y - 1))
        entries.push({ x, y: y - 1 });
    }
    // Spoof synthetic entries on doorless walls if enabled
    if (GameplaySettings.ORGANIC_TUNNELS_SPOOF_ENABLED && rand) {
      const margin = Math.max(
        1,
        GameplaySettings.ORGANIC_TUNNELS_SPOOF_EDGE_MARGIN | 0,
      );
      const hasLeft = entries.some((e) => e.x === left + 1);
      const hasRight = entries.some((e) => e.x === right - 1);
      const hasTop = entries.some((e) => e.y === top + 1);
      const hasBottom = entries.some((e) => e.y === bottom - 1);

      const addOnWall = (
        orientation: "left" | "right" | "top" | "bottom",
        count: number,
      ) => {
        for (let i = 0; i < count; i++) {
          if (orientation === "left") {
            const y = Game.rand(top + margin, bottom - margin, rand);
            if (this.isInterior(left + 1, y)) entries.push({ x: left + 1, y });
          } else if (orientation === "right") {
            const y = Game.rand(top + margin, bottom - margin, rand);
            if (this.isInterior(right - 1, y))
              entries.push({ x: right - 1, y });
          } else if (orientation === "top") {
            const x = Game.rand(left + margin, right - margin, rand);
            if (this.isInterior(x, top + 1)) entries.push({ x, y: top + 1 });
          } else if (orientation === "bottom") {
            const x = Game.rand(left + margin, right - margin, rand);
            if (this.isInterior(x, bottom - 1))
              entries.push({ x, y: bottom - 1 });
          }
        }
      };

      const minSpoof = Math.max(
        0,
        GameplaySettings.ORGANIC_TUNNELS_SPOOF_PER_WALL_MIN | 0,
      );
      const maxSpoof = Math.max(
        minSpoof,
        GameplaySettings.ORGANIC_TUNNELS_SPOOF_PER_WALL_MAX | 0,
      );
      const roll = () => Game.rand(minSpoof, maxSpoof, rand);

      if (!hasLeft) addOnWall("left", roll());
      if (!hasRight) addOnWall("right", roll());
      if (!hasTop) addOnWall("top", roll());
      if (!hasBottom) addOnWall("bottom", roll());
    }
    return entries;
  }

  private distance(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private minimumSpanningEdges(
    points: Array<{ x: number; y: number }>,
  ): Array<{ a: { x: number; y: number }; b: { x: number; y: number } }> {
    if (points.length <= 1) return [];
    const connected: Array<{ x: number; y: number }> = [points[0]];
    const remaining: Array<{ x: number; y: number }> = points.slice(1);
    const edges: Array<{
      a: { x: number; y: number };
      b: { x: number; y: number };
    }> = [];
    while (remaining.length > 0) {
      let bestI = -1;
      let bestJ = -1;
      let bestD = Infinity;
      for (let i = 0; i < connected.length; i++) {
        for (let j = 0; j < remaining.length; j++) {
          const d = this.distance(connected[i], remaining[j]);
          if (d < bestD) {
            bestD = d;
            bestI = i;
            bestJ = j;
          }
        }
      }
      const a = connected[bestI];
      const b = remaining[bestJ];
      edges.push({ a, b });
      connected.push(b);
      remaining.splice(bestJ, 1);
    }
    return edges;
  }

  private buildPerimeterBiasedNetwork(
    entries: Array<{ x: number; y: number }>,
    rand: () => number,
  ) {
    const avoidRect = this.getCenterAvoidRect();
    const center = {
      x: this.room.roomX + this.room.width / 2,
      y: this.room.roomY + this.room.height / 2,
    };
    const ordered = entries
      .slice()
      .sort(
        (a, b) =>
          Math.atan2(a.y - center.y, a.x - center.x) -
          Math.atan2(b.y - center.y, b.x - center.x),
      );

    const baseOpts = {
      baseRadius: 1.25,
      radiusJitter: 1.1,
      pocketChance: 0.2,
      pocketRadius: [2, 4] as [number, number],
    };

    for (let i = 0; i < ordered.length; i++) {
      const current = ordered[i];
      const next = ordered[(i + 1) % ordered.length];
      this.carveAroundCenter(current, next, avoidRect, rand, baseOpts);
    }

    // Add a few long sweeps to keep the loop interesting while still avoiding center
    if (ordered.length >= 4) {
      const stride = Math.max(2, Math.floor(ordered.length / 2));
      const extras = Math.min(ordered.length, 2);
      for (let i = 0; i < extras; i++) {
        const a = ordered[i];
        const b = ordered[(i + stride) % ordered.length];
        if (a === b) continue;
        this.carveAroundCenter(a, b, avoidRect, rand, {
          baseRadius: 1.1,
          radiusJitter: 0.7,
          pocketChance: 0.1,
          pocketRadius: [2, 3],
        });
      }
    }

    this.ensureEntryConnectivity(ordered, rand);
  }

  private getCenterAvoidRect(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    const minX = this.room.roomX + 1;
    const maxX = this.room.roomX + this.room.width - 2;
    const minY = this.room.roomY + 1;
    const maxY = this.room.roomY + this.room.height - 2;
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const insetX = Math.max(1, Math.floor(width * 0.25));
    const insetY = Math.max(1, Math.floor(height * 0.25));
    return {
      minX: minX + insetX,
      maxX: maxX - insetX,
      minY: minY + insetY,
      maxY: maxY - insetY,
    };
  }

  private carveAroundCenter(
    a: { x: number; y: number },
    b: { x: number; y: number },
    avoidRect: { minX: number; maxX: number; minY: number; maxY: number },
    rand: () => number,
    opts?: {
      baseRadius?: number;
      radiusJitter?: number;
      pocketChance?: number;
      pocketRadius?: [number, number];
    },
  ) {
    if (!this.segmentCrossesRect(a, b, avoidRect)) {
      this.carveOrganicPath(a.x, a.y, b.x, b.y, rand, opts);
      return;
    }
    const waypoint = this.choosePerimeterWaypoint(a, b, avoidRect, rand);
    if (waypoint) {
      this.carveOrganicPath(a.x, a.y, waypoint.x, waypoint.y, rand, opts);
      this.carveOrganicPath(waypoint.x, waypoint.y, b.x, b.y, rand, opts);
    } else {
      this.carveOrganicPath(a.x, a.y, b.x, b.y, rand, opts);
    }
  }

  private segmentCrossesRect(
    a: { x: number; y: number },
    b: { x: number; y: number },
    rect: { minX: number; maxX: number; minY: number; maxY: number },
  ): boolean {
    const steps = Math.max(
      4,
      Math.ceil(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))),
    );
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (x > rect.minX && x < rect.maxX && y > rect.minY && y < rect.maxY) {
        return true;
      }
    }
    return false;
  }

  private choosePerimeterWaypoint(
    a: { x: number; y: number },
    b: { x: number; y: number },
    rect: { minX: number; maxX: number; minY: number; maxY: number },
    rand: () => number,
  ): { x: number; y: number } | null {
    const insetMargin = 1.5;
    const minX = this.room.roomX + 1;
    const maxX = this.room.roomX + this.room.width - 2;
    const minY = this.room.roomY + 1;
    const maxY = this.room.roomY + this.room.height - 2;

    const clamp = (value: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(value, hi));

    const candidates = [
      {
        x: clamp(rect.minX - insetMargin, minX, maxX),
        y: clamp((a.y + b.y) / 2 + (rand() - 0.5) * 2, minY, maxY),
      },
      {
        x: clamp(rect.maxX + insetMargin, minX, maxX),
        y: clamp((a.y + b.y) / 2 + (rand() - 0.5) * 2, minY, maxY),
      },
      {
        x: clamp((a.x + b.x) / 2 + (rand() - 0.5) * 2, minX, maxX),
        y: clamp(rect.minY - insetMargin, minY, maxY),
      },
      {
        x: clamp((a.x + b.x) / 2 + (rand() - 0.5) * 2, minX, maxX),
        y: clamp(rect.maxY + insetMargin, minY, maxY),
      },
    ].filter((p) => this.isInterior(Math.round(p.x), Math.round(p.y)));

    if (candidates.length === 0) return null;
    let best = candidates[0];
    let bestDist = this.distance(best, a) + this.distance(best, b);
    for (let i = 1; i < candidates.length; i++) {
      const d =
        this.distance(candidates[i], a) + this.distance(candidates[i], b);
      if (d < bestDist) {
        bestDist = d;
        best = candidates[i];
      }
    }
    return best;
  }

  private ensureEntryConnectivity(
    entries: Array<{ x: number; y: number }>,
    rand: () => number,
  ) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const { componentMap, boundaryByComponent } =
        this.computeFloorComponents();
      if (componentMap.size === 0) return;
      const entryComponents = entries
        .map((e) => componentMap.get(this.coordKey(e.x, e.y)))
        .filter((id): id is number => typeof id === "number");
      const unique = Array.from(new Set(entryComponents));
      if (unique.length <= 1) return;
      const bridged = this.bridgeDisconnectedComponents(
        unique,
        componentMap,
        boundaryByComponent,
        rand,
      );
      if (!bridged) return;
    }
  }

  private computeFloorComponents(): {
    componentMap: Map<string, number>;
    boundaryByComponent: Map<number, Array<{ x: number; y: number }>>;
  } {
    const componentMap = new Map<string, number>();
    const boundaryByComponent = new Map<
      number,
      Array<{ x: number; y: number }>
    >();
    let componentId = 0;
    for (
      let x = this.room.roomX + 1;
      x < this.room.roomX + this.room.width - 1;
      x++
    ) {
      for (
        let y = this.room.roomY + 1;
        y < this.room.roomY + this.room.height - 1;
        y++
      ) {
        const key = this.coordKey(x, y);
        if (!componentMap.has(key) && this.isFloorTile(x, y)) {
          this.floodFillFloor(
            x,
            y,
            componentId,
            componentMap,
            boundaryByComponent,
          );
          componentId++;
        }
      }
    }
    return { componentMap, boundaryByComponent };
  }

  private floodFillFloor(
    startX: number,
    startY: number,
    componentId: number,
    componentMap: Map<string, number>,
    boundaryByComponent: Map<number, Array<{ x: number; y: number }>>,
  ) {
    const stack = [{ x: startX, y: startY }];
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = this.coordKey(x, y);
      if (componentMap.has(key) || !this.isFloorTile(x, y)) continue;
      componentMap.set(key, componentId);
      if (this.isBoundaryFloor(x, y)) {
        if (!boundaryByComponent.has(componentId)) {
          boundaryByComponent.set(componentId, []);
        }
        boundaryByComponent.get(componentId)!.push({ x, y });
      }
      const neighbors = [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 },
      ];
      for (const n of neighbors) {
        if (
          !componentMap.has(this.coordKey(n.x, n.y)) &&
          this.isFloorTile(n.x, n.y)
        ) {
          stack.push(n);
        }
      }
    }
  }

  private isFloorTile(x: number, y: number): boolean {
    return this.room.roomArray[x]?.[y] instanceof Floor;
  }

  private isBoundaryFloor(x: number, y: number): boolean {
    const neighbors = [
      this.room.roomArray[x - 1]?.[y],
      this.room.roomArray[x + 1]?.[y],
      this.room.roomArray[x]?.[y - 1],
      this.room.roomArray[x]?.[y + 1],
    ];
    return neighbors.some((tile) => tile instanceof Wall);
  }

  private coordKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private bridgeDisconnectedComponents(
    targetComponents: number[],
    componentMap: Map<string, number>,
    boundaryByComponent: Map<number, Array<{ x: number; y: number }>>,
    rand: () => number,
  ): boolean {
    const wall = this.findAdjacentComponentWall(
      targetComponents,
      componentMap,
      rand,
    );
    if (wall) {
      this.carveDisk(wall.x, wall.y, 1);
      return true;
    }
    const pair = this.findClosestBoundaryPair(
      targetComponents,
      boundaryByComponent,
    );
    if (!pair) return false;
    this.carveOrganicPath(pair.a.x, pair.a.y, pair.b.x, pair.b.y, rand, {
      baseRadius: 1.05,
      radiusJitter: 0.4,
      pocketChance: 0,
      pocketRadius: [2, 3],
    });
    return true;
  }

  private findAdjacentComponentWall(
    targetComponents: number[],
    componentMap: Map<string, number>,
    rand: () => number,
  ): { x: number; y: number } | null {
    const targets = new Set(targetComponents);
    const candidates: Array<{ x: number; y: number }> = [];
    for (
      let x = this.room.roomX + 1;
      x < this.room.roomX + this.room.width - 1;
      x++
    ) {
      for (
        let y = this.room.roomY + 1;
        y < this.room.roomY + this.room.height - 1;
        y++
      ) {
        if (!(this.room.roomArray[x]?.[y] instanceof Wall)) continue;
        const neighbors = new Set<number>();
        const coords = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 },
        ];
        for (const c of coords) {
          const id = componentMap.get(this.coordKey(c.x, c.y));
          if (typeof id === "number" && targets.has(id)) {
            neighbors.add(id);
          }
        }
        if (neighbors.size >= 2) {
          candidates.push({ x, y });
        }
      }
    }
    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(rand() * candidates.length)];
    return pick;
  }

  private findClosestBoundaryPair(
    targetComponents: number[],
    boundaryByComponent: Map<number, Array<{ x: number; y: number }>>,
  ): { a: { x: number; y: number }; b: { x: number; y: number } } | null {
    let best: {
      a: { x: number; y: number };
      b: { x: number; y: number };
    } | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < targetComponents.length; i++) {
      for (let j = i + 1; j < targetComponents.length; j++) {
        const compA = boundaryByComponent.get(targetComponents[i]) || [];
        const compB = boundaryByComponent.get(targetComponents[j]) || [];
        if (compA.length === 0 || compB.length === 0) continue;
        for (const a of compA) {
          for (const b of compB) {
            const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            if (dist < bestDist) {
              bestDist = dist;
              best = { a, b };
              if (dist <= 2) return best;
            }
          }
        }
      }
    }
    return best;
  }

  private carveOrganicPath(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    rand: () => number,
    opts?: {
      baseRadius?: number;
      radiusJitter?: number;
      pocketChance?: number;
      pocketRadius?: [number, number];
    },
  ) {
    const mode = GameplaySettings.ORGANIC_TUNNELS_PATH_MODE;
    if (mode === "bezier") {
      this.carveOrganicPathBezier(ax, ay, bx, by, rand, opts);
    } else {
      this.carveOrganicPathLinear(ax, ay, bx, by, rand, opts);
    }
  }

  private carveOrganicPathLinear(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    rand: () => number,
    opts?: {
      baseRadius?: number;
      radiusJitter?: number;
      pocketChance?: number;
      pocketRadius?: [number, number];
    },
  ) {
    const baseRadius = opts?.baseRadius ?? 1.2;
    const radiusJitter = opts?.radiusJitter ?? 1.0;
    const pocketChance = opts?.pocketChance ?? 0.15;
    const pocketRadius = opts?.pocketRadius ?? [2, 3];

    let dx = bx - ax;
    let dy = by - ay;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    dx /= len;
    dy /= len;

    let px = -dy;
    let py = dx;

    let lateral = 0;
    const maxLateral = 2.5;

    const step = 0.6;
    const steps = Math.ceil(len / step);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      lateral += (rand() - 0.5) * 0.6;
      if (lateral > maxLateral) lateral = maxLateral;
      if (lateral < -maxLateral) lateral = -maxLateral;

      const cx = ax + dx * (t * len) + px * lateral;
      const cy = ay + dy * (t * len) + py * lateral;

      const r = baseRadius + (rand() - 0.5) * radiusJitter;
      this.carveDisk(cx, cy, Math.max(1, r));

      if (rand() < pocketChance) {
        const pr = Game.rand(pocketRadius[0], pocketRadius[1], rand);
        const pocketCx = cx + px * (lateral + (rand() - 0.5) * 2);
        const pocketCy = cy + py * (lateral + (rand() - 0.5) * 2);
        this.carveDisk(pocketCx, pocketCy, pr);
      }
    }
  }

  private carveOrganicPathBezier(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    rand: () => number,
    opts?: {
      baseRadius?: number;
      radiusJitter?: number;
      pocketChance?: number;
      pocketRadius?: [number, number];
    },
  ) {
    const baseRadius = opts?.baseRadius ?? 1.2;
    const radiusJitter = opts?.radiusJitter ?? 1.0;
    const pocketChance = opts?.pocketChance ?? 0.15;
    const pocketRadius = opts?.pocketRadius ?? [2, 3];

    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const dirX = dx / len;
    const dirY = dy / len;
    const arcMagnitude = len * (0.15 + rand() * 0.15);

    const controlOffset = () => (rand() - 0.5) * arcMagnitude;
    const control1Offset = controlOffset();
    const control2Offset = controlOffset();

    const control1 = {
      x: ax + dirX * (len * 0.25) - dirY * control1Offset,
      y: ay + dirY * (len * 0.25) + dirX * control1Offset,
    };
    const control2 = {
      x: ax + dirX * (len * 0.75) - dirY * control2Offset,
      y: ay + dirY * (len * 0.75) + dirX * control2Offset,
    };

    const samplePoint = (t: number) => {
      const u = 1 - t;
      const uu = u * u;
      const tt = t * t;
      const uuu = uu * u;
      const ttt = tt * t;
      const x =
        uuu * ax + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * bx;
      const y =
        uuu * ay + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * by;
      return { x, y };
    };

    const sampleDerivative = (t: number) => {
      const u = 1 - t;
      const x =
        3 * u * u * (control1.x - ax) +
        6 * u * t * (control2.x - control1.x) +
        3 * t * t * (bx - control2.x);
      const y =
        3 * u * u * (control1.y - ay) +
        6 * u * t * (control2.y - control1.y) +
        3 * t * t * (by - control2.y);
      return { x, y };
    };

    const step = 0.45;
    const steps = Math.max(4, Math.ceil(len / step));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = samplePoint(t);
      const derivative = sampleDerivative(t);
      const dLen = Math.max(
        0.001,
        Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y),
      );
      const tanX = derivative.x / dLen;
      const tanY = derivative.y / dLen;
      const perpX = -tanY;
      const perpY = tanX;

      const jitter = (rand() - 0.5) * Math.min(arcMagnitude * 0.25, 1.6);
      const cx = point.x + perpX * jitter;
      const cy = point.y + perpY * jitter;
      const r = baseRadius + (rand() - 0.5) * radiusJitter;
      this.carveDisk(cx, cy, Math.max(1, r));

      if (rand() < pocketChance) {
        const pr = Game.rand(pocketRadius[0], pocketRadius[1], rand);
        const pocketShift = (rand() - 0.5) * 2;
        const pocketCx = cx + perpX * (jitter + pocketShift);
        const pocketCy = cy + perpY * (jitter + pocketShift);
        this.carveDisk(pocketCx, pocketCy, pr);
      }
    }
  }

  private randomInteriorPointNear(
    pivot: { x: number; y: number },
    radius: number,
    rand: () => number,
  ): { x: number; y: number } {
    for (let tries = 0; tries < 16; tries++) {
      const dx = Game.rand(-radius, radius, rand);
      const dy = Game.rand(-radius, radius, rand);
      const x = pivot.x + dx;
      const y = pivot.y + dy;
      if (this.isInterior(x, y)) return { x, y };
    }
    return { x: pivot.x, y: pivot.y };
  }

  private generatePocketTargets(
    origin: { x: number; y: number },
    count: number,
    rand: () => number,
  ): Array<{ x: number; y: number }> {
    const targets: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Game.rand(
        4,
        Math.max(6, Math.min(this.room.width, this.room.height) - 4),
        rand,
      );
      const x = Math.round(origin.x + Math.cos(angle) * dist * (0.5 + rand()));
      const y = Math.round(origin.y + Math.sin(angle) * dist * (0.5 + rand()));
      const tx = Math.max(
        this.room.roomX + 1,
        Math.min(x, this.room.roomX + this.room.width - 2),
      );
      const ty = Math.max(
        this.room.roomY + 1,
        Math.min(y, this.room.roomY + this.room.height - 2),
      );
      targets.push({ x: tx, y: ty });
    }
    return targets;
  }

  // Choose 1-2 spoofed hub points in the central 2x2 squares (i.e., 25%-75% in both axes)
  private getCenterSpoofEntries(
    rand: () => number,
    countRange: [number, number] = [1, 2],
  ): Array<{ x: number; y: number }> {
    const minX = this.room.roomX + 1;
    const maxX = this.room.roomX + this.room.width - 2;
    const minY = this.room.roomY + 1;
    const maxY = this.room.roomY + this.room.height - 2;
    if (maxX <= minX || maxY <= minY) return [];

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const qx = Math.floor(w / 4);
    const qy = Math.floor(h / 4);
    const cxMin = minX + qx;
    const cxMax = maxX - qx;
    const cyMin = minY + qy;
    const cyMax = maxY - qy;

    const hubs: Array<{ x: number; y: number }> = [];
    const num = Game.rand(countRange[0], countRange[1], rand);
    for (let i = 0; i < num; i++) {
      // try up to N times to find a unique-ish hub
      let created = false;
      for (let t = 0; t < 16 && !created; t++) {
        const x = Game.rand(cxMin, cxMax, rand);
        const y = Game.rand(cyMin, cyMax, rand);
        if (!this.isInterior(x, y)) continue;
        if (hubs.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) <= 2))
          continue;
        hubs.push({ x, y });
        created = true;
      }
    }
    return hubs;
  }

  // Remove interior walls that have exactly one neighboring wall (orthogonal by default).
  // Iterates until no such walls remain. Returns the total number of walls removed.
  pruneWallsWithSingleNeighbor(orthogonalOnly: boolean = true): number {
    let totalRemoved = 0;
    while (true) {
      const toRemove: Array<{ x: number; y: number }> = [];
      for (
        let x = this.room.roomX + 1;
        x < this.room.roomX + this.room.width - 1;
        x++
      ) {
        for (
          let y = this.room.roomY + 1;
          y < this.room.roomY + this.room.height - 1;
          y++
        ) {
          if (!(this.room.roomArray[x][y] instanceof Wall)) continue;
          const n = orthogonalOnly
            ? this.countOrthogonalWallNeighborsAt(x, y)
            : this.countWallNeighbors(this.room.roomArray[x][y] as Wall);
          if (n === 1) toRemove.push({ x, y });
        }
      }
      if (toRemove.length === 0) break;
      for (const { x, y } of toRemove) {
        if (this.room.roomArray[x][y] instanceof Wall) {
          this.room.removeWall(x, y);
        }
        this.room.roomArray[x][y] = new Floor(this.room, x, y);
        this.room.innerWalls = this.room.innerWalls.filter(
          (w) => w.x !== x || w.y !== y,
        );
      }
      totalRemoved += toRemove.length;
    }
    return totalRemoved;
  }

  // Count only N/E/S/W neighboring walls
  private countOrthogonalWallNeighborsAt(x: number, y: number): number {
    let c = 0;
    if (this.room.roomArray[x - 1]?.[y] instanceof Wall) c++;
    if (this.room.roomArray[x + 1]?.[y] instanceof Wall) c++;
    if (this.room.roomArray[x]?.[y - 1] instanceof Wall) c++;
    if (this.room.roomArray[x]?.[y + 1] instanceof Wall) c++;
    return c;
  }
}
