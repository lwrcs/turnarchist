import { Game } from "./game";
import { Room, RoomType } from "./room";
import { Door } from "./tile/door";
import { LevelConstants } from "./levelConstants";
import { Random } from "./random";
import { DownLadder } from "./tile/downLadder";
import {
  LevelParameterGenerator,
  LevelParameters,
} from "./levelParametersGenerator";
import { Level } from "./level";

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
      let width = 0.6;
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

  overlaps = (other: Partition): boolean => {
    return (
      other.x < this.x + this.w + 1 &&
      other.x + other.w > this.x - 1 &&
      other.y < this.y + this.h + 1 &&
      other.y + other.h > this.y - 1
    );
    //takes another partition instance as argument
    //returns true if any points of each overlap
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
          (c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1,
        ),
      //if the sum of the distance between the input x and y values and the partitions x and y values is > 1
      //delete those from the points array
    );
    points.sort(() => 0.5 - Random.rand());
    return points[0]; //return first object of x y points in array points
  };
} //end of Partition class

let split_partitions = (
  partitions: Array<Partition>,
  prob: number,
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

let split_partition = (
  partition: Partition,
  prob: number,
): Array<Partition> => {
  if (Random.rand() < prob) {
    return partition.split();
  } else {
    return [partition];
  }
  // Takes a single partition and probability
  // Returns an array with either the split partitions or the original partition
};

let reduce_dimensions = (partition: Partition, params: LevelParameters) => {
  let reduceY = 0;
  let reduceX = 0;
  let translateX = 0;
  let translateY = 0;
  partition.connections.forEach((connection) => {
    if (connection.y === partition.y) reduceY++, translateY++;
    if (connection.y === partition.y + partition.h) reduceY++;
    if (connection.x === partition.x) reduceX++, translateX++;
    if (connection.x === partition.x + partition.w) reduceX++;
  });

  if (partition.w > 7) {
    partition.w -= translateX;
    partition.x += translateX;
  }
  if (partition.h > 7) {
    partition.h -= translateY;
    partition.y += translateY;
  }
};

let get_wall_rooms = (
  partitions: Array<Partition>,
  mapWidth: number,
  mapHeight: number,
): Array<Partition> => {
  return partitions.filter((partition, index) => {
    // Helper function to check if a specific path is clear
    const isPathClear = (
      direction: "left" | "right" | "top" | "bottom",
    ): boolean => {
      switch (direction) {
        case "left":
          for (let y = partition.y; y < partition.y + partition.h; y++) {
            let blocked = partitions.some((other) => {
              if (other === partition) return false;
              // Check if other partition overlaps this y-coordinate and is to the left
              return (
                other.y <= y &&
                y < other.y + other.h &&
                other.x + other.w > 0 &&
                other.x + other.w <= partition.x
              );
            });
            if (!blocked) return true; // Found at least one y without a blocker
          }
          return false;

        case "right":
          for (let y = partition.y; y < partition.y + partition.h; y++) {
            let blocked = partitions.some((other) => {
              if (other === partition) return false;
              // Check if other partition overlaps this y-coordinate and is to the right
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
              // Check if other partition overlaps this x-coordinate and is above
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
              // Check if other partition overlaps this x-coordinate and is below
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

    const hasLeftPath = isPathClear("left");
    const hasRightPath = isPathClear("right");
    const hasTopPath = isPathClear("top");
    const hasBottomPath = isPathClear("bottom");

    // Count the number of open paths
    const openPaths = [
      hasLeftPath,
      hasRightPath,
      hasTopPath,
      hasBottomPath,
    ].filter(Boolean).length;

    // Define wall rooms as those with exactly one open path
    const isWallRoom = openPaths === 1;

    return isWallRoom;
  });
};

let remove_wall_rooms = (
  partitions: Array<Partition>,
  w: number,
  h: number,
  prob: number = 1.0,
): Array<Partition> => {
  // Get all wall rooms
  const wallRooms = get_wall_rooms(partitions, w, h);

  // Remove wall rooms based on probability
  for (const wallRoom of wallRooms) {
    if (Random.rand() < prob) {
      partitions = partitions.filter((p) => p !== wallRoom);
    }
  }

  return partitions;
};

let populate_grid = (
  partitions: Array<Partition>,
  grid: Array<Array<Partition | false>>,
  w: number,
  h: number,
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
  map_h: number,
  depth: number,
  params: LevelParameters,
): Array<Partition> => {
  const {
    minRoomCount,
    maxRoomCount,
    maxRoomArea,
    splitProbabilities,
    wallRemoveProbability,
  } = params;

  let partitions = [new Partition(0, 0, map_w, map_h)];
  let grid = [];

  // Use splitProbabilities for splitting
  while (partitions.length < params.maxRoomCount) {
    for (let i = 0; i < splitProbabilities.length; i++) {
      partitions = split_partitions(partitions, splitProbabilities[i]);
    }
  }
  for (let i = 0; i < 100; i++) {
    partitions.forEach((partition) => {
      let roomArea =
        Math.random() > 0.95 ? params.softMaxRoomArea : params.maxRoomArea;
      if (partition.area() > roomArea) {
        partitions = partitions.filter((p) => p !== partition);
        partitions = partitions.concat(split_partition(partition, 0.5));
      }
    });
  }

  //visualize_partitions(partitions, map_w, map_h);
  partitions = remove_wall_rooms(
    partitions,
    map_w,
    map_h,
    wallRemoveProbability,
  );

  // Remove wall rooms based on probability
  /*
  if (partitions.length > params.minRoomCount) {
    for (let i = 0; i < 1; i++) {
      partitions = remove_wall_rooms(partitions, map_w, map_h, wallRemoveProbability);
    }
  }
  
  /*
    partitions = partitions.filter((p) => {
      if (p.area() > maxRoomArea && partitions.length > params.minRoomCount) {
        return false;
      }
      return true;
    });
   
    while (partitions.length > maxRoomCount) {
      partitions.pop();
    }
  */

  // Check if we have any partitions before proceeding
  if (partitions.length === 0) {
    return [];
  }

  //populate the grid with partitions
  partitions.sort((a, b) => a.area() - b.area());

  // Make sure we have at least one partition before assigning spawn
  if (partitions.length === 0) {
    console.log("No partitions generated after filtering.");
    return [];
  }

  let spawn = partitions[0];
  if (!spawn) {
    console.log("No spawn point found.");
    return [];
  }

  spawn.type = RoomType.START;
  if (partitions.length > 1) {
    partitions[partitions.length - 1].type = RoomType.BOSS;
  }

  let connected = [spawn];
  let frontier = [spawn];

  let found_boss = false;

  // connect rooms until we find the boss
  while (frontier.length > 0 && !found_boss) {
    let room = frontier[0];
    frontier.splice(0, 1);

    let doors_found = 0;
    const num_doors = Math.floor(Random.rand() * 2 + 1);

    let tries = 0;
    const max_tries = 1000;

    while (doors_found < num_doors && tries < max_tries) {
      let point = room.get_branch_point();
      for (const p of partitions) {
        if (
          p !== room &&
          connected.indexOf(p) === -1 &&
          p.point_next_to(point.x, point.y)
        ) {
          room.connections.push(new PartitionConnection(point.x, point.y, p));
          p.connections.push(new PartitionConnection(point.x, point.y, room));

          // Set open walls based on connection
          room.setOpenWall(new PartitionConnection(point.x, point.y, p));
          p.setOpenWall(new PartitionConnection(point.x, point.y, room));

          frontier.push(p);
          connected.push(p);
          doors_found++;
          if (p.type === RoomType.BOSS) found_boss = true;
          break;
        }
      }
      tries++;
    }
  }

  // remove rooms we haven't connected to yet
  for (const partition of partitions) {
    if (partition.connections.length === 0)
      partitions = partitions.filter((p) => p !== partition);
  }
  grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms

  // make sure we haven't removed all the rooms
  if (partitions.length === 0) {
    return []; // for now just return an empty list so we can retry
  }

  // make some loops
  let num_loop_doors = Math.floor(Random.rand() * 4 + 4);
  for (let i = 0; i < num_loop_doors; i++) {
    let roomIndex = Math.floor(Random.rand() * partitions.length);
    let room = partitions[roomIndex];

    let found_door = false;

    let tries = 0;
    const max_tries = 10;

    let not_already_connected = partitions.filter(
      (p) => !room.connections.some((c) => c.other === p),
    );

    while (!found_door && tries < max_tries) {
      let point = room.get_branch_point();
      for (const p of not_already_connected) {
        if (p !== room && p.point_next_to(point.x, point.y)) {
          room.connections.push(new PartitionConnection(point.x, point.y, p));
          p.connections.push(new PartitionConnection(point.x, point.y, room));

          // Set open walls based on connection
          room.setOpenWall(new PartitionConnection(point.x, point.y, p));
          p.setOpenWall(new PartitionConnection(point.x, point.y, room));

          found_door = true;
          break;
        }
      }
      tries++;
    }
  }

  // add stair room
  if (!partitions.some((p) => p.type === RoomType.BOSS)) return [];
  let boss = partitions.find((p) => p.type === RoomType.BOSS);
  let found_stair = false;
  const max_stair_tries = 100;
  for (let stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
    let stair = new Partition(
      Game.rand(boss.x - 1, boss.x + boss.w - 2, Random.rand),
      boss.y - 4,
      3,
      3,
    );
    stair.type = RoomType.DOWNLADDER;
    if (!partitions.some((p) => p.overlaps(stair))) {
      found_stair = true;
      partitions.push(stair);
      stair.connections.push(
        new PartitionConnection(stair.x + 1, stair.y + 3, boss),
      );
      boss.connections.push(
        new PartitionConnection(stair.x + 1, stair.y + 3, stair),
      );

      // Set open walls for stair and boss connection
      stair.setOpenWall(
        new PartitionConnection(stair.x + 1, stair.y + 3, boss),
      );
      boss.setOpenWall(
        new PartitionConnection(stair.x + 1, stair.y + 3, stair),
      );

      break;
    }
  }
  if (!found_stair) return [];

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

  // add special rooms
  let added_rope_hole = false;
  for (const p of partitions) {
    if (p.type === RoomType.DUNGEON) {
      if (p.distance > 4 && p.area() <= 30 && Random.rand() < 0.1) {
        p.type = RoomType.TREASURE;
      } else if (
        !added_rope_hole &&
        p.distance > 3 &&
        p.area() <= 20 &&
        Random.rand() < 0.5
      ) {
        p.type = RoomType.ROPEHOLE;
        added_rope_hole = true;
      }
    }
  }

  return partitions;
};

let generate_dungeon = (
  map_w: number,
  map_h: number,
  depth: number,
  params: LevelParameters,
): Array<Partition> => {
  let passes_checks = false;
  let partitions: Array<Partition>;

  let tries = 0;

  while (!passes_checks) {
    partitions = generate_dungeon_candidate(map_w, map_h, depth, params);

    passes_checks = true;
    if (partitions.length < params.minRoomCount) passes_checks = false;
    if (!partitions.some((p) => p.type === RoomType.BOSS))
      passes_checks = false;
    else if (partitions.find((p) => p.type === RoomType.BOSS).distance < 3)
      passes_checks = false;

    tries++;
    //if (tries > 100) break;
  }
  //partitions.forEach((partition) => reduce_dimensions(partition, params));
  return partitions;
};

let generate_cave_candidate = (
  map_w: number,
  map_h: number,
  num_rooms: number,
): Array<Partition> => {
  let partitions = [new Partition(0, 0, map_w, map_h)];
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
    (partition) => partition.connections.length > 0,
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
      (p) => !room.connections.some((c) => c.other === p),
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
  width: number = 7,
): Array<Partition> => {
  let partitions: Array<Partition>;

  partitions = [new Partition(0, 0, height, width)];
  partitions[0].type = RoomType.TUTORIAL;

  return partitions;
};

let visualize_partitions = (
  partitions: Array<Partition>,
  mapWidth: number,
  mapHeight: number,
) => {
  // Create grid with padded spaces
  const grid = Array.from(
    { length: mapHeight },
    () => Array(mapWidth).fill(" . "), // Pad dots with spaces
  );

  // Calculate the maximum number of digits needed
  const maxIndex = partitions.length - 1;
  const padLength = maxIndex.toString().length;

  partitions.forEach((partition, index) => {
    // Pad the index number with spaces to maintain consistent width
    const paddedIndex = index.toString().padStart(padLength, " ");

    for (let x = partition.x; x < partition.x + partition.w; x++) {
      for (let y = partition.y; y < partition.y + partition.h; y++) {
        if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
          grid[y][x] = ` ${paddedIndex} `; // Pad numbers with spaces
        }
      }
    }
  });

  console.log("Partition Layout:");
  console.log(
    "   " + [...Array(mapWidth)].map((_, i) => i % 10).join("  ") + " X",
  ); // Column headers
  grid.forEach((row, index) => {
    const paddedIndex = index.toString().padStart(2, " ");
    console.log(`${paddedIndex} ${row.join("")}`);
  });
  console.log("Y");
};

let check_overlaps = (partitions: Array<Partition>): boolean => {
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
        console.log(
          `Overlap detected between Partition ${i} and Partition ${j}`,
        );
        return true;
      }
    }
  }
  return false;
};

export class LevelGenerator {
  game: Game;
  seed: number;
  depthReached = 0;
  currentFloorFirstLevelID = 0;

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

  createLevel = (depth: number) => {
    let newLevel = new Level(this.game, depth, 100, 100);
    this.game.levels.push(newLevel);
    this.game.level = newLevel;
  };

  getRooms = (
    partitions: Array<Partition>,
    depth: number,
    mapGroup: number,
  ): Array<Room> => {
    //this.setOpenWallsForPartitions(partitions, 35, 35); // Using standard map size

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
        this.game.levels[depth],
        Random.rand,
        partition.isTopOpen, // New parameter
        partition.isRightOpen, // New parameter
        partition.isBottomOpen, // New parameter
        partition.isLeftOpen, // New parameter
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

    for (let room of rooms) {
      room.populate(Random.rand);
    }

    return rooms;
  };

  setSeed = (seed: number) => {
    this.seed = seed;
  };

  generate = (game: Game, depth: number, cave = false): Room => {
    const params: LevelParameters =
      LevelParameterGenerator.getParameters(depth);
    let dimensions = params.mapWidth; // Assuming square maps for simplicity
    this.depthReached = depth;

    // Set the random state based on the seed and depth
    Random.setState(this.seed + depth);

    this.game = game;

    // Determine the map group
    let mapGroup =
      this.game.rooms.length > 0
        ? this.game.rooms[this.game.rooms.length - 1].mapGroup + 1
        : 0;

    // Generate partitions based on whether it's a cave or a dungeon
    let partitions = cave
      ? generate_cave(20, 20) // You might want to make these dynamic based on params
      : generate_dungeon(dimensions, dimensions, depth, params);

    // Call this function before get_wall_rooms
    if (check_overlaps(partitions)) {
      console.warn("There are overlapping partitions.");
    }

    // Get the levels based on the partitions
    this.createLevel(depth);
    let rooms = this.getRooms(partitions, depth, mapGroup);
    console.log(`mapGroup: ${mapGroup}`);
    console.log(`depth: ${depth}`);

    // Update the current floor first level ID if it's not a cave
    if (!cave) this.currentFloorFirstLevelID = this.game.rooms.length;

    // Add the new levels to the game rooms
    this.game.rooms = [...this.game.rooms, ...rooms];

    // Generate the rope hole if it exists
    for (let room of rooms) {
      if (room.type === RoomType.ROPEHOLE) {
        for (let x = room.roomX; x < room.roomX + room.width; x++) {
          for (let y = room.roomY; y < room.roomY + room.height; y++) {
            let tile = room.roomArray[x][y];
            if (tile instanceof DownLadder && tile.isRope) {
              tile.generate();
              return cave
                ? rooms.find((r) => r.type === RoomType.ROPECAVE)
                : rooms.find((r) => r.type === RoomType.START);
            }
          }
        }
      }
    }

    // Return the start room or the rope cave room
    return cave
      ? rooms.find((r) => r.type === RoomType.ROPECAVE)
      : rooms.find((r) => r.type === RoomType.START);
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
