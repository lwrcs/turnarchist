import { Entity } from "../entity";
import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { Candle } from "../../item/light/candle";
import { Random } from "../../utility/random";
import { Coin } from "../../item/coin";
import { Sound } from "../../sound/sound";
import { LightSource } from "../../lighting/lightSource";
import { WizardFireball } from "../../projectile/wizardFireball";
import { WizardEnemy } from "../enemy/wizardEnemy";
import { Lighting } from "../../lighting/lighting";
import { PlayerFireball } from "../../projectile/playerFireball";
import { Player } from "../../player/player";
import { Explosion } from "../../projectile/explosion";
import { Utils } from "../../utility/utils";

export class Bomb extends Entity {
  static examineText = "A bomb. Light it and leave.";
  fuseLength: number = 4;
  lit: boolean = false;
  playerHitBy: Player | null = null;
  fuseSound: HTMLAudioElement;
  soundPaused: boolean = false;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 15;
    this.tileY = 4;
    this.hasShadow = true;
    this.chainPushable = false;
    this.name = "bomb";
    this.frame = 0;
    this.hasBloom = false;
    this.bloomColor = "yellow";
    this.bloomAlpha = 0;
    this.bloomSize = 1;
    this.bloomOffsetY = -1;
    this.health = 1;
    this.hitSound = Sound.potSmash;
    this.imageParticleX = 0;
    this.imageParticleY = 29;
    this.createLightSource();
    this.playerHitBy = null;
    this.fuseSound = Sound.fuseLoopSound;
    this.soundPaused = false;
  }

  get type() {
    return EntityType.PROP;
  }

  uniqueKillBehavior = () => {
    if (this.cloned) return;

    //this.room.addEntity(new Explosion(this.room, this.game, this.x, this.y));
  };

  tick = () => {
    if (this.lit) {
      this.fuseLength--;
      //if (this.fuseLength < 3 && this.fuseLength > 0)
      if (this.fuseLength <= 0) {
        // Sound.playFuse();
        this.fuseLength = 0;
        Sound.stopSound(this.fuseSound);
        this.explode();
        Sound.playBomb();
      }
    }
  };

  createLightSource = () => {
    if (!this.lit) return;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      3,
      [200, 200, 30],
      0.75,
    );
    this.addLightSource(this.lightSource);
    this.bloomAlpha = 1;
    this.hasBloom = true;
  };

  hurt = (playerHitBy: Player | null, damage: number) => {
    if (!this.lit) {
      this.lit = true;
      this.createLightSource();
      this.playerHitBy = playerHitBy;
      Sound.playFuse();
    }
  };

  explode = () => {
    Sound.stopSound(this.fuseSound);
    for (let x = this.x - 2; x < this.x + 3; x++) {
      for (let y = this.y - 2; y < this.y + 3; y++) {
        if (
          this.room.pointExists(x, y) &&
          !this.room.roomArray[x][y].isSolid() &&
          Utils.distance(this.x, this.y, x, y) < 2.5
        ) {
          const explosion = new Explosion(this, x, y, this.playerHitBy);
          this.room.projectiles.push(explosion);
        }
      }
    }
    this.health = 0;
    Lighting.momentaryLight(
      this.room,
      this.x,
      this.y,
      7,
      [200, 200, 50],
      250,
      50,
      0,
    );

    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "white",
    );
    this.kill();

    setTimeout(() => {
      this.game.shakeScreen(
        (Random.rand() - 0.5) * 5,
        (Random.rand() - 0.5) * 0,
        false,
      );
    }, 100);

    this.game.shakeScreen(0, 20, false);
  };

  draw = (delta: number) => {
    if (this.dead) return;
    this.frame += delta;
    if (this.health === 0) {
      this.frame = 0;
    }
    if (this.frame > 20) this.frame = 0;
    this.bloomAlpha = (this.frame / 10) % 2 === 0 ? 1 : 0.5;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta);

      this.updateDrawXY(delta);
      if (this.lit) {
        Game.drawObj(
          this.tileX +
            6 -
            Math.min(3, this.fuseLength) * 2 +
            (Math.floor(this.frame / 10) % 2),
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
      } else {
        Game.drawObj(
          this.tileX - 1,
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
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
