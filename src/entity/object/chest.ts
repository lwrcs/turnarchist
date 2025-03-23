import { Game } from "../../game";
import { Room } from "../../room";
import { Entity } from "../entity";
import { Coin } from "../../item/coin";
import { EntityType } from "../entity";
import { Random } from "../../random";
import { Player } from "../../player/player";
import { ChestLayer } from "./chestLayer";
import { ImageParticle } from "../../particle/imageParticle";
import { Sound } from "../../sound";

export class Chest extends Entity {
  frame: number;
  opening: boolean;
  dropX: number;
  dropY: number;
  layer: ChestLayer;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.health = 3;
    this.name = "chest";
    this.frame = 0;
    this.opening = false;
    this.dropX = 0;
    this.dropY = 0;
    this.drop = null;
    this.destroyable = false;
    this.pushable = false;
    this.chainPushable = false;
    this.interactable = true;
    this.imageParticleX = 3;
    this.imageParticleY = 26;
    /*
    this.layer = new ChestLayer(
      this.room,
      this.game,
      this.x,
      this.y,
    );
    this.room.entities.push(this.layer);
    */
  }

  get type() {
    return EntityType.CHEST;
  }

  interact = (playerHitBy: Player) => {
    //this.healthBar.hurt();
    this.health -= 1;
    if (this.health === 2 && !this.opening) this.open();

    if (this.health === 1) {
      this.drop.onPickup(playerHitBy);
      this.destroyable = true;
    }
    if (this.health <= 0) {
      this.kill();
    } else this.hurtCallback();
  };

  private open = () => {
    this.tileX = 0;
    this.tileY = 2;

    this.opening = true;
    Sound.chest();

    if (this.drop === null) this.getDrop(["consumable", "gem", "coin"]);
    if (this.drop.name === "coin") {
      const stack = Math.ceil(Math.random() * 5);
      this.drop.stackCount = stack;
      this.drop.stack = stack;
    }
    this.dropLoot();
    this.drop.animateFromChest();
  };

  rollDrop = (): number => {
    return Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 2, 2], Random.rand);
  };

  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (this.opening) {
      if (this.tileX <= 6) {
        this.tileX += 0.15 * delta;
      } else {
        this.opening = false;
      }
    }

    if (!this.dead) {
      this.updateDrawXY(delta);
      Game.drawObj(
        Math.floor(this.tileX),
        Math.floor(this.tileY),
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
    this.drawableY = this.y - 1;
  };
}
