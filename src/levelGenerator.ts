console.log("levelGenerator.ts loaded");

import { Game } from "./game";
import { Room, RoomType } from "./room";
import { Door } from "./tile/door";
import { LevelConstants } from "./levelConstants";
import { Random } from "./random";
import { DownLadder } from "./tile/downLadder";
//Goal: CRACK THE LEVEL GENERATOR

class PartitionConnection {
  x: number;
  y: number;
  other: Partition;

  constructor(x: number, y: number, other: Partition) {
    this.x = x;
    this.y = y;
    this.other = other;
  }
}

class Partition {
  x: number;
  y: number;
  w: number;
  h: number;
  type: RoomType;
  connections: Array<PartitionConnection>;
  distance: number;
  isTopOpen: boolean;
  isRightOpen: boolean;
  isBottomOpen: boolean;
  isLeftOpen: boolean;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = RoomType.DUNGEON;
    this.connections = [];
    this.distance = 1000;
    this.isTopOpen = true;
    this.isRightOpen = true;
    this.isBottomOpen = true;
    this.isLeftOpen = true;
  }

  split = () => {
    // Reset open walls when a partition is split
    this.isTopOpen = true;
    this.isRightOpen = true;
    this.isBottomOpen = true;
    this.isLeftOpen = true;

    // This function generates a random number around the center (0.5) within a certain width (0.6).
    // It uses the Random.rand() function to generate a random number between 0 and 1, subtracts 0.5 to center it around 0,
    // multiplies it by the width to scale it, and then adds the center (0.5) to shift it back to being between 0 and 1.
    let rand_mid = () => {
      let center = 0.5;
      let width = 0.75;
      return (Random.rand() - 0.5) * width + center;
    };

    let sizeRange = () => {
      let sizes = [
        { size: 1, probability: 0.2 },
        { size: 3, probability: 0.6 },
        { size: 10, probability: 0.2 },
      ];
      let rand = Random.rand();
      let sum = 0;
      for (let size of sizes) {
        sum += size.probability;
        if (rand <= sum) return size.size;
      }
      return sizes[sizes.length - 1].size;
    };
    let MIN_SIZE = 4;

    if (this.w > this.h) {
      //if the partitions width is greater than its height
      let w1 = Math.floor(rand_mid() * this.w);
      //choose a random tile within the width of the tiles
      let w2 = this.w - w1 - 1;
      //The remaining border - 1
      if (w1 < MIN_SIZE || w2 < MIN_SIZE) return [this];
      //if either of these are less than the min size: return an array with this Partition
      return [
        new Partition(this.x, this.y, w1, this.h),
        new Partition(this.x + w1 + 1, this.y, w2, this.h),
      ];
      //return an array with two new partitions
    } else {
      let h1 = Math.floor(rand_mid() * this.h);
      let h2 = this.h - h1 - 1;
      if (h1 < MIN_SIZE || h2 < MIN_SIZE) return [this];
      return [
        new Partition(this.x, this.y, this.w, h1),
        new Partition(this.x, this.y + h1 + 1, this.w, h2),
      ];
      //identical code for case where height > width
    }
  };

  point_in = (x: number, y: number): boolean => {
    //given the input argument x,y coordinates output boolean
    return (
      x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
    );

    //only return true if both input x and input y are within the partitions x and y
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
    //return true if the input x and y are next to any point of the partition
  };

  area = (): number => {
    return this.w * this.h;
    //return the damn area
  };

  overlaps = (
    other: Partition
  ): { isOverlapping: boolean; overlapX: number; overlapY: number } => {
    // Calculate overlaps in both dimensions
    const overlapX =
      Math.min(this.x + this.w + 1, other.x + other.w + 1) -
      Math.max(this.x, other.x);
    const overlapY =
      Math.min(this.y + this.h + 1, other.y + other.h + 1) -
      Math.max(this.y, other.y);

    // Partitions overlap if there's overlap in both dimensions
    const isOverlapping = overlapX > 0 && overlapY > 0;

    return {
      isOverlapping,
      overlapX,
      overlapY,
    };
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
      //count up from the partitions x to its width
      points.push({ x: x, y: this.y - 1 /*one row above partition*/ });
      points.push({ x: x, y: this.y + this.h /*one row below partition*/ });
    } // pushes the points above and below the partition
    for (let y = this.y; y < this.y + this.h; y++) {
      points.push({ x: this.x - 1, y: y });
      points.push({ x: this.x + this.w, y: y });
    } //pushes points to left and right of the partition
    points = points.filter(
      (p) =>
        !this.connections.some(
          (c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1
        )
      //if the sum of the distance between the input x and y values and the partitions x and y values is > 1
      //delete those from the points array
    );
    points.sort(() => 0.5 - Random.rand());
    return points[0]; //return first object of x y points in array points
  };
} //end of Partition class

let split_partitions = (
  partitions: Array<Partition>,
  prob: number
): Array<Partition> => {
  for (let partition of partitions) {
    if (Random.rand() < prob) {
      partitions = partitions.filter((p) => p !== partition); // remove partition
      partitions = partitions.concat(partition.split()); // add splits
    }
  }
  return partitions;
  //takes input partitions array, randomly removes partitions and adds splits, output modified partitions array
};

const getPartitionsCenter = (
  partitions: Partition[]
): { x: number; y: number } => {
  if (partitions.length === 0) {
    return { x: 0, y: 0 };
  }

  // Calculate bounds of all partitions
  const bounds = partitions.reduce(
    (acc, partition) => {
      return {
        minX: Math.min(acc.minX, partition.x),
        maxX: Math.max(acc.maxX, partition.x + partition.w),
        minY: Math.min(acc.minY, partition.y),
        maxY: Math.max(acc.maxY, partition.y + partition.h),
      };
    },
    {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    }
  );

  // Calculate center point
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
};

const movePartitionAwayFromPoint = (
  partition: Partition,
  point: { x: number; y: number },
  multiplier: number
) => {
  // Get partition center
  const partitionCenter = {
    x: partition.x + partition.w / 2,
    y: partition.y + partition.h / 2,
  };

  // Calculate angle between point and partition center
  const dx = partitionCenter.x - point.x;
  const dy = partitionCenter.y - point.y;
  const angle = Math.atan2(dy, dx);

  // Calculate new position using trigonometry
  const moveX = Math.cos(angle) * multiplier;
  const moveY = Math.sin(angle) * multiplier;

  // Update partition position
  partition.x += Math.round(moveX);
  partition.y += Math.round(moveY);
};

// If you still need to move multiple partitions, you can use this wrapper:
const movePartitionsAwayFromPoint = (
  partitions: Partition[],
  point: { x: number; y: number },
  multiplier: number
) => {
  partitions.forEach((partition) =>
    movePartitionAwayFromPoint(partition, point, multiplier)
  );
  return partitions;
};

const distanceToPoint = (
  center: { x: number; y: number },
  point: { x: number; y: number }
) => {
  return Math.sqrt(
    Math.pow(center.x - point.x, 2) + Math.pow(center.y - point.y, 2)
  );
};

const sortByDistanceToPoint = (
  partitions: Partition[],
  centerPoint: { x: number; y: number },
  outerToInner: boolean = true
): Partition[] => {
  return [...partitions].sort((a, b) => {
    const aCenter = getPartitionsCenter([a]);
    const bCenter = getPartitionsCenter([b]);

    const aDistance = Math.sqrt(
      Math.pow(aCenter.x - centerPoint.x, 2) +
        Math.pow(aCenter.y - centerPoint.y, 2)
    );
    const bDistance = Math.sqrt(
      Math.pow(bCenter.x - centerPoint.x, 2) +
        Math.pow(bCenter.y - centerPoint.y, 2)
    );

    // If outerToInner is true, sort descending (outer first)
    // If false, sort ascending (inner first)
    return outerToInner ? bDistance - aDistance : aDistance - bDistance;
  });
};

let removeDisconnectedPartitions = (partitions: Partition[]): Partition[] => {
  // Helper function to find all connected partitions starting from a root
  const findConnectedGroup = (
    root: Partition,
    visited: Set<Partition>
  ): Partition[] => {
    const group: Partition[] = [root];
    visited.add(root);

    // Queue for breadth-first search
    const queue: Partition[] = [root];

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check all connections from current partition
      for (const connection of current.connections) {
        const otherPartition = connection.other;
        if (!visited.has(otherPartition)) {
          visited.add(otherPartition);
          group.push(otherPartition);
          queue.push(otherPartition);
        }
      }
    }

    return group;
  };

  // Find all distinct groups
  const visited = new Set<Partition>();
  const partitionGroups: Partition[][] = [];

  for (const partition of partitions) {
    if (!visited.has(partition)) {
      const group = findConnectedGroup(partition, visited);
      partitionGroups.push(group);
    }
  }

  // If no groups were found, return empty array
  if (partitionGroups.length === 0) {
    return [];
  }

  // Sort groups by size (descending) and return the largest group
  partitionGroups.sort((a, b) => b.length - a.length);
  return partitionGroups[0];
};

// Now we can simplify sortOuterToInner to use this:
const sortOuterToInner = (
  combined: Partition[],
  mapWidth: number,
  mapHeight: number
) => {
  const center = getPartitionsCenter(combined);
  return sortByDistanceToPoint(combined, center, true);
};

/**
 * Resolves collisions between partitions by pushing overlapping partitions apart.
 * Ensures that partitions do not exceed specified maximum boundaries during adjustment.
 * Logs input and output partitions for debugging purposes.
 * @param partitions1 First array of partitions.
 * @param partitions2 Second array of partitions.
 * @param maxX Maximum X boundary.
 * @param maxY Maximum Y boundary.
 * @returns Combined array of non-overlapping partitions.
 */
let resolveCollisions = (
  partitions1: Array<Partition>,
  partitions2: Array<Partition>,
  maxX: number,
  maxY: number
): Array<Partition> => {
  console.log("Starting resolveCollisions");

  let combined = [...partitions1, ...partitions2];
  combined = sortByDistanceToPoint(
    combined,
    getPartitionsCenter(combined),
    false
  );

  // Initial spread from center
  const center = getPartitionsCenter(combined);
  const maxRadius = Math.min(maxX, maxY) / 3; // Reduced to prevent spreading too far
  /*
  // Initial placement in a spiral
  combined.forEach((partition, index) => {
    const angle = (index / combined.length) * Math.PI * 2;
    const radius = (index / combined.length) * maxRadius;

    partition.x = Math.round(center.x + Math.cos(angle) * radius);
    partition.y = Math.round(center.y + Math.sin(angle) * radius);

    // Ensure within bounds
    partition.x = Math.max(0, Math.min(maxX - partition.w, partition.x));
    partition.y = Math.max(0, Math.min(maxY - partition.h, partition.y));
  });
  */

  //combined = movePartitionsAwayFromPoint(combined, center, 2);

  const maxIterations = 1000; // Reduced max iterations
  let iteration = 0;
  let previousOverlaps = Infinity;
  let noProgressCount = 0;
  //combined = remove_edge_rooms(combined, maxX, maxY);

  while (iteration < maxIterations) {
    let totalOverlaps = 0;
    let maxMove = Math.max(5, 20 - iteration); // Reduced movement range

    // Process each partition
    for (let i = 0; i < combined.length; i++) {
      const p1 = combined[i];

      for (let j = i + 1; j < combined.length; j++) {
        const p2 = combined[j];

        const { isOverlapping, overlapX, overlapY } = p1.overlaps(p2);
        if (isOverlapping) {
          totalOverlaps++;

          // Move partitions apart based on their relative positions
          if (overlapX <= overlapY) {
            // Horizontal separation
            if (p1.x < p2.x) {
              if (Math.random() < 0.5) {
                p1.x -= 1;
              } else {
                p2.x += 1;
              }
            } else {
              if (Math.random() < 0.5) {
                p1.x += 1;
              } else {
                p2.x -= 1;
              }
            }
          } else {
            // Vertical separation
            if (p1.y < p2.y) {
              if (Math.random() < 0.5) {
                p1.y -= 1;
              } else {
                p2.y += 1;
              }
            } else {
              if (Math.random() < 0.5) {
                p1.y += 1;
              } else {
                p2.y -= 1;
              }
            }
          }
        }
      }
    }

    // Round all positions
    combined.forEach((p) => {
      p.x = Math.round(p.x);
      p.y = Math.round(p.y);
    });

    console.log(`Iteration ${iteration}: ${totalOverlaps} overlaps remaining`);

    // Check for progress
    if (totalOverlaps >= previousOverlaps) {
      noProgressCount++;

      // If stuck for too long, add some randomness
      if (noProgressCount >= 3) {
        combined.forEach((p) => {
          p.x += Math.floor(Math.random() * 6) - 3;
          p.y += Math.floor(Math.random() * 6) - 3;
          p.x = Math.max(0, Math.min(maxX - p.w, p.x));
          p.y = Math.max(0, Math.min(maxY - p.h, p.y));
        });
        noProgressCount = 0;
      }
    } else {
      noProgressCount = 0;
    }

    // Exit conditions
    if (totalOverlaps === 0) {
      console.log("All collisions resolved!");
      break;
    }

    // Force exit if we're not making progress
    if (noProgressCount >= 5) {
      console.log("Exiting due to lack of progress");
      break;
    }

    previousOverlaps = totalOverlaps;
    iteration++;
  }

  // Final cleanup - remove any remaining overlapping partitions
  let finalPartitions = [];
  for (let i = 0; i < combined.length; i++) {
    let hasOverlap = false;
    for (let j = 0; j < finalPartitions.length; j++) {
      if (combined[i].overlaps(finalPartitions[j]).isOverlapping) {
        hasOverlap = true;
        break;
      }
    }
    if (!hasOverlap) {
      finalPartitions.push(combined[i]);
    }
  }

  return finalPartitions;
};

let remove_wall_rooms = (
  partitions: Array<Partition>,
  w: number,
  h: number,
  prob: number = 1.0
): Array<Partition> => {
  for (const partition of partitions) {
    if (
      (partition.x === 0 ||
        partition.y === 0 ||
        partition.x + partition.w === w ||
        partition.y + partition.h === h) &&
      Random.rand() < prob
    ) {
      partitions = partitions.filter((p) => p != partition);
    }
  }
  return partitions;
  //return partitions array with no wall rooms
};

let remove_edge_rooms = (
  partitions: Array<Partition>,
  w: number,
  h: number,
  prob: number = 1.0
): Array<Partition> => {
  // Create copies for sorting by different criteria
  const byLeft = [...partitions].sort((a, b) => a.x - b.x);
  const byRight = [...partitions].sort((a, b) => b.x + b.w - (a.x + a.w));
  const byTop = [...partitions].sort((a, b) => a.y - b.y);
  const byBottom = [...partitions].sort((a, b) => b.y + b.h - (a.y + a.h));

  // Calculate how many rooms to remove from each edge (20% of rooms)
  const removeCount = Math.floor(partitions.length * 0.25);

  // Create sets of rooms to remove
  const toRemove = new Set<Partition>();

  // Add rooms from each edge if random check passes
  for (let i = 0; i < removeCount; i++) {
    if (Random.rand() < prob) {
      byLeft[i] && toRemove.add(byLeft[i]);
      byRight[i] && toRemove.add(byRight[i]);
      byTop[i] && toRemove.add(byTop[i]);
      byBottom[i] && toRemove.add(byBottom[i]);
    }
  }

  // Return filtered array excluding rooms in toRemove set
  return partitions.filter((p) => !toRemove.has(p));
};

let remove_disconnected_rooms = (
  partitions: Array<Partition>
): Array<Partition> => {
  return partitions.filter((p) => p.connections.length > 0);
};

let populate_grid = (
  partitions: Array<Partition>,
  grid: Array<Array<Partition | false>>,
  w: number,
  h: number
): Array<Array<Partition | false>> => {
  for (let x = 0; x < w; x++) {
    //loop through the horizontal tiles
    grid[x] = []; //empty array at x index
    for (let y = 0; y < h; y++) {
      grid[x][y] = false;
      for (const partition of partitions) {
        if (partition.point_in(x, y)) grid[x][y] = partition;
      }
    }
  }
  return grid;
  //input grid array, partitions array and width and height
  //output grid array that indicates which cells are in which partition
};

let generate_dungeon_candidate = (
  map_w: number,
  map_h: number
): Array<Partition> => {
  // Initialize with a single large partition
  let partitions = [new Partition(300, 300, map_w - 600, map_h - 600)];
  let grid = [];

  // Create slightly offset overlay partitions for variety
  let overlayPartitions = [...partitions];
  overlayPartitions.forEach((p) => {
    p.x += 5;
    p.y += 5;
  });

  for (let i = 0; i < 5; i++) {
    partitions = split_partitions(partitions, 0.3);
  }
  for (let j = 0; j < 5; j++) {
    partitions = split_partitions(partitions, 0.7);
  }
  for (let j = 0; j < 5; j++) {
    partitions = split_partitions(partitions, 1);
  }
  for (let j = 0; j < 5; j++) {
    partitions = split_partitions(partitions, 0.7);
  }
  for (let j = 0; j < 5; j++) {
    partitions = split_partitions(partitions, 0.3);
  }
  partitions = remove_edge_rooms(partitions, map_w, map_h, 1);
  partitions = remove_edge_rooms(partitions, map_w, map_h, 1);

  if (partitions.length < 5) {
    console.warn("Not enough partitions after collision resolution");
    return [];
  }

  partitions = remove_edge_rooms(partitions, map_w, map_h, 0.5);

  if (partitions.length < 5) {
    console.warn("Not enough partitions after edge room removal");
    return [];
  }

  // Populate grid and sort partitions by area
  grid = populate_grid(partitions, grid, map_w, map_h);
  partitions.sort((a, b) => a.area() - b.area());

  let spawn = partitions[0];
  spawn.type = RoomType.START;
  partitions[partitions.length - 1].type = RoomType.BOSS;

  let connected = [spawn];
  let frontier = [spawn];
  let found_boss = false;
  let totalTries = 0;
  const maxTotalTries = 5000; // Global limit for all connection attempts

  while (frontier.length > 0 && !found_boss && totalTries < maxTotalTries) {
    let room = frontier[0];
    frontier.splice(0, 1);

    let doors_found = 0;
    const num_doors = Math.floor(Random.rand() * 2 + 1);
    let roomTries = 0;
    const maxRoomTries = 100; // Limit tries per room

    while (doors_found < num_doors && roomTries < maxRoomTries) {
      let point = room.get_branch_point();
      // Skip if no valid branch point found
      if (!point) break;

      for (const p of partitions) {
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
          if (p.type === RoomType.BOSS) found_boss = true;
          break;
        }
      }
      roomTries++;
      totalTries++;
    }

    // If we couldn't connect enough doors, but found the boss, that's okay
    if (found_boss) break;

    // If we couldn't connect enough doors and haven't found the boss,
    // check if we have any other rooms in the frontier
    if (doors_found === 0 && frontier.length === 0) {
      console.warn("Failed to connect all rooms");
      return []; // Return empty array to trigger regeneration
    }
  }
  partitions = removeDisconnectedPartitions(partitions);

  // If we hit the total tries limit or didn't find the boss
  if (totalTries >= maxTotalTries || !found_boss) {
    console.warn("Failed to generate valid dungeon layout");
    return [];
  }

  return partitions;
};

let generate_dungeon = (map_w: number, map_h: number): Array<Partition> => {
  let passes_checks = false;
  let partitions: Array<Partition>;

  let tries = 0;

  while (!passes_checks) {
    partitions = generate_dungeon_candidate(map_w, map_h);

    passes_checks = true;
    if (partitions.length < 6) passes_checks = false;
    if (!partitions.some((p) => p.type === RoomType.BOSS))
      passes_checks = false;
    else if (partitions.find((p) => p.type === RoomType.BOSS).distance < 3)
      passes_checks = false;

    tries++;
    //if (tries > 100) break;
  }

  return partitions;
};

let generate_cave_candidate = (
  map_w: number,
  map_h: number,
  num_rooms: number
): Array<Partition> => {
  let partitions = [new Partition(100, 100, map_w, map_h)];
  let grid = [];

  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.75);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 1);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.5);
  grid = populate_grid(partitions, grid, map_w, map_h);

  partitions.sort((a, b) => a.area() - b.area());

  if (partitions.length === 0) {
    throw new Error("No partitions generated."); // Throw an error if no partitions
  }

  let spawn = partitions[0];
  spawn.type = RoomType.ROPECAVE;
  for (let i = 1; i < partitions.length; i++)
    partitions[i].type = RoomType.CAVE;

  let connected = [spawn];
  let frontier = [spawn];

  // connect rooms until we hit num_rooms
  while (frontier.length > 0 && connected.length < num_rooms) {
    let room = frontier[0];
    frontier.splice(0, 1);

    let doors_found = 0;
    const num_doors = Math.floor(Random.rand() * 2 + 1);

    let tries = 0;
    const max_tries = 1000;

    while (
      doors_found < num_doors &&
      tries < max_tries &&
      connected.length < num_rooms
    ) {
      let point = room.get_branch_point();
      if (!point) {
      }

      for (const p of partitions) {
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

  // remove rooms we haven't connected to yet
  partitions = partitions.filter(
    (partition) => partition.connections.length > 0
  );
  grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms

  // make sure we haven't removed all the rooms
  if (partitions.length === 0) {
    throw new Error("No valid rooms after filtering."); // Throw an error if no valid rooms
  }

  // make some loops
  let num_loop_doors = Math.floor(Random.rand() * 4 + 4);
  for (let i = 0; i < num_loop_doors; i++) {
    let roomIndex = Math.floor(Random.rand() * partitions.length);
    let room = partitions[roomIndex];

    let found_door = false;

    let tries = 0;
    const max_tries = 100;

    let not_already_connected = partitions.filter(
      (p) => !room.connections.some((c) => c.other === p)
    );

    while (!found_door && tries < max_tries) {
      let point = room.get_branch_point();
      if (!point) {
        break; // Skip if no valid branch point found
      }

      for (const p of not_already_connected) {
        if (p !== room && p.point_next_to(point.x, point.y)) {
          room.connections.push(new PartitionConnection(point.x, point.y, p));
          p.connections.push(new PartitionConnection(point.x, point.y, room));
          found_door = true;
          break;
        }
      }
      tries++;
    }
  }

  // calculate room distances
  frontier = [spawn];
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

  return partitions;
};

let generate_cave = (mapWidth: number, mapHeight: number): Array<Partition> => {
  let partitions: Array<Partition>;
  const numberOfRooms = 5; // don't set this too high or cave generation will time out

  do {
    partitions = generate_cave_candidate(mapWidth, mapHeight, numberOfRooms);
  } while (partitions.length < numberOfRooms);

  return partitions;
};

let generate_tutorial = (
  height: number = 7,
  width: number = 7
): Array<Partition> => {
  let partitions: Array<Partition>;

  partitions = [new Partition(0, 0, height, width)];
  partitions[0].type = RoomType.TUTORIAL;

  return partitions;
};

export class LevelGenerator {
  game: Game;
  seed: number;
  depthReached = 0;
  currentFloorFirstLevelID = 0;

  constructor() {
    console.log("LevelGenerator constructed");
  }

  private setOpenWallsForPartitions = (
    partitions: Array<Partition>,
    mapWidth: number,
    mapHeight: number
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

  getLevels = (
    partitions: Array<Partition>,
    depth: number,
    mapGroup: number
  ): Array<Room> => {
    this.setOpenWallsForPartitions(partitions, 35, 35); // Using standard map size

    let rooms: Array<Room> = [];

    for (let i = 0; i < partitions.length; i++) {
      let partition = partitions[i];

      // Pass open walls information to the Room constructor
      let room = new Room(
        this.game,
        partition.x - 1,
        partition.y - 1,
        partition.w + 2,
        partition.h + 2,
        partition.type,
        depth,
        mapGroup,
        Random.rand,
        partition.isTopOpen, // New parameter
        partition.isRightOpen, // New parameter
        partition.isBottomOpen, // New parameter
        partition.isLeftOpen // New parameter
      );
      console.log(
        `room.roomX: ${room.roomX}, room.roomY: ${room.roomY}, room.width: ${room.width}, room.height: ${room.height}`
      );
      rooms.push(room);
    }

    let doors_added: Array<Door> = [];

    partitions.forEach((partition, index) => {
      partition.connections.forEach((connection) => {
        let door = rooms[index].addDoor(connection.x, connection.y);
        let existingDoor = doors_added.find(
          (existing) => existing.x === door.x && existing.y === door.y
        );
        if (existingDoor) {
          existingDoor.link(door);
          door.link(existingDoor);
        }
        doors_added.push(door);
      });
    });

    for (let room of rooms) {
      room.populate(Random.rand);
    }

    return rooms;
  };

  setSeed = (seed: number) => {
    this.seed = seed;
  };

  generate = (game: Game, depth: number, cave = false): Room => {
    console.log("Generate called:", { depth, cave });
    this.depthReached = depth;

    // Set the random state based on the seed and depth
    Random.setState(this.seed + depth);

    this.game = game;

    // Determine the map group
    let mapGroup =
      this.game.rooms.length > 0
        ? this.game.rooms[this.game.rooms.length - 1].mapGroup + 1
        : 0;

    console.log("Generating partitions");
    // Generate partitions based on whether it's a cave or a dungeon
    let partitions = cave ? generate_cave(20, 20) : generate_dungeon(900, 900);
    console.log("Partitions generated:", partitions.length);

    // Get the levels based on the partitions
    let levels = this.getLevels(partitions, depth, mapGroup);

    // Update the current floor first level ID if it's not a cave
    if (!cave) this.currentFloorFirstLevelID = this.game.rooms.length;

    // Add the new levels to the game rooms
    this.game.rooms = [...this.game.rooms, ...levels];

    // Generate the rope hole if it exists
    for (let room of levels) {
      if (room.type === RoomType.ROPEHOLE) {
        for (let x = room.roomX; x < room.roomX + room.width; x++) {
          for (let y = room.roomY; y < room.roomY + room.height; y++) {
            let tile = room.roomArray[x][y];
            if (tile instanceof DownLadder && tile.isRope) {
              tile.generate();
              return cave
                ? levels.find((l) => l.type === RoomType.ROPECAVE)
                : levels.find((l) => l.type === RoomType.START);
            }
          }
        }
      }
    }

    // Return the start room or the rope cave room
    return cave
      ? levels.find((l) => l.type === RoomType.ROPECAVE)
      : levels.find((l) => l.type === RoomType.START);
  };

  generateFirstNFloors = (game, numFloors) => {
    this.generate(game, 0, false);
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
}
