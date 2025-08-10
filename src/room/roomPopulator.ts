import { Barrel } from "../entity/object/barrel";
import { Block } from "../entity/object/block";
import { Crate } from "../entity/object/crate";
import { Pumpkin } from "../entity/object/pumpkin";
import { TombStone } from "../entity/object/tombStone";
import { Game } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import {
  environmentData,
  enemyClassToId,
  enemyMinimumDepth,
  EnemyInfo,
} from "../level/environment";
import { DownLadder } from "../tile/downLadder";
import { EnvType } from "../constants/environmentTypes";
import { LockType } from "../tile/lockable";
import { Level } from "../level/level";
import { Random } from "../utility/random";
import { Utils } from "../utility/utils";
import { ClusteringOptions, PropClusterer } from "./propClusterer";
import { Room, RoomType } from "./room";
import { DownladderMaker } from "../entity/downladderMaker";
import { Enemy } from "../entity/enemy/enemy";
import { Direction } from "../game";
import { WallTorch } from "../tile/wallTorch";
import { Wall } from "../tile/wall";
import { SpikeTrap } from "../tile/spiketrap";
import { Chasm } from "../tile/chasm";
import { Floor } from "../tile/floor";
import { SpawnFloor } from "../tile/spawnfloor";
import { VendingMachine } from "../entity/object/vendingMachine";
import { Chest } from "../entity/object/chest";
import { Bomb } from "../entity/object/bomb";
import { Resource } from "../entity/resource/resource";
import { Heart } from "../item/usable/heart";
import { Candle } from "../item/light/candle";
import { Armor } from "../item/armor";
import { Spear } from "../item/weapon/spear";
import { Torch } from "../item/light/torch";
import { Item } from "../item/item";
import { GoldenKey } from "../item/goldenKey";
import { FountainTile } from "../tile/fountainTile";
import { InsideLevelDoor } from "../tile/insideLevelDoor";
import { Button } from "../tile/button";
import { UpLadder } from "../tile/upLadder";
// (keep single import)
import { ItemGroup } from "../item/itemGroup";
import { Warhammer } from "../item/weapon/warhammer";
import { Sword } from "../item/weapon/sword";
import { Pickaxe } from "../item/tool/pickaxe";
import { Shotgun } from "../item/weapon/shotgun";
import { Tile } from "../tile/tile";
import { Entity } from "../entity/entity";
import { CrabEnemy } from "../entity/enemy/crabEnemy";
import { FrogEnemy } from "../entity/enemy/frogEnemy";
import { ZombieEnemy } from "../entity/enemy/zombieEnemy";
import { SkullEnemy } from "../entity/enemy/skullEnemy";
import { EnergyWizardEnemy } from "../entity/enemy/energyWizard";
import { ChargeEnemy } from "../entity/enemy/chargeEnemy";
import { RookEnemy } from "../entity/enemy/rookEnemy";
import { BishopEnemy } from "../entity/enemy/bishopEnemy";
import { ArmoredzombieEnemy } from "../entity/enemy/armoredzombieEnemy";
import { BigSkullEnemy } from "../entity/enemy/bigSkullEnemy";
import { QueenEnemy } from "../entity/enemy/queenEnemy";
import { KnightEnemy } from "../entity/enemy/knightEnemy";
import { BigKnightEnemy } from "../entity/enemy/bigKnightEnemy";
import { ArmoredSkullEnemy } from "../entity/enemy/armoredSkullEnemy";
import { FireWizardEnemy } from "../entity/enemy/fireWizard";
import { OccultistEnemy } from "../entity/enemy/occultistEnemy";
import { Spawner } from "../entity/enemy/spawner";
import { BigZombieEnemy } from "../entity/enemy/bigZombieEnemy";
import { CoalResource } from "../entity/resource/coalResource";
import { GoldResource } from "../entity/resource/goldResource";
import { EmeraldResource } from "../entity/resource/emeraldResource";
import { Pool } from "../tile/pool";

// Add after the imports, create a reverse mapping from ID to enemy name
const enemyIdToName: Record<number, string> = {};
for (const [enemyClass, id] of enemyClassToId.entries()) {
  enemyIdToName[id] = enemyClass.name;
}

export class Populator {
  level: Level;
  medianDensity: number;
  private props: { x: number; y: number }[] = [];
  addedDownladder: boolean = false;
  private levelEnemyPoolIds: number[]; // Add this property to store the calculated enemy pool
  private skipPopulation: boolean = false;

  constructor(level: Level, skipPopulation: boolean = false) {
    this.level = level;
    this.props = [];
    this.medianDensity = GameplaySettings.MEDIAN_ROOM_DENSITY;

    // Calculate enemy pool once for this level
    this.levelEnemyPoolIds = this.generateEnemyPoolIds(this.level.depth);
  }

  populateRooms = () => {
    if (this.skipPopulation) return;

    this.level.rooms.forEach((room) => {
      this.addEnvironmentalFeatures(room, Random.rand);
    });

    for (let room of this.level.rooms) {
      this.populate(room, Random.rand);
    }

    this.level.rooms.forEach((room) => {
      if (
        room.type === RoomType.START ||
        room.type === RoomType.DOWNLADDER ||
        room.type === RoomType.UPLADDER ||
        room.type === RoomType.ROPEHOLE
      )
        return;

      this.populateByEnvironment(room);
    });

    // Centralized torch, spike, and pool addition

    this.addDownladder();

    //this.level.distributeKeys();
  };

  populateByEnvironment = (room: Room) => {
    switch (room.envType) {
      case EnvType.CAVE:
        this.populateCaveEnvironment(room);
        break;
      case EnvType.FOREST:
        this.populateForestEnvironment(room);
        break;
      default:
        this.populateDefaultEnvironment(room);
        break;
    }
  };

  addDownladder = () => {
    if (this.level.environment.type !== EnvType.DUNGEON) return;
    const rooms = this.level.rooms.filter(
      (room) =>
        room.type !== RoomType.START &&
        room.type !== RoomType.DOWNLADDER &&
        room.type !== RoomType.UPLADDER &&
        room.type !== RoomType.ROPEHOLE &&
        room.type !== RoomType.BOSS,
    );

    const downLadderRoom = rooms[Math.floor(Random.rand() * rooms.length)];

    console.log(
      `Selected room for downladder: Type=${downLadderRoom.type}, Doors=${downLadderRoom.doors.length}`,
    );

    // Use the new method to get empty tiles that don't block doors
    const validTiles = downLadderRoom.getEmptyTilesNotBlockingDoors();

    if (validTiles.length === 0) {
      console.warn("No valid positions for downladder that don't block doors");
      return;
    }

    const position = downLadderRoom.getRandomEmptyPosition(validTiles);
    if (
      position === null ||
      position.x === undefined ||
      position.y === undefined
    )
      return;

    console.log(
      `Placing downladder at position (${position.x}, ${position.y})`,
    );

    // Place a DownLadder tile directly; avoid entity side-effects post-load
    const env =
      downLadderRoom.depth < 1
        ? EnvType.FOREST
        : downLadderRoom.depth > 1
          ? Random.rand() < 0.5
            ? EnvType.FOREST
            : EnvType.CAVE
          : EnvType.CAVE;
    const dl = new DownLadder(
      downLadderRoom,
      this.level.game,
      position.x,
      position.y,
      true,
      env,
      LockType.NONE,
    );
    if (dl.lockable.isLocked()) {
      console.log("adding key to downladder");
      this.level.distributeKey(dl);
    }
    downLadderRoom.roomArray[position.x][position.y] = dl;
  };

  populateByType = (room: Room) => {};

  private addProps(room: Room, numProps: number, envType?: EnvType) {
    const envData = envType
      ? environmentData[envType]
      : environmentData[room.level.environment.type];
    let tiles = room.getEmptyTiles();

    for (let i = 0; i < numProps; i++) {
      if (tiles.length === 0) break;

      const position = room.getRandomEmptyPosition(tiles);
      if (position === null) break;
      const { x, y } = position;
      const selectedProp = Utils.randTableWeighted(envData.props);

      if (selectedProp && selectedProp.class && selectedProp.class.add) {
        const args = selectedProp.additionalParams || [];
        selectedProp.class.add(room, room.game, x, y, ...args);
      }
    }
  }

  /**
   * Adds props with clustering behavior - entities are more likely to be placed near existing entities
   * @param room - The room to populate
   * @param numProps - Number of props to place
   * @param envType - Environment type for prop selection
   * @param clusteringOptions - Optional clustering configuration
   */
  private addPropsWithClustering(
    room: Room,
    numProps: number,
    envType?: EnvType,
    clusteringOptions?: ClusteringOptions,
  ) {
    const envData = envType
      ? environmentData[envType]
      : environmentData[room.level.environment.type];

    const clusterer = new PropClusterer(room, clusteringOptions);
    const positions = clusterer.generateClusteredPositions(numProps);

    for (const { x, y } of positions) {
      const selectedProp = Utils.randTableWeighted(envData.props);

      if (selectedProp && selectedProp.class && selectedProp.class.add) {
        const args = selectedProp.additionalParams || [];
        selectedProp.class.add(room, room.game, x, y, ...args);
      }
    }
  }

  private populateDungeonEnvironment(room: Room) {
    this.populateDefaultEnvironment(room);
  }

  private populateCaveEnvironment(room: Room) {
    const numProps = this.getNumProps(room);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });

    // ADD: Enemies after props, based on remaining space
    this.addRandomEnemies(room);
  }

  private populateForestEnvironment(room: Room) {
    const numProps = this.getNumProps(room, 0.75);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });

    // ADD: Enemies after props, based on remaining space
    this.addRandomEnemies(room);
  }

  private getNumProps(room: Room, medianDensity?: number) {
    medianDensity = medianDensity || this.medianDensity;
    const numEmptyTiles = room.getEmptyTiles().length;
    const numProps = Utils.randomNormalInt(0, numEmptyTiles, {
      median: Math.ceil(medianDensity * numEmptyTiles),
    });
    const percentFull = Math.round((numProps / numEmptyTiles) * 100);
    //console.log("percentFull", `${percentFull}%`);
    return numProps;
  }

  private populateDefaultEnvironment(room: Room) {
    const numProps = this.getNumProps(room);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });

    // ADD: Enemies after props, based on remaining space
    this.addRandomEnemies(room);
  }

  // #region TILE ADDING METHODS
  private addDoorTorches(room: Room, x: number, y: number, doorDir: Direction) {
    if (doorDir !== Direction.UP && doorDir !== Direction.DOWN) {
      return;
    }

    if (x && y) {
      room.calculateWallInfo();
      const leftWallInfo = room.wallInfo.get(`${x - 1},${y}`);
      const rightWallInfo = room.wallInfo.get(`${x + 1},${y}`);
      const leftTile = room.roomArray[x - 1]?.[y];
      const rightTile = room.roomArray[x + 1]?.[y];
      const leftOpen = leftWallInfo?.isLeftWall === false;
      const rightOpen = rightWallInfo?.isRightWall === false;

      if (leftOpen) {
        room.roomArray[x - 1][y] = new WallTorch(room, x - 1, y);
      }

      if (rightOpen) {
        room.roomArray[x + 1][y] = new WallTorch(room, x + 1, y);
      }
    }
  }

  private addTorches(
    room: Room,
    numTorches: number,
    rand: () => number,
    placeX?: number,
    placeY?: number,
  ) {
    if (
      room.level.environment.type === EnvType.FOREST &&
      room.type !== RoomType.DOWNLADDER
    )
      return;

    if (
      placeX !== undefined &&
      placeY !== undefined &&
      room.roomArray[placeX]?.[placeY] instanceof Wall
    ) {
      room.roomArray[placeX][placeY] = new WallTorch(room, placeX, placeY);

      return;
    }

    let walls = [];
    for (let xx = room.roomX + 1; xx < room.roomX + room.width - 2; xx++) {
      for (let yy = room.roomY; yy < room.roomY + room.height - 1; yy++) {
        if (
          room.roomArray[xx][yy] instanceof Wall &&
          !(room.roomArray[xx][yy + 1] instanceof Wall)
        ) {
          walls.push(room.roomArray[xx][yy]);
        }
      }
    }
    let bottomWalls = [];
    // Separate loop for bottom wall
    for (let xx = room.roomX + 1; xx < room.roomX + room.width - 2; xx++) {
      const yy = room.roomY + room.height - 1; // Bottom wall
      if (
        room.roomArray[xx][yy] instanceof Wall &&
        !(room.roomArray[xx][yy + 1] instanceof Wall)
      ) {
        bottomWalls.push(room.roomArray[xx][yy]);
      }
    }

    // Randomly distribute torches between walls and bottom walls
    const wallTorches = Game.rand(0, numTorches, rand);
    const bottomWallTorches = numTorches - wallTorches;

    for (let i = 0; i < wallTorches; i++) {
      if (walls.length == 0) break;
      const randomIndex = Game.rand(0, walls.length - 1, rand);
      const t = walls.splice(randomIndex, 1)[0];
      const x = t.x;
      const y = t.y;
      room.roomArray[x][y] = new WallTorch(room, x, y);
    }
    for (let i = 0; i < bottomWallTorches; i++) {
      if (bottomWalls.length == 0) break;
      const randomIndex = Game.rand(0, bottomWalls.length - 1, rand);
      const t = bottomWalls.splice(randomIndex, 1)[0];
      const x = t.x;
      const y = t.y;
      room.roomArray[x][y] = new WallTorch(room, x, y, true);
    }
  }

  private addRectangularTileArea<
    T extends new (
      room: Room,
      x: number,
      y: number,
      leftEdge: boolean,
      rightEdge: boolean,
      topEdge: boolean,
      bottomEdge: boolean,
    ) => any,
  >(room: Room, rand: () => number, TileClass: T) {
    let w = Game.rand(2, 4, rand);
    let h = Game.rand(2, 4, rand);
    let xmin = room.roomX + 2;
    let xmax = room.roomX + room.width - w - 2;
    let ymin = room.roomY + 2;
    let ymax = room.roomY + room.height - h - 2;
    if (xmax < xmin || ymax < ymin) return;
    let x = Game.rand(xmin, xmax, rand);
    let y = Game.rand(ymin, ymax, rand);

    for (let xx = x - 1; xx < x + w + 1; xx++) {
      for (let yy = y - 1; yy < y + h + 1; yy++) {
        // add a floor border
        if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h) {
          const tile = room.roomArray[xx][yy];
          if (
            !(tile instanceof SpawnFloor && !tile.isSolid()) &&
            !(tile instanceof Wall) &&
            !(tile instanceof Pool) &&
            !(tile instanceof Chasm)
          )
            room.roomArray[xx][yy] = new Floor(room, xx, yy);
        } else
          room.roomArray[xx][yy] = new TileClass(
            room,
            xx,
            yy,
            xx === x,
            xx === x + w - 1,
            yy === y,
            yy === y + h - 1,
          );
      }
    }
  }

  private addChasms(room: Room, rand: () => number) {
    this.addRectangularTileArea(room, rand, Chasm);
  }

  private addPools(room: Room, rand: () => number) {
    this.addRectangularTileArea(room, rand, Pool);
  }

  private addSpikeTraps(room: Room, numSpikes: number, rand: () => number) {
    if (
      room.level.environment.type === EnvType.FOREST ||
      room.envType === EnvType.FOREST
    )
      return;
    // add spikes
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      const position = room.getRandomEmptyPosition(tiles);
      if (position === null) break;
      const { x, y } = position;
      room.roomArray[x][y] = new SpikeTrap(room, x, y);
    }
  }
  // #endregion

  // #region ADDING ENTITIES

  /**
   * Elegant enemy spawning that combines environment selection with progression control
   */
  private addEnemiesUnified(room: Room, numEnemies: number, envType?: EnvType) {
    if (GameplaySettings.NO_ENEMIES === true) return;

    // Get filtered enemies using our centralized logic
    const availableEnemies = this.getAvailableEnemiesForRoom(room, envType);

    if (availableEnemies.length === 0) {
      console.log(
        `No enemies available for environment ${envType || room.level.environment.type} at depth ${room.depth}`,
      );
      return;
    }

    // Use existing spawning logic with filtered enemies
    this.spawnEnemiesFromPool(room, numEnemies, availableEnemies);

    // Add special enemies (spawners, occultists)
    this.addSpecialEnemies(room);
  }

  /**
   * Core method: Get available enemies filtered by environment and progression
   */
  private getAvailableEnemiesForRoom(
    room: Room,
    envType?: EnvType,
  ): EnemyInfo[] {
    const environment = envType || room.level.environment.type;
    const envData = environmentData[environment];

    // Use pre-calculated enemy pool instead of generating it for each room
    const allowedEnemyIds = this.levelEnemyPoolIds;

    // Filter environment enemies by allowed pool and add IDs
    const availableEnemies = envData.enemies
      .map((enemy) => ({
        ...enemy,
        id: enemyClassToId.get(enemy.class), // Add ID dynamically
      }))
      .filter(
        (enemy) =>
          enemy.id &&
          allowedEnemyIds.includes(enemy.id) &&
          (enemy.minDepth ?? 0) <= room.depth,
      );

    console.log(
      `Depth ${room.depth}, Env ${environment}: Pool [${allowedEnemyIds.map((id) => enemyIdToName[id] || `Unknown(${id})`).join(", ")}] -> Available [${availableEnemies.map((e) => enemyIdToName[e.id!] || `Unknown(${e.id})`).join(", ")}]`,
    );

    return availableEnemies;
  }

  /**
   * Spawn enemies from the filtered pool using existing logic
   */
  private spawnEnemiesFromPool(
    room: Room,
    numEnemies: number,
    enemyPool: EnemyInfo[],
  ) {
    let tiles = room.getEmptyTiles();
    if (tiles.length === 0) return;

    // Existing door avoidance logic
    const excludedCoords = new Set<string>();
    for (const door of room.doors) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          excludedCoords.add(`${door.x + dx},${door.y + dy}`);
        }
      }
    }
    tiles = tiles.filter((tile) => !excludedCoords.has(`${tile.x},${tile.y}`));

    // Spawn enemies
    for (let i = 0; i < numEnemies; i++) {
      if (tiles.length === 0) break;
      const position = room.getRandomEmptyPosition(tiles);
      if (position === null) break;
      const { x, y } = position;

      const selectedEnemy = Utils.randTableWeighted(enemyPool);
      if (!selectedEnemy?.class?.add) continue;

      const args = selectedEnemy.additionalParams || [];

      // Handle special spawn logic
      if (selectedEnemy.specialSpawnLogic === "clearFloor") {
        const enemy = new selectedEnemy.class(room, room.game, x, y, ...args);
        if (this.canPlaceBigEnemy(room, enemy, x, y, tiles)) {
          room.entities.push(enemy);
          this.clearFloorForBigEnemy(room, x, y, enemy.w, enemy.h);
          this.removeTilesForEnemy(tiles, x, y, enemy.w, enemy.h);
        } else {
          numEnemies++; // Retry
        }
      } else {
        selectedEnemy.class.add(room, room.game, x, y, ...args);
        tiles = tiles.filter((t) => !(t.x === x && t.y === y));
      }
    }
  }

  /**
   * Add special enemies (spawners, occultists) - extracted for clarity
   */
  private addSpecialEnemies(room: Room) {
    // Spawner logic - now based on room area and probability
    if (room.depth > GameplaySettings.SPAWNER_MIN_DEPTH) {
      this.addSpawners(room, Random.rand);
    }

    // Occultist logic - now based on room area and probability
    if (room.depth > GameplaySettings.OCCULTIST_MIN_DEPTH) {
      this.addOccultists(room, Random.rand);
    }
  }

  // === ENEMY POOL GENERATION LOGIC (moved from Level) ===

  /**
   * Generate enemy pool IDs based on depth and progression rules
   */
  private generateEnemyPoolIds(depth: number): number[] {
    const availableEnemies = Object.entries(enemyMinimumDepth)
      .filter(([enemyId, minDepth]) => depth >= minDepth)
      .map(([enemyId]) => Number(enemyId));

    // Get new enemies not yet encountered
    const newEnemies = availableEnemies.filter(
      (id) => !this.level.game.encounteredEnemies.includes(id),
    );

    // Add 1-2 new enemies per level (if limiting is enabled)
    const newEnemiesToAddCount = GameplaySettings.LIMIT_ENEMY_TYPES
      ? Math.min(newEnemies.length, GameplaySettings.NEW_ENEMIES_PER_LEVEL)
      : newEnemies.length;

    const newEnemiesToAdd = this.getRandomElements(
      newEnemies,
      newEnemiesToAddCount,
    );
    this.level.game.encounteredEnemies.push(...newEnemiesToAdd);

    // Get current enemy pool
    const enemyPoolIds = this.level.game.encounteredEnemies.slice();

    // Limit variety if setting is enabled
    const numberOfTypes = GameplaySettings.LIMIT_ENEMY_TYPES
      ? this.getNumberOfEnemyTypes(depth)
      : enemyPoolIds.length;

    const selectedEnemyIds = this.getRandomElements(
      enemyPoolIds,
      numberOfTypes,
    );
    return Array.from(new Set(selectedEnemyIds)).slice(0, numberOfTypes);
  }

  /**
   * Public method to get enemy pool for spawners and other external use
   */
  public getEnemyPoolForDepth(depth: number): number[] {
    // Use pre-calculated pool instead of generating new one, but filter by depth if different
    if (depth === this.level.depth) {
      return this.levelEnemyPoolIds;
    }
    // If a different depth is requested, generate it on demand (for spawners that might spawn at different depths)
    return this.generateEnemyPoolIds(depth);
  }

  /**
   * Calculate number of enemy types for depth
   */
  private getNumberOfEnemyTypes(depth: number): number {
    return depth === 0
      ? GameplaySettings.DEPTH_ZERO_ENEMY_TYPES
      : Math.ceil(Math.sqrt(depth + 1)) +
          GameplaySettings.ENEMY_TYPES_BASE_COUNT;
  }

  /**
   * Utility: Get random elements from array
   */
  private getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Random.rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Check if a big enemy can be placed at the given position
   */
  private canPlaceBigEnemy(
    room: Room,
    enemy: Entity,
    x: number,
    y: number,
    tiles: any[],
  ): boolean {
    for (let xx = 0; xx < enemy.w; xx++) {
      for (let yy = 0; yy < enemy.h; yy++) {
        if (!tiles.some((tile) => tile.x === x + xx && tile.y === y + yy)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Clear floor tiles for big enemies (preserves existing logic)
   */
  private clearFloorForBigEnemy(
    room: Room,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    for (let xx = 0; xx < w; xx++) {
      for (let yy = 0; yy < h; yy++) {
        room.roomArray[x + xx][y + yy] = new Floor(room, x + xx, y + yy);
      }
    }
  }

  /**
   * Remove tiles that are now occupied by an enemy
   */
  private removeTilesForEnemy(
    tiles: any[],
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    for (let xx = 0; xx < w; xx++) {
      for (let yy = 0; yy < h; yy++) {
        const index = tiles.findIndex((t) => t.x === x + xx && t.y === y + yy);
        if (index !== -1) tiles.splice(index, 1);
      }
    }
  }

  private addRandomEnemies(room: Room) {
    const numEmptyTiles = room.getEmptyTiles().length;
    const meanValue = (room.roomArea + numEmptyTiles) / 2;

    const factor = Math.min(
      (room.depth + GameplaySettings.ENEMY_DENSITY_DEPTH_OFFSET) *
        GameplaySettings.ENEMY_DENSITY_DEPTH_MULTIPLIER,
      GameplaySettings.MAX_ENEMY_DENSITY,
    );

    const baseEnemyCount = Math.ceil(
      Math.max(
        Utils.randomNormalInt(0, meanValue * factor),
        meanValue * factor,
      ),
    );

    // Cap at the number of empty tiles (hard limit)
    const numEnemies = Math.min(baseEnemyCount, numEmptyTiles);

    // Apply forest reduction (moved from old addEnemies method)
    const adjustedEnemies =
      room.envType === EnvType.FOREST
        ? Math.floor(numEnemies * GameplaySettings.FOREST_ENEMY_REDUCTION)
        : numEnemies;

    this.addEnemiesUnified(room, adjustedEnemies, room.envType);
  }

  private addSpawners(room: Room, rand: () => number, numSpawners?: number) {
    let tiles = room.getEmptyTiles();
    if (tiles.length === 0) {
      return;
    }

    let lastSpawner = null;

    // If numSpawners is provided, force generate that many
    if (numSpawners !== undefined) {
      for (let i = 0; i < numSpawners; i++) {
        const position = room.getRandomEmptyPosition(tiles);
        if (position === null) break;
        const { x, y } = position;

        const spawnTable = this.getEnemyPoolForDepth(
          Math.max(0, room.depth - 1),
        ).filter((t) => t !== 7);

        lastSpawner = Spawner.add(room, room.game, x, y, spawnTable);

        // Remove used tile
        tiles = tiles.filter((t) => !(t.x === x && t.y === y));
      }
    } else {
      // Original random spawner logic with configurable parameters
      const maxPossibleSpawners = Math.ceil(
        room.roomArea / GameplaySettings.SPAWNER_AREA_THRESHOLD,
      );

      for (let i = 0; i < maxPossibleSpawners; i++) {
        if (rand() > GameplaySettings.SPAWNER_SPAWN_CHANCE) continue;

        const position = room.getRandomEmptyPosition(tiles);
        if (position === null) break;
        const { x, y } = position;

        const spawnTable = this.getEnemyPoolForDepth(
          Math.max(0, room.depth - 1),
        ).filter((t) => t !== 7);

        lastSpawner = Spawner.add(room, room.game, x, y, spawnTable);

        tiles = tiles.filter((t) => !(t.x === x && t.y === y));
      }
    }
    return lastSpawner;
  }

  private addOccultists(
    room: Room,
    rand: () => number,
    numOccultists?: number,
  ) {
    let tiles = room.getEmptyTiles();
    if (tiles.length === 0) {
      return;
    }

    let lastOccultist = null;

    // If numOccultists is provided, force generate that many
    if (numOccultists !== undefined) {
      for (let i = 0; i < numOccultists; i++) {
        const position = room.getRandomEmptyPosition(tiles);
        if (position === null) break;
        const { x, y } = position;

        lastOccultist = OccultistEnemy.add(room, room.game, x, y);

        // Remove used tile
        tiles = tiles.filter((t) => !(t.x === x && t.y === y));
      }
    } else {
      // Original random occultist logic with configurable parameters
      const maxPossibleOccultists = Math.ceil(
        room.roomArea / GameplaySettings.OCCULTIST_AREA_THRESHOLD,
      );

      for (let i = 0; i < maxPossibleOccultists; i++) {
        if (rand() > GameplaySettings.OCCULTIST_SPAWN_CHANCE) continue;

        const position = room.getRandomEmptyPosition(tiles);
        if (position === null) break;
        const { x, y } = position;

        lastOccultist = OccultistEnemy.add(room, room.game, x, y);

        tiles = tiles.filter((t) => !(t.x === x && t.y === y));
      }
    }
    return lastOccultist;
  }

  private addBosses(room: Room, depth: number) {
    if (GameplaySettings.NO_ENEMIES === true) return;
    let tiles = room.getEmptyTiles();
    if (tiles.length === 0) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }

    let bosses = ["reaper", "queen", "bigskullenemy", "bigzombieenemy"];
    if (depth > 0) {
      bosses.push("occultist");
      bosses = bosses.filter((b) => b !== "queen");
    }
    const boss = Game.randTable(bosses, Random.rand);

    const position = boss.startsWith("big")
      ? room.getBigRandomEmptyPosition(tiles)
      : room.getRandomEmptyPosition(tiles);
    if (position === null) return;
    const { x, y } = position;

    switch (boss) {
      case "reaper":
        const spawner = this.addSpawners(room, Random.rand, 1);
        spawner.dropTable = ["weapon", "equipment"];
        spawner.dropChance = 1;
        break;
      case "queen":
        const queen = QueenEnemy.add(room, room.game, x, y);
        queen.dropTable = ["weapon", "equipment"];
        queen.dropChance = 1;
        break;
      case "bigskullenemy":
        const bigSkull = BigSkullEnemy.add(room, room.game, x, y);
        bigSkull.dropTable = [
          "weapon",
          "equipment",
          "consumable",
          "gem",
          "tool",
        ];

        break;
      case "occultist":
        const occultist = this.addOccultists(room, Random.rand, 1);
        occultist.dropTable = ["weapon", "equipment"];
        occultist.dropChance = 1;

        break;
      case "bigzombieenemy":
        const bigZombie = BigZombieEnemy.add(room, room.game, x, y);
        bigZombie.dropTable = [
          "weapon",
          "equipment",
          "consumable",
          "gem",
          "tool",
        ];
        bigZombie.dropChance = 1;
        break;
    }
  }

  private addChests(room: Room, numChests: number, rand: () => number) {
    // add chests
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < numChests; i++) {
      const position = room.getRandomEmptyPosition(tiles);
      if (!position) {
        // No more empty tiles available, break out of loop
        break;
      }
      const { x, y } = position;
      room.entities.push(new Chest(room, room.game, x, y));
    }
  }

  addBombs(room: Room, numBombs: number, rand: () => number) {
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < room.getEmptyTiles().length; i++) {
      const position = room.getRandomEmptyPosition(tiles);
      if (position === null) break;
      const { x, y } = position;
      Bomb.add(room, room.game, x, y);
    }
  }

  private addResources(room: Room, numResources: number, rand: () => number) {
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < numResources; i++) {
      const position = room.getRandomEmptyPosition(tiles);
      if (position === null) break;
      const { x, y } = position;

      let r = rand();
      if (r <= (10 - room.depth ** 3) / 10)
        CoalResource.add(room, room.game, x, y);
      else if (r <= (10 - (room.depth - 2) ** 3) / 10)
        GoldResource.add(room, room.game, x, y);
      else EmeraldResource.add(room, room.game, x, y);
    }
  }

  private addVendingMachine(
    room: Room,
    rand: () => number,
    placeX?: number,
    placeY?: number,
    item?: Item,
  ) {
    const pos = room.getRandomEmptyPosition(room.getEmptyTiles());
    if (pos === null) return;
    let x = placeX ? placeX : pos.x;
    let y = placeY ? placeY : pos.y;

    let table =
      room.depth > 0
        ? [
            1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 1, 1, 3, 4, 5, 5, 5,
            5, 5,
          ]
        : [1, 1, 1];
    let type = Game.randTable(table, rand);
    if (item) {
      VendingMachine.add(room, room.game, x, y, item);
      return;
    }
    switch (type) {
      case 1:
        VendingMachine.add(room, room.game, x, y, new Heart(room, x, y));
        break;
      case 2:
        VendingMachine.add(room, room.game, x, y, new Candle(room, x, y));
        break;
      case 3:
        VendingMachine.add(room, room.game, x, y, new Armor(room, x, y));
        break;
      case 4:
        VendingMachine.add(room, room.game, x, y, new Spear(room, x, y));
        break;
      case 5:
        VendingMachine.add(room, room.game, x, y, new Torch(room, x, y));
        break;
    }
  }

  // #endregion

  // #region POPULATING METHODS

  populateEmpty = (room: Room, rand: () => number) => {
    // Removed: this.addTorchesByArea(room);
  };

  populateTreasure = (room: Room, rand: () => number) => {
    this.addChests(room, 10, rand);
    // Removed: this.addTorchesByArea(room);
  };

  populateDungeon = (room: Room, rand: () => number) => {
    //this.addChests(10, rand);
    let factor = Game.rand(1, 36, rand);

    // Removed: if (factor % 4 === 0) this.addChasms(room, rand);
    // Removed: if (factor % 3 === 0) this.addPools(room, rand);
    // Removed: this.addTorchesByArea(room);
    // Removed: if (factor > 15) this.addSpikeTraps(...);

    if (factor <= 6) this.placeVendingMachineInWall(room);

    room.removeDoorObstructions();
  };

  populateBoss = (room: Room, rand: () => number) => {
    // Removed: const bossDoor = room.getBossDoor();
    // Removed: this.addDoorTorches(room, bossDoor.x, bossDoor.y, bossDoor.doorDir);
    // Removed: this.addTorchesByArea(room);
    // Removed: this.addSpikeTraps(room, Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    this.addBosses(room, room.depth);
  };

  populateBigDungeon = (room: Room, rand: () => number) => {
    // Removed: if (Game.rand(1, 4, rand) === 1) this.addChasms(room, rand);
    // Removed: this.addTorchesByArea(room);
    // Removed: if (Game.rand(1, 3, rand) === 1) this.addSpikeTraps(...);

    room.removeDoorObstructions();
  };

  populateSpawner = (room: Room, rand: () => number) => {
    // Removed: this.addTorchesByArea(room);

    Spawner.add(
      room,
      room.game,
      Math.floor(room.roomX + room.width / 2),
      Math.floor(room.roomY + room.height / 2),
    );
    room.removeDoorObstructions();
  };

  populateKeyRoom = (room: Room, rand: () => number) => {
    // Removed: this.addRandomTorches(room, "medium");

    room.items.push(
      new GoldenKey(
        room,
        Math.floor(room.roomX + room.width / 2),
        Math.floor(room.roomY + room.height / 2),
      ),
    );
  };

  populateFountain = (room: Room, rand: () => number) => {
    // Removed: this.addRandomTorches(room, "medium");

    let centerX = Math.floor(room.roomX + room.width / 2);
    let centerY = Math.floor(room.roomY + room.height / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        room.roomArray[x][y] = new FountainTile(
          room,
          x,
          y,
          x - (centerX - 1),
          y - (centerY - 1),
        );
      }
    }
  };

  populatePuzzle = (room: Room, rand: () => number) => {
    let d;

    for (let x = room.roomX; x < room.roomX + room.width; x++) {
      let y = room.roomY + Math.floor(room.height / 2);
      if (x === room.roomX + Math.floor(room.width / 2)) {
        d = new InsideLevelDoor(room, room.game, x, y + 1);
        room.roomArray[x][y + 1] = d;
      } else {
        room.roomArray[x][y] = new Wall(room, x, y);
      }
    }

    let x = Game.rand(room.roomX, room.roomX + room.width - 1, rand);
    let y = Game.rand(
      room.roomY + Math.floor(room.height / 2) + 3,
      room.roomY + room.height - 2,
      rand,
    );

    room.roomArray[x][y] = new Button(room, x, y, d);

    let crateTiles = room
      .getEmptyTiles()
      .filter(
        (t) =>
          t.x >= room.roomX + 1 &&
          t.x <= room.roomX + room.width - 2 &&
          t.y >= room.roomY + Math.floor(room.height / 2) + 3 &&
          t.y <= room.roomY + room.height - 2,
      );
    let numCrates = Game.randTable([1, 2, 2, 3, 4], rand);

    for (let i = 0; i < numCrates; i++) {
      let t = crateTiles.splice(
        Game.rand(0, crateTiles.length - 1, rand),
        1,
      )[0];
      if (t) room.entities.push(new Crate(room, room.game, t.x, t.y));
    }

    room.removeDoorObstructions();
  };

  populateSpikeCorridor = (room: Room, rand: () => number) => {
    for (let x = room.roomX; x < room.roomX + room.width; x++) {
      for (let y = room.roomY + 1; y < room.roomY + room.height - 1; y++) {
        room.roomArray[x][y] = new SpikeTrap(room, x, y, Game.rand(0, 3, rand));
      }
    }
    room.removeDoorObstructions();
    // Removed: this.addRandomTorches(room, "medium");
  };

  populateCave = (room: Room, rand: () => number) => {
    let factor = Game.rand(1, 36, rand);

    // Removed: if (factor > 15) this.addSpikeTraps(...);
    let numEmptyTiles = room.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles * Game.randTable([0.25, 0.3, 0.35], rand),
    );
    this.addEnemiesUnified(room, numEnemies, room.envType); // Use unified system directly
    if (room.level.environment.type === EnvType.CAVE)
      this.addResources(
        room,
        (numEmptyTiles - numEnemies) * Game.randTable([0.1, 0.2, 0.3], rand),
        rand,
      );
    room.removeDoorObstructions();
  };

  populateUpLadder = (room: Room, rand: () => number) => {
    // Removed: this.addRandomTorches(room, "medium");

    const { x, y } = room.getRoomCenter();
    room.roomArray[x - 1][y - 1] = new UpLadder(room, room.game, x - 1, y - 1);
  };

  populateDownLadder = (room: Room, rand: () => number) => {
    // Removed: this.addTorches(room, 1, rand, room.roomX + 3, room.roomY);

    const { x, y } = room.getRoomCenter();
    room.roomArray[x + 1][y - 1] = new DownLadder(
      room,
      room.game,
      x + 1,
      y - 1,
    );

    const numChests = Math.ceil(Random.rand() * 5);

    let tiles = room.getEmptyTiles();
    tiles = tiles.filter((tile) => tile.x !== x || tile.y !== y);
    let weaponDropped = false;
    let toolDropped = false;
    let lightDropped = false;
    for (let i = 0; i < numChests; i++) {
      if (tiles.length > 0) {
        const position = room.getRandomEmptyPosition(tiles);
        if (position === null) break;
        const { x, y } = position;

        let chest = new Chest(room, room.game, x, y);
        /*
        if (!weaponDropped) {
          chest.getDrop(["weapon"], true);
          weaponDropped = true;
        } else 
         */

        chest.getDrop(
          [
            "consumable",
            "gem",
            "light",
            "tool",
            "fuel",
            "backpack",
            "weapon",
            "coin",
          ],
          false,
        );

        tiles.filter((tile) => tile.x !== x && tile.y !== y);
        room.entities.push(chest);
      }
    }
    if (room.depth === 0) this.populateWeaponGroup(room, tiles);
  };

  populateWeaponGroup = (room: Room, tiles: Tile[]) => {
    const emptyTile = room.getRandomEmptyPosition(tiles);
    const emptyTile2 = room.getRandomEmptyPosition(tiles, emptyTile);
    const emptyTile3 = room.getRandomEmptyPosition(tiles, emptyTile2);

    const weapons = new ItemGroup([
      new Spear(room, emptyTile.x, emptyTile.y),
      new Warhammer(room, emptyTile2.x, emptyTile2.y),
      new Sword(room, emptyTile3.x, emptyTile3.y),
    ]);
    for (const item of weapons.items) {
      item.grouped = true;
      item.group = weapons;
      room.items.push(item);
    }
  };

  populateRopeHole = (room: Room, rand: () => number) => {
    // Removed: this.addRandomTorches(room, "medium");

    const { x, y } = room.getRoomCenter();

    const environment = room.depth < 1 ? EnvType.FOREST : EnvType.CAVE;
    //console.log("About to create DownLadder in rope hole");
    let d = new DownLadder(room, room.game, x, y, true, environment);
    //console.log("DownLadder created, about to add to room array");

    // Delay adding to room array to avoid triggering side path generation during level setup
    setTimeout(() => {
      room.roomArray[x][y] = d;
      //console.log("DownLadder added to room array successfully (delayed)");
    }, 0);
  };

  populateRopeCave = (room: Room, rand: () => number) => {
    const { x, y } = room.getRoomCenter();
    let upLadder = new UpLadder(room, room.game, x, y);
    upLadder.isRope = true;
    room.roomArray[x][y] = upLadder;
    if (room.envType === EnvType.CAVE)
      this.placeVendingMachineInWall(room, new Pickaxe(room, 0, 0));
    else this.placeVendingMachineInWall(room);

    room.removeDoorObstructions();
  };

  populateShop = (room: Room, rand: () => number) => {
    this.addTorches(room, 2, rand);
    const { x, y } = room.getRoomCenter();
    VendingMachine.add(room, room.game, x - 2, y - 1, new Shotgun(room, 0, 0));
    VendingMachine.add(room, room.game, x + 2, y - 1, new Heart(room, 0, 0));
    VendingMachine.add(room, room.game, x - 2, y + 2, new Armor(room, 0, 0));
    VendingMachine.add(room, room.game, x + 2, y + 2, new Spear(room, 0, 0));

    room.removeDoorObstructions();
  };

  // Many populate methods start with adding torches using the same pattern
  private addRandomTorches(
    room: Room,
    intensity: "none" | "low" | "medium" | "high" = "medium",
  ): void {
    const torchPatterns = {
      none: [0, 0, 0],
      low: [0, 0, 0, 1, 1],
      medium: [0, 0, 0, 1, 1, 2, 2, 3],
      high: [1, 1, 2, 2, 3, 3, 4],
    };
    const randTorches = Game.randTable(torchPatterns[intensity], Random.rand);
    this.addTorches(room, randTorches, Random.rand);
  }

  private addTorchesByArea = (room: Room) => {
    let numTorches = Math.max(
      1,
      Math.floor(Math.sqrt(room.roomArea) / 3) -
        Math.floor(Math.sqrt(room.depth)),
    );
    if (room.depth === 0) {
      if (Random.rand() < 0.25) {
        numTorches = 0;
      }
    } else {
      // Exponential falloff starting at depth 1, approaching 90% chance
      const falloffRate = 0.4; // Controls how quickly it approaches 90%
      const maxChance = 0.9;
      const chance =
        maxChance * (1 - Math.exp(-falloffRate * (room.depth - 1)));
      if (Random.rand() < chance) {
        numTorches = 0;
      }
    }
    this.addTorches(room, numTorches, Random.rand);
  };

  /**
   * Centralized method to add torches, spikes, and pools based on room type
   */
  private addEnvironmentalFeatures(room: Room, rand: () => number) {
    const factor = Game.rand(1, 36, rand);

    switch (room.type) {
      case RoomType.START:
        if (room.depth !== 0) {
          // No torches for start rooms with upladder
        } else {
          this.addTorchesByArea(room);
        }
        break;

      case RoomType.BOSS:
        const bossDoor = room.getBossDoor();
        this.addDoorTorches(room, bossDoor.x, bossDoor.y, bossDoor.doorDir);
        this.addTorchesByArea(room);
        this.addSpikeTraps(
          room,
          Game.randTable([0, 0, 0, 1, 1, 2, 5], rand),
          rand,
        );
        break;

      case RoomType.DUNGEON:
        if (factor < 20) room.builder.addWallBlocks(rand);

        if (factor % 4 === 0) this.addChasms(room, rand);
        if (factor % 3 === 0) this.addPools(room, rand);

        this.addTorchesByArea(room);
        if (factor > 15)
          this.addSpikeTraps(
            room,
            Game.randTable([0, 0, 0, 1, 1, 2, 3], rand),
            rand,
          );
        break;

      case RoomType.BIGDUNGEON:
        if (factor < 5) room.builder.addWallBlocks(rand);

        if (Game.rand(1, 4, rand) === 1) this.addChasms(room, rand);
        this.addTorchesByArea(room);
        if (Game.rand(1, 3, rand) === 1)
          this.addSpikeTraps(room, Game.randTable([3, 5, 7, 8], rand), rand);
        break;

      case RoomType.CAVE:
        if (factor < 30) room.builder.addWallBlocks(rand);
        if (factor % 4 === 0) this.addChasms(room, rand);
        if (factor % 3 === 0) this.addPools(room, rand);

      case RoomType.BIGCAVE:
        if (factor > 15)
          this.addSpikeTraps(
            room,
            Game.randTable([0, 0, 0, 1, 1, 2, 5], rand),
            rand,
          );
        // Caves don't get torches by default
        break;

      case RoomType.TREASURE:
        this.addTorchesByArea(room);
        break;

      case RoomType.SPAWNER:
        this.addTorchesByArea(room);
        break;

      case RoomType.UPLADDER:
        this.addRandomTorches(room, "medium");
        break;

      case RoomType.DOWNLADDER:
        this.addTorches(room, 1, rand, room.roomX + 3, room.roomY);
        break;

      case RoomType.ROPEHOLE:
        this.addRandomTorches(room, "medium");
        break;

      case RoomType.FOUNTAIN:
        this.addRandomTorches(room, "medium");
        break;

      case RoomType.KEYROOM:
        this.addRandomTorches(room, "medium");
        break;

      case RoomType.SPIKECORRIDOR:
        this.addRandomTorches(room, "medium");
        break;

      case RoomType.SHOP:
        this.addTorches(room, 2, rand);
        break;

      case RoomType.GRASS:
        if (factor % 4 === 0) this.addChasms(room, rand);
        if (factor % 3 === 0) this.addPools(room, rand);
        this.addTorchesByArea(room);
        if (factor > 15)
          this.addSpikeTraps(
            room,
            Game.randTable([0, 0, 0, 1, 1, 2, 3], rand),
            rand,
          );
        break;

      default:
        // No environmental features for other room types
        break;
    }
  }

  populate = (room: Room, rand: () => number) => {
    room.name = "";
    switch (room.type) {
      case RoomType.START:
        if (room.depth !== 0) {
          this.populateUpLadder(room, rand);
          this.placeVendingMachineInWall(room);
        }

        this.populateEmpty(room, rand);
        room.name = "FLOOR " + -room.depth;

        break;
      case RoomType.BOSS:
        this.populateBoss(room, rand);
        room.name = "BOSS";
        break;
      case RoomType.DUNGEON:
        if (
          room.level.environment.type === EnvType.CAVE &&
          Random.rand() <= 0.2
        ) {
          this.populateCave(room, rand);
        } else {
          this.populateDungeon(room, rand);
        }
        break;
      case RoomType.BIGDUNGEON:
        this.populateBigDungeon(room, rand);
        break;
      case RoomType.FOUNTAIN:
        this.populateFountain(room, rand);
        break;
      case RoomType.PUZZLE:
        this.populatePuzzle(room, rand);
        break;
      case RoomType.SPIKECORRIDOR:
        this.populateSpikeCorridor(room, rand);
        break;
      case RoomType.TREASURE:
        this.populateTreasure(room, rand);
        break;
      case RoomType.KEYROOM:
        this.populateKeyRoom(room, rand);
        break;
      case RoomType.GRASS:
        this.populateDungeon(room, rand);
        break;
      case RoomType.BIGCAVE:
        this.populateCave(room, rand);
      case RoomType.CAVE:
        this.populateCave(room, rand);
        break;
      case RoomType.UPLADDER:
        this.populateUpLadder(room, rand);
        room.name = "FLOOR " + -room.depth;

        break;
      case RoomType.DOWNLADDER:
        this.populateDownLadder(room, rand);
        room.name = "FLOOR " + -room.depth;
        break;
      case RoomType.ROPEHOLE:
        this.populateRopeHole(room, rand);
        break;
      case RoomType.ROPECAVE:
        this.populateRopeCave(room, rand);
        break;
      case RoomType.SHOP:
        this.populateShop(room, rand);
        break;
      case RoomType.SPAWNER:
        this.populateSpawner(room, rand);
        break;
    }
    room.message = room.name;
  };

  /**
   * Places a VendingMachine in an empty wall.
   */
  placeVendingMachineInWall(room: Room, item?: Item): void {
    const emptyWalls = room.getEmptyWall();
    if (emptyWalls.length === 0) return;

    // Select a random empty wall
    const selectedWall = Game.randTable(emptyWalls, Random.rand);
    if (!selectedWall) return;

    // Remove the selected wall
    const removedWallInfo = room.removeEmptyWall(selectedWall);
    if (!removedWallInfo) return;

    const { x, y } = removedWallInfo;

    // Create and add the VendingMachine
    this.addVendingMachine(room, Random.rand, x, y, item);
  }
}
