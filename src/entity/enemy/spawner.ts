import { Game } from "../../game";
import { Room } from "../../room";
import { Floor } from "../../tile/floor";
import { HitWarning } from "../../hitWarning";
import { SkullEnemy } from "./skullEnemy";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { KnightEnemy } from "./knightEnemy";
import { Enemy } from "./enemy";
import { Random } from "../../random";
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
import { RoomType } from "../../room";

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
    enemyTable: number[] = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14],
  ) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.spawnFrequency = 4;
    this.room.currentSpawnerCount++;
    this.enemyTable = enemyTable.filter((t) => t !== 7);
    const randSpawnType = Game.randTable(this.enemyTable, Random.rand);
    this.enemySpawnType = randSpawnType;
    this.spawnOffset = 0;

    if (Math.random() < 0.15) {
      switch (this.enemySpawnType) {
        case 0:
          this.getDrop(["consumable"]);
          break;
        case 1:
          this.getDrop(["gem"]);
          break;
        case 2:
          this.getDrop(["consumable"]);
          break;
        case 3:
          this.getDrop(["gem"]);
          break;
        case 4:
          this.getDrop(["gem"]);
          break;
        case 5:
          this.getDrop(["consumable"]);
          break;
        case 6:
          this.getDrop(["gem"]);
          break;
        case 7:
          this.getDrop(["gem"]);
          break;
        case 8:
          this.getDrop(["gem"]);
          break;
        case 9:
          this.getDrop(["equipment", "weapon", "tool"]);
          break;
        case 10:
          this.getDrop(["weapon"]);
          break;
        case 11:
          this.getDrop(["weapon"]);
          break;
        case 12:
          this.getDrop(["weapon"]);
          break;
        case 13:
          this.getDrop(["weapon"]);
          break;
        case 14:
          this.getDrop(["weapon"]);
          break;
      }
    } else {
      this.getDrop(["consumable", "tool"]);
    }
    this.name = "reaper";
  }

  hit = (): number => {
    return 1;
  };

  setSpawnFrequency = () => {
    this.spawnFrequency = Math.min(12, 4 * this.room.currentSpawnerCount);
    const spawners = this.room.entities.filter((e) => e instanceof Spawner);
    this.spawnOffset = (spawners.indexOf(this) + 1) * 4;
  };

  behavior = () => {
    this.setSpawnFrequency();
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

          let spawned;
          switch (this.enemySpawnType) {
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
              if (this.room.type !== RoomType.BIGDUNGEON) {
                spawned = new SkullEnemy(
                  this.room,
                  this.game,
                  position.x,
                  position.y,
                );
                break;
              }
              spawned = new BigSkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.room.roomArray[position.x + xx][position.y + yy] =
                    new Floor(this.room, position.x + xx, position.y + yy); // remove any walls
                }
              }
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
              if (this.room.type !== RoomType.BIGDUNGEON) {
                spawned = new KnightEnemy(
                  this.room,
                  this.game,
                  position.x,
                  position.y,
                );
                break;
              }

              spawned = new BigKnightEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.room.roomArray[position.x + xx][position.y + yy] =
                    new Floor(this.room, position.x + xx, position.y + yy); // remove any walls
                }
              }
              break;
            case 14:
              spawned = new ZombieEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
            case 15:
              spawned = new FireWizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
              );
              break;
          }

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
      if (shouldSpawn) this.ticks++;
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

      if (this.hasShadow)
        Game.drawMob(
          0,
          0,
          1,
          1,
          this.x - this.drawX,
          this.y - this.drawY,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount(),
        );
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
