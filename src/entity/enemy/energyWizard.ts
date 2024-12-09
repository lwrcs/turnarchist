import { Entity } from "../entity";
import { LevelConstants } from "../../levelConstants";
import { Game } from "../../game";
import { Room } from "../../room";
import { astar } from "../../astarclass";
import { Heart } from "../../item/heart";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { WizardTeleportParticle } from "../../particle/wizardTeleportParticle";
import { GameConstants } from "../../gameConstants";
import { WizardFireball } from "../../projectile/wizardFireball";
import { GreenGem } from "../../item/greengem";
import { Player } from "../../player";
import { Coin } from "../../item/coin";
import { BlueGem } from "../../item/bluegem";
import { Random } from "../../random";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";
import { SpikeTrap } from "../../tile/spiketrap";
import { HitWarning } from "../../hitWarning";
import { LightSource } from "../../lightSource";
import { WizardEnemy } from "./wizardEnemy";

export enum WizardState {
  idle,
  attack,
  justAttacked,
  teleport,
}

export class EnergyWizardEnemy extends WizardEnemy {
  static difficulty: number = 3;
  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 1;
    this.tileX = 6;
    this.tileY = 0;
    this.frame = 0;
    this.state = WizardState.attack;
    this.seenPlayer = false;
    this.alertTicks = 0;
    this.name = "wizard bomber";
    this.projectileColor = [0, 50, 150];

    if (drop) this.drop = drop;
    else {
      if (Random.rand() < 0.02)
        this.drop = new BlueGem(this.room, this.x, this.y);
      else this.drop = new Coin(this.room, this.x, this.y);
    }
  }

  draw = (delta: number) => {
    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.state === WizardState.attack) this.tileX = 7;
      else this.tileX = 6;

      if (this.hasShadow)
        Game.drawMob(
          0,
          0,
          1,
          1,
          this.x - this.drawX,
          this.y - this.drawY,
          1,
          1,
          this.room.shadeColor,
          this.shadeAmount(),
        );
      if (this.frame >= 0) {
        Game.drawMob(
          Math.floor(this.frame) + 6,
          2,
          1,
          2,
          this.x,
          this.y - 1.5,
          1,
          2,
          this.room.shadeColor,
          this.shadeAmount(),
        );
        this.frame += 0.4 * delta;
        if (this.frame > 11) this.frame = -1;
      } else {
        Game.drawMob(
          this.tileX,
          this.tileY,
          1,
          2,
          this.x - this.drawX,
          this.y - 1.3 - this.drawY,
          1,
          2,
          this.room.shadeColor,
          this.shadeAmount(),
        );
      }
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
  };

  kill = () => {
    if (this.room.roomArray[this.x][this.y] instanceof Floor) {
      let b = new Bones(this.room, this.x, this.y);
      b.skin = this.room.roomArray[this.x][this.y].skin;
      this.room.roomArray[this.x][this.y] = b;
    }

    this.dead = true;
    this.room.particles.push(new DeathParticle(this.x, this.y));

    this.dropLoot();
  };
}
