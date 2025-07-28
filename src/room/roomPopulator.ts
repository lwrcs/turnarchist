import { Barrel } from "../entity/object/barrel";
import { Block } from "../entity/object/block";
import { Crate } from "../entity/object/crate";
import { Pumpkin } from "../entity/object/pumpkin";
import { TombStone } from "../entity/object/tombStone";
import { Game } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import { environmentProps, PropInfo } from "../level/environment";
import { EnvType } from "../constants/environmentTypes";
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
import { DownLadder } from "../tile/downLadder";
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

export class Populator {
  level: Level;
  medianDensity: number;
  private props: { x: number; y: number }[] = [];
  addedDownladder: boolean = false;

  constructor(level: Level) {
    this.level = level;
    this.props = [];
    this.medianDensity = GameplaySettings.MEDIAN_ROOM_DENSITY;
  }

  populateRooms = () => {
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

    const downLadderRoom = rooms[Math.floor(Math.random() * rooms.length)];

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
    if (position.x === undefined || position.y === undefined) return;

    console.log(
      `Placing downladder at position (${position.x}, ${position.y})`,
    );

    const downLadder = new DownladderMaker(
      downLadderRoom,
      this.level.game,
      position.x,
      position.y,
    );
    downLadderRoom.entities.push(downLadder);
  };

  populateByType = (room: Room) => {};

  private addProps(room: Room, numProps: number, envType?: EnvType) {
    const envData = envType
      ? environmentProps[envType]
      : environmentProps[room.level.environment.type];
    let tiles = room.getEmptyTiles();

    for (let i = 0; i < numProps; i++) {
      if (tiles.length === 0) break;

      const { x, y } = room.getRandomEmptyPosition(tiles);
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
      ? environmentProps[envType]
      : environmentProps[room.level.environment.type];

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

  private addChasms(room: Room, rand: () => number) {
    // add chasms
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
          if (!(room.roomArray[xx][yy] instanceof SpawnFloor))
            room.roomArray[xx][yy] = new Floor(room, xx, yy);
        } else
          room.roomArray[xx][yy] = new Chasm(
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

  private addSpikeTraps(room: Room, numSpikes: number, rand: () => number) {
    if (
      room.level.environment.type === EnvType.FOREST ||
      room.envType === EnvType.FOREST
    )
      return;
    // add spikes
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      const { x, y } = room.getRandomEmptyPosition(tiles);
      room.roomArray[x][y] = new SpikeTrap(room, x, y);
    }
  }
  // #endregion

  // #region ADDING ENTITIES

  // Function to add enemies to the room
  private addEnemies(room: Room, numEnemies: number, rand: () => number) {
    if (GameplaySettings.NO_ENEMIES === true) return;
    if (room.envType === EnvType.FOREST) numEnemies /= 2;
    // Get all empty tiles in the room
    let tiles = room.getEmptyTiles();
    if (tiles === null) return;
    //don't put enemies near the entrances so you don't get screwed instantly

    // Create a Set to store coordinates that should be excluded
    const excludedCoords = new Set<string>();

    // For each door, add coordinates in a 5x5 area around it to excluded set
    for (const door of room.doors) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          excludedCoords.add(`${door.x + dx},${door.y + dy}`);
        }
      }
    }

    // Filter tiles that aren't in the excluded set
    tiles = tiles.filter((tile) => !excludedCoords.has(`${tile.x},${tile.y}`));
    // Loop through the number of enemies to be added
    for (let i = 0; i < numEnemies; i++) {
      let rerolls = 1;

      if (tiles.length === 0) {
        console.log(`No tiles left to spawn enemies`);
        break;
      }
      let emptyTiles = room.getRandomEmptyPosition(tiles);
      if (emptyTiles.x === null || emptyTiles.y === null) {
        i = numEnemies;
        break;
      }
      const { x, y } = emptyTiles;

      // Define the enemy tables for each depth level
      let tables = room.level.enemyParameters.enemyTables;
      // Define the maximum depth level
      let max_depth_table = room.level.enemyParameters.maxDepthTable;
      // Get the current depth level, capped at the maximum
      let d = Math.min(room.depth, max_depth_table);
      // If there is a table for the current depth level
      if (tables[d] && tables[d].length > 0) {
        // Function to add an enemy to the room
        let addEnemy = (enemy: Entity): boolean => {
          // Check if the enemy overlaps with any other enemies
          for (let xx = 0; xx < enemy.w; xx++) {
            for (let yy = 0; yy < enemy.h; yy++) {
              if (!tiles.some((tt) => tt.x === x + xx && tt.y === y + yy)) {
                // If it does, increment the enemy count and return false
                numEnemies++;
                return false;
              }
            }
          }
          // If it doesn't, add the enemy to the room, remove the tiles used from the available pool, and return true
          room.entities.push(enemy);
          for (let xx = 0; xx < enemy.w; xx++) {
            for (let yy = 0; yy < enemy.h; yy++) {
              tiles = tiles.filter((t) => !(t.x === x + xx && t.y === y + yy));
            }
          }
          return true;
        };

        // Randomly select an enemy type from the table
        let type = Game.randTable(tables[d], Math.random);

        switch (type) {
          case 1:
            CrabEnemy.add(room, room.game, x, y);
            break;
          case 2:
            FrogEnemy.add(room, room.game, x, y);
            break;
          case 3:
            ZombieEnemy.add(room, room.game, x, y);
            break;
          case 4:
            SkullEnemy.add(room, room.game, x, y);
            break;
          case 5:
            EnergyWizardEnemy.add(room, room.game, x, y);
            break;
          case 6:
            ChargeEnemy.add(room, room.game, x, y);
            break;
          case 7:
            RookEnemy.add(room, room.game, x, y);
            break;
          case 8:
            BishopEnemy.add(room, room.game, x, y);
            break;
          case 9:
            ArmoredzombieEnemy.add(room, room.game, x, y);
            break;
          case 10:
            if (addEnemy(new BigSkullEnemy(room, room.game, x, y))) {
              // clear out some space
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  room.roomArray[x + xx][y + yy] = new Floor(
                    room,
                    x + xx,
                    y + yy,
                  ); // remove any walls
                }
              }
            }
            break;
          case 11:
            QueenEnemy.add(room, room.game, x, y);
            break;
          case 12:
            KnightEnemy.add(room, room.game, x, y);
            break;
          case 13:
            if (addEnemy(new BigKnightEnemy(room, room.game, x, y))) {
              // clear out some space
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  room.roomArray[x + xx][y + yy] = new Floor(
                    room,
                    x + xx,
                    y + yy,
                  ); // remove any walls
                }
              }
            }
            break;
          case 14:
            ArmoredSkullEnemy.add(room, room.game, x, y);
            break;
          case 15:
            FireWizardEnemy.add(room, room.game, x, y);
            break;
        }
      }
    }
    let spawnerAmounts = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
      2, 2, 3, 3, 4, 5, 3,
    ];
    if (room.depth > 0) {
      let spawnerAmount = Game.randTable(spawnerAmounts, rand);
      //console.log(`Adding ${spawnerAmount} spawners`);
      this.addSpawners(room, spawnerAmount, rand);
    }
    let occultistAmounts = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    ];
    if (room.depth > 1) {
      let occultistAmount = Game.randTable(occultistAmounts, rand);
      //console.log(`Adding ${occultistAmount} occultists`);
      this.addOccultists(room, occultistAmount, rand);
    }
  }

  private addRandomEnemies(room: Room) {
    let numEmptyTiles = room.getEmptyTiles().length;
    /*
    let numEnemies = Math.ceil(
      numEmptyTiles * Math.min(room.depth * 0.1 + 0.5, 0.15), //room.depth * 0.01 is starting value
    );
    */
    const factor = Math.min((room.depth + 2) * 0.05, 0.3);
    const numEnemies = Math.ceil(
      Math.max(
        Utils.randomNormalInt(0, numEmptyTiles * factor),
        numEmptyTiles * factor,
      ),
    );
    //if (numEnemies > numEmptyTiles / 2) numEnemies = numEmptyTiles / 2;
    this.addEnemies(room, numEnemies, Math.random);
  }

  private addSpawners(room: Room, numSpawners: number, rand: () => number) {
    let tiles = room.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }
    for (let i = 0; i < numSpawners; i++) {
      const { x, y } = room.getRandomEmptyPosition(tiles);
      let spawnTable = room.level
        .getEnemyParameters()
        //spawners should use enemy pools from the previous depth
        .enemyTables[Math.max(0, room.depth - 1)].filter((t) => t !== 7);
      const spawner = Spawner.add(room, room.game, x, y, spawnTable);
      return spawner;
    }
  }
  private addOccultists(room: Room, numOccultists: number, rand: () => number) {
    let tiles = room.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }
    for (let i = 0; i < numOccultists; i++) {
      const { x, y } = room.getRandomEmptyPosition(tiles);
      const occultist = OccultistEnemy.add(room, room.game, x, y);
      return occultist;
    }
  }

  private addBosses(room: Room, depth: number) {
    if (GameplaySettings.NO_ENEMIES === true) return;
    let tiles = room.getEmptyTiles();
    if (tiles === null) {
      //console.log(`No tiles left to spawn spawners`);
      return;
    }

    let bosses = ["reaper", "queen", "bigskullenemy", "bigzombieenemy"];
    if (depth > 0) {
      bosses.push("occultist");
      bosses.filter((b) => b !== "queen");
    }
    const boss = Game.randTable(bosses, Math.random);

    const { x, y } = boss.startsWith("big")
      ? room.getBigRandomEmptyPosition(tiles)
      : room.getRandomEmptyPosition(tiles);

    switch (boss) {
      case "reaper":
        const spawner = this.addSpawners(room, 1, Math.random);
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
        const occultist = this.addOccultists(room, 1, Math.random);
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
      const { x, y } = room.getRandomEmptyPosition(tiles);
      Bomb.add(room, room.game, x, y);
    }
  }

  private addResources(room: Room, numResources: number, rand: () => number) {
    let tiles = room.getEmptyTiles();
    for (let i = 0; i < numResources; i++) {
      const { x, y } = room.getRandomEmptyPosition(tiles);

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
    this.addTorchesByArea(room);
  };

  populateTreasure = (room: Room, rand: () => number) => {
    this.addChests(room, 10, rand);
    this.addTorchesByArea(room);
  };

  populateDungeon = (room: Room, rand: () => number) => {
    //this.addChests(10, rand);
    let factor = Game.rand(1, 36, rand);

    if (factor < 30) room.builder.addWallBlocks(rand);
    if (factor % 4 === 0) this.addChasms(room, rand);
    this.addTorchesByArea(room);
    if (factor > 15)
      this.addSpikeTraps(
        room,
        Game.randTable([0, 0, 0, 1, 1, 2, 3], rand),
        rand,
      );

    if (factor <= 6) this.addVendingMachine(room, rand);
    this.addRandomEnemies(room);

    room.removeDoorObstructions();
  };

  populateBoss = (room: Room, rand: () => number) => {
    const bossDoor = room.getBossDoor();
    this.addDoorTorches(room, bossDoor.x, bossDoor.y, bossDoor.doorDir);
    this.addTorchesByArea(room);
    this.addSpikeTraps(room, Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    this.addBosses(room, room.depth);
    this.addRandomEnemies(room);
  };

  populateBigDungeon = (room: Room, rand: () => number) => {
    if (Game.rand(1, 4, rand) === 1) this.addChasms(room, rand);
    this.addTorchesByArea(room);

    if (Game.rand(1, 3, rand) === 1)
      this.addSpikeTraps(room, Game.randTable([3, 5, 7, 8], rand), rand);
    this.addRandomEnemies(room);

    room.removeDoorObstructions();
  };

  populateSpawner = (room: Room, rand: () => number) => {
    this.addTorchesByArea(room);

    Spawner.add(
      room,
      room.game,
      Math.floor(room.roomX + room.width / 2),
      Math.floor(room.roomY + room.height / 2),
    );
    room.removeDoorObstructions();
  };

  populateKeyRoom = (room: Room, rand: () => number) => {
    this.addRandomTorches(room, "medium");

    room.items.push(
      new GoldenKey(
        room,
        Math.floor(room.roomX + room.width / 2),
        Math.floor(room.roomY + room.height / 2),
      ),
    );
  };

  populateFountain = (room: Room, rand: () => number) => {
    this.addRandomTorches(room, "medium");

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
    this.addRandomTorches(room, "medium");
  };

  populateCave = (room: Room, rand: () => number) => {
    let factor = Game.rand(1, 36, rand);

    room.builder.addWallBlocks(rand);

    if (factor > 15)
      this.addSpikeTraps(
        room,
        Game.randTable([0, 0, 0, 1, 1, 2, 5], rand),
        rand,
      );
    let numEmptyTiles = room.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles * Game.randTable([0.25, 0.3, 0.35], rand),
    );
    this.addEnemies(room, numEnemies, rand);
    if (room.level.environment.type === EnvType.CAVE)
      this.addResources(
        room,
        (numEmptyTiles - numEnemies) * Game.randTable([0.1, 0.2, 0.3], rand),
        rand,
      );
    room.removeDoorObstructions();
  };

  populateUpLadder = (room: Room, rand: () => number) => {
    this.addRandomTorches(room, "medium");

    const { x, y } = room.getRoomCenter();
    room.roomArray[x - 1][y - 1] = new UpLadder(room, room.game, x - 1, y - 1);
  };

  populateDownLadder = (room: Room, rand: () => number) => {
    this.addTorches(room, 1, rand, room.roomX + 3, room.roomY);

    const { x, y } = room.getRoomCenter();
    room.roomArray[x + 1][y - 1] = new DownLadder(
      room,
      room.game,
      x + 1,
      y - 1,
    );

    const numChests = Math.ceil(Math.random() * 5);

    let tiles = room.getEmptyTiles();
    tiles = tiles.filter((tile) => tile.x !== x || tile.y !== y);
    let weaponDropped = false;
    let toolDropped = false;
    let lightDropped = false;
    for (let i = 0; i < numChests; i++) {
      if (tiles.length > 0) {
        const { x, y } = room.getRandomEmptyPosition(tiles);

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
    this.addRandomTorches(room, "medium");

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
      if (Math.random() < 0.25) {
        numTorches = 0;
      }
    } else {
      // Exponential falloff starting at depth 1, approaching 90% chance
      const falloffRate = 0.4; // Controls how quickly it approaches 90%
      const maxChance = 0.9;
      const chance =
        maxChance * (1 - Math.exp(-falloffRate * (room.depth - 1)));
      if (Math.random() < chance) {
        numTorches = 0;
      }
    }
    this.addTorches(room, numTorches, Random.rand);
  };

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
          Math.random() <= 0.2
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
