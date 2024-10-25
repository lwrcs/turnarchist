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

export class Spawner extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  enemySpawnType: number;
  rand: () => number;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    rand: () => number
  ) {
    super(room, game, x, y, rand);
    this.ticks = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.enemySpawnType = Game.randTable([1, 2, 2, 2, 2, 3], rand);

    this.rand = rand;
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

          const position = Game.randTable(positions, this.rand);

          let spawned;
          switch (this.enemySpawnType) {
            case 1:
              spawned = new KnightEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
                this.rand
              );
              break;
            case 2:
              spawned = new SkullEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
                this.rand
              );
              break;
            case 3:
              spawned = new WizardEnemy(
                this.room,
                this.game,
                position.x,
                position.y,
                this.rand
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

  dropLoot = () => {
    this.room.items.push(new BlueGem(this.room, this.x, this.y));
  };
}
