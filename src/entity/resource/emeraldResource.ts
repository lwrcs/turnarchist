import { Item } from "../../item/item";
import { Game } from "../../game";
import { Key } from "../../item/key";
import { Room } from "../../room/room";
import { Heart } from "../../item/usable/heart";
import { Armor } from "../../item/armor";
import { GreenGem } from "../../item/resource/greengem";
import { Resource } from "./resource";
import { GenericParticle } from "../../particle/genericParticle";
import { Sound } from "../../sound/sound";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";
import { LightSource } from "../../lighting/lightSource";

export class EmeraldResource extends Resource {
  static examineText = "An emerald vein. Bright and brittle.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 14;
    this.tileY = 0;
    this.health = 3;
    this.hasBloom = true;
    this.bloomColor = "#05FF05";
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    this.name = "emerald";
    if (Random.rand() < 0.025) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    this.drops.push(new GreenGem(this.room, this.x, this.y));
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      7,
      [5, 150, 5],
      1,
    );
    this.addLightSource(this.lightSource);
  }
}
