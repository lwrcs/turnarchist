import { Game } from "../game";
import { Floor } from "../tile/floor";
import { Wall } from "../tile/wall";
import { Random } from "../utility/random";
import { Room, WallDirection } from "./room";

export class RoomBuilder {
  room: Room;
  constructor(room: Room) {
    this.room = room;
    this.buildEmptyRoom();
  }

  private buildEmptyRoom() {
    // fill in wall and floor
    for (let x = this.room.roomX; x < this.room.roomX + this.room.width; x++) {
      for (
        let y = this.room.roomY;
        y < this.room.roomY + this.room.height;
        y++
      ) {
        if (
          this.room.pointInside(
            x,
            y,
            this.room.roomX + 1,
            this.room.roomY + 1,
            this.room.width - 2,
            this.room.height - 2,
          )
        ) {
          this.room.roomArray[x][y] = new Floor(this.room, x, y);
        } else {
          this.room.roomArray[x][y] = new Wall(
            this.room,
            x,
            y,
            this.getWallType(
              x,
              y,
              this.room.roomX,
              this.room.roomY,
              this.room.width,
              this.room.height,
            ),
          );
        }
      }
    }
  }

  getWallType = (
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    width: number,
    height: number,
  ): Array<WallDirection> => {
    let directions: Array<WallDirection> = [];
    if (pointY === rectY && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.NORTH);
    if (pointY === rectY + height && pointX >= rectX && pointX <= rectX + width)
      directions.push(WallDirection.SOUTH);
    if (pointX === rectX && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.WEST);
    if (pointX === rectX + width && pointY >= rectY && pointY <= rectY + height)
      directions.push(WallDirection.EAST);
    return directions;
  };

  addWallBlocks(rand: () => number) {
    this.addWallBlocksStandard(rand);
  }

  private countWallNeighbors = (wall: Wall): number => {
    let count = 0;
    for (let xx = wall.x - 1; xx <= wall.x + 1; xx++) {
      for (let yy = wall.y - 1; yy <= wall.y + 1; yy++) {
        if (
          this.room.roomArray[xx]?.[yy] instanceof Wall &&
          !(xx === wall.x && yy === wall.y)
        )
          count++;
      }
    }
    return count;
  };

  // Original behavior moved here; used by addWallBlocks
  addWallBlocksStandard(rand: () => number) {
    let numBlocks = Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
    if (this.room.width > 8 && rand() > 0.5) numBlocks *= 4;
    for (let i = 0; i < numBlocks; i++) {
      let blockW = Math.min(
        Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand),
        this.room.width - 4,
      );
      let blockH = Math.min(
        blockW + Game.rand(-2, 2, rand),
        this.room.height - 4,
      );

      let x = Game.rand(
        this.room.roomX + 2,
        this.room.roomX + this.room.width - blockW - 2,
        rand,
      );
      let y = Game.rand(
        this.room.roomY + 2,
        this.room.roomY + this.room.height - blockH - 2,
        rand,
      );

      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          let w = new Wall(this.room, xx, yy);
          this.room.roomArray[xx][yy] = w;
          this.room.innerWalls.push(w);
        }
      }
      this.room.innerWalls.forEach((wall) => {
        if (this.countWallNeighbors(wall) <= 1) {
          this.room.removeWall(wall.x, wall.y);
          this.room.roomArray[wall.x][wall.y] = new Floor(
            this.room,
            wall.x,
            wall.y,
          );
          this.room.innerWalls = this.room.innerWalls.filter((w) => w !== wall);
        }
      });
    }
  }

  // Variation: creates smaller, jagged clusters with carved gaps; same placement constraints
  addWallBlocksVariant(rand: () => number) {
    let numBlocks = Game.randTable([2, 2, 3, 3, 4, 5], rand);
    if (this.room.width > 10 && rand() > 0.5) numBlocks += 2;
    for (let i = 0; i < numBlocks; i++) {
      // Favor smaller widths/heights to form jagged shapes
      let baseW = Game.randTable([1, 2, 2, 2, 3, 3], rand);
      let blockW = Math.min(Math.max(1, baseW), this.room.width - 4);
      let blockH = Math.min(
        Math.max(1, baseW + Game.rand(-1, 1, rand)),
        this.room.height - 4,
      );

      let x = Game.rand(
        this.room.roomX + 2,
        this.room.roomX + this.room.width - blockW - 2,
        rand,
      );
      let y = Game.rand(
        this.room.roomY + 2,
        this.room.roomY + this.room.height - blockH - 2,
        rand,
      );

      // Place a ragged block by skipping some interior cells randomly
      for (let xx = x; xx < x + blockW; xx++) {
        for (let yy = y; yy < y + blockH; yy++) {
          // Keep edges of the block more solid, randomize interior
          const isEdge =
            xx === x ||
            yy === y ||
            xx === x + blockW - 1 ||
            yy === y + blockH - 1;
          if (isEdge || rand() > 0.35) {
            let w = new Wall(this.room, xx, yy);
            this.room.roomArray[xx][yy] = w;
            this.room.innerWalls.push(w);
          }
        }
      }

      // Carve 1-2 holes to ensure flow through clusters
      const holes = Game.randTable([0, 1, 1, 2], rand);
      for (let h = 0; h < holes; h++) {
        const hx = Game.rand(x + 1, Math.max(x + 1, x + blockW - 2), rand);
        const hy = Game.rand(y + 1, Math.max(y + 1, y + blockH - 2), rand);
        if (this.room.roomArray[hx]?.[hy] instanceof Wall) {
          this.room.removeWall(hx, hy);
          this.room.roomArray[hx][hy] = new Floor(this.room, hx, hy);
          this.room.innerWalls = this.room.innerWalls.filter(
            (w) => !(w.x === hx && w.y === hy),
          );
        }
      }

      // Prune more aggressively to avoid single spurs and self-locking
      this.room.innerWalls.forEach((wall) => {
        if (this.countWallNeighbors(wall) <= 2) {
          this.room.removeWall(wall.x, wall.y);
          this.room.roomArray[wall.x][wall.y] = new Floor(
            this.room,
            wall.x,
            wall.y,
          );
          this.room.innerWalls = this.room.innerWalls.filter((w) => w !== wall);
        }
      });
    }
  }
}
