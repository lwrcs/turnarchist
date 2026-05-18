import { Input, InputEnum } from "../game/input";
import type { Player } from "./player";
import { Direction, LevelState } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import { MouseCursor } from "../gui/mouseCursor";
import { Entity } from "../entity/entity";
import { VendingMachine } from "../entity/object/vendingMachine";
import { GameConstants } from "../game/gameConstants";
import { MuteButton } from "../gui/muteButton";
import { Sound } from "../sound/sound";
import { Menu } from "../gui/menu";
import { Equippable } from "../item/equippable";
import { Usable } from "../item/usable/usable";
import { Weapon } from "../item/weapon/weapon";
import { XPCounter } from "../gui/xpCounter";
import { Wall } from "../tile/wall";
import { WallTorch } from "../tile/wallTorch";
import { Torch } from "../item/light/torch";
import { Candle } from "../item/light/candle";
import { PlacedTorch } from "../entity/object/placedTorch";
import { PlacedCandle } from "../entity/object/placedCandle";
import { Spellbook } from "../item/weapon/spellbook";

export class PlayerInputHandler {
  private player: Player;
  mostRecentInput: string;
  mostRecentMoveInput: string;
  moveStartTime: number;
  keyboardTarget: Entity | null = null;
  private mouseHoldInitialDirection: Direction | null = null;
  private pendingMoveDir: Direction | null = null;
  private pendingMoveTime: number = 0;
  private pendingMoveTimer: ReturnType<typeof setTimeout> | null = null;
  private mobileAimTileX: number | null = null;
  private mobileAimTileY: number | null = null;
  private bestiaryTouchMoveHandler: ((x: number, y: number) => void) | null =
    null;
  private bestiaryTouchEndHandler: ((x: number, y: number) => void) | null =
    null;
  private spellbookReaderTouchMoveHandler: ((x: number, y: number) => void) | null =
    null;
  private spellbookReaderTouchEndHandler: ((x: number, y: number) => void) | null =
    null;
  private bookLibraryTouchMoveHandler: ((x: number, y: number) => void) | null =
    null;
  private bookLibraryTouchEndHandler: ((x: number, y: number) => void) | null =
    null;
  private armoryBookTouchMoveHandler: ((x: number, y: number) => void) | null =
    null;
  private armoryBookTouchEndHandler: ((x: number, y: number) => void) | null =
    null;

  constructor(player: Player) {
    this.player = player;
    this.mostRecentInput = "keyboard";
    this.mostRecentMoveInput = "keyboard";
    this.moveStartTime = 0;

    if (player.isLocalPlayer) {
      this.setupListeners();
    }
  }

  setupListeners() {
    // Prevent duplicate handler registrations after save/load by resetting arrays
    // These arrays are only used for player input routing
    try {
      (Input.mouseRightClickListeners as any).length = 0;
      (Input.mouseLeftClickListeners as any).length = 0;
    } catch {}

    Input.leftSwipeListener = () => this.handleInput(InputEnum.LEFT);
    Input.rightSwipeListener = () => this.handleInput(InputEnum.RIGHT);
    Input.upSwipeListener = () => this.handleInput(InputEnum.UP);
    Input.downSwipeListener = () => this.handleInput(InputEnum.DOWN);
    Input.commaListener = () => this.handleInput(InputEnum.COMMA);
    Input.periodListener = () => this.handleInput(InputEnum.PERIOD);
    Input.enterListener = () => this.handleInput(InputEnum.ENTER);
    Input.tapListener = () => this.handleTap();
    Input.mouseMoveListener = () => this.handleInput(InputEnum.MOUSE_MOVE);
    Input.mouseRightClickListeners.push((x: number, y: number) =>
      this.handleMouseRightClickAt(x, y),
    );
    // Touch start is used only to classify "started in UI" for gesture decisions.
    // Actual actions still occur on touch end via `tapListener`, or on long-press via right click.
    Input.touchStartListeners.push((x: number, y: number) => {
      const inventory = this.player.inventory;
      const bestiary = this.player.bestiary;
      const spellbookReader = this.player.spellbookReader;
      const bookLibrary = this.player.bookLibrary;
      const armoryBook = this.player.armoryBook;
      const skillsMenu = this.player.skillsMenu;
      // If the bestiary is open, let it arm drag-follow when starting within the book bounds.
      if (bestiary && bestiary.handleTouchStart(x, y)) return true;
      if (spellbookReader && spellbookReader.handleTouchStart(x, y)) return true;
      if (bookLibrary && bookLibrary.handleTouchStart(x, y)) return true;
      if (armoryBook && armoryBook.handleTouchStart(x, y)) return true;
      return (
        inventory.isPointInInventoryButton(x, y) ||
        inventory.isPointInQuickbarBounds(x, y).inBounds ||
        (inventory.isOpen &&
          inventory.isPointInInventoryBounds(x, y).inBounds) ||
        Menu.isPointInOpenMenuButtonBounds(x, y) ||
        XPCounter.isPointInBounds(x, y) ||
        (skillsMenu ? skillsMenu.isPointInBounds(x, y) : false) ||
        (bookLibrary ? bookLibrary.isPointInLibraryButton(x, y) : false) ||
        (bestiary ? bestiary.isPointInBookBounds(x, y) : false) ||
        (spellbookReader ? spellbookReader.isPointInBookBounds(x, y) : false) ||
        (bookLibrary ? bookLibrary.isPointInBookBounds(x, y) : false) ||
        (armoryBook ? armoryBook.isPointInBookBounds(x, y) : false)
      );
    });

    // Bestiary drag-follow (mobile): track touch movement while the bestiary is open.
    // Use stable handler references so re-running setup can de-dupe correctly.
    if (this.bestiaryTouchMoveHandler) {
      Input.touchMoveListeners = Input.touchMoveListeners.filter(
        (fn) => fn !== this.bestiaryTouchMoveHandler,
      );
    }
    if (this.bestiaryTouchEndHandler) {
      Input.touchEndListeners = Input.touchEndListeners.filter(
        (fn) => fn !== this.bestiaryTouchEndHandler,
      );
    }
    this.bestiaryTouchMoveHandler = (x: number, y: number) => {
      const bestiary = this.player.bestiary;
      if (!bestiary?.isOpen) return;
      bestiary.handleTouchMove(x, y);
    };
    this.bestiaryTouchEndHandler = (x: number, y: number) => {
      const bestiary = this.player.bestiary;
      if (!bestiary?.isOpen) return;
      bestiary.handleTouchEnd(x, y);
    };
    Input.touchMoveListeners.push(this.bestiaryTouchMoveHandler);
    Input.touchEndListeners.push(this.bestiaryTouchEndHandler);

    // SpellbookReader drag-follow (mobile): mirror bestiary pattern.
    if (this.spellbookReaderTouchMoveHandler) {
      Input.touchMoveListeners = Input.touchMoveListeners.filter(
        (fn) => fn !== this.spellbookReaderTouchMoveHandler,
      );
    }
    if (this.spellbookReaderTouchEndHandler) {
      Input.touchEndListeners = Input.touchEndListeners.filter(
        (fn) => fn !== this.spellbookReaderTouchEndHandler,
      );
    }
    this.spellbookReaderTouchMoveHandler = (x: number, y: number) => {
      const reader = this.player.spellbookReader;
      if (!reader?.isOpen) return;
      reader.handleTouchMove(x, y);
    };
    this.spellbookReaderTouchEndHandler = (x: number, y: number) => {
      const reader = this.player.spellbookReader;
      if (!reader?.isOpen) return;
      reader.handleTouchEnd(x, y);
    };
    Input.touchMoveListeners.push(this.spellbookReaderTouchMoveHandler);
    Input.touchEndListeners.push(this.spellbookReaderTouchEndHandler);

    // BookLibrary drag-follow (mobile).
    if (this.bookLibraryTouchMoveHandler) {
      Input.touchMoveListeners = Input.touchMoveListeners.filter(
        (fn) => fn !== this.bookLibraryTouchMoveHandler,
      );
    }
    if (this.bookLibraryTouchEndHandler) {
      Input.touchEndListeners = Input.touchEndListeners.filter(
        (fn) => fn !== this.bookLibraryTouchEndHandler,
      );
    }
    this.bookLibraryTouchMoveHandler = (x: number, y: number) => {
      const lib = this.player.bookLibrary;
      if (!lib?.isOpen) return;
      lib.handleTouchMove(x, y);
    };
    this.bookLibraryTouchEndHandler = (x: number, y: number) => {
      const lib = this.player.bookLibrary;
      if (!lib?.isOpen) return;
      lib.handleTouchEnd(x, y);
    };
    Input.touchMoveListeners.push(this.bookLibraryTouchMoveHandler);
    Input.touchEndListeners.push(this.bookLibraryTouchEndHandler);

    // ArmoryBook drag-follow (mobile).
    if (this.armoryBookTouchMoveHandler) {
      Input.touchMoveListeners = Input.touchMoveListeners.filter(
        (fn) => fn !== this.armoryBookTouchMoveHandler,
      );
    }
    if (this.armoryBookTouchEndHandler) {
      Input.touchEndListeners = Input.touchEndListeners.filter(
        (fn) => fn !== this.armoryBookTouchEndHandler,
      );
    }
    this.armoryBookTouchMoveHandler = (x: number, y: number) => {
      const armory = this.player.armoryBook;
      if (!armory?.isOpen) return;
      armory.handleTouchMove(x, y);
    };
    this.armoryBookTouchEndHandler = (x: number, y: number) => {
      const armory = this.player.armoryBook;
      if (!armory?.isOpen) return;
      armory.handleTouchEnd(x, y);
    };
    Input.touchMoveListeners.push(this.armoryBookTouchMoveHandler);
    Input.touchEndListeners.push(this.armoryBookTouchEndHandler);

    Input.mouseDownListeners.push((x: number, y: number, button: number) =>
      this.handleMouseDown(x, y, button),
    );
    Input.numKeyListener = (num) =>
      this.handleInput(InputEnum.NUMBER_1 + num - 1);
    Input.equalsListener = () => this.handleInput(InputEnum.EQUALS);
    Input.minusListener = () => this.handleInput(InputEnum.MINUS);
    Input.escapeListener = () => this.handleInput(InputEnum.ESCAPE);
    Input.fListener = () => this.handleInput(InputEnum.F);
    Input.wheelListener = (deltaY: number) => this.handleMouseWheel(deltaY);
  }

  handleInput(input: InputEnum) {
    // If a camera animation is active, allow inputs that should fast-forward it
    if (this.player.game.cameraAnimation.active) {
      switch (input) {
        case InputEnum.SPACE:
        case InputEnum.LEFT_CLICK:
          this.player.game.cameraAnimation.fast = true;
          return;
        default:
          // Block other inputs while animation is active (until fast-forward completes)
          return;
      }
    }
    if (this.player.busyAnimating) return;

    // Block input during level transitions, except for mouse movement
    if (
      (this.player.game.levelState === LevelState.TRANSITIONING ||
        this.player.game.levelState === LevelState.TRANSITIONING_LADDER) &&
      input !== InputEnum.MOUSE_MOVE
    ) {
      return;
    }

    // Bestiary takes over input while open.
    if (this.player.bestiary?.isOpen) {
      switch (input) {
        case InputEnum.ESCAPE:
          this.player.bestiary.handleInput("escape");
          return;
        case InputEnum.LEFT:
          this.player.bestiary.handleInput("left");
          return;
        case InputEnum.RIGHT:
          this.player.bestiary.handleInput("right");
          return;
        case InputEnum.RIGHT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.handleMouseRightClickAt(x, y);
          return;
        }
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.player.bestiary.handleMouseDown(x, y);
          return;
        }
        default:
          return;
      }
    }

    // SpellbookReader takes over input while open.
    if (this.player.spellbookReader?.isOpen) {
      switch (input) {
        case InputEnum.ESCAPE:
          this.player.spellbookReader.handleInput("escape");
          return;
        case InputEnum.LEFT:
          this.player.spellbookReader.handleInput("left");
          return;
        case InputEnum.RIGHT:
          this.player.spellbookReader.handleInput("right");
          return;
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.player.spellbookReader.handleMouseDown(x, y);
          return;
        }
        default:
          return;
      }
    }

    // BookLibrary takes over input while open.
    if (this.player.bookLibrary?.isOpen) {
      switch (input) {
        case InputEnum.ESCAPE:
          this.player.bookLibrary.handleInput("escape");
          return;
        case InputEnum.LEFT:
          this.player.bookLibrary.handleInput("left");
          return;
        case InputEnum.RIGHT:
          this.player.bookLibrary.handleInput("right");
          return;
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.player.bookLibrary.handleMouseDown(x, y);
          return;
        }
        default:
          return;
      }
    }

    // ArmoryBook takes over input while open.
    if (this.player.armoryBook?.isOpen) {
      switch (input) {
        case InputEnum.ESCAPE:
          this.player.armoryBook.handleInput("escape");
          return;
        case InputEnum.LEFT:
          this.player.armoryBook.handleInput("left");
          return;
        case InputEnum.RIGHT:
          this.player.armoryBook.handleInput("right");
          return;
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.player.armoryBook.handleMouseDown(x, y);
          return;
        }
        default:
          return;
      }
    }

    // Ranged targeting is modal while active.
    if (this.player.rangedTargeting?.active) {
      const rt = this.player.rangedTargeting;
      const invOpen = this.player.inventory?.isOpen;
      switch (input) {
        case InputEnum.UP:
          if (!GameConstants.isMobile) rt.moveTarget(0, -1);
          return;
        case InputEnum.DOWN:
          if (!GameConstants.isMobile) rt.moveTarget(0, 1);
          return;
        case InputEnum.LEFT:
          if (!GameConstants.isMobile) rt.moveTarget(-1, 0);
          return;
        case InputEnum.RIGHT:
          if (!GameConstants.isMobile) rt.moveTarget(1, 0);
          return;
        case InputEnum.SPACE:
        case InputEnum.ENTER:
          // Don't fire or close inventory when inventory is open — swallow silently.
          if (!invOpen) rt.fire();
          return;
        case InputEnum.ESCAPE:
          rt.stop();
          this.mobileAimTileX = null;
          this.mobileAimTileY = null;
          return;
        case InputEnum.MOUSE_MOVE:
          rt.syncToMouse();
          return;
        case InputEnum.LEFT_CLICK:
          // If inventory is open let the click fall through to close it normally.
          if (!invOpen) { rt.fire(); return; }
          break;
        default:
          return;
      }
    }

    // Context menu is modal while open.
    if (this.player.contextMenu?.open) {
      const cm = this.player.contextMenu;
      switch (input) {
        case InputEnum.ESCAPE:
          this.clearKeyboardTarget();
          return;
        case InputEnum.UP:
          cm.navigate(-1);
          return;
        case InputEnum.DOWN:
          cm.navigate(1);
          return;
        case InputEnum.ENTER:
        case InputEnum.SPACE:
          cm.executeKeyboardSelected();
          return;
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          cm.handleMouseDown(x, y, 0);
          return;
        }
        case InputEnum.RIGHT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          cm.handleMouseDown(x, y, 2);
          return;
        }
        default:
          return;
      }
    }

    // Skills menu is modal while open.
    if (this.player.skillsMenu?.open) {
      switch (input) {
        case InputEnum.ESCAPE:
          this.player.skillsMenu.close();
          return;
        case InputEnum.LEFT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.player.skillsMenu.handleClick(x, y);
          return;
        }
        case InputEnum.RIGHT_CLICK: {
          const { x, y } = MouseCursor.getInstance().getPosition();
          this.handleMouseRightClickAt(x, y);
          return;
        }
        case InputEnum.MOUSE_MOVE:
          // Do not update facing/tile cursor/world hover while skills UI is open.
          this.setMostRecentInput("mouse");
          return;
        default:
          return;
      }
    }

    if (this.player.settingsMenu?.open) {
      if (input === InputEnum.RIGHT_CLICK) {
        const { x, y } = MouseCursor.getInstance().getPosition();
        this.handleMouseRightClickAt(x, y);
        return;
      }
      this.player.settingsMenu.inputHandler(input);
      return;
    }

    if (this.player.menu.open) {
      // Allow context menu on right-click even while the menu is open (options are overlay-scoped).
      if (input === InputEnum.RIGHT_CLICK) {
        const { x, y } = MouseCursor.getInstance().getPosition();
        this.handleMouseRightClickAt(x, y);
        return;
      }
      this.player.menu.inputHandler(input);
      return;
    }

    if (!this.player.game.started && input !== InputEnum.MOUSE_MOVE) {
      // If start screen menu is active, do not auto-start; let the menu handle clicks
      if ((this.player.game as any).startMenuActive) {
        return;
      }
      this.player.game.startedFadeOut = true;
      return;
    }

    switch (input) {
      case InputEnum.I: {
        const inv = this.player.inventory;
        this.player.actionProcessor.process({
          type: inv.isOpen ? "CloseInventory" : "OpenInventory",
        });
        break;
      }
      case InputEnum.Q:
        this.player.actionProcessor.process({ type: "InventoryDrop" });
        break;
      case InputEnum.F:
        //this.player.game.newGame();
        //this.player.stall();
        break;
      case InputEnum.LEFT:
        if (this.player.dead) {
          this.navigateDeathScreen(-1);
          break;
        }
        this.handleDirectionKey(Direction.LEFT);
        break;

      case InputEnum.RIGHT:
        if (this.player.dead) {
          this.navigateDeathScreen(1);
          break;
        }
        this.handleDirectionKey(Direction.RIGHT);
        break;

      case InputEnum.UP:
        if (this.player.dead) {
          this.navigateDeathScreen(-1);
          break;
        }
        this.handleDirectionKey(Direction.UP);
        break;

      case InputEnum.DOWN:
        if (this.player.dead) {
          this.navigateDeathScreen(1);
          break;
        }
        this.handleDirectionKey(Direction.DOWN);
        break;
      case InputEnum.SPACE:
        // If camera animation is running, speed it up
        if (this.player.game.cameraAnimation.active) {
          this.player.game.cameraAnimation.fast = true;
          break;
        }
        const player = this.player;
        this.setMostRecentInput("keyboard");

        if (player.game.chatOpen) return;

        if (player.dead) {
          player.restart();
          return;
        }

        if (
          this.player.openVendingMachine &&
          this.player.openVendingMachine.open
        ) {
          this.player.openVendingMachine.space();
          break;
        }

        if (
          player.inventory.isOpen ||
          player.game.levelState === LevelState.IN_LEVEL
        ) {
          if (player.menu?.open || player.skillsMenu?.open || player.isAnyBookOpen) break;

          this.validateKeyboardTarget();
          if (this.keyboardTarget) {
            this.openKeyboardContextMenuForEntity(this.keyboardTarget);
          }
        }
        break;
      case InputEnum.COMMA:
        this.setMostRecentInput("keyboard");
        if (GameplaySettings.KEYBOARD_TARGETING_ENABLED) {
          this.validateKeyboardTarget();
          if (!this.keyboardTarget) {
            // First press: pick nearest enemy
            const nearest = this.getSortedEnemies();
            this.keyboardTarget = nearest[0] ?? null;
          } else {
            // Cycle left (decreasing x) in position-sorted list
            const list = this.getEnemiesByPosition();
            if (list.length === 0) break;
            const idx = list.indexOf(this.keyboardTarget);
            this.keyboardTarget = list[(idx <= 0 ? list.length : idx) - 1];
          }
        }
        break;
      case InputEnum.PERIOD:
        this.setMostRecentInput("keyboard");
        if (GameplaySettings.KEYBOARD_TARGETING_ENABLED) {
          this.validateKeyboardTarget();
          if (!this.keyboardTarget) {
            // First press: pick nearest enemy
            const nearest = this.getSortedEnemies();
            this.keyboardTarget = nearest[0] ?? null;
          } else {
            // Cycle right (increasing x) in position-sorted list
            const list = this.getEnemiesByPosition();
            if (list.length === 0) break;
            const idx = list.indexOf(this.keyboardTarget);
            this.keyboardTarget = list[(idx + 1) % list.length];
          }
        }
        break;
      case InputEnum.LEFT_CLICK:
        // Speed up camera animation on click
        if (this.player.game.cameraAnimation.active) {
          this.player.game.cameraAnimation.fast = true;
          break;
        }
        this.handleMouseLeftClick();
        break;
      case InputEnum.RIGHT_CLICK:
        this.handleMouseRightClickAt(
          MouseCursor.getInstance().getPosition().x,
          MouseCursor.getInstance().getPosition().y,
        );
        break;
      case InputEnum.MOUSE_MOVE:
        //when mouse moves
        this.setMostRecentInput("mouse");
        this.player.inventory.mouseMove();

        // Keep the context menu truly modal: don't update facing or tile cursor while it's open.
        if (this.player.contextMenu?.open) break;

        // Check if mouse hold should be cancelled
        if (Input.mouseDown && Input.mouseDownHandled) {
          let shouldCancelHold = false;

          // Check distance from initial position
          const dx = Input.mouseX - Input.lastMouseDownX;
          const dy = Input.mouseY - Input.lastMouseDownY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxHoldDistance = GameConstants.TILESIZE * 1.5; // 1.5 tiles

          if (distance > maxHoldDistance) {
            shouldCancelHold = true;
          }

          // Check if player direction changed from initial
          if (
            this.mouseHoldInitialDirection !== null &&
            this.player.direction !== this.mouseHoldInitialDirection
          ) {
            shouldCancelHold = true;
          }

          if (shouldCancelHold) {
            Input.mouseDownHandled = false;
            Input.lastMouseDownTime = 0;
            this.mouseHoldInitialDirection = null;
          }
        }

        if (!this.ignoreDirectionInput() || GameConstants.isMobile) {
          this.faceMouse();
          this.player.setTileCursorPosition();
        }
        break;
      case InputEnum.NUMBER_1:
      case InputEnum.NUMBER_2:
      case InputEnum.NUMBER_3:
      case InputEnum.NUMBER_4:
      case InputEnum.NUMBER_5:
      case InputEnum.NUMBER_6:
      case InputEnum.NUMBER_7:
      case InputEnum.NUMBER_8:
      case InputEnum.NUMBER_9:
      case InputEnum.NUMBER_0:
        this.setMostRecentInput("keyboard");
        this.handleNumKey(input - 13);
        break;
      case InputEnum.EQUALS:
        this.player.game.increaseScale();
        break;
      case InputEnum.MINUS:
        this.player.game.decreaseScale();
        break;
      case InputEnum.ESCAPE:
        if (this.keyboardTarget || this.player.contextMenu?.open) {
          this.clearKeyboardTarget();
          break;
        }
        if (this.player.skillsMenu?.open) {
          this.player.skillsMenu.close();
        } else {
          this.player.inventory.close();
        }
        break;
    }
  }

  private handleMouseWheel(deltaY: number) {
    // Only handle while in-game
    if (this.player.game.levelState !== LevelState.IN_LEVEL) return;
    if (this.player.settingsMenu?.open) {
      this.player.settingsMenu.handleWheel(deltaY);
      return;
    }
    if (this.player.skillsMenu?.open) return;

    // Scroll direction: positive deltaY -> scroll down (next slot), negative -> previous
    const step = deltaY > 0 ? 1 : -1;

    // Wrap-around across quickbar slots (flat indices 0..quickbarCols-1).
    const inv = this.player.inventory;
    const qCols = inv.quickbarCols;
    const flatIdx = inv.selX + inv.selY * inv.cols;
    let nextFlat = (flatIdx + step + qCols) % qCols;
    inv.selX = nextFlat % inv.cols;
    inv.selY = Math.floor(nextFlat / inv.cols);

    // Treat wheel as keyboard-like input so selection highlights while inventory is open
    this.setMostRecentInput("keyboard");
    inv.mostRecentInput = "keyboard";
  }

  handleNumKey = (num: number) => {
    if (this.player.menu.open || this.player.settingsMenu?.open) return;
    this.setMostRecentInput("keyboard");
    this.player.actionProcessor.process({
      type: "InventorySelect",
      index: num - 1,
    });
  };

  private getSortedEnemies(): Entity[] {
    const px = this.player.x;
    const py = this.player.y;
    const room = this.player.getRoom?.() ?? this.player.game.room;
    if (!room) return [];
    return room.entities
      .filter((e) => e.isEnemy && !e.dead)
      .sort((a, b) => {
        const da = (a.x - px) ** 2 + (a.y - py) ** 2;
        const db = (b.x - px) ** 2 + (b.y - py) ** 2;
        return da - db;
      });
  }

  private getEnemiesByPosition(): Entity[] {
    const room = this.player.getRoom?.() ?? this.player.game.room;
    if (!room) return [];
    return room.entities
      .filter((e) => e.isEnemy && !e.dead)
      .sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
  }

  private validateKeyboardTarget() {
    const t = this.keyboardTarget;
    if (!t) return;
    const room = this.player.getRoom?.() ?? this.player.game.room;
    if (t.dead || !room?.entities.includes(t)) {
      this.keyboardTarget = null;
    }
  }

  clearKeyboardTarget = () => {
    this.keyboardTarget = null;
    this.mobileAimTileX = null;
    this.mobileAimTileY = null;
    this.player.contextMenu?.close();
    this.player.rangedTargeting?.stop();
  };

  private openKeyboardContextMenuForEntity(entity: Entity) {
    const px = Math.round(
      (entity.x - this.player.x) * GameConstants.TILESIZE + GameConstants.WIDTH / 2,
    );
    const py = Math.round(
      (entity.y - this.player.y) * GameConstants.TILESIZE + GameConstants.HEIGHT / 2,
    );
    this.handleMouseRightClickAt(px, py, entity);
  }

  private handleMouseRightClickAt(x: number, y: number, targetEntity?: Entity) {
    if (!targetEntity) this.setMostRecentInput("mouse");
    const player = this.player;
    const menu = player.contextMenu;
    if (!menu) return;

    // If the context menu is already open, route right-click to it (modal behavior).
    if (menu.open) {
      menu.handleMouseDown(x, y, 2);
      return;
    }

    // Cancel any active ranged targeting (crossbow, spellbook) when opening the context menu.
    (player as any).rangedTargeting?.stop();

    if (!targetEntity) {
      // If an overlay UI is open, do not populate context menu from the background/world.
      // For now:
      // - Menu / Skills / Bestiary => Cancel only
      // - Inventory => allow inventory-specific right click only when over inventory UI; otherwise Cancel only
      if (
        player.menu?.open ||
        player.settingsMenu?.open ||
        player.skillsMenu?.open ||
        player.isAnyBookOpen
      ) {
        menu.openAt(x, y, [{ label: "Cancel", onClick: () => {} }]);
        return;
      }

      if (player.inventory?.isOpen) {
        const inv = player.inventory;
        const inInvButton = inv.isPointInInventoryButton(x, y);
        const inQuickbar = inv.isPointInQuickbarBounds(x, y).inBounds;
        const inInventoryPanel = inv.isPointInInventoryBounds(x, y).inBounds;
        if (!inInvButton && !inQuickbar && !inInventoryPanel) {
          menu.openAt(x, y, [{ label: "Cancel", onClick: () => {} }]);
          return;
        }
      }
    }

    // Freeze current mouse angle so the player keeps the same diagonal pose while the menu is open.
    if (targetEntity) {
      player.frozenMouseAngleRad = Math.atan2(
        targetEntity.y - player.y,
        targetEntity.x - player.x,
      );
    } else {
      player.frozenMouseAngleRad = this.mouseAngle();
    }

    const items: Array<import("../gui/contextMenu").ContextMenuItem> = [];

    const formatExamine = (text: string): string => {
      // Keep examine as a single chat line.
      return text.replace(/\s+/g, " ").trim();
    };

    const getTargetName = (obj: unknown): string => {
      if (!obj || typeof obj !== "object") return "";
      const anyObj: Record<string, unknown> = obj as Record<string, unknown>;

      // Prefer `.name` if present (items/entities/tiles commonly have it).
      if (typeof anyObj.name === "string") {
        const s = anyObj.name.trim();
        if (s.length > 0) return s;
      }

      // Tiles often expose a name via getName().
      const maybeGetName = anyObj.getName;
      if (typeof maybeGetName === "function") {
        const n = maybeGetName.call(obj);
        if (typeof n === "string") {
          const s = n.trim();
          if (s.length > 0) return s;
        }
      }

      const ctorName = (obj as { constructor?: { name?: unknown } }).constructor
        ?.name;
      if (typeof ctorName === "string") {
        // Strip common suffixes to keep it clean.
        return ctorName.replace(/(Enemy|Tile|Item)$/, "");
      }
      return "";
    };

    // UI buttons (menus)
    if (player.bookLibrary && player.bookLibrary.isPointInLibraryButton(x, y)) {
      items.push({
        label: player.bookLibrary.isOpen ? "Close Library" : "Open Library",
        onClick: () => player.bookLibrary?.toggleOpen(),
      });
      items.push({ label: "Cancel", onClick: () => {} });
      menu.openAt(x, y, items);
      return;
    }
    if (player.inventory.isPointInInventoryButton(x, y)) {
      items.push({
        label: player.inventory.isOpen ? "Close Inventory" : "Open Inventory",
        onClick: () => player.inventory.toggleOpen(),
      });
      items.push({ label: "Cancel", onClick: () => {} });
      menu.openAt(x, y, items);
      return;
    }
    if (Menu.isPointInOpenMenuButtonBounds(x, y)) {
      items.push({
        label: player.settingsMenu.open ? "Close Menu" : "Open Menu",
        onClick: () => player.settingsMenu.toggleOpen(),
      });
      items.push({ label: "Cancel", onClick: () => {} });
      menu.openAt(x, y, items);
      return;
    }

    // Inventory / quickbar items
    const inv = player.inventory;
    const idx = inv.isOpen
      ? inv.getInventorySlotIndexAtPoint(x, y)
      : inv.getQuickbarSlotIndexAtPoint(x, y);

    if (idx !== null && idx >= 0 && idx < inv.items.length) {
      const item = inv.items[idx];
      if (item) {
        const targetName = getTargetName(item);
        const primaryLabel = (() => {
          if (item instanceof Spellbook && GameplaySettings.SPELLBOOK_TARGETING_ENABLED) {
            return "Use";
          }
          if (item instanceof Equippable) {
            return item.equipped ? "Unequip" : "Equip";
          }
          if (item instanceof Usable) {
            if (item.canUseOnOther) return "Use on";
            // Heuristic: potions are "Drink", other usables are "Eat" (foods).
            const name = (item.name ?? "").toLowerCase();
            if (name.includes("potion")) return "Drink";
            return "Eat";
          }
          return "Use";
        })();

        // Primary option always matches the default click/use behavior.
        items.push({
          label: primaryLabel,
          targetName,
          onClick: () => {
            // Select the slot first, then reuse the existing inventory action logic.
            inv.selX = idx % inv.cols;
            inv.selY = Math.floor(idx / inv.cols);
            inv.itemUse();
          },
        });

        const examine = formatExamine(item.examineText?.() ?? "");

        // Spellbook: Configure and Cast submenus
        if (item instanceof Spellbook && GameplaySettings.SPELLBOOK_TARGETING_ENABLED) {
          items.push({
            label: "Configure",
            submenu: item.spells.map((spell) => {
              const isActive = item.activeSpell === spell;
              return {
                label: spell.name,
                enabled: !isActive,
                targetName: isActive ? "(active)" : undefined,
                onClick: () => { item.activeSpell = spell; },
              };
            }),
            onClick: () => {},
          });
          items.push({
            label: "Cast",
            submenu: item.spells.map((spell) => ({
              label: spell.name,
              onClick: () => {
                item.pendingSpell = spell;
                (player as any).rangedTargeting?.start(item);
              },
            })),
            onClick: () => {},
          });
          items.push({
            label: "Read",
            targetName,
            onClick: () => {
              if (player.spellbookReader) {
                player.spellbookReader.setBackCallback(null);
                player.spellbookReader.openForPlayer(player);
              }
            },
          });
        }

        // Torch / candle: "Place" and "Place on wall"
        if (item instanceof Torch || item instanceof Candle) {
          const itemRoom = player.getRoom
            ? player.getRoom()
            : player.game.room;

          const playerTileFree = !itemRoom?.entities.some(
            (e) => !e.dead && e.x === player.x && e.y === player.y,
          );
          if (playerTileFree) items.push({
            label: "Place",
            targetName,
            onClick: () => {
              if (!itemRoom) return;
              const fuel = (item as Torch).fuel;
              let placed: PlacedTorch | PlacedCandle;
              if (item instanceof Torch) {
                placed = new PlacedTorch(itemRoom, player.game, player.x, player.y, fuel);
              } else {
                placed = new PlacedCandle(itemRoom, player.game, player.x, player.y, fuel);
              }
              placed.applyFloorPlacement();
              itemRoom.entities.push(placed);
              itemRoom.updateLighting();
              if (item.stackCount > 1) {
                item.stackCount--;
              } else {
                if (item.equipped) item.toggleEquip();
                inv.removeItem(item);
              }
            },
          });
          const adjacent: Array<{ x: number; y: number; dir: Direction }> = [
            { x: player.x - 1, y: player.y, dir: Direction.LEFT },
            { x: player.x + 1, y: player.y, dir: Direction.RIGHT },
            { x: player.x, y: player.y - 1, dir: Direction.UP },
            { x: player.x, y: player.y + 1, dir: Direction.DOWN },
          ];
          const freeWalls = adjacent.filter(({ x, y }) => {
            if (!itemRoom) return false;
            const tile = itemRoom.getTile(x, y);
            if (!(tile instanceof Wall || tile instanceof WallTorch))
              return false;
            return !itemRoom.entities.some(
              (e) => !e.dead && e.x === x && e.y === y,
            );
          });

          if (freeWalls.length > 0) {
            items.push({
              label: "Place on wall",
              targetName,
              onClick: () => {
                if (!itemRoom) return;
                const preferred = freeWalls.find(
                  (w) => w.dir === player.direction,
                );
                const target =
                  preferred ??
                  freeWalls[Math.floor(Math.random() * freeWalls.length)];
                const fuel = (item as Torch).fuel;
                let placed: PlacedTorch | PlacedCandle;
                if (item instanceof Torch) {
                  placed = new PlacedTorch(
                    itemRoom,
                    player.game,
                    target.x,
                    target.y,
                    fuel,
                  );
                } else {
                  placed = new PlacedCandle(
                    itemRoom,
                    player.game,
                    target.x,
                    target.y,
                    fuel,
                  );
                }
                placed.applyWallDirection(target.dir);
                itemRoom.entities.push(placed);
                itemRoom.updateLighting();
                if (item.stackCount > 1) {
                  item.stackCount--;
                } else {
                  if (item.equipped) item.toggleEquip();
                  inv.removeItem(item);
                }
              },
            });
          }
        }

        // Drop goes near the bottom. "Examine" is always right before "Cancel".
        items.push({
          label: "Drop",
          targetName,
          onClick: () => {
            inv.dropItem(item, idx);
          },
        });

        if (examine.length > 0) {
          items.push({
            label: "Examine",
            targetName,
            onClick: () => {
              player.game.pushMessage(examine);
            },
          });
        }
      }

      // Always include cancel as the final option.
      items.push({ label: "Cancel", onClick: () => {} });
      menu.openAt(x, y, items);
      return;
    }

    // --- World tile interactions (entity + ground items) ---
    const room = player.getRoom ? player.getRoom() : player.game.room;
    const t = player.mouseToTile();

    // Entities in the level (enemies + props/resources/etc).
    // Use the general cursor hit-test so non-enemy entities can be examined too.
    const entity = targetEntity ?? player.getEntityUnderCursorForExamine();
    if (entity) {
      const targetName = getTargetName(entity);

      // Enemies: Attack + Examine
      if (entity.isEnemy) {
        const weapon = player.inventory.weapon as Weapon | null;
        const canAttack = (() => {
          if (!weapon) return false;
          return weapon.isTargetInRange(entity.x, entity.y);
        })();

        items.push({
          label: "Attack",
          targetName,
          enabled: canAttack,
          onDisabledClick: () => {
            if (!weapon) {
              player.game.pushMessage("No weapon equipped.");
              return;
            }
            player.game.pushMessage("Enemy out of range.");
          },
          onClick: () => {
            if (!weapon) return;
            const input = weapon.getAttackInputTileForTarget(
              entity.x,
              entity.y,
            );
            if (!input) {
              player.game.pushMessage("Enemy out of range.");
              return;
            }
            // Face the enemy; turning is free, but some weapon logic depends on direction.
            const dx = entity.x - player.x;
            const dy = entity.y - player.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              player.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
            } else if (dy !== 0) {
              player.direction = dy > 0 ? Direction.DOWN : Direction.UP;
            }
            weapon.weaponMove(input.x, input.y);
          },
        });

        const typeName = entity.constructor?.name;
        if (typeName && player.bestiary) {
          const hasBestiaryEntry = player.bestiary.entries.some(
            (e) => e.typeName === typeName,
          );
          if (hasBestiaryEntry) {
            items.push({
              label: "View in Bestiary",
              onClick: () => {
                player.bestiary.openToEnemy(typeName);
              },
            });
          }
        }
      } else {
        // Non-enemy entities: choose a primary action.
        // Push can take precedence over Hit when the push-chain is actually possible.
        const wantsPush = Boolean(entity.pushable);
        const canPush = wantsPush && player.canPushEntity(entity);

        const primary = (() => {
          if (wantsPush) return canPush ? "Push" : "Hit";
          if (entity.interactable) return "Interact";
          if (entity.destroyable) return "Hit";
          return null;
        })();

        if (primary === "Push") {
          items.push({
            label: "Push",
            targetName,
            onClick: () => {
              // Reuse the existing push logic in `Player.tryMove()`.
              player.tryMove(entity.x, entity.y);
            },
          });
        } else if (primary === "Interact") {
          const inReach = player.canPickupAt(entity.x, entity.y);
          items.push({
            label: "Interact",
            targetName,
            enabled: inReach,
            onDisabledClick: () => {
              player.game.pushMessage("You can't reach that.");
            },
            onClick: () => {
              entity.interact?.(player);
            },
          });
        } else if (primary === "Hit") {
          // Special case: pushable-but-blocked "Hit" should behave like walking into it.
          // In `Player.tryMove()`, blocked pushables are handled by the push logic branch
          // (and may be destroyed even without a normal attack).
          const isBlockedPushableHit = wantsPush && !canPush;
          const inReach = player.canPickupAt(entity.x, entity.y);

          const weapon = player.inventory.weapon as Weapon | null;
          const canHit = isBlockedPushableHit
            ? inReach
            : (() => {
                if (!weapon) return false;
                return weapon.isTargetInRange(entity.x, entity.y);
              })();

          items.push({
            label: "Hit",
            targetName,
            enabled: canHit,
            onDisabledClick: () => {
              if (isBlockedPushableHit) {
                player.game.pushMessage("You can't reach that.");
                return;
              }
              if (!weapon) {
                player.game.pushMessage("No weapon equipped.");
                return;
              }
              player.game.pushMessage("Target out of range.");
            },
            onClick: () => {
              if (isBlockedPushableHit) {
                if (!inReach) return;
                // Reuse the existing "blocked pushable" behavior path.
                player.tryMove(entity.x, entity.y);
                return;
              }

              if (!weapon) return;
              const input = weapon.getAttackInputTileForTarget(
                entity.x,
                entity.y,
              );
              if (!input) {
                player.game.pushMessage("Target out of range.");
                return;
              }
              // Face the target for consistent weapon animation/logic.
              const dx = entity.x - player.x;
              const dy = entity.y - player.y;
              if (Math.abs(dx) > Math.abs(dy)) {
                player.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
              } else if (dy !== 0) {
                player.direction = dy > 0 ? Direction.DOWN : Direction.UP;
              }
              weapon.weaponMove(input.x, input.y);
            },
          });
        }
      }

      // Examine (optional) for any entity type
      const ex = formatExamine(entity.examineText?.() ?? "");
      if (ex.length > 0) {
        items.push({
          label: "Examine",
          targetName,
          onClick: () => {
            player.game.pushMessage(ex);
          },
        });
      }
    }

    // Ground items on the hovered tile: only "Pick up" + "Examine" (no usage options).
    const groundItems =
      room && t.x !== undefined && t.y !== undefined
        ? room.items.filter(
            (it) => !it.pickedUp && it.x === t.x && it.y === t.y,
          )
        : [];

    for (const it of groundItems) {
      const targetName = getTargetName(it);
      const inReach = player.canPickupAt(it.x, it.y);
      const hasSpace = inv.canPickup(it);
      const canPickup = inReach && hasSpace;

      items.push({
        label: "Pick up",
        targetName,
        enabled: canPickup,
        onDisabledClick: () => {
          if (!inReach) {
            player.game.pushMessage("You can't reach that.");
            return;
          }
          player.game.pushMessage("You can't carry any more.");
        },
        onClick: () => {
          it.onPickup(player);
        },
      });

      const examine = formatExamine(it.examineText?.() ?? "");
      if (examine.length > 0) {
        items.push({
          label: "Examine",
          targetName,
          onClick: () => {
            player.game.pushMessage(examine);
          },
        });
      }
    }

    // Tiles (e.g. doors/ladders). Only offer tile-examine if nothing else was found.
    if (items.length === 0 && room && t.x !== undefined && t.y !== undefined) {
      const tile = room.getTile(t.x, t.y);
      if (tile && typeof tile.examineText === "function") {
        const ex = formatExamine(String(tile.examineText() ?? ""));
        if (ex.length > 0) {
          const targetName = getTargetName(tile);
          items.push({
            label: "Examine",
            targetName,
            onClick: () => {
              player.game.pushMessage(ex);
            },
          });
        }
      }
    }

    // Wall placement: right-clicking a wall adjacent to the player while holding
    // a torch or candle offers to place it on the player's floor tile.
    if (room && t.x !== undefined && t.y !== undefined) {
      const tile = room.getTile(t.x, t.y);
      const isWall = tile instanceof Wall || tile instanceof WallTorch;
      if (isWall && player.canPickupAt(t.x, t.y)) {
        const tileHasEntity = room.entities.some(
          (e) => !e.dead && e.x === t.x && e.y === t.y,
        );
        if (!tileHasEntity) {
          const torchIdx = inv.items.findIndex((it) => it instanceof Torch);
          const candleIdx = inv.items.findIndex((it) => it instanceof Candle);

          if (torchIdx !== -1) {
            items.push({
              label: "Place torch",
              onClick: () => {
                const torch = inv.items[torchIdx] as Torch;
                const placed = new PlacedTorch(
                  room,
                  player.game,
                  t.x,
                  t.y,
                  torch.fuel,
                );
                const dx = t.x - player.x;
                const dy = t.y - player.y;
                placed.applyWallDirection(
                  dx < 0 ? Direction.LEFT
                  : dx > 0 ? Direction.RIGHT
                  : dy < 0 ? Direction.UP
                  : Direction.DOWN,
                );
                room.entities.push(placed);
                room.updateLighting();
                if (torch.stackCount > 1) {
                  torch.stackCount--;
                } else {
                  if (torch.equipped) torch.toggleEquip();
                  inv.removeItem(torch);
                }
              },
            });
          }

          if (candleIdx !== -1) {
            items.push({
              label: "Place candle",
              onClick: () => {
                const candle = inv.items[candleIdx] as Candle;
                const placed = new PlacedCandle(
                  room,
                  player.game,
                  t.x,
                  t.y,
                  candle.fuel,
                );
                const dx = t.x - player.x;
                const dy = t.y - player.y;
                placed.applyWallDirection(
                  dx < 0 ? Direction.LEFT
                  : dx > 0 ? Direction.RIGHT
                  : dy < 0 ? Direction.UP
                  : Direction.DOWN,
                );
                room.entities.push(placed);
                room.updateLighting();
                if (candle.stackCount > 1) {
                  candle.stackCount--;
                } else {
                  if (candle.equipped) candle.toggleEquip();
                  inv.removeItem(candle);
                }
              },
            });
          }
        }
      }
    }

    // Floor placement: right-clicking a floor tile on or orthogonal to the player
    if (room && t.x !== undefined && t.y !== undefined) {
      const dist = Math.abs(t.x - player.x) + Math.abs(t.y - player.y);
      const tile = room.getTile(t.x, t.y);
      const isFloor = tile && !tile.isSolid();
      if (isFloor && dist <= 1) {
        const tileHasEntity = room.entities.some(
          (e) => !e.dead && e.x === t.x && e.y === t.y,
        );
        if (!tileHasEntity) {
          const torchIdx = inv.items.findIndex((it) => it instanceof Torch);
          const candleIdx = inv.items.findIndex((it) => it instanceof Candle);

          if (torchIdx !== -1) {
            items.push({
              label: "Place torch",
              onClick: () => {
                const torch = inv.items[torchIdx] as Torch;
                const placed = new PlacedTorch(room, player.game, t.x, t.y, torch.fuel);
                placed.applyFloorPlacement();
                room.entities.push(placed);
                room.updateLighting();
                if (torch.stackCount > 1) {
                  torch.stackCount--;
                } else {
                  if (torch.equipped) torch.toggleEquip();
                  inv.removeItem(torch);
                }
              },
            });
          }

          if (candleIdx !== -1) {
            items.push({
              label: "Place candle",
              onClick: () => {
                const candle = inv.items[candleIdx] as Candle;
                const placed = new PlacedCandle(room, player.game, t.x, t.y, candle.fuel);
                placed.applyFloorPlacement();
                room.entities.push(placed);
                room.updateLighting();
                if (candle.stackCount > 1) {
                  candle.stackCount--;
                } else {
                  if (candle.equipped) candle.toggleEquip();
                  inv.removeItem(candle);
                }
              },
            });
          }
        }
      }
    }

    items.push({ label: "Cancel", onClick: () => {
      if (targetEntity) this.clearKeyboardTarget();
    }});
    menu.openAt(x, y, items, !!targetEntity);
  }

  isMouseOverUI = (): boolean => {
    const { x, y } = MouseCursor.getInstance().getPosition();
    const player = this.player;
    const inv = player.inventory;
    if (!inv) return false;
    return (
      inv.isPointInQuickbarBounds(x, y).inBounds ||
      inv.isPointInInventoryButton(x, y) ||
      (player.bookLibrary?.isPointInLibraryButton(x, y) ?? false) ||
      Menu.isPointInOpenMenuButtonBounds(x, y) ||
      (player.menu?.open ?? false) ||
      (player.skillsMenu?.isPointInBounds(x, y) ?? false) ||
      XPCounter.isPointInBounds(x, y)
    );
  };

  handleMouseDown(x: number, y: number, button: number) {
    if (button !== 0) return; // Only handle left mouse button

    const player = this.player;
    const skillsMenu = player.skillsMenu;

    // Ranged targeting: left click fires, but only when the inventory is closed and not hovering UI.
    // If the inventory is open, let the click fall through so it closes normally.
    // On mobile, defer entirely to handleTap so tap-to-aim then tap-to-fire works correctly.
    if (player.rangedTargeting?.active && !player.inventory?.isOpen && !this.isMouseOverUI()) {
      if (GameConstants.isMobile) {
        // Don't set mouseDownHandled — let handleTap own the tap action.
        console.log("[SpellMouseDown] mobile targeting active — deferring to handleTap");
        return;
      }
      player.rangedTargeting.fire();
      Input.mouseDownHandled = true;
      return;
    }
    console.log("[SpellMouseDown] targeting:", !!player.rangedTargeting?.active, "invOpen:", !!player.inventory?.isOpen, "overUI:", this.isMouseOverUI(), "isMobile:", GameConstants.isMobile);

    // Context menu consumes clicks while open (click outside closes).
    if (player.contextMenu?.open) {
      player.contextMenu.handleMouseDown(x, y, 0);
      Input.mouseDownHandled = true;
      return;
    }

    // Speed up camera animation on any mouse down
    if (player.game.cameraAnimation.active) {
      player.game.cameraAnimation.fast = true;
      Input.mouseDownHandled = true;
      return;
    }

    // On mobile, treat bottom-left hotspot as chat open/focus before any gameplay handling
    if (
      GameConstants.MOBILE_KEYBOARD_SUPPORT &&
      player.game.isMobile &&
      !player.game.chatOpen
    ) {
      // Block opening chat while the death screen is active
      if (player.dead) return;
      if (player.game.isPointInChatHotspot(x, y)) {
        player.game.chatOpen = true;
        player.game.chatTextBox.focus();
        Input.mouseDownHandled = true;
        return;
      }
    } else if (
      GameConstants.MOBILE_KEYBOARD_SUPPORT &&
      player.game.isMobile &&
      player.game.chatOpen
    ) {
      // If chat is open, tapping anywhere closes chat (unless tapping hotspot again)
      if (!player.game.isPointInChatHotspot(x, y)) {
        player.game.chatOpen = false;
        player.game.chatTextBox.blur?.();
        Input.mouseDownHandled = true;
        return;
      }
    }

    if (player.game.levelState !== LevelState.IN_LEVEL) {
      // Route clicks to start menu if active
      if (
        !(player.game as any).started &&
        (player.game as any).startMenuActive
      ) {
        (player.game as any).startMenu?.mouseInputHandler(x, y);
        Input.mouseDownHandled = true;
        return;
      }
      Input.mouseDownHandled = false;
      return;
    }

    this.setMostRecentInput("mouse");

    // If full-screen map is open, any click closes it and consumes input
    if (player.map?.mapOpen) {
      player.map.toggleMapOpen();
      Input.mouseDownHandled = true;
      return;
    }

    if (player.dead) {
      this.handleDeathScreenInput(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    if (player.bestiary?.isOpen) {
      player.bestiary.handleMouseDown(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    if (player.spellbookReader?.isOpen) {
      player.spellbookReader.handleMouseDown(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    if (player.bookLibrary?.isOpen) {
      player.bookLibrary.handleMouseDown(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    if (player.armoryBook?.isOpen) {
      player.armoryBook.handleMouseDown(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    if (skillsMenu?.open) {
      skillsMenu.handleClick(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    // Handle game not started
    if (!player.game.started) {
      if ((player.game as any).startMenuActive) {
        (player.game as any).startMenu?.mouseInputHandler(x, y);
      } else {
        player.game.startedFadeOut = true;
      }
      Input.mouseDownHandled = true;
      return;
    }

    // Store mouse down info for repeat
    Input.lastMouseDownTime = Date.now();
    Input.lastMouseDownX = x;
    Input.lastMouseDownY = y;

    const inventory = player.inventory;
    const bestiary = player.bestiary;

    // Handle settings/menu first: clicks should not affect inventory open/close state.
    if (this.player.settingsMenu?.open) {
      this.player.settingsMenu.inputHandler(InputEnum.LEFT_CLICK);
      Input.mouseDownHandled = true;
      return;
    }
    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(x, y);
      Input.mouseDownHandled = true;
      return;
    }

    // Library button toggle should not affect inventory open/close state.
    if (player.bookLibrary && player.bookLibrary.isPointInLibraryButton(x, y)) {
      player.bookLibrary.toggleOpen();
      Input.mouseDownHandled = true;
      return;
    }

    // Skills button toggle should not affect inventory open/close state.
    if (XPCounter.isPointInBounds(x, y)) {
      skillsMenu?.toggleOpen();
      Input.mouseDownHandled = true;
      return;
    }

    // Handle inventory toggle when clicking outside or on inventory button
    const clickedOutsideInventory =
      (inventory.isOpen &&
        !inventory.isPointInInventoryBounds(x, y).inBounds) ||
      inventory.isPointInInventoryButton(x, y);

    if (clickedOutsideInventory) {
      inventory.toggleOpen();
      Input.mouseDownHandled = true;
      return;
    }

    // Check if click is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      this.handleMenuButtonClick();
      Input.mouseDownHandled = true;
      return;
    }

    // Check if click is on minimap region to open full map
    if (player.map && player.map.isPointInMinimapBounds(x, y)) {
      player.map.toggleMapOpen();
      Input.mouseDownHandled = true;
      return;
    }

    // Handle vending machine
    if (player.openVendingMachine) {
      if (
        VendingMachine.isPointInVendingMachineBounds(
          x,
          y,
          player.openVendingMachine,
        )
      ) {
        player.openVendingMachine.space();
      } else {
        player.openVendingMachine.close();
      }
      Input.mouseDownHandled = true;
      return;
    }

    // Check if this is a UI interaction
    const isUIInteraction =
      (player.bookLibrary ? player.bookLibrary.isPointInLibraryButton(x, y) : false) ||
      inventory.isPointInInventoryButton(x, y) ||
      inventory.isPointInQuickbarBounds(x, y).inBounds ||
      inventory.isOpen ||
      this.isPointInMenuButtonBounds(x, y) ||
      XPCounter.isPointInBounds(x, y) ||
      (skillsMenu ? skillsMenu.isPointInBounds(x, y) : false);

    if (!isUIInteraction) {
      // Handle movement
      if (!player.busyAnimating && !player.game.cameraAnimation.active) {
        // Store the initial direction when starting mouse hold for movement
        this.mouseHoldInitialDirection = this.player.direction;
        player.moveWithMouse();
        Input.mouseDownHandled = true;
      } else {
        Input.mouseDownHandled = false;
      }
    } else {
      Input.mouseDownHandled = false;
    }
  }

  handleMouseLeftClick() {
    const player = this.player;
    const cursor = MouseCursor.getInstance();
    const { x, y } = cursor.getPosition();

    if (player.game.levelState !== LevelState.IN_LEVEL) {
      if (
        !(player.game as any).started &&
        (player.game as any).startMenuActive
      ) {
        (player.game as any).startMenu?.mouseInputHandler(x, y);
      }
      return;
    }

    this.setMostRecentInput("mouse");

    if (player.dead) {
      this.handleDeathScreenInput(x, y);
      return;
    }

    if (player.contextMenu?.open) {
      player.contextMenu.handleMouseDown(x, y, 0);
      return;
    }

    if (player.bestiary?.isOpen) {
      player.bestiary.handleMouseDown(x, y);
      return;
    }

    if (player.spellbookReader?.isOpen) {
      player.spellbookReader.handleMouseDown(x, y);
      return;
    }

    // Skills menu is modal-ish while open.
    if (player.skillsMenu?.open) {
      player.skillsMenu.handleClick(x, y);
      return;
    }

    const inventory = player.inventory;
    const bestiary = player.bestiary;

    // If the settings/menu is open, it consumes clicks and should not affect inventory open/close state.
    if (this.player.settingsMenu?.open) return;
    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(x, y);
      return;
    }

    // Skills button toggle should not affect inventory open/close state.
    if (XPCounter.isPointInBounds(x, y)) {
      player.skillsMenu?.toggleOpen();
      return;
    }

    // Library button toggle should not affect inventory open/close state.
    if (player.bookLibrary && player.bookLibrary.isPointInLibraryButton(x, y)) {
      player.bookLibrary.toggleOpen();
      return;
    }

    const clickedOutsideInventory =
      (inventory.isOpen &&
        !inventory.isPointInInventoryBounds(x, y).inBounds) ||
      inventory.isPointInInventoryButton(x, y);

    if (clickedOutsideInventory) {
      inventory.toggleOpen();
    }

    // Check if click is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      this.handleMenuButtonClick();
      return;
    }

    if (player.openVendingMachine) {
      if (
        VendingMachine.isPointInVendingMachineBounds(
          x,
          y,
          player.openVendingMachine,
        )
      ) {
        player.openVendingMachine.space();
      } else {
        player.openVendingMachine.close();
        this.setMostRecentInput("mouse");
        const { x, y } = MouseCursor.getInstance().getPosition();
        const bounds = this.player.inventory.isPointInInventoryBounds(x, y);
      }
      return;
    }

    const notInInventoryUI =
      !inventory.isPointInInventoryButton(x, y) &&
      !inventory.isPointInQuickbarBounds(x, y).inBounds &&
      !inventory.isOpen &&
      !(player.bookLibrary ? player.bookLibrary.isPointInLibraryButton(x, y) : false);

    // Only handle movement if it wasn't already handled on mousedown
    if (notInInventoryUI && !Input.mouseDownHandled) {
      if (player.isPushMoveInputLocked()) return;
      player.moveWithMouse();
    }
  }

  ignoreDirectionInput = (): boolean => {
    return (
      this.player.inventory.isOpen ||
      this.player.dead ||
      this.player.game.levelState !== LevelState.IN_LEVEL ||
      this.player.menu.open ||
      this.player.settingsMenu?.open ||
      (this.player.inventory.isPointInQuickbarBounds(Input.mouseX, Input.mouseY)
        .inBounds &&
        this.player.game.isMobile)
    );
  };

  handleTap() {
    // If the interaction was already handled by mouseDown, don't process it again
    if (Input.mouseDownHandled) {
      if (GameConstants.DEVELOPER_MODE) {
        console.log("[Tap] blocked by mouseDownHandled", {
          x: Input.mouseX,
          y: Input.mouseY,
        });
      }
      return;
    }

    // Speed up camera animation on tap
    if (this.player.game.cameraAnimation.active) {
      this.player.game.cameraAnimation.fast = true;
      return;
    }

    if (this.player.dead) {
      this.handleDeathScreenInput(Input.mouseX, Input.mouseY);
      return;
    } else if (!this.player.game.started) {
      if ((this.player.game as any).startMenuActive) {
        (this.player.game as any).startMenu?.mouseInputHandler(
          Input.mouseX,
          Input.mouseY,
        );
      } else {
        this.player.game.startedFadeOut = true;
      }
      return;
    }

    if (this.player.settingsMenu?.open) {
      this.player.settingsMenu.inputHandler(InputEnum.LEFT_CLICK);
      return;
    }
    if (this.player.menu.open) {
      this.player.menu.mouseInputHandler(Input.mouseX, Input.mouseY);
      return;
    }

    if (this.player.skillsMenu?.open) {
      this.player.skillsMenu.handleClick(Input.mouseX, Input.mouseY);
      return;
    }

    const x = Input.mouseX;
    const y = Input.mouseY;
    const bestiary = this.player.bestiary;
    const ctxMenu = this.player.contextMenu;

    if (GameConstants.DEVELOPER_MODE) {
      console.log("[Tap] handleTap", {
        x,
        y,
        inMenuButton: this.isPointInMenuButtonBounds(x, y),
        inLibraryButton: this.player.bookLibrary
          ? this.player.bookLibrary.isPointInLibraryButton(x, y)
          : false,
        inInventoryButton: this.player.inventory.isPointInInventoryButton(x, y),
        inventoryOpen: this.player.inventory.isOpen,
        menuOpen: this.player.settingsMenu?.open || this.player.menu.open,
        ctxMenuOpen: Boolean(ctxMenu?.open),
      });
    }

    if (ctxMenu?.open) {
      ctxMenu.handleMouseDown(x, y, 0);
      return;
    }

    if (bestiary?.isOpen) {
      bestiary.handleMouseDown(x, y);
      return;
    }

    if (this.player.spellbookReader?.isOpen) {
      this.player.spellbookReader.handleMouseDown(x, y);
      return;
    }

    if (this.player.bookLibrary?.isOpen) {
      this.player.bookLibrary.handleMouseDown(x, y);
      return;
    }

    if (this.player.armoryBook?.isOpen) {
      this.player.armoryBook.handleMouseDown(x, y);
      return;
    }

    if (this.player.bookLibrary && this.player.bookLibrary.isPointInLibraryButton(x, y)) {
      this.player.bookLibrary.toggleOpen();
      return;
    }

    if (XPCounter.isPointInBounds(x, y)) {
      this.player.skillsMenu?.toggleOpen();
      return;
    }

    // Check if tap is on menu button
    if (this.isPointInMenuButtonBounds(x, y)) {
      if (GameConstants.DEVELOPER_MODE)
        console.log("[Tap] menu button -> toggle");
      this.handleMenuButtonClick();
      return;
    }

    const isInInventory = this.player.inventory.isPointInInventoryBounds(
      x,
      y,
    ).inBounds;
    const isInQuickbar = this.player.inventory.isPointInQuickbarBounds(
      x,
      y,
    ).inBounds;

    if (this.player.openVendingMachine && this.player.openVendingMachine.open) {
      const isInVMUI = VendingMachine.isPointInVendingMachineBounds(
        Input.mouseX,
        Input.mouseY,
        this.player.openVendingMachine,
      );
      if (isInVMUI) {
        this.player.openVendingMachine.space();
        return;
      } else if (!isInVMUI) {
        this.player.openVendingMachine.close();
        this.setMostRecentInput("mouse");
        const { x, y } = MouseCursor.getInstance().getPosition();
        const bounds = this.player.inventory.isPointInInventoryBounds(x, y);
      }
      return;
    }

    let uiHandled = false;

    if (
      !this.player.inventory.isOpen &&
      this.player.inventory.isPointInInventoryButton(x, y)
    ) {
      this.player.inventory.open();
      uiHandled = true;
    } else if (this.player.inventory.isOpen) {
      uiHandled = true;
      if (isInInventory) {
        this.handleInput(InputEnum.LEFT_CLICK);
      } else {
        this.player.inventory.close();
      }
    } else if (isInQuickbar) {
      uiHandled = true;
      // On mobile, inventory.touchEnd already calls itemUse() for quickbar items.
      // Don't also dispatch LEFT_CLICK — when targeting just activated that would instantly fire.
      if (!this.player.game.isMobile) {
        this.handleInput(InputEnum.LEFT_CLICK);
      }
    }

    // World tap while targeting active.
    console.log("[SpellTap] uiHandled:", uiHandled, "targeting active:", !!this.player.rangedTargeting?.active, "isMobile:", this.player.game.isMobile, "mouseDownHandled was:", Input.mouseDownHandled);
    if (!uiHandled && this.player.rangedTargeting?.active) {
      const rt = this.player.rangedTargeting;
      if (this.player.game.isMobile) {
        rt.syncToMouse();
        const newX = rt.targetX;
        const newY = rt.targetY;
        const sameTile = newX === this.mobileAimTileX && newY === this.mobileAimTileY;
        console.log("[SpellTap] mobile targeting: lastAimTile:", this.mobileAimTileX, this.mobileAimTileY, "-> newTile:", newX, newY, "sameTile:", sameTile);
        if (sameTile && this.mobileAimTileX !== null) {
          this.mobileAimTileX = null;
          this.mobileAimTileY = null;
          rt.fire();
        } else {
          this.mobileAimTileX = newX;
          this.mobileAimTileY = newY;
        }
      } else {
        rt.syncToMouse();
        rt.fire();
      }
    }
  }

  placeLight() {
    const player = this.player;
    const inv = player.inventory;
    const room = player.getRoom ? player.getRoom() : player.game.rooms[player.levelID];
    if (!room) return;

    const dir = player.direction;
    // Tile the player is facing.
    const dx = dir === Direction.LEFT ? -1 : dir === Direction.RIGHT ? 1 : 0;
    const dy = dir === Direction.UP   ? -1 : dir === Direction.DOWN  ? 1 : 0;
    const facedTile = room.roomArray[player.x + dx]?.[player.y + dy];
    const isFacedWall = facedTile instanceof Wall || facedTile instanceof WallTorch;

    let placedX: number;
    let placedY: number;
    let wallDir: Direction | null = null;

    if (isFacedWall) {
      // Place on the wall tile the player is facing.
      placedX = player.x + dx;
      placedY = player.y + dy;
      wallDir = dir;
    } else {
      // Look for any orthogonally adjacent wall.
      const candidates: { wx: number; wy: number; dir: Direction }[] = [
        { wx: player.x - 1, wy: player.y, dir: Direction.LEFT },
        { wx: player.x + 1, wy: player.y, dir: Direction.RIGHT },
        { wx: player.x,     wy: player.y - 1, dir: Direction.UP },
        { wx: player.x,     wy: player.y + 1, dir: Direction.DOWN },
      ];
      const wallCandidate = candidates.find(({ wx, wy }) => {
        const t = room.roomArray[wx]?.[wy];
        return t instanceof Wall || t instanceof WallTorch;
      });
      if (wallCandidate) {
        placedX = wallCandidate.wx;
        placedY = wallCandidate.wy;
        wallDir = wallCandidate.dir;
      } else {
        // No adjacent wall — place on floor at player's position.
        placedX = player.x;
        placedY = player.y;
      }
    }

    // If a placed light already occupies the target tile, pick it up instead.
    const existingLight = room.entities.find(
      (e) => !e.dead && e.x === placedX && e.y === placedY &&
        (e instanceof PlacedTorch || e instanceof PlacedCandle),
    );
    if (existingLight) {
      existingLight.hurt(player, existingLight.health);
      return;
    }

    // Prefer candle; fall back to torch.
    const candleIdx = inv.items.findIndex((it) => it instanceof Candle);
    const torchIdx = inv.items.findIndex((it) => it instanceof Torch);
    const lightIdx = candleIdx !== -1 ? candleIdx : torchIdx;
    if (lightIdx === -1) return;

    const light = inv.items[lightIdx] as Candle | Torch;
    const isCandle = light instanceof Candle;
    const fuel = light.fuel;

    // Don't place on a tile occupied by something else.
    const occupied = room.entities.some((e) => !e.dead && e.x === placedX && e.y === placedY);
    if (occupied) return;

    const placed = isCandle
      ? new PlacedCandle(room, player.game, placedX, placedY, fuel)
      : new PlacedTorch(room, player.game, placedX, placedY, fuel);

    if (wallDir !== null) {
      placed.applyWallDirection(wallDir);
    } else {
      placed.applyFloorPlacement();
    }

    room.entities.push(placed);
    room.updateLighting();

    if (light.stackCount > 1) {
      light.stackCount--;
    } else {
      if ((light as any).equipped) (light as any).toggleEquip();
      inv.removeItem(light);
    }
  }

  handleKeyboardKey(key: string) {
    switch (key.toUpperCase()) {
      case "A":
      case "ARROWLEFT":
        this.handleInput(InputEnum.LEFT);
        break;
      case "D":
      case "ARROWRIGHT":
        this.handleInput(InputEnum.RIGHT);
        break;
      case "W":
      case "ARROWUP":
        this.handleInput(InputEnum.UP);
        break;
      case "S":
      case "ARROWDOWN":
        this.handleInput(InputEnum.DOWN);
        break;
      case " ":
        this.handleInput(InputEnum.SPACE);
        break;
      case "I":
        this.handleInput(InputEnum.I);
        break;
      case "Q":
        this.handleInput(InputEnum.Q);
        break;
      case "L":
        this.placeLight();
        break;
      // Possibly add number keys for inventory here too
      default:
        // Unknown key; ignore or log if needed
        break;
    }
  }

  setMostRecentInput = (input: string) => {
    this.mostRecentInput = input;
  };
  setMostRecentMoveInput = (input: string) => {
    this.mostRecentMoveInput = input;
  };

  private isPerpendicularDir(a: Direction, b: Direction): boolean {
    const v = [Direction.UP, Direction.DOWN];
    const h = [Direction.LEFT, Direction.RIGHT];
    return (v.includes(a) && h.includes(b)) || (h.includes(a) && v.includes(b));
  }

  private combineDiagonal(a: Direction, b: Direction): Direction {
    const up = a === Direction.UP || b === Direction.UP;
    const left = a === Direction.LEFT || b === Direction.LEFT;
    if (up && left) return Direction.UP_LEFT;
    if (up) return Direction.UP_RIGHT;
    if (left) return Direction.DOWN_LEFT;
    return Direction.DOWN_RIGHT;
  }

  private processCardinalMove(dir: Direction): void {
    const dx = dir === Direction.LEFT ? -1 : dir === Direction.RIGHT ? 1 : 0;
    const dy = dir === Direction.UP ? -1 : dir === Direction.DOWN ? 1 : 0;
    this.player.actionProcessor.process({
      type: "Move",
      direction: dir,
      targetX: this.player.x + dx,
      targetY: this.player.y + dy,
    });
  }

  private processDiagonalMove(dir: Direction): void {
    const dx = dir === Direction.UP_LEFT || dir === Direction.DOWN_LEFT ? -1 : 1;
    const dy = dir === Direction.UP_LEFT || dir === Direction.UP_RIGHT ? -1 : 1;
    this.player.actionProcessor.process({
      type: "Move",
      direction: dir,
      targetX: this.player.x + dx,
      targetY: this.player.y + dy,
    });
  }

  private hasDiagonalTarget(dir: Direction): boolean {
    const room = this.player.getRoom?.() ?? this.player.game.room;
    if (!room) return false;
    const px = this.player.x;
    const py = this.player.y;
    // The two diagonal positions reachable by combining this cardinal dir with either perpendicular
    let candidates: { x: number; y: number }[];
    switch (dir) {
      case Direction.UP:    candidates = [{ x: px - 1, y: py - 1 }, { x: px + 1, y: py - 1 }]; break;
      case Direction.DOWN:  candidates = [{ x: px - 1, y: py + 1 }, { x: px + 1, y: py + 1 }]; break;
      case Direction.LEFT:  candidates = [{ x: px - 1, y: py - 1 }, { x: px - 1, y: py + 1 }]; break;
      case Direction.RIGHT: candidates = [{ x: px + 1, y: py - 1 }, { x: px + 1, y: py + 1 }]; break;
      default: return false;
    }
    return candidates.some(({ x, y }) =>
      room.entities.some((e) => e.x === x && e.y === y && e.isEnemy && !e.dead),
    );
  }

  private handleDirectionKey(dir: Direction): void {
    if (this.player.isPushMoveInputLocked()) return;
    if (this.ignoreDirectionInput()) return;

    // Only use double-keypress diagonal window when the equipped weapon supports diagonal attacks
    const weapon = this.player.inventory?.getWeapon?.();
    if (!weapon?.allowsDiagonalAttack) {
      this.processCardinalMove(dir);
      return;
    }

    const WINDOW = 25;
    if (
      this.pendingMoveDir !== null &&
      this.isPerpendicularDir(dir, this.pendingMoveDir) &&
      Date.now() - this.pendingMoveTime < WINDOW
    ) {
      // Second key arrived within window — fire diagonal attack
      if (this.pendingMoveTimer !== null) {
        clearTimeout(this.pendingMoveTimer);
        this.pendingMoveTimer = null;
      }
      const diagDir = this.combineDiagonal(dir, this.pendingMoveDir);
      this.pendingMoveDir = null;
      this.processDiagonalMove(diagDir);
    } else {
      // Skip the buffer entirely if no enemy sits on either reachable diagonal
      if (!this.hasDiagonalTarget(dir)) {
        this.processCardinalMove(dir);
        return;
      }
      // Buffer this keypress; fire cardinal after window if nothing arrives
      if (this.pendingMoveTimer !== null) clearTimeout(this.pendingMoveTimer);
      this.pendingMoveDir = dir;
      this.pendingMoveTime = Date.now();
      this.pendingMoveTimer = setTimeout(() => {
        this.pendingMoveDir = null;
        this.pendingMoveTimer = null;
        if (!this.player.isPushMoveInputLocked() && !this.ignoreDirectionInput()) {
          this.processCardinalMove(dir);
        }
      }, WINDOW);
    }
  }

  mouseAngle = () => {
    const mousePosition = MouseCursor.getInstance().getPosition();
    const playerPixelPosition = {
      x: GameConstants.WIDTH / 2,
      y: GameConstants.HEIGHT / 2,
    };
    const dx = mousePosition.x - playerPixelPosition.x;
    const dy = mousePosition.y - playerPixelPosition.y;
    return Math.atan2(dy, dx);
  };

  faceMouse = () => {
    if (
      !GameConstants.MOVE_WITH_MOUSE ||
      this.mostRecentMoveInput === "keyboard" ||
      GameConstants.isMobile
    )
      return;
    const angle = this.mouseAngle();

    // Convert angle to direction
    // atan2 returns angle in radians (-π to π)
    // Divide the circle into 4 sectors for the 4 directions

    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      this.player.direction = Direction.RIGHT;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      this.player.direction = Direction.DOWN;
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
      this.player.direction = Direction.UP;
    } else {
      this.player.direction = Direction.LEFT;
    }
  };

  // Dummy methods for mute button functionality
  isPointInMuteButtonBounds(x: number, y: number): boolean {
    const tile = GameConstants.TILESIZE;
    //mute button is at the top left of the screen right below the fps counter and is 1 tile wide and tall
    return x >= 0 && x <= tile && y >= 0 && y <= tile * 1.5;
  }

  handleMuteButtonClick() {
    MuteButton.toggleMute();
    this.player.game.pushMessage(
      Sound.audioMuted ? "Audio muted" : "Audio unmuted",
    );
  }

  isPointInMenuButtonBounds(x: number, y: number): boolean {
    return Menu.isPointInOpenMenuButtonBounds(x, y);
  }

  handleMenuButtonClick() {
    this.player.settingsMenu.toggleOpen();
  }

  private handleDeathScreenInput(x: number, y: number) {
    if (this.isInteractingWithFeedbackButton(x, y)) {
      this.player.game.feedbackButton.onClick();
    } else {
      this.player.restart();
    }
  }

  private isInteractingWithFeedbackButton(x: number, y: number): boolean {
    return (
      this.player.game.feedbackButton &&
      this.player.game.feedbackButton.isPointInButton(x, y)
    );
  }

  private navigateDeathScreen(delta: number) {
    this.setMostRecentInput("keyboard");
    const totalPages = Math.max(1, this.player.deathScreenPageCount || 1);
    if (totalPages <= 1) return;
    const current = this.player.deathScreenPageIndex || 0;
    let next = (current + delta) % totalPages;
    if (next < 0) next += totalPages;
    this.player.deathScreenPageIndex = next;
  }
}
