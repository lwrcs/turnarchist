import { Entity, EntityDirection } from "./entity";
import { Game } from "../game";
import { Room } from "../room";
import { Player } from "../player";
import { HitWarning } from "../hitWarning";
import { GenericParticle } from "../particle/genericParticle";
import { Coin } from "../item/coin";
import { RedGem } from "../item/redgem";
import { Item } from "../item/item";
import { Spear } from "../weapon/spear";
import { astar } from "../astarclass";
import { SpikeTrap } from "../tile/spiketrap";
import { DeathParticle } from "../particle/deathParticle";
import { Candle } from "../item/candle";
import { EntityType } from "./entity";

export class Enemy extends Entity {
  constructor(level: Room, game: Game, x: number, y: number) {
    super(level, game, x, y);
  }
  isType = () => {
    return EntityType.ENEMY;
  };
}
