import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room";
import { astar } from "../../astarclass";
import { HitWarning } from "../../hitWarning";
import { SpikeTrap } from "../../tile/spiketrap";
import { Coin } from "../../item/coin";
import { Player } from "../../player";
import { DualDagger } from "../../weapon/dualdagger";
import { Item } from "../../item/item";
import { GameConstants } from "../../gameConstants";
import { ImageParticle } from "../../particle/imageParticle";
import { Enemy } from "./enemy";
import { Utils } from "../../utils";

export class FrogEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  frameLength: number;
  startFrame: number;
  animationSpeed: number;
  tickCount: number;
  rumbling: boolean;
  jumping: boolean;
  jumpDistance: number;
  static difficulty: number = 1;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 12;
    this.tileY = 16;
    this.seenPlayer = false;
    this.aggro = false;
    this.deathParticleColor = "#ffffff";
    this.frameLength = 3;
    this.startFrame = 0;
    this.animationSpeed = 0.1;
    this.tickCount = 0;
    this.jumping = false;
    this.jumpDistance = 1;
    this.drop = drop ? drop : new Coin(this.room, this.x, this.y);
    this.name = "frog";
    this.orthogonalAttack = true;
    this.diagonalAttack = true;
    this.jumpHeight = 1;
    this.drawMoveSpeed = 0.2;
  }

  hurt = (playerHitBy: Player, damage: number) => {
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID])
        this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
    }
    this.healthBar.hurt();
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 3, 30);

    this.health -= damage;
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  hit = (): number => {
    return 0.5;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    this.tileX = 1;
    this.frameLength = 3;
    this.animationSpeed = 0.1;

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      if (!this.seenPlayer) {
        this.tileX = 12;
        this.lookForPlayer();
      } else if (this.seenPlayer) {
        this.tileX = 1;
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
            let targetPosition = {
              x: this.targetPlayer.x,
              y: this.targetPlayer.y,
            };
            let dx = this.targetPlayer.x - this.x;
            let dy = this.targetPlayer.y - this.y;
            if (
              (dx === 0 && dy <= 1) ||
              (dx <= 1 && dy === 0) ||
              (dx === 0 && dy >= -1) ||
              (dx >= -1 && dy === 0)
            ) {
              targetPosition = {
                x: this.targetPlayer.x + dx,
                y: this.targetPlayer.y + dy,
              };
            }
            let moves = astar.AStar.search(
              grid,
              this,
              targetPosition,
              disablePositions,
              false,
              false,
              false,
              undefined,
              undefined,
              false,
              this.lastPlayerPos,
            );
            if (moves.length > 0) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moves[1].pos.x &&
                  this.game.players[i].y === moves[1].pos.y
                ) {
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX += 1.5 * (this.x - this.game.players[i].x);
                  this.drawY += 1.5 * (this.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  hitPlayer = true;
                }
              }
              if (!hitPlayer) {
                if (moves.length > 1) {
                  let moveX = moves[1].pos.x;
                  let moveY = moves[1].pos.y;
                  this.tryMove(moveX, moveY);
                  this.setDrawXY(this.lastX, this.lastY);

                  if (this.jumping) {
                    this.frame = 8;
                    this.animationSpeed = 1;
                  }
                  if (this.x > moveX) this.direction = Direction.RIGHT;
                  else if (this.x < moveX) this.direction = Direction.LEFT;
                  else if (this.y > moveY) this.direction = Direction.DOWN;
                  else if (this.y < moveY) this.direction = Direction.UP;
                }
              }
            }
            this.rumbling = false;
          } else {
            this.makeHitWarnings();
            this.rumbling = true;
            this.tileX = 3;
            this.frame = 0;
            this.frameLength = 2;
            this.animationSpeed = 0.2;
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

  jump = (delta: number) => {
    console.log(`this.drawX, this.drawY: ${this.drawX}, ${this.drawY}`);
    if (this.jumping) {
      let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
      if (j > 1) {
        this.jumpDistance = 2;
        this.drawMoveSpeed = 0.2;
      }
      this.jumpY =
        Math.sin((j / this.jumpDistance) * Math.PI) * this.jumpHeight;
      if (this.jumpY < 0.01 && this.jumpY > -0.01) {
        this.jumpY = 0;
        this.jumpDistance = 1;
        this.drawMoveSpeed = 0.2;
      }
      if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
    }
  };

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX -= this.drawMoveSpeed * delta * this.drawX;
      this.drawY -= this.drawMoveSpeed * delta * this.drawY;

      this.drawX =
        Math.abs(this.drawX) < 0.01 ? 0 : Math.max(-2, Math.min(this.drawX, 2));
      this.drawY =
        Math.abs(this.drawY) < 0.01 ? 0 : Math.max(-2, Math.min(this.drawY, 2));
      this.jump(delta);
    }
  };

  makeHitWarnings = () => {
    const cullFactor = 0.25;
    const player: Player = this.getPlayer();
    const orthogonal = this.orthogonalAttack;
    const diagonal = this.diagonalAttack;
    const forwardOnly = this.forwardOnlyAttack;
    const direction = this.direction;
    const orthoRange = this.attackRange;
    const diagRange = this.diagonalAttackRange;

    const generateOffsets = (
      isOrthogonal: boolean,
      range: number,
    ): number[][] => {
      const baseOffsets = isOrthogonal
        ? [
            [-2, 0],
            [2, 0],
            [0, -2],
            [0, 2],
          ]
        : [
            [-1, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
          ];
      return baseOffsets.flatMap(([dx, dy]) =>
        Array.from({ length: range }, (_, i) => [(i + 1) * dx, (i + 1) * dy]),
      );
    };

    const directionOffsets = {
      [Direction.LEFT]: [-1, 0],
      [Direction.RIGHT]: [1, 0],
      [Direction.UP]: [0, -1],
      [Direction.DOWN]: [0, 1],
    };

    let offsets: number[][] = [];
    if (forwardOnly) {
      const [dx, dy] = directionOffsets[direction];
      offsets = Array.from({ length: orthoRange }, (_, i) => [
        (i + 1) * dx,
        (i + 1) * dy,
      ]);
    } else {
      if (orthogonal) offsets.push(...generateOffsets(true, orthoRange));
      if (diagonal) offsets.push(...generateOffsets(false, diagRange));
    }

    const warningCoordinates = offsets
      .map(([dx, dy]) => ({
        x: dx,
        y: dy,
        distance: Utils.distance(dx, dy, player.x - this.x, player.y - this.y),
      }))
      .sort((a, b) => a.distance - b.distance);

    const keepCount = Math.ceil(warningCoordinates.length * (1 - cullFactor));
    const culledWarnings = warningCoordinates.slice(0, keepCount);

    culledWarnings.forEach(({ x, y }) => {
      const targetX = this.x + x;
      const targetY = this.y + y;
      if (this.isWithinRoomBounds(targetX, targetY)) {
        const hitWarning = new HitWarning(
          this.game,
          targetX,
          targetY,
          this.x,
          this.y,
          true,
          false,
          this,
        );
        this.room.hitwarnings.push(hitWarning);
        //this.hitWarnings.push(hitWarning);
      }
    });
  };

  draw = (delta: number) => {
    if (!this.dead) {
      this.frame += this.animationSpeed * delta;
      if (this.frame >= this.frameLength) {
        this.frame = 0;
      }
      let rumbleX = this.rumble(this.rumbling, this.frame).x;
      let rumbleY = this.rumble(this.rumbling, this.frame).y;
      if (this.drawX !== 0 || this.drawY !== 0) {
        this.jumping = true;
      } else {
        this.jumping = false;
      }
      if (this.jumping) {
        this.frameLength = 10;
        this.animationSpeed = 0.4;
      } else {
        this.frameLength = 3;
        this.animationSpeed = 0.1;
      }
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
      Game.drawMob(
        this.tileX +
          (this.tileX !== 12 && !this.rumbling ? Math.floor(this.frame) : 0),
        this.tileY /*+ this.direction * 2,*/,
        1,
        2,
        this.x + rumbleX - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
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
  };
}
