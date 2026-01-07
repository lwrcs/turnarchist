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
import { RedGem } from "../../item/resource/redgem";
import { BlueGem } from "../../item/resource/bluegem";
import { LightSource } from "../../lighting/lightSource";

export class ZirconResource extends Resource {
  static examineText = "A zircon vein. Cold light, sharp cuts.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 16;
    this.tileY = 0;
    this.health = 3;
    this.name = "zircon";
    this.hasBloom = true;
    this.bloomColor = "#0005FF"; //cyan hex color;
    this.bloomAlpha = 1;
    this.softBloomAlpha = 0;
    if (Random.rand() < 0.025) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    this.drops.push(new BlueGem(this.room, this.x, this.y));
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      7,
      [5, 5, 100], //dark dim blue,
      2,
    );
    this.addLightSource(this.lightSource);
  }
}
