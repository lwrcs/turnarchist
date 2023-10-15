import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/wizardEnemy";
import { Player } from "../player";
import { Entity } from "../entity/entity";
import { Room } from "../room";
import { GenericParticle } from "../particle/genericParticle";
import { Sound } from "../sound";
import { HitWarning } from "../hitWarning";

export class EnemySpawnAnimation extends Projectile {
  readonly ANIM_COUNT = 3;

  level: Room;
  enemy: Entity;
  frame: number;

  constructor(level: Room, enemy: Entity, x: number, y: number) {
    super(x, y);
    this.level = level;
    this.enemy = enemy;
    this.frame = 0;
  }

  tick = () => {
    if (this.level === this.level.game.level) Sound.enemySpawn();

    let hitPlayer = false;
    for (const i in this.level.game.players) {
      if (this.level.game.players[i].x === this.x && this.level.game.players[i].y === this.y) {
        this.level.game.players[i].hurt(0.5, "reaper");
        hitPlayer = true;
      }
    }
    if (!hitPlayer) {
      this.dead = true;
      this.enemy.skipNextTurns = 1;
      this.level.entities.push(this.enemy);
      GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#ffffff");
      GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#ffffff");
    } else {
      this.level.hitwarnings.push(new HitWarning(this.level.game, this.x, this.y));
    }
  };

  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    this.frame += 0.25 * delta;
    if (this.frame >= 8) this.frame = 0;
    for (let i = 0; i < this.ANIM_COUNT; i++) {
      let offsetX = 0;
      Game.drawFX(
        Math.floor(this.frame),
        26,
        1,
        2,
        this.x + Math.round(offsetX) / 16.0,
        this.y - 1.5,
        1,
        2
      );
    }
    if (Math.floor(this.frame * 4) % 2 == 0)
      this.level.particles.push(
        new GenericParticle(
          this.level,
          this.x + 0.5 + Math.random() * 0.05 - 0.025,
          this.y + Math.random() * 0.05 - 0.025,
          0.25,
          Math.random() * 0.5,
          0.025 * (Math.random() * 1 - 0.5),
          0.025 * (Math.random() * 1 - 0.5),
          0.2 * (Math.random() - 1),
          "#ffffff",
          0
        )
      );
  };
}
