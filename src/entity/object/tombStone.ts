import { Entity } from "../entity";
import { Room } from "../../room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { SkullEnemy } from "../enemy/skullEnemy";
import { Random } from "../../random";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { Player } from "../../player";
import { Item } from "../../item/item";
import { Spellbook } from "../../weapon/spellbook";
import { Sound } from "../../sound";
import { ImageParticle } from "../../particle/imageParticle";
import { LightSource } from "../../lightSource";

export class TombStone extends Entity {
  skinType: number;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    skinType: number,
    drop?: Item,
  ) {
    super(room, game, x, y);
    this.skinType = skinType;
    this.room = room;
    this.health = 2;
    this.maxHealth = 2;
    this.tileX = 11 + this.skinType;
    this.tileY = 2;
    this.hasShadow = false;
    this.pushable = false;
    this.destroyable = true;
    this.skinType = skinType;
    this.chainPushable = false;
    this.name = "tombstone";
    let dropProb = Random.rand();
    if (dropProb < 0.05) this.drop = new Spellbook(this.room, this.x, this.y);
    this.hasBloom = true;
    this.bloomColor = "#05FF05";
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      7,
      [5, 150, 5],
      1,
    );
    this.addLightSource(this.lightSource);
  }

  get type() {
    return EntityType.PROP;
  }

  kill = () => {
    this.removeLightSource(this.lightSource);
    this.dead = true;
    this.dropLoot();
  };

  hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 25);

    Sound.delayPlay(Sound.hurt, 0);

    this.health -= 1;
    if (this.health === 1) {
      const positions = this.room
        .getEmptyTiles()
        .filter(
          (t) => Math.abs(t.x - this.x) <= 1 && Math.abs(t.y - this.y) <= 1,
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
                new SkullEnemy(this.room, this.game, position.x, position.y),
              );
            }
          }
        }
        Sound.delayPlay(Sound.skeleSpawn, 50);
      }
      this.tileX += 2;
      //draw half broken tombstone based on skintype after it takes one damage
    }
    if (this.health <= 0) {
      this.kill();
      Sound.delayPlay(Sound.breakRock, 50);
    } else {
      this.hurtCallback();
      //Sound.delayPlay(Sound.hit, 0);
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      Game.drawObj(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.updateDrawXY(delta);
  };
}
