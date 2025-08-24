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

export class FireWizardEnemy extends WizardEnemy {
  static difficulty: number = 3;
  static tileX: number = 35;
  static tileY: number = 8;
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
    this.name = "fire wizard";
    this.projectileColor = [200, 20, 0];
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

  shuffle = (a) => {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Random.rand() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        this.alertTicks = Math.max(0, this.alertTicks - 1);
        switch (this.state) {
          case WizardState.attack:
            const nearestPlayerInfo = this.nearestPlayer();
            if (nearestPlayerInfo !== false) {
              const [distance, targetPlayer] = nearestPlayerInfo;
              const attackLength = 20;

              const offsets = this.calculateProjectileOffsets(
                targetPlayer.x,
                targetPlayer.y,
                10,
              );

              this.attemptProjectilePlacement(
                [
                  { x: -1, y: 0 },
                  { x: 1, y: 0 },
                  { x: 0, y: -1 },
                  { x: 0, y: 1 },
                ],
                WizardFireball,
                false,
              );
            }
            this.state = WizardState.justAttacked;
            break;
          case WizardState.justAttacked:
            this.attemptProjectilePlacement(
              [
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
            let min = 100000;
            let bestPos;
            let emptyTiles = this.shuffle(this.room.getEmptyTiles());
            emptyTiles = emptyTiles.filter(
              (tile) =>
                !this.room.projectiles.some(
                  (projectile) =>
                    projectile.x === tile.x && projectile.y === tile.y,
                ),
            );

            if (
              emptyTiles.length === 0 ||
              Object.keys(this.game.players).length === 0
            ) {
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

            for (let t of emptyTiles) {
              let newPos = t;
              let dist =
                Math.abs(newPos.x - this.game.players[target_player_id].x) +
                Math.abs(newPos.y - this.game.players[target_player_id].y);
              if (Math.abs(dist - optimalDist) < Math.abs(min - optimalDist)) {
                min = dist;
                bestPos = newPos;
              }
            }

            if (!bestPos) {
              bestPos = emptyTiles[0];
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
      if (this.state === WizardState.attack) this.tileX = 36;
      else this.tileX = 35;

      if (this.hasShadow && this.state !== WizardState.idle)
        this.drawShadow(delta);
      if (this.frame >= 0) {
        Game.drawMob(
          Math.floor(this.frame) + 5,
          18,
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
