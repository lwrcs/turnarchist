import { Enemy, EnemyDirection } from "./enemy";
import { LevelConstants } from "../levelConstants";
import { Game } from "../game";
import { Level } from "../level";
import { astar } from "../astarclass";
import { Heart } from "../item/heart";
import { Floor } from "../tile/floor";
import { Bones } from "../tile/bones";
import { DeathParticle } from "../particle/deathParticle";
import { GameConstants } from "../gameConstants";
import { HitWarning } from "../hitWarning";
import { GreenGem } from "../item/greengem";
import { SpikeTrap } from "../tile/spiketrap";
import { SkullEnemy } from "./skullEnemy";
import { EnemySpawnAnimation } from "../projectile/enemySpawnAnimation";
import { RedGem } from "../item/redgem";
import { BlueGem } from "../item/bluegem";
import { KnightEnemy } from "./knightEnemy";
import { WizardEnemy } from "./wizardEnemy";

export class Spawner extends Enemy {
  ticks: number;
  seenPlayer: boolean;
  enemySpawnType: number;
  rand: () => number;

  constructor(level: Level, game: Game, x: number, y: number, rand: () => number) {
    super(level, game, x, y);
    this.ticks = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.tileX = 6;
    this.tileY = 4;
    this.seenPlayer = true;
    this.enemySpawnType = Game.randTable([1, 2, 2, 2, 2, 3], rand);
    this.deathParticleColor = "#ffffff";

    this.rand = rand;
  }

  hit = (): number => {
    return 1;
  };

  tick = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.tileX = 6;
      if (this.ticks % 8 === 0) {
        const positions = this.level.getEmptyTiles().filter(t => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1);
        if (positions.length > 0) {
          this.tileX = 7;

          const position = Game.randTable(positions, this.rand);

          let spawned;
          switch (this.enemySpawnType) {
            case 1:
              spawned = new KnightEnemy(this.level, this.game, position.x, position.y, this.rand);
              break;
            case 2:
              spawned = new SkullEnemy(this.level, this.game, position.x, position.y, this.rand);
              break;
            case 3:
              spawned = new WizardEnemy(this.level, this.game, position.x, position.y, this.rand);
              break;
          }
          this.level.projectiles.push(
            new EnemySpawnAnimation(this.level, spawned, position.x, position.y)
          );
          this.level.hitwarnings.push(new HitWarning(this.game, position.x, position.y));
        }
      }
      this.ticks++;
    }
  };

  dropLoot = () => {
    this.level.items.push(new BlueGem(this.level, this.x, this.y));
  };
}
