import { Game } from "../../game";
import { Room } from "../../room";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { Item } from "../../item/item";
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
    if (Math.random() < this.dropChance) {
      this.getDrop([
        "weapon",
        "equipment",
        "consumable",
        "gem",
        "tool",
        "coin",
      ]);
    }
  }

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
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
          this.softShadeColor,
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
          this.softShadeColor,
          this.shadeAmount(),
        );
      }
      if (!this.cloned) {
        if (!this.seenPlayer) {
          this.drawSleepingZs(delta);
        }
        if (this.alertTicks > 0) {
          this.drawExclamation(delta);
        }
      }
    }
    Game.ctx.restore();
  };
}
