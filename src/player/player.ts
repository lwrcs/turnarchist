import { Input } from "../game/input";
import { GameConstants } from "../game/gameConstants";
import { Direction, Game, LevelState } from "../game";
import { Door } from "../tile/door";
import { Trapdoor } from "../tile/trapdoor";
import { Inventory } from "../inventory/inventory";
import { Sound } from "../sound/sound";
import { LevelConstants } from "../level/levelConstants";
import { Map } from "../gui/map";
import { HealthBar } from "../drawable/healthbar";
import { VendingMachine } from "../entity/object/vendingMachine";
import { Drawable } from "../drawable/drawable";
import { Entity } from "../entity/entity";
import { Item } from "../item/item";
import { DivingHelmet } from "../item/divingHelmet";
import { Backplate } from "../item/backplate";
import { Gauntlets } from "../item/gauntlets";
import { BlockSwipeAnimation } from "../particle/blockSwipeAnimation";
import { ShoulderPlates } from "../item/shoulderPlates";
import { ChestPlate } from "../item/chestPlate";

import { Enemy } from "../entity/enemy/enemy";
import { MouseCursor } from "../gui/mouseCursor";
import { LightSource } from "../lighting/lightSource";

import { Menu } from "../gui/menu";
import { Bestiary } from "../game/bestiary";
import { ContextMenu } from "../gui/contextMenu";
import { PlayerInputHandler } from "./playerInputHandler";
import { PlayerActionProcessor } from "./playerActionProcessor";
import { PlayerMovement } from "./playerMovement";
import { PlayerRenderer } from "./playerRenderer";
import { UpLadder } from "../tile/upLadder";
import { DownLadder } from "../tile/downLadder";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { GameplaySettings } from "../game/gameplaySettings";
import { Room } from "../room/room";
import { BubbleImageParticle } from "../particle/imageParticle";
import { Random } from "../utility/random";
import { AnchorOptions, OxygenLine } from "./oxygenLine";
import { SkillsMenu } from "../gui/skillsMenu";
import { XPCounter } from "../gui/xpCounter";

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
  globalId: string;
  id: string;
  x: number;
  y: number;
  /**
   * Vertical layer within the current room/level. Rendering will be handled later.
   */
  z: number;
  w: number;
  h: number;
  direction: Direction;
  lastDirection: Direction;
  private defenseFacing: Direction;
  game: Game;
  levelID: number; // which room we're in (legacy index; avoid using directly)
  roomGID?: string;
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
  lightFov: number;
  lightFalloffDecay: number;
  moveDistance: number;
  moveQueue: { x: number; y: number; direction: Direction }[];
  lastX: number;
  lastY: number;
  justMoved: DrawDirection;
  depth: number;
  menu: Menu;
  skillsMenu: SkillsMenu;
  busyAnimating: boolean;
  private pushMoveInputLockActive: boolean = false;
  private pushMoveInputLockEntities: Entity[] = [];
  lightColor: [number, number, number];
  damageBonus: number;
  magicDamageBonus: number;
  isDrowning: boolean;
  private drowningTurnsUntilDamage: number;
  private drowningIntervalIndex: number;
  private readonly drowningDamageSteps = [5, 4, 3, 2, 1];
  private readonly drowningDamageAmount = 0.5;
  private readonly divingHelmetRefillPerTurn = 12;
  private static readonly oxygenLineBaseOffset = 1.4;

  inputHandler: PlayerInputHandler;
  actionProcessor: PlayerActionProcessor;
  movement: PlayerMovement;

  cooldownRemaining: number;
  // Death screen pagination state
  deathScreenPageIndex: number;
  deathScreenPageCount: number;

  private renderer: PlayerRenderer;
  private oxygenLine: OxygenLine;

  private drawMoveQueue: {
    drawX: number;
    drawY: number;
    drawZ: number;
  }[] = [];

  private bubbleSpawnAccumulator = 0;
  private readonly bubbleSpawnInterval = 7;
  private bubbleBreathTimer = 0;
  private readonly bubbleBreathPeriod = 240;

  // Tracked by TutorialListener / Bestiary now; kept here previously but unused.
  // TODO: remove entirely once no callers depend on it.
  seenEnemies: Set<typeof Enemy> = new Set();
  bestiary: Bestiary = null;
  contextMenu: ContextMenu = new ContextMenu();
  /**
   * When the context menu opens, we snapshot the current mouse angle so the player
   * can keep rendering the same diagonal mouse-facing sprite while the menu is open.
   * Stored in radians (matches `PlayerInputHandler.mouseAngle()`).
   */
  frozenMouseAngleRad: number | null = null;
  constructor(
    game: Game,
    x: number,
    y: number,
    isLocalPlayer: boolean,
    z: number = 0,
  ) {
    super();
    this.globalId = IdGenerator.generate("P");

    this.game = game;

    this.levelID = 0;
    this.roomGID = undefined;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = 1;
    this.h = 1;
    this.moveDistance = 0;
    this.direction = Direction.UP;
    this.lastDirection = Direction.UP;
    this.defenseFacing = this.direction;

    this.lastX = 0;
    this.lastY = 0;
    this.isLocalPlayer = isLocalPlayer;
    this.depth = 0;
    this.menu = new Menu(this);
    this.skillsMenu = new SkillsMenu();
    this.busyAnimating = false;

    this.mapToggled = true;
    this.health = GameplaySettings.STARTING_HEALTH;
    this.maxHealth = GameplaySettings.STARTING_HEALTH;
    this.healthBar = new HealthBar();
    this.dead = false;
    this.lastTickHealth = this.health;
    this.damageBonus = 0;
    this.magicDamageBonus = 0;
    this.isDrowning = false;
    this.drowningTurnsUntilDamage = 0;
    this.drowningIntervalIndex = 0;
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
    this.lightFov = GameConstants.DEFAULT_LIGHTING_FOV_DEGREES;
    this.lightFalloffDecay = 1;

    this.hurtShield = false;
    this.lightBrightness = 0.3;

    this.moveQueue = [];
    this.justMoved = DrawDirection.Y;

    this.inputHandler = new PlayerInputHandler(this);
    this.actionProcessor = new PlayerActionProcessor(this);
    this.movement = new PlayerMovement(this);
    this.renderer = new PlayerRenderer(this);
    this.oxygenLine = new OxygenLine(this);

    this.bestiary = new Bestiary(this.game, this);

    this.cooldownRemaining = 0;
    this.deathScreenPageIndex = 0;
    this.deathScreenPageCount = 1;
    this.hasBloom = true;
  }

  getRoom = (): Room => {
    const byId = this.roomGID ? this.game.getRoomById(this.roomGID) : undefined;
    if (byId) return byId;

    const fromLevels = this.game.levels?.[this.depth]?.rooms?.[this.levelID];
    if (fromLevels) return fromLevels;

    // Early-init / transitional fallback: prefer the game's current active room if available.
    if (this.game.room) return this.game.room;

    // If this ever happens, something is fundamentally wrong with initialization.
    throw new Error("Player.getRoom(): no room available (levels not initialized)");
  };

  getEquippedDivingHelmet = (): DivingHelmet | null => {
    const helmet = this.inventory.items.find(
      (item): item is DivingHelmet =>
        item instanceof DivingHelmet && item.equipped,
    );

    return helmet ?? null;
  };

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
  get drawZ() {
    return this.renderer?.drawZ ?? 0;
  }

  getInterpolatedTilePosition = (): { x: number; y: number } => {
    return {
      x: this.x - this.drawX,
      y: this.y - this.drawY,
    };
  };

  getOxygenLine = (): OxygenLine => {
    return this.oxygenLine;
  };

  attachOxygenLine = (
    anchorRoom: Room,
    x: number,
    y: number,
    options?: AnchorOptions,
  ) => {
    this.oxygenLine.attach(anchorRoom, x, y, options);
  };

  detachOxygenLine = () => {
    this.oxygenLine.detach();
  };

  anchorOxygenLineToTile = (
    room: Room,
    x: number,
    y: number,
    options?: AnchorOptions,
  ) => {
    this.oxygenLine.attachStartToTile(room, x, y, options);
  };

  anchorOxygenLineToPlayer = (angle?: number) => {
    this.oxygenLine.attachStartToPlayer(angle);
  };

  recordOxygenDoorTraversal = (exitDoor: Door, entryDoor: Door) => {
    this.oxygenLine.recordDoorTraversal(exitDoor, entryDoor);
  };

  getJumpY = (): number => {
    return this.renderer?.getJumpOffset?.() ?? 0;
  };

  getOxygenBaseOffset = (): number => {
    return Player.oxygenLineBaseOffset;
  };

  getOxygenAttachmentOffset = (): number => {
    return this.getJumpY() + Player.oxygenLineBaseOffset;
  };

  setHitXY = (newX: number, newY: number, distance = 0.5) => {
    this.renderer.hitX = distance * (this.x - newX);
    this.renderer.hitY = distance * (this.y - newY);
  };

  applyStatus = (
    enemy: Entity,
    status: { poison: boolean; blood: boolean; curse: boolean },
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
      if (status.curse) {
        enemy.curse();
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

  /**
   * UI helper for ground-item interaction: can the player pick up something at (tileX,tileY)?
   * True if on the same tile or cardinal-adjacent (not diagonal).
   */
  canPickupAt = (tileX: number, tileY: number): boolean => {
    const dx = tileX - this.x;
    const dy = tileY - this.y;
    if (dx === 0 && dy === 0) return true;
    return Math.abs(dx) + Math.abs(dy) === 1;
  };

  /**
   * UI helper: can the player push the given pushable entity right now?
   *
   * Mirrors the push-chain scan in `tryMove()`:
   * - You must be cardinal-adjacent (attempting to move into the entity).
   * - The tile behind the push-chain must be empty of entities.
   * - The tile behind the chain must be walkable (not solid) and must NOT be a crush tile.
   *
   * (If the chain ends in a crush tile or a non-chain-pushable blocker, we treat it as not pushable,
   * so the context menu can fall back to "Hit" instead.)
   */
  canPushEntity = (target: Entity): boolean => {
    if (!target?.pushable) return false;

    // Only push when moving into the target (cardinal-adjacent).
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;

    const room = this.getRoom?.() ?? this.game.room;
    if (!room) return false;

    const z = this.z ?? 0;

    let nextX = target.x + dx;
    let nextY = target.y + dy;

    // Walk the push chain until we find the first empty tile, or hit a non-chain-pushable blocker.
    while (true) {
      if (!room.tileInside(nextX, nextY)) return false;

      const blocker = room.entities.find((e) => {
        if (!e) return false;
        if ((e.z ?? 0) !== z) return false;
        return e.pointIn(nextX, nextY);
      });

      if (!blocker) break;
      if (!blocker.chainPushable) return false;

      // Step past this blocker based on its footprint (matches tryMove logic).
      nextX += dx * (blocker.w ?? 1);
      nextY += dy * (blocker.h ?? 1);
    }

    // Require an empty, walkable tile behind the chain (no crush tiles).
    if (room.isSolidAt(nextX, nextY, z)) return false;
    const tile = room.roomArray[nextX]?.[nextY];
    if (tile?.canCrushEnemy?.()) return false;

    return true;
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
    // Skills menu is modal: while open, cursor state is determined ONLY by skills UI.
    if (this.skillsMenu?.open) {
      const { x, y } = mousePos;
      const inSkillsPanel = this.skillsMenu.isPointInBounds(x, y);
      return inSkillsPanel ? "hand" : "arrow";
    }

    // If the menu is open, it visually owns the cursor: don't let world interactions behind
    // the menu influence the cursor icon.
    if (this.menu?.open) {
      const { x, y } = mousePos;
      const inMenuButton = this.menu.isPointInMenuBounds(x, y).inBounds;
      const inCloseButton = this.menu.isPointInCloseButton(x, y);
      return inMenuButton || inCloseButton ? "hand" : "arrow";
    }

    // If the bestiary is open, prevent world interactions behind it from affecting the cursor.
    // Only show the UI pointer when hovering actual buttons; otherwise default arrow.
    if (this.bestiary?.isOpen) {
      const { x, y } = mousePos;
      const inBestiaryButton = this.bestiary.isPointInBestiaryButton(x, y);
      const inControls = this.bestiary.isPointInBestiaryControls(x, y);
      return inBestiaryButton || inControls ? "hand" : "arrow";
    }

    // If the inventory is open, prevent world interactions *behind the inventory UI* from
    // affecting the cursor. Only show the UI pointer when hovering an occupied slot
    // (or the inventory button); empty slots are the default arrow.
    if (this.inventory?.isOpen) {
      const { x, y } = mousePos;
      const inv = this.inventory;
      if (inv.isPointInInventoryButton(x, y)) return "hand";

      const inQuickbar = inv.isPointInQuickbarBounds(x, y).inBounds;
      if (inQuickbar) {
        const idx = inv.getQuickbarSlotIndexAtPoint(x, y);
        if (idx === null) return "arrow";
        return inv.items[idx] ? "hand" : "arrow";
      }

      const inInventoryPanel = inv.isPointInInventoryBounds(x, y).inBounds;
      if (inInventoryPanel) {
        const idx = inv.getInventorySlotIndexAtPoint(x, y);
        if (idx === null) return "arrow";
        return inv.items[idx] ? "hand" : "arrow";
      }
    }

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
      Menu.isPointInOpenMenuButtonBounds(x, y) ||
      XPCounter.isPointInBounds(x, y) ||
      (this.bestiary ? this.bestiary.isPointInBestiaryButton(x, y) : false) ||
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

  /**
   * UI helper: find the enemy entity currently "under" the attack cursor.
   * Mirrors cursor-attack logic by checking the current tile and the tile above
   * (to account for tall sprites).
   *
   * Does NOT apply range checks.
   */
  getEnemyUnderCursorForAttack = (): Entity | null => {
    const mouseTile = this.mouseToTile();
    const tileAbove = {
      x: mouseTile.x,
      y: this.mouseToTile(GameConstants.TILESIZE / 2).y,
    };

    const room = this.game.room;
    if (!room) return null;

    const z = this.z;
    const candidates = [mouseTile, tileAbove];
    for (const t of candidates) {
      const hit = room.entities.find(
        (e) => (e?.z ?? 0) === z && e.isEnemy && e.x === t.x && e.y === t.y,
      );
      if (hit) return hit;
    }
    return null;
  };

  /**
   * UI helper: find any entity under the cursor (for context-menu examine).
   * Checks the cursor tile and the tile above to account for tall sprites.
   */
  getEntityUnderCursorForExamine = (): Entity | null => {
    const mouseTile = this.mouseToTile();
    const tileAbove = {
      x: mouseTile.x,
      y: this.mouseToTile(GameConstants.TILESIZE / 2).y,
    };
    const room = this.game.room;
    if (!room) return null;
    const z = this.z;
    const candidates = [mouseTile, tileAbove];
    for (const t of candidates) {
      const hit = room.entities.find(
        (e) => (e?.z ?? 0) === z && e.pointIn(t.x, t.y),
      );
      if (hit) return hit;
    }
    return null;
  };

  restart = () => {
    this.dead = false;
    this.game.newGame();
    // Reset pagination on restart
    this.deathScreenPageIndex = 0;
    this.deathScreenPageCount = 1;
  };

  beginPushMoveInputLock = (entities: Entity[]): void => {
    // De-dupe while preserving order
    const uniq: Entity[] = [];
    for (const e of entities) {
      if (!e) continue;
      if (uniq.includes(e)) continue;
      uniq.push(e);
    }
    this.pushMoveInputLockEntities = uniq;
    this.pushMoveInputLockActive = uniq.length > 0;
  };

  isPushMoveInputLocked = (): boolean => {
    return this.pushMoveInputLockActive;
  };

  /** Called from the renderer each frame to release the lock once visuals have mostly settled. */
  updatePushMoveInputLock = (): void => {
    if (!this.pushMoveInputLockActive) return;
    const threshold = GameConstants.PUSH_VISUAL_INPUT_UNLOCK_PROGRESS;
    const entities = this.pushMoveInputLockEntities;
    const allSettled = entities.every((e) => e.dead || e.getPushAnimProgress01() >= threshold);
    if (allSettled) {
      this.pushMoveInputLockActive = false;
      this.pushMoveInputLockEntities = [];
    }
  };

  hit = (): number => {
    return 1;
  };

  tryCollide = (other: Entity, newX: number, newY: number) => {
    if (other.collidable === false) return false;
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
    this.getRoom().catchUp();
    //this.game.room.catchUp();
    if (!this.game.room) {
      console.warn("oi bruv, game.room isn't even there!");
      return;
    }
    if (this.dead) return;

    let collide = false;

    for (let e of this.getRoom().entities) {
      if (e.z !== this.z) continue;
      if (e.collidable === true) {
        if (e.x === x && e.y === y) {
          collide = true;
          break;
        }
      }
    }

    //for (let i = 0; i < 2; i++) //no idea why we would loop this...
    // if (collide === true) {
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
    //}
    for (let e of this.getRoom().entities) {
      if (e.z !== this.z) continue;
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
            for (const f of this.getRoom().entities) {
              if (f.z !== this.z) continue;
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
            (this.getRoom().roomArray[nextX][nextY].canCrushEnemy() || enemyEnd)
          ) {
            if (e.destroyable) {
              //fallback if no weapon equipped
              e.hurt(this, e.health, "none");
              if (this.getRoom() === this.game.room) Sound.hit();

              this.shakeScreen(this.x, this.y, e.x, e.y);
              this.hitShake(this.x, this.y, e.x, e.y);

              this.getRoom().tick(this);
              return;
            }
          } else {
            if (this.getRoom() === this.game.room) Sound.push();
            // here pushedEnemies may still be []

            const shouldCrushTail =
              this.getRoom().roomArray[nextX][nextY].canCrushEnemy() || enemyEnd;
            const tailToCrush =
              shouldCrushTail && pushedEnemies.length > 0
                ? pushedEnemies[pushedEnemies.length - 1]
                : null;

            for (const f of pushedEnemies) {
              f.lastX = f.x;
              f.lastY = f.y;
              // Don't animate the soon-to-be-crushed entity pushing onto the blocker first.
              if (f === tailToCrush) continue;
              f.x += dx;
              f.y += dy;
              f.drawX = dx;
              f.drawY = dy;
              f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
              f.markPushedMove();
            }
            if (tailToCrush) {
              tailToCrush.crush(dx, dy);
              if (tailToCrush.isEnemy) Sound.playSquish();
              if (this.getRoom() === this.game.room) Sound.hit();
            }

            e.x += dx;
            e.y += dy;
            e.drawX = dx;
            e.drawY = dy;
            // Ensure the pushed head object animates as "being pushed" just like the rest of the chain.
            e.skipNextTurns = 1;
            e.markPushedMove();
            // Gate movement inputs until the pushed objects have mostly reached their new tile visually.
            this.beginPushMoveInputLock([e, ...pushedEnemies]);
            // This move is a push; slow the player's movement easing to match the push feel.
            this.renderer?.markPushingMove?.();
            this.move(x, y);
            this.moveDistance++;
            this.getRoom().tick(this);
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
    let other = this.getRoom()?.roomArray?.[x]?.[y];
    if (!other) {
      console.warn("oi bruv, tile to check for collision isn't even there!");
      return;
    }
    if (!this.getRoom()) {
      console.warn("oi bruv, room to check for collision isn't even there!");
      return;
    }
    if (!this.getRoom().roomArray) {
      console.warn("oi bruv, level to check for collision isn't even there!");
      return;
    }
    if (!this.getRoom().isSolidAt(x, y, this.z)) {
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
      // Z-debug per-layer stairs (z-only triggers)
      this.getRoom().applyZDebugStep(this, x, y);
      if (
        !(
          other instanceof Door ||
          other instanceof Trapdoor ||
          other instanceof UpLadder ||
          other instanceof DownLadder
        )
      )
        this.getRoom().tick(this);
    } else {
      if (other instanceof Door) {
        // Doors are only accessible/interactable from the same z-layer.
        if ((other.z ?? 0) !== this.z) {
          this.shakeScreen(this.x, this.y, x, y);
          return;
        }
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

  snapshotDefenseFacing = () => {
    // Capture facing for resolving directional damage during the enemy turn.
    // This prevents mouse-driven direction changes during the computer turn from affecting blocking.
    this.defenseFacing = this.direction;
  };

  private getEquippedBackplate = (): Backplate | null => {
    return this.inventory.getBackplate();
  };

  private getEquippedGauntlets = (): Gauntlets | null => {
    return this.inventory.getGauntlets();
  };

  private getEquippedShoulderPlates = (): ShoulderPlates | null => {
    return this.inventory.getShoulderPlates();
  };

  private getEquippedChestPlate = (): ChestPlate | null => {
    return this.inventory.getChestPlate();
  };

  private isAttackFromBehind = (source: { x: number; y: number }): boolean => {
    const incoming = this.getIncomingAttackDirection(source);
    if (incoming === null) return false;

    // Backplate blocks "behind" cardinal hits only (never diagonals).
    switch (this.defenseFacing) {
      case Direction.UP:
        return incoming === Direction.DOWN;
      case Direction.DOWN:
        return incoming === Direction.UP;
      case Direction.LEFT:
        return incoming === Direction.RIGHT;
      case Direction.RIGHT:
        return incoming === Direction.LEFT;
      default:
        return false;
    }
  };

  private isAttackDiagonal = (source: { x: number; y: number }): boolean => {
    const incoming = this.getIncomingAttackDirection(source);
    if (incoming === null) return false;
    return (
      incoming === Direction.UP_LEFT ||
      incoming === Direction.UP_RIGHT ||
      incoming === Direction.DOWN_LEFT ||
      incoming === Direction.DOWN_RIGHT
    );
  };

  private isAttackFromSideNoDiagonal = (source: {
    x: number;
    y: number;
  }): boolean => {
    const incoming = this.getIncomingAttackDirection(source);
    if (incoming === null) return false;

    // Gauntlets block left/right relative to defenseFacing (cardinal only).
    switch (this.defenseFacing) {
      case Direction.UP:
      case Direction.DOWN:
        return incoming === Direction.LEFT || incoming === Direction.RIGHT;
      case Direction.LEFT:
      case Direction.RIGHT:
        return incoming === Direction.UP || incoming === Direction.DOWN;
      default:
        return false;
    }
  };

  private isAttackFromFrontNoDiagonal = (source: {
    x: number;
    y: number;
  }): boolean => {
    const incoming = this.getIncomingAttackDirection(source);
    if (incoming === null) return false;

    // Chestplate blocks "front" cardinal hits only (never diagonals).
    switch (this.defenseFacing) {
      case Direction.UP:
        return incoming === Direction.UP;
      case Direction.DOWN:
        return incoming === Direction.DOWN;
      case Direction.LEFT:
        return incoming === Direction.LEFT;
      case Direction.RIGHT:
        return incoming === Direction.RIGHT;
      default:
        return false;
    }
  };

  private getIncomingAttackDirection = (source: {
    x: number;
    y: number;
  }): Direction | null => {
    const dx = source.x - this.x;
    const dy = source.y - this.y;
    if (dx === 0 && dy === 0) return null;

    // 8-way quantization:
    // - Pure axis-aligned => cardinal.
    // - If both axes present, choose diagonal only when magnitudes tie; otherwise choose dominant axis.
    if (dx !== 0 && dy !== 0) {
      if (Math.abs(dx) === Math.abs(dy)) {
        if (dx > 0 && dy < 0) return Direction.UP_RIGHT;
        if (dx < 0 && dy < 0) return Direction.UP_LEFT;
        if (dx < 0 && dy > 0) return Direction.DOWN_LEFT;
        return Direction.DOWN_RIGHT;
      }
      // Dominant axis wins (cardinal), so armor that blocks "no diagonals" doesn't
      // accidentally treat shallow angles as diagonal hits.
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? Direction.RIGHT : Direction.LEFT;
      }
      return dy > 0 ? Direction.DOWN : Direction.UP;
    }
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? Direction.RIGHT : Direction.LEFT;
    }
    return dy > 0 ? Direction.DOWN : Direction.UP;
  };

  private clampPlayerIncomingDamage = (damage: number): number => {
    // We support 0.5 increments but must never produce 0.25 increments.
    // - Half mode: minimum 0.5 (so 0.5 stays 0.5)
    // - Flat mode: minimum 0 (so 0.5 can become 0)
    const snappedDownToHalf = Math.floor(damage * 2) / 2;
    const min = GameplaySettings.ARMOR_FLAT_REDUCTION ? 0 : 0.5;
    return Math.max(min, snappedDownToHalf);
  };

  private spawnDirectionalBlockFX = (source: { x: number; y: number }) => {
    const dir = this.getIncomingAttackDirection(source);
    if (dir === null) return;
    const room = this.getRoom();
    if (room !== this.game.room) return;
    // BlockSwipeAnimation handles the 1-tile offset internally based on direction.
    const fx = new BlockSwipeAnimation(this.x, this.y, dir, this.z ?? 0);
    fx.room = room;
    room.particles.push(fx);
  };

  hurt = (
    damage: number,
    enemy: string,
    ctx?: { delay?: number; source?: { x: number; y: number } },
  ) => {
    const delay = ctx?.delay ?? 0;
    const source = ctx?.source;
    //if (GameConstants.DEVELOPER_MODE) return;
    // Play hurt sound if in current room
    if (this.getRoom() === this.game.room) {
      setTimeout(() => {
        Sound.hurt();
        Sound.playGrunt();
        this.renderer.flash();
        this.renderer.hurt();
      }, delay);
    }

    // Backplate: block hits that come from behind.
    const backplate = this.getEquippedBackplate();
    if (backplate && source && this.isAttackFromBehind(source)) {
      this.spawnDirectionalBlockFX(source);
      if (this.getRoom() === this.game.room) {
        setTimeout(() => {
          this.renderer.hurtShield();
        }, delay);
      }
      if (!GameConstants.DEVELOPER_MODE) {
        this.game.pushMessage("Your backplate blocks the attack from behind.");
      }
      this.lastHitBy = enemy;
      return;
    }

    if (source) {
      // Shoulder plates: halve diagonal attacks.
      const shoulders = this.getEquippedShoulderPlates();
      if (shoulders && this.isAttackDiagonal(source)) {
        this.spawnDirectionalBlockFX(source);
        if (GameplaySettings.ARMOR_FLAT_REDUCTION) damage -= 0.5;
        else damage *= 0.5;
      } else {
        // Gauntlets: halve hits that come from the sides (axis-aligned only, no diagonal).
        const gauntlets = this.getEquippedGauntlets();
        if (gauntlets && this.isAttackFromSideNoDiagonal(source)) {
          this.spawnDirectionalBlockFX(source);
          if (GameplaySettings.ARMOR_FLAT_REDUCTION) damage -= 0.5;
          else damage *= 0.5;
        } else {
          // Chest plate: halve hits that come from the front (axis-aligned only).
          const chestPlate = this.getEquippedChestPlate();
          if (chestPlate && this.isAttackFromFrontNoDiagonal(source)) {
            this.spawnDirectionalBlockFX(source);
            if (GameplaySettings.ARMOR_FLAT_REDUCTION) damage -= 0.5;
            else damage *= 0.5;
          }
        }
      }
    }

    // Ensure damage is in 0.5 increments (never 0.25), regardless of reductions above.
    damage = this.clampPlayerIncomingDamage(damage);

    // Fully mitigated by directional armor.
    if (damage <= 0) {
      this.lastHitBy = enemy;
      return;
    }

    // Handle armor damage
    const armor = this.inventory.getArmor();
    let diff = 0;
    if (armor && armor.health > 0) {
      diff = armor.health - damage;
      armor.hurt(damage);
      this.renderer.hurtShield();
      this.hurtShield = true;
    }

    // Update player state
    this.lastHitBy = enemy;
    this.healthBar.hurt();
    this.enemyHurtMessage(damage, enemy);

    // Apply damage if no shield
    if (!this.hurtShield) {
      this.health -= damage;
      // Emit damage taken event for statistics tracking
      globalEventBus.emit(EVENTS.DAMAGE_TAKEN, { amount: damage });
    } else if (diff < 0) {
      this.health += diff;
      globalEventBus.emit(EVENTS.DAMAGE_TAKEN, { amount: -diff });
    }
    this.hurtShield = false;

    // Check for death
    if (this.health <= 0 && !GameConstants.DEVELOPER_MODE) {
      this.dead = true;
      // Reset death screen pagination when death occurs
      this.deathScreenPageIndex = 0;
      this.deathScreenPageCount = 1;
    }
  };

  enemyHurtMessage = (damage: number, enemy: string) => {
    if (!GameConstants.DEVELOPER_MODE)
      this.game.pushMessage(`The ${enemy} hits you for ${damage} damage.`);
  };

  beginSlowMotion = () => {
    this.renderer.beginSlowMotion();
  };

  endSlowMotion = () => {
    this.renderer.endSlowMotion();
  };
  
  toggleSlowMotion = () => {
    return this.renderer.toggleSlowMotion();
  };

  move = (x: number, y: number, z: number = this.z) => {
    this.updateLastPosition(this.x, this.y);

    //this.actionTab.setState(ActionState.MOVE);
    if (this.getRoom() === this.game.room)
      Sound.playerStoneFootstep(this.game.room.envType);

    if (this.openVendingMachine) this.openVendingMachine.close();

    this.renderer.setNewDrawXY(x, y, z);
    this.drawMoveQueue.push({
      drawX: x - this.x,
      drawY: y - this.y,
      drawZ: z - this.z,
    });

    /*
    if (this.drawX > 1) this.drawX = 1;
    if (this.drawY > 1) this.drawY = 1;
    if (this.drawX < -1) this.drawX = -1;
    if (this.drawY < -1) this.drawY = -1;
    */

    this.x = x;
    this.y = y;
    this.z = z;

    for (let i of this.getRoom().items) {
      if (i.z !== this.z) continue;
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
    this.oxygenLine.update();
    this.handleUnderwater();

    this.renderer.disableFlash();

    let totalHealthDiff = this.health - this.lastTickHealth;
    this.lastTickHealth = this.health; // update last tick health
    if (totalHealthDiff < 0) {
      this.renderer.flash();
    }

    // Emit turn passed event for statistics tracking
    globalEventBus.emit(EVENTS.TURN_PASSED, {});
    this.moveDistance = 0;

    //this.actionTab.actionState = ActionState.READY;
    //Sets the action tab state to Wait (during enemy turn)
  };

  private handleUnderwater = () => {
    const room = this.getRoom();
    if (!room) return;

    const helmet = this.getEquippedDivingHelmet();
    const underwater = room.underwater === true;
    const oxygenLineSupplying = helmet
      ? this.oxygenLine.isSupplyingAir()
      : false;

    if (!underwater) {
      if (helmet && helmet.currentAir < helmet.maxAir) {
        helmet.restoreAir(this.divingHelmetRefillPerTurn);
      }
      if (this.isDrowning) this.exitDrowningState();
      return;
    }

    if (oxygenLineSupplying) {
      helmet?.refillCompletely();
      if (this.isDrowning) this.exitDrowningState();
      return;
    }

    if (helmet && helmet.hasAir()) {
      helmet.consumeAir();
      if (this.isDrowning) this.exitDrowningState();
      return;
    }

    this.applyDrowningTick();
  };

  private applyDrowningTick = () => {
    this.enterDrowningState();
    this.drowningTurnsUntilDamage -= 1;

    if (this.drowningTurnsUntilDamage <= 0) {
      this.hurt(this.drowningDamageAmount, "drowning");
      this.advanceDrowningWindow();
    }
  };

  private enterDrowningState = () => {
    if (this.isDrowning) {
      if (this.drowningTurnsUntilDamage <= 0) {
        this.drowningTurnsUntilDamage =
          this.drowningDamageSteps[this.drowningIntervalIndex] ?? 1;
      }
      return;
    }
    this.isDrowning = true;
    this.drowningIntervalIndex = 0;
    this.drowningTurnsUntilDamage = this.drowningDamageSteps[0];
    this.game.pushMessage("You are drowning!");
  };

  private advanceDrowningWindow = () => {
    if (this.drowningIntervalIndex < this.drowningDamageSteps.length - 1) {
      this.drowningIntervalIndex += 1;
      this.drowningTurnsUntilDamage =
        this.drowningDamageSteps[this.drowningIntervalIndex];
    } else {
      this.drowningTurnsUntilDamage = 1;
    }
  };

  private exitDrowningState = () => {
    if (!this.isDrowning) return;
    this.isDrowning = false;
    this.drowningTurnsUntilDamage = 0;
    this.drowningIntervalIndex = 0;
    this.game.pushMessage("You catch your breath.");
  };

  getDrowningTurnsUntilDamage = (): number => {
    return this.drowningTurnsUntilDamage;
  };

  draw = (delta: number) => {
    this.renderer.draw(delta);
    this.emitPlayerBubbles(delta);
  };

  private emitPlayerBubbles = (delta: number) => {
    if (!this.isLocalPlayer) return;

    const room = this.getRoom();
    if (!room || room !== this.game.room || !room.underwater) return;

    this.bubbleBreathTimer += delta;
    while (this.bubbleBreathTimer > this.bubbleBreathPeriod) {
      this.bubbleBreathTimer -= this.bubbleBreathPeriod;
    }

    const breathPhase =
      (this.bubbleBreathTimer / this.bubbleBreathPeriod) * Math.PI * 2;
    const breathValue = Math.sin(breathPhase);

    if (breathValue <= 0) return;

    this.bubbleSpawnAccumulator += delta * breathValue;

    while (this.bubbleSpawnAccumulator >= this.bubbleSpawnInterval) {
      this.bubbleSpawnAccumulator -= this.bubbleSpawnInterval;

      const jitterX = Random.rand() * 0.1 - 0.15;
      const jitterY = Random.rand() * 0.1 - 0.05;
      const spawnX = this.x + 0.5 + jitterX;
      const spawnY = this.y - 0.5;

      const tileXoffset = Math.floor(Random.rand() * 3);

      room.particles.push(
        new BubbleImageParticle(room, spawnX, spawnY, {
          height: 0.02 + Random.rand() * 0.08,
          tileX: 9 + tileXoffset,
          tileY: 26,
        }),
      );
    }
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
