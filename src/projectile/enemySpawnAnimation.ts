import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player/player";
import { Entity } from "../entity/entity";
import { Room } from "../room/room";
import { GenericParticle } from "../particle/genericParticle";
import { Sound } from "../sound/sound";
import { HitWarning } from "../drawable/hitWarning";
import { ImageParticle } from "../particle/imageParticle";
import { LightSource } from "../lighting/lightSource";

export class EnemySpawnAnimation extends Projectile {
  readonly ANIM_COUNT = 3;

  room: Room;
  enemy: Entity;
  frame: number;
  constructor(room: Room, enemy: Entity, x: number, y: number) {
    super(enemy, x, y);
    this.room = room;
    this.enemy = enemy;
    this.frame = 0;
    this.hasBloom = true;
    this.bloomColor = "#00BFFF";
    this.bloomOffsetY = -0.5;

    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      1,
      [0, 50, 150],
      1,
    );
    this.room.lightSources.push(this.lightSource);
    this.room.updateLighting({ x: this.x, y: this.y });
  }

  tick = () => {
    if (this.room === this.room.game.room) Sound.enemySpawn();

    let hitPlayer = false;
    for (const i in this.room.game.players) {
      if (
        this.room.game.players[i].x === this.x &&
        this.room.game.players[i].y === this.y
      ) {
        this.room.game.players[i].hurt(0.5, "reaper");
        hitPlayer = true;
      }
    }
    if (!hitPlayer) {
      this.dead = true;
      this.enemy.skipNextTurns = 1;
      this.room.entities.push(this.enemy);
      this.enemy.createHitParticles();
      this.lightSource.dead = true;
    } else {
      this.room.hitwarnings.push(
        new HitWarning(this.room.game, this.x, this.y, this.x, this.y),
      );
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
        27,
        1,
        1,
        this.x + Math.round(offsetX) / 16.0,
        this.y - 0.5,
        1,
        1,
      );
    }
  };
}
