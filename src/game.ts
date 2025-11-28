import { GameConstants } from "./game/gameConstants";
import { EnemyType, Room, RoomType } from "./room/room";
import { Player } from "./player/player";
import { Door, DoorType } from "./tile/door";
import { Sound } from "./sound/sound";
import { LevelConstants } from "./level/levelConstants";
import { LevelGenerator } from "./level/levelGenerator";
import { Input, InputEnum } from "./game/input";
import { DownLadder } from "./tile/downLadder";
import { TextBox } from "./game/textbox";
import {
  createGameState,
  GameState,
  loadGameState,
  TileType,
} from "./game/gameState";
import { DoorDir } from "./tile/door";
import { LevelImageGenerator } from "./level/levelImageGenerator";
import { Enemy } from "./entity/enemy/enemy";
import { TutorialListener } from "./game/tutorialListener";
import { MouseCursor } from "./gui/mouseCursor";
import { PostProcessor } from "./gui/postProcess";
import { globalEventBus } from "./event/eventBus";
import { ReverbEngine } from "./sound/reverb";
import { Level } from "./level/level";
import { statsTracker } from "./game/stats";
import { EVENTS } from "./event/events";
import { UpLadder } from "./tile/upLadder";
import { CameraAnimation } from "./game/cameraAnimation";
import { Tips } from "./tips";
import { GameplaySettings } from "./game/gameplaySettings";
import { Random } from "./utility/random";
import { IdGenerator } from "./globalStateManager/IdGenerator";
import { ReplayManager } from "./game/replayManager";
import { PlayerAction } from "./player/playerAction";
import tilesetUrl = require("../res/tileset.png");
import objsetUrl = require("../res/objset.png");
import mobsetUrl = require("../res/mobset.png");
import itemsetUrl = require("../res/itemset.png");
import fxsetUrl = require("../res/fxset.png");
import fontUrl = require("../res/font.png");
import { FeedbackButton } from "./gui/feedbackButton";
import { OneTimeEventTracker } from "./game/oneTimeEventTracker";
import { TutorialFlags } from "./game/tutorialFlags";

export enum LevelState {
  IN_LEVEL,
  TRANSITIONING,
  TRANSITIONING_LADDER,
  LEVEL_GENERATION,
}

export enum Direction {
  DOWN,
  UP,
  RIGHT,
  LEFT,
  DOWN_RIGHT,
  UP_LEFT,
  UP_RIGHT,
  DOWN_LEFT,
  CENTER,
}

export class ChatMessage {
  message: string;
  timestamp: number;
  private cachedLines: string[] | null = null;
  private cachedWidth: number = -1;

  constructor(message: string) {
    this.message = message;
    this.timestamp = Date.now();
  }

  // Get wrapped lines for the given max width, with caching
  getWrappedLines(maxWidth: number): string[] {
    if (this.cachedLines && this.cachedWidth === maxWidth) {
      return this.cachedLines;
    }

    this.cachedLines = this.wrapText(this.message, maxWidth);
    this.cachedWidth = maxWidth;
    return this.cachedLines;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (text === "") return [""];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine === "" ? word : currentLine + " " + word;

      if (Game.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine !== "") {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word is too long, just add it anyway
          lines.push(word);
        }
      }
    }

    if (currentLine !== "") {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [""];
  }

  // Clear cache when screen resizes
  clearCache(): void {
    this.cachedLines = null;
    this.cachedWidth = -1;
  }
}

class Alert {
  message: string;
  timestamp: number;
  holdMs: number;
  fadeMs: number;
  color: string;
  outlineColor: string;
  maxWidthRatio: number;

  private cachedLines: string[] | null = null;
  private cachedWidth: number = -1;

  constructor(
    message: string,
    opts?: {
      holdMs?: number;
      fadeMs?: number;
      color?: string;
      outlineColor?: string;
      maxWidthRatio?: number;
    },
  ) {
    this.message = message;
    this.timestamp = Date.now();
    this.holdMs = opts?.holdMs ?? GameConstants.ALERT_HOLD_TIME;
    this.fadeMs = opts?.fadeMs ?? GameConstants.ALERT_FADE_TIME;
    this.color = opts?.color ?? GameConstants.ALERT_TEXT_COLOR;
    this.outlineColor = opts?.outlineColor ?? GameConstants.ALERT_OUTLINE_COLOR;
    this.maxWidthRatio =
      opts?.maxWidthRatio ?? GameConstants.ALERT_MAX_WIDTH_RATIO;
  }

  getWrappedLines(maxWidth: number): string[] {
    if (this.cachedLines && this.cachedWidth === maxWidth)
      return this.cachedLines;
    // Reuse ChatMessage wrapping by delegating via a temp instance
    const temp = new ChatMessage(this.message);
    this.cachedLines = temp.getWrappedLines(maxWidth);
    this.cachedWidth = maxWidth;
    return this.cachedLines;
  }

  clearCache(): void {
    this.cachedLines = null;
    this.cachedWidth = -1;
  }
}

type PointerAnchorResolver = () => {
  x: number;
  y: number;
  w: number;
  h: number;
} | null;

class Pointer {
  id: string;
  text: string;
  resolver: PointerAnchorResolver;
  until: () => boolean;
  safety?: Array<() => boolean>;
  timeoutMs?: number;
  createdAt: number;
  arrowDirection: "up" | "down" | "left" | "right" | "auto";
  textDx: number;
  textDy: number;
  color: string;
  outlineColor: string;
  maxWidthRatio: number;
  zIndex: number;
  // simple animation settings
  bobPx: number;
  bobPeriodMs: number;
  tags?: string[];
  // Dismissal/fade state
  dismissStartTime: number | null = null;
  dismissDurationMs: number;

  private cachedLines: string[] | null = null;
  private cachedWidth: number = -1;

  constructor(opts: {
    id: string;
    text: string;
    resolver: PointerAnchorResolver;
    until: () => boolean;
    safety?: Array<() => boolean>;
    timeoutMs?: number;
    arrowDirection?: "up" | "down" | "left" | "right" | "auto";
    textDx?: number;
    textDy?: number;
    color?: string;
    outlineColor?: string;
    maxWidthRatio?: number;
    zIndex?: number;
    bobPx?: number;
    bobPeriodMs?: number;
    tags?: string[];
    dismissDurationMs?: number;
  }) {
    this.id = opts.id;
    this.text = opts.text;
    this.resolver = opts.resolver;
    this.until = opts.until;
    this.safety = opts.safety ?? [];
    this.timeoutMs = opts.timeoutMs;
    this.createdAt = Date.now();
    this.arrowDirection = opts.arrowDirection ?? "auto";
    this.textDx = opts.textDx ?? 0;
    this.textDy = opts.textDy ?? 0;
    this.color = opts.color ?? GameConstants.POINTER_TEXT_COLOR;
    this.outlineColor =
      opts.outlineColor ?? GameConstants.POINTER_OUTLINE_COLOR;
    this.maxWidthRatio =
      opts.maxWidthRatio ?? GameConstants.POINTER_MAX_WIDTH_RATIO;
    this.zIndex = opts.zIndex ?? 0;
    this.bobPx = opts.bobPx ?? GameConstants.POINTER_BOB_PX;
    this.bobPeriodMs = opts.bobPeriodMs ?? GameConstants.POINTER_BOB_PERIOD_MS;
    this.tags = opts.tags ?? [];
    this.dismissDurationMs =
      opts.dismissDurationMs ?? GameConstants.POINTER_FADE_TIME;
  }

  getWrappedLines(maxWidth: number): string[] {
    if (this.cachedLines && this.cachedWidth === maxWidth)
      return this.cachedLines;
    const temp = new ChatMessage(this.text);
    this.cachedLines = temp.getWrappedLines(maxWidth);
    this.cachedWidth = maxWidth;
    return this.cachedLines;
  }

  clearCache(): void {
    this.cachedLines = null;
    this.cachedWidth = -1;
  }
}

let getShadeCanvasKey = (
  set: HTMLImageElement,
  sX: number,
  sY: number,
  sW: number,
  sH: number,
  opacity: number,
  shadeColor: string,
  fadeDir?: "left" | "right" | "up" | "down",
): string => {
  return (
    set.src +
    "," +
    sX +
    "," +
    sY +
    "," +
    sW +
    "," +
    sH +
    "," +
    opacity +
    "," +
    shadeColor +
    ",fade=" +
    (fadeDir || "none")
  );
};

// fps counter
const times = [];
let fps = 60;

export class Game {
  // Replay manager singleton
  private static _replayManager: ReplayManager | null = null;
  get replayManager(): ReplayManager {
    if (!Game._replayManager) Game._replayManager = new ReplayManager();
    return Game._replayManager;
  }
  globalId: string;
  static ctx: CanvasRenderingContext2D;
  static shade_canvases: Record<string, HTMLCanvasElement>;
  prevLevel: Room; // for transitions
  room: Room;
  rooms: Array<Room>;
  level: Level;
  levels: Array<Level>;
  roomsById: Map<string, Room>;
  levelsById: Map<string, Level>;
  // Active path identifier for filtering draw/update
  currentPathId: string = "main";
  levelgen: LevelGenerator;
  readonly localPlayerID = "localplayer";
  players: Record<string, Player>;
  offlinePlayers: Record<string, Player>;
  levelState: LevelState;
  waterOverlayOffsetX: number = 0;
  waterOverlayOffsetY: number = 0;
  private pendingWaterOffsetX: number = 0;
  private pendingWaterOffsetY: number = 0;
  private currentCameraOriginX: number = 0;
  private currentCameraOriginY: number = 0;
  transitionStartTime: number;
  transitionX: number;
  transitionY: number;
  upwardTransition: boolean;
  sideTransition: boolean;
  sideTransitionDirection: number;
  transition: boolean;
  transitioningLadder: UpLadder | DownLadder;
  screenShakeX: number;
  screenShakeY: number;
  shakeAmountX: number;
  shakeAmountY: number;
  shakeFrame: number;
  screenShakeCutoff: number;
  chat: Array<ChatMessage>;
  chatOpen: boolean;
  chatTextBox: TextBox;
  alerts: Array<Alert>;
  // Alerts that are fading/floating after being replaced
  private alertGhosts: Array<{
    alert: Alert;
    startTime: number;
    duration: number;
  }>;
  // Pointer system
  private pointers: Map<string, Pointer>;
  private keyboardHeightPx: number = 0;
  previousFrameTimestamp: number;
  player: Player;
  gameStartTimeMs: number;
  hasRecordedStats: boolean = false;
  loadedFromSaveFile: boolean = false;
  // Reference package.json
  version = "0.3.0";

  static inputReceived = false;

  loginMessage: string = "";
  username: string;
  usernameTextBox: TextBox;
  passwordTextBox: TextBox;
  worldCodes: Array<string>;
  private selectedWorldCode: number;
  tutorialActive: boolean;
  static scale: number;
  static interpolatedScale: number;
  static tileset: HTMLImageElement;
  static objset: HTMLImageElement;
  static mobset: HTMLImageElement;
  static itemset: HTMLImageElement;
  static fxset: HTMLImageElement;
  static fontsheet: HTMLImageElement;
  isMobile: boolean;
  started: boolean;
  startedFadeOut: boolean;
  screenShakeActive: boolean;
  encounteredEnemies: Array<number>;
  paused: boolean;
  private startScreenAlpha = 1;
  static delta: number;
  currentDepth: number;
  //previousDepth: number;
  private ellipsisFrame: number = 0;
  private ellipsisStartTime: number = 0;
  cameraAnimation: CameraAnimation;

  cameraTargetX: number;
  cameraTargetY: number;
  cameraX: number;
  cameraY: number;
  justTransitioned: boolean = false;
  lastDroppedScythePiece: "handle" | "blade" | null = null;
  lastDroppedCrossbowPiece: "stock" | "limb" | null = null;
  lastDroppedShieldPiece: "left" | "right" | null = null;

  tip: string = Tips.getRandomTip();
  private currentLevelGenerator: LevelImageGenerator | null = null;
  static text_rendering_canvases: Record<string, HTMLCanvasElement>;
  static readonly letters =
    "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/+";
  static readonly letter_widths = [
    4, 4, 4, 4, 3, 3, 4, 4, 1, 4, 4, 3, 5, 5, 4, 4, 4, 4, 4, 3, 4, 5, 5, 5, 5,
    3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1, 1, 4, 1, 1, 2, 2, 2, 2, 5, 3, 3, 3,
  ];
  static readonly letter_height = 6;
  static letter_positions = [];

  // [min, max] inclusive
  static rand = (min: number, max: number, rand): number => {
    if (max < min) return min;
    return Math.floor(rand() * (max - min + 1) + min);
  };

  static randTable = (table: any[], rand): any => {
    return table[Game.rand(0, table.length - 1, rand)];
  };
  tutorialListener: TutorialListener;

  private focusTimeout: number | null = null;
  private readonly FOCUS_TIMEOUT_DURATION = 15000; // 5 seconds
  private wasMuted = false;
  private wasStarted = false;

  private lastChatWidth: number = 0;
  private lastAlertWidth: number = 0;
  private lastPointerWidth: number = 0;
  private hasInitializedTutorialPointers: boolean = false;
  private hasShownOpenInventoryPointer: boolean = false;
  oneTime: OneTimeEventTracker;
  tutorialFlags: TutorialFlags;
  private savedGameState: GameState | null = null;
  // Start screen menu (optional)
  startMenu: any = null;
  startMenuActive: boolean = false;

  feedbackButton: FeedbackButton = null;

  constructor() {
    this.oneTime = new OneTimeEventTracker();
    this.tutorialFlags = new TutorialFlags();
    this.globalId = IdGenerator.generate("G");
    this.roomsById = new Map();
    this.levelsById = new Map();

    window.addEventListener("load", () => {
      let canvas = document.getElementById("gameCanvas");
      Game.ctx = (canvas as HTMLCanvasElement).getContext("2d", {
        alpha: false,
      }) as CanvasRenderingContext2D;

      // Create TextBox instances and associate them with HTML elements
      const usernameElement = document.createElement("input");
      usernameElement.type = "text";
      usernameElement.autocomplete = "off";
      usernameElement.autocapitalize = "off";
      usernameElement.style.position = "absolute";
      usernameElement.style.left = "-1000px"; // Position off-screen
      //const passwordElement = document.createElement("input");
      //passwordElement.type = "password";
      //passwordElement.style.position = "absolute";
      //passwordElement.style.left = "-1000px"; // Position off-screen
      const chatElement = document.createElement("input");
      chatElement.type = "text";
      chatElement.autocomplete = "off";
      chatElement.autocapitalize = "off";
      (chatElement as any).autocorrect = "off";
      chatElement.spellcheck = false;
      chatElement.inputMode = "text";
      chatElement.style.position = "absolute";
      chatElement.style.left = "-1000px"; // Position off-screen by default
      //document.body.appendChild(usernameElement);
      //document.body.appendChild(passwordElement);
      document.body.appendChild(chatElement);

      document.addEventListener(
        "click",
        () => {
          usernameElement.focus();
        },
        { once: true },
      );

      this.chat = [];
      this.chatTextBox = new TextBox(chatElement);
      this.alerts = [];
      this.alertGhosts = [];
      this.pointers = new Map();
      this.chatTextBox.setEnterCallback(() => {
        if (this.chatTextBox.text.length > 0) {
          this.chat.push(new ChatMessage(this.chatTextBox.text));
          this.chatTextBox.clear();
        } else {
          this.chatOpen = false;
        }
      });
      this.chatTextBox.setEscapeCallback(() => {
        this.chatOpen = false;
      });
      this.worldCodes = [];
      this.selectedWorldCode = 0;

      Game.shade_canvases = {};
      Game.text_rendering_canvases = {};

      let resourcesLoaded = 0;
      const NUM_RESOURCES = 6;

      Game.tileset = new Image();
      Game.tileset.onload = () => {
        resourcesLoaded++;
      };
      Game.tileset.src = tilesetUrl;
      Game.objset = new Image();
      Game.objset.onload = () => {
        resourcesLoaded++;
      };
      Game.objset.src = objsetUrl;
      Game.mobset = new Image();
      Game.mobset.onload = () => {
        resourcesLoaded++;
      };
      Game.mobset.src = mobsetUrl;
      Game.itemset = new Image();
      Game.itemset.onload = () => {
        resourcesLoaded++;
      };
      Game.itemset.src = itemsetUrl;
      Game.fxset = new Image();
      Game.fxset.onload = () => {
        resourcesLoaded++;
      };
      Game.fxset.src = fxsetUrl;
      Game.fontsheet = new Image();
      Game.fontsheet.onload = () => {
        resourcesLoaded++;
      };
      Game.fontsheet.src = fontUrl;

      this.levelState = LevelState.LEVEL_GENERATION;

      // Initialize camera properties
      this.cameraX = 0;
      this.cameraY = 0;
      this.cameraTargetX = 0;
      this.cameraTargetY = 0;

      let checkResourcesLoaded = () => {
        if (resourcesLoaded < NUM_RESOURCES) {
          window.setTimeout(checkResourcesLoaded, 500);
        } else {
          // proceed with constructor

          Game.scale = GameConstants.SCALE;

          document.addEventListener(
            "touchstart",
            function (e) {
              if (e.target == canvas) {
                e.preventDefault();
              }
            },
            false,
          );
          document.addEventListener(
            "touchend",
            function (e) {
              if (e.target == canvas) {
                e.preventDefault();
              }
            },
            false,
          );
          document.addEventListener(
            "touchmove",
            function (e) {
              if (e.target == canvas) {
                e.preventDefault();
              }
            },
            false,
          );

          document.addEventListener("touchstart", Input.handleTouchStart, {
            passive: false,
          });
          document.addEventListener("touchmove", Input.handleTouchMove, {
            passive: false,
          });
          document.addEventListener("touchend", Input.handleTouchEnd, {
            passive: false,
          });

          Input.keyDownListener = (key: string) => {
            this.keyDownListener(key);
          };

          window.requestAnimationFrame(this.run);
          this.onResize();
          window.addEventListener("resize", this.onResize);
          window.addEventListener("orientationchange", () => {
            // Small delay to ensure new dimensions are available
            setTimeout(this.onResize, 100);
          });

          // Keyboard detection using VisualViewport (iOS 13+, Android Chrome)
          if (GameConstants.MOBILE_KEYBOARD_SUPPORT) {
            try {
              const vv = (window as any).visualViewport;
              if (vv && typeof vv.addEventListener === "function") {
                const updateKeyboard = () => {
                  // When keyboard shows, the layout viewport height shrinks
                  const layoutH = window.innerHeight;
                  const visualH = vv.height;
                  const dy = Math.max(
                    0,
                    layoutH - visualH - (vv.offsetTop || 0),
                  );
                  this.keyboardHeightPx = dy;
                };
                vv.addEventListener("resize", updateKeyboard);
                vv.addEventListener("scroll", updateKeyboard);
              } else {
                // Fallback: compare window.innerHeight changes
                let baseline = window.innerHeight;
                window.addEventListener("resize", () => {
                  const current = window.innerHeight;
                  this.keyboardHeightPx = Math.max(0, baseline - current);
                  if (current > baseline) baseline = current; // update baseline on orientation change etc.
                });
              }
            } catch {}
          } else {
            this.keyboardHeightPx = 0;
          }

          //Sound.playMusic(); // loops forever

          this.players = {};
          this.offlinePlayers = {};
          this.chatOpen = false;
          this.cameraAnimation = new CameraAnimation(0, 0, 1000, 1, 0, false);
          this.feedbackButton = new FeedbackButton();

          // Enable tap-to-open chat on mobile: tap bottom-left region to focus chat input
          if (GameConstants.MOBILE_KEYBOARD_SUPPORT) {
            Input.mouseDownListeners.push((x: number, y: number) => {
              if (!this.isMobile) return;
              // Do not allow opening chat via touch when the death screen is active
              const localPlayer = this.players?.[this.localPlayerID];
              if (localPlayer && localPlayer.dead) return;
              // If already open, don't steal the event
              if (this.chatOpen) return;
              if (this.isPointInChatHotspot(x, y)) {
                this.chatOpen = true;
                this.chatTextBox.focus();
                Input.mouseDownHandled = true;
              }
            });
          }

          this.screenShakeX = 0;
          this.screenShakeY = 0;
          this.shakeAmountX = 0;
          this.shakeAmountY = 0;
          this.shakeFrame = (3 * Math.PI) / 2;
          this.screenShakeCutoff = 0;
          this.tutorialActive = false;
          this.screenShakeActive = false;
          this.levels = [];
          this.encounteredEnemies = [];

          this.newGame();
          // Defer pointer initialization until first IN_LEVEL frame
          this.hasInitializedTutorialPointers = false;
          // If a save exists, build a start-screen menu to choose Continue/New
          try {
            const { getCookie } = require("./utility/cookies");
            const hasSave = !!getCookie("wr_save_meta");
            if (hasSave) {
              const { Menu } = require("./gui/menu");
              this.startMenu = new Menu({ game: this, showCloseButton: false });
              this.startMenu.buildStartMenu();
              this.startMenu.openMenu();
              this.startMenuActive = true;
            }
          } catch {}
        }
      };
      checkResourcesLoaded();
    });
    ReverbEngine.initialize();

    Sound.loadSounds();

    this.started = false;
    this.tutorialListener = null;

    this.setupEventListeners();

    globalEventBus.on(EVENTS.LEVEL_GENERATION_STARTED, () => {
      this.levelState = LevelState.LEVEL_GENERATION;
    });
    globalEventBus.on(EVENTS.LEVEL_GENERATION_COMPLETED, () => {
      this.levelState = LevelState.IN_LEVEL;
    });

    // Add focus/blur event listeners
    //window.addEventListener("blur", this.handleWindowBlur);
    //window.addEventListener("focus", this.handleWindowFocus);
  }

  updateDepth = (depth: number) => {
    //this.previousDepth = this.currentDepth;
    this.currentDepth = depth;
    this.players[this.localPlayerID].depth = depth;
  };

  updateLevel = (room: Room) => {
    if (room && room.level) {
      this.level = room.level;
    }
    if (this.level.rooms.length > 0) {
      this.rooms = this.level.rooms;
      this.roomsById = new Map(this.rooms.map((r) => [r.globalId, r]));
    }
  };

  getRoomById = (id: string): Room | undefined => {
    return this.roomsById?.get(id);
  };

  getLevelById = (id: string): Level | undefined => {
    return this.levelsById?.get(id);
  };

  registerLevel = (level: Level) => {
    this.levelsById.set(level.globalId, level);
  };

  registerRooms = (rooms: Room[]) => {
    this.rooms = rooms;
    this.roomsById = new Map(rooms.map((r) => [r.globalId, r]));
  };

  setCurrentRoomById = (id: string): Room | undefined => {
    const room = this.roomsById.get(id);
    if (room) {
      this.room = room;
      this.updateLevel(room);
    }
    return room;
  };

  setPlayer = () => {
    this.player = this.players[this.localPlayerID];
  };

  newGame = (seed?: number) => {
    // Clear all input listeners to prevent duplicates from previous game instances
    Input.mouseDownListeners.length = 0;
    Input.mouseUpListeners.length = 0;
    Input.mouseMoveListeners.length = 0;
    Input.mouseLeftClickListeners.length = 0;
    Input.mouseRightClickListeners.length = 0;
    Input.touchStartListeners.length = 0;
    Input.touchEndListeners.length = 0;

    statsTracker.resetStats();
    this.currentDepth = 0;
    this.encounteredEnemies = [];
    this.levels = [];
    this.hasRecordedStats = false;
    this.loadedFromSaveFile = false;

    // In some cases, this starts the timer when a player views the start menu rather than when
    // the gameplay starts. This field is only used for analytics, so approximate timing is acceptable.
    this.gameStartTimeMs = Date.now();

    // Reset path context to main for a fresh world
    (this as any).currentPathId = "main";
    // Attempt auto-load from cookies/localStorage if a save exists
    // Auto-load disabled

    // No cookie save found: start a fresh world
    this.startFreshWorld(seed);
    // Load settings from cookies after basic init
    try {
      const { loadSettings } = require("./game/settingsPersistence");
      loadSettings(this);
    } catch {}

    this.levelState = LevelState.LEVEL_GENERATION;
    // Begin replay recording with this seed and capture a base state when ready
    this.replayManager.beginRecording(gs.seed, this);
  };

  private startFreshWorld(seed?: number) {
    //gs = new GameState();
    gs.seed = seed ?? (Math.random() * 4294967296) >>> 0;
    gs.randomState = gs.seed;
    loadGameState(this, [this.localPlayerID], gs, true);

    try {
      const { loadSettings } = require("./game/settingsPersistence");
      loadSettings(this);
    } catch {}
    this.levelState = LevelState.LEVEL_GENERATION;
    this.replayManager.beginRecording(gs.seed, this);
  }

  keyDownListener = (key: string) => {
    Game.inputReceived = true;

    if (!this.started) {
      // If a start menu is active, ignore the default start behavior
      if (this.startMenuActive) {
        return;
      }
      this.startedFadeOut = true;
      return;
    }

    // Handle global keys
    if (!this.chatOpen) {
      switch (key.toUpperCase()) {
        case "M":
          // Toggle full-screen map. If open, close; if closed, open.
          {
            const player = this.players[this.localPlayerID];
            if (player?.map) {
              player.map.toggleMapOpen();
              return;
            }
          }
          return;

        case "C":
          this.chatOpen = true;
          return;

        case "/":
          this.chatOpen = true;
          this.chatTextBox.clear();
          this.chatTextBox.handleKeyPress(key);
          return;

        case "1":
          LevelGenerator.ANIMATION_CONSTANT = 1;
          return;
        case "2":
          LevelGenerator.ANIMATION_CONSTANT = 2;
          return;
        case "3":
          LevelGenerator.ANIMATION_CONSTANT = 5;
          return;
        case "4":
          LevelGenerator.ANIMATION_CONSTANT = 10000;
          return;
        case "0":
          LevelGenerator.ANIMATION_CONSTANT = 0;
          return;
      }

      // Forward all player input
      const player = this.players[this.localPlayerID];
      player.inputHandler.handleKeyboardKey(key);
    } else {
      this.chatTextBox.handleKeyPress(key);
    }
  };

  changeLevelThroughLadder = (
    player: Player,
    ladder: UpLadder | DownLadder,
  ) => {
    player.map.saveOldMap();
    if (ladder instanceof DownLadder && !ladder.linkedRoom) ladder.generate();

    const newRoom = ladder.linkedRoom;
    // If downladder provided an entry up-ladder position, pass it through transition
    let entryPosition: { x: number; y: number } | undefined = undefined;
    if ((ladder as any).entryUpLadderPos) {
      entryPosition = { ...(ladder as any).entryUpLadderPos };
      console.log(
        `changeLevelThroughLadder: captured entryPosition (${entryPosition.x}, ${entryPosition.y}) for newRoom gid=${(newRoom as any)?.globalId}`,
      );
    }

    if (this.players[this.localPlayerID] === player) {
      player.levelID = newRoom.id;
      (player as any).roomGID = newRoom.globalId;

      // Immediately deactivate the old room like door transitions do
      this.prevLevel = this.room;
      this.prevLevel.exitLevel();
    }

    this.updateDepth(newRoom.depth);

    this.levelState = LevelState.TRANSITIONING_LADDER;
    this.transitionStartTime = Date.now();
    this.transitioningLadder = ladder;
    // Attach desired entry position onto the target room so enterLevel can read it
    if (entryPosition) {
      (newRoom as any).__entryPositionFromLadder = entryPosition;
      console.log(
        `changeLevelThroughLadder: wrote __entryPositionFromLadder to room gid=${(newRoom as any)?.globalId}`,
      );
    } else {
      console.log(
        `changeLevelThroughLadder: no entryPosition available for room gid=${(newRoom as any)?.globalId}`,
      );
    }
  };

  changeLevelThroughDoor = (player: Player, door: Door, side?: number) => {
    door.linkedDoor.room.entered = true;
    // Prefer stable roomGID; maintain legacy levelID for compatibility
    (player as any).roomGID = door.room.globalId;
    try {
      // Compute index defensively instead of trusting door.room.id
      const idx = this.rooms?.indexOf(door.room);
      if (idx !== undefined && idx >= 0) player.levelID = idx;
    } catch {}

    if (this.players[this.localPlayerID] === player) {
      this.levelState = LevelState.TRANSITIONING;
      this.transitionStartTime = Date.now();
      const hasDir = door.doorDir !== door.linkedDoor.doorDir;

      let oldX = this.players[this.localPlayerID].x;
      let oldY = this.players[this.localPlayerID].y;

      this.prevLevel = this.room;
      this.prevLevel.exitLevel();

      //this.level.exitLevel();
      this.room = door.room;

      door.room.enterLevelThroughDoor(player, door, side);

      this.transitionX =
        (this.players[this.localPlayerID].x - oldX) * GameConstants.TILESIZE;
      this.transitionY =
        (this.players[this.localPlayerID].y - oldY) * GameConstants.TILESIZE;
      this.pendingWaterOffsetX =
        this.transitionX !== 0
          ? Math.sign(this.transitionX) * GameConstants.TILESIZE
          : 0;
      this.pendingWaterOffsetY =
        this.transitionY !== 0
          ? Math.sign(this.transitionY) * GameConstants.TILESIZE
          : 0;

      this.upwardTransition = false;
      this.sideTransition = false;
      this.sideTransitionDirection = side;
      if (
        door instanceof Door &&
        [Direction.RIGHT, Direction.LEFT].includes(door.doorDir) &&
        hasDir
      )
        this.sideTransition = true;
      else if (
        door instanceof Door &&
        door.doorDir === Direction.DOWN &&
        hasDir
      )
        this.upwardTransition = true;
    } else {
      door.room.enterLevelThroughDoor(player, door, side);
    }
    player.map.saveMapData();
  };

  run = (timestamp: number) => {
    if (this.paused) {
      // Still request next frame even when paused to maintain loop
      window.requestAnimationFrame(this.run);
      return;
    }

    if (!this.previousFrameTimestamp) {
      this.previousFrameTimestamp = timestamp;
      window.requestAnimationFrame(this.run);
      return;
    }

    // Calculate elapsed time in milliseconds
    let elapsed = timestamp - this.previousFrameTimestamp;

    // Normalize delta to 60 FPS
    let delta = (elapsed * 60) / 1000.0;

    // Define minimum and maximum delta values
    const deltaMin = 1 / 10; // 600fps
    const deltaMax = 8; //7.5fps
    // Cap delta within [deltaMin, deltaMax]
    if (Game.delta) delta = Game.delta;
    if (delta < deltaMin) {
      delta = deltaMin;
    } else if (delta > deltaMax) {
      delta = deltaMax;
    }
    //delta = 0.025;
    // Update FPS tracking
    while (times.length > 0 && times[0] <= timestamp - 1000) {
      times.shift();
    }
    times.push(timestamp);
    fps = times.length;
    // Update game logic
    if (
      Math.floor(timestamp / (1000 / 60)) >
      Math.floor(this.previousFrameTimestamp / (1000 / 60))
    ) {
      this.update();
    }

    if (
      Math.floor(timestamp) >
      Math.floor(this.previousFrameTimestamp) + 1000
    ) {
      this.refreshDimensions();
    }
    //delta = 0.1;
    // Render the frame with capped delta

    this.draw(delta * GameConstants.ANIMATION_SPEED * 1);

    // Request the next frame
    window.requestAnimationFrame(this.run);

    // Update the previous frame timestamp
    this.previousFrameTimestamp = timestamp;
  };

  update = () => {
    this.refreshDimensions();
    Input.checkIsTapHold();

    // Existing key repeat (disabled during replay)
    if (!this.replayManager.isReplaying()) {
      if (
        Input.lastPressTime !== 0 &&
        Date.now() - Input.lastPressTime > GameConstants.KEY_REPEAT_TIME
      ) {
        Input.onKeydown({
          repeat: false,
          key: Input.lastPressKey,
        } as KeyboardEvent);
      }
    }

    // Add mouse repeat for movement (disabled during replay)
    if (!this.replayManager.isReplaying()) {
      if (
        Input.mouseDown &&
        Input.mouseDownHandled &&
        Input.lastMouseDownTime !== 0 &&
        Date.now() - Input.lastMouseDownTime > GameConstants.KEY_REPEAT_TIME
      ) {
        // Re-trigger mouse movement
        const player = this.players[this.localPlayerID];
        if (
          player &&
          player.game.levelState === LevelState.IN_LEVEL &&
          !player.dead &&
          !player.menu.open &&
          !player.busyAnimating &&
          !player.game.cameraAnimation.active
        ) {
          // Update mouse position and trigger movement
          player.moveWithMouse();
          Input.lastMouseDownTime = Date.now(); // Reset timer for next repeat
        }
      }
    }

    // Swipe hold repeat with initial delay
    if (Input.swipeHoldActive && Input.lastSwipeTime !== 0) {
      const timeSinceSwipe = Date.now() - Input.lastSwipeTime;

      if (!Input.swipeHoldRepeating) {
        // Check if we've waited long enough for initial delay
        if (timeSinceSwipe > GameConstants.SWIPE_HOLD_INITIAL_DELAY) {
          Input.swipeHoldRepeating = true;
          Input.lastSwipeTime = Date.now(); // Reset timer for repeat timing
        }
      } else {
        // We're in repeat mode, check if it's time to repeat
        if (timeSinceSwipe > GameConstants.SWIPE_HOLD_REPEAT_TIME) {
          // Trigger the swipe listener again based on last direction
          switch (Input.lastSwipeDirection) {
            case Direction.LEFT:
              Input.leftSwipeListener();
              break;
            case Direction.RIGHT:
              Input.rightSwipeListener();
              break;
            case Direction.UP:
              Input.upSwipeListener();
              break;
            case Direction.DOWN:
              Input.downSwipeListener();
              break;
          }
          Input.lastSwipeTime = Date.now(); // Reset timer for next repeat
        }
      }
    }

    if (this.levelState === LevelState.TRANSITIONING) {
      if (
        Date.now() - this.transitionStartTime >=
        LevelConstants.LEVEL_TRANSITION_TIME
      ) {
        this.levelState = LevelState.IN_LEVEL;
        this.applyWaterOverlayGapCompensation();
      }
    }
    if (this.levelState === LevelState.TRANSITIONING_LADDER) {
      if (
        Date.now() - this.transitionStartTime >=
        LevelConstants.LEVEL_TRANSITION_TIME_LADDER
      ) {
        this.levelState = LevelState.IN_LEVEL;
        this.players[this.localPlayerID].map.saveMapData();
      }
    }
    if (this.levelState !== LevelState.LEVEL_GENERATION) {
      for (const i in this.players) {
        this.players[i].update();

        // Don't update rooms during level transitions
        if (
          this.levelState !== LevelState.TRANSITIONING &&
          this.levelState !== LevelState.TRANSITIONING_LADDER
        ) {
          const player = this.players[i];
          const room = (player as any).getRoom
            ? (player as any).getRoom()
            : this.levels[player.depth].rooms[player.levelID];
          room.update();
        }

        if (this.players[i].dead) {
          for (const j in this.players) {
            this.players[j].dead = true;
          }
        }
      }
    }
  };

  private applyWaterOverlayGapCompensation = () => {
    if (this.transitionX) {
      const dirX = Math.sign(this.transitionX);
      if (dirX !== 0) {
        this.waterOverlayOffsetX += dirX * GameConstants.TILESIZE;
      }
    }

    if (this.transitionY) {
      const dirY = Math.sign(this.transitionY);
      if (dirY !== 0) {
        this.waterOverlayOffsetY += dirY * GameConstants.TILESIZE;
      }
    }
    this.pendingWaterOffsetX = 0;
    this.pendingWaterOffsetY = 0;
  };

  getWaterOverlayOrigin = () => {
    const progress = this.getWaterTransitionProgress();
    const dynamicOffsetX = this.pendingWaterOffsetX * progress;
    const dynamicOffsetY = this.pendingWaterOffsetY * progress;
    return {
      x: Math.round(
        this.currentCameraOriginX -
          (this.waterOverlayOffsetX ?? 0) -
          dynamicOffsetX,
      ),
      y: Math.round(
        this.currentCameraOriginY -
          (this.waterOverlayOffsetY ?? 0) -
          dynamicOffsetY,
      ),
    };
  };

  private getWaterTransitionProgress = () => {
    if (this.levelState === LevelState.TRANSITIONING) {
      const elapsed = Date.now() - this.transitionStartTime;
      const duration = LevelConstants.LEVEL_TRANSITION_TIME;
      return Math.max(0, Math.min(1, elapsed / duration));
    }
    if (this.levelState === LevelState.TRANSITIONING_LADDER) {
      const elapsed = Date.now() - this.transitionStartTime;
      const duration = LevelConstants.LEVEL_TRANSITION_TIME_LADDER;
      return Math.max(0, Math.min(1, elapsed / duration));
    }
    return 0;
  };

  lerp = (a: number, b: number, t: number): number => {
    return (1 - t) * a + t * b;
  };

  pushMessage = (message: string) => {
    this.chat.push(new ChatMessage(message));
  };

  pushAlert = (
    message: string,
    options?: {
      holdMs?: number;
      fadeMs?: number;
      color?: string;
      outlineColor?: string;
      maxWidthRatio?: number;
      replace?: boolean;
    },
  ) => {
    // If an alert is active
    if (this.alerts.length > 0) {
      const current = this.alerts[0];
      if (current.message === message) {
        // Same text: reset timer
        current.timestamp = Date.now();
        return;
      }
      // Different text: spawn a fading/floating ghost of the current alert
      const ghost = new Alert(current.message, {
        color: current.color,
        outlineColor: current.outlineColor,
        maxWidthRatio: current.maxWidthRatio,
        holdMs: 0,
        fadeMs: GameConstants.ALERT_REPLACE_FLOAT_TIME,
      });
      ghost.timestamp = Date.now();
      this.alertGhosts.push({
        alert: ghost,
        startTime: Date.now(),
        duration: GameConstants.ALERT_REPLACE_FLOAT_TIME,
      });
      // Overwrite current with new
      this.alerts[0] = new Alert(message, options);
      return;
    }

    // No active alert: just push
    this.alerts.push(new Alert(message, options));
  };

  // Pointer API
  addPointer = (opts: {
    id?: string;
    text: string;
    resolver: PointerAnchorResolver;
    until: () => boolean;
    safety?: Array<() => boolean>;
    timeoutMs?: number;
    arrowDirection?: "up" | "down" | "left" | "right" | "auto";
    textDx?: number;
    textDy?: number;
    color?: string;
    outlineColor?: string;
    maxWidthRatio?: number;
    zIndex?: number;
    bobPx?: number;
    bobPeriodMs?: number;
    tags?: string[];
  }): string => {
    const id = opts.id ?? IdGenerator.generate("PTR");
    const pointer = new Pointer({ ...opts, id });
    this.pointers.set(id, pointer);
    return id;
  };

  removePointer = (id: string) => {
    this.pointers.delete(id);
  };

  removePointersByTag = (tag: string) => {
    for (const [id, p] of this.pointers) {
      if (p.tags?.includes(tag)) this.pointers.delete(id);
    }
  };

  // Add this helper function before the commandHandler
  private convertSeedToNumber = (seed: string): number => {
    // If it's already a number, parse and return it
    if (/^\d+$/.test(seed)) {
      return parseInt(seed);
    }

    // Convert letters to numbers using character codes
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive number
    return Math.abs(hash);
  };

  commandHandler = (command: string): void => {
    command = command.toLowerCase();
    let enabled = "";

    // Handle "new" command with optional seed parameter

    if (command.startsWith("new")) {
      if (command.startsWith("new ")) {
        const seedInput = command.slice(4).trim();
        const seedNumber = this.convertSeedToNumber(seedInput);
        this.pushMessage(
          `Starting new game with seed: ${seedInput} (${seedNumber})`,
        );
        this.newGame(seedNumber);
      } else if (command === "new") {
        this.newGame();
      }
      return;
    }

    switch (command) {
      case "ladder":
        this.pushMessage(
          `Distance to nearest up ladder: ${this.room.getDistanceToNearestLadder("up")}`,
        );
        break;
      case "encounter":
        this.pushMessage(
          "Encountering enemies..." + this.encounteredEnemies.length,
        );
        break;
      case "key":
        const keyRoom = this.level.getKeyRoom(this.room);
        if (keyRoom) {
          this.pushMessage(`Key room: ${keyRoom.id}`);
          keyRoom.entered = true;
          keyRoom.calculateWallInfo();
          this.changeLevelThroughDoor(
            this.players[this.localPlayerID],
            keyRoom.doors[0],
            1,
          );
          const tile = keyRoom.getRandomEmptyPosition(keyRoom.getEmptyTiles());
          this.players[this.localPlayerID].x = tile.x;
          this.players[this.localPlayerID].y = tile.y;
          keyRoom.updateLighting();
          this.pushMessage("Downladder located");
        }
        break;

      case "level":
        this.pushMessage(`Level: ${this.level.globalId}`);
        break;
      case "down":
        let downladder: DownLadder;
        for (const room of this.level.rooms) {
          if (room.type !== RoomType.DOWNLADDER) {
            for (let x = room.roomX; x < room.roomX + room.width; x++) {
              for (let y = room.roomY; y < room.roomY + room.height; y++) {
                if (room.roomArray[x][y] instanceof DownLadder) {
                  downladder = room.roomArray[x][y] as DownLadder;
                  break;
                }
              }
            }
          }
        }
        if (downladder) {
          downladder.room.entered = true;
          downladder.room.calculateWallInfo();
          this.changeLevelThroughDoor(
            this.players[this.localPlayerID],
            downladder.room.doors[0],
            1,
          );
          downladder.lockable.removeLock();
          this.players[this.localPlayerID].x = downladder.x;
          this.players[this.localPlayerID].y = downladder.y;
          downladder.room.updateLighting();
          this.pushMessage("Downladder located");
        }
        break;
      case "lightup":
        LevelConstants.LIGHTING_ANGLE_STEP += 1;
        this.pushMessage(
          `Lighting angle step is now ${LevelConstants.LIGHTING_ANGLE_STEP}`,
        );
        break;
      case "lightdown":
        if (LevelConstants.LIGHTING_ANGLE_STEP > 1) {
          LevelConstants.LIGHTING_ANGLE_STEP -= 1;
        }
        this.pushMessage(
          `Lighting angle step is now ${LevelConstants.LIGHTING_ANGLE_STEP}`,
        );
        break;
      case "savec": {
        try {
          const { saveToCookies } = require("./game/savePersistence");
          saveToCookies(this);
          this.pushMessage(
            "Attempted cookie save (cookies/localStorage fallback).",
          );
        } catch (e) {
          this.pushMessage("Cookie save failed.");
        }
        break;
      }
      case "loadc": {
        try {
          const { loadFromCookies } = require("./game/savePersistence");
          loadFromCookies(this);
          this.pushMessage(
            "Attempted cookie load (cookies/localStorage fallback).",
          );
        } catch (e) {
          this.pushMessage("Cookie load failed.");
        }
        break;
      }
      case "replay":
        this.pushMessage("Starting replay...");
        this.replayManager.replay(this);
        break;
      case "replayinfo": {
        const s = (this.replayManager as any).getStats?.();
        this.pushMessage(
          s
            ? `Replay stats: actions=${s.count}, seed=${s.seed}, recording=${s.recording}, replaying=${s.replaying}`
            : "No replay stats available.",
        );
        break;
      }
      case "replayclear":
        (this.replayManager as any).clearRecording?.();
        this.pushMessage("Replay buffer cleared.");
        break;
      case "devmode":
        GameConstants.DEVELOPER_MODE = !GameConstants.DEVELOPER_MODE;
        console.log(`Developer mode is now ${GameConstants.DEVELOPER_MODE}`);
        break;
      case "dev":
        GameConstants.DEVELOPER_MODE = !GameConstants.DEVELOPER_MODE;
        console.log(`Developer mode is now ${GameConstants.DEVELOPER_MODE}`);
        this.newGame();
        break;
      case "kill":
        for (const i in this.players) {
          this.players[i].dead = true;
        }
        break;
      case "killall":
        for (const i in this.players) {
          this.players[i].game.room.entities.forEach((e) => {
            e.kill(this.players[i]);
          });
        }
        break;
      case "bomb":
        this.room.addBombs(1, () => Random.rand());
        break;
      case "col":
        GameConstants.SET_COLOR_LAYER_COMPOSITE_OPERATION(false);
        break;
      case "scl":
        GameConstants.SET_SCALE();
        this.onResize();
        break;
      case "shd":
        //GameConstants.SHADE_ENABLED = !GameConstants.SHADE_ENABLED;
        //enabled = GameConstants.SHADE_ENABLED ? "enabled" : "disabled";
        //this.pushMessage(`Shade is now ${enabled}`);
        break;
      case "shdop":
        GameConstants.SET_SHADE_LAYER_COMPOSITE_OPERATION(false);
        break;
      case "smooth":
        GameConstants.SMOOTH_LIGHTING = !GameConstants.SMOOTH_LIGHTING;
        enabled = GameConstants.SMOOTH_LIGHTING ? "enabled" : "disabled";
        this.pushMessage(`Smooth lighting is now ${enabled}`);
        try {
          const { saveSettings } = require("./game/settingsPersistence");
          saveSettings(this);
        } catch {}
        break;
      case "rooms":
        GameConstants.drawOtherRooms = !GameConstants.drawOtherRooms;
        enabled = GameConstants.drawOtherRooms ? "enabled" : "disabled";
        this.pushMessage(`Drawing other rooms is now ${enabled}`);
        break;
      case "opq":
        GameConstants.ENEMIES_BLOCK_LIGHT = !GameConstants.ENEMIES_BLOCK_LIGHT;
        enabled = GameConstants.ENEMIES_BLOCK_LIGHT ? "enabled" : "disabled";
        this.pushMessage(`Enemies block light is now ${enabled}`);
        break;
      case "peace":
        GameplaySettings.NO_ENEMIES = !GameplaySettings.NO_ENEMIES;
        this.newGame();
        enabled = GameplaySettings.NO_ENEMIES ? "enabled" : "disabled";
        this.pushMessage(`Peaceful mode is now ${enabled}`);
        break;
      case "equip":
        GameplaySettings.EQUIP_USES_TURN = !GameplaySettings.EQUIP_USES_TURN;
        enabled = GameplaySettings.EQUIP_USES_TURN ? "enabled" : "disabled";
        this.pushMessage(`Equipping an item takes a turn is now ${enabled}`);
        break;
      case "inline":
        GameConstants.SHADE_INLINE_IN_ENTITY_LAYER =
          !GameConstants.SHADE_INLINE_IN_ENTITY_LAYER;
        enabled = GameConstants.SHADE_INLINE_IN_ENTITY_LAYER
          ? "enabled"
          : "disabled";
        this.pushMessage(`Inline tile shading ${enabled}`);
        break;

      case "webgl": {
        // Toggle WebGL blur and initialize renderer if enabling
        GameConstants.TOGGLE_USE_WEBGL_BLUR();
        if (GameConstants.USE_WEBGL_BLUR) {
          try {
            const { WebGLBlurRenderer } = require("./gui/webglBlurRenderer");
            WebGLBlurRenderer.getInstance();
            this.pushMessage("WebGL blur enabled and initialized.");
          } catch (e) {
            this.pushMessage(
              "Failed to initialize WebGL blur. Falling back to Canvas blur.",
            );
            GameConstants.USE_WEBGL_BLUR = false;
          }
        } else {
          // Optional: clear any cached results when disabling
          try {
            const { WebGLBlurRenderer } = require("./gui/webglBlurRenderer");
            WebGLBlurRenderer.getInstance().clearCache?.();
          } catch {}
          this.pushMessage("WebGL blur disabled.");
        }
        break;
      }
      case "hq":
        GameConstants.TOGGLE_HIGH_QUALITY_BLUR();
        break;
      case "genroom":
        this.generateAndShowRoomLayout();
        break;
      case "cleargen":
        this.currentLevelGenerator = null;
        this.pushMessage("Cleared generated level display");
        break;
      case "post":
        PostProcessor.settings.enabled = !PostProcessor.settings.enabled;
        enabled = PostProcessor.settings.enabled ? "enabled" : "disabled";
        this.pushMessage(`Post processor is now ${enabled}`);
        break;
      case "save":
        try {
          if (this.replayManager.isReplaying()) {
            this.pushMessage("Cannot save during replay.");
          } else {
            this.savedGameState = createGameState(this);
            this.pushMessage("Game state saved successfully!");
            console.log("Saved game state:", this.savedGameState);
          }
        } catch (error) {
          this.pushMessage("Error saving game state: " + error.message);
          console.error("Save error:", error);
        }
        break;

      case "load":
        if (!this.savedGameState) {
          this.pushMessage(
            "No saved game state found. Use 'save' command first.",
          );
          return;
        }
        try {
          // Get current active usernames (for multiplayer support)
          const activeUsernames = Object.keys(this.players);
          loadGameState(this, activeUsernames, this.savedGameState, false);
          this.pushMessage("Game state loaded successfully!");
          console.log("Loaded game state");
        } catch (error) {
          this.pushMessage("Error loading game state: " + error.message);
          console.error("Load error:", error);
        }
        break;

      case "saveinfo":
        if (!this.savedGameState) {
          this.pushMessage("No saved game state found.");
          return;
        }
        this.pushMessage(
          `Saved state - Seed: ${this.savedGameState.seed}, Depth: ${this.savedGameState.level.depth}, Players: ${Object.keys(this.savedGameState.players).length}`,
        );
        console.log("Saved game state details:", this.savedGameState);
        break;

      case "currentinfo":
        this.pushMessage(
          `Current state - Seed: ${this.levelgen.seed}, Depth: ${this.level.depth}, Players: ${Object.keys(this.players).length}`,
        );
        console.log("Current game state details:", {
          seed: this.levelgen.seed,
          depth: this.level.depth,
          players: Object.keys(this.players),
          rooms: this.rooms.length,
        });
        break;

      case "testsave":
        // Save current state, make some changes, then load to verify
        try {
          if (this.replayManager.isReplaying()) {
            this.pushMessage("Cannot save during replay.");
            break;
          }
          this.savedGameState = createGameState(this);
          const originalHealth = this.players[this.localPlayerID].health;
          const originalX = this.players[this.localPlayerID].x;
          const originalY = this.players[this.localPlayerID].y;

          // Make some changes
          this.players[this.localPlayerID].health = Math.max(
            1,
            this.players[this.localPlayerID].health - 1,
          );
          this.players[this.localPlayerID].x += 1;
          this.players[this.localPlayerID].y += 1;

          this.pushMessage(
            `Changes made - Health: ${originalHealth} -> ${this.players[this.localPlayerID].health}, Pos: (${originalX},${originalY}) -> (${this.players[this.localPlayerID].x},${this.players[this.localPlayerID].y})`,
          );
          this.pushMessage("Use 'load' to restore the saved state");
        } catch (error) {
          this.pushMessage("Error in test save: " + error.message);
          console.error("Test save error:", error);
        }
        break;
      default:
        if (command.startsWith("spawn ")) {
          this.room.addNewEnemy(command.slice(6) as EnemyType);
        } else if (command.startsWith("fill")) {
          while (this.room.getEmptyTiles().length > 0) {
            this.room.addNewEnemy(command.slice(5) as EnemyType);
          }
        } else if (command === "map") {
          const { GameConstants } = require("./game/gameConstants");
          GameConstants.MAP_ENABLED = !GameConstants.MAP_ENABLED;
          const enabled = GameConstants.MAP_ENABLED ? "enabled" : "disabled";
          this.pushMessage(`Minimap is now ${enabled}`);
        }
        break;
    }
  };

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("ChatCommand", this.commandHandler.bind(this));
    try {
      // Save on tab close/refresh and when page becomes hidden
      const saveOnExit = () => {
        try {
          const { saveToCookies } = require("./game/savePersistence");
          // Avoid heavy work in beforeunload; keep it minimal
          saveToCookies(this);
        } catch {}
      };
      window.addEventListener("beforeunload", saveOnExit);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveOnExit();
      });
      window.addEventListener("pagehide", saveOnExit);
      window.addEventListener("unload", () => {
        try {
          const { Sound } = require("./sound/sound");
          Sound.cleanup?.();
        } catch {}
      });
      // Save on back/forward navigation
      window.addEventListener("popstate", saveOnExit);
      window.addEventListener("hashchange", saveOnExit);
    } catch {}
  }

  private generateAndShowRoomLayout(): void {
    // Generate different patterns
    const patterns: ("center" | "split" | "corners")[] = [
      "center",
      "split",
      "corners",
    ];
    const pattern = patterns[Math.floor(Random.rand() * patterns.length)];

    // Generate level with random parameters
    const numRooms = 8 + Math.floor(Random.rand() * 12); // 8-20 rooms
    const width = 60 + Math.floor(Random.rand() * 40); // 60-100 width
    const height = 50 + Math.floor(Random.rand() * 30); // 50-80 height

    const generator = LevelImageGenerator.generateRandomLevel(
      width,
      height,
      numRooms,
      Random.rand,
      pattern,
    );

    // Check accessibility
    const accessible = generator.areRoomsAccessible();
    const accessibilityText = accessible
      ? "✓ All rooms accessible"
      : "✗ Some rooms inaccessible";

    // Store generator for drawing
    this.currentLevelGenerator = generator;

    this.pushMessage(
      `Generated ${numRooms} rooms (${pattern} pattern) - ${accessibilityText}`,
    );
    this.pushMessage("Level layout shown on screen. Use '/cleargen' to clear.");

    // Save PNG with organized filename
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[T:]/g, "_");
    const filename = `${pattern}_${width}x${height}_${numRooms}rooms_${timestamp}.png`;

    generator.savePNG(filename);
    this.pushMessage(`PNG saved as: generated_levels/${filename}`);
    this.pushMessage("Check browser downloads or console for data URL");

    // Log detailed info for developers
    if (GameConstants.DEVELOPER_MODE) {
      console.log("Generated level details:", {
        pattern,
        dimensions: `${width}x${height}`,
        numRooms,
        accessible,
        rooms: generator.getRooms(),
      });
    }
  }

  maxScale = () => {
    let dimension = window.innerWidth;
    let measure = 130;

    for (let i = GameConstants.MIN_SCALE; i <= GameConstants.MAX_SCALE; i++) {
      if (dimension / i < measure) {
        return i;
      }
    }
    return GameConstants.MAX_SCALE;
  };

  increaseScale = () => {
    GameConstants.INCREASE_SCALE();
    this.onResize();
    // Recalculate mouse position for new scale
    Input.recalculateMousePosition();
  };

  decreaseScale = () => {
    GameConstants.DECREASE_SCALE();
    this.onResize();
    // Recalculate mouse position for new scale
    Input.recalculateMousePosition();
  };

  updateScale = (delta: number) => {
    if (GameConstants.smoothScaling) {
      if (
        GameConstants.SOFT_SCALE < GameConstants.SCALE &&
        Math.abs(GameConstants.SOFT_SCALE - GameConstants.SCALE) >= 0.1
      ) {
        GameConstants.SOFT_SCALE +=
          ((GameConstants.SCALE - GameConstants.SOFT_SCALE) * delta) / 10;
      }
      if (
        GameConstants.SOFT_SCALE > GameConstants.SCALE &&
        Math.abs(GameConstants.SOFT_SCALE - GameConstants.SCALE) >= 0.1
      ) {
        GameConstants.SOFT_SCALE -=
          ((GameConstants.SOFT_SCALE - GameConstants.SCALE) * delta) / 10;
      }

      if (
        GameConstants.SOFT_SCALE < GameConstants.SCALE &&
        Math.abs(GameConstants.SOFT_SCALE - GameConstants.SCALE) <= 0.1
      ) {
        GameConstants.SOFT_SCALE += delta / 25;
      }
      if (
        GameConstants.SOFT_SCALE > GameConstants.SCALE &&
        Math.abs(GameConstants.SOFT_SCALE - GameConstants.SCALE) <= 0.1
      ) {
        GameConstants.SOFT_SCALE -= delta / 25;
      }
      if (Math.abs(GameConstants.SOFT_SCALE - GameConstants.SCALE) <= 0.01) {
        GameConstants.SOFT_SCALE = GameConstants.SCALE;
      }
    } else {
      //GameConstants.SCALE = Math.floor(GameConstants.SCALE);
      GameConstants.SOFT_SCALE = GameConstants.SCALE;
    }

    this.onResize();
    // Recalculate mouse position for new scale
    Input.recalculateMousePosition();
  };

  refreshDimensions = () => {
    Game.ctx.canvas.setAttribute("width", `${GameConstants.WIDTH}`);
    Game.ctx.canvas.setAttribute("height", `${GameConstants.HEIGHT}`);
  };

  onResize = () => {
    if (
      this.localPlayerID !== undefined &&
      this.players?.[this.localPlayerID] &&
      this.players?.[this.localPlayerID]?.menu
    ) {
      this.players[this.localPlayerID].menu.positionButtons();
    }
    this.isMobile =
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
        navigator.userAgent,
      );

    GameConstants.isIOS =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      !navigator.userAgent.includes("Chrome DevTools");

    // Detect Safari browser and enable WebGL blur
    const isSafari =
      /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isSafari) {
      GameConstants.USE_WEBGL_BLUR = true;
      // Only set default once at initialization; do not override user choice during resize/scale changes
      if (GameConstants.SCALE === null) {
        GameConstants.SMOOTH_LIGHTING = false;
      }
    }

    // Define scale adjustment based on device pixel ratio
    if (GameConstants.SCALE === null) {
      GameConstants.SCALE = GameConstants.FIND_SCALE(this.isMobile);
      GameConstants.SOFT_SCALE = GameConstants.SCALE;
    }
    let scaleOffset = 0;

    // Calculate maximum possible scale based on window size
    let maxWidthScale = Math.floor(
      window.innerWidth / GameConstants.DEFAULTWIDTH,
    );
    let maxHeightScale = Math.floor(
      window.innerHeight / GameConstants.DEFAULTHEIGHT,
    );

    if (this.isMobile) {
      if (this.isMobile) console.log("Mobile detected");
      GameConstants.SHADE_LEVELS = 35;
      GameConstants.isMobile = true;
      LevelConstants.LIGHTING_ANGLE_STEP = 8;
      LevelConstants.LIGHTING_MAX_DISTANCE = 7;
      GameConstants.USE_WEBGL_BLUR = true;

      // Use smaller scale for mobile devices based on screen size
      // Adjust max scale with scaleOffset
      const integerScale = GameConstants.SOFT_SCALE + scaleOffset;
      Game.scale = Math.min(maxWidthScale, maxHeightScale, integerScale); // Cap at 3 + offset for mobile
    } else {
      GameConstants.isMobile = false;
      // For desktop, use standard scaling logic
      // Ensure GameConstants.SCALE is an integer. If not, round it.
      const integerScale = GameConstants.SOFT_SCALE + scaleOffset;
      Game.scale = Math.min(maxWidthScale, maxHeightScale, integerScale);
    }

    // Handle case where scale would be 0
    if (Game.scale === 0) {
      // Recalculate max scales without flooring to check for minimum scale
      maxWidthScale = window.innerWidth / GameConstants.DEFAULTWIDTH;
      maxHeightScale = window.innerHeight / GameConstants.DEFAULTHEIGHT;
      // Ensure Game.scale is at least 1 and an integer
      Game.scale = Math.max(
        1,
        Math.min(maxWidthScale, maxHeightScale, 1 + scaleOffset),
      );
    }

    // Apply device pixel ratio negation by setting scale to compensate for DPI
    const NEGATE_DPR_FACTOR = 1;
    Game.scale *= NEGATE_DPR_FACTOR / window.devicePixelRatio;

    // Calculate screen width and height in tiles, ensuring integer values
    LevelConstants.SCREEN_W = Math.floor(
      window.innerWidth / Game.scale / GameConstants.TILESIZE,
    );
    LevelConstants.SCREEN_H = Math.floor(
      window.innerHeight / Game.scale / GameConstants.TILESIZE,
    );

    // Calculate canvas width and height in pixels
    GameConstants.WIDTH = Math.floor(window.innerWidth / Game.scale);
    GameConstants.HEIGHT = Math.floor(window.innerHeight / Game.scale);

    // Set canvas width and height attributes
    Game.ctx.canvas.setAttribute("width", `${GameConstants.WIDTH}`);
    Game.ctx.canvas.setAttribute("height", `${GameConstants.HEIGHT}`);

    // Set CSS styles for scaling, applying negated DPR factor
    Game.ctx.canvas.setAttribute(
      "style",
      `width: ${GameConstants.WIDTH * Game.scale}px; height: ${
        GameConstants.HEIGHT * Game.scale
      }px;
      display: block;
      margin: 0 auto;
      image-rendering: optimizeSpeed; /* Older versions of FF */
      image-rendering: -moz-crisp-edges; /* FF 6.0+ */
      image-rendering: -webkit-optimize-contrast; /* Safari */
      image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
      image-rendering: pixelated; /* Future-browsers */
      -ms-interpolation-mode: nearest-neighbor; /* IE */
      `,
    );

    // Clear chat cache if width changed
    const newChatWidth = GameConstants.WIDTH - 20; // Account for margins
    if (newChatWidth !== this.lastChatWidth) {
      this.chat.forEach((msg) => msg.clearCache());
      this.lastChatWidth = newChatWidth;
    }

    // Clear alert cache if width changed
    const newAlertWidth = Math.floor(
      GameConstants.WIDTH * GameConstants.ALERT_MAX_WIDTH_RATIO,
    );
    if (newAlertWidth !== this.lastAlertWidth) {
      this.alerts?.forEach((a) => a.clearCache());
      this.alertGhosts?.forEach((g) => g.alert.clearCache());
      this.lastAlertWidth = newAlertWidth;
    }

    // Clear pointer cache if width changed
    const newPointerWidth = Math.floor(
      GameConstants.WIDTH * GameConstants.POINTER_MAX_WIDTH_RATIO,
    );
    if (newPointerWidth !== this.lastPointerWidth) {
      this.pointers?.forEach((p) => p.clearCache());
      this.lastPointerWidth = newPointerWidth;
    }
  };

  shakeScreen = (shakeX: number, shakeY: number, clamp: boolean = false) => {
    if (GameConstants.SCREEN_SHAKE_ENABLED) {
      let finalX = clamp ? Math.max(-3, Math.min(3, shakeX)) : shakeX;
      let finalY = clamp ? Math.max(-3, Math.min(3, shakeY)) : shakeY;

      this.screenShakeActive = true;
      this.screenShakeX += finalX;
      this.screenShakeY += finalY;
      this.shakeAmountX += Math.abs(finalX);
      this.shakeAmountY += Math.abs(finalY);
      if (finalX < 0 || finalY < 0) this.shakeFrame = (3 * Math.PI) / 2;
      if (finalX > 0 || finalY > 0) this.shakeFrame = Math.PI / 2;
      this.screenShakeCutoff = Date.now();
    }
  };

  drawRooms = (delta: number, skipLocalPlayer: boolean = false) => {
    if (!GameConstants.drawOtherRooms) {
      // Ensure current room is drawn even if flags are stale
      if (!this.room || this.room.pathId !== this.currentPathId) return;
      this.room.draw(delta);
      this.room.drawEntities(delta, true);
    } else if (GameConstants.drawOtherRooms) {
      // Create a sorted copy of the rooms array based on roomY + height
      const sortedRooms = this.rooms
        .filter((r) => r.pathId === this.currentPathId)
        .slice()
        .sort((a, b) => {
          const aPosition = a.roomY + a.height;
          const bPosition = b.roomY + b.height;
          return aPosition - bPosition; // Ascending order
        });

      for (const room of sortedRooms) {
        const shouldDraw =
          room === this.room || room.active || (room.entered && room.onScreen);
        if (shouldDraw) {
          room.draw(delta);

          room.drawEntities(delta, skipLocalPlayer);
          //room.drawShade(delta); // this used to come after the color layer
        }
      }
    }
  };

  drawRoomShadeAndColor = (delta: number) => {
    for (const room of this.rooms) {
      if (room.pathId !== this.currentPathId) continue;
      const shouldDraw = room === this.room || room.active || room.entered;
      if (shouldDraw) {
        if (
          GameConstants.SMOOTH_LIGHTING &&
          !GameConstants.SHADE_INLINE_IN_ENTITY_LAYER
        )
          room.drawShadeLayer();
        room.drawColorLayer();
        room.drawBloomLayer(delta);
      }
    }
    for (const room of this.rooms) {
      if (room.pathId !== this.currentPathId) continue;
      const shouldDrawOver =
        room === this.room || (room.active && room.entered);
      if (shouldDrawOver) {
        room.drawOverShade(delta);
      }
    }
  };

  static measureText = (text: string): { width: number; height: number } => {
    let w = 0;
    for (const letter of text.toLowerCase()) {
      if (letter === " ") w += 4;
      else
        for (let i = 0; i < Game.letters.length; i++) {
          if (Game.letters[i] === letter) {
            w += Game.letter_widths[i] + 1;
          }
        }
    }
    return { width: w, height: Game.letter_height };
  };

  static fillText = (text: string, x: number, y: number, maxWidth?: number) => {
    x = Math.round(x);
    y = Math.round(y);

    if (Game.letter_positions.length === 0) {
      // calculate letter positions
      for (let i = 0; i < Game.letter_widths.length; i++) {
        if (i === 0) Game.letter_positions[0] = 0;
        else
          Game.letter_positions[i] =
            Game.letter_positions[i - 1] + Game.letter_widths[i - 1] + 2;
      }
    } else {
      let dimensions = Game.measureText(text);
      if (dimensions.width > 0) {
        let key = text + Game.ctx.fillStyle;

        if (!Game.text_rendering_canvases[key]) {
          Game.text_rendering_canvases[key] = document.createElement("canvas");
          Game.text_rendering_canvases[key].width = dimensions.width;
          Game.text_rendering_canvases[key].height = dimensions.height;
          let bx = Game.text_rendering_canvases[key].getContext("2d");

          let letter_x = 0;
          for (const letter of text.toLowerCase()) {
            if (letter === " ") letter_x += 4;
            else
              for (let i = 0; i < Game.letters.length; i++) {
                if (Game.letters[i] === letter) {
                  bx.drawImage(
                    Game.fontsheet,
                    Game.letter_positions[i] + 1,
                    0,
                    Game.letter_widths[i],
                    Game.letter_height,
                    letter_x,
                    0,
                    Game.letter_widths[i],
                    Game.letter_height,
                  );
                  letter_x += Game.letter_widths[i] + 1;
                }
              }
          }
          bx.fillStyle = Game.ctx.fillStyle;
          bx.globalCompositeOperation = "source-in";
          bx.fillRect(
            0,
            0,
            Game.text_rendering_canvases[key].width,
            Game.text_rendering_canvases[key].height,
          );
          Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
        } else {
          Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
        }
      }
    }
  };

  static fillTextOutline = (
    text: string,
    x: number,
    y: number,
    outlineColor: string,
    fillColor: string,
  ) => {
    Game.ctx.fillStyle = outlineColor;
    for (let xx = -1; xx <= 1; xx++) {
      for (let yy = -1; yy <= 1; yy++) {
        Game.fillText(text, x + xx, y + yy);
      }
    }
    Game.ctx.fillStyle = fillColor;
    Game.fillText(text, x, y);
  };

  drawStartScreen = (delta: number) => {
    let startString = "Welcome to Turnarchist";

    Game.ctx.globalAlpha = this.startScreenAlpha;
    if (!this.started && !this.startedFadeOut) {
      this.startScreenAlpha = 1;
      if (this.startScreenAlpha <= 0) this.startScreenAlpha = 0;
    } else if (!this.started && this.startedFadeOut) {
      this.startScreenAlpha -= delta * 0.025;
      if (this.startScreenAlpha <= 0) {
        this.startScreenAlpha = 0;
        this.started = true;
        Sound.playAmbient();
      }
    }

    Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;

    // Draw CTA or menu buttons depending on startMenuActive
    if (!this.startMenuActive && !this.startedFadeOut) {
      Game.fillText(
        startString,
        GameConstants.WIDTH / 2 - Game.measureText(startString).width / 2,
        GameConstants.HEIGHT / 2 - Game.letter_height + 2,
      );
      let restartButton = "Press space or click to start";
      if (this.isMobile) restartButton = "Tap to start";
      Game.fillText(
        restartButton,
        GameConstants.WIDTH / 2 - Game.measureText(restartButton).width / 2,
        GameConstants.HEIGHT / 2 + Game.letter_height + 5,
      );
    } else {
      // Draw the start screen menu buttons (Continue/New Game)
      this.startMenu?.draw();
    }

    Game.ctx.globalAlpha = 1;
  };

  drawTipScreen = (delta: number) => {
    let tip = this.tip;

    Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;

    Game.fillText(
      tip,
      GameConstants.WIDTH / 2 - Game.measureText(tip).width / 2,
      GameConstants.HEIGHT / 2 - Game.letter_height + 2,
    );
  };

  draw = (delta: number) => {
    if (GameConstants.SOFT_SCALE !== GameConstants.SCALE) {
      this.updateScale(delta);
      this.onResize();
    }
    //Game.ctx.canvas.setAttribute("role", "presentation");

    Game.ctx.clearRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.save(); // Save the current canvas state

    // Reset transformations to ensure the black background covers the entire canvas
    Game.ctx.setTransform(1, 0, 0, 1, 0, 0);

    Game.ctx.globalAlpha = 1;
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    //if (this.room) Game.ctx.fillStyle = this.room.shadeColor;
    //else Game.ctx.fillStyle = "black";
    //Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    if (this.levelState === LevelState.TRANSITIONING) {
      this.screenShakeX = 0;
      this.screenShakeY = 0;
      this.screenShakeActive = false;

      let levelOffsetX = Math.floor(
        this.lerp(
          (Date.now() - this.transitionStartTime) /
            LevelConstants.LEVEL_TRANSITION_TIME,
          0,
          -this.transitionX,
        ),
      );
      let levelOffsetY = Math.floor(
        this.lerp(
          (Date.now() - this.transitionStartTime) /
            LevelConstants.LEVEL_TRANSITION_TIME,
          0,
          -this.transitionY,
        ),
      );
      let playerOffsetX = levelOffsetX - this.transitionX;
      let playerOffsetY = levelOffsetY - this.transitionY;

      let playerCX =
        (this.players[this.localPlayerID].x -
          this.players[this.localPlayerID].drawX +
          0.5) *
        GameConstants.TILESIZE;
      let playerCY =
        (this.players[this.localPlayerID].y -
          this.players[this.localPlayerID].drawY +
          0.5) *
        GameConstants.TILESIZE;

      const transitionCameraX = Math.round(
        playerCX + playerOffsetX - 0.5 * GameConstants.WIDTH,
      );
      const transitionCameraY = Math.round(
        playerCY + playerOffsetY - 0.5 * GameConstants.HEIGHT,
      );
      this.currentCameraOriginX = transitionCameraX;
      this.currentCameraOriginY = transitionCameraY;

      Game.ctx.translate(-transitionCameraX, -transitionCameraY);

      let extraTileLerp = Math.floor(
        this.lerp(
          (Date.now() - this.transitionStartTime) /
            LevelConstants.LEVEL_TRANSITION_TIME,
          0,
          GameConstants.TILESIZE,
        ),
      );

      let newLevelOffsetX = playerOffsetX;
      let newLevelOffsetY = playerOffsetY;

      if (this.sideTransition) {
        if (this.sideTransitionDirection > 0) {
          levelOffsetX += extraTileLerp;
          newLevelOffsetX += extraTileLerp + GameConstants.TILESIZE;
        } else {
          levelOffsetX -= extraTileLerp;
          newLevelOffsetX -= extraTileLerp + GameConstants.TILESIZE;
        }
      } else if (this.upwardTransition) {
        levelOffsetY -= extraTileLerp;
        newLevelOffsetY -= extraTileLerp + GameConstants.TILESIZE;
      } else {
        levelOffsetY += extraTileLerp;
        newLevelOffsetY += extraTileLerp + GameConstants.TILESIZE;
      }

      let ditherFrame = Math.floor(
        (7 * (Date.now() - this.transitionStartTime)) /
          LevelConstants.LEVEL_TRANSITION_TIME,
      );

      Game.ctx.translate(levelOffsetX, levelOffsetY);
      if (!GameConstants.drawOtherRooms) {
        this.prevLevel.draw(delta);
        this.prevLevel.drawEntities(delta);
        this.prevLevel.drawColorLayer();
        this.prevLevel.drawShade(delta);
        this.prevLevel.drawOverShade(delta);

        /*
        for (
          let x = this.prevLevel.roomX - 1;
          x <= this.prevLevel.roomX + this.prevLevel.width;
          x++
        ) {
          for (
            let y = this.prevLevel.roomY - 1;
            y <= this.prevLevel.roomY + this.prevLevel.height;
            y++
          ) {
            Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
          }
        }

      */
      }
      Game.ctx.translate(-levelOffsetX, -levelOffsetY);

      Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);

      if (GameConstants.drawOtherRooms) {
        this.drawRooms(delta, true);

        Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
        Game.ctx.translate(playerOffsetX, playerOffsetY);
        this.players[this.localPlayerID].draw(delta); // draw the translation

        Game.ctx.translate(-playerOffsetX, -playerOffsetY);
        Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);

        this.drawRoomShadeAndColor(delta);
      }

      for (
        let x = this.room.roomX - 1;
        x <= this.room.roomX + this.room.width;
        x++
      ) {
        for (
          let y = this.room.roomY - 1;
          y <= this.room.roomY + this.room.height;
          y++
        ) {
          //Game.drawFX(ditherFrame, 10, 1, 1, x, y, 1, 1);
        }
      }

      //this.drawStuff(delta);

      Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);

      Game.ctx.translate(transitionCameraX, transitionCameraY);

      this.players[this.localPlayerID].drawGUI(delta);
      this.justTransitioned = true;

      //for (const i in this.players) this.players[i].updateDrawXY(delta);
    } else if (this.levelState === LevelState.TRANSITIONING_LADDER) {
      let playerCX =
        (this.players[this.localPlayerID].x -
          this.players[this.localPlayerID].drawX +
          0.5) *
        GameConstants.TILESIZE;
      let playerCY =
        (this.players[this.localPlayerID].y -
          this.players[this.localPlayerID].drawY +
          0.5) *
        GameConstants.TILESIZE;

      const ladderCameraX = Math.round(playerCX - 0.5 * GameConstants.WIDTH);
      const ladderCameraY = Math.round(playerCY - 0.5 * GameConstants.HEIGHT);
      this.currentCameraOriginX = ladderCameraX;
      this.currentCameraOriginY = ladderCameraY;

      Game.ctx.translate(-ladderCameraX, -ladderCameraY);

      let deadFrames = 6;
      let ditherFrame = Math.floor(
        ((7 * 2 + deadFrames) * (Date.now() - this.transitionStartTime)) /
          LevelConstants.LEVEL_TRANSITION_TIME_LADDER,
      );

      Game.ctx.translate(ladderCameraX, ladderCameraY);

      if (ditherFrame < 7) {
        this.drawRooms(delta);
        this.drawRoomShadeAndColor(delta);

        if (!GameConstants.drawOtherRooms) {
          for (
            let x = this.room.roomX - 1;
            x <= this.room.roomX + this.room.width;
            x++
          ) {
            for (
              let y = this.room.roomY - 1;
              y <= this.room.roomY + this.room.height;
              y++
            ) {
              Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
            }
          }
        }
      } else if (ditherFrame >= 7 + deadFrames) {
        if (this.transitioningLadder) {
          // this.prevLevel = this.room;
          // this.room.exitLevel();
          this.room = this.transitioningLadder.linkedRoom;

          // this.players[this.localPlayerID].levelID = this.room.id;
          this.room.enterLevel(this.players[this.localPlayerID]);
          this.transitioningLadder = null;
        }

        this.drawRooms(delta);
        this.drawRoomShadeAndColor(delta);

        //        this.room.draw(delta);
        //        this.room.drawEntities(delta);
        //        this.drawStuff(delta);
        if (!GameConstants.drawOtherRooms) {
          for (
            let x = this.room.roomX - 1;
            x <= this.room.roomX + this.room.width;
            x++
          ) {
            for (
              let y = this.room.roomY - 1;
              y <= this.room.roomY + this.room.height;
              y++
            ) {
              Game.drawFX(ditherFrame - (7 + deadFrames), 10, 1, 1, x, y, 1, 1);
            }
          }
        }
      }
      //this.players[this.localPlayerID].drawGUI(delta);  // removed this to prevent drawing gui during level transition
      //for (const i in this.players) this.players[i].updateDrawXY(delta);
      this.drawTextScreen("loading level");
    } else if (this.levelState === LevelState.LEVEL_GENERATION) {
      this.levelgen.draw(delta);
    } else if (this.levelState === LevelState.IN_LEVEL) {
      // Start of Selection

      this.drawScreenShake(delta);

      const { cameraX, cameraY } = this.applyCamera(delta);

      Game.ctx.translate(-cameraX, -cameraY);
      this.drawRooms(delta);
      this.drawRoomShadeAndColor(delta);

      //      this.room.draw(delta);
      //      this.room.drawEntities(delta);

      // this.drawStuff(delta);

      Game.ctx.translate(cameraX, cameraY);

      this.room.drawTopLayer(delta);
      this.players[this.localPlayerID].drawGUI(delta);
      //for (const i in this.players) this.players[i].updateDrawXY(delta);
    }
    // Initialize tutorial pointers on first IN_LEVEL frame
    if (this.levelState === LevelState.IN_LEVEL && !this.startMenuActive) {
      if (!this.tutorialFlags.initPointers) {
        try {
          this.setupInitialPointers();
        } catch {}
        this.tutorialFlags.initPointers = true;
      }
    }
    // Draw pointers over GUI elements
    this.drawPointers(delta);
    this.drawChat(delta);
    this.drawAlerts(delta);

    // game version
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.1;
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(
      GameConstants.VERSION,
      GameConstants.WIDTH - Game.measureText(GameConstants.VERSION).width - 1,
      1,
    );
    Game.ctx.globalAlpha = 1;

    // fps
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.1;
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(fps + "fps", 1, 1);
    Game.ctx.globalAlpha = 1;
    if (!this.started && this.levelState !== LevelState.LEVEL_GENERATION) {
      this.drawStartScreen(delta * 10);
    }

    // Draw level generator if active
    if (this.currentLevelGenerator) {
      this.currentLevelGenerator.draw(10, 10, 3);
    }

    MouseCursor.getInstance().draw(delta, this.isMobile);
    Game.ctx.restore(); // Restore the canvas state
  };

  private drawPointers = (delta: number) => {
    if (!this.pointers || this.pointers.size === 0) return;
    // Only show in-level and when no start menu overlays
    if (this.levelState !== LevelState.IN_LEVEL) return;

    const list = Array.from(this.pointers.values()).sort(
      (a, b) => a.zIndex - b.zIndex,
    );
    // Track placed text bounds so we can avoid overlapping messages
    const placedTextRects: { x: number; y: number; w: number; h: number }[] =
      [];
    const now = Date.now();
    const toDelete: string[] = [];
    for (const p of list) {
      // Begin fade-out when dismissal conditions are met
      const triggerDismiss =
        p.until?.() === true ||
        p.safety?.some((fn) => fn()) === true ||
        (p.timeoutMs && now - p.createdAt > p.timeoutMs);
      if (triggerDismiss && p.dismissStartTime === null) {
        p.dismissStartTime = now;
      }

      const rect = p.resolver?.();
      if (!rect) continue;

      // Determine arrow direction
      let dir = p.arrowDirection;
      if (dir === "auto") dir = "down";

      // Compute text placement based on direction
      const LINE_HEIGHT = Game.letter_height + 1;
      const maxWidth = Math.max(
        1,
        Math.floor(
          GameConstants.WIDTH *
            (p.maxWidthRatio || GameConstants.POINTER_MAX_WIDTH_RATIO),
        ),
      );
      const lines = p.getWrappedLines(maxWidth);
      const blockHeight = lines.length * LINE_HEIGHT;
      const margin = 4;
      // Compute max line width for horizontal clamping
      let blockWidth = 0;
      for (let i = 0; i < lines.length; i++) {
        const w = Game.measureText(lines[i]).width;
        if (w > blockWidth) blockWidth = w;
      }

      let textX = 0;
      let textY = 0;
      if (dir === "down") {
        textX = Math.floor(rect.x + rect.w / 2);
        textY = Math.floor(rect.y - margin - blockHeight);
      } else if (dir === "up") {
        textX = Math.floor(rect.x + rect.w / 2);
        textY = Math.floor(rect.y + rect.h + margin);
      } else if (dir === "left") {
        textX = Math.floor(rect.x + rect.w + margin);
        textY = Math.floor(rect.y - Math.floor(blockHeight / 2));
      } else {
        // right
        textX = Math.floor(rect.x - margin);
        textY = Math.floor(rect.y - Math.floor(blockHeight / 2));
      }

      // Apply offsets and bob animation
      const t = Math.sin(((now % p.bobPeriodMs) / p.bobPeriodMs) * Math.PI * 2);
      const bob = Math.round(t * p.bobPx);
      textX += p.textDx;
      textY += p.textDy + (dir === "down" ? -bob : bob);

      // Avoid overlapping with previously placed pointer texts by nudging vertically
      const step = LINE_HEIGHT;
      const maxAdjustIterations = 25;
      const overlaps = (
        a: { x: number; y: number; w: number; h: number },
        b: { x: number; y: number; w: number; h: number },
      ) => {
        return !(
          a.x + a.w <= b.x ||
          b.x + b.w <= a.x ||
          a.y + a.h <= b.y ||
          b.y + b.h <= a.y
        );
      };

      let adjustCount = 0;
      while (adjustCount < maxAdjustIterations) {
        const blockX = Math.floor(textX - blockWidth / 2);
        const blockY = textY;
        const candidate = {
          x: blockX,
          y: blockY,
          w: blockWidth,
          h: blockHeight,
        };
        if (!placedTextRects.some((r) => overlaps(candidate, r))) {
          break;
        }
        // Direction-aware vertical stacking:
        // - For 'down' (text above target), move text further up.
        // - For others, move text down.
        if (dir === "down") {
          textY -= step;
        } else {
          textY += step;
        }
        adjustCount++;
      }

      // Clamp text block within screen bounds
      const minXCenter = margin + Math.floor(blockWidth / 2);
      const maxXCenter =
        GameConstants.WIDTH - margin - Math.floor(blockWidth / 2);
      if (textX < minXCenter) textX = minXCenter;
      if (textX > maxXCenter) textX = maxXCenter;
      const minYTop = margin;
      const maxYTop = GameConstants.HEIGHT - margin - blockHeight;
      if (textY < minYTop) textY = minYTop;
      if (textY > maxYTop) textY = maxYTop;

      // Remember the final text block rect for future overlap checks
      placedTextRects.push({
        x: Math.floor(textX - blockWidth / 2),
        y: textY,
        w: blockWidth,
        h: blockHeight,
      });

      // Compute alpha for fade-out
      let alpha = 1;
      if (p.dismissStartTime !== null) {
        const dt = now - p.dismissStartTime;
        alpha = 1 - Math.max(0, Math.min(1, dt / p.dismissDurationMs));
        if (dt >= p.dismissDurationMs) {
          toDelete.push(p.id);
        }
      }

      // Draw text block centered around textX horizontally
      let y = textY;
      Game.ctx.globalAlpha = alpha;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const w = Game.measureText(line).width;
        const x = Math.floor(textX - w / 2);
        Game.fillTextOutline(line, x, y, p.outlineColor, p.color);
        y += LINE_HEIGHT;
      }

      // Draw small triangle arrow with APEX fixed at target (rect edge)
      const drawArrowAtApex = (apx: number, apy: number, d: typeof dir) => {
        Game.ctx.fillStyle = GameConstants.POINTER_ARROW_COLOR;
        const s = Math.max(2, GameConstants.POINTER_ARROW_SIZE);
        if (d === "down") {
          // Apex at (apx, apy). Grow upward
          for (let i = 0; i < s; i++) {
            const w = 1 + 2 * i;
            Game.ctx.fillRect(apx - (w - 1) / 2, apy - i, w, 1);
          }
        } else if (d === "up") {
          // Apex at (apx, apy). Grow downward
          for (let i = 0; i < s; i++) {
            const w = 1 + 2 * i;
            Game.ctx.fillRect(apx - (w - 1) / 2, apy + i, w, 1);
          }
        } else if (d === "left") {
          // Apex at (apx, apy). Grow right
          for (let i = 0; i < s; i++) {
            const h = 1 + 2 * i;
            Game.ctx.fillRect(apx + i, apy - (h - 1) / 2, 1, h);
          }
        } else {
          // right: Apex at (apx, apy). Grow left
          for (let i = 0; i < s; i++) {
            const h = 1 + 2 * i;
            Game.ctx.fillRect(apx - i, apy - (h - 1) / 2, 1, h);
          }
        }
      };

      // Arrow anchored at the target rect edge (apex fixed), independent of text clamping
      Game.ctx.globalAlpha = alpha;
      if (dir === "down") {
        const apx = Math.floor(rect.x + rect.w / 2);
        const apy = Math.max(margin, rect.y - 1);
        drawArrowAtApex(apx, apy, "down");
      } else if (dir === "up") {
        const apx = Math.floor(rect.x + rect.w / 2);
        const apy = Math.min(
          GameConstants.HEIGHT - margin,
          rect.y + rect.h + 1,
        );
        drawArrowAtApex(apx, apy, "up");
      } else if (dir === "left") {
        const apx = Math.min(GameConstants.WIDTH - margin, rect.x + rect.w + 1);
        const apy = Math.floor(rect.y + rect.h / 2);
        drawArrowAtApex(apx, apy, "left");
      } else {
        const apx = Math.max(margin, rect.x - 1);
        const apy = Math.floor(rect.y + rect.h / 2);
        drawArrowAtApex(apx, apy, "right");
      }
      Game.ctx.globalAlpha = 1;
    }
    // Cleanup fully faded pointers
    for (const id of toDelete) this.pointers.delete(id);
  };

  private setupInitialPointers = () => {
    // Only for normal mode
    if (GameConstants.DEVELOPER_MODE) return;
    const player = this.players?.[this.localPlayerID];
    if (!player) return;
    const inv = player.inventory;
    if (!inv) return;

    // Pointer to quickbar slot 2 (index 1)
    const id = "equip-candle";
    if (this.pointers.has(id)) return;

    const resolver: PointerAnchorResolver = () => {
      return inv.getQuickbarSlotRect(1);
    };
    const until = () => {
      // Dismiss if candle equipped (by name to avoid import cycles)
      try {
        const items = inv.items;
        for (const it of items) {
          if ((it as any)?.equipped && (it as any)?.name === "candle") {
            return true;
          }
        }
      } catch {}
      return false;
    };
    const safety = [
      // dismiss if player dies or leaves gameplay context
      () => this.levelState !== LevelState.IN_LEVEL,
      () => player.dead,
    ];

    this.addPointer({
      id,
      text: "Equip Candle",
      resolver,
      until,
      safety,
      arrowDirection: "down",
      textDy: -2,
      timeoutMs: 60000,
      tags: ["tutorial"],
      zIndex: 10,
    });

    // Pointer to quickbar slot 3 (index 2) when the wooden shield is in inventory
    const shieldId = "equip-wooden-shield";
    if (!this.pointers.has(shieldId)) {
      let hasWoodenShield = false;
      try {
        for (const it of inv.items) {
          if ((it as any)?.name === "wooden shield") {
            hasWoodenShield = true;
            break;
          }
        }
      } catch {}

      if (hasWoodenShield) {
        const shieldResolver: PointerAnchorResolver = () =>
          inv.getQuickbarSlotRect(2);
        const shieldUntil = () => {
          try {
            for (const it of inv.items) {
              if (
                (it as any)?.equipped &&
                (it as any)?.name === "wooden shield"
              ) {
                return true;
              }
            }
          } catch {}
          return false;
        };

        this.addPointer({
          id: shieldId,
          text: "Equip Shield",
          resolver: shieldResolver,
          until: shieldUntil,
          safety,
          arrowDirection: "down",
          textDy: -2,
          timeoutMs: 60000,
          tags: ["tutorial"],
          zIndex: 10,
        });
      }
    }
  };

  // Show a pointer prompting the user to open the inventory when quickbar is full
  public maybeShowOpenInventoryPointer = () => {
    if (this.tutorialFlags.openInventoryShown) return;
    if (this.levelState !== LevelState.IN_LEVEL) return;
    const player = this.players?.[this.localPlayerID];
    const inv = player?.inventory;
    if (!inv || typeof inv.getInventoryButtonRect !== "function") return;

    const id = "open-inventory";
    const resolver: PointerAnchorResolver = () => inv.getInventoryButtonRect();
    const until = () => inv.isOpen === true;
    const safety = [
      () => this.levelState !== LevelState.IN_LEVEL,
      () => player.dead,
    ];

    this.addPointer({
      id,
      text: this.isMobile ? "Tap to open inventory" : "Click to open inventory",
      resolver,
      until,
      safety,
      arrowDirection: "down",
      textDy: -2,
      timeoutMs: 45000,
      tags: ["tutorial"],
      zIndex: 10,
    });
    this.tutorialFlags.openInventoryShown = true;
  };

  private drawAlerts = (delta: number) => {
    // Draw ghosts first (behind the main alert)
    if (this.alertGhosts && this.alertGhosts.length > 0) {
      const now = Date.now();
      // Keep only active ghosts
      this.alertGhosts = this.alertGhosts.filter(
        (g) => now - g.startTime <= g.duration,
      );
      for (const g of this.alertGhosts) {
        const age = now - g.startTime;
        const t = Math.min(1, Math.max(0, age / g.duration));
        const alpha = 1 - t;
        if (alpha <= 0) continue;
        const maxWidth = Math.max(
          1,
          Math.floor(
            GameConstants.WIDTH *
              (g.alert.maxWidthRatio || GameConstants.ALERT_MAX_WIDTH_RATIO),
          ),
        );
        const lines = g.alert.getWrappedLines(maxWidth);
        const LINE_HEIGHT = Game.letter_height + 1;
        const totalHeight = lines.length * LINE_HEIGHT;
        const baseY = Math.floor(GameConstants.HEIGHT / 2 - totalHeight / 2);
        const yOffset = -Math.floor(t * GameConstants.ALERT_REPLACE_FLOAT_PX);
        let y = baseY + yOffset;

        Game.ctx.globalAlpha = alpha;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const w = Game.measureText(line).width;
          const x = Math.floor(GameConstants.WIDTH / 2 - w / 2);
          Game.fillTextOutline(line, x, y, g.alert.outlineColor, g.alert.color);
          y += LINE_HEIGHT;
        }
        Game.ctx.globalAlpha = 1;
      }
    }

    if (!this.alerts || this.alerts.length === 0) return;
    const alert = this.alerts[0];

    const maxWidth = Math.max(
      1,
      Math.floor(
        GameConstants.WIDTH *
          (alert.maxWidthRatio || GameConstants.ALERT_MAX_WIDTH_RATIO),
      ),
    );
    const lines = alert.getWrappedLines(maxWidth);
    const LINE_HEIGHT = Game.letter_height + 1;

    const age = Date.now() - alert.timestamp;
    let alpha = 1;
    if (age <= alert.holdMs) {
      alpha = 1;
    } else if (age <= alert.holdMs + alert.fadeMs) {
      alpha = 1 - (age - alert.holdMs) / alert.fadeMs;
    } else {
      // Remove and try next alert
      this.alerts.shift();
      return this.drawAlerts(delta);
    }

    if (alpha <= 0) return;

    // Compute total height for vertical centering
    const totalHeight = lines.length * LINE_HEIGHT;
    let y = Math.floor(GameConstants.HEIGHT / 2 - totalHeight / 2);

    Game.ctx.globalAlpha = alpha;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const w = Game.measureText(line).width;
      const x = Math.floor(GameConstants.WIDTH / 2 - w / 2);
      Game.fillTextOutline(line, x, y, alert.outlineColor, alert.color);
      y += LINE_HEIGHT;
    }
    Game.ctx.globalAlpha = 1;
  };

  drawChat = (delta: number) => {
    const CHAT_X = 5;
    // Lift chat above the on-screen keyboard if enabled
    const keyboardOffset = GameConstants.MOBILE_KEYBOARD_SUPPORT
      ? Math.ceil(this.keyboardHeightPx / Game.scale)
      : 0;
    const CHAT_BOTTOM_Y =
      GameConstants.HEIGHT - Game.letter_height - 38 - keyboardOffset;
    const CHAT_OPACITY = this.players?.[this.localPlayerID]?.inventory.isOpen
      ? 0.05
      : 1;
    const CHAT_MAX_WIDTH = GameConstants.WIDTH - 5; // Leave some margin
    const LINE_HEIGHT = Game.letter_height + 1;
    const MAX_LINES_WHEN_CLOSED = 4;
    let linesRemaining = MAX_LINES_WHEN_CLOSED;

    if (this.chatOpen) {
      Game.ctx.fillStyle = "black";
      if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.75;
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      Game.ctx.globalAlpha = 1;
      Game.ctx.fillStyle = "white";
      Game.fillText(this.chatTextBox.text, CHAT_X, CHAT_BOTTOM_Y);
      const cursorX = Game.measureText(
        this.chatTextBox.text.substring(0, this.chatTextBox.cursor),
      ).width;
      Game.ctx.fillRect(CHAT_X + cursorX, CHAT_BOTTOM_Y, 1, Game.letter_height);
    }

    // Calculate total height needed for all visible messages
    let totalHeight = 0;
    const messageHeights: number[] = [];

    for (let i = 0; i < this.chat.length; i++) {
      const lines = this.chat[i].getWrappedLines(CHAT_MAX_WIDTH);
      const messageHeight = lines.length * LINE_HEIGHT;
      messageHeights.push(messageHeight);
      totalHeight += messageHeight;
    }

    // Draw messages from bottom to top
    let currentY = CHAT_BOTTOM_Y;
    if (this.chatOpen) {
      currentY -= LINE_HEIGHT; // Account for input line
    }

    for (let i = this.chat.length - 1; i >= 0; i--) {
      const message = this.chat[i];
      const lines = message.getWrappedLines(CHAT_MAX_WIDTH);
      const messageHeight = messageHeights[i];

      // Calculate opacity based on age
      const age = Date.now() - message.timestamp;
      let alpha = 1;

      if (!this.chatOpen) {
        if (age <= GameConstants.CHAT_APPEAR_TIME) {
          alpha = GameConstants.ALPHA_ENABLED ? CHAT_OPACITY : 1;
        } else if (
          age <=
          GameConstants.CHAT_APPEAR_TIME + GameConstants.CHAT_FADE_TIME
        ) {
          alpha = GameConstants.ALPHA_ENABLED
            ? CHAT_OPACITY *
              (1 -
                (age - GameConstants.CHAT_APPEAR_TIME) /
                  GameConstants.CHAT_FADE_TIME)
            : 1;
        } else {
          alpha = 0;
        }
      }

      let linesDrawnThisMessage = 0;
      if (alpha > 0) {
        // Set message color
        Game.ctx.fillStyle = "white";
        //if (message.message[0] === "/") {
        //  Game.ctx.fillStyle = GameConstants.GREEN;
        //}
        Game.ctx.globalAlpha = alpha;

        // Draw lines (respect max when chat is closed)
        let lineY = currentY;
        if (this.chatOpen) {
          for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex--) {
            Game.fillText(lines[lineIndex], CHAT_X, lineY);
            lineY -= LINE_HEIGHT;
          }
          linesDrawnThisMessage = lines.length;
        } else {
          const allowed = Math.max(0, linesRemaining);
          const drawCount = Math.min(lines.length, allowed);
          const startIndex = lines.length - drawCount;
          for (
            let lineIndex = lines.length - 1;
            lineIndex >= startIndex;
            lineIndex--
          ) {
            Game.fillText(lines[lineIndex], CHAT_X, lineY);
            lineY -= LINE_HEIGHT;
          }
          linesDrawnThisMessage = drawCount;
          linesRemaining -= drawCount;
        }
      }

      // Move up by the height that was actually drawn
      if (this.chatOpen) {
        currentY -= messageHeight;
      } else {
        currentY -= linesDrawnThisMessage * LINE_HEIGHT;
      }

      if (!this.chatOpen && linesRemaining <= 0) {
        break;
      }
    }

    // Reset alpha
    Game.ctx.globalAlpha = 1;
  };

  public isPointInChatHotspot(x: number, y: number): boolean {
    // Define a bottom-left area aligned with chat rendering baseline
    const margin = 5;
    const LINE_HEIGHT = Game.letter_height + 1;
    const inputLineHeight = LINE_HEIGHT + 4;
    // Match drawChat() constants
    const CHAT_X = 5;
    const CHAT_MAX_WIDTH = GameConstants.WIDTH - 5;
    const left = Math.max(0, CHAT_X - margin);
    const right = Math.min(GameConstants.WIDTH, CHAT_X + CHAT_MAX_WIDTH);
    const bottom = GameConstants.HEIGHT - margin;
    const top = Math.max(0, bottom - inputLineHeight - 10);
    return x >= left && x <= right && y >= top && y <= bottom;
  }

  targetCamera = (targetX: number, targetY: number) => {
    let cameraX = Math.round(
      (targetX + 0.5) * GameConstants.TILESIZE - 0.5 * GameConstants.WIDTH,
    );
    let cameraY = Math.round(
      (targetY + 0.5) * GameConstants.TILESIZE - 0.5 * GameConstants.HEIGHT,
    );
    this.cameraTargetX = cameraX;
    this.cameraTargetY = cameraY;
  };

  updateCamera = (delta: number) => {
    const dx = this.cameraTargetX - this.cameraX;
    const dy = this.cameraTargetY - this.cameraY;

    let speed = GameConstants.CAMERA_SPEED;

    if (this.justTransitioned) {
      speed = 1;
      this.justTransitioned = false;
    }

    if (this.cameraAnimation.active) {
      // While a camera animation is active, never hard-snap due to large distance
      // Speed up significantly if fast-forward is engaged
      speed = this.cameraAnimation.fast ? 0.5 : 0.075;
    } else if (Math.abs(dx) > 250 || Math.abs(dy) > 250) {
      // Only allow instant snaps when no animation is active
      speed = 1;
    }

    if ((Math.abs(dx) > 1 || Math.abs(dy) > 1) && speed !== 1) {
      this.cameraX += dx * speed * delta;
      this.cameraY += dy * speed * delta;
    } else {
      this.cameraX = this.cameraTargetX;
      this.cameraY = this.cameraTargetY;
    }
    //console.log("camera", this.cameraX, this.cameraY);
  };

  applyCamera = (delta: number) => {
    let player = this.players[this.localPlayerID];

    this.targetCamera(player.x - player.drawX, player.y - player.drawY);
    this.updateCameraAnimation(delta);
    this.updateCamera(delta);

    const roundedCameraX = Math.round(this.cameraX - this.screenShakeX);
    const roundedCameraY = Math.round(this.cameraY - this.screenShakeY);
    this.currentCameraOriginX = roundedCameraX;
    this.currentCameraOriginY = roundedCameraY;

    return {
      cameraX: roundedCameraX,
      cameraY: roundedCameraY,
    };
  };

  drawScreenShake = (delta: number) => {
    if (!this.screenShakeActive) {
      this.resetScreenShake();
      return;
    }

    this.shakeAmountX *= 0.8 ** delta;
    this.shakeAmountY *= 0.8 ** delta;
    this.screenShakeX = Math.sin(this.shakeFrame * Math.PI) * this.shakeAmountX;
    this.screenShakeY = Math.sin(this.shakeFrame * Math.PI) * this.shakeAmountY;
    this.shakeFrame += 0.15 * delta;

    if (
      Math.abs(this.shakeAmountX) < 0.5 &&
      Math.abs(this.shakeAmountY) < 0.5
    ) {
      this.resetScreenShake();
    }
  };

  private resetScreenShake = () => {
    this.shakeAmountX = 0;
    this.shakeAmountY = 0;
    this.shakeFrame = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
    this.screenShakeActive = false;
  };

  updateCameraAnimation = (delta: number) => {
    //console.log("updating camera animation", this.cameraAnimation.active);
    if (!this.cameraAnimation.active) return;
    const speed = this.cameraAnimation.fast ? 10 : 1;
    const elapsed =
      (this.cameraAnimation.frame / this.cameraAnimation.duration) * speed;

    if (elapsed < 0.6)
      this.targetCamera(this.cameraAnimation.x, this.cameraAnimation.y);
    // Accelerate frames if fast mode is enabled
    this.cameraAnimation.frame += delta * (this.cameraAnimation.fast ? 10 : 1);
    if (this.cameraAnimation.frame > this.cameraAnimation.duration)
      this.cameraAnimation.active = false;
  };

  // Allow skipping the active camera animation immediately
  skipCameraAnimation = () => {
    if (this.cameraAnimation.active) {
      this.cameraAnimation.active = false;
      // Snap camera to target to avoid mid-lerp offset
      this.cameraX = this.cameraTargetX;
      this.cameraY = this.cameraTargetY;
    }
  };

  startCameraAnimation = (x: number, y: number, duration: number) => {
    //console.log("starting camera animation", x, y, duration);
    this.cameraAnimation.active = true;
    this.cameraAnimation.x = x;
    this.cameraAnimation.y = y;
    this.cameraAnimation.duration = duration;
    this.cameraAnimation.frame = 0;
    this.cameraAnimation.fast = false;
    const skipMsg = this.isMobile
      ? "Tap to skip camera animation"
      : "Press space or click to skip camera animation";
    this.pushMessage(skipMsg);
  };

  drawTextScreen = (text: string, bg: boolean = true) => {
    if (bg) {
      Game.ctx.fillStyle = "rgb(0, 0, 0)";
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    }
    const ellipsis = this.animateEllipsis();
    const dimensions = Game.measureText(text + ellipsis);

    Game.ctx.fillStyle = "rgb(255, 255, 255)";
    Game.fillText(
      text + ellipsis,
      GameConstants.WIDTH / 2 - dimensions.width / 2,
      GameConstants.HEIGHT / 2 - dimensions.height / 2,
    );
  };

  animateEllipsis = () => {
    if (Date.now() - this.ellipsisStartTime > 150) {
      this.ellipsisStartTime = Date.now();
      this.ellipsisFrame = (this.ellipsisFrame + 1) % 4;
    }
    return ".".repeat(this.ellipsisFrame);
  };

  /**
   * Draw a sub-rectangle from a spritesheet onto the main canvas with optional shading and fade.
   *
   * How it works (high level):
   * - Quantizes the shade opacity to a fixed number of steps (reduces cache churn)
   * - Builds a cache key from the source sprite + shade settings
   * - If not cached, renders the shaded sprite once into an offscreen canvas and stores it
   * - Blits the cached shaded sprite to the destination on the main canvas
   *
   * Notes on units:
   * - sX/sY/sW/sH are in tile units within the spritesheet
   * - dX/dY/dW/dH are in world tile units on the destination
   * - Internally we multiply by TILESIZE when drawing to actual pixels
   *
   * @param set Image sheet to sample from (tileset/objset/mobset/itemset/fxset)
   * @param sX Source X in tiles within the sheet
   * @param sY Source Y in tiles within the sheet
   * @param sW Source width in tiles
   * @param sH Source height in tiles
   * @param dX Destination X in world tiles
   * @param dY Destination Y in world tiles
   * @param dW Destination width in world tiles
   * @param dH Destination height in world tiles
   * @param shadeColor Overlay color applied atop the sprite (default: black)
   * @param shadeOpacity Opacity of the overlay [0..1] (quantized internally)
   * @param entity If true, uses entity shade quantization levels
   * @param fadeDir Optional directional fade mask (left/right/up/down)
   */
  static drawHelper = (
    set: HTMLImageElement,
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    entity: boolean = false,
    fadeDir?: "left" | "right" | "up" | "down",
    outlineColor?: string,
    outlineOpacity: number = 0,
    outlineOffset: number = 0,
    outlineManhattan: boolean = false,
  ) => {
    Game.ctx.save(); // Save current canvas state so we can safely modify it

    // Snap to nearest shading increment
    const shadeLevel = entity
      ? GameConstants.ENTITY_SHADE_LEVELS
      : GameConstants.SHADE_LEVELS;
    shadeOpacity =
      // Round shadeOpacity to nearest increment based on shade levels (min 12 increments)
      // e.g. if shadeLevel=8, uses 12 increments, so opacity rounds to multiples of 1/12
      Math.round(shadeOpacity * Math.max(shadeLevel, 12)) /
      Math.max(shadeLevel, 12);

    // Build a cache key that includes shade amount, color and optional fade direction
    let key = getShadeCanvasKey(
      set,
      sX,
      sY,
      sW,
      sH,
      shadeOpacity,
      shadeColor,
      fadeDir,
    );
    if (outlineColor && outlineOpacity > 0)
      key += `,outline=${outlineColor}:${Math.max(0, Math.min(1, outlineOpacity))}`;
    if (outlineColor && outlineOpacity > 0 && outlineOffset)
      key += `,outlineOffset=${Math.max(0, Math.floor(outlineOffset))}`;
    if (outlineColor && outlineOpacity > 0 && outlineManhattan)
      key += `,outlineStyle=manhattan`;

    if (!Game.shade_canvases[key]) {
      // First time for this shaded sprite: render it into an offscreen canvas and cache it
      Game.shade_canvases[key] = document.createElement("canvas");
      const baseW = Math.round(sW * GameConstants.TILESIZE);
      const baseH = Math.round(sH * GameConstants.TILESIZE);
      const outlinePad =
        outlineColor && outlineOpacity > 0
          ? 1 + Math.max(0, Math.floor(outlineOffset))
          : 0; // pixels
      const extra =
        outlineColor && outlineOpacity > 0
          ? 2 + 2 * Math.max(0, Math.floor(outlineOffset))
          : 0;
      Game.shade_canvases[key].width = baseW + extra;
      Game.shade_canvases[key].height = baseH + extra;
      let shCtx = Game.shade_canvases[key].getContext("2d");

      shCtx.clearRect(
        0,
        0,
        Game.shade_canvases[key].width,
        Game.shade_canvases[key].height,
      );

      // 1) Draw the base sprite
      const dx = outlineColor && outlineOpacity > 0 ? outlinePad : 0;
      const dy = outlineColor && outlineOpacity > 0 ? outlinePad : 0;
      shCtx.globalCompositeOperation = "source-over";
      shCtx.drawImage(
        set,
        Math.round(sX * GameConstants.TILESIZE),
        Math.round(sY * GameConstants.TILESIZE),
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
        dx,
        dy,
        baseW,
        baseH,
      );

      // 2) Tint overlay (shadeColor at shadeOpacity) over the sprite area
      shCtx.globalAlpha = shadeOpacity;
      shCtx.fillStyle = shadeColor;
      shCtx.fillRect(
        0,
        0,
        Game.shade_canvases[key].width,
        Game.shade_canvases[key].height,
      );
      shCtx.globalAlpha = 1.0;

      // 3) Keep only the sprite’s opaque pixels by masking with the sprite alpha
      shCtx.globalCompositeOperation = "destination-in";
      // Base alpha mask from sprite bounds
      shCtx.drawImage(
        set,
        Math.round(sX * GameConstants.TILESIZE),
        Math.round(sY * GameConstants.TILESIZE),
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
        dx,
        dy,
        baseW,
        baseH,
      );

      // 4) Optional directional fade: multiplies in a 1→0 gradient (feathered edge)
      if (fadeDir) {
        const w = Game.shade_canvases[key].width;
        const h = Game.shade_canvases[key].height;
        let grad: CanvasGradient | null = null;
        switch (fadeDir) {
          case "left":
            grad = shCtx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,1)");
            break;
          case "right":
            grad = shCtx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, "rgba(0,0,0,1)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            break;
          case "up":
            grad = shCtx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, "rgba(0,0,0,1)");
            break;
          case "down":
            grad = shCtx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(0,0,0,1)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            break;
        }
        if (grad) {
          shCtx.globalCompositeOperation = "destination-in"; // multiply existing alpha
          shCtx.fillStyle = grad;
          shCtx.fillRect(0, 0, w, h);
        }
      }

      // 5) Optional colored outline behind the sprite
      if (outlineColor && outlineOpacity > 0) {
        const ringOuter = 1 + Math.max(0, Math.floor(outlineOffset)); // outer radius in px
        const oPad = ringOuter; // padding on each side
        const oW = baseW + 2 * oPad;
        const oH = baseH + 2 * oPad;
        const outlineCanvas = document.createElement("canvas");
        outlineCanvas.width = oW;
        outlineCanvas.height = oH;
        const oCtx = outlineCanvas.getContext("2d");

        // Helper to draw a dilated silhouette of the sprite using chosen metric
        const drawDilated = (
          ctx: CanvasRenderingContext2D,
          r: number,
          useManhattan: boolean,
        ) => {
          for (let offY = -r; offY <= r; offY++) {
            for (let offX = -r; offX <= r; offX++) {
              if (useManhattan && Math.abs(offX) + Math.abs(offY) > r) continue;
              ctx.drawImage(
                set,
                Math.round(sX * GameConstants.TILESIZE),
                Math.round(sY * GameConstants.TILESIZE),
                Math.round(sW * GameConstants.TILESIZE),
                Math.round(sH * GameConstants.TILESIZE),
                oPad + offX,
                oPad + offY,
                baseW,
                baseH,
              );
            }
          }
        };

        // Build outer mask (expanded by ringOuter)
        oCtx.globalCompositeOperation = "source-over";
        drawDilated(oCtx, ringOuter, outlineManhattan);

        // Subtract inner mask (expanded by ringOuter - 1) to create a 1px ring offset outward
        if (ringOuter - 1 >= 0) {
          const innerCanvas = document.createElement("canvas");
          innerCanvas.width = oW;
          innerCanvas.height = oH;
          const iCtx = innerCanvas.getContext("2d");
          drawDilated(iCtx, Math.max(0, ringOuter - 1), outlineManhattan);
          oCtx.globalCompositeOperation = "destination-out";
          oCtx.drawImage(innerCanvas, 0, 0);
          oCtx.globalCompositeOperation = "source-over";
        }

        // Tint the ring
        oCtx.globalCompositeOperation = "source-in";
        oCtx.globalAlpha = Math.max(0, Math.min(1, outlineOpacity));
        oCtx.fillStyle = outlineColor;
        oCtx.fillRect(0, 0, oW, oH);
        oCtx.globalCompositeOperation = "source-over";
        oCtx.globalAlpha = 1;

        // Place the outline behind the shaded sprite in the precomposited canvas
        shCtx.globalCompositeOperation = "destination-over";
        // Align top-left: shaded sprite started at dx,dy = outlinePad
        shCtx.drawImage(outlineCanvas, dx - oPad, dy - oPad);
        shCtx.globalCompositeOperation = "source-over";
      }
    }

    // Blit the pre-shaded sprite to the main canvas at the destination position/size
    Game.ctx.drawImage(
      Game.shade_canvases[key],
      Math.round(dX * GameConstants.TILESIZE) -
        (outlineColor && outlineOpacity > 0
          ? 1 + Math.max(0, Math.floor(outlineOffset))
          : 0),
      Math.round(dY * GameConstants.TILESIZE) -
        (outlineColor && outlineOpacity > 0
          ? 1 + Math.max(0, Math.floor(outlineOffset))
          : 0),
      Math.round(dW * GameConstants.TILESIZE) +
        (outlineColor && outlineOpacity > 0
          ? 2 + 2 * Math.max(0, Math.floor(outlineOffset))
          : 0),
      Math.round(dH * GameConstants.TILESIZE) +
        (outlineColor && outlineOpacity > 0
          ? 2 + 2 * Math.max(0, Math.floor(outlineOffset))
          : 0),
    );

    Game.ctx.restore(); // Restore the canvas to the previous state
  };

  /**
   * Draw a tile from the main tileset. Convenience wrapper around drawHelper.
   * Uses entity=false so the tile shade uses world/tile shade quantization.
   */
  static drawTile = (
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
  ) => {
    Game.drawHelper(
      Game.tileset,
      sX,
      sY,
      sW,
      sH,
      dX,
      dY,
      dW,
      dH,
      shadeColor,
      shadeOpacity,
      false,
      fadeDir,
    );
  };

  /**
   * Draw an object (props, decorations) from the object sheet. Convenience wrapper.
   * Uses entity=true so objects use entity shade quantization.
   */
  static drawObj = (
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
  ) => {
    Game.drawHelper(
      Game.objset,
      sX,
      sY,
      sW,
      sH,
      dX,
      dY,
      dW,
      dH,
      shadeColor,
      shadeOpacity,
      true,
      fadeDir,
    );
  };

  /**
   * Draw a mob (enemies, player parts) from the mob sheet. Convenience wrapper.
   * Uses entity=true so mobs use entity shade quantization.
   */
  static drawMob = (
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
    outlineColor?: string,
    outlineOpacity: number = 0,
    outlineOffset: number = 0,
    outlineManhattan: boolean = false,
  ) => {
    Game.drawHelper(
      Game.mobset,
      sX,
      sY,
      sW,
      sH,
      dX,
      dY,
      dW,
      dH,
      shadeColor,
      shadeOpacity,
      true,
      fadeDir,
      outlineColor,
      outlineOpacity,
      outlineOffset,
      outlineManhattan,
    );
  };

  /**
   * Draw an item from the item sheet. Convenience wrapper.
   * Uses entity=true so items use entity shade quantization.
   */
  static drawItem = (
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
    outlineColor?: string,
    outlineOpacity: number = 0,
    outlineOffset: number = 0,
    outlineManhattan: boolean = false,
  ) => {
    Game.drawHelper(
      Game.itemset,
      sX,
      sY,
      sW,
      sH,
      dX,
      dY,
      dW,
      dH,
      shadeColor,
      shadeOpacity,
      true,
      fadeDir,
      outlineColor,
      outlineOpacity,
      outlineOffset,
      outlineManhattan,
    );
  };

  /**
   * Draw an FX frame from the FX sheet. Convenience wrapper.
   * Uses entity=true so FX uses entity shade quantization.
   */
  static drawFX = (
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
  ) => {
    Game.drawHelper(
      Game.fxset,
      sX,
      sY,
      sW,
      sH,
      dX,
      dY,
      dW,
      dH,
      shadeColor,
      shadeOpacity,
      true,
      fadeDir,
    );
  };

  private handleWindowBlur = () => {
    // Start a timeout when window loses focus
    this.focusTimeout = window.setTimeout(() => {
      // Store current state
      this.wasMuted = Sound.audioMuted;
      this.wasStarted = this.started;

      // Mute audio and pause game
      Sound.audioMuted = true;
      //this.started = false;
      this.paused = true;

      // Optional: Show a message in chat
      this.pushMessage("Game paused - window inactive");
    }, this.FOCUS_TIMEOUT_DURATION);
  };

  private handleWindowFocus = () => {
    // Clear the timeout if it exists
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = null;
    }

    // If game was paused due to inactivity, restore previous state
    if (this.paused) {
      Sound.audioMuted = this.wasMuted;
      this.started = this.wasStarted;
      this.paused = false;

      // Optional: Show a message in chat
      this.pushMessage("Game resumed");
    }
  };

  destroy() {
    window.removeEventListener("blur", this.handleWindowBlur);
    window.removeEventListener("focus", this.handleWindowFocus);
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
    }
  }
}
export let game = new Game();
export let gs = new GameState();
