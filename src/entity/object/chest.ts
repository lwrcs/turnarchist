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
    this.drop = null;
  }

  get type() {
    return EntityType.CHEST;
  }

  readonly hurt = (playerHitBy: Player, damage: number) => {
    //this.healthBar.hurt();
    this.health -= 1;
    if (this.health === 1 && !this.opening) this.open();
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  private open = () => {
    this.tileX = 0;
    this.tileY = 2;

    this.opening = true;
    const { x, y } = this.getOpenTile();

    switch (this.rollDrop()) {
      case 1:
        this.drop = new Heart(this.room, x, y);
        break;
      case 2:
        this.drop = new Torch(this.room, x, y);
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
      case 7:
        this.drop = new WeaponFragments(this.room, x, y, 100);
        break;
    }
    this.room.items.push(this.drop);
  };

  rollDrop = (): number => {
    return Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 2, 2], Random.rand);
  };

  kill = () => {
    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#fbf236",
    );

    this.dead = true;
  };
  killNoBones = () => {
    this.kill();
  };

  getOpenTile = (): { x: number; y: number } => {
    let x, y;
    do {
      x = Game.rand(this.x - 1, this.x + 1, Random.rand);
      y = Game.rand(this.y - 1, this.y + 1, Random.rand);
    } while (
      (x === this.x && y === this.y) ||
      this.room.roomArray[x][y].isSolid() ||
      this.room.entities.some((e) => e.x === x && e.y === y)
    );
    return { x, y };
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
    this.drawableY = this.y;
  };
}
