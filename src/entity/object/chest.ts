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

export class Chest extends Entity {
  frame: number;
  opening: boolean;
  dropX: number;
  dropY: number;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.health = 2;
    this.name = "chest";
    this.frame = 0;
    this.opening = false;
    this.dropX = 0;
    this.dropY = 0;
  }

  get type() {
    return EntityType.CHEST;
  }

  readonly hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();

    this.health -= damage;
    if (this.health <= 1) this.startOpening();
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  private open = () => {
    this.opening = false;
    const { x, y } = this.getOpenTile();

    switch (this.rollDrop()) {
      case 1:
        this.drop = new Heart(this.room, x, y);
        break;
      case 2:
        this.drop = new GreenGem(this.room, x, y);
        break;
      case 3:
        this.drop = new RedGem(this.room, x, y);
        break;
      case 4:
        this.drop = new BlueGem(this.room, x, y);
        break;
      case 5:
        this.drop = new Key(this.room, x, y);
        break;
      case 6:
        this.drop = new Armor(this.room, x, y);
        break;
    }
  };

  rollDrop = (): number => {
    return Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4], Random.rand);
  };

  startOpening = () => {
    this.tileX = 0;
    this.opening = true;
  };

  kill = () => {
    this.dead = true;

    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#fbf236"
    );

    this.room.items.push(this.drop);
  };
  killNoBones = () => {
    this.kill();
  };

  getOpenTile = (): { x: number; y: number } => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!this.room.roomArray[this.x + i][this.y + j].isSolid())
          return { x: this.x + i, y: this.y + j };
      }
    }
    return { x: this.x, y: this.y };
  };

  draw = (delta: number) => {
    if (this.opening) {
      this.tileX += 0.15;
      this.tileY = 2;
      if (this.tileX > 6) this.open();
    }
    if (!this.dead) {
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
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
