import { Input, InputEnum } from "../input";
import { GameConstants } from "../gameConstants";
import { ChatMessage, Direction, Game, LevelState } from "../game";
import { Door, DoorType } from "../tile/door";
import { Trapdoor } from "../tile/trapdoor";
import { Inventory } from "../inventory/inventory";
import { Sound } from "../sound";
import { LevelConstants } from "../levelConstants";
import { Map } from "../map";
import { SlashParticle } from "../particle/slashParticle";
import { HealthBar } from "../healthbar";
import { VendingMachine } from "../entity/object/vendingMachine";
import { Drawable } from "../drawable";
import { Random } from "../random";
import { GenericParticle } from "../particle/genericParticle";
import { ActionState, ActionTab } from "../actionTab";
import { HitWarning } from "../hitWarning";
import { Entity, EntityType } from "../entity/entity";
import { ZombieEnemy } from "../entity/enemy/zombieEnemy";
import { Item } from "../item/item";
import { PostProcessor } from "../postProcess";
import { Weapon } from "../weapon/weapon";
import { Room } from "../room";
import { ImageParticle } from "../particle/imageParticle";
import { Enemy } from "../entity/enemy/enemy";
import { MouseCursor } from "../mouseCursor";
import { Light } from "../item/light";
import { LightSource } from "../lightSource";
import { statsTracker } from "../stats";
import { BeamEffect } from "../beamEffect";
import { Spellbook } from "../weapon/spellbook";
import { globalEventBus } from "../eventBus";
import { Utils } from "../utils";
import { Menu } from "../menu";
import { Bestiary } from "../bestiary";
import { AttackAnimation } from "../particle/attackAnimation";
import { PlayerInputHandler } from "./playerInputHandler";
import { PlayerActionProcessor } from "./playerActionProcessor";
import { PlayerMovement } from "./playerMovement";

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
  drawX: number;
  drawY: number;
  hitX: number;
  hitY: number;
  frame: number;
  direction: Direction;
  game: Game;
  levelID: number; // which room we're in (level[levelID])
  flashing: boolean;
  flashingFrame: number;
  health: number;
  maxHealth: number;
  healthBar: HealthBar;
  dead: boolean;
  lastTickHealth: number;
  inventory: Inventory;
  sightRadius: number;
  defaultSightRadius: number;
  static minSightRadius: number = 2; //hard minimum sight radius that ignores depth
  guiHeartFrame: number;
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
  private jumpY: number;
  lightEquipped: boolean;
  lightSource: LightSource;
  hurtAlpha: number;
  hurting: boolean; // handles drawing hurt animation
  hurtingShield: boolean; // handles drawing hurt shield animation
  hurtShield: boolean; // handles logic to take damage or not
  lightBrightness: number;
  sineAngle: number;
  drawMoveSpeed: number;
  jumpHeight: number;
  moveDistance: number;
  moveQueue: { x: number; y: number; direction: Direction }[];
  lastX: number;
  lastY: number;
  motionSpeed: number;
  slowMotionEnabled: boolean;
  justMoved: DrawDirection;
  slowMotionTickDuration: number;
  depth: number;
  menu: Menu;
  busyAnimating: boolean;
  inputHandler: PlayerInputHandler;
  actionProcessor: PlayerActionProcessor;
  movement: PlayerMovement;

  private lowHealthFrame: number = 0;
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
    this.drawX = 0;
    this.drawY = 0;
    this.jumpY = 0;
    this.jumpHeight = 0.3;
    this.frame = 0;
    this.moveDistance = 0;
    this.direction = Direction.UP;
    this.lastX = 0;
    this.lastY = 0;
    this.isLocalPlayer = isLocalPlayer;
    this.depth = 0;
    this.menu = new Menu();
    this.busyAnimating = false;

    this.mapToggled = true;
    this.health = 2;
    this.maxHealth = 2;
    this.healthBar = new HealthBar();
    this.dead = false;
    this.flashing = false;
    this.flashingFrame = 0;
    this.lastTickHealth = this.health;
    this.guiHeartFrame = 0;

    this.inventory = new Inventory(game, this);
    this.defaultSightRadius = 3;
    this.sightRadius = LevelConstants.LIGHTING_MAX_DISTANCE; //this.defaultSightRadius;
    this.map = new Map(this.game, this);
    //this.actionTab = new ActionTab(this.inventory, this.game);
    this.turnCount = 0;
    this.triedMove = false;
    this.tutorialRoom = false;

    this.tileCursor = { x: 0, y: 0 };
    this.moveRange = 1;
    this.lightEquipped = false;
    this.hurting = false;
    this.hurtingShield = false;
    this.hurtShield = false;
    this.hurtAlpha = 0.25;
    this.lightBrightness = 0.3;
    this.sineAngle = Math.PI / 2;
    this.drawMoveSpeed = 0.3; // greater than 1 less than 2
    this.moveQueue = [];

    this.hitX = 0;
    this.hitY = 0;
    this.motionSpeed = 1;
    this.slowMotionEnabled = false;
    this.slowMotionTickDuration = 0;
    this.justMoved = DrawDirection.Y;

    this.inputHandler = new PlayerInputHandler(this);
    this.actionProcessor = new PlayerActionProcessor(this);
    this.movement = new PlayerMovement(this);

    this.bestiary = new Bestiary(this.game, this);
  }

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

  ignoreDirectionInput = (): boolean => {
    return (
      !this.inventory.isOpen &&
      (this.dead || this.game.levelState !== LevelState.IN_LEVEL)
    );
  };

  isMouseOnPlayerTile = () => {
    return this.mouseToTile().x === this.x && this.mouseToTile().y === this.y;
  };

  isMouseAboveFloor = (offsetY: number = 0) => {
    return !(
      !this.game.room.tileInside(
        this.mouseToTile().x,
        this.mouseToTile(offsetY).y,
      ) ||
      (this.game.room.tileInside(
        this.mouseToTile().x,
        this.mouseToTile(offsetY).y,
      ) &&
        this.game.room.roomArray[this.mouseToTile().x][
          this.mouseToTile(offsetY).y
        ].isSolid() &&
        !(
          this.game.room.roomArray[this.mouseToTile().x][
            this.mouseToTile(offsetY).y
          ] instanceof Door
        ))
    );
  };

  mouseInLine = () => {
    const mouseTile = this.mouseToTile();
    return mouseTile.x === this.x || mouseTile.y === this.y;
  };

  canMoveWithMouse = () => {
    if (!this.isMouseAboveFloor() && !this.isMouseAboveFloor(8)) return;

    const mouseTile = this.mouseToTile();
    const offsetMouseTile = this.mouseToTile(8);
    let y = mouseTile.y;

    if (this.isMouseAboveFloor(8) && this.checkTileForEntity(offsetMouseTile)) {
      y = offsetMouseTile.y;
    }
    // Get mouse tile coordinates

    // Check if we're on same row or column
    const sameX = mouseTile.x === this.x;
    const sameY = y === this.y;

    // If both same, no movement needed
    if (sameX && sameY) return null;

    // Check for straight line movements first
    if (sameX) {
      if (y < this.y) {
        return { direction: Direction.UP, x: this.x, y: this.y - 1 };
      } else {
        return { direction: Direction.DOWN, x: this.x, y: this.y + 1 };
      }
    }
    if (sameY) {
      if (mouseTile.x < this.x) {
        return { direction: Direction.LEFT, x: this.x - 1, y: this.y };
      } else {
        return { direction: Direction.RIGHT, x: this.x + 1, y: this.y };
      }
    }
    /*
    // Fall back to angle-based approach for diagonal mouse positions
    const playerScreenX = GameConstants.WIDTH / 2;
    const playerScreenY = GameConstants.HEIGHT / 2;
    const dx = Input.mouseX - playerScreenX;
    const dy = Input.mouseY - playerScreenY;

    let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    if (angle >= 310 || angle < 10) {
      return { direction: Direction.RIGHT, x: this.x + 1, y: this.y };
    } else if (angle >= 40 && angle < 140) {
      return { direction: Direction.UP, x: this.x, y: this.y - 1 };
    } else if (angle >= 130 && angle < 230) {
      return { direction: Direction.LEFT, x: this.x - 1, y: this.y };
    } else if (angle >= 220 && angle < 320) {
      return { direction: Direction.DOWN, x: this.x, y: this.y + 1 };
    }
      */
    return null;
  };

  moveWithMouse = () => {
    if (!GameConstants.MOVE_WITH_MOUSE) return;
    const moveData = this.canMoveWithMouse();
    if (moveData) {
      this.direction = moveData.direction;
      this.tryMove(moveData.x, moveData.y);
    }
  };

  mouseToTile = (offsetY: number = 0) => {
    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Convert pixel offset to tile offset (this part was working correctly)
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

  moveRangeCheck = (x: number, y: number) => {
    const dx = Math.abs(this.x - x);
    const dy = Math.abs(this.y - y);
    return (
      dx <= this.moveRange &&
      dy <= this.moveRange &&
      (dx === 0 || dy === 0) &&
      dx + dy !== 0
    );
  };

  setTileCursorPosition = () => {
    const offsetX =
      Math.floor(GameConstants.WIDTH / 2) / GameConstants.TILESIZE;

    const offsetY =
      Math.floor(GameConstants.HEIGHT / 2) / GameConstants.TILESIZE;
    /*
    this.tileCursor = {
      x: this.mouseToTile().x - this.x + offsetX - 0.5,
      y: this.mouseToTile().y - this.y + offsetY - 0.5,
    };
    */

    const moveData = this.canMoveWithMouse();
    if (moveData) {
      this.tileCursor = {
        x: moveData.x - this.x + offsetX - 0.5,
        y: moveData.y - this.y + offsetY - 0.5,
      };
    }
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
    if (this.busyAnimating) return;
    let slowMotion = this.slowMotionEnabled;
    let newMove = { x: x, y: y };
    // TODO don't move if hit by enemy
    this.game.levels[this.depth].rooms[this.levelID].catchUp();
    if (this.dead) return;

    for (let i = 0; i < 2; i++)
      if (
        this.inventory.hasWeapon() &&
        !this.inventory.getWeapon().weaponMove(x, y)
      ) {
        //for (let h of this.game.levels[this.levelID].hitwarnings) {
        //if (newMove instanceof HitWarning)
        return;
        //}
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
      this.game.levels[this.depth].rooms[this.levelID].roomArray[x][y];
    if (!other.isSolid()) {
      this.move(x, y);
      other.onCollide(this);
      if (!(other instanceof Door || other instanceof Trapdoor))
        this.game.levels[this.depth].rooms[this.levelID].tick(this);
    } else {
      if (other instanceof Door) {
        this.shakeScreen(this.x, this.y, x, y);

        if (other.canUnlock(this)) other.unlock(this);
      }
    }
  };

  private updateLastPosition = (x: number, y: number) => {
    this.lastX = x;
    this.lastY = y;
  };

  //get cancelHoldMove = () => {};

  wouldHurt = (x: number, y: number) => {
    for (let h of this.game.levels[this.depth].rooms[this.levelID]
      .hitwarnings) {
      if (h instanceof HitWarning && h.x == x && h.y == y) return true;
      else {
        return false;
      }
    }
  };

  hurt = (damage: number, enemy: string) => {
    if (this.game.levels[this.depth].rooms[this.levelID] === this.game.room)
      Sound.hurt();

    if (this.inventory.getArmor() && this.inventory.getArmor().health > 0) {
      this.inventory.getArmor().hurt(damage);
      this.hurtingShield = true;
      this.hurtShield = true;
    }
    {
      this.lastHitBy = enemy;
      //console.log("Last Hit by: ", enemy);
      this.healthBar.hurt();
      this.flashing = true;
      if (!this.hurtShield) this.health -= damage;
      this.hurtShield = false;
      this.hurting = true;
      this.hurtAlpha = 0.25;
      if (this.health <= 0 && !GameConstants.DEVELOPER_MODE) {
        this.dead = true;
      }

      /*
      if (this.health <= 0) {
        this.health = 0;
        
        if (!this.game.tutorialActive) {
          this.dead = true;
        } else {
          this.health = 2;
          this.game.pushMessage("You are dead, but you can try again!");
        }
        */
    }
  };

  dashMove = (x: number, y: number) => {
    this.x = x;
    this.y = y;

    for (let i of this.game.levels[this.depth].rooms[this.levelID].items) {
      if (i.x === x && i.y === y) {
        i.onPickup(this);
      }
    }

    //this.game.rooms[this.levelID].updateLighting();
  };

  doneMoving = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.drawX) < EPSILON && Math.abs(this.drawY) < EPSILON;
  };

  doneHitting = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.hitX) < EPSILON && Math.abs(this.hitY) < EPSILON;
  };

  enableSlowMotion = () => {
    if (this.motionSpeed < 1 && !this.slowMotionEnabled) {
      this.motionSpeed *= 1.08;
      if (this.motionSpeed >= 1) this.motionSpeed = 1;
    }
    if (this.slowMotionEnabled && this.motionSpeed > 0.25) {
      this.motionSpeed *= 0.95;
      if (this.motionSpeed < 0.25) this.motionSpeed = 0.25;
    }
  };

  move = (x: number, y: number) => {
    this.updateLastPosition(this.x, this.y);

    //this.actionTab.setState(ActionState.MOVE);
    if (this.game.levels[this.depth].rooms[this.levelID] === this.game.room)
      Sound.playerStoneFootstep();

    if (this.openVendingMachine) this.openVendingMachine.close();

    this.drawX += x - this.x;
    this.drawY += y - this.y;
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
    this.drawX = 0;
    this.drawY = 0;
    this.hitX = 0;
    this.hitY = 0;
    this.jumpY = 0;
  };

  update = () => {};

  updateSlowMotion = () => {
    if (this.slowMotionTickDuration > 0) this.slowMotionTickDuration -= 1;
    if (this.slowMotionTickDuration === 0) this.slowMotionEnabled = false;
  };

  finishTick = () => {
    this.turnCount += 1;
    this.inventory.tick();

    this.flashing = false;

    let totalHealthDiff = this.health - this.lastTickHealth;
    this.lastTickHealth = this.health; // update last tick health
    if (totalHealthDiff < 0) {
      this.flashing = true;
    }
    this.moveDistance = 0;

    //this.actionTab.actionState = ActionState.READY;
    //Sets the action tab state to Wait (during enemy turn)
  };

  /**
   * Draws the player sprite to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawPlayerSprite = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state

    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;
    Game.drawMob(
      1 + Math.floor(this.frame),
      8 + this.direction * 2,
      1,
      2,
      this.x - this.drawX - this.hitX,
      this.y - 1.45 - this.drawY - this.jumpY - this.hitY,
      1,
      2,
      this.shadeColor(),
    );
    if (this.inventory.getArmor() && this.inventory.getArmor().health > 0) {
      // TODO draw armor
    }

    Game.ctx.restore(); // Restore the canvas state
  };

  shadeColor = () => {
    if (!GameConstants.CUSTOM_SHADER_COLOR_ENABLED) {
      return "black";
    } else {
      return Utils.rgbToHex(
        this.game.levels[this.depth].rooms[this.levelID].col[this.x][this.y][0],
        this.game.levels[this.depth].rooms[this.levelID].col[this.x][this.y][1],
        this.game.levels[this.depth].rooms[this.levelID].col[this.x][this.y][2],
      );
    }
  };

  heal = (amount: number) => {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  };

  drawSpellBeam = (delta: number) => {
    Game.ctx.save();
    // Clear existing beam effects each frame
    this.game.levels[this.depth].rooms[this.levelID].beamEffects = [];

    if (this.inventory.getWeapon() instanceof Spellbook) {
      const spellbook = this.inventory.getWeapon() as Spellbook;
      if (spellbook.isTargeting) {
        let targets = spellbook.targets;
        for (let target of targets) {
          // Create a new beam effect from the player to the enemy
          this.game.levels[this.depth].rooms[this.levelID].addBeamEffect(
            this.x - this.drawX,
            this.y - this.drawY,
            target.x - target.drawX,
            target.y - target.drawY,
            target,
          );

          // Retrieve the newly added beam effect
          const beam =
            this.game.levels[this.depth].rooms[this.levelID].beamEffects[
              this.game.levels[this.depth].rooms[this.levelID].beamEffects
                .length - 1
            ];

          // Render the beam
          beam.render(
            this.x - this.drawX,
            this.y - this.drawY,
            target.x - target.drawX,
            target.y - target.drawY,
            "cyan",
            2,
            delta,
          );
        }
      }
    }
    Game.ctx.restore();
  };
  draw = (delta: number) => {
    Game.ctx.save();
    this.updateDrawXY(delta);
    this.drawableY = this.y;
    this.flashingFrame += (delta * 12) / GameConstants.FPS;
    if (!this.dead) {
      Game.drawMob(0, 0, 1, 1, this.x - this.drawX, this.y - this.drawY, 1, 1);
      if (!this.flashing || Math.floor(this.flashingFrame) % 2 === 0) {
        this.drawPlayerSprite(delta);
      }
    }
    this.drawSpellBeam(delta);
    Game.ctx.restore();
  };

  faceMouse = () => {
    if (!GameConstants.MOVE_WITH_MOUSE) return;
    const mousePosition = MouseCursor.getInstance().getPosition();
    const playerPixelPosition = {
      x: GameConstants.WIDTH / 2,
      y: GameConstants.HEIGHT / 2,
    };
    const dx = mousePosition.x - playerPixelPosition.x;
    const dy = mousePosition.y - playerPixelPosition.y;
    const angle = Math.atan2(dy, dx);

    // Convert angle to direction
    // atan2 returns angle in radians (-π to π)
    // Divide the circle into 4 sectors for the 4 directions
    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      this.direction = Direction.RIGHT;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      this.direction = Direction.DOWN;
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
      this.direction = Direction.UP;
    } else {
      this.direction = Direction.LEFT;
    }
  };

  heartbeat = () => {
    this.guiHeartFrame = 1;
  };

  tapHoldHandler = () => {
    this.mapToggled = !this.mapToggled;
  };

  /**
   * Draws the top layer elements, such as the health bar.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawTopLayer = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x - this.drawX,
      this.y - this.drawY,
      !this.flashing || Math.floor(this.flashingFrame) % 2 === 0,
    );

    Game.ctx.restore(); // Restore the canvas state
  };

  drawGUI = (delta: number, transitioning: boolean = false) => {
    Game.ctx.save();
    if (!this.dead) {
      if (!transitioning) this.inventory.draw(delta);
      if (this.bestiary) this.bestiary.draw(delta);
      //this.actionTab.draw(delta);

      if (this.guiHeartFrame > 0) this.guiHeartFrame += delta;
      if (this.guiHeartFrame > 5) {
        this.guiHeartFrame = 0;
      }
      for (let i = 0; i < this.maxHealth; i++) {
        let shake = 0;
        let shakeY = 0;
        if (this.health <= 1) {
          shake =
            Math.round(Math.sin(Date.now() / 25 / (i + 1)) + i / 2) /
            2 /
            GameConstants.TILESIZE;
          shakeY =
            Math.round(Math.sin(Date.now() / 25 / (i + 2)) + i / 2) /
            2 /
            GameConstants.TILESIZE;
        }
        let frame = this.guiHeartFrame > 0 ? 1 : 0;
        let offsetY = GameConstants.WIDTH > 155 ? 0 : -1.25;

        if (i >= Math.floor(this.health)) {
          if (i == Math.floor(this.health) && (this.health * 2) % 2 == 1) {
            // draw half heart
            Game.drawFX(
              4,
              2,
              0.75,
              0.75,
              i / 1.5 + shake + 0.25,
              GameConstants.HEIGHT / GameConstants.TILESIZE -
                1 +
                shakeY +
                offsetY,
              0.75,
              0.75,
            );
          } else {
            Game.drawFX(
              3,
              2,
              0.75,
              0.75,
              i / 1.5 + shake + 0.25,
              GameConstants.HEIGHT / GameConstants.TILESIZE -
                1 +
                shakeY +
                offsetY,
              0.75,
              0.75,
            );
          }
        } else {
          Game.drawFX(
            frame,
            2,
            0.75,
            0.75,
            i / 1.5 + shake + 0.25,
            GameConstants.HEIGHT / GameConstants.TILESIZE -
              1 +
              shakeY +
              offsetY,
            0.75,
            0.75,
          );
        }
      }
      if (this.inventory.getArmor())
        this.inventory.getArmor().drawGUI(delta, this.maxHealth);
    } else {
      Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
      const enemies = statsTracker.getStats().enemies;
      // Count the occurrences of each enemy
      const enemyCounts = enemies.reduce(
        (acc, enemy) => {
          acc[enemy] = (acc[enemy] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Create individual lines
      const lines: string[] = [];

      // Line 1: Game Over or slain by
      if (this.lastHitBy !== "enemy") {
        lines.push(`You were slain by ${this.lastHitBy}.`);
      } else {
        lines.push("Game Over");
      }

      lines.push(
        `Depth reached: ${this.game.levels[this.depth].rooms[this.levelID].depth}`,
      );

      // Line 2: Enemies killed
      lines.push(
        `${Object.values(enemyCounts).reduce(
          (a, b) => a + b,
          0,
        )} enemies killed in total:`,
      );

      // Subsequent lines: Each enemy count
      Object.entries(enemyCounts).forEach(([enemy, count]) => {
        lines.push(`${enemy} x${count}`);
      });

      // Line after enemy counts: Restart instruction
      let restartButton = "Press space or click to restart";
      if (GameConstants.isMobile) restartButton = "Tap to restart";

      // Calculate total height based on number of lines
      const lineHeight = Game.letter_height + 2; // Adjust spacing as needed
      const totalHeight = lines.length * lineHeight + lineHeight; // Additional space for restart button

      // Starting Y position to center the text block
      let startY = GameConstants.HEIGHT / 2 - totalHeight / 2;

      // Draw each line centered horizontally
      lines.forEach((line, index) => {
        const textWidth = Game.measureText(line).width;
        const spacing =
          index === 0 || index === 1 || index === lines.length - 1
            ? lineHeight * 1.5
            : lineHeight;
        Game.fillText(line, GameConstants.WIDTH / 2 - textWidth / 2, startY);
        startY += spacing;
      });

      // Draw the restart button
      const restartTextWidth = Game.measureText(restartButton).width;
      Game.fillText(
        restartButton,
        GameConstants.WIDTH / 2 - restartTextWidth / 2,
        startY,
      );
    }
    PostProcessor.draw(delta);
    if (this.hurting) this.drawHurt(delta);

    if (this.mapToggled === true) this.map.draw(delta);
    //this.drawTileCursor(delta);
    this.setCursorIcon();

    //this.drawInventoryButton(delta);
    if (this.menu.open) this.menu.drawMenu();
    Game.ctx.restore();
  };

  drawHurt = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state
    Game.ctx.globalAlpha = this.hurtAlpha;
    this.hurtAlpha -= (this.hurtAlpha / 10) * delta;
    if (this.hurtAlpha <= 0.01) {
      this.hurtAlpha = 0;
      this.hurting = false;
      this.hurtingShield = false;
    }
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.fillStyle = "#cc3333"; // bright but not fully saturated red
    if (this.hurtingShield) {
      Game.ctx.fillStyle = "#639bff"; // bright but not fully saturated blue
    }

    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    Game.ctx.restore(); // Restore the canvas state
  };

  drawLowHealth = (delta: number) => {
    Game.ctx.save();
    //unused
    if (this.health <= 1 && !this.dead) {
      // Calculate pulsating alpha for the vignette effect
      const lowHealthAlpha = 0.5; //Math.sin(this.lowHealthFrame / 10) * 0.5 + 0.5;
      Game.ctx.globalAlpha = lowHealthAlpha;
      this.lowHealthFrame += delta;

      const gradientBottom = Game.ctx.createLinearGradient(
        0,
        GameConstants.HEIGHT,
        0,
        (GameConstants.HEIGHT * 2) / 3,
      );

      // Define gradient color stops
      [gradientBottom].forEach((gradient) => {
        gradient.addColorStop(0, "#cc3333"); // Solid red at edges
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent toward center
      });

      // Draw the gradients
      Game.ctx.globalCompositeOperation = "source-over";

      Game.ctx.fillStyle = gradientBottom;
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      // Reset composite operation and alpha
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.globalAlpha = 1.0;
    } else {
      this.lowHealthFrame = 0;
    }
    Game.ctx.restore();
  };

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX *= 0.85 ** delta;
      this.drawY *= 0.85 ** delta;
      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
    }
    if (this.doneHitting()) {
      this.jump(delta);
    }

    if (!this.doneHitting()) {
      this.updateHitXY(delta);
    }

    this.enableSlowMotion();
    GameConstants.ANIMATION_SPEED = this.motionSpeed;
  };

  updateHitXY = (delta: number) => {
    const hitX = this.hitX - this.hitX * 0.3;
    const hitY = this.hitY - this.hitY * 0.3;
    this.hitX = Math.min(Math.max(hitX, -1), 1);
    this.hitY = Math.min(Math.max(hitY, -1), 1);
    if (Math.abs(hitX) < 0.01) this.hitX = 0;
    if (Math.abs(hitY) < 0.01) this.hitY = 0;
  };

  hitShake = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number,
  ) => {
    const range = GameConstants.TILESIZE;
    this.hitX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
    this.hitY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);
  };

  shakeScreen = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number,
    shakeStrength: number = 10,
  ) => {
    const range = GameConstants.TILESIZE;
    this.hitX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
    this.hitY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);

    this.game.shakeScreen(
      -this.hitX * 1 * shakeStrength,
      -this.hitY * 1 * shakeStrength,
    );
  };

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.abs(Math.sin(j * Math.PI) * this.jumpHeight);
    if (Math.abs(this.jumpY) < 0.01) this.jumpY = 0;
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };

  /**
   * Draws the tile cursor to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawTileCursor = (delta: number) => {
    if (this.inventory.isOpen) return;
    Game.ctx.save(); // Save the current canvas state

    if (
      !this.mouseInLine() ||
      !this.isMouseAboveFloor() ||
      this.isMouseOnPlayerTile()
    )
      return;
    let tileX = 22; //inRange ? 22 : 24;
    let tileY = 3;

    const moveData = this.canMoveWithMouse();
    if (moveData && moveData.direction !== undefined) {
      switch (moveData.direction) {
        case Direction.UP:
          tileY = 3;
          break;
        case Direction.RIGHT:
          tileY = 4;
          break;
        case Direction.DOWN:
          tileY = 5;
          break;
        case Direction.LEFT:
          tileY = 6;
          break;
      }
    }

    Game.drawFX(
      tileX + Math.floor(HitWarning.frame),
      tileY,
      1,
      1,
      this.tileCursor.x,
      this.tileCursor.y,
      1,
      1,
    );

    Game.ctx.restore(); // Restore the canvas state
  };
}
