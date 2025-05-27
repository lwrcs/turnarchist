import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/heart";
import { Armor } from "../../item/armor";
import { Entity } from "../entity";
import { LevelConstants } from "../../levelConstants";
import { GreenGem } from "../../item/greengem";
import { Player } from "../../player/player";
import { Pickaxe } from "../../weapon/pickaxe";
import { Spellbook } from "../../weapon/spellbook";
import { EntityType } from "../entity";
import { Sound } from "../../sound";

export class Resource extends Entity {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.chainPushable = false;
    this.name = "resource";
    this.imageParticleX = 0;
    this.imageParticleY = 25;
  }

  get type() {
    return EntityType.RESOURCE;
  }

  hurt = (playerHitBy: Player, damage: number) => {
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

    if (
      (player !== null &&
        player.inventory?.canMine()) /*player.inventory.getWeapon().canMine === true*/ ||
      player === null
    ) {
      this.dropLoot();
      this.game.pushMessage("You use your pickaxe to collect the resource.");
    } else {
      this.game.pushMessage(
        "You break the rock, but fail to collect any material from it.",
      );
    }
    this.uniqueKillBehavior();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();

    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);

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
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
