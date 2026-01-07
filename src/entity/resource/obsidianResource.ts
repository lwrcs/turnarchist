import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/usable/heart";
import { LevelConstants } from "../../level/levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Stone } from "../../item/resource/stone";
import { Resource } from "./resource";
import { ImageParticle } from "../../particle/imageParticle";
import { Geode } from "../../item/resource/geode";
import { Random } from "../../utility/random";

export class ObsidianResource extends Resource {
  static examineText = "Obsidian. Tough stone with a mean edge.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 2;
    this.tileX = 8;
    this.tileY = 4;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "obsidian";
    if (Random.rand() < 0.025) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    //this.drops.push(new Stone(this.room, this.x, this.y));
  }
}
