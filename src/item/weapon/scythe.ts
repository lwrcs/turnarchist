import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { Direction } from "../../game";

export class Scythe extends Weapon {
  static itemName = "scythe";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 2;
    this.damage = 1;
    this.name = "scythe";
    this.hitDelay = 150;
    this.useCost = 2;
    this.offsetY = 0;
    this.iconOffset = 0.2;
    this.degradeable = false;
    this.twoHanded = true;
  }

  hitSound = () => {
    Sound.swing();
    //Sound.hit();
    Sound.playSlice();
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let positions: { x: number; y: number }[] = [];

    switch (this.wielder.direction) {
      case Direction.DOWN:
        positions = [
          { x: newX - 1, y: newY }, // leftCorner
          { x: newX + 1, y: newY }, // rightCorner
          { x: newX - 1, y: newY - 1 }, // leftEdge
          { x: newX + 1, y: newY - 1 }, // rightEdge
        ];
        break;
      case Direction.UP:
        positions = [
          { x: newX + 1, y: newY }, // leftCorner
          { x: newX - 1, y: newY }, // rightCorner
          { x: newX + 1, y: newY + 1 }, // leftEdge
          { x: newX - 1, y: newY + 1 }, // rightEdge
        ];
        break;
      case Direction.LEFT:
        positions = [
          { x: newX, y: newY + 1 }, // leftCorner
          { x: newX, y: newY - 1 }, // rightCorner
          { x: newX + 1, y: newY + 1 }, // leftEdge
          { x: newX + 1, y: newY - 1 }, // rightEdge
        ];
        break;
      case Direction.RIGHT:
        positions = [
          { x: newX, y: newY - 1 }, // leftCorner
          { x: newX, y: newY + 1 }, // rightCorner
          { x: newX - 1, y: newY - 1 }, // leftEdge
          { x: newX - 1, y: newY + 1 }, // rightEdge
        ];
        break;
    }

    if (this.checkForPushables(newX, newY)) return true;
    this.beginSwing();
    const hitSomething = this.executeAttack(
      newX,
      newY,
      true,
      this.damage + this.wielder.damageBonus,
      true,
      true,
      true,
      false,
    );
    if (hitSomething) {
      if (positions.length > 0) {
        for (const pos of positions) {
          const room = (this.wielder as any)?.getRoom
            ? (this.wielder as any).getRoom()
            : this.game.rooms[this.wielder.levelID];
          if (!room.roomArray[pos.x][pos.y].isSolid()) {
            this.hitEntitiesAt(
              pos.x,
              pos.y,
              this.damage + this.wielder.damageBonus,
            );
          }
        }
      }
      const room = (this.wielder as any)?.getRoom
        ? (this.wielder as any).getRoom()
        : this.game.rooms[this.wielder.levelID];
      room.tick(this.wielder);
    }
    this.endSwing();

    return !hitSomething;
  };

  shakeScreen = () => {
    //this.wielder.beginSlowMotion();

    setTimeout(() => {
      //this.wielder.endSlowMotion();
      switch (this.wielder.direction) {
        case Direction.DOWN:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.UP:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.LEFT:
          this.game.shakeScreen(-5, -5, false);
          break;
        case Direction.RIGHT:
          this.game.shakeScreen(5, -5, false);
          break;
      }
    }, this.hitDelay);
  };
}
