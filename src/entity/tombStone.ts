import { Entity } from "./entity";
import { Room } from "../room";
import { Game } from "../game";
import { Heart } from "../item/heart";
import { LevelConstants } from "../levelConstants";
import { GenericParticle } from "../particle/genericParticle";
import { EntityType } from "./entity";
import { SkullEnemy } from "./skullEnemy";
import { Random } from "../random";
import { EnemySpawnAnimation } from "../projectile/enemySpawnAnimation";
import { Player } from "../player";
import { Item } from "../item/item";
import { Spellbook } from "../weapon/spellbook";
import { Sound } from "../sound";
import { ImageParticle } from "../particle/imageParticle";

export class TombStone extends Entity {
  skinType: number;
  rand: () => number;

  constructor(
    level: Room,
    game: Game,
    x: number,
    y: number,
    skinType: number,
    rand: () => number,
    drop?: Item
  ) {
    super(level, game, x, y);
    this.skinType = skinType;
    this.room = level;
    this.health = 2;
    this.maxHealth = 2;
    this.tileX = 11 + this.skinType;
    this.tileY = 2;
    this.hasShadow = false;
    this.pushable = false;
    this.entityType = EntityType.PROP;
    this.destroyable = true;
    this.skinType = skinType;
    this.rand = rand;
    this.chainPushable = false;

    let dropProb = Random.rand();
    if (dropProb < 0.05) this.drop = new Spellbook(this.room, 0, 0);
  }

  kill = () => {
    this.dead = true;
    ImageParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      0,
      25,
      "#d9a066"
    );
    this.dropLoot();
  };

  hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();
    ImageParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      0,
      25,
      "#d9a066"
    );

    this.health -= damage;
    if (this.health === 1) {
      const positions = this.room
        .getEmptyTiles()
        .filter(
          (t) => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1
        );
      if (positions.length > 0) {
        for (let position of positions) {
          for (const i in this.game.players) {
            const playerX = this.game.players[i].x;
            const playerY = this.game.players[i].y;
            if (
              (playerX !== position.x && playerY === position.y) ||
              (playerX === position.x && playerY !== position.y)
            ) {
              this.room.entities.push(
                new SkullEnemy(
                  this.room,
                  this.game,
                  position.x,
                  position.y,
                  Random.rand
                )
              );
            }
          }
        }
        Sound.skeleSpawn()
      }
      this.tileX += 2;
      //draw half broken tombstone based on skintype after it takes one damage
    }
    if (this.health <= 0) this.kill(), Sound.breakRock();
    else this.hurtCallback();
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
        this.room.shadeColor,
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
