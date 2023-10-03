import { Game } from "./game";
import { Level, RoomType } from "./level";
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

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = RoomType.DUNGEON;
    this.connections = [];
    this.distance = 1000;
  }

  split = () => {
    let rand_mid = () => {
      let center = 0.5;
      let width = 0.6;
      return (Random.rand() - 0.5) * width + center;
    };

    let MIN_SIZE = 3;

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

  get_branch_point = (): { x: number; y: number } => {
    let points = [];
    for (let x = this.x; x < this.x + this.w; x++) {
      //count up from the partitions x to it's width
      points.push({ x: x, y: this.y - 1 /*one row above partition*/ });
      points.push({ x: x, y: this.y + this.h /*one row below partition*/ });
    }// pushes the points above and below the partition
    for (let y = this.y; y < this.y + this.h; y++) {
      points.push({ x: this.x - 1, y: y });
      points.push({ x: this.x + this.w, y: y });
    }//pushes points to left an right of the partition
    points = points.filter(
      (p) =>
        !this.connections.some(
          (c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1
          
        )
        //if the sum of the distance between the input x and y values and the partitions x and y values is > 1
        //delete those from the points array
    );
    points.sort(() => 0.5 - Random.rand());
    return points[0];//return first or last object of x y points in array points
  };
}//end of Partition class

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

let remove_wall_rooms = (
  partitions: Array<Partition>,
  w: number,
  h: number
): Array<Partition> => {
  for (const partition of partitions) {
    if (
      partition.x === 0 ||
      partition.y === 0 ||
      partition.x + partition.w === w ||
      partition.y + partition.h === h
      //delete any partition where the x or y is zero
    ) {
      partitions = partitions.filter((p) => p != partition);
    }
  }
  return partitions;
  //return partitions array with no wall rooms
};

let populate_grid = (
  partitions: Array<Partition>,
  grid: Array<Array<Partition | false>>,
  w: number,
  h: number
): Array<Array<Partition | false>> => {
  for (let x = 0; x < w; x++) {//loop through the horizontal tiles
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
  let partitions = [new Partition(0, 0, map_w, map_h)];
  let grid = [];
  //add a new partition and define grid as empty array

  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.75);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 1);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.5);
  //split partitions 3 times with different probabilities
  partitions = remove_wall_rooms(partitions, map_w, map_h);
  grid = populate_grid(partitions, grid, map_w, map_h);
//remove wall rooms and populate dat grid
  partitions.sort((a, b) => a.area() - b.area());
//sort the partitions list by ... area? I think?
  let spawn = partitions[0];
  //spawn is the first Partition instance
  spawn.type = RoomType.START;
  //set the roomtype for the partition accordingly
  partitions[partitions.length - 1].type = RoomType.BOSS;
  //set the largest room as boss room?

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
    const max_tries = 100;

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
    const max_tries = 100;

    let not_already_connected = partitions.filter(
      (p) => !room.connections.some((c) => c.other === p)
    );

    while (!found_door && tries < max_tries) {
      let point = room.get_branch_point();
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
      3
    );
    stair.type = RoomType.DOWNLADDER;
    if (!partitions.some((p) => p.overlaps(stair))) {
      found_stair = true;
      partitions.push(stair);
      stair.connections.push(
        new PartitionConnection(stair.x + 1, stair.y + 3, boss)
      );
      boss.connections.push(
        new PartitionConnection(stair.x + 1, stair.y + 3, stair)
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

let generate_dungeon = (map_w: number, map_h: number): Array<Partition> => {
  let passes_checks = false;
  let partitions;

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
    if (tries > 100) break;
  }

  return partitions;
};

let generate_cave_candidate = (
  map_w: number,
  map_h: number,
  num_rooms: number
): Array<Partition> => {
  let partitions = [new Partition(0, 0, map_w, map_h)];
  let grid = [];

  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.75);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 1);
  for (let i = 0; i < 3; i++) partitions = split_partitions(partitions, 0.5);
  grid = populate_grid(partitions, grid, map_w, map_h);

  partitions.sort((a, b) => a.area() - b.area());

  let spawn = partitions[0];
  spawn.type = RoomType.ROPECAVE;
  for (let i = 1; i < partitions.length; i++)
    partitions[i].type = RoomType.CAVE;

  let connected = [spawn];
  let frontier = [spawn];

  // connect rooms until we find the boss
  while (frontier.length > 0 && connected.length < num_rooms) {
    let room = frontier[0];
    frontier.splice(0, 1);

    let doors_found = 0;
    const num_doors = Math.floor(Random.rand() * 2 + 1);

    let tries = 0;
    const max_tries = 100;

    while (
      doors_found < num_doors &&
      tries < max_tries &&
      connected.length < num_rooms
    ) {
      let point = room.get_branch_point();
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
    const max_tries = 100;

    let not_already_connected = partitions.filter(
      (p) => !room.connections.some((c) => c.other === p)
    );

    while (!found_door && tries < max_tries) {
      let point = room.get_branch_point();
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

let generate_cave = (map_w: number, map_h: number): Array<Partition> => {
  let passes_checks = false;
  let partitions;

  while (!passes_checks) {
    const NUM_ROOMS = 100;
    partitions = generate_cave_candidate(map_w, map_h, NUM_ROOMS);

    passes_checks = true;
    if (partitions.length < NUM_ROOMS) passes_checks = false;
  }

  return partitions;
};

export class LevelGenerator {
  game: Game;
  seed: number;
  depthReached = 0;
  currentFloorFirstLevelID = 0;

  getLevels = (
    partitions: Array<Partition>,
    depth: number,
    mapGroup: number
  ): Array<Level> => {
    let levels: Array<Level> = [];

    for (let i = 0; i < partitions.length; i++) {
      let level = new Level(
        this.game,
        partitions[i].x - 1,
        partitions[i].y - 1,
        partitions[i].w + 2,
        partitions[i].h + 2,
        partitions[i].type,
        depth,
        mapGroup,
        Random.rand
      );
      levels.push(level);
    }

    let doors_added: Array<Door> = [];

    for (let i = 0; i < partitions.length; i++) {
      for (const connection of partitions[i].connections) {
        let d = levels[i].addDoor(connection.x, connection.y);
        let existing_door = doors_added.find((e) => e.x === d.x && e.y === d.y);
        if (existing_door) {
          existing_door.link(d);
          d.link(existing_door);
        }
        doors_added.push(d);
      }
    }

    for (let level of levels) {
      level.populate(Random.rand);
    }

    return levels;
  };

  setSeed = (seed: number) => {
    this.seed = seed;
  };

  generate = (game: Game, depth: number, cave = false): Level => {
    console.assert(
      cave || this.depthReached === 0 || depth === this.depthReached + 1
    );
    this.depthReached = depth;

    Random.setState(this.seed + depth);

    this.game = game;

    let mapGroup = 0;
    if (this.game.levels.length > 0)
      mapGroup = this.game.levels[this.game.levels.length - 1].mapGroup + 1;

    let partitions;
    if (cave) partitions = generate_cave(20, 20);
    else partitions = generate_dungeon(35, 35);
    let levels = this.getLevels(partitions, depth, mapGroup);

    let numExistingLevels = this.game.levels.length;
    if (!cave) this.currentFloorFirstLevelID = numExistingLevels;
    this.game.levels = this.game.levels.concat(levels);

    for (
      let i = numExistingLevels;
      i < numExistingLevels + levels.length;
      i++
    ) {
      let found = false;
      if (this.game.levels[i].type === RoomType.ROPEHOLE) {
        for (
          let x = this.game.levels[i].roomX;
          x < this.game.levels[i].roomX + this.game.levels[i].width;
          x++
        ) {
          for (
            let y = this.game.levels[i].roomY;
            y < this.game.levels[i].roomY + this.game.levels[i].height;
            y++
          ) {
            let tile = this.game.levels[i].levelArray[x][y];
            if (tile instanceof DownLadder && tile.isRope) {
              tile.generate();
              found = true;
            }
          }
        }
      }
      if (found) break;
    }

    if (cave) return levels.find((l) => l.type === RoomType.ROPECAVE);
    else return levels.find((l) => l.type === RoomType.START);
  };

  generateFirstNFloors = (game, numFloors) => {
    this.generate(game, 0, false);
    for (let i = 0; i < numFloors; i++) {
      let found = false;
      for (let j = this.game.levels.length - 1; j >= 0; j--) {
        if (this.game.levels[j].type === RoomType.DOWNLADDER) {
          for (
            let x = this.game.levels[j].roomX;
            x < this.game.levels[j].roomX + this.game.levels[j].width;
            x++
          ) {
            for (
              let y = this.game.levels[j].roomY;
              y < this.game.levels[j].roomY + this.game.levels[j].height;
              y++
            ) {
              let tile = this.game.levels[j].levelArray[x][y];
              if (tile instanceof DownLadder) {
                tile.generate();
                found = true;
              }
            }
          }
        }

        if (found) break;
      }
    }
  };
}
