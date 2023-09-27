import { Item } from "../item/item";
import { Game } from "../game";
import { Key } from "../item/key";
import { Level } from "../level";
import { Heart } from "../item/heart";
import { Armor } from "../item/armor";
import { Enemy } from "./enemy";
import { LevelConstants } from "../levelConstants";
import { GreenGem } from "../item/greengem";
import { Player } from "../player";
import { Pickaxe } from "../weapon/pickaxe";
import { Spellbook } from "../weapon/spellbook";
import { EntityType } from "./enemy";

export class Resource extends Enemy {
  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
    this.chainPushable = false;
    this.entityType = EntityType.Resource;
  }

  hurt = (playerHitBy: Player, damage: number) => {
    if (playerHitBy.inventory.getWeapon().canMine === true) {
      this.healthBar.hurt();
      this.health -= damage;
      if (this.health <= 0) this.kill();
      else {
        this.game.pushMessage("Your weapon fails to damage the rock.");
        this.hurtCallback();
      }
    } else return;
  };

  kill = () => {
    this.dead = true;
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
