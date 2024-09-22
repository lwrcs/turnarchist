import { GameConstants } from "./gameConstants";
import { Room } from "./room";
import { Player } from "./player";
import { Door } from "./tile/door";
import { Sound } from "./sound";
import { LevelConstants } from "./levelConstants";
import { LevelGenerator } from "./levelGenerator";
import { Input, InputEnum } from "./input";
import { DownLadder } from "./tile/downLadder";
import { io } from "socket.io-client";
import { ServerAddress } from "./serverAddress";
import { TextBox } from "./textbox";
import { createGameState, GameState, loadGameState } from "./gameState";
import { Random } from "./random";
import { DoorDir } from "./tile/door";
import { Level } from "./level";

export enum LevelState {
  IN_LEVEL,
  TRANSITIONING,
  TRANSITIONING_LADDER,
}

export enum Direction {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest,
  Center,
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
  opacity: number
): string => {
  return set.src + "," + sx + "," + sy + "," + sw + "," + sh + "," + opacity;
};

export enum MenuState {
  LOADING,
  LOGIN_USERNAME,
  LOGIN_PASSWORD,
  SELECT_WORLD,
  IN_GAME,
}

// fps counter
const times = [];
let fps;

export class Game {
  static ctx: CanvasRenderingContext2D;
  static shade_canvases: Record<string, HTMLCanvasElement>;
  prevLevel: Room; // for transitions
  room: Room;
  rooms: Array<Room>;
  levelgen: LevelGenerator;
  localPlayerID: string;
  players: Record<string, Player>;
  offlinePlayers: Record<string, Player>;
  menuState: MenuState;
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
  socket;
  chat: Array<ChatMessage>;
  chatOpen: boolean;
  chatTextBox: TextBox;
  previousFrameTimestamp: number;

  input_history = [];

  mostRecentInputReceived = true;

  loginMessage: string = "";
  username: string;
  usernameTextBox: TextBox;
  passwordTextBox: TextBox;
  worldCodes: Array<string>;
  selectedWorldCode: number;

  static scale;
  static tileset: HTMLImageElement;
  static objset: HTMLImageElement;
  static mobset: HTMLImageElement;
  static itemset: HTMLImageElement;
  static fxset: HTMLImageElement;
  static fontsheet: HTMLImageElement;

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

  constructor() {
    window.addEventListener("load", () => {
      this.socket = io(ServerAddress.address, { transports: ["websocket"] });
      this.socket.on("new connect", () => {
        if (this.menuState !== MenuState.LOADING)
          //what sets the menu state??
          this.loginMessage = "disconnected";
        this.menuState = MenuState.LOGIN_USERNAME;
      });
      this.socket.on("unrecognized session", () => {
        this.loginMessage = "unrecognized session";
        this.menuState = MenuState.LOGIN_USERNAME;
      });
      this.socket.on("incorrect password", () => {
        this.passwordTextBox.clear();
        this.loginMessage = "incorrect password, try again";
        this.menuState = MenuState.LOGIN_USERNAME;
      });
      this.socket.on("login already active", () => {
        this.usernameTextBox.clear();
        this.passwordTextBox.clear();
        this.loginMessage = "account currently logged in";
        this.menuState = MenuState.LOGIN_USERNAME;
      });
      this.socket.on("logged in", () => {
        this.socket.emit("get available worlds");
        this.menuState = MenuState.SELECT_WORLD;
      });
      this.socket.on("world codes", (codes) => {
        this.worldCodes = codes;
        this.selectedWorldCode = 0;
      });
      this.socket.on(
        "welcome",
        (activeUsernames: Array<string>, state: GameState) => {
          this.players = {};
          this.offlinePlayers = {};
          loadGameState(this, activeUsernames, state);
          this.chatOpen = false;

          this.screenShakeX = 0;
          this.screenShakeY = 0;

          this.menuState = MenuState.IN_GAME;
          this.levelState = LevelState.IN_LEVEL;
        }
      );
      this.socket.on("get state", () => {
        this.socket.emit("game state", createGameState(this));
      });
      this.socket.on(
        "input",
        (tickPlayerID: string, input: InputEnum, randState: number) => {
          if (Random.state !== randState) {
            this.chat.push(new ChatMessage("RAND STATES OUT OF SYNC"));
            this.chat.push(new ChatMessage("Received " + randState));
            this.chat.push(new ChatMessage("Current " + Random.state));
          }

          let decode_input = (input: InputEnum): string => {
            if (input === InputEnum.I) return "I";
            if (input === InputEnum.Q) return "Q";
            if (input === InputEnum.LEFT) return "LEFT";
            if (input === InputEnum.RIGHT) return "RIGHT";
            if (input === InputEnum.UP) return "UP";
            if (input === InputEnum.DOWN) return "DOWN";
            if (input === InputEnum.SPACE) return "SPACE";
          };

          this.input_history.push(tickPlayerID + ", " + decode_input(input));
          // make sure player exists
          if (
            !(tickPlayerID in this.players) &&
            !(tickPlayerID in this.offlinePlayers)
          ) {
            // new player
            this.players[this.localPlayerID] = new Player(this, 0, 0, true);
            this.players[this.localPlayerID].levelID =
              this.levelgen.currentFloorFirstLevelID;
            this.players[this.localPlayerID].x =
              this.rooms[this.levelgen.currentFloorFirstLevelID].roomX +
              Math.floor(
                this.rooms[this.levelgen.currentFloorFirstLevelID].width / 2
              );
            this.players[this.localPlayerID].y =
              this.rooms[this.levelgen.currentFloorFirstLevelID].roomY +
              Math.floor(
                this.rooms[this.levelgen.currentFloorFirstLevelID].height / 2
              );
          }
          if (tickPlayerID in this.offlinePlayers) {
            // old player rejoining
            this.players[tickPlayerID] = this.offlinePlayers[tickPlayerID];
            delete this.offlinePlayers[tickPlayerID];
          }
          // process input
          switch (input) {
            case InputEnum.I:
              this.players[tickPlayerID].iListener();
              break;
            case InputEnum.Q:
              this.players[tickPlayerID].qListener();
              break;
            case InputEnum.LEFT:
              this.players[tickPlayerID].leftListener(false);
              break;
            case InputEnum.RIGHT:
              this.players[tickPlayerID].rightListener(false);
              break;
            case InputEnum.UP:
              this.players[tickPlayerID].upListener(false);
              break;
            case InputEnum.DOWN:
              this.players[tickPlayerID].downListener(false);
              break;
            case InputEnum.SPACE:
              this.players[tickPlayerID].spaceListener();
              break;
          }

          if (tickPlayerID === this.localPlayerID) {
            this.mostRecentInputReceived = true;
          }
        }
      );
      this.socket.on("chat message", (message: string) => {
        this.chat.push(new ChatMessage(message));
      });
      this.socket.on("player joined", (connectedPlayerID: string) => {
        if (connectedPlayerID in this.offlinePlayers) {
          // old player reconnecting
          this.players[connectedPlayerID] =
            this.offlinePlayers[connectedPlayerID];
          if (
            this.players[connectedPlayerID].levelID <
            this.levelgen.currentFloorFirstLevelID
          ) {
            this.players[connectedPlayerID].levelID =
              this.levelgen.currentFloorFirstLevelID;
            this.players[connectedPlayerID].x =
              this.rooms[this.levelgen.currentFloorFirstLevelID].roomX +
              Math.floor(
                this.rooms[this.levelgen.currentFloorFirstLevelID].width / 2
              );
            this.players[connectedPlayerID].y =
              this.rooms[this.levelgen.currentFloorFirstLevelID].roomY +
              Math.floor(
                this.rooms[this.levelgen.currentFloorFirstLevelID].height / 2
              );
          }
          delete this.offlinePlayers[connectedPlayerID];
        } else if (!(connectedPlayerID in this.players)) {
          // new player connecting
          this.players[connectedPlayerID] = new Player(this, 0, 0, false);
          this.players[connectedPlayerID].levelID =
            this.levelgen.currentFloorFirstLevelID;
          this.players[connectedPlayerID].x =
            this.rooms[this.levelgen.currentFloorFirstLevelID].roomX +
            Math.floor(
              this.rooms[this.levelgen.currentFloorFirstLevelID].width / 2
            );
          this.players[connectedPlayerID].y =
            this.rooms[this.levelgen.currentFloorFirstLevelID].roomY +
            Math.floor(
              this.rooms[this.levelgen.currentFloorFirstLevelID].height / 2
            );
        }
      });
      this.socket.on("player left", (disconnectPlayerID: string) => {
        this.offlinePlayers[disconnectPlayerID] =
          this.players[disconnectPlayerID];
        delete this.players[disconnectPlayerID];
      });

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
      const passwordElement = document.createElement("input");
      passwordElement.type = "password";
      passwordElement.style.position = "absolute";
      passwordElement.style.left = "-1000px"; // Position off-screen
      const chatElement = document.createElement("input");
      chatElement.type = "text";
      chatElement.style.position = "absolute";
      chatElement.style.left = "-1000px"; // Position off-screen
      document.body.appendChild(usernameElement);
      document.body.appendChild(passwordElement);
      document.body.appendChild(chatElement);

      document.addEventListener(
        "click",
        () => {
          usernameElement.focus();
        },
        { once: true }
      );

      document.addEventListener("touchstart", () => {
        if (this.menuState === MenuState.LOGIN_USERNAME) {
          usernameElement.focus();
        } else if (this.menuState === MenuState.LOGIN_PASSWORD) {
          passwordElement.focus();
        }
      });

      this.chat = [];
      this.chatTextBox = new TextBox(chatElement);
      this.chatTextBox.setEnterCallback(() => {
        if (this.chatTextBox.text.length > 0) {
          this.socket.emit("chat message", this.chatTextBox.text);
          // chat commands
          if (this.chatTextBox.text === "/logout") {
            this.socket.emit("game state", createGameState(this));
            this.socket.emit("logout");
            this.menuState = MenuState.LOGIN_USERNAME;
            this.usernameTextBox.clear();
            this.passwordTextBox.clear();
            this.rooms = [];
            this.players = {};
            this.offlinePlayers = {};
          } else if (this.chatTextBox.text === "/leave") {
            this.socket.emit("game state", createGameState(this));
            this.socket.emit("leave world");
            this.socket.emit("get available worlds");
            this.menuState = MenuState.SELECT_WORLD;
            this.rooms = [];
            this.players = {};
            this.offlinePlayers = {};
          } else if (this.chatTextBox.text === "/save") {
            this.socket.emit("game state", createGameState(this));
          } else if (this.chatTextBox.text === "/r") {
            console.log(Random.state);
          } else if (this.chatTextBox.text === "/seed") {
            console.log(this.levelgen.seed);
          } else if (this.chatTextBox.text === "/i") {
            for (let i = 0; i < this.input_history.length; i++) {
              console.log(i + ": " + this.input_history[i]);
            }
          } else if (this.chatTextBox.text.substring(0, 8) === "/invite ")
            this.socket.emit("invite", this.chatTextBox.text.substring(8));

          this.chatTextBox.clear();
        } else {
          this.chatOpen = false;
        }
      });
      this.chatTextBox.setEscapeCallback(() => {
        this.chatOpen = false;
      });
      this.chatOpen = false;

      this.usernameTextBox = new TextBox(usernameElement);
      this.usernameTextBox.allowedCharacters =
        "abcdefghijklmnopqrstuvwxyz1234567890 ,.!?:'()[]%-";
      this.usernameTextBox.setEnterCallback(() => {
        if (this.usernameTextBox.text.length < 1) {
          this.loginMessage = "username too short";
        } else {
          this.loginMessage = "";
          this.menuState = MenuState.LOGIN_PASSWORD;
          passwordElement.focus(); // Focus the password input element
        }
      });
      this.passwordTextBox = new TextBox(passwordElement);
      this.passwordTextBox.allowedCharacters =
        "abcdefghijklmnopqrstuvwxyz1234567890 ,.!?:'()[]%-";
      this.passwordTextBox.setEnterCallback(() => {
        if (this.passwordTextBox.text.length < 8) {
          this.loginMessage = "password too short";
        } else {
          this.localPlayerID = this.usernameTextBox.text;
          this.socket.emit(
            "login",
            this.localPlayerID,
            this.passwordTextBox.text
          );
        }
      });
      this.worldCodes = [];
      this.selectedWorldCode = 0;

      Game.shade_canvases = {};
      Game.text_rendering_canvases = {};

      Game.tileset = new Image();
      Game.tileset.src = "res/tileset.png";
      Game.objset = new Image();
      Game.objset.src = "res/objset.png";
      Game.mobset = new Image();
      Game.mobset.src = "res/mobset.png";
      Game.itemset = new Image();
      Game.itemset.src = "res/itemset.png";
      Game.fxset = new Image();
      Game.fxset.src = "res/fxset.png";
      Game.fontsheet = new Image();
      Game.fontsheet.src = "res/font.png";

      Game.scale = 1;

      Sound.loadSounds();
      Sound.playMusic(); // loops forever

      document.addEventListener(
        "touchstart",
        function (e) {
          if (e.target == canvas) {
            e.preventDefault();
          }
        },
        false
      );
      document.addEventListener(
        "touchend",
        function (e) {
          if (e.target == canvas) {
            e.preventDefault();
          }
        },
        false
      );
      document.addEventListener(
        "touchmove",
        function (e) {
          if (e.target == canvas) {
            e.preventDefault();
          }
        },
        false
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

      this.menuState = MenuState.LOADING;

      window.requestAnimationFrame(this.run);
      this.onResize();
      window.addEventListener("resize", this.onResize);
    });
  }

  keyDownListener = (key: string) => {
    if (this.menuState === MenuState.LOGIN_USERNAME) {
      this.usernameTextBox.handleKeyPress(key);
      (
        document.querySelector('input[type="text"]') as HTMLInputElement
      ).focus();
    } else if (this.menuState === MenuState.LOGIN_PASSWORD) {
      (
        document.querySelector('input[type="password"]') as HTMLInputElement
      ).focus();
      this.passwordTextBox.handleKeyPress(key);
    } else if (this.menuState === MenuState.SELECT_WORLD) {
      switch (key) {
        case "ArrowUp":
          this.selectedWorldCode = Math.max(0, this.selectedWorldCode - 1);
          break;
        case "ArrowDown":
          this.selectedWorldCode = Math.min(
            this.worldCodes.length + 1,
            this.selectedWorldCode + 1
          );
          break;
        case "Enter":
          if (this.selectedWorldCode === 0)
            this.socket.emit("get available worlds");
          else if (this.selectedWorldCode === 1)
            this.socket.emit("join new world");
          else if (this.worldCodes[this.selectedWorldCode - 2])
            this.socket.emit(
              "join world",
              this.worldCodes[this.selectedWorldCode - 2]
            );
          break;
      }
    } else if (this.menuState === MenuState.IN_GAME) {
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
        }
      } else {
        this.chatTextBox.handleKeyPress(key);
      }
    }
  };

  sendInput = (input: InputEnum) => {
    if (this.mostRecentInputReceived) {
      this.mostRecentInputReceived = false;
      this.socket.emit("input", this.localPlayerID, input, Random.state);
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
      player.map.saveMapData();
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
        [DoorDir.East, DoorDir.West].includes(door.doorDir)
      )
        this.sideTransition = true;
      else if (door instanceof Door && door.doorDir === DoorDir.South)
        this.upwardTransition = true;
    } else {
      door.room.enterLevelThroughDoor(player, door, side);
    }
  };


  leaveGame = () => {
    this.socket.emit("game state", createGameState(this));
    this.socket.emit("leave world");
    this.socket.emit("get available worlds");
    this.menuState = MenuState.SELECT_WORLD;
    this.rooms = [];
    this.players = {};
    this.offlinePlayers = {};
  };

  run = (timestamp: number) => {
    if (!this.previousFrameTimestamp)
      this.previousFrameTimestamp = timestamp - 1000.0 / GameConstants.FPS;

    // normalized so 1.0 = 60fps
    let delta = ((timestamp - this.previousFrameTimestamp) * 60.0) / 1000.0;

    while (times.length > 0 && times[0] <= timestamp - 1000) {
      times.shift();
    }
    times.push(timestamp);
    fps = times.length;

    this.update();
    this.draw(delta);
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
        code: Input.lastPressKeyCode,
      } as KeyboardEvent);
    }

    if (this.menuState === MenuState.IN_GAME) {
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
        }
      }

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
  onResize = () => {
    let maxWidthScale = Math.floor(
      window.innerWidth / GameConstants.DEFAULTWIDTH
    );
    let maxHeightScale = Math.floor(
      window.innerHeight / GameConstants.DEFAULTHEIGHT
    );
    Game.scale = Math.min(maxWidthScale, maxHeightScale);
    if (Game.scale === 0) {
      maxWidthScale = window.innerWidth / GameConstants.DEFAULTWIDTH;
      maxHeightScale = window.innerHeight / GameConstants.DEFAULTHEIGHT;
    }
    Game.scale = Math.min(maxWidthScale, maxHeightScale);

    LevelConstants.SCREEN_W = Math.floor(
      window.innerWidth / Game.scale / GameConstants.TILESIZE
    );
    LevelConstants.SCREEN_H = Math.floor(
      window.innerHeight / Game.scale / GameConstants.TILESIZE
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
  
    -ms-interpolation-mode: nearest-neighbor;`
    );
    //Game.ctx.canvas.width = window.innerWidth;
    //Game.ctx.canvas.height = window.innerHeight;
  };

  shakeScreen = (shakeX: number, shakeY: number) => {
    this.screenShakeX = shakeX;
    this.screenShakeY = shakeY;
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
                    Game.letter_height
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
            Game.text_rendering_canvases[key].height
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
    fillColor: string
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

  draw = (delta: number) => {
    Game.ctx.globalAlpha = 1;
    Game.ctx.fillStyle = "black";
    if (this.menuState === MenuState.IN_GAME)
      Game.ctx.fillStyle = this.room.shadeColor;
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    if (this.menuState === MenuState.LOADING) {
      Game.ctx.fillStyle = "white";
      let loadingString = "loading...";
      Game.fillText(
        loadingString,
        GameConstants.WIDTH * 0.5 - Game.measureText(loadingString).width * 0.5,
        GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5
      );
    } else if (this.menuState === MenuState.LOGIN_USERNAME) {
      Game.ctx.fillStyle = "white";
      Game.fillText(
        this.loginMessage,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(this.loginMessage).width * 0.5,
        GameConstants.HEIGHT * 0.5 - Game.letter_height * 3
      );

      let prompt = "username: ";
      let usernameString = prompt + this.usernameTextBox.text;
      Game.fillText(
        usernameString,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(usernameString).width * 0.5,
        GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5
      );

      let cursorX = Game.measureText(
        usernameString.substring(0, prompt.length + this.usernameTextBox.cursor)
      ).width;
      Game.ctx.fillRect(
        Math.round(
          GameConstants.WIDTH * 0.5 -
            Game.measureText(usernameString).width * 0.5 +
            cursorX
        ),
        Math.round(GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5),
        1,
        Game.letter_height
      );

      prompt = "password: ";
      let passwordString = prompt;
      for (const i of this.passwordTextBox.text) passwordString += "-";
      Game.fillText(
        passwordString,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(passwordString).width * 0.5,
        GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5
      );
    } else if (this.menuState === MenuState.LOGIN_PASSWORD) {
      Game.ctx.fillStyle = "white";
      Game.fillText(
        this.loginMessage,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(this.loginMessage).width * 0.5,
        GameConstants.HEIGHT * 0.5 - Game.letter_height * 3
      );

      let prompt = "username: ";
      let usernameString = prompt + this.usernameTextBox.text;
      Game.fillText(
        usernameString,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(usernameString).width * 0.5,
        GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5
      );

      prompt = "password: ";
      let passwordString = prompt;
      for (const i of this.passwordTextBox.text) passwordString += "-";
      Game.fillText(
        passwordString,
        GameConstants.WIDTH * 0.5 -
          Game.measureText(passwordString).width * 0.5,
        GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5
      );
      let cursorX = Game.measureText(
        passwordString.substring(0, prompt.length + this.passwordTextBox.cursor)
      ).width;
      Game.ctx.fillRect(
        Math.round(
          GameConstants.WIDTH * 0.5 -
            Game.measureText(passwordString).width * 0.5 +
            cursorX
        ),
        Math.round(GameConstants.HEIGHT * 0.5 + Game.letter_height * 0.5),
        1,
        Game.letter_height
      );
    } else if (this.menuState === MenuState.SELECT_WORLD) {
      let c = ["refresh", "new world"];
      c = c.concat(this.worldCodes);
      c[this.selectedWorldCode] = "[ " + c[this.selectedWorldCode] + " ]";
      for (let i = 0; i < c.length; i++) {
        let ind = i - this.selectedWorldCode;
        let spacing = Game.letter_height + 2;
        Game.ctx.fillStyle = "grey";
        if (ind === 0) Game.ctx.fillStyle = "white";
        Game.fillText(
          c[i],
          GameConstants.WIDTH * 0.5 - Game.measureText(c[i]).width * 0.5,
          GameConstants.HEIGHT * 0.5 - Game.letter_height * 0.5 + ind * spacing
        );
      }
    } else if (this.menuState === MenuState.IN_GAME) {
      if (this.levelState === LevelState.TRANSITIONING) {
        let levelOffsetX = Math.floor(
          this.lerp(
            (Date.now() - this.transitionStartTime) /
              LevelConstants.LEVEL_TRANSITION_TIME,
            0,
            -this.transitionX
          )
        );
        let levelOffsetY = Math.floor(
          this.lerp(
            (Date.now() - this.transitionStartTime) /
              LevelConstants.LEVEL_TRANSITION_TIME,
            0,
            -this.transitionY
          )
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
          -Math.round(playerCY + playerOffsetY - 0.5 * GameConstants.HEIGHT)
        );

        let extraTileLerp = Math.floor(
          this.lerp(
            (Date.now() - this.transitionStartTime) /
              LevelConstants.LEVEL_TRANSITION_TIME,
            0,
            GameConstants.TILESIZE
          )
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
            LevelConstants.LEVEL_TRANSITION_TIME
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
        this.room.drawShade(delta);
        this.room.drawOverShade(delta);
        Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);

        Game.ctx.translate(
          Math.round(playerCX + playerOffsetX - 0.5 * GameConstants.WIDTH),
          Math.round(playerCY + playerOffsetY - 0.5 * GameConstants.HEIGHT)
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
          -Math.round(playerCY - 0.5 * GameConstants.HEIGHT)
        );

        let deadFrames = 6;
        let ditherFrame = Math.floor(
          ((7 * 2 + deadFrames) * (Date.now() - this.transitionStartTime)) /
            LevelConstants.LEVEL_TRANSITION_TIME_LADDER
        );

        if (ditherFrame < 7) {
          this.room.draw(delta);
          this.room.drawEntities(delta);
          this.room.drawShade(delta);
          this.room.drawOverShade(delta);

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
          this.room.drawShade(delta);
          this.room.drawOverShade(delta);
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
          Math.round(playerCY - 0.5 * GameConstants.HEIGHT)
        );

        this.players[this.localPlayerID].drawGUI(delta);
        for (const i in this.players) this.players[i].updateDrawXY(delta);
      } else {
        this.screenShakeX *= -0.8;
        this.screenShakeY *= -0.8;

        let playerDrawX = this.players[this.localPlayerID].drawX;
        let playerDrawY = this.players[this.localPlayerID].drawY;

        let cameraX = Math.round(
          (this.players[this.localPlayerID].x - playerDrawX + 0.5) *
            GameConstants.TILESIZE -
            0.5 * GameConstants.WIDTH -
            this.screenShakeX
        );
        let cameraY = Math.round(
          (this.players[this.localPlayerID].y - playerDrawY + 0.5) *
            GameConstants.TILESIZE -
            0.5 * GameConstants.HEIGHT -
            this.screenShakeY
        );

        Game.ctx.translate(-cameraX, -cameraY);
        this.room.draw(delta);
        this.room.drawEntities(delta);
        this.room.drawShade(delta);
        this.room.drawOverShade(delta);
        this.players[this.localPlayerID].drawTopLayer(delta);
        Game.ctx.translate(cameraX, cameraY);

        this.room.drawTopLayer(delta);
        this.players[this.localPlayerID].drawGUI(delta);
        for (const i in this.players) this.players[i].updateDrawXY(delta);
      }
      // draw chat
      let CHAT_X = 10;
      let CHAT_BOTTOM_Y = GameConstants.HEIGHT - Game.letter_height - 14;
      let CHAT_OPACITY = 0.5;
      if (this.chatOpen) {
        Game.ctx.fillStyle = "black";
        if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.75;
        Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

        Game.ctx.globalAlpha = 1;
        Game.ctx.fillStyle = "white";
        Game.fillText(this.chatTextBox.text, CHAT_X, CHAT_BOTTOM_Y);
        let cursorX = Game.measureText(
          this.chatTextBox.text.substring(0, this.chatTextBox.cursor)
        ).width;
        Game.ctx.fillRect(
          CHAT_X + cursorX,
          CHAT_BOTTOM_Y,
          1,
          Game.letter_height
        );
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
            if (GameConstants.ALPHA_ENABLED)
              Game.ctx.globalAlpha = CHAT_OPACITY;
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
    }

    // game version
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.1;
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(
      GameConstants.VERSION,
      GameConstants.WIDTH - Game.measureText(GameConstants.VERSION).width - 1,
      1
    );
    Game.ctx.globalAlpha = 1;

    // fps
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0.1;
    Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
    Game.fillText(fps + "fps", 1, 1);
    Game.ctx.globalAlpha = 1;
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
    shadeOpacity = 0
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
        Game.shade_canvases[key].height
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
        Math.round(sH * GameConstants.TILESIZE)
      );

      shCtx.globalAlpha = shadeOpacity;
      shCtx.fillStyle = shadeColor;
      shCtx.fillRect(
        0,
        0,
        Game.shade_canvases[key].width,
        Game.shade_canvases[key].height
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
        Math.round(sH * GameConstants.TILESIZE)
      );
    }
    Game.ctx.drawImage(
      Game.shade_canvases[key],
      Math.round(dX * GameConstants.TILESIZE),
      Math.round(dY * GameConstants.TILESIZE),
      Math.round(dW * GameConstants.TILESIZE),
      Math.round(dH * GameConstants.TILESIZE)
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
    shadeOpacity = 0
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
      shadeOpacity
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
    shadeOpacity = 0
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
      shadeOpacity
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
    shadeOpacity = 0
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
      shadeOpacity
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
    shadeOpacity = 0
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
      shadeOpacity
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
    shadeOpacity = 0
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
      shadeOpacity
    );
  };
}

let game = new Game();
