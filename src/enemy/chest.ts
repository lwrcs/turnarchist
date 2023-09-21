import { Item } from "../item/item";
import { Game } from "../game";
import { Key } from "../item/key";
import { Level } from "../level";
import { Heart } from "../item/heart";
import { Armor } from "../item/armor";
import { Enemy } from "./enemy";
import { LevelConstants } from "../levelConstants";
import { GreenGem } from "../item/greengem";
import { GenericParticle } from "../particle/genericParticle";
import { Coin } from "../item/coin";
import { Sound } from "../sound";
import { RedGem } from "../item/redgem";
import { BlueGem } from "../item/bluegem";
import { GameState } from "../gameState";
import { EntityType } from "./enemy";

export class Chest extends Enemy {
  constructor(level: Level, game: Game, x: number, y: number, rand: () => number) {
    super(level, game, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.health = 1;
    this.entityType = EntityType.Chest;

    let drop = Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4], rand);

    switch (drop) {
      case 1:
        this.drop = new Heart(this.level, this.x, this.y);
        break;
      case 2:
        this.drop = new GreenGem(this.level, this.x, this.y);
        break;
      case 3:
        this.drop = new RedGem(this.level, this.x, this.y);
        break;
      case 4:
        this.drop = new BlueGem(this.level, this.x, this.y);
        break;
      case 5:
        this.drop = new Key(this.level, this.x, this.y);
        break;
      case 6:
        this.drop = new Armor(this.level, this.x, this.y);
        break;
    }
  }

  kill = () => {
    if (this.level === this.game.level) Sound.chest();

    this.dead = true;

    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#fbf236");

    this.level.items.push(this.drop);
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
        this.y - 1 - this.drawY,
        1,
        2,
        this.level.shadeColor,
        this.shadeAmount()
      );
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
