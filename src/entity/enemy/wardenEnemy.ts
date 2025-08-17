import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { HitWarning } from "../../drawable/hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/resource/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../item/weapon/spear";
import { DualDagger } from "../../item/weapon/dualdagger";
import { GreenGem } from "../../item/resource/greengem";
import { Random } from "../../utility/random";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Pickaxe } from "../../item/tool/pickaxe";
import { ImageParticle } from "../../particle/imageParticle";
import { Enemy } from "./enemy";

export class WardenEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  dir: Direction;
  static difficulty: number = 2;
  static tileX: number = 21;
  static tileY: number = 0;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.w = 1;
    this.h = 1;

    this.ticks = 0;
    this.frame = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.defaultMaxHealth = 4;
    this.tileX = 43;
    this.tileY = 10;
    this.seenPlayer = false;
    this.aggro = false;
    this.dir = Direction.DOWN;
    this.name = "warden";
    this.chainPushable = false;

    this.forwardOnlyAttack = false;
    this.drawMoveSpeed = 0.9;
    this.jumpHeight = 0.35;
    this.drawYOffset = 1.5;
    this.alertRange = 10;
    this.orthogonalAttack = true;

    if (drop) this.drop = drop;
    const dropAmount = Math.floor(Random.rand() * 3) + 2;
    while (this.drops.length < dropAmount && !this.cloned) {
      this.getDrop();
    }
  }

  hit = (): number => {
    return 2;
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
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          this.ticks++;
          if (this.ticks % 2 === 1) {
            this.rumbling = true;
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

            let grid = [];
            for (let x = 0; x < this.room.roomX + this.room.width; x++) {
              grid[x] = [];
              for (let y = 0; y < this.room.roomY + this.room.height; y++) {
                if (this.room.roomArray[x] && this.room.roomArray[x][y])
                  grid[x][y] = this.room.roomArray[x][y];
                else grid[x][y] = false;
              }
            }
            this.target =
              this.getAverageLuminance() > 0 // 0.8
                ? this.targetPlayer
                : this.room.getExtremeLuminanceFromPoint(this.x, this.y)
                    .darkest;
            let moves = astar.AStar.search(
              grid,
              this,
              this.target,
              disablePositions,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              this.lastPlayerPos,
            );
            if (moves.length > 0) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moves[0].pos.x &&
                  this.game.players[i].y === moves[0].pos.y
                ) {
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX = 0.5 * (this.x - this.game.players[i].x);
                  this.drawY = 0.5 * (this.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
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
          } else {
            this.rumbling = true;
            /*
            if (
              (this.target.x === this.targetPlayer.x &&
                this.target.y === this.targetPlayer.y) ||
              Utils.distance(
                this.targetPlayer.x,
                this.targetPlayer.y,
                this.x,
                this.y,
              ) <= 2
            )
              */ {
              this.makeHitWarnings();
            }
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
                  /*
                  if (
                    (this.target.x === this.targetPlayer.x &&
                      this.target.y === this.targetPlayer.y) ||
                    Utils.distance(
                      this.targetPlayer.x,
                      this.targetPlayer.y,
                      this.x,
                      this.y,
                    ) <= 2
                  ) */ {
                    this.makeHitWarnings();
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true,
    );
  };

  dropLoot = () => {
    let dropOffsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    for (let i = 0; i < this.drops.length; i++) {
      this.drops[i].level = this.room;
      this.drops[i].x = this.x + dropOffsets[i].x;
      this.drops[i].y = this.y + dropOffsets[i].y;
      this.room.items.push(this.drops[i]);
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    //this.updateShadeColor(delta);
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;
    if (this.hasShadow) this.drawShadow(delta);
    Game.drawMob(
      this.tileX + 2 * Math.floor(this.frame),
      this.tileY,
      2,
      2,
      this.x - this.drawX - 0.5,
      this.y - this.drawYOffset - this.drawY - this.jumpY,
      2,
      2,
      this.softShadeColor,
      this.shadeAmount(),
    );

    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
    Game.ctx.globalAlpha = 1;
  };
}
