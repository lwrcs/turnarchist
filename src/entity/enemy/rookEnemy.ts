import { Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Enemy } from "./enemy";
import { StunAnimation } from "../../projectile/stunAnimation";

export class RookEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 4;
  static tileX: number = 23 + 28;
  static tileY: number = 8;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 23 + 28;
    this.tileY = 8;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "rook";
    this.orthogonalAttack = true;
    this.diagonalAttack = false;
    this.jumpHeight = 0.5;
    if (drop) this.drop = drop;
    this.armored = true;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return this.damage;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      this.ticks++;
      if (!this.seenPlayer) {
        let p = this.nearestPlayer();
        if (p !== false) {
          let [distance, player] = p;
          if (distance <= 4) {
            this.targetPlayer = player;
            this.facePlayer(player);
            this.seenPlayer = true;
            if (player === this.game.players[this.game.localPlayerID])
              this.alertTicks = 1;
            this.makeHitWarnings();
          }
        }
      } else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          let oldX = this.x;
          let oldY = this.y;

          let disablePositions = Array<astar.Position>();
          for (const e of this.room.entities) {
            if (e !== this) {
              disablePositions.push({ x: e.x, y: e.y } as astar.Position);
            }
          }
          for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
            for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
              if (
                this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                (this.room.roomArray[xx][yy] as SpikeTrap).on
              ) {
                // don't walk on active spiketraps
                disablePositions.push({ x: xx, y: yy } as astar.Position);
              }
            }
          }
          const moves = this.searchPathLocalized(
            this.targetPlayer,
            disablePositions,
            { useLastPlayerPos: true },
          );
          if (this.justHurt) {
            //this.retreat(oldX, oldY);
            //this.stun();
            this.justHurt = false;
          } else if (moves.length > 0 && !this.unconscious) {
            let moveX = moves[0].pos.x;

            let moveY = moves[0].pos.y;

            let hitPlayer = false;
            for (const i in this.game.players) {
              if (
                this.game.rooms[this.game.players[i].levelID] === this.room &&
                this.game.players[i].x === moveX &&
                this.game.players[i].y === moveY
              ) {
                this.game.players[i].hurt(this.hit(), this.name, { source: { x: this.x, y: this.y } });
                this.drawX = 0.5 * (this.x - this.game.players[i].x);
                this.drawY = 0.5 * (this.y - this.game.players[i].y);
                if (
                  this.game.players[i] ===
                  this.game.players[this.game.localPlayerID]
                )
                  this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
              }
            }

            if (!hitPlayer) {
              this.tryMove(moveX, moveY);
              this.setDrawXY(oldX, oldY);
            }
          }
          this.makeHitWarnings();
        }

        let targetPlayerOffline =
          Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !==
          -1;
        if (!this.aggro || targetPlayerOffline) {
          let p = this.nearestPlayer();
          if (p !== false) {
            let [distance, player] = p;
            if (
              distance <= 4 &&
              (targetPlayerOffline ||
                distance < this.playerDistance(this.targetPlayer))
            ) {
              if (player !== this.targetPlayer) {
                this.targetPlayer = player;
                this.facePlayer(player);
                if (player === this.game.players[this.game.localPlayerID])
                  this.alertTicks = 1;
                this.makeHitWarnings();
              }
            }
          }
        }
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    let offsetTileY = this.health <= 1 || this.cloned === true ? 2 : 0;

    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX + Math.floor(this.frame),
        this.tileY, // + offsetTileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
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
    Game.ctx.restore();
  };
}
