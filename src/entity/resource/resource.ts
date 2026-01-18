import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/usable/heart";
import { Armor } from "../../item/armor";
import { Entity } from "../entity";
import { LevelConstants } from "../../level/levelConstants";
import { GreenGem } from "../../item/resource/greengem";
import { Player } from "../../player/player";
import { Pickaxe } from "../../item/tool/pickaxe";
import { Spellbook } from "../../item/weapon/spellbook";
import { EntityType } from "../entity";
import { Sound } from "../../sound/sound";
import { statsTracker } from "../../game/stats";
import { computeMiningXp } from "../../game/skillBalance";
import { XPPopup } from "../../particle/xpPopup";
import { GameConstants } from "../../game/gameConstants";

export class Resource extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.chainPushable = false;
    this.name = "resource";
    this.imageParticleX = 6;
    this.imageParticleY = 24;
  }

  get type() {
    return EntityType.RESOURCE;
  }

  hurt = (playerHitBy: Player, damage: number) => {
    if (!playerHitBy.inventory?.getWeapon().canMine) return;
    this.healthBar.hurt();
    this.health -= damage;
    Sound.mine();
    this.hurtCallback();
    this.createHitParticles();

    if (this.health <= 0) {
      this.kill(playerHitBy);
    }
  };

  uniqueKillBehavior = () => {
    if (this.cloned) return;
    Sound.delayPlay(Sound.breakRock, 50);
  };

  kill = (player?: Player) => {
    this.dead = true;
    if (this.cloned) return;

    this.emitEnemyKilled();
    const deadEntity = this.clone();
    this.room.deadEntities.push(deadEntity);
    this.removeLightSource(this.lightSource);

    if ((player !== null && player.inventory?.canMine()) || player === null) {
      this.dropLoot();
      if (player) {
        const xp = computeMiningXp({
          nodeName: this.name,
          depth: this.room.depth,
        });
        statsTracker.awardSkillXp("mining", xp);
        if (GameConstants.XP_POPUP_ENABLED) {
          this.room.particles.push(new XPPopup(this.room, this.x, this.y, xp));
        }
      }
      //this.game.pushMessage("You use your pickaxe to collect the resource.");
    }
    this.uniqueKillBehavior();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      if (this.hasShadow) this.drawShadow(delta);

      this.updateDrawXY(delta);

      Game.drawObj(
        this.tileX,
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - 1.25 - this.drawY,
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
  };
}
