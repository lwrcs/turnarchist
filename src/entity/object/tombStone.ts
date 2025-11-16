import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { SkullEnemy } from "../enemy/skullEnemy";
import { Random } from "../../utility/random";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { Spellbook } from "../../item/weapon/spellbook";
import { Sound } from "../../sound/sound";
import { ImageParticle } from "../../particle/imageParticle";
import { LightSource } from "../../lighting/lightSource";

export class TombStone extends Entity {
  skinType: number;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    skinType: number = 0,
    drop?: Item,
  ) {
    super(room, game, x, y);
    this.skinType = skinType;
    this.room = room;
    this.health = 2;
    //this.maxHealth = 2;
    this.tileX = 11 + this.skinType;
    this.tileY = 2;
    this.hasShadow = true;
    //this.pushable = false;
    //this.destroyable = true;
    //this.skinType = skinType;
    this.chainPushable = false;
    this.name = "tombstone";
    let dropProb = Random.rand();
    if (dropProb < 0.1)
      this.drops.push(new Spellbook(this.room, this.x, this.y));
    this.hasBloom = true;
    this.bloomColor = "#05FF05";
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.imageParticleX = 0;
    this.imageParticleY = 25;
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

  uniqueKillBehavior = () => {
    if (this.cloned) return;
    Sound.delayPlay(Sound.breakRock, 50);
  };

  onHurt = (damage: number = 1) => {
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
  };

  draw = (delta: number) => {
    if (this.dead) return;
    this.updateDrawXY(delta);
    if (this.hasShadow) this.drawShadow(delta);

    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    //if (!this.dead || !this.cloned) {{}
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

    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
