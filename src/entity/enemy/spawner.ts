import { Game } from "../../game";
import { Room } from "../../room/room";
import { Floor } from "../../tile/floor";
import { HitWarning } from "../../drawable/hitWarning";
import { SkullEnemy } from "./skullEnemy";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { KnightEnemy } from "./knightEnemy";
import { Enemy } from "./enemy";
import { Random } from "../../utility/random";
import { EnergyWizardEnemy } from "./energyWizard";
import { ZombieEnemy } from "./zombieEnemy";
import { BishopEnemy } from "./bishopEnemy";
import { CrabEnemy } from "./crabEnemy";
import { ChargeEnemy } from "./chargeEnemy";
import { BigKnightEnemy } from "./bigKnightEnemy";
import { BigSkullEnemy } from "./bigSkullEnemy";
import { FrogEnemy } from "./frogEnemy";
import { FireWizardEnemy } from "./fireWizard";
import { QueenEnemy } from "./queenEnemy";
import { ArmoredzombieEnemy } from "./armoredzombieEnemy";
import { RookEnemy } from "./rookEnemy";
import { RoomType } from "../../room/room";
import { ArmoredSkullEnemy } from "./armoredSkullEnemy";
import { GameplaySettings } from "../../game/gameplaySettings";
import { SpiderEnemy } from "./spiderEnemy";
import { MummyEnemy } from "./mummyEnemy";
import { PawnEnemy } from "./pawnEnemy";
import { BeetleEnemy } from "./beetleEnemy";
import { BigFrogEnemy } from "./bigFrogEnemy";
import { Wall } from "../../tile/wall";

export class Spawner extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  enemySpawnType: number;
  enemyTable: number[];
  spawnFrequency: number;
  spawnOffset: number;
  static tileX: number = 6;
  static tileY: number = 4;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    enemyTable: number[] = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 20,
    ],
  ) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.defaultMaxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.spawnFrequency = 4;
    this.room.currentSpawnerCount++;
    this.enemyTable = enemyTable; //enemyTable.filter((t) => t !== 7);
    const randSpawnType = Game.randTable(this.enemyTable, Random.rand);
    this.enemySpawnType = randSpawnType;
    this.spawnOffset = 0;
    this.dropChance = 1;
    this.chainPushable = false;
    this.destroyableByOthers = false;
    this.getDrop(["reaper"], false);
    /*
    switch (this.enemySpawnType) {
      case 0:
        this.getDrop(["consumable"], true);
        break;
      case 1:
        this.getDrop(["gem"], true);
        break;
      case 2:
        this.getDrop(["consumable"], true);
        break;
      case 3:
        this.getDrop(["gem"], true);
        break;
      case 4:
        this.getDrop(["gem"], true);
        break;
      case 5:
        this.getDrop(["consumable"], true);
        break;
      case 6:
        this.getDrop(["gem"], true);
        break;
      case 7:
        this.getDrop(["gem"], true);
        break;
      case 8:
        this.getDrop(["gem"], true);
        break;
      case 9:
        this.getDrop(["equipment", "weapon", "tool"], true);
        break;
      case 10:
        this.getDrop(["weapon"], true);
        break;
      case 11:
        this.getDrop(["weapon"], true);
        break;
      case 12:
        this.getDrop(["weapon"], true);
        break;
      case 13:
        this.getDrop(["weapon"], true);
        break;
      case 14:
        this.getDrop(["weapon"], true);
        break;
      case 16:
        this.getDrop(["weapon", "equipment"], true);
        break;
    }*/
    this.name = "reaper";
    console.log("spawner created spawner type", this.enemySpawnType);
  }

  hit = (): number => {
    return 1;
  };

  setSpawnFrequency = (maxHealth: number = 1) => {
    if (GameplaySettings.UNLIMITED_SPAWNERS) {
      this.spawnFrequency = 4;
    } else {
      this.spawnFrequency = Math.min(12, 4 * this.room.currentSpawnerCount);
    }
    if (GameplaySettings.THROTTLE_SPAWNERS) {
      this.spawnFrequency = 3 + maxHealth;
    }

    const spawners = this.room.entities.filter((e) => e instanceof Spawner);
    this.spawnOffset = (spawners.indexOf(this) + 1) * 4;
  };

  bleed = () => {};
  poison = () => {};

  behavior = () => {
    let shouldSpawn = true;
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.tileX = 6;
      if ((this.ticks + this.spawnOffset) % this.spawnFrequency === 0) {
        let positions = this.room
          .getEmptyTiles()
          .filter(
            (t) => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1,
          );
        if (this.enemySpawnType === 8) {
          const offLimits = [
            { x: this.x, y: this.y },
            { x: this.x + 1, y: this.y + 1 },
            { x: this.x - 1, y: this.y - 1 },
            { x: this.x + 1, y: this.y - 1 },
            { x: this.x - 1, y: this.y + 1 },
          ];
          positions = positions.filter(
            (t) => !offLimits.some((o) => o.x === t.x && o.y === t.y),
          );
        }
        if (positions.length > 0) {
          this.tileX = 7;

          const position = Game.randTable(positions, Random.rand);

          let spawned: Enemy;

          const spawnPos = this.mutatePositionForBigEnemy(
            position.x,
            position.y,
          );

          switch (this.enemySpawnType) {
            case 0: // legacy Pawn mapping
              spawned = new PawnEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 1:
              spawned = new CrabEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 2:
              spawned = new FrogEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 3:
              spawned = new ZombieEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 4:
              spawned = new SkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 5:
              spawned = new EnergyWizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 6:
              spawned = new ChargeEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 7:
              spawned = new RookEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 8:
              spawned = new BishopEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 9:
              spawned = new ArmoredzombieEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 10:
              spawned = new BigSkullEnemy(
                this.room,
                this.game,
                spawnPos.x,
                spawnPos.y,
              );
              this.clearSpaceForBigEnemy(spawnPos.x, spawnPos.y);
              break;
            case 11:
              spawned = new QueenEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 12:
              spawned = new KnightEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 13:
              spawned = new BigKnightEnemy(
                this.room,
                this.game,
                spawnPos.x,
                spawnPos.y,
              );
              this.clearSpaceForBigEnemy(spawnPos.x, spawnPos.y);
              break;
            case 14:
              spawned = new FireWizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 15:
              spawned = new ArmoredSkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 16:
              spawned = new MummyEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 17:
              spawned = new SpiderEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 18:
              spawned = new PawnEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 19:
              spawned = new BigFrogEnemy(
                this.room,
                this.game,
                spawnPos.x,
                spawnPos.y,
              );
              this.clearSpaceForBigEnemy(spawnPos.x, spawnPos.y);
              break;
            case 20:
              spawned = new BeetleEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            default:
              console.warn(
                "spawner tried to spawn unknown enemy type",
                this.enemySpawnType,
              );
              spawned = new ZombieEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
          }

          this.setSpawnFrequency(spawned?.maxHealth ?? 1);

          if (shouldSpawn) {
            this.room.projectiles.push(
              new EnemySpawnAnimation(
                this.room,
                spawned,
                position.x,
                position.y,
              ),
            );
            this.room.hitwarnings.push(
              new HitWarning(this.game, position.x, position.y, this.x, this.y),
            );
          }
        }
      }

      this.ticks++;
    }
  };

  mutatePositionForBigEnemy = (x: number, y: number) => {
    // Evaluate the full 2x2 footprint: (x,y), (x+1,y), (x,y+1), (x+1,y+1)
    const tiles = [
      { x, y },
      { x: x + 1, y },
      { x, y: y + 1 },
      { x: x + 1, y: y + 1 },
    ];

    // If none of the 2x2 tiles are walls, keep position
    const hasAnyWall = tiles.some(
      (p) => this.room.roomArray[p.x]?.[p.y] instanceof Wall,
    );
    if (!hasAnyWall) return { x, y };

    // Determine inward nudge based on any wall on room edges or outer walls
    let nx = x;
    let ny = y;
    const leftEdge = this.room.roomX;
    const rightEdge = this.room.roomX + this.room.width - 1;
    const topEdge = this.room.roomY;
    const bottomEdge = this.room.roomY + this.room.height - 1;

    const anyLeftWall = tiles.some((p) => {
      const t = this.room.roomArray[p.x]?.[p.y];
      if (p.x === leftEdge) return true;
      if (t instanceof Wall) return t.wallInfo?.()?.isLeftWall === true;
      return false;
    });
    const anyRightWall = tiles.some((p) => {
      const t = this.room.roomArray[p.x]?.[p.y];
      if (p.x === rightEdge) return true;
      if (t instanceof Wall) return t.wallInfo?.()?.isRightWall === true;
      return false;
    });
    const anyTopWall = tiles.some((p) => {
      const t = this.room.roomArray[p.x]?.[p.y];
      if (p.y === topEdge) return true;
      if (t instanceof Wall) return t.wallInfo?.()?.isTopWall === true;
      return false;
    });
    const anyBottomWall = tiles.some((p) => {
      const t = this.room.roomArray[p.x]?.[p.y];
      if (p.y === bottomEdge) return true;
      if (t instanceof Wall) return t.wallInfo?.()?.isBottomWall === true;
      return false;
    });

    if (anyLeftWall) nx = Math.min(x + 1, rightEdge - 1);
    if (anyRightWall) nx = Math.max(x - 1, leftEdge + 1);
    if (anyTopWall) ny = Math.min(y + 1, bottomEdge - 1);
    if (anyBottomWall) ny = Math.max(y - 1, topEdge + 1);

    // Validate 2x2 stays inside room interior bounds
    nx = Math.max(nx, leftEdge);
    nx = Math.min(nx, rightEdge - 1);
    ny = Math.max(ny, topEdge);
    ny = Math.min(ny, bottomEdge - 1);

    // Prefer non-solid top-left if available
    const topLeft = this.room.roomArray[nx]?.[ny];
    if (!topLeft || (topLeft as any).isSolid?.() !== true) {
      return { x: nx, y: ny };
    }
    return { x, y };
  };

  clearSpaceForBigEnemy = (x: number, y: number) => {
    for (let xx = 0; xx < 2; xx++) {
      for (let yy = 0; yy < 2; yy++) {
        let tile = this.room.roomArray[x + xx][y + yy];
        if (tile instanceof Wall) {
          const wallInfo = tile.wallInfo();
          if (wallInfo?.isInnerWall) {
            this.room.roomArray[x + xx][y + yy] = new Floor(
              this.room,
              x + xx,
              y + yy,
            ); // remove any walls
          }
        }
      }
    }
  };

  uniqueKillBehavior = () => {
    this.room.currentSpawnerCount--;
  };

  draw = (delta: number) => {
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
      );
    }
    if (!this.dying) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
    Game.ctx.restore();
  };
}
