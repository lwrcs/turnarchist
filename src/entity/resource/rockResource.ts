import { Room } from "../../room/room";
import { Game } from "../../game";
import { Heart } from "../../item/heart";
import { LevelConstants } from "../../levelConstants";
import { GenericParticle } from "../../particle/genericParticle";
import { Player } from "../../player/player";
import { Sound } from "../../sound";
import { Stone } from "../../item/stone";
import { Resource } from "./resource";
import { ImageParticle } from "../../particle/imageParticle";
import { Geode } from "../../item/geode";

export class Rock extends Resource {
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.room = room;
    this.health = 2;
    this.tileX = 8;
    this.tileY = 2;
    this.hasShadow = false;
    this.chainPushable = false;
    this.name = "rock";
    if (Math.random() < 0.2) {
      this.drops.push(new Geode(this.room, this.x, this.y));
    }
    //this.drops.push(new Stone(this.room, this.x, this.y));
  }
}
