import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { Tile } from "./tile";
import { LightSource } from "../lighting/lightSource";
import { EnvType } from "../constants/environmentTypes";
import { Lockable } from "./lockable";

export abstract class Passageway extends Tile {
  game: Game;
  frame: number;
  keyID: number;
  lightSource?: LightSource;
  environment: EnvType;
  lockable: Lockable;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, x, y);
    this.game = game;
    this.frame = 0;
    this.keyID = 0;
  }

  // Common frame animation logic
  protected updateFrame(delta: number): void {
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
  }

  // Common floating animation calculation
  protected getFloatingOffset(): number {
    return 0.125 * Math.sin((this.frame * Math.PI) / 50);
  }

  addLightSource = () => {
    if (this.environment === EnvType.FOREST && !this.lockable.isLocked()) {
      this.lightSource = new LightSource(
        this.x + 0.5,
        this.y + 0.5,
        6,
        [0, 100, 100],
      );
      this.room.lightSources.push(this.lightSource);
    }
  };
}
