import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";

export class RatEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  private _cachedMaxLum: number = 0;
  private _cachedDarkFlee: { x: number; y: number } | null = null;
  private _cachedMinLum: number = Infinity;
  static difficulty: number = 1;
  static tileX: number = 15;
  static tileY: number = 4;
  static examineText = "A rat. Fast and foul.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 15;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "rat";
    this.baseDamage = 0.5;
    this.orthogonalAttack = true;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    this.drawYOffset = 1;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Rat
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return this.damage;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          this.ticks++;

          // Use light sample from end of last turn to decide whether to flee.
          const darkFlee = this._cachedDarkFlee;
          const maxLum = this._cachedMaxLum;
          const minLum = this._cachedMinLum;
          const selfLum = this.getLuminance() ?? 0;
          const fleeing = maxLum > 0.25 && darkFlee !== null && minLum < maxLum;
          console.log(
            `[RAT ${this.x},${this.y}] selfLum=${selfLum.toFixed(3)} maxLum=${maxLum.toFixed(3)} minLum=${minLum === Infinity ? "Inf" : minLum.toFixed(3)} darkFlee=${darkFlee ? `(${darkFlee.x},${darkFlee.y})` : "null"} fleeing=${fleeing}`,
          );

          if (fleeing || this.ticks % 2 === 1) {
            this.rumbling = true;
            let oldX = this.x;
            let oldY = this.y;
            let disablePositions = Array<astar.Position>();

            disablePositions.push(...this.getEntityDisablePositions());

            for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
              for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
                if (
                  this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                  (this.room.roomArray[xx][yy] as SpikeTrap).on
                ) {
                  disablePositions.push({ x: xx, y: yy } as astar.Position);
                }
              }
            }

            this.target = fleeing ? darkFlee : this.targetPlayer;
            const moves = this.searchPathLocalizedCached(
              this.target as any,
              disablePositions,
              { useLastPlayerPos: true, allowOmni: true },
            );
            if (moves.length > 0) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moves[0].pos.x &&
                  this.game.players[i].y === moves[0].pos.y
                ) {
                  if (!this.shouldSkipAttack()) {
                    this.game.players[i].hurt(this.hit(), this.name, {
                      source: { x: this.x, y: this.y },
                    });
                    this.drawX = 0.5 * (this.x - this.game.players[i].x);
                    this.drawY = 0.5 * (this.y - this.game.players[i].y);
                    if (
                      this.game.players[i] ===
                      this.game.players[this.game.localPlayerID]
                    )
                      this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  }
                  hitPlayer = true;
                }
              }

              if (!hitPlayer) {
                this.tryMove(moves[0].pos.x, moves[0].pos.y);
                this.setDrawXY(oldX, oldY);
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
              }
            }
            this.rumbling = false;
            if (fleeing) {
              this.unconscious = false;
              this.makeHitWarnings();
            }
            this.unconscious = true;
          } else {
            this.rumbling = true;
            this.unconscious = false;
            this.makeHitWarnings();
          }

          // Resample light at new position for use next turn.
          {
            let newMaxLum = 0;
            let newMinLum = Infinity;
            let newDarkFlee: { x: number; y: number } | null = null;
            const distToPlayer =
              Math.abs(this.x - this.targetPlayer.x) +
              Math.abs(this.y - this.targetPlayer.y);
            for (let dx = -2; dx <= 2; dx++) {
              for (let dy = -2; dy <= 2; dy++) {
                const tx = this.x + dx;
                const ty = this.y + dy;
                if (!this.room.roomArray[tx]) continue;
                const vis = this.room.vis[tx]?.[ty] ?? 0;
                if (vis > newMaxLum) newMaxLum = vis;
                if (dx === 0 && dy === 0) continue;
                const tile = this.room.roomArray[tx]?.[ty];
                if (!tile || tile.isSolid()) continue;
                const tileDist =
                  Math.abs(tx - this.targetPlayer.x) +
                  Math.abs(ty - this.targetPlayer.y);
                if (tileDist <= distToPlayer) continue;
                if (vis < newMinLum) {
                  newMinLum = vis;
                  newDarkFlee = { x: tx, y: ty };
                }
              }
            }
            this._cachedMaxLum = newMaxLum;
            this._cachedMinLum = newMinLum;
            this._cachedDarkFlee = newDarkFlee;
          }
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
                if (this.ticks % 2 === 0) {
                  this.makeHitWarnings();
                }
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

    if (!this.dead) {
      this.updateDrawXY(delta);

      switch (this.direction) {
        case Direction.DOWN:
          this.tileX = 15; this.tileY = 4;
          break;
        case Direction.UP:
          this.tileX = 15; this.tileY = 6;
          break;
        case Direction.RIGHT:
          this.tileX = 17; this.tileY = 4;
          break;
        case Direction.LEFT:
          this.tileX = 17; this.tileY = 6;
          break;
      }

      let rumbleX = this.rumble(this.rumbling, this.frame, this.direction).x;
      let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      if (this.hasShadow) this.drawShadow(delta);

      const rect = this.applyCrushToDrawRect({
        dX: this.x - this.drawX + rumbleX - 0.5,
        dY: this.y - this.drawYOffset - this.drawY + rumbleY,
        dW: 2,
        dH: 2,
      });

      Game.drawMob(
        this.tileX,
        this.tileY,
        2,
        2,
        rect.dX,
        rect.dY,
        rect.dW,
        rect.dH,
        this.softShadeColor,
        this.shadeAmount(),
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
      if (this.crushed) {
        this.crushAnim(delta);
      }
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
    }
    Game.ctx.restore();
  };
}
