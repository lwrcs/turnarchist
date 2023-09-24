import { Enemy } from "./enemy";
import { Level } from "../level";
import { Game } from "../game";
import { Heart } from "../item/heart";
import { LevelConstants } from "../levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { EntityType } from "./enemy";
import { SkullEnemy } from "./skullEnemy";
import { Random } from "../random";
import { EnemySpawnAnimation } from "../projectile/enemySpawnAnimation";

export class TombStone extends Enemy {
  skinType: number;
  rand: () => number;

  constructor(
    level: Level,
    game: Game,
    x: number,
    y: number,
    skinType: number,
    rand: () => number
  ) {
    super(level, game, x, y);
    this.skinType = skinType;
    this.level = level;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 11 + this.skinType;
    this.tileY = 2;
    this.hasShadow = false;
    this.pushable = false;
    this.entityType = EntityType.Prop;
    this.destroyable = true;
    this.skinType = skinType;
    this.rand = rand;
    this.chainPushable = false;
  }

  kill = () => {
    this.dead = true;
    const positions = this.level
      .getEmptyTiles()
      .filter(
        (t) => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1
      );
    if (positions.length > 0) {
      for (let i = 0; i < 3; i += 1) {
        let position = Game.randTable(positions, this.rand);
        let spawned = new SkullEnemy(
          this.level,
          this.game,
          position.x,
          position.y,
          Random.rand
        );
        this.level.enemies.push(spawned);
        //this.level.projectiles.push(
          //new EnemySpawnAnimation(this.level, spawned, position.x, position.y)
        //);
      }
    }

    GenericParticle.spawnCluster(
      this.level,
      this.x + 0.5,
      this.y + 0.5,
      "#d9a066"
    );
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    // not inherited because it doesn't have the 0.5 offset
    if (!this.dead) {
      Game.drawObj(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - 1 - this.drawY,
        1,
        2,
        this.level.shadeColor,
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.drawX += -0.5 * this.drawX;
    this.drawY += -0.5 * this.drawY;
  };
}
