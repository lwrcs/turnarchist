import { Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Enemy } from "./enemy";
import { StunAnimation } from "../../projectile/stunAnimation";
import { Utils } from "../../utility/utils";
import { globalEventBus } from "../../event/eventBus";

export class PawnEnemy extends Enemy {
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
    this.tileX = 23;
    this.tileY = 12;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "pawn";
    // Pawns show only diagonal attack telegraphs
    this.orthogonalAttack = false;
    this.diagonalAttack = true;
    this.jumpHeight = 0.5;
    if (drop) this.drop = drop;
    this.armored = true;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return this.damage;
  };

  lookForPlayer = (face: boolean = true) => {
    if (this.seenPlayer) return;

    const p = this.nearestPlayer();
    if (p === false) return;

    const [distance, player] = p;
    if (distance > this.alertRange) return;

    this.targetPlayer = player;
    if (face) this.facePlayer(player);
    this.seenPlayer = true;

    globalEventBus.emit("EnemySeenPlayer", {
      enemyType: this.constructor.name,
      enemyName: this.name,
    });

    if (player === this.game.players[this.game.localPlayerID]) {
      this.alertTicks = 1;
    }

    this.conditionalHitWarnings();
  };
  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
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
            this.conditionalHitWarnings();
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
          // Diagonal-only attack: if player is diagonally adjacent, attack without moving
          const dxToPlayer = this.targetPlayer.x - this.x;
          const dyToPlayer = this.targetPlayer.y - this.y;

          if (
            Math.abs(dxToPlayer) === 1 &&
            Math.abs(dyToPlayer) === 1 &&
            !this.unconscious
          ) {
            this.targetPlayer.hurt(this.hit(), this.name);
            this.drawX = 0.5 * (this.x - this.targetPlayer.x);
            this.drawY = 0.5 * (this.y - this.targetPlayer.y);
            if (
              this.targetPlayer === this.game.players[this.game.localPlayerID]
            )
              this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);

            this.conditionalHitWarnings();
            return;
          }

          if (this.justHurt) {
            // do nothing special when just hurt
          } else if (!this.unconscious) {
            // Build grid like rookEnemy and use A* with orthogonal-only movement
            let grid = [] as any[];
            for (let x = 0; x < this.room.roomX + this.room.width; x++) {
              grid[x] = [];
              for (let y = 0; y < this.room.roomY + this.room.height; y++) {
                if (this.room.roomArray[x] && this.room.roomArray[x][y])
                  grid[x][y] = this.room.roomArray[x][y];
                else grid[x][y] = false;
              }
            }

            const moves = astar.AStar.search(
              grid,
              this,
              this.targetPlayer,
              disablePositions,
              false, // diagonals
              false, // diagonalsOnly
              undefined,
              undefined,
              undefined,
              false, // diagonalsOmni
              this.lastPlayerPos,
            );

            if (moves.length > 0) {
              const moveX = moves[0].pos.x;
              const moveY = moves[0].pos.y;

              // Pawns cannot attack forward: if the next step is the player's tile, skip it
              const stepIsPlayer =
                this.targetPlayer.x === moveX && this.targetPlayer.y === moveY;

              // Avoid stepping onto active spike traps even if A* allowed it
              const targetTile = this.room.roomArray[moveX]?.[moveY];
              const isActiveSpike =
                targetTile instanceof SpikeTrap && (targetTile as SpikeTrap).on;

              if (!stepIsPlayer && !isActiveSpike) {
                this.tryMove(moveX, moveY);
                this.setDrawXY(oldX, oldY);
              }
            }

            this.conditionalHitWarnings();
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
                this.conditionalHitWarnings();
              }
            }
          }
        }
      }
    }
  };

  conditionalHitWarnings = () => {
    const distance = Utils.distance(
      this.x,
      this.y,
      this.targetPlayer.x,
      this.targetPlayer.y,
    );
    if (distance >= 2 || !this.targetPlayer)
      this.makeHitWarnings(undefined, undefined, true, "orthogonal");
    if (distance < 3 && this.targetPlayer) this.makeHitWarnings();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    //let offsetTileY = this.health <= 1 || this.cloned === true ? 2 : 0;

    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX + Math.floor(this.frame),
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
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
    Game.ctx.restore();
  };
}
