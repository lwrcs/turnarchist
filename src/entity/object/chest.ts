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

export class Chest extends Entity {
  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    rand: () => number
  ) {
    super(room, game, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.health = 1;

    let drop = Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4], rand);

    switch (drop) {
      case 1:
        this.drop = new Heart(this.room, this.x, this.y);
        break;
      case 2:
        this.drop = new GreenGem(this.room, this.x, this.y);
        break;
      case 3:
        this.drop = new RedGem(this.room, this.x, this.y);
        break;
      case 4:
        this.drop = new BlueGem(this.room, this.x, this.y);
        break;
      case 5:
        this.drop = new Key(this.room, this.x, this.y);
        break;
      case 6:
        this.drop = new Armor(this.room, this.x, this.y);
        break;
    }
  }

  get name() {
    return "chest";
  }

  get type() {
    return EntityType.CHEST;
  }

  kill = () => {
    if (this.room === this.game.room) Sound.chest();

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

  draw = (delta: number) => {
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
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
