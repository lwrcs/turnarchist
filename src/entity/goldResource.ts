import { Item } from "../item/item";
import { Game } from "../game";
import { Key } from "../item/key";
import { Room } from "../room";
import { Heart } from "../item/heart";
import { Armor } from "../item/armor";
import { Entity } from "./entity";
import { LevelConstants } from "../levelConstants";
import { Resource } from "./resource";
import { GenericParticle } from "../particle/genericParticle";
import { Gold } from "../item/gold";
import { Sound } from "../sound";

export class GoldResource extends Resource {
  constructor(level: Room, game: Game, x: number, y: number) {
    super(level, game, x, y);

    this.tileX = 13;
    this.tileY = 0;
    this.health = 2;
  }

  hurtCallback = () => {
    if (this.level === this.game.level) Sound.mine();
  };

  kill = () => {
    if (this.level === this.game.level) Sound.breakRock();

    this.dead = true;

    this.level.items.push(new Gold(this.level, this.x, this.y));

    GenericParticle.spawnCluster(this.level, this.x + 0.5, this.y + 0.5, "#fbf236");
  };
  killNoBones = () => {
    this.kill();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
