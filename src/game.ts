import { GameConstants } from "./gameConstants";
import { EnemyType, Room, RoomType } from "./room";
import { Player } from "./player";
import { Door } from "./tile/door";
import { Sound } from "./sound";
import { LevelConstants } from "./levelConstants";
import { LevelGenerator } from "./levelGenerator";
import { Input, InputEnum } from "./input";
import { DownLadder } from "./tile/downLadder";
import { TextBox } from "./textbox";
import { GameState, loadGameState } from "./gameState";
import { DoorDir } from "./tile/door";
import { Enemy } from "./entity/enemy/enemy";
import { TutorialListener } from "./tutorialListener";
import { MouseCursor } from "./mouseCursor";
import { PostProcessor } from "./postProcess";
import { globalEventBus } from "./eventBus";
import { ReverbEngine } from "./reverb";
import { Level } from "./level";
import { statsTracker } from "./stats";
import { EVENTS } from "./events";

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
  constructor(message: string) {
    this.message = message;
    this.timestamp = Date.now();
  }
}

let getShadeCanvasKey = (
  set: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  opacity: number,
): string => {
  return set.src + "," + sx + "," + sy + "," + sw + "," + sh + "," + opacity;
};

// fps counter
const times = [];
let fps = 60;

export class Game {
  static ctx: CanvasRenderingContext2D;
  static shade_canvases: Record<string, HTMLCanvasElement>;
  prevLevel: Room; // for transitions
  room: Room;
  rooms: Array<Room>;
  level: Level;
  levels: Array<Level>;
  levelgen: LevelGenerator;
  localPlayerID = "localplayer";
  players: Record<string, Player>;
  offlinePlayers: Record<string, Player>;
  levelState: LevelState;
  transitionStartTime: number;
  transitionX: number;
  transitionY: number;
  upwardTransition: boolean;
  sideTransition: boolean;
  sideTransitionDirection: number;
  transitioningLadder: any;
  screenShakeX: number;
  screenShakeY: number;
  shakeAmountX: number;
  shakeAmountY: number;
  shakeFrame: number;
  screenShakeCutoff: number;
  chat: Array<ChatMessage>;
  chatOpen: boolean;
  chatTextBox: TextBox;
  previousFrameTimestamp: number;

  mostRecentInputReceived = true;

  loginMessage: string = "";
  username: string;
  usernameTextBox: TextBox;
  passwordTextBox: TextBox;
  worldCodes: Array<string>;
  selectedWorldCode: number;
  tutorialActive: boolean;
  static scale;
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
  private startScreenAlpha = 1;

  static text_rendering_canvases: Record<string, HTMLCanvasElement>;
  static readonly letters = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/";
  static readonly letter_widths = [
    4, 4, 4, 4, 3, 3, 4, 4, 1, 4, 4, 3, 5, 5, 4, 4, 4, 4, 4, 3, 4, 5, 5, 5, 5,
    3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1, 1, 4, 1, 1, 2, 2, 2, 2, 5, 3, 3,
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

  constructor() {
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
      chatElement.style.position = "absolute";
      chatElement.style.left = "-1000px"; // Position off-screen
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
      Game.tileset.src = "res/tileset.png";
      Game.objset = new Image();
      Game.objset.onload = () => {
        resourcesLoaded++;
      };
      Game.objset.src = "res/objset.png";
      Game.mobset = new Image();
      Game.mobset.onload = () => {
        resourcesLoaded++;
      };
      Game.mobset.src = "res/mobset.png";
      Game.itemset = new Image();
      Game.itemset.onload = () => {
        resourcesLoaded++;
      };
      Game.itemset.src = "res/itemset.png";
      Game.fxset = new Image();
      Game.fxset.onload = () => {
        resourcesLoaded++;
      };
      Game.fxset.src = "res/fxset.png";
      Game.fontsheet = new Image();
      Game.fontsheet.onload = () => {
        resourcesLoaded++;
      };
      Game.fontsheet.src = "res/font.png";

      this.levelState = LevelState.LEVEL_GENERATION;

      let checkResourcesLoaded = () => {
        if (resourcesLoaded < NUM_RESOURCES) {
          window.setTimeout(checkResourcesLoaded, 500);
        } else {
          console.log("loaded all images");

          // proceed with constructor

          Game.scale = GameConstants.SCALE;

          Sound.loadSounds();
          Sound.playMusic(); // loops forever

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

          this.players = {};
          this.offlinePlayers = {};
          this.chatOpen = false;

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
        }
      };
      checkResourcesLoaded();
    });
    this.started = false;
    this.tutorialListener = new TutorialListener(this);
    this.setupEventListeners();
    ReverbEngine.initialize();

    globalEventBus.on(EVENTS.LEVEL_GENERATION_STARTED, () => {
      this.levelState = LevelState.LEVEL_GENERATION;
    });
    globalEventBus.on(EVENTS.LEVEL_GENERATION_COMPLETED, () => {
      this.levelState = LevelState.IN_LEVEL;
    });
  }

  newGame = () => {
    statsTracker.resetStats();
    this.encounteredEnemies = [];
    this.levels = [];
    let gs = new GameState();
    gs.seed = (Math.random() * 4294967296) >>> 0;
    gs.randomState = (Math.random() * 4294967296) >>> 0;
    loadGameState(this, [this.localPlayerID], gs, true);
    this.levelState = LevelState.LEVEL_GENERATION;
  };

  startGame = () => {
    this.started = true;
    Sound.ambientSound.play();
  };

  keyDownListener = (key: string) => {
    if (!this.started) {
      this.startedFadeOut = true;
      return;
    }
    if (!this.chatOpen) {
      switch (key.toUpperCase()) {
        case "C":
          this.chatOpen = true;
          break;
        case "/":
          this.chatOpen = true;
          this.chatTextBox.clear();
          this.chatTextBox.handleKeyPress(key);
          break;
        case "A":
        case "ARROWLEFT":
          this.players[this.localPlayerID].inputHandler(InputEnum.LEFT);
          break;
        case "D":
        case "ARROWRIGHT":
          this.players[this.localPlayerID].inputHandler(InputEnum.RIGHT);
          break;
        case "W":
        case "ARROWUP":
          this.players[this.localPlayerID].inputHandler(InputEnum.UP);
          break;
        case "S":
        case "ARROWDOWN":
          this.players[this.localPlayerID].inputHandler(InputEnum.DOWN);
          break;
        case " ":
          this.players[this.localPlayerID].inputHandler(InputEnum.SPACE);
          break;
        case "I":
          this.players[this.localPlayerID].inputHandler(InputEnum.I);
          break;
        case "Q":
          this.players[this.localPlayerID].inputHandler(InputEnum.Q);
          break;
        case "1":
          LevelGenerator.ANIMATION_CONSTANT = 1;
          break;
        case "2":
          LevelGenerator.ANIMATION_CONSTANT = 2;
          break;
        case "3":
          LevelGenerator.ANIMATION_CONSTANT = 5;
          break;
        case "4":
          LevelGenerator.ANIMATION_CONSTANT = 10000;
          break;
        case "0":
          LevelGenerator.ANIMATION_CONSTANT = 0;
          break;
      }
    } else {
      this.chatTextBox.handleKeyPress(key);
    }
  };

  changeLevel = (player: Player, newLevel: Room) => {
    player.levelID = this.rooms.indexOf(newLevel);
    if (this.players[this.localPlayerID] === player) {
      //this.level.exitLevel();
      this.room = newLevel;
    }
    newLevel.enterLevel(player);
  };

  changeLevelThroughLadder = (player: Player, ladder: any) => {
    player.levelID = this.rooms.indexOf(ladder.linkedLevel);

    if (ladder instanceof DownLadder) {
      player.map.saveOldMap();
      ladder.generate();
      //let newLevel = new Level(1);
    }

    if (this.players[this.localPlayerID] === player) {
      this.levelState = LevelState.TRANSITIONING_LADDER;
      this.transitionStartTime = Date.now();
      this.transitioningLadder = ladder;
    } else {
      ladder.linkedLevel.enterLevel(player, ladder.linkedLevel); // since it's not a local player, don't wait for transition
    }
  };

  changeLevelThroughDoor = (player: Player, door: any, side?: number) => {
    player.levelID = this.rooms.indexOf(door.room);

    if (this.players[this.localPlayerID] === player) {
      this.levelState = LevelState.TRANSITIONING;
      this.transitionStartTime = Date.now();

      let oldX = this.players[this.localPlayerID].x;
      let oldY = this.players[this.localPlayerID].y;

      this.prevLevel = this.room;
      //this.level.exitLevel();
      this.room = door.room;
      door.room.enterLevelThroughDoor(player, door, side);

      this.transitionX =
        (this.players[this.localPlayerID].x - oldX) * GameConstants.TILESIZE;
      this.transitionY =
        (this.players[this.localPlayerID].y - oldY) * GameConstants.TILESIZE;

      this.upwardTransition = false;
      this.sideTransition = false;
      this.sideTransitionDirection = side;
      if (
        door instanceof Door &&
        [Direction.RIGHT, Direction.LEFT].includes(door.doorDir)
      )
        this.sideTransition = true;
      else if (door instanceof Door && door.doorDir === Direction.DOWN)
        this.upwardTransition = true;
    } else {
      door.room.enterLevelThroughDoor(player, door, side);
    }
    player.map.saveMapData();
  };

  run = (timestamp: number) => {
    if (!this.previousFrameTimestamp) this.previousFrameTimestamp = timestamp;

    // normalized so 1.0 = 60fps
    let delta = Math.min(
      ((timestamp - this.previousFrameTimestamp) * 60) / 1000.0,
      100,
    );

    while (times.length > 0 && times[0] <= timestamp - 1000) {
      times.shift();
    }
    times.push(timestamp);
    fps = times.length;

    if (
      Math.floor(timestamp / (1000 / 60)) >
      Math.floor(this.previousFrameTimestamp / (1000 / 60))
    ) {
      this.update();
    }

    this.draw(delta * GameConstants.ANIMATION_SPEED * 0.8);
    window.requestAnimationFrame(this.run);

    this.previousFrameTimestamp = timestamp;
  };

  update = () => {
    Input.checkIsTapHold();

    if (
      Input.lastPressTime !== 0 &&
      Date.now() - Input.lastPressTime > GameConstants.KEY_REPEAT_TIME
    ) {
      Input.onKeydown({
        repeat: false,
        key: Input.lastPressKey,
      } as KeyboardEvent);
    }

    if (this.levelState === LevelState.TRANSITIONING) {
      if (
        Date.now() - this.transitionStartTime >=
        LevelConstants.LEVEL_TRANSITION_TIME
      ) {
        this.levelState = LevelState.IN_LEVEL;
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
        this.rooms[this.players[i].levelID].update();

        if (this.players[i].dead) {
          for (const j in this.players) {
            this.players[j].dead = true;
          }
        }
      }
    }
  };

  lerp = (a: number, b: number, t: number): number => {
    return (1 - t) * a + t * b;
  };

  pushMessage = (message: string) => {
    this.chat.push(new ChatMessage(message));
  };

  commandHandler = (command: string): void => {
    const player = this.room.game.players[0];
    command = command.toLowerCase();
    switch (command) {
      case "devmode":
        GameConstants.DEVELOPER_MODE = !GameConstants.DEVELOPER_MODE;
        console.log(`Developer mode is now ${GameConstants.DEVELOPER_MODE}`);
        break;
      case "new":
        this.newGame();
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
            e.kill();
          });
        }
        break;
      default:
        if (command.startsWith("new ")) {
          this.room.addNewEnemy(command.slice(4) as EnemyType);
        }
        break;
    }
  };

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("ChatMessage", this.commandHandler.bind(this));
    console.log("Event listeners set up");
  }

  onResize = () => {
    let maxWidthScale = Math.floor(
      window.innerWidth / GameConstants.DEFAULTWIDTH,
    );
    let maxHeightScale = Math.floor(
      window.innerHeight / GameConstants.DEFAULTHEIGHT,
    );

    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (this.isMobile) {
      this.pushMessage("mobile detected");
      // Adjust scale for mobile devices
      Game.scale = 2; // Example: limit scale to 2 for mobile
    } else {
      Game.scale = GameConstants.SCALE;
      Game.scale = Math.min(maxWidthScale, maxHeightScale);
    }

    Game.scale = Math.min(maxWidthScale, maxHeightScale);
    if (Game.scale === 0) {
      maxWidthScale = window.innerWidth / GameConstants.DEFAULTWIDTH;
      maxHeightScale = window.innerHeight / GameConstants.DEFAULTHEIGHT;
    }
    Game.scale = GameConstants.SCALE; //Math.min(maxWidthScale, maxHeightScale);

    LevelConstants.SCREEN_W = Math.floor(
      window.innerWidth / Game.scale / GameConstants.TILESIZE,
    );
    LevelConstants.SCREEN_H = Math.floor(
      window.innerHeight / Game.scale / GameConstants.TILESIZE,
    );
    GameConstants.WIDTH = LevelConstants.SCREEN_W * GameConstants.TILESIZE;
    GameConstants.HEIGHT = LevelConstants.SCREEN_H * GameConstants.TILESIZE;
    Game.ctx.canvas.setAttribute("width", `${GameConstants.WIDTH}`);
    Game.ctx.canvas.setAttribute("height", `${GameConstants.HEIGHT}`);
    Game.ctx.canvas.setAttribute(
      "style",
      `width: ${GameConstants.WIDTH * Game.scale}px; height: ${
        GameConstants.HEIGHT * Game.scale
      }px;
    display: block;
    margin: 0 auto;
  
    image-rendering: optimizeSpeed; /* Older versions of FF          */
    image-rendering: -moz-crisp-edges; /* FF 6.0+                       */
    image-rendering: -webkit-optimize-contrast; /* Safari                        */
    image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
    image-rendering: pixelated; /* Awesome future-browsers       */
  
    -ms-interpolation-mode: nearest-neighbor;`,
    );
    //Game.ctx.canvas.width = window.innerWidth;
    //Game.ctx.canvas.height = window.innerHeight;
  };

  shakeScreen = (shakeX: number, shakeY: number) => {
    this.screenShakeX = 0;
    this.screenShakeY = 0;
    this.shakeAmountX = 0;
    this.shakeAmountY = 0;
    this.screenShakeActive = true;
    this.screenShakeX = shakeX;
    this.screenShakeY = shakeY;
    this.shakeAmountX = Math.abs(shakeX);
    this.shakeAmountY = Math.abs(shakeY);
    if (shakeX < 0 || shakeY < 0) this.shakeFrame = (3 * Math.PI) / 2;
    if (shakeX > 0 || shakeY > 0) this.shakeFrame = Math.PI / 2;
    this.screenShakeCutoff = Date.now();
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

  drawStuff = (delta: number) => {
    this.room.drawColorLayer();
    this.room.drawShade(delta);
    this.room.drawOverShade(delta);
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

    Game.ctx.globalAlpha = 1;
  };

  draw = (delta: number) => {
    Game.ctx.globalAlpha = 1;
    if (this.room) Game.ctx.fillStyle = this.room.shadeColor;
    else Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    if (this.levelState === LevelState.TRANSITIONING) {
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

      Game.ctx.translate(
        -Math.round(playerCX + playerOffsetX - 0.5 * GameConstants.WIDTH),
        -Math.round(playerCY + playerOffsetY - 0.5 * GameConstants.HEIGHT),
      );

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
      this.prevLevel.draw(delta);
      this.prevLevel.drawEntities(delta);
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
      Game.ctx.translate(-levelOffsetX, -levelOffsetY);

      Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
      this.room.draw(delta);
      this.room.drawEntities(delta, true);
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
          Game.drawFX(ditherFrame, 10, 1, 1, x, y, 1, 1);
        }
      }
      Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);

      Game.ctx.translate(playerOffsetX, playerOffsetY);
      this.players[this.localPlayerID].draw(delta);

      Game.ctx.translate(-playerOffsetX, -playerOffsetY);
      Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);

      this.drawStuff(delta);

      Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);

      Game.ctx.translate(
        Math.round(playerCX + playerOffsetX - 0.5 * GameConstants.WIDTH),
        Math.round(playerCY + playerOffsetY - 0.5 * GameConstants.HEIGHT),
      );

      this.players[this.localPlayerID].drawGUI(delta);

      for (const i in this.players) this.players[i].updateDrawXY(delta);
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

      Game.ctx.translate(
        -Math.round(playerCX - 0.5 * GameConstants.WIDTH),
        -Math.round(playerCY - 0.5 * GameConstants.HEIGHT),
      );

      let deadFrames = 6;
      let ditherFrame = Math.floor(
        ((7 * 2 + deadFrames) * (Date.now() - this.transitionStartTime)) /
          LevelConstants.LEVEL_TRANSITION_TIME_LADDER,
      );

      if (ditherFrame < 7) {
        this.room.draw(delta);
        this.room.drawEntities(delta);

        this.drawStuff(delta);

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
      } else if (ditherFrame >= 7 + deadFrames) {
        if (this.transitioningLadder) {
          this.prevLevel = this.room;
          this.room.exitLevel();
          this.room = this.transitioningLadder.linkedLevel;

          this.room.enterLevel(this.players[this.localPlayerID]);
          this.transitioningLadder = null;
        }

        this.room.draw(delta);
        this.room.drawEntities(delta);

        this.drawStuff(delta);

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
      Game.ctx.translate(
        Math.round(playerCX - 0.5 * GameConstants.WIDTH),
        Math.round(playerCY - 0.5 * GameConstants.HEIGHT),
      );

      this.players[this.localPlayerID].drawGUI(delta);
      for (const i in this.players) this.players[i].updateDrawXY(delta);
    } else if (this.levelState === LevelState.LEVEL_GENERATION) {
      this.levelgen.draw(delta);
    } else if (this.levelState === LevelState.IN_LEVEL) {
      // Start of Selection

      if (this.screenShakeActive) {
        //const decayFactor = 1 - 0.15 * delta;
        const decayFactor =
          3 / Math.sqrt((Date.now() + 30 - this.screenShakeCutoff) * delta);
        this.shakeAmountX -= this.shakeAmountX * 0.1 * delta;
        this.shakeAmountY -= this.shakeAmountY * 0.1 * delta;
        this.screenShakeX =
          Math.sin(this.shakeFrame * Math.PI) * this.shakeAmountX * decayFactor;
        this.screenShakeY =
          Math.sin(this.shakeFrame * Math.PI) * this.shakeAmountY * decayFactor;
        this.shakeFrame += 0.3 * delta;

        if (Math.abs(decayFactor) < 0.001) {
          this.shakeAmountX = 0;
          this.shakeAmountY = 0;
          this.shakeFrame = 0;
          this.screenShakeX = 0;
          this.screenShakeY = 0;
          this.screenShakeActive = false;
        }
      }

      let playerDrawX = this.players[this.localPlayerID].drawX;
      let playerDrawY = this.players[this.localPlayerID].drawY;

      let cameraX = Math.round(
        (this.players[this.localPlayerID].x - playerDrawX + 0.5) *
          GameConstants.TILESIZE -
          0.5 * GameConstants.WIDTH -
          this.screenShakeX,
      );
      let cameraY = Math.round(
        (this.players[this.localPlayerID].y - playerDrawY + 0.5) *
          GameConstants.TILESIZE -
          0.5 * GameConstants.HEIGHT -
          this.screenShakeY,
      );

      Game.ctx.translate(-cameraX, -cameraY);
      this.room.draw(delta);
      this.room.drawEntities(delta);

      this.drawStuff(delta);

      this.players[this.localPlayerID].drawTopLayer(delta);
      Game.ctx.translate(cameraX, cameraY);

      this.room.drawTopLayer(delta);
      this.players[this.localPlayerID].drawGUI(delta);
      for (const i in this.players) this.players[i].updateDrawXY(delta);
    }
    // draw chat
    let CHAT_X = 10;
    let CHAT_BOTTOM_Y = GameConstants.HEIGHT - Game.letter_height - 32;
    let CHAT_OPACITY = 0.5;
    if (this.chatOpen) {
      Game.ctx.fillStyle = "black";
      if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.75;
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      Game.ctx.globalAlpha = 1;
      Game.ctx.fillStyle = "white";
      Game.fillText(this.chatTextBox.text, CHAT_X, CHAT_BOTTOM_Y);
      let cursorX = Game.measureText(
        this.chatTextBox.text.substring(0, this.chatTextBox.cursor),
      ).width;
      Game.ctx.fillRect(CHAT_X + cursorX, CHAT_BOTTOM_Y, 1, Game.letter_height);
    }
    for (let i = 0; i < this.chat.length; i++) {
      Game.ctx.fillStyle = "white";
      if (this.chat[i][0] === "/") Game.ctx.fillStyle = GameConstants.GREEN;
      let y =
        CHAT_BOTTOM_Y - (this.chat.length - 1 - i) * (Game.letter_height + 1);
      if (this.chatOpen) y -= Game.letter_height + 1;

      let age = Date.now() - this.chat[i].timestamp;
      if (this.chatOpen) {
        Game.ctx.globalAlpha = 1;
      } else {
        if (age <= GameConstants.CHAT_APPEAR_TIME) {
          if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = CHAT_OPACITY;
        } else if (
          age <=
          GameConstants.CHAT_APPEAR_TIME + GameConstants.CHAT_FADE_TIME
        ) {
          if (GameConstants.ALPHA_ENABLED)
            Game.ctx.globalAlpha =
              CHAT_OPACITY *
              (1 -
                (age - GameConstants.CHAT_APPEAR_TIME) /
                  GameConstants.CHAT_FADE_TIME);
        } else {
          Game.ctx.globalAlpha = 0;
        }
      }
      Game.fillText(this.chat[i].message, CHAT_X, y);
    }

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
    if (!this.started) this.drawStartScreen(delta);
    MouseCursor.getInstance().draw();
  };

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
  ) => {
    // snap to nearest shading increment
    shadeOpacity =
      Math.round(shadeOpacity * GameConstants.SHADE_LEVELS) /
      GameConstants.SHADE_LEVELS;
    let key = getShadeCanvasKey(set, sX, sY, sW, sH, shadeOpacity);
    if (!Game.shade_canvases[key]) {
      Game.shade_canvases[key] = document.createElement("canvas");
      Game.shade_canvases[key].width = Math.round(sW * GameConstants.TILESIZE);
      Game.shade_canvases[key].height = Math.round(sH * GameConstants.TILESIZE);
      let shCtx = Game.shade_canvases[key].getContext("2d");

      shCtx.clearRect(
        0,
        0,
        Game.shade_canvases[key].width,
        Game.shade_canvases[key].height,
      );

      shCtx.globalCompositeOperation = "source-over";
      shCtx.drawImage(
        set,
        Math.round(sX * GameConstants.TILESIZE),
        Math.round(sY * GameConstants.TILESIZE),
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
        0,
        0,
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
      );

      shCtx.globalAlpha = shadeOpacity;
      shCtx.fillStyle = shadeColor;
      shCtx.fillRect(
        0,
        0,
        Game.shade_canvases[key].width,
        Game.shade_canvases[key].height,
      );
      shCtx.globalAlpha = 1.0;

      shCtx.globalCompositeOperation = "destination-in";
      shCtx.drawImage(
        set,
        Math.round(sX * GameConstants.TILESIZE),
        Math.round(sY * GameConstants.TILESIZE),
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
        0,
        0,
        Math.round(sW * GameConstants.TILESIZE),
        Math.round(sH * GameConstants.TILESIZE),
      );
    }
    Game.ctx.drawImage(
      Game.shade_canvases[key],
      Math.round(dX * GameConstants.TILESIZE),
      Math.round(dY * GameConstants.TILESIZE),
      Math.round(dW * GameConstants.TILESIZE),
      Math.round(dH * GameConstants.TILESIZE),
    );
  };

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
    );

    /*Game.ctx.drawImage(
      Game.tileset,
      Math.round(sX * GameConstants.TILESIZE),
      Math.round(sY * GameConstants.TILESIZE),
      Math.round(sW * GameConstants.TILESIZE),
      Math.round(sH * GameConstants.TILESIZE),
      Math.round(dX * GameConstants.TILESIZE),
      Math.round(dY * GameConstants.TILESIZE),
      Math.round(dW * GameConstants.TILESIZE),
      Math.round(dH * GameConstants.TILESIZE)
    );

    if (GameConstants.ALPHA_ENABLED) {
      Game.ctx.globalAlpha = shadeOpacity;
      Game.ctx.fillStyle = shadeColor;
      Game.ctx.fillRect(
        Math.round(dX * GameConstants.TILESIZE),
        Math.round(dY * GameConstants.TILESIZE),
        Math.round(dW * GameConstants.TILESIZE),
        Math.round(dH * GameConstants.TILESIZE)
      );
      Game.ctx.globalAlpha = 1.0;
    }*/
  };

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
    );
  };

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
    );
  };

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
    );
  };

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
    );
  };
}

let game = new Game();
