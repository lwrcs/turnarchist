import { Wall } from "./tile/wall";
import { LevelConstants } from "./levelConstants";
import { Floor } from "./tile/floor";
import { Game, LevelState } from "./game";
import { Door, DoorType } from "./tile/door";
import { BottomDoor } from "./tile/bottomDoor";
import { Tile, SkinType } from "./tile/tile";
import { Trapdoor } from "./tile/trapdoor";
import { KnightEnemy } from "./enemy/knightEnemy";
import { Enemy } from "./enemy/enemy";
import { Chest } from "./enemy/chest";
import { Item } from "./item/item";
import { GoldenKey } from "./item/goldenKey";
import { SpawnFloor } from "./tile/spawnfloor";
//import { GoldenDoor } from "./tile/goldenDoor";
import { Spike } from "./tile/spike";
import { GameConstants } from "./gameConstants";
import { WizardEnemy } from "./enemy/wizardEnemy";
import { SkullEnemy } from "./enemy/skullEnemy";
import { Barrel } from "./enemy/barrel";
import { Crate } from "./enemy/crate";
import { Input } from "./input";
import { Armor } from "./item/armor";
import { Particle } from "./particle/particle";
import { Projectile } from "./projectile/projectile";
import { SpikeTrap } from "./tile/spiketrap";
import { FountainTile } from "./tile/fountainTile";
import { CoffinTile } from "./tile/coffinTile";
import { PottedPlant } from "./enemy/pottedPlant";
import { InsideLevelDoor } from "./tile/insideLevelDoor";
import { Button } from "./tile/button";
import { HitWarning } from "./hitWarning";
import { UpLadder } from "./tile/upLadder";
import { DownLadder } from "./tile/downLadder";
import { CoalResource } from "./enemy/coalResource";
import { GoldResource } from "./enemy/goldResource";
import { EmeraldResource } from "./enemy/emeraldResource";
import { Chasm } from "./tile/chasm";
import { Spawner } from "./enemy/spawner";
import { VendingMachine } from "./enemy/vendingMachine";
import { WallTorch } from "./tile/wallTorch";
import { LightSource } from "./lightSource";
import { ChargeEnemy } from "./enemy/chargeEnemy";
import { Shotgun } from "./weapon/shotgun";
import { Heart } from "./item/heart";
import { Spear } from "./weapon/spear";
import { SideDoor } from "./tile/sidedoor";
import { Drawable } from "./drawable";
import { Player } from "./player";
import { SlimeEnemy } from "./enemy/slimeEnemy";
import { ZombieEnemy } from "./enemy/zombieEnemy";
import { BigSkullEnemy } from "./enemy/bigSkullEnemy";
import { Random } from "./random";
import { Lantern } from "./item/lantern";
import { DualDagger } from "./weapon/dualdagger";
import { Pot } from "./enemy/pot";
import { BishopEnemy } from "./enemy/bishopEnemy";
import { Rook } from "./enemy/rook";
import { Rock } from "./enemy/rockResource";
import { Mushrooms } from "./enemy/mushrooms";
import { TurningEnemy } from "./enemy/turningEnemy";
import { ArmoredzombieEnemy } from "./enemy/armoredzombieEnemy";
import { Backpack } from "./item/backpack";
import { DoorDir } from "./tile/door";
import { ActionState, ActionTab } from "./actionTab";
import { TombStone } from "./enemy/tombStone";
import { Pumpkin } from "./enemy/pumpkin";

export enum RoomType {
  START,
  DUNGEON,
  BOSS,
  BIGDUNGEON,
  TREASURE,
  FOUNTAIN,
  COFFIN,
  GRASS,
  PUZZLE,
  KEYROOM,
  CHESSBOARD,
  MAZE,
  CORRIDOR,
  SPIKECORRIDOR,
  UPLADDER,
  DOWNLADDER,
  SHOP,
  BIGCAVE,
  CAVE,
  SPAWNER,
  ROPEHOLE,
  ROPECAVE,
}

export enum TurnState {
  playerTurn,
  computerTurn,
}

export class Level {
  x: number;
  y: number;
  levelArray: Tile[][];
  softVis: number[][]; // this is the one we use for drawing (includes smoothing)
  vis: number[][]; // visibility ranges from 0 (fully visible) to 1 (fully black)
  enemies: Array<Enemy>;
  items: Array<Item>;
  doors: Array<any>; // (Door | BottomDoor) just a reference for mapping, still access through levelArray
  projectiles: Array<Projectile>;
  particles: Array<Particle>;
  hitwarnings: Array<HitWarning>;
  game: Game;
  roomX: number;
  roomY: number;
  width: number;
  height: number;
  type: RoomType;
  depth: number;
  mapGroup: number;
  name: string;
  message: string;
  turn: TurnState;
  playerTurnTime: number;
  playerTicked: Player;
  skin: SkinType;
  entered: boolean; // has the player entered this level
  lightSources: Array<LightSource>;
  shadeColor = "black";
  walls: Array<Wall>;
  actionTab: ActionTab;

  private pointInside(
    x: number,
    y: number,
    rX: number,
    rY: number,
    rW: number,
    rH: number
  ): boolean {
    if (x < rX || x >= rX + rW) return false;
    if (y < rY || y >= rY + rH) return false;
    return true;
  }

  tileInside = (tileX: number, tileY: number): boolean => {
    return this.pointInside(
      tileX,
      tileY,
      this.roomX,
      this.roomY,
      this.width,
      this.height
    );
  };

  private buildEmptyRoom() {
    // fill in wall and floor
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (
          this.pointInside(
            x,
            y,
            this.roomX + 1,
            this.roomY + 1,
            this.width - 2,
            this.height - 2
          )
        ) {
          this.levelArray[x][y] = new Floor(this, x, y);
        } else {
          this.levelArray[x][y] = new Wall(this, x, y);
          this.walls.push;
        }
      }
    }
  }

  private addWallBlocks(rand: () => number) {
    let numBlocks = Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
    if (this.width > 8 && rand() > 0.5) numBlocks *= 4;
    for (let i = 0; i < numBlocks; i++) {
      let blockW = Math.min(
        Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand),
        this.width - 4
      );
      let blockH = Math.min(blockW + Game.rand(-2, 2, rand), this.height - 4);

      let x = Game.rand(
        this.roomX + 2,
        this.roomX + this.width - blockW - 2,
        rand
      );
      let y = Game.rand(
        this.roomY + 2,
        this.roomY + this.height - blockH - 2,
        rand
      );

      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          let w = new Wall(this, xx, yy);
          this.levelArray[xx][yy] = w;
          this.walls.push(w);
        }
      }
    }
  }

  private addFingers(rand: () => number) {}

  private addTorches(numTorches: number, rand: () => number) {
    let walls = [];
    for (let xx = this.roomX + 1; xx < this.roomX + this.width - 2; xx++) {
      for (let yy = this.roomY; yy < this.roomY + this.height - 1; yy++) {
        if (
          this.levelArray[xx][yy] instanceof Wall &&
          !(this.levelArray[xx][yy + 1] instanceof Wall)
        ) {
          walls.push(this.levelArray[xx][yy]);
        }
      }
    }
    for (let i = 0; i < numTorches; i++) {
      let t, x, y;
      if (walls.length == 0) return;
      t = walls.splice(Game.rand(0, walls.length - 1, rand), 1)[0];
      x = t.x;
      y = t.y;
      this.levelArray[x][y] = new WallTorch(this, x, y);
    }
  }

  private addChasms(rand: () => number) {
    // add chasms
    let w = Game.rand(2, 4, rand);
    let h = Game.rand(2, 4, rand);
    let xmin = this.roomX + 2;
    let xmax = this.roomX + this.width - w - 2;
    let ymin = this.roomY + 2;
    let ymax = this.roomY + this.height - h - 2;
    if (xmax < xmin || ymax < ymin) return;
    let x = Game.rand(xmin, xmax, rand);
    let y = Game.rand(ymin, ymax, rand);

    for (let xx = x - 1; xx < x + w + 1; xx++) {
      for (let yy = y - 1; yy < y + h + 1; yy++) {
        // add a floor border
        if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h) {
          if (!(this.levelArray[xx][yy] instanceof SpawnFloor))
            this.levelArray[xx][yy] = new Floor(this, xx, yy);
        } else
          this.levelArray[xx][yy] = new Chasm(
            this,
            xx,
            yy,
            xx === x,
            xx === x + w - 1,
            yy === y,
            yy === y + h - 1
          );
      }
    }
  }

  private addChests(numChests: number, rand: () => number) {
    // add chests
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numChests; i++) {
      let t, x, y;
      if (tiles.length == 0) return;
      t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      x = t.x;
      y = t.y;
      this.enemies.push(new Chest(this, this.game, x, y, rand));
    }
  }

  private addSpikeTraps(numSpikes: number, rand: () => number) {
    // add spikes
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;

      this.levelArray[x][y] = new SpikeTrap(this, x, y);
    }
  }

  private addSpikes(numSpikes: number, rand: () => number) {
    // add spikes
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numSpikes; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;

      this.levelArray[x][y] = new Spike(this, x, y);
    }
  }

  private addEnemies(numEnemies: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numEnemies; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;
      let tables = {
        0: [1, 2, 3, 3, 4],
        1: [1, 1, 3, 3, 3, 2, 2],
        2: [1, 1, 2, 2, 3, 3, 4],
        3: [1, 1, 1, 2, 3, 3, 3, 4, 4, 5],
        4: [1, 2, 3, 4, 5, 6, 7],
        5: [1, 2, 3, 4, 5, 6, 7, 8],
        6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        7: [1, 2, 3, 4, 5, 6, 7],
      };
      let max_depth_table = 7;
      let d = Math.min(this.depth, max_depth_table);
      if (tables[d] && tables[d].length > 0) {
        let addEnemy = (enemy: Enemy): boolean => {
          // adds an enemy if it doesn't overlap any other enemies
          for (let xx = 0; xx < enemy.w; xx++) {
            for (let yy = 0; yy < enemy.h; yy++) {
              if (
                !this.getEmptyTiles().some(
                  (tt) => tt.x === x + xx && tt.y === y + yy
                )
              ) {
                numEnemies++; // extra loop iteration since we're throwing out this point
                return false; // throw out point if it overlaps an enemy
              }
            }
          }
          this.enemies.push(enemy);
          return true;
        };

        let type = Game.randTable(tables[d], rand);
        switch (type) {
          case 1:
            addEnemy(new SlimeEnemy(this, this.game, x, y, rand));
            break;
          case 2:
            addEnemy(new KnightEnemy(this, this.game, x, y, rand));
            break;
          case 3:
            addEnemy(new ZombieEnemy(this, this.game, x, y, rand));
            break;
          case 4:
            addEnemy(new SkullEnemy(this, this.game, x, y, rand));
            break;
          case 5:
            addEnemy(new WizardEnemy(this, this.game, x, y, rand));
            break;
          case 6:
            addEnemy(new ChargeEnemy(this, this.game, x, y));
            break;
          case 7:
            addEnemy(new Spawner(this, this.game, x, y, rand));
            break;
          case 8:
            addEnemy(new BishopEnemy(this, this.game, x, y, rand));
            break;
          case 9:
            addEnemy(new ArmoredzombieEnemy(this, this.game, x, y, rand));
            break;
          case 10:
            if (addEnemy(new BigSkullEnemy(this, this.game, x, y, rand))) {
              // clear out some space
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.levelArray[x + xx][y + yy] = new Floor(
                    this,
                    x + xx,
                    y + yy
                  ); // remove any walls
                }
              }
            }
            break;
        }
      }
    }
  }

  private addObstacles(numObstacles: number, rand: () => number) {
    // add crates/barrels
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numObstacles; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;
      switch (Game.randTable([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4], rand)) {
        case 1:
          this.enemies.push(new Crate(this, this.game, x, y));
          break;
        case 2:
          this.enemies.push(new Barrel(this, this.game, x, y));
          break;
        case 3:
          this.enemies.push(new TombStone(this, this.game, x, y, 1, rand));
          break;
        case 4:
          this.enemies.push(new TombStone(this, this.game, x, y, 0, rand));
          break;
        //case 5:
        //this.enemies.push(new TombStone(this, this.game, x, y));
        //break;
      }
    }
  }

  private addPlants(numPlants: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numPlants; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;

      let r = rand();
      if (r <= 0.45)
        this.enemies.push(new PottedPlant(this, this.game, x, y, Random.rand));
      else if (r <= 0.65) this.enemies.push(new Pot(this, this.game, x, y));
      else if (r <= 0.75) this.enemies.push(new Rock(this, this.game, x, y));
      else if (r <= 0.97)
        this.enemies.push(new Mushrooms(this, this.game, x, y));
      else this.enemies.push(new Chest(this, this.game, x, y, rand));
    }
  }

  private addResources(numResources: number, rand: () => number) {
    let tiles = this.getEmptyTiles();
    for (let i = 0; i < numResources; i++) {
      let t = tiles.splice(Game.rand(0, tiles.length - 1, rand), 1)[0];
      if (tiles.length == 0) return;
      let x = t.x;
      let y = t.y;

      let r = rand();
      if (r <= (10 - this.depth ** 3) / 10)
        this.enemies.push(new CoalResource(this, this.game, x, y));
      else if (r <= (10 - (this.depth - 2) ** 3) / 10)
        this.enemies.push(new GoldResource(this, this.game, x, y));
      else this.enemies.push(new EmeraldResource(this, this.game, x, y));
    }
  }

  private addVendingMachine(rand: () => number) {
    let t = this.getEmptyTiles().sort(() => 0.5 - Random.rand())[0];
    let x = t.x;
    let y = t.y;
    let type = Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6], rand);
    switch (type) {
      case 1:
        this.enemies.push(
          new VendingMachine(this, this.game, x, y, new Heart(this, 0, 0), rand)
        );
        break;
      case 2:
        this.enemies.push(
          new VendingMachine(
            this,
            this.game,
            x,
            y,
            new Lantern(this, 0, 0),
            rand
          )
        );
        break;
      case 3:
        this.enemies.push(
          new VendingMachine(this, this.game, x, y, new Armor(this, 0, 0), rand)
        );
        break;
      case 4:
        this.enemies.push(
          new VendingMachine(
            this,
            this.game,
            x,
            y,
            new DualDagger(this, 0, 0),
            rand
          )
        );
        break;
      case 5:
        this.enemies.push(
          new VendingMachine(this, this.game, x, y, new Spear(this, 0, 0), rand)
        );
        break;
      case 6:
        this.enemies.push(
          new VendingMachine(
            this,
            this.game,
            x,
            y,
            new Shotgun(this, 0, 0),
            rand
          )
        );
        break;
    }
  }

  populateEmpty = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
  };

  populateDungeon = (rand: () => number) => {
    let factor = Game.rand(1, 36, rand);

    if (factor < 30) this.addWallBlocks(rand);
    if (factor < 26) this.addFingers(rand);
    if (factor % 4 === 0) this.addChasms(rand);
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    if (factor > 15)
      this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
    let numPlants = Math.ceil(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    this.addObstacles(numObstacles, rand);
    let numEnemies = Math.ceil(
      (numEmptyTiles - numTotalObstacles) *
        Math.min(this.depth * 0.1 + 0.1, 0.35) //this.depth * 0.01 is starting value
    );
    this.addEnemies(numEnemies, rand);

    if (factor <= 6) this.addVendingMachine(rand);
  };
  populateBoss = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numTotalObstacles = Math.floor(numEmptyTiles * 0.2);
    let numPlants = Math.floor(numTotalObstacles * rand());
    let numObstacles = numTotalObstacles - numPlants;
    this.addPlants(numPlants, rand);
    this.addObstacles(numObstacles, rand);
    let numEnemies = Math.ceil(
      (numEmptyTiles - numTotalObstacles) *
        Math.min(this.depth * 0.05 + 0.2, 0.5)
    );
    this.addEnemies(numEnemies, rand);
  };
  populateBigDungeon = (rand: () => number) => {
    if (Game.rand(1, 4, rand) === 1) this.addChasms(rand);
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    if (Game.rand(1, 4, rand) === 1)
      this.addPlants(
        Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
        rand
      );
    if (Game.rand(1, 3, rand) === 1)
      this.addSpikeTraps(Game.randTable([3, 5, 7, 8], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles *
        (this.depth * 0.5 + 0.5) *
        Game.randTable([0.05, 0.05, 0.06, 0.07, 0.1], rand)
    );
    this.addEnemies(numEnemies, rand);
    if (numEnemies > 0)
      this.addObstacles(numEnemies / Game.rand(1, 2, rand), rand);
    else this.addObstacles(Game.randTable([0, 0, 1, 1, 2, 3, 5], rand), rand);
  };
  populateSpawner = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    this.enemies.push(
      new Spawner(
        this,
        this.game,
        Math.floor(this.roomX + this.width / 2),
        Math.floor(this.roomY + this.height / 2),
        rand
      )
    );
  };
  populateKeyRoom = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    this.items.push(
      new GoldenKey(
        this,
        Math.floor(this.roomX + this.width / 2),
        Math.floor(this.roomY + this.height / 2)
      )
    );
  };
  populateFountain = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    let centerX = Math.floor(this.roomX + this.width / 2);
    let centerY = Math.floor(this.roomY + this.height / 2);
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        this.levelArray[x][y] = new FountainTile(
          this,
          x,
          y,
          x - (centerX - 1),
          y - (centerY - 1)
        );
      }
    }

    this.addPlants(Game.randTable([0, 0, 1, 2], rand), rand);
  };
  placeCoffin = (x: number, y: number) => {
    this.levelArray[x][y] = new CoffinTile(this, x, y, 0);
    this.levelArray[x][y + 1] = new CoffinTile(this, x, y + 1, 1);
  };
  populateCoffin = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);

    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2 - 2),
      Math.floor(this.roomY + this.height / 2)
    );
    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2),
      Math.floor(this.roomY + this.height / 2)
    );
    this.placeCoffin(
      Math.floor(this.roomX + this.width / 2) + 2,
      Math.floor(this.roomY + this.height / 2)
    );
  };
  populatePuzzle = (rand: () => number) => {
    let d;

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      let y = this.roomY + Math.floor(this.height / 2);
      if (x === this.roomX + Math.floor(this.width / 2)) {
        d = new InsideLevelDoor(this, this.game, x, y + 1);
        this.levelArray[x][y + 1] = d;
      } else {
        this.levelArray[x][y] = new Wall(this, x, y);
      }
    }

    let x = Game.rand(this.roomX, this.roomX + this.width - 1, rand);
    let y = Game.rand(
      this.roomY + Math.floor(this.height / 2) + 3,
      this.roomY + this.height - 2,
      rand
    );

    this.levelArray[x][y] = new Button(this, x, y, d);

    let crateTiles = this.getEmptyTiles().filter(
      (t) =>
        t.x >= this.roomX + 1 &&
        t.x <= this.roomX + this.width - 2 &&
        t.y >= this.roomY + Math.floor(this.height / 2) + 3 &&
        t.y <= this.roomY + this.height - 2
    );
    let numCrates = Game.randTable([1, 2, 2, 3, 4], rand);

    for (let i = 0; i < numCrates; i++) {
      let t = crateTiles.splice(
        Game.rand(0, crateTiles.length - 1, rand),
        1
      )[0];

      this.enemies.push(new Crate(this, this.game, t.x, t.y));
    }
    this.addPlants(
      Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand),
      rand
    );
  };
  populateSpikeCorridor = (rand: () => number) => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        this.levelArray[x][y] = new SpikeTrap(
          this,
          x,
          y,
          Game.rand(0, 3, rand)
        );
      }
    }

    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
  };
  populateTreasure = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 1, 1, 2, 2, 3, 4], rand), rand);

    this.addChests(Game.randTable([4, 4, 5, 5, 5, 6, 8], rand), rand);
    this.addPlants(Game.randTable([0, 1, 2, 4, 5, 6], rand), rand);
  };
  populateChessboard = (rand: () => number) => {};
  populateCave = (rand: () => number) => {
    let factor = Game.rand(1, 36, rand);

    this.addWallBlocks(rand);

    if (factor > 15)
      this.addSpikeTraps(Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
    let numEmptyTiles = this.getEmptyTiles().length;
    let numEnemies = Math.ceil(
      numEmptyTiles * Game.randTable([0.25, 0.3, 0.35], rand)
    );
    this.addEnemies(numEnemies, rand);
    this.addResources(
      (numEmptyTiles - numEnemies) * Game.randTable([0.5, 0.6, 0.7, 0.8], rand),
      rand
    );
  };
  populateUpLadder = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);

    let cX = Math.floor(this.roomX + this.width / 2);
    let cY = Math.floor(this.roomY + this.height / 2);
  };
  populateDownLadder = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);

    let cX = Math.floor(this.roomX + this.width / 2);
    let cY = Math.floor(this.roomY + this.height / 2);
    this.levelArray[cX][cY] = new DownLadder(this, this.game, cX, cY);
  };
  populateRopeHole = (rand: () => number) => {
    this.addTorches(Game.randTable([0, 0, 0, 1, 1, 2, 2], rand), rand);

    let cX = Math.floor(this.roomX + this.width / 2);
    let cY = Math.floor(this.roomY + this.height / 2);
    let d = new DownLadder(this, this.game, cX, cY);
    d.isRope = true;
    this.levelArray[cX][cY] = d;
  };
  populateRopeCave = (rand: () => number) => {
    let cX = Math.floor(this.roomX + this.width / 2);
    let cY = Math.floor(this.roomY + this.height / 2);
    let upLadder = new UpLadder(this, this.game, cX, cY);
    upLadder.isRope = true;
    this.levelArray[cX][cY] = upLadder;
  };
  populateShop = (rand: () => number) => {
    this.addTorches(2, rand);

    let cX = Math.floor(this.roomX + this.width / 2);
    let cY = Math.floor(this.roomY + this.height / 2);
    this.enemies.push(
      new VendingMachine(
        this,
        this.game,
        cX - 2,
        cY - 1,
        new Shotgun(this, 0, 0),
        rand
      )
    );
    this.enemies.push(
      new VendingMachine(
        this,
        this.game,
        cX + 2,
        cY - 1,
        new Heart(this, 0, 0),
        rand
      )
    );
    this.enemies.push(
      new VendingMachine(
        this,
        this.game,
        cX - 2,
        cY + 2,
        new Armor(this, 0, 0),
        rand
      )
    );
    this.enemies.push(
      new VendingMachine(
        this,
        this.game,
        cX + 2,
        cY + 2,
        new Spear(this, 0, 0),
        rand
      )
    );
  };

  populate = (rand: () => number) => {
    this.name = "";
    switch (this.type) {
      case RoomType.START:
        this.populateEmpty(rand);
        this.name = "FLOOR " + -this.depth;
        break;
      case RoomType.BOSS:
        this.populateBoss(rand);
        this.name = "BOSS";
        break;
      case RoomType.DUNGEON:
        this.populateDungeon(rand);
        break;
      case RoomType.BIGDUNGEON:
        this.populateBigDungeon(rand);
        break;
      case RoomType.FOUNTAIN:
        this.populateFountain(rand);
        break;
      case RoomType.COFFIN:
        this.populateCoffin(rand);
        break;
      case RoomType.PUZZLE:
        this.populatePuzzle(rand);
        break;
      case RoomType.SPIKECORRIDOR:
        this.populateSpikeCorridor(rand);
        break;
      case RoomType.TREASURE:
        this.populateTreasure(rand);
        break;
      case RoomType.CHESSBOARD: // TODO
        this.populateChessboard(rand);
        break;
      case RoomType.KEYROOM:
        this.populateKeyRoom(rand);
        break;
      case RoomType.GRASS:
        this.populateDungeon(rand);
        break;
      case RoomType.BIGCAVE:
        this.populateCave(rand);
      case RoomType.CAVE:
        this.populateCave(rand);
        break;
      case RoomType.UPLADDER:
        this.populateUpLadder(rand);
        this.name = "FLOOR " + -this.depth;
        break;
      case RoomType.DOWNLADDER:
        this.populateDownLadder(rand);
        this.name = "FLOOR " + -this.depth;
        break;
      case RoomType.ROPEHOLE:
        this.populateRopeHole(rand);
        break;
      case RoomType.ROPECAVE:
        this.populateRopeCave(rand);
        break;
      case RoomType.SHOP:
        /* shop rates:
         * 10 coal for an gold coin
         * 1 gold for 10 coins
         * 1 emerald for 100 coins
         *
         * shop items:
         * 1 empty heart   4 ^ (maxHealth + maxHealth ^ 1.05 ^ maxHealth - 2.05) coins
         * fill all hearts  1 coin
         * better torch    5 ^ (torchLevel + 1.05 ^ torchLevel - 2.05) coins
         * weapons
         */

        this.populateShop(rand);
        break;
      case RoomType.SPAWNER:
        this.populateSpawner(rand);
        break;
    }
    this.message = this.name;
  };

  constructor(
    game: Game,
    x: number,
    y: number,
    w: number,
    h: number,
    type: RoomType,
    depth: number,
    mapGroup: number,
    rand = Random.rand
  ) {
    this.game = game;
    this.roomX = x; //Math.floor(- this.width / 2);
    this.roomY = y; //Math.floor(- this.height / 2);
    this.width = w;
    this.height = h;
    this.type = type;
    this.depth = depth;
    this.mapGroup = mapGroup;

    this.entered = false;
    this.turn = TurnState.playerTurn;
    this.playerTurnTime = Date.now();

    this.items = Array<Item>();
    this.projectiles = Array<Projectile>();
    this.hitwarnings = Array<HitWarning>();
    this.particles = Array<Particle>();
    this.doors = Array<Door>();
    this.enemies = Array<Enemy>();
    this.lightSources = Array<LightSource>();
    this.walls = Array<Wall>();

    this.levelArray = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      this.levelArray[x] = [];
    }
    this.vis = [];
    this.softVis = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      this.vis[x] = [];
      this.softVis[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.vis[x][y] = 1;
        this.softVis[x][y] = 1;
      }
    }

    this.skin = SkinType.DUNGEON;
    if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
      this.skin = SkinType.CAVE;
    this.buildEmptyRoom();
  }

  addDoor = (x: number, y: number) => {
    let d;
    let t = DoorType.DOOR;
    if (this.type === RoomType.BOSS) t = DoorType.GUARDEDDOOR;
    if (this.type === RoomType.KEYROOM) t = DoorType.LOCKEDDOOR;
    if (x === this.roomX) {
      d = new Door(this, this.game, x, y, 1, t); //last argument, enum 0 is for locked
      this.levelArray[x + 1][y] = new SpawnFloor(this, x + 1, y);
    } else if (x === this.roomX + this.width - 1) {
      d = new Door(this, this.game, x, y, 3, t);
      this.levelArray[x - 1][y] = new SpawnFloor(this, x - 1, y);
    } else if (y === this.roomY) {
      d = new Door(this, this.game, x, y, 0, t);
      this.levelArray[x][y + 1] = new SpawnFloor(this, x, y + 1);
    } else if (y === this.roomY + this.height - 1) {
      d = new Door(this, this.game, x, y, 2, t);
      this.levelArray[x][y - 1] = new SpawnFloor(this, x, y - 1);
    }

    this.doors.push(d);
    if (this.levelArray[d.x] == undefined) {
      console.log(
        "UNDEFINED at " +
          d.x +
          " levelArray.length was " +
          this.levelArray.length
      );
      console.log("location " + location);
      console.log(this.roomX, this.roomY);
      console.log(this.width, this.height);
    }
    this.levelArray[d.x][d.y] = d;

    return d;
  };

  exitLevel = () => {
    this.particles.splice(0, this.particles.length);
  };

  enterLevel = (player: Player) => {
    player.moveSnap(
      this.roomX + Math.floor(this.width / 2),
      this.roomY + Math.floor(this.height / 2)
    );

    this.clearDeadStuff();
    this.updateLighting();
    this.entered = true;
    this.message = this.name;
  };

  enterLevelThroughDoor = (player: Player, door: any, side?: number) => {
    if (door instanceof Door && door.doorDir === DoorDir.North) {
      //if top door
      (door as Door).opened = true;
      player.moveNoSmooth(door.x, door.y + 1);
    } else if (door instanceof Door && door.doorDir === DoorDir.South) {
      //if bottom door
      player.moveNoSmooth(door.x, door.y - 1);
    } else if (
      door instanceof Door &&
      [DoorDir.East, DoorDir.West].includes(door.doorDir)
    ) {
      // if side door
      player.moveNoSmooth(door.x + side, door.y);
    }

    this.clearDeadStuff();
    this.updateLighting();
    this.entered = true;
    this.message = this.name;
  };

  enterLevelThroughLadder = (player: Player, ladder: any) => {
    player.moveSnap(ladder.x, ladder.y + 1);

    this.clearDeadStuff();
    this.updateLighting();
    this.entered = true;
    this.message = this.name;
  };

  getEmptyTiles = (): Tile[] => {
    let returnVal: Tile[] = [];
    for (let x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
      for (let y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
        if (
          !this.levelArray[x][y].isSolid() &&
          !(this.levelArray[x][y] instanceof SpikeTrap) &&
          !(this.levelArray[x][y] instanceof SpawnFloor)
        ) {
          returnVal.push(this.levelArray[x][y]);
        }
      }
    }
    for (const e of this.enemies) {
      returnVal = returnVal.filter((t) => !e.pointIn(t.x, t.y));
    }
    return returnVal;
  };

  getTile = (x: number, y: number) => {
    if (this.levelArray[x]) return this.levelArray[x][y];
    else return undefined;
  };

  fadeLighting = () => {
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (Math.abs(this.softVis[x][y] - this.vis[x][y]) >= 0.02) {
          if (this.softVis[x][y] < this.vis[x][y]) this.softVis[x][y] += 0.02;
          else if (this.softVis[x][y] > this.vis[x][y])
            this.softVis[x][y] -= 0.02;
        }
        //if (this.softVis[x][y] < 0.05) this.softVis[x][y] = 0;
      }
    }
  };

  updateLighting = () => {
    let oldVis = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      oldVis[x] = [];
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        oldVis[x][y] = this.vis[x][y];
        this.vis[x][y] = 1;
        //if (this.visibilityArray[x][y] > LevelConstants.MIN_VISIBILITY)
        //  this.visibilityArray[x][y] = 0;
      }
    }
    for (const p in this.game.players) {
      if (this === this.game.levels[this.game.players[p].levelID]) {
        for (let i = 0; i < 360; i += LevelConstants.LIGHTING_ANGLE_STEP) {
          this.castShadowsAtAngle(
            i,
            this.game.players[p].x + 0.5,
            this.game.players[p].y + 0.5,
            this.game.players[p].sightRadius - this.depth
          );
        }
      }
    }
    for (const l of this.lightSources) {
      for (let i = 0; i < 360; i += LevelConstants.LIGHTING_ANGLE_STEP) {
        this.castShadowsAtAngle(i, l.x, l.y, l.r);
      }
    }
    if (LevelConstants.SMOOTH_LIGHTING)
      this.vis = this.blur3x3(this.vis, [
        [1, 2, 1],
        [2, 8, 2],
        [1, 2, 1],
      ]);

    /*for (let x = 0; x < this.visibilityArray.length; x++) {
      for (let y = 0; y < this.visibilityArray[0].length; y++) {
        if (this.visibilityArray[x][y] < oldVisibilityArray[x][y]) {
          this.visibilityArray[x][y] = Math.min(
            oldVisibilityArray[x][y],
            LevelConstants.MIN_VISIBILITY
          );
        }
      }
    }*/
  };

  castShadowsAtAngle = (
    angle: number,
    px: number,
    py: number,
    radius: number
  ) => {
    let dx = Math.cos((angle * Math.PI) / 180);
    let dy = Math.sin((angle * Math.PI) / 180);
    let onOpaqueSection = false;
    for (let i = 0; i < radius; i++) {
      if (
        Math.floor(px) < this.roomX ||
        Math.floor(px) >= this.roomX + this.width ||
        Math.floor(py) < this.roomY ||
        Math.floor(py) >= this.roomY + this.height
      )
        return; // we're outside the level

      let tile = this.levelArray[Math.floor(px)][Math.floor(py)];
      if (tile.isOpaque()) {
        if (i > 0) onOpaqueSection = true;
      } else if (onOpaqueSection) {
        return;
      }

      this.vis[Math.floor(px)][Math.floor(py)] = Math.min(
        this.vis[Math.floor(px)][Math.floor(py)],
        Math.min(i / radius, 1)
      );

      px += dx;
      py += dy;
    }
  };

  blur3x3 = (
    array: Array<Array<number>>,
    weights: Array<Array<number>>
  ): Array<Array<number>> => {
    let blurredArray = [];
    for (let x = 0; x < array.length; x++) {
      blurredArray[x] = [];
      for (let y = 0; y < array[0].length; y++) {
        if (array[x][y] === 0) {
          blurredArray[x][y] = 0;
          continue;
        }
        let total = 0;
        let totalWeights = 0;
        for (let xx = -1; xx <= 1; xx++) {
          for (let yy = -1; yy <= 1; yy++) {
            if (
              x + xx >= 0 &&
              x + xx < array.length &&
              y + yy >= 0 &&
              y + yy < array[0].length
            ) {
              total += array[x + xx][y + yy] * weights[xx + 1][yy + 1];
              totalWeights += weights[xx + 1][yy + 1];
            }
          }
        }
        blurredArray[x][y] = total / totalWeights;
      }
    }
    return blurredArray;
  };

  catchUp = () => {
    if (this.turn === TurnState.computerTurn) this.computerTurn(); // player skipped computer's turn, catch up
  };

  tick = (player: Player) => {
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateLighting();

    for (const h of this.hitwarnings) {
      h.tick();
    }

    for (const p of this.projectiles) {
      p.tick();
    }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.levelArray[x][y].tick();
      }
    }

    this.turn = TurnState.computerTurn;
    player.actionTab.setState(ActionState.WAIT);
    //sets the action tab state to Ready
    this.playerTurnTime = Date.now();
    this.playerTicked = player;
  };

  update = () => {
    if (this.turn == TurnState.computerTurn) {
      if (
        Date.now() - this.playerTurnTime >=
        LevelConstants.COMPUTER_TURN_DELAY
      ) {
        this.computerTurn();
      }
    }
  };

  clearDeadStuff = () => {
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.hitwarnings = this.hitwarnings.filter((h) => !h.dead);
    this.particles = this.particles.filter((p) => !p.dead);
  };

  computerTurn = () => {
    // take computer turn
    for (const e of this.enemies) {
      e.tick();
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    for (const i of this.items) {
      i.tick();
    }

    for (const h of this.hitwarnings) {
      if (
        !this.levelArray[h.x] ||
        !this.levelArray[h.x][h.y] ||
        this.levelArray[h.x][h.y].isSolid()
      )
        h.dead = true;
    }

    for (const p of this.projectiles) {
      if (this.levelArray[p.x][p.y].isSolid()) p.dead = true;
      for (const i in this.game.players) {
        if (
          this.game.levels[this.game.players[i].levelID] === this &&
          p.x === this.game.players[i].x &&
          p.y === this.game.players[i].y
        ) {
          p.hitPlayer(this.game.players[i]);
        }
      }
      for (const e of this.enemies) {
        if (p.x === e.x && p.y === e.y) {
          p.hitEnemy(e);
        }
      }
    }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.levelArray[x][y].tickEnd();
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead); // enemies may be killed by spiketrap

    this.clearDeadStuff();

    this.playerTicked.finishTick();
    this.turn = TurnState.playerTurn;
  };

  draw = (delta: number) => {
    HitWarning.updateFrame(delta);

    this.fadeLighting();
  };

  drawEntities = (delta: number, skipLocalPlayer?: boolean) => {
    let tiles = [];
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.softVis[x][y] < 1)
          this.levelArray[x][y].drawUnderPlayer(delta);
        tiles.push(this.levelArray[x][y]);
      }
    }

    let drawables = new Array<Drawable>();

    drawables = drawables.concat(
      tiles,
      this.enemies,
      this.hitwarnings,
      this.projectiles,
      this.particles,
      this.items
    );
    for (const i in this.game.players) {
      if (this.game.levels[this.game.players[i].levelID] === this) {
        if (
          !(
            skipLocalPlayer &&
            this.game.players[i] === this.game.players[this.game.localPlayerID]
          )
        )
          drawables.push(this.game.players[i]);
      }
    }
    drawables.sort((a, b) => {
      if (a instanceof Floor) {
        return -1;
      } else if (b instanceof Floor) {
        return 1;
      }
      if (Math.abs(a.drawableY - b.drawableY) < 0.1) {
        if (a instanceof Player) {
          return 1;
        } else if (b instanceof Player) {
          return -1;
        } else if (a instanceof Enemy) {
          return 1;
        } else if (b instanceof Enemy) {
          return -1;
        } else return 0;
      } else {
        return a.drawableY - b.drawableY;
      }
    });

    for (const d of drawables) {
      d.draw(delta);
    }

    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        if (this.softVis[x][y] < 1)
          this.levelArray[x][y].drawAbovePlayer(delta);
      }
    }

    for (const i of this.items) {
      i.drawTopLayer(delta);
    }
  };

  drawShade = (delta: number) => {
    let bestSightRadius = 0;
    for (const p in this.game.players) {
      if (
        this.game.levels[this.game.players[p].levelID] === this &&
        this.game.players[p].sightRadius > bestSightRadius
      ) {
        bestSightRadius = this.game.players[p].sightRadius;
      }
    }
    let shadingAlpha = Math.max(
      0,
      Math.min(0.8, (2 * this.depth) / bestSightRadius)
    );
    if (GameConstants.ALPHA_ENABLED) {
      Game.ctx.globalAlpha = shadingAlpha;
      //Game.ctx.fillStyle = "#400a0e";
      Game.ctx.fillStyle = this.shadeColor;
      Game.ctx.fillRect(
        (this.roomX - LevelConstants.SCREEN_W) * GameConstants.TILESIZE,
        (this.roomY - LevelConstants.SCREEN_H) * GameConstants.TILESIZE,
        (this.width + 2 * LevelConstants.SCREEN_W) * GameConstants.TILESIZE,
        (this.height + 2 * LevelConstants.SCREEN_H) * GameConstants.TILESIZE
      );
      Game.ctx.globalAlpha = 1.0;
      Game.ctx.globalCompositeOperation = "source-over";
    }
  };

  drawOverShade = (delta: number) => {
    for (const e of this.enemies) {
      e.drawTopLayer(delta); // health bars
    }

    for (const p of this.projectiles) {
      p.drawTopLayer(delta);
    }

    for (const h of this.hitwarnings) {
      h.drawTopLayer(delta);
    }

    // draw over dithered shading
    for (let x = this.roomX; x < this.roomX + this.width; x++) {
      for (let y = this.roomY; y < this.roomY + this.height; y++) {
        this.levelArray[x][y].drawAboveShading(delta);
      }
    }
  };

  // for stuff rendered on top of the player
  drawTopLayer = (delta: number) => {
    // gui stuff

    // room name
    let old = Game.ctx.font;
    Game.ctx.font = GameConstants.SCRIPT_FONT_SIZE + "px Script";
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(
      this.message,
      GameConstants.WIDTH / 2 - Game.measureText(this.name).width / 2,
      5
    );
    Game.ctx.font = old;
  };
}
