import { Game } from "../game";
import { Tile, SkinType } from "./tile";
import { Room } from "../room/room";
import { Random } from "../utility/random";
import { LightSource } from "../lighting/lightSource";

export class Floor extends Tile {
  // all are in grid units
  variation: number;

  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.variation = 1;
    if (this.skin == SkinType.DUNGEON)
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12],
        Random.rand,
      );
    if (this.skin == SkinType.CAVE)
      //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Random.rand);
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12],
        Random.rand,
      );
    if (this.skin == SkinType.FOREST)
      //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Random.rand);
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12],
        Random.rand,
      );
    if (this.skin == SkinType.DESERT)
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12],
        Random.rand,
      );
    if (this.skin == SkinType.MAGMA_CAVE) {
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12],
        Random.rand,
      );
      if (
        this.variation === 8 ||
        this.variation === 9 ||
        this.variation === 10
      ) {
        this.hasBloom = true;
        this.bloomAlpha = 1;
        this.bloomColor = "#641900";
      }
    }
    if (this.skin == SkinType.DARK_DUNGEON) {
      this.variation = Game.randTable(
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 9, 10, 12],
        Random.rand,
      );

      if (Random.rand() < 0.2) {
        this.hasBloom = true;
        this.bloomAlpha = 1;
        this.bloomColor = "#306082"; //deep blue hex;
      }
    }
  }

  draw = (delta: number) => {
    Game.drawTile(
      this.variation,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };
}
