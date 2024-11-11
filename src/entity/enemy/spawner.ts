import { Entity, EntityDirection } from "../entity";
import { LevelConstants } from "../../levelConstants";
import { Game } from "../../game";
import { Room } from "../../room";
import { astar } from "../../astarclass";
import { Heart } from "../../item/heart";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { GameConstants } from "../../gameConstants";
import { HitWarning } from "../../hitWarning";
import { GreenGem } from "../../item/greengem";
import { SpikeTrap } from "../../tile/spiketrap";
import { SkullEnemy } from "./skullEnemy";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { RedGem } from "../../item/redgem";
import { BlueGem } from "../../item/bluegem";
import { KnightEnemy } from "./knightEnemy";
import { WizardEnemy } from "./wizardEnemy";
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

export class Spawner extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  enemySpawnType: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.enemySpawnType = Game.randTable(
      [1, 2, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      Random.rand
    );

    this.name = "reaper";
  }

  hit = (): number => {
    return 1;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.tileX = 6;
      if (this.ticks % 8 === 0) {
        const positions = this.room
          .getEmptyTiles()
          .filter(
            (t) => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1
          );
        if (positions.length > 0) {
          this.tileX = 7;

          const position = Game.randTable(positions, Random.rand);

          let spawned;
          switch (this.enemySpawnType) {
            case 1:
              spawned = new KnightEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 2:
              spawned = new SkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 3:
              spawned = new EnergyWizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 4:
              spawned = new ZombieEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 5:
              spawned = new BishopEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 6:
              spawned = new CrabEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 7:
              spawned = new ChargeEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 8:
              spawned = new BigSkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              for (let xx = 0; xx < 2; xx++) {
                for (let yy = 0; yy < 2; yy++) {
                  this.room.roomArray[position.x + xx][position.y + yy] =
                    new Floor(this.room, position.x + xx, position.y + yy); // remove any walls
                }
              }
              break;
            case 9:
              spawned = new FrogEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 10:
              spawned = new FireWizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
            case 11:
              spawned = new QueenEnemy(
                this.room,
                this.game,
                position.x,
                position.y
              );
              break;
          }
          this.room.projectiles.push(
            new EnemySpawnAnimation(this.room, spawned, position.x, position.y)
          );
          this.room.hitwarnings.push(
            new HitWarning(this.game, position.x, position.y, this.x, this.y)
          );
        }
      }
      this.ticks++;
    }
  };

  draw = (delta: number) => {
    if (!this.dead) {
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
          this.shadeAmount()
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
        this.room.shadeColor,
        this.shadeAmount()
      );
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta);
    }
  };

  dropLoot = () => {
    this.room.items.push(new BlueGem(this.room, this.x, this.y));
  };
}
