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
import { BeamEffect } from "../../projectile/beamEffect";
import { ZombieEnemy } from "./zombieEnemy";
import { CrusherEnemy } from "./crusherEnemy";
import { LightSource } from "../../lighting/lightSource";

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
  crusherPositions: { x: number; y: number }[] = [];
  crusherCount: number = 0;
  crushers: CrusherEnemy[] = [];

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.w = 1;
    this.h = 1;

    this.ticks = 0;
    this.frame = 0;
    this.health = 6;
    this.maxHealth = 6;
    this.defaultMaxHealth = 6;
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
    this.crusherPositions = [];
    this.crusherCount = 0;
    this.crushers = [];
    this.baseDamage = 2;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      10,
      [255, 10, 10],
      1.5,
    );
    this.addLightSource(this.lightSource);
    this.hasBloom = true;
    this.bloomColor = "#ff0a0a";
    this.bloomAlpha = 1;

    this.room.updateLighting();

    if (drop) this.drop = drop;
    const dropAmount = Math.floor(Random.rand() * 3) + 2;
    while (this.drops.length < dropAmount && !this.cloned) {
      this.getDrop();
    }
  }

  hit = (): number => {
    return this.damage;
  };

  bleed = () => {};
  poison = () => {};

  createCrusherBlocks = (crusherPositions: { x: number; y: number }[]) => {
    for (const position of crusherPositions) {
      const crusher = new CrusherEnemy(
        this.room,
        this.game,
        position.x,
        position.y,
      );
      this.room.entities.push(crusher);
      this.crusherCount++;
      this.crushers.push(crusher);
    }
  };

  createCrusherChains = () => {
    for (const crusher of this.crushers) {
      let beam = new BeamEffect(crusher.x, crusher.y, this.x, this.y, crusher);
      beam.compositeOperation = "source-over";
      beam.color = "#800000"; //dark red
      beam.turbulence = 0.4;
      beam.gravity = 0.5;
      beam.iterations = 1;
      beam.segments = 100;
      beam.angleChange = 0.001;
      beam.springDamping = 0.01;
      beam.drawableY = this.drawableY - 0.1;
      this.room.projectiles.push(beam);
    }
  };

  getCrusherPositions = () => {
    return [
      { x: this.x - 1, y: this.y },
      { x: this.x + 1, y: this.y },
    ];
  };

  setCrusherDrawableY = () => {
    for (const crusher of this.crushers) {
      if (this.y > crusher.y) {
        this.drawableY = this.drawableY - 0.1;
      } else {
        crusher.drawableY = this.drawableY - 0.1;
      }
    }
  };

  initializeCrushers = () => {
    // Seed default positions on first run
    if (this.crusherPositions.length === 0) {
      this.crusherPositions = this.getCrusherPositions();
    }
    // Create crushers if not yet created for all positions
    if (this.crusherPositions.length > this.crusherCount) {
      this.createCrusherBlocks(this.crusherPositions);
      this.createCrusherChains();
    }
  };

  removeCrusherChains = () => {
    for (let beam of this.room.projectiles) {
      if (beam instanceof BeamEffect) {
        if (
          beam.parent instanceof CrusherEnemy &&
          this.crushers.includes(beam.parent as CrusherEnemy) &&
          beam.parent.dead
        ) {
          this.room.projectiles = this.room.projectiles.filter(
            (b) => b !== beam,
          );
        }
      }
    }
  };

  uniqueKillBehavior = () => {
    this.removeCrusherChains();
    for (const crusher of this.crushers) {
      if (!crusher.dead) {
        crusher.kill();
      }
    }
    this.removeLightSource(this.lightSource);
  };

  updateCrusherChains = (delta: number) => {
    for (let beam of this.room.projectiles) {
      if (beam instanceof BeamEffect) {
        if (
          beam.parent !== this.crushers[0] &&
          beam.parent !== this.crushers[1]
        )
          continue;
        beam.setTarget(
          this.x - this.drawX,
          this.y - this.drawY - 0.5,
          beam.parent.x - beam.parent.drawX,
          beam.parent.y -
            beam.parent.drawY -
            1.25 +
            (beam.parent as CrusherEnemy).softAnimateY,
        );
        beam.drawableY = this.drawableY - 0.1;

        switch (Math.floor(this.frame)) {
          case 0:
            beam.color = "#800000"; //dark red
            break;
          case 1:
            beam.color = "#ff0000"; //medium red
            break;
          case 2:
            beam.color = "#ff0000"; //light red
            break;
          case 3:
            beam.color = "#800000"; //dark red
            break;
        }
      }
    }
  };

  behavior = () => {
    this.initializeCrushers();
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
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

      if (this.lightSource) {
        this.lightSource.updatePosition(this.x + 0.5, this.y + 0.5);
      }
    }

    this.removeCrusherChains();
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

  draw = (delta: number) => {
    if (this.dead) return;
    //this.updateShadeColor(delta);
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    this.setCrusherDrawableY();
    this.updateCrusherChains(delta);
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
