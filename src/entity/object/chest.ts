import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room";
import { Heart } from "../../item/heart";
import { Armor } from "../../item/armor";
import { Entity } from "../entity";
import { LevelConstants } from "../../levelConstants";
import { GreenGem } from "../../item/greengem";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { Sound } from "../../sound";
import { RedGem } from "../../item/redgem";
import { BlueGem } from "../../item/bluegem";
import { EntityType } from "../entity";
import { Random } from "../../random";
import { Player } from "../../player";
import { Torch } from "../../item/torch";
import { WeaponFragments } from "../../item/weaponFragments";
import { ChestLayer } from "./chestLayer";
import { ImageParticle } from "../../particle/imageParticle";

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

  readonly hurt = (playerHitBy: Player, damage: number) => {
    //this.healthBar.hurt();
    this.health -= 1;
    if (this.health === 2 && !this.opening) this.open();

    if (this.health === 1) this.drop.onPickup(playerHitBy);
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  private open = () => {
    this.tileX = 0;
    this.tileY = 2;

    this.opening = true;
    /*
    if (this.getOpenTile().x && this.getOpenTile().y) {
      const { x, y } = this.getOpenTile();

      this.drop.x = x;
      this.drop.y = y;

      this.room.items.push(this.drop);
    } else if (!this.game.players[0].inventory.isFull()) {
      this.drop.onPickup(this.game.players[0]);
    }
      */
    if (this.drop === null) this.drop = Coin.add(this.room, this.x, this.y);
    this.dropLoot();
    this.drop.animateFromChest();
  };

  rollDrop = (): number => {
    return Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 2, 2], Random.rand);
  };

  kill = () => {
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 3, 26);

    this.dead = true;
    //this.layer.dead = true;
    //this.room.entities.filter((layer) => layer !== this.layer);
  };
  killNoBones = () => {
    this.kill();
  };

  draw = (delta: number) => {
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
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y - 1;
  };
}
