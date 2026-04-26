import { Entity, EntityType } from "../entity";
import { Room } from "../../room/room";
import { Direction, Game } from "../../game";
import { LightSource } from "../../lighting/lightSource";
import { LevelConstants } from "../../level/levelConstants";
import { Candle } from "../../item/light/candle";
import { GameConstants } from "../../game/gameConstants";

export class PlacedCandle extends Entity {
  lightSource: LightSource;
  wallMounted = true;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    fuel: number = 100,
  ) {
    super(room, game, x, y);
    this.health = 1;
    this.name = "placed_candle";
    this.hasShadow = true;
    this.chainPushable = false;
    this.hasBloom = true;
    this.bloomColor = "#FFDD88";
    this.bloomAlpha = 0.7;
    this.softBloomAlpha = 0;
    this.hasHitParticles = false;
    this.shadowOpacity = 0.5;

    const drop = new Candle(room, x, y);
    drop.fuel = Math.max(1, Math.min(fuel, drop.fuelCap));
    drop.stackCount = 1;
    this.drops = [drop];

    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      3,
      LevelConstants.TORCH_LIGHT_COLOR,
      1.2,
    );
    this.addLightSource(this.lightSource);
  }

  applyFloorPlacement(): void {
    this.wallMounted = false;
    this.direction = Direction.UP;
    this.lightSource.x = this.x + 0.5;
    this.lightSource.y = this.y + 0.5;
    this.bloomOffsetX = 0;
    this.bloomOffsetY = 0.5; //GameConstants.TILESIZE;
  }

  applyWallDirection(direction: Direction): void {
    this.direction = direction;
    //const half = GameConstants.TILESIZE;
    if (direction === Direction.LEFT) {
      this.lightSource.x = this.x + 1.0;
      this.lightSource.y = this.y + 0.5;
      this.bloomOffsetX = 16;
      this.bloomOffsetY = 0;
    } else if (direction === Direction.RIGHT) {
      this.lightSource.x = this.x;
      this.lightSource.y = this.y + 0.5;
      this.bloomOffsetX = -16;
      this.bloomOffsetY = 0;
    } else if (direction === Direction.UP) {
      this.lightSource.x = this.x + 0.5;
      this.lightSource.y = this.y + 1.0;
      this.bloomOffsetX = 0;
      this.bloomOffsetY = 0;
    } else {
      this.lightSource.x = this.x + 0.5;
      this.lightSource.y = this.y;
      this.bloomOffsetX = 0;
      this.bloomOffsetY = -16;
    }
  }

  protected dropLoot = () => {
    if (this.lootDropped) return;
    this.lootDropped = true;
    const drop = this.drops[0];
    if (!drop) return;
    drop.level = this.room;
    drop.z = this.z ?? 0;
    const localPlayer = this.game?.players?.[this.game.localPlayerID];
    if (localPlayer?.inventory?.canPickup(drop)) {
      drop.x = this.x;
      drop.y = this.y;
      drop.forceAnimateToInventory = true;
      this.room.items.push(drop);
      drop.onDrop();
      drop.autoPickup();
    } else {
      const visited = new Set<string>();
      const queue: Array<{ x: number; y: number; dist: number }> = [
        { x: this.x, y: this.y, dist: 0 },
      ];
      visited.add(`${this.x},${this.y}`);
      let dropX = this.x;
      let dropY = this.y;
      outer: while (queue.length > 0) {
        const { x, y, dist } = queue.shift()!;
        if (
          this.room.roomArray[x]?.[y] &&
          !this.room.roomArray[x][y].isSolid()
        ) {
          dropX = x;
          dropY = y;
          break outer;
        }
        if (dist < 8) {
          for (const [nx, ny] of [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ] as [number, number][]) {
            const key = `${nx},${ny}`;
            if (
              !visited.has(key) &&
              this.room.roomArray[nx]?.[ny] !== undefined
            ) {
              visited.add(key);
              queue.push({ x: nx, y: ny, dist: dist + 1 });
            }
          }
        }
      }
      drop.x = dropX;
      drop.y = dropY;
      this.room.items.push(drop);
      drop.onDrop();
    }
  };

  get type() {
    return EntityType.PROP;
  }

  examineText = () => "A candle fixed to the wall. Hit it to pick it back up.";

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    this.frame += 0.3 * delta;
    if (this.frame >= 12) this.frame = 0;
    this.updateDrawXY(delta);

    const baseX = this.x - this.drawX;
    const baseY = this.y - this.drawYOffset - this.drawY;

    // Per-direction sprite and fire fine-tuning
    let spriteX: number;
    let spriteY: number;
    let fireOffX: number;
    let fireOffY: number;
    let torchYOffset = 0;
    if (this.direction === Direction.LEFT) {
      spriteX = 1;
      spriteY = 11;
      fireOffX = -4 / 16;
      fireOffY = 5 / 16;
      torchYOffset = -3 / 16;
    } else if (this.direction === Direction.RIGHT) {
      spriteX = 2;
      spriteY = 11;
      fireOffX = 5 / 16;
      fireOffY = 5 / 16;
      torchYOffset = -3 / 16;
    } else if (this.direction === Direction.DOWN) {
      spriteX = 0;
      spriteY = 11;
      fireOffX = 0;
      fireOffY = -3 / 16;
      torchYOffset = 3 / 16;
    } else {
      spriteX = 0;
      spriteY = 11;
      fireOffX = 0;
      fireOffY = 13 / 16;
      torchYOffset = -13 / 16;
    }

    // Wall-direction offset: shifts the whole visual toward the room interior
    let drawOffX = 0;
    let drawOffY = 0;
    if (this.wallMounted) {
      if (this.direction === Direction.LEFT) drawOffX = 1;
      else if (this.direction === Direction.RIGHT) drawOffX = -1;
      else if (this.direction === Direction.UP) drawOffY = 1;
      else drawOffY = -1;
    } else {
      drawOffY = 0.5;
    }

    Game.drawObj(
      spriteX,
      spriteY,
      1,
      2,
      baseX + drawOffX,
      baseY + torchYOffset + drawOffY,
      1,
      2,
      this.room.shadeColor,
      this.shadeAmount(),
    );

    Game.drawFX(
      Math.floor(this.frame),
      34, //62 sprites wip
      1,
      2,
      baseX + fireOffX + drawOffX,
      baseY - fireOffY + drawOffY,
      1,
      2,
    );

    if (this.direction === Direction.DOWN) {
      Game.drawTile(
        28,
        0,
        1,
        1,
        baseX + drawOffX,
        baseY + 1 + drawOffY + torchYOffset,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }

    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
  };
}
