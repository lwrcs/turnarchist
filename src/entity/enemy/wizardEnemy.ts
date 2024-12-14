import { Game } from "../../game";
import { Room } from "../../room";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { WizardTeleportParticle } from "../../particle/wizardTeleportParticle";
import { WizardFireball } from "../../projectile/wizardFireball";
import { Random } from "../../random";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";
import { LightSource } from "../../lightSource";

export enum WizardState {
  idle,
  attack,
  justAttacked,
  teleport,
}

export abstract class WizardEnemy extends Enemy {
  static difficulty: number = 3;
  ticks: number;
  state: WizardState;
  frame: number;
  seenPlayer: boolean;
  projectileColor: [number, number, number];
  readonly ATTACK_RADIUS = 5;

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

  newLightSource = (
    x: number,
    y: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
  ) => {
    this.lightSource = new LightSource(x, y, radius, color, brightness);
  };

  addLightSource = (lightSource: LightSource) => {
    this.room.lightSources.push(lightSource);
  };

  removeLightSource = (lightSource: LightSource) => {
    this.room.lightSources = this.room.lightSources.filter(
      (ls) => ls !== lightSource,
    );
  };

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
                  { x: -2, y: 0 },
                  { x: 1, y: 0 },
                  { x: 2, y: 0 },
                  { x: 0, y: -1 },
                  { x: 0, y: -2 },
                  { x: 0, y: 1 },
                  { x: 0, y: 2 },
                ],
                WizardFireball,
                false,
              );
            }
            this.state = WizardState.justAttacked;
            break;
          case WizardState.justAttacked:
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

            let optimalDist = Game.randTable(
              [2, 2, 3, 3, 3, 3, 3],
              Random.rand,
            );
            // pick a random player to target
            let player_ids = [];
            for (const i in this.game.players) player_ids.push(i);
            let target_player_id = Game.randTable(player_ids, Random.rand);
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
            if (bestPos) {
              this.tryMove(bestPos.x, bestPos.y);
              this.drawX = this.x - oldX;
              this.drawY = this.y - oldY;
              this.frame = 0; // trigger teleport animation
              this.room.particles.push(new WizardTeleportParticle(oldX, oldY));
              if (this.withinAttackingRangeOfPlayer()) {
                this.state = WizardState.attack;
              } else {
                this.state = WizardState.idle;
              }
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
        this.frame += 0.2 * delta;
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
