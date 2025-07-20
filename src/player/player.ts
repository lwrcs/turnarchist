import { Input, InputEnum } from "../game/input";
import { GameConstants } from "../game/gameConstants";
import { ChatMessage, Direction, Game, LevelState } from "../game";
import { Door, DoorType } from "../tile/door";
import { Trapdoor } from "../tile/trapdoor";
import { Inventory } from "../inventory/inventory";
import { Sound } from "../sound/sound";
import { LevelConstants } from "../level/levelConstants";
import { Map } from "../gui/map";
import { HealthBar } from "../drawable/healthbar";
import { VendingMachine } from "../entity/object/vendingMachine";
import { Drawable } from "../drawable/drawable";
import { HitWarning } from "../drawable/hitWarning";
import { Entity, EntityType } from "../entity/entity";
import { Item } from "../item/item";

import { Enemy } from "../entity/enemy/enemy";
import { MouseCursor } from "../gui/mouseCursor";
import { LightSource } from "../lighting/lightSource";

import { Utils } from "../utility/utils";
import { Menu } from "../gui/menu";
import { Bestiary } from "../game/bestiary";
import { PlayerInputHandler } from "./playerInputHandler";
import { PlayerActionProcessor } from "./playerActionProcessor";
import { PlayerMovement } from "./playerMovement";
import { PlayerRenderer } from "./playerRenderer";
import { Wall } from "../tile/wall";
import { UpLadder } from "../tile/upLadder";
import { DownLadder } from "../tile/downLadder";

export enum PlayerDirection {
  DOWN,
  UP,
  RIGHT,
  LEFT,
}

enum DrawDirection {
  X,
  Y,
}

export class Player extends Drawable {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  direction: Direction;
  lastDirection: Direction;
  game: Game;
  levelID: number; // which room we're in (level[levelID])
  health: number;
  maxHealth: number;
  healthBar: HealthBar;
  dead: boolean;
  lastTickHealth: number;
  inventory: Inventory;
  sightRadius: number;
  defaultSightRadius: number;
  static minSightRadius: number = 2; //hard minimum sight radius that ignores depth
  map: Map;
  openVendingMachine: VendingMachine;
  isLocalPlayer: boolean;
  mapToggled: boolean;
  lastHitBy: string;
  turnCount: number;
  triedMove: boolean;
  tutorialRoom: boolean;

  moveRange: number;
  tileCursor: { x: number; y: number };
  lightEquipped: boolean;
  lightSource: LightSource;
  hurtShield: boolean; // handles logic to take damage or not
  lightBrightness: number;
  moveDistance: number;
  moveQueue: { x: number; y: number; direction: Direction }[];
  lastX: number;
  lastY: number;
  justMoved: DrawDirection;
  depth: number;
  menu: Menu;
  busyAnimating: boolean;
  lightColor: [number, number, number];

  inputHandler: PlayerInputHandler;
  actionProcessor: PlayerActionProcessor;
  movement: PlayerMovement;

  cooldownRemaining: number;

  private renderer: PlayerRenderer;

  private drawMoveQueue: {
    drawX: number;
    drawY: number;
  }[] = [];

  seenEnemies: Set<typeof Enemy> = new Set();
  bestiary: Bestiary = null;
  constructor(game: Game, x: number, y: number, isLocalPlayer: boolean) {
    super();

    this.game = game;

    this.levelID = 0;

    this.x = x;
    this.y = y;
    this.w = 1;
    this.h = 1;
    this.moveDistance = 0;
    this.direction = Direction.UP;
    this.lastDirection = Direction.UP;

    this.lastX = 0;
    this.lastY = 0;
    this.isLocalPlayer = isLocalPlayer;
    this.depth = 0;
    this.menu = new Menu(this);
    this.busyAnimating = false;

    this.mapToggled = true;
    this.health = 2;
    this.maxHealth = 2;
    this.healthBar = new HealthBar();
    this.dead = false;
    this.lastTickHealth = this.health;

    this.inventory = new Inventory(game, this);
    this.defaultSightRadius = 3;
    this.sightRadius = LevelConstants.LIGHTING_MAX_DISTANCE; //this.defaultSightRadius;
    this.map = new Map(this.game, this);
    this.turnCount = 0;
    this.triedMove = false;
    this.tutorialRoom = false;

    this.tileCursor = { x: 0, y: 0 };
    this.moveRange = 1;
    this.lightEquipped = false;
    this.lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;

    this.hurtShield = false;
    this.lightBrightness = 0.3;

    this.moveQueue = [];
    this.justMoved = DrawDirection.Y;

    this.inputHandler = new PlayerInputHandler(this);
    this.actionProcessor = new PlayerActionProcessor(this);
    this.movement = new PlayerMovement(this);
    this.renderer = new PlayerRenderer(this);

    this.bestiary = new Bestiary(this.game, this);

    this.cooldownRemaining = 0;
  }

  get hitX() {
    return this.renderer?.drawX ?? 0;
  }
  get hitY() {
    return this.renderer?.drawY ?? 0;
  }

  get drawX() {
    return this.renderer?.drawX ?? 0;
  }
  get drawY() {
    return this.renderer?.drawY ?? 0;
  }

  setHitXY = (newX: number, newY: number, distance = 0.5) => {
    this.renderer.hitX = distance * (this.x - newX);
    this.renderer.hitY = distance * (this.y - newY);
  };

  applyStatus = (
    enemy: Entity,
    status: { poison: boolean; blood: boolean },
  ) => {
    if (enemy instanceof Enemy) {
      if (status.poison) {
        enemy.poison();
        return true;
      }
      if (status.blood) {
        enemy.bleed();
        return true;
      }
    }
  };

  isMouseOnPlayerTile = () => {
    return this.mouseToTile().x === this.x && this.mouseToTile().y === this.y;
  };

  isMouseAboveFloor = (offsetY: number = 0) => {
    const mouseTile = this.mouseToTile(offsetY);

    // Handle undefined coordinates
    if (mouseTile.x === undefined || mouseTile.y === undefined) {
      return false;
    }

    const mouseX = mouseTile.x;
    const mouseY = mouseTile.y;

    if (
      this.game.levelState === LevelState.LEVEL_GENERATION ||
      !this.game.started ||
      !this.game.room ||
      !this.game.room.roomArray ||
      !Array.isArray(this.game.room.roomArray[mouseX]) ||
      this.game.room.roomArray[mouseX][mouseY] === undefined
    )
      return false;

    return !(
      !this.game.room?.tileInside(mouseX, mouseY) ||
      (this.game.room?.tileInside(mouseX, mouseY) &&
        this.game.room?.roomArray[mouseX][mouseY].isSolid() &&
        !(this.game.room?.roomArray[mouseX][mouseY] instanceof Door))
    );
  };

  mouseInLine = () => {
    const mouseTile = this.mouseToTile();

    // Handle undefined coordinates
    if (mouseTile.x === undefined || mouseTile.y === undefined) {
      return false;
    }

    return mouseTile.x === this.x || mouseTile.y === this.y;
  };

  canMoveWithMouse = () => {
    if (this.inventory.isOpen) {
      return null;
    }

    const isFloorNormal = this.isMouseAboveFloor();
    const isFloorOffset = this.isMouseAboveFloor(8);

    if (!isFloorNormal && !isFloorOffset) {
      return null;
    }

    const mouseTile = this.mouseToTile();
    const offsetMouseTile = this.mouseToTile(8);

    if (
      mouseTile.x === undefined ||
      mouseTile.y === undefined ||
      offsetMouseTile.x === undefined ||
      offsetMouseTile.y === undefined
    ) {
      return null;
    }

    if (
      !this.game.room.roomArray ||
      !this.game.room.roomArray[mouseTile.x] ||
      !this.game.room.roomArray[mouseTile.x][mouseTile.y]
    ) {
      return null;
    }

    let targetY = mouseTile.y;
    const hasEntityAtOffset = this.checkTileForEntity(offsetMouseTile);

    if (isFloorOffset && hasEntityAtOffset) {
      targetY = offsetMouseTile.y;
    }

    const sameX = mouseTile.x === this.x;
    const sameY = targetY === this.y;

    if (sameX && sameY) {
      return null;
    }

    if (sameX) {
      const nextY = targetY < this.y ? this.y - 1 : this.y + 1;

      if (
        !this.game.room.roomArray[this.x] ||
        !this.game.room.roomArray[this.x][nextY]
      ) {
        return null;
      }

      return targetY < this.y
        ? { direction: Direction.UP, x: this.x, y: nextY }
        : { direction: Direction.DOWN, x: this.x, y: nextY };
    }

    if (sameY) {
      const nextX = mouseTile.x < this.x ? this.x - 1 : this.x + 1;

      if (
        !this.game.room.roomArray[nextX] ||
        !this.game.room.roomArray[nextX][this.y]
      ) {
        return null;
      }

      return mouseTile.x < this.x
        ? { direction: Direction.LEFT, x: nextX, y: this.y }
        : { direction: Direction.RIGHT, x: nextX, y: this.y };
    }

    return null;
  };

  stall = () => {
    if (!this.game.started || !this.game.room || !this.renderer) return;
    if (this.game.levelState === LevelState.IN_LEVEL) {
      this.game?.room?.tick(this);
      this.shakeScreen(this.x - 0.5, this.y, this.x + 0.5, this.y, 5);
      this.game.pushMessage("Equipping an item takes a turn.");
    }
  };

  moveWithMouse = () => {
    this.inputHandler.setMostRecentMoveInput("mouse");
    if (!GameConstants.MOVE_WITH_MOUSE) return;
    const moveData = this.canMoveWithMouse();
    if (moveData !== null) {
      this.actionProcessor.process({
        type: "MouseMove",
        direction: moveData.direction,
        targetX: moveData.x,
        targetY: moveData.y,
      });
    }
  };

  mouseToTile = (offsetY: number = 0) => {
    // Handle undefined mouse coordinates
    if (Input.mouseX === undefined || Input.mouseY === undefined) {
      return { x: undefined, y: undefined };
    }

    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Convert pixel offset to tile offset
    const tileOffsetX = Math.floor(
      (Input.mouseX - screenCenterX + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );
    const tileOffsetY = Math.floor(
      (Input.mouseY + offsetY - screenCenterY + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );

    return {
      x: this.x + tileOffsetX,
      y: this.y + tileOffsetY,
    };
  };

  tileToMouse = (tileX, tileY) => {
    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Calculate the offset from the center position
    const tileOffsetX = tileX - this.x;
    const tileOffsetY = tileY - this.y;

    // Convert tile offset to pixel coordinates
    const pixelX = screenCenterX + tileOffsetX * GameConstants.TILESIZE;
    const pixelY = screenCenterY + tileOffsetY * GameConstants.TILESIZE;

    return {
      x: pixelX,
      y: pixelY,
    };
  };

  setTileCursorPosition = () => {
    const offsetX =
      Math.floor(GameConstants.WIDTH / 2) / GameConstants.TILESIZE;
    const offsetY =
      Math.floor(GameConstants.HEIGHT / 2) / GameConstants.TILESIZE;

    const mousePosition = this.mouseToTile();

    // Calculate cursor position relative to center
    let cursorX = mousePosition.x - this.x + offsetX - 0.5;
    let cursorY = mousePosition.y - this.y + offsetY - 0.5;

    // Clamp cursor to be no further than 1 tile from center
    // Center is at (offsetX, offsetY)
    const centerX = offsetX;
    const centerY = offsetY;

    // Calculate distance from center (before the 0.5 offset)
    const distanceX = Math.abs(cursorX + 0.5 - centerX);
    const distanceY = Math.abs(cursorY + 0.5 - centerY);

    // Clamp if needed
    if (distanceX > 1) {
      // Preserve direction but limit distance
      const direction = cursorX > centerX ? 1 : -1;
      cursorX = centerX + direction - 0.5; // -0.5 to account for the offset
    }

    if (distanceY > 1) {
      // Preserve direction but limit distance
      const direction = cursorY > centerY ? 1 : -1;
      cursorY = centerY + direction - 0.5; // -0.5 to account for the offset
    }

    this.tileCursor = {
      x: cursorX,
      y: cursorY,
    };
  };

  enemyInRange = (eX: number, eY: number, range: number | null) => {
    // Use nullish coalescing operator for cleaner default value
    const r = range ?? 1;

    // Same tile - not in range
    if (eX === this.x && eY === this.y) return false;

    // Diagonal - not in range
    if (eX !== this.x && eY !== this.y) return false;

    // Check horizontal range
    if (eY === this.y) {
      return Math.abs(eX - this.x) <= r;
    }

    // Check vertical range
    if (eX === this.x) {
      return Math.abs(eY - this.y) <= r;
    }

    return false;
  };

  getDirectionFromCoords = (inputX: number, inputY: number): string => {
    // Same position - no direction
    if (inputX === this.x && inputY === this.y) return "";

    // Diagonal - no direction
    if (inputX !== this.x && inputY !== this.y) return "";

    // Check horizontal
    if (inputY === this.y) {
      return inputX > this.x ? "right" : "left";
    }

    // Check vertical
    if (inputX === this.x) {
      return inputY > this.y ? "down" : "up";
    }

    return "arrow";
  };

  setCursorIcon = () => {
    // Early return cases
    if (this.inventory.isDragging) {
      MouseCursor.getInstance().setIcon("grab");
      return;
    }

    const cursor = MouseCursor.getInstance();
    const mousePos = cursor.getPosition();
    const mouseTile = this.mouseToTile();

    // Check cursor states in order of priority
    const cursorState = this.getCursorState(mousePos, mouseTile);
    cursor.setIcon(cursorState);
  };

  private getCursorState = (
    mousePos: { x: number; y: number },
    mouseTile: { x: number; y: number },
  ): string => {
    // 1. Check UI interactions
    if (this.isMouseInUI(mousePos)) {
      return "hand";
    }
    if (this.isEntityAttackable(mouseTile)) {
      return "sword";
    }

    // 2. Check game world interactions
    if (this.isMouseAboveFloor() && this.mouseInLine()) {
      // 2a. Check for attackable entities

      // 2b. Check for movement target
      if (this.enemyInRange(mouseTile.x, mouseTile.y, 1)) {
        return this.getDirectionFromCoords(mouseTile.x, mouseTile.y);
      }

      // 2c. Default floor interaction
      return "hand";
    }

    // 3. Default cursor state
    return "arrow";
  };

  private isMouseInUI = (mousePos: { x: number; y: number }): boolean => {
    const { x, y } = mousePos;

    return (
      this.inventory.isPointInInventoryButton(x, y) ||
      this.isInventoryItemInteraction(x, y)
    );
  };

  private isInventoryItemInteraction = (x: number, y: number): boolean => {
    const hasSelectedItem = this.inventory.itemAtSelectedSlot() instanceof Item;

    return (
      (this.inventory.isPointInQuickbarBounds(x, y).inBounds &&
        hasSelectedItem) ||
      (this.inventory.isOpen &&
        this.inventory.isPointInInventoryBounds(x, y).inBounds &&
        hasSelectedItem)
    );
  };

  private isEntityAttackable = (mouseTile: {
    x: number;
    y: number;
  }): boolean => {
    // Check current tile
    const currentTileCheck = this.checkTileForEntity(mouseTile);
    if (currentTileCheck) return true;

    // Check tile above with 0.5 tile offset
    const belowTileCheck = this.checkTileForEntity({
      x: mouseTile.x,
      y: this.mouseToTile(GameConstants.TILESIZE / 2).y,
    });

    return belowTileCheck;
  };

  private checkTileForEntity = (tile: { x: number; y: number }): boolean => {
    const range = this.inventory.weapon?.range ?? 1;
    return this.game.room.entities.some((entity) => {
      return (
        entity.x === tile.x &&
        entity.y === tile.y &&
        this.enemyInRange(entity.x, entity.y, range)
      );
    });
  };

  restart = () => {
    this.dead = false;
    this.game.newGame();
  };

  hit = (): number => {
    return 1;
  };

  tryCollide = (other: any, newX: number, newY: number) => {
    if (newX >= other.x + other.w || newX + this.w <= other.x) return false;
    if (newY >= other.y + other.h || newY + this.h <= other.y) return false;
    return true;
  };

  tryMove = (x: number, y: number) => {
    if (
      this.busyAnimating ||
      this.game.levelState === LevelState.TRANSITIONING ||
      this.game.levelState === LevelState.TRANSITIONING_LADDER
    )
      return;
    // TODO don't move if hit by enemy
    this.game.levels[this.depth].rooms[this.levelID].catchUp();
    //this.game.room.catchUp();
    if (!this.game.room) {
      console.warn("oi bruv, game.room isn't even there!");
      return;
    }
    if (this.dead) return;

    //for (let i = 0; i < 2; i++) //no idea why we would loop this...
    if (
      this.inventory.hasWeapon() &&
      !this.inventory.getWeapon().weaponMove(x, y)
    ) {
      //for (let h of this.game.levels[this.levelID].hitwarnings) {
      //if (newMove instanceof HitWarning)
      return;
      //}
    } else if (!this.inventory.hasWeapon()) {
      this.game.pushMessage("No weapon equipped.");
    }

    for (let e of this.game.levels[this.depth].rooms[this.levelID].entities) {
      e.lastX = e.x;
      e.lastY = e.y;
      //console.log(`e.lastX, e.lastY: ${e.lastX}, ${e.lastY}`);
      if (this.tryCollide(e, x, y)) {
        if (e.pushable) {
          // pushing a crate or barrel

          let dx = x - this.x;
          let dy = y - this.y;
          let nextX = x + dx;
          let nextY = y + dy;
          let foundEnd = false; // end of the train of whatever we're pushing
          let enemyEnd = false; // end of the train is a solid enemy (i.e. potted plant)
          let pushedEnemies = [];
          while (true) {
            foundEnd = true;
            for (const f of this.game.levels[this.depth].rooms[this.levelID]
              .entities) {
              f.lastX = f.x;
              f.lastY = f.y;
              if (f.pointIn(nextX, nextY)) {
                if (!f.chainPushable) {
                  enemyEnd = true;
                  foundEnd = true;
                  break;
                }
                foundEnd = false;
                pushedEnemies.push(f);
                break;
              }
            }
            if (foundEnd) break;
            nextX += dx * pushedEnemies[pushedEnemies.length - 1].w;
            nextY += dy * pushedEnemies[pushedEnemies.length - 1].h;
          }
          /* if no enemies and there is a wall, no move
          otherwise, push everything, killing last enemy if there is a wall */
          // here, (nextX, nextY) is the position immediately after the end of the train

          if (
            pushedEnemies.length === 0 &&
            (this.game.levels[this.depth].rooms[this.levelID].roomArray[nextX][
              nextY
            ].canCrushEnemy() ||
              enemyEnd)
          ) {
            if (e.destroyable) {
              //fallback if no weapon equipped
              e.hurt(this, e.health, "none");
              if (
                this.game.levels[this.depth].rooms[this.levelID] ===
                this.game.room
              )
                Sound.hit();

              this.shakeScreen(this.x, this.y, e.x, e.y);
              this.hitShake(this.x, this.y, e.x, e.y);

              this.game.levels[this.depth].rooms[this.levelID].tick(this);
              return;
            }
          } else {
            if (
              this.game.levels[this.depth].rooms[this.levelID] ===
              this.game.room
            )
              Sound.push();
            // here pushedEnemies may still be []

            for (const f of pushedEnemies) {
              f.lastX = f.x;
              f.lastY = f.y;
              f.x += dx;
              f.y += dy;
              f.drawX = dx;
              f.drawY = dy;
              f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
            }
            if (
              this.game.levels[this.depth].rooms[this.levelID].roomArray[nextX][
                nextY
              ].canCrushEnemy() ||
              enemyEnd
            ) {
              pushedEnemies[pushedEnemies.length - 1].crush();
              if (
                this.game.levels[this.depth].rooms[this.levelID] ===
                this.game.room
              )
                Sound.hit();
            }

            e.x += dx;
            e.y += dy;
            e.drawX = dx;
            e.drawY = dy;
            this.move(x, y);
            this.moveDistance++;
            this.game.levels[this.depth].rooms[this.levelID].tick(this);
            return;
          }
        } else {
          // if we're trying to hit an enemy, check if it's destroyable
          if (!e.dead) {
            if (e.interactable) e.interact(this);
            //this.actionTab.actionState = ActionState.ATTACK;
            //sets the action tab state to Attack
            return;
          }
        }
      }
    }
    let other =
      this.game.levels[this.depth].rooms[this.levelID]?.roomArray?.[x]?.[y];
    if (!other) {
      console.warn("oi bruv, tile to check for collision isn't even there!");
      return;
    }
    if (!this.game.levels[this.depth].rooms[this.levelID]) {
      console.warn("oi bruv, room to check for collision isn't even there!");
      return;
    }
    if (!this.game.levels[this.depth].rooms[this.levelID].roomArray) {
      console.warn("oi bruv, level to check for collision isn't even there!");
      return;
    }
    if (!other.isSolid()) {
      if (other instanceof UpLadder || other instanceof DownLadder) {
        const locked = other.isLocked();

        if (locked) {
          this.shakeScreen(this.x, this.y, x, y);
          if (other.lockable.canUnlock(this)) {
            other.lockable.unlock(this);
          } else {
            Sound.playLocked();
          }
          other.addLightSource();
          this.game.room.updateLighting();
          return;
        }
      }
      this.move(x, y);
      other.onCollide(this);
      if (
        !(
          other instanceof Door ||
          other instanceof Trapdoor ||
          other instanceof UpLadder ||
          other instanceof DownLadder
        )
      )
        this.game.levels[this.depth].rooms[this.levelID].tick(this);
    } else {
      if (other instanceof Door) {
        this.shakeScreen(this.x, this.y, x, y);

        if (other.canUnlock(this)) {
          other.unlock(this);
        } else {
          Sound.playLocked();
        }
      }
    }
  };

  private updateLastPosition = (x: number, y: number) => {
    this.lastX = x;
    this.lastY = y;
  };

  hurt = (damage: number, enemy: string) => {
    // Play hurt sound if in current room
    if (this.game.levels[this.depth].rooms[this.levelID] === this.game.room) {
      Sound.hurt();
      Sound.playGrunt();
    }

    // Handle armor damage
    if (this.inventory.getArmor() && this.inventory.getArmor().health > 0) {
      this.inventory.getArmor().hurt(damage);
      this.renderer.hurtShield();
      this.hurtShield = true;
    }

    // Update player state
    this.lastHitBy = enemy;
    this.healthBar.hurt();
    this.renderer.flash();
    this.enemyHurtMessage(damage, enemy);

    // Apply damage if no shield
    if (!this.hurtShield) {
      this.health -= damage;
    }
    this.hurtShield = false;
    this.renderer.hurt();

    // Check for death
    if (this.health <= 0 && !GameConstants.DEVELOPER_MODE) {
      this.dead = true;
    }
  };

  enemyHurtMessage = (damage: number, enemy: string) => {
    this.game.pushMessage(`The ${enemy} hits you for ${damage} damage.`);
  };

  beginSlowMotion = () => {
    this.renderer.beginSlowMotion();
  };

  endSlowMotion = () => {
    this.renderer.endSlowMotion();
  };

  move = (x: number, y: number) => {
    this.updateLastPosition(this.x, this.y);

    //this.actionTab.setState(ActionState.MOVE);
    if (this.game.levels[this.depth].rooms[this.levelID] === this.game.room)
      Sound.playerStoneFootstep(this.game.room.envType);

    if (this.openVendingMachine) this.openVendingMachine.close();

    this.renderer.setNewDrawXY(x, y);
    this.drawMoveQueue.push({
      drawX: x - this.x,
      drawY: y - this.y,
    });

    /*
    if (this.drawX > 1) this.drawX = 1;
    if (this.drawY > 1) this.drawY = 1;
    if (this.drawX < -1) this.drawX = -1;
    if (this.drawY < -1) this.drawY = -1;
    */

    this.x = x;
    this.y = y;

    for (let i of this.game.levels[this.depth].rooms[this.levelID].items) {
      if (i.x === x && i.y === y) {
        i.onPickup(this);
      }
    }
    let diffX = x - this.lastX;
    let diffY = y - this.lastY;
    if (diffX === 0 && diffY === 0) return;

    //this.game.rooms[this.levelID].updateLighting();
    let roomsOnScreen = 0;
    for (let room of this.game.level.rooms) {
      room.roomOnScreen(this);
      //console.log("On Screen? " + room.onScreen + " levelID: " + room.id);
      if (room.onScreen) roomsOnScreen++;
    }
    //console.log("Rooms On Screen Currently: " + roomsOnScreen);
  };

  moveNoSmooth = (x: number, y: number) => {
    // doesn't touch smoothing
    this.x = x;
    this.y = y;
  };

  moveSnap = (x: number, y: number) => {
    // no smoothing
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.renderer.snapDrawStuff();
  };

  update = () => {};

  finishTick = () => {
    this.turnCount += 1;
    this.inventory.tick();

    this.renderer.disableFlash();

    let totalHealthDiff = this.health - this.lastTickHealth;
    this.lastTickHealth = this.health; // update last tick health
    if (totalHealthDiff < 0) {
      this.renderer.flash();
    }
    this.moveDistance = 0;

    //this.actionTab.actionState = ActionState.READY;
    //Sets the action tab state to Wait (during enemy turn)
  };

  draw = (delta: number) => {
    this.renderer.draw(delta);
  };

  heal = (amount: number) => {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  };

  hitShake = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number,
  ) => {
    const range = GameConstants.TILESIZE;
    const hitX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
    const hitY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);
    this.renderer.setHitXY(hitX, hitY);
  };

  shakeScreen = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number,
    shakeStrength: number = 10,
  ) => {
    const range = GameConstants.TILESIZE;
    const shakeX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
    const shakeY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);
    this.renderer.setHitXY(shakeX, shakeY);

    this.game.shakeScreen(
      -shakeX * 1 * shakeStrength,
      -shakeY * 1 * shakeStrength,
    );
  };

  updateSlowMotion = () => {
    this.renderer.updateSlowMotion();
  };

  drawGUI = (delta: number) => {
    this.renderer.drawGUI(delta);
  };
}
