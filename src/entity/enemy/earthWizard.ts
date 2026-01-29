import { Game } from "../../game";
import { Room } from "../../room/room";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { WizardTeleportParticle } from "../../particle/wizardTeleportParticle";
import { WizardFireball } from "../../projectile/wizardFireball";
import { Random } from "../../utility/random";
import { Item } from "../../item/item";
import { WizardEnemy } from "./wizardEnemy";

export enum WizardState {
  idle,
  attack,
  justAttacked,
  teleport,
}

export class EarthWizardEnemy extends WizardEnemy {
  static difficulty: number = 3;
  static tileX: number = 37;
  static tileY: number = 8;
  static examineText = "An earth wizard. Rings you in, then crushes the gaps.";
  readonly ATTACK_RADIUS = 5;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 35;
    this.tileY = 8;
    this.frame = 0;
    this.state = WizardState.attack;
    this.seenPlayer = false;
    this.alertTicks = 0;
    this.name = "earth wizard";
    this.projectileColor = [0, 200, 0];
    if (drop) this.drop = drop;
    this.jumpHeight = 0.5;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return 1;
  };

  withinAttackingRangeOfPlayer = (): boolean => {
    let withinRange = false;
    for (const i in this.game.players) {
      if (
        (this.x - this.game.players[i].x) ** 2 +
          (this.y - this.game.players[i].y) ** 2 <=
        this.ATTACK_RADIUS ** 2
      ) {
        withinRange = true;
      }
    }
    return withinRange;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        this.alertTicks = Math.max(0, this.alertTicks - 1);
        switch (this.state) {
          case WizardState.attack:
            // Phase 1: radius-2 ring (square perimeter around the wizard)
            this.attemptProjectilePlacement(
              [
                // left edge
                { x: -2, y: -2 },
                { x: -2, y: -1 },
                { x: -2, y: 0 },
                { x: -2, y: 1 },
                { x: -2, y: 2 },
                // right edge
                { x: 2, y: -2 },
                { x: 2, y: -1 },
                { x: 2, y: 0 },
                { x: 2, y: 1 },
                { x: 2, y: 2 },
                // top edge
                { x: -1, y: -2 },
                { x: 0, y: -2 },
                { x: 1, y: -2 },
                // bottom edge
                { x: -1, y: 2 },
                { x: 0, y: 2 },
                { x: 1, y: 2 },
              ],
              WizardFireball,
              false,
            );
            this.state = WizardState.justAttacked;
            break;
          case WizardState.justAttacked:
            // Phase 2: radius-1 ring (surrounding 8 tiles)
            this.attemptProjectilePlacement(
              [
                { x: -1, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: -1 },
                { x: 1, y: 1 },
                { x: 1, y: -1 },
                { x: -1, y: 1 },
              ],
              WizardFireball,
              false,
            );
            this.state = WizardState.idle;
            break;
          case WizardState.teleport:
            let oldX = this.x;
            let oldY = this.y;
            if (Object.keys(this.game.players).length === 0) {
              this.state = WizardState.idle;
              break;
            }

            let optimalDist = Game.randTable(
              [2, 2, 3, 3, 3, 3, 3],
              Random.rand,
            );
            let player_ids = [];
            for (const i in this.game.players) player_ids.push(i);
            let target_player_id = Game.randTable(player_ids, Random.rand);

            if (!this.game.players[target_player_id]) {
              this.state = WizardState.idle;
              break;
            }

            const bestPos = this.findTeleportTarget(
              target_player_id,
              optimalDist,
            );
            if (!bestPos) {
              this.state = WizardState.idle;
              break;
            }

            this.tryMove(bestPos.x, bestPos.y);
            this.drawX = this.x - oldX;
            this.drawY = this.y - oldY;
            this.frame = 0;
            this.room.particles.push(new WizardTeleportParticle(oldX, oldY));
            if (this.withinAttackingRangeOfPlayer()) {
              this.state = WizardState.attack;
            } else {
              this.state = WizardState.idle;
            }
            break;
          case WizardState.idle:
            this.state = WizardState.teleport;
            break;
        }
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.state === WizardState.attack) this.tileX = 38;
      else this.tileX = 37;

      if (this.hasShadow && this.state !== WizardState.idle)
        this.drawShadow(delta);
      if (this.frame >= 0) {
        this.drawMobWithCrush(
          Math.floor(this.frame) + 5,
          20,
          1,
          2,
          this.x,
          this.y - 1.3,
          1,
          2,
          this.softShadeColor,
          this.shadeAmount(),
        );
        this.frame += 0.4 * delta;
        if (this.frame > 12) this.frame = -1;
      } else {
        this.drawMobWithCrush(
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
          undefined,
          this.outlineColor(),
          this.outlineOpacity(),
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
