import { Item } from "../item/item";
import { Game } from "../game";
import { Key } from "../item/key";
import { Room } from "../room";
import { Heart } from "../item/heart";
import { Armor } from "../item/armor";
import { Entity } from "./entity";
import { LevelConstants } from "../levelConstants";
import { GreenGem } from "../item/greengem";
import { Resource } from "./resource";
import { GenericParticle } from "../particle/genericParticle";
import { Coal } from "../item/coal";
import { Sound } from "../sound";
import { Inventory } from "../inventory";
import { Weapon } from "../weapon/weapon";
import { Pickaxe } from "../weapon/pickaxe";
import { Player } from "../player";
import { ItemState, ItemType } from "../gameState";

export class CoalResource extends Resource {
  constructor(level: Room, game: Game, x: number, y: number) {
    super(level, game, x, y);

    this.tileX = 12;
    this.tileY = 0;
    this.health = 1;
  }

  hurtCallback = () => {
    GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      "#ffffff"
    );

    if (this.room === this.game.room) Sound.mine();
  };

  kill = () => {
    if (this.room === this.game.room) Sound.breakRock();

    this.dead = true;

    this.room.items.push(new Coal(this.room, this.x, this.y));
  };
  killNoBones = () => {
    this.kill();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
