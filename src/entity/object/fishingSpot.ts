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
import { Player } from "../../player/player";
import { Fish } from "../../item/usable/fish";

export class FishingSpot extends Entity {
  fishCount: number = 0;
  active: boolean = false;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 1;
    this.tileX = 11;
    this.tileY = 0;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "fishing spot";
    this.fishCount = Math.floor(Random.rand() * 3);
    this.active = this.fishCount > 0;

    //this.hitSound = Sound.potSmash;
    this.imageParticleX = 0;
    this.imageParticleY = 29;
    this.destroyable = false;
    this.interactable = true;
    let dropProb = Random.rand();
    if (dropProb < 0.025) this.drops.push(new Heart(this.room, this.x, this.y));
    else this.drops.push(new Coin(this.room, this.x, this.y));
  }

  get type() {
    return EntityType.PROP;
  }

  fish = (player: Player): void => {
    if (!player.inventory.canFish()) {
      this.game.pushMessage("You need a fishing rod to fish.");
      return;
    }
    if (!this.active) {
      this.game.pushMessage("There aren't any fish here.");
      return;
    }
    this.game.pushMessage("Fishing...");
    let message = "";

    if (this.tryFish()) {
      let added = player.inventory.addItem(new Fish(this.room, this.x, this.y));
      if (added === false) {
        this.room.items.push(new Fish(this.room, player.x, player.y));
      }
      message = "You catch a fish.";
      this.fishCount--;
      if (this.fishCount <= 0) {
        this.active = false;
      }
    } else {
      message = "You don't catch anything.";
    }

    player.busyAnimating = true;
    setTimeout(() => {
      player.busyAnimating = false;
      this.room.game.pushMessage(message);
    }, 1200);

    this.room.tick(player);
  };

  tryFish = (): boolean => {
    if (Random.rand() < 0.3) {
      return true;
    } else {
      return false;
    }
  };

  interact = (player: Player): void => {
    this.fish(player);
  };

  draw = (delta: number) => {
    if (this.dead || !this.active) return;
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
  };
}
