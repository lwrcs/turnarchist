/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var gameConstants_1 = __webpack_require__(4);
var player_1 = __webpack_require__(38);
var sound_1 = __webpack_require__(2);
var levelConstants_1 = __webpack_require__(7);
var levelGenerator_1 = __webpack_require__(73);
var bottomDoor_1 = __webpack_require__(10);
var input_1 = __webpack_require__(24);
var downLadder_1 = __webpack_require__(34);
var LevelState;
(function (LevelState) {
    LevelState[LevelState["IN_LEVEL"] = 0] = "IN_LEVEL";
    LevelState[LevelState["TRANSITIONING"] = 1] = "TRANSITIONING";
    LevelState[LevelState["TRANSITIONING_LADDER"] = 2] = "TRANSITIONING_LADDER";
})(LevelState = exports.LevelState || (exports.LevelState = {}));
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.changeLevel = function (newLevel) {
            _this.level.exitLevel();
            _this.level = newLevel;
            _this.level.enterLevel();
        };
        this.changeLevelThroughLadder = function (ladder) {
            _this.levelState = LevelState.TRANSITIONING_LADDER;
            _this.transitionStartTime = Date.now();
            _this.transitioningLadder = ladder;
        };
        this.changeLevelThroughDoor = function (door) {
            _this.levelState = LevelState.TRANSITIONING;
            _this.transitionStartTime = Date.now();
            _this.transitionX = _this.player.x;
            _this.transitionY = _this.player.y;
            _this.prevLevel = _this.level;
            _this.level.exitLevel();
            _this.level = door.level;
            _this.level.enterLevelThroughDoor(door);
            _this.transitionX = (_this.player.x - _this.transitionX) * gameConstants_1.GameConstants.TILESIZE;
            _this.transitionY = (_this.player.y - _this.transitionY) * gameConstants_1.GameConstants.TILESIZE;
            _this.upwardTransition = false;
            if (door instanceof bottomDoor_1.BottomDoor)
                _this.upwardTransition = true;
        };
        this.run = function () {
            _this.update();
            _this.draw();
        };
        this.update = function () {
            input_1.Input.checkIsTapHold();
            if (input_1.Input.lastPressTime !== 0 &&
                Date.now() - input_1.Input.lastPressTime > gameConstants_1.GameConstants.KEY_REPEAT_TIME) {
                input_1.Input.onKeydown({ repeat: false, keyCode: input_1.Input.lastPressKeyCode });
            }
            if (_this.levelState === LevelState.TRANSITIONING) {
                if (Date.now() - _this.transitionStartTime >= levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME) {
                    _this.levelState = LevelState.IN_LEVEL;
                }
            }
            if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                if (Date.now() - _this.transitionStartTime >= levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER) {
                    _this.levelState = LevelState.IN_LEVEL;
                }
            }
            _this.player.update();
            _this.level.update();
        };
        this.lerp = function (a, b, t) {
            return (1 - t) * a + t * b;
        };
        this.onResize = function () {
            var maxWidthScale = Math.floor(window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH);
            var maxHeightScale = Math.floor(window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT);
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            if (Game.scale === 0) {
                maxWidthScale = window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH;
                maxHeightScale = window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT;
            }
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            levelConstants_1.LevelConstants.SCREEN_W = Math.floor(window.innerWidth / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            levelConstants_1.LevelConstants.SCREEN_H = Math.floor(window.innerHeight / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            gameConstants_1.GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * gameConstants_1.GameConstants.TILESIZE;
            gameConstants_1.GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * gameConstants_1.GameConstants.TILESIZE;
            Game.ctx.canvas.setAttribute("width", "" + gameConstants_1.GameConstants.WIDTH);
            Game.ctx.canvas.setAttribute("height", "" + gameConstants_1.GameConstants.HEIGHT);
            Game.ctx.canvas.setAttribute("style", "width: " + gameConstants_1.GameConstants.WIDTH * Game.scale + "px; height: " + gameConstants_1.GameConstants.HEIGHT * Game.scale + "px;\n    display: block;\n    margin: 0 auto;\n  \n    image-rendering: optimizeSpeed; /* Older versions of FF          */\n    image-rendering: -moz-crisp-edges; /* FF 6.0+                       */\n    image-rendering: -webkit-optimize-contrast; /* Safari                        */\n    image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */\n    image-rendering: pixelated; /* Awesome future-browsers       */\n  \n    -ms-interpolation-mode: nearest-neighbor;");
            //Game.ctx.canvas.width = window.innerWidth;
            //Game.ctx.canvas.height = window.innerHeight;
        };
        this.shakeScreen = function (shakeX, shakeY) {
            _this.screenShakeX = shakeX;
            _this.screenShakeY = shakeY;
        };
        this.draw = function () {
            Game.ctx.globalAlpha = 1;
            Game.ctx.fillStyle = _this.level.shadeColor;
            Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            if (_this.levelState === LevelState.TRANSITIONING) {
                var levelOffsetX = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) / levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionX));
                var levelOffsetY = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) / levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionY));
                var playerOffsetX = levelOffsetX - _this.transitionX;
                var playerOffsetY = levelOffsetY - _this.transitionY;
                var playerCX = (_this.player.x - _this.player.drawX + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                var playerCY = (_this.player.y - _this.player.drawY + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                Game.ctx.translate(-Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                var extraTileLerp = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) / levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, gameConstants_1.GameConstants.TILESIZE));
                var newLevelOffsetX = playerOffsetX;
                var newLevelOffsetY = playerOffsetY;
                if (_this.upwardTransition) {
                    levelOffsetY -= extraTileLerp;
                    newLevelOffsetY += -extraTileLerp - gameConstants_1.GameConstants.TILESIZE;
                }
                else {
                    levelOffsetY += extraTileLerp;
                    newLevelOffsetY += extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                }
                var ditherFrame = Math.floor((7 * (Date.now() - _this.transitionStartTime)) / levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME);
                Game.ctx.translate(levelOffsetX, levelOffsetY);
                _this.prevLevel.draw();
                _this.prevLevel.drawEntitiesBehindPlayer();
                _this.prevLevel.drawEntitiesInFrontOfPlayer();
                for (var x = _this.prevLevel.roomX - 1; x <= _this.prevLevel.roomX + _this.prevLevel.width; x++) {
                    for (var y = _this.prevLevel.roomY - 1; y <= _this.prevLevel.roomY + _this.prevLevel.height; y++) {
                        Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                    }
                }
                Game.ctx.translate(-levelOffsetX, -levelOffsetY);
                Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                _this.level.draw();
                _this.level.drawEntitiesBehindPlayer();
                _this.level.drawEntitiesInFrontOfPlayer();
                for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                    for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                        Game.drawFX(ditherFrame, 10, 1, 1, x, y, 1, 1);
                    }
                }
                Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                Game.ctx.translate(playerOffsetX, playerOffsetY);
                _this.player.draw();
                Game.ctx.translate(-playerOffsetX, -playerOffsetY);
                Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                _this.level.drawShade();
                _this.level.drawOverShade();
                Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                Game.ctx.translate(Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                _this.player.drawGUI();
                _this.player.updateDrawXY();
            }
            else if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                var playerCX = (_this.player.x - _this.player.drawX + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                var playerCY = (_this.player.y - _this.player.drawY + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                Game.ctx.translate(-Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                var deadFrames = 6;
                var ditherFrame = Math.floor(((7 * 2 + deadFrames) * (Date.now() - _this.transitionStartTime)) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER);
                if (ditherFrame < 7) {
                    _this.level.draw();
                    _this.level.drawEntitiesBehindPlayer();
                    _this.player.draw();
                    _this.level.drawEntitiesInFrontOfPlayer();
                    _this.level.drawShade();
                    _this.level.drawOverShade();
                    for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                        for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                            Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                        }
                    }
                }
                else if (ditherFrame >= 7 + deadFrames) {
                    if (_this.transitioningLadder) {
                        _this.prevLevel = _this.level;
                        _this.level.exitLevel();
                        if (_this.transitioningLadder instanceof downLadder_1.DownLadder)
                            _this.transitioningLadder.generate();
                        _this.level = _this.transitioningLadder.linkedLadder.level;
                        _this.level.enterLevelThroughLadder(_this.transitioningLadder.linkedLadder);
                        _this.transitioningLadder = null;
                    }
                    _this.level.draw();
                    _this.level.drawEntitiesBehindPlayer();
                    _this.player.draw();
                    _this.level.drawEntitiesInFrontOfPlayer();
                    _this.level.drawShade();
                    _this.level.drawOverShade();
                    for (var x = _this.level.roomX - 1; x <= _this.level.roomX + _this.level.width; x++) {
                        for (var y = _this.level.roomY - 1; y <= _this.level.roomY + _this.level.height; y++) {
                            Game.drawFX(ditherFrame - (7 + deadFrames), 10, 1, 1, x, y, 1, 1);
                        }
                    }
                }
                Game.ctx.translate(Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                _this.player.drawGUI();
                _this.player.updateDrawXY();
            }
            else {
                _this.screenShakeX *= -0.8;
                _this.screenShakeY *= -0.8;
                var playerDrawX = _this.player.drawX;
                var playerDrawY = _this.player.drawY;
                Game.ctx.translate(-Math.round((_this.player.x - playerDrawX + 0.5) * gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.WIDTH -
                    _this.screenShakeX), -Math.round((_this.player.y - playerDrawY + 0.5) * gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.HEIGHT -
                    _this.screenShakeY));
                _this.level.draw();
                _this.level.drawEntitiesBehindPlayer();
                _this.player.draw();
                _this.level.drawEntitiesInFrontOfPlayer();
                _this.level.drawShade();
                _this.level.drawOverShade();
                _this.player.drawTopLayer();
                Game.ctx.translate(Math.round((_this.player.x - playerDrawX + 0.5) * gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.WIDTH -
                    _this.screenShakeX), Math.round((_this.player.y - playerDrawY + 0.5) * gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.HEIGHT -
                    _this.screenShakeY));
                _this.level.drawTopLayer();
                _this.player.drawGUI();
                _this.player.updateDrawXY();
            }
            // game version
            Game.ctx.globalAlpha = 0.1;
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
            Game.ctx.textBaseline = "top";
            Game.fillText(gameConstants_1.GameConstants.VERSION, gameConstants_1.GameConstants.WIDTH - Game.ctx.measureText(gameConstants_1.GameConstants.VERSION).width - 1, -3);
            Game.ctx.globalAlpha = 1;
        };
        this.drawSoftVis1x1 = function (set, sX, sY, sW, sH, dX, dY, levelX, levelY) {
            if (Game.shImg === undefined) {
                Game.shImg = document.createElement("canvas");
                Game.shCtx = Game.shImg.getContext("2d");
                Game.shImg.width = gameConstants_1.GameConstants.TILESIZE * 2;
                Game.shImg.height = gameConstants_1.GameConstants.TILESIZE * 2;
            }
            Game.shCtx.clearRect(0, 0, Game.shImg.width, Game.shImg.height);
            Game.shCtx.globalCompositeOperation = "source-over";
            Game.shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE);
            Game.shCtx.globalCompositeOperation = "multiply";
            Game.shCtx.fillStyle = "black";
            for (var xx = 0; xx < 1; xx += 0.25) {
                for (var yy = 0; yy < 1; yy += 0.25) {
                    Game.shCtx.globalAlpha =
                        (1 - xx) *
                            (1 - yy) *
                            0.25 *
                            (_this.level.softVis[levelX][levelY] +
                                _this.level.softVis[levelX - 1][levelY] +
                                _this.level.softVis[levelX - 1][levelY - 1] +
                                _this.level.softVis[levelX][levelY - 1]) +
                            xx *
                                (1 - yy) *
                                0.25 *
                                (_this.level.softVis[levelX + 1][levelY] +
                                    _this.level.softVis[levelX][levelY] +
                                    _this.level.softVis[levelX][levelY - 1] +
                                    _this.level.softVis[levelX + 1][levelY - 1]) +
                            (1 - xx) *
                                yy *
                                0.25 *
                                (_this.level.softVis[levelX][levelY + 1] +
                                    _this.level.softVis[levelX - 1][levelY + 1] +
                                    _this.level.softVis[levelX - 1][levelY] +
                                    _this.level.softVis[levelX][levelY]) +
                            xx *
                                yy *
                                0.25 *
                                (_this.level.softVis[levelX + 1][levelY + 1] +
                                    _this.level.softVis[levelX][levelY + 1] +
                                    _this.level.softVis[levelX][levelY] +
                                    _this.level.softVis[levelX + 1][levelY]);
                    Game.shCtx.fillRect(xx * gameConstants_1.GameConstants.TILESIZE, yy * gameConstants_1.GameConstants.TILESIZE, 0.25 * gameConstants_1.GameConstants.TILESIZE, 0.25 * gameConstants_1.GameConstants.TILESIZE);
                }
            }
            Game.shCtx.globalAlpha = 1.0;
            Game.shCtx.globalCompositeOperation = "destination-in";
            Game.shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE);
            Game.ctx.drawImage(Game.shImg, Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE));
        };
        window.addEventListener("load", function () {
            var canvas = document.getElementById("gameCanvas");
            Game.ctx = canvas.getContext("2d");
            Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
            Game.ctx.textBaseline = "top";
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
            Game.shopset = new Image();
            Game.shopset.src = "res/shopset.png";
            Game.tilesetShadow = new Image();
            Game.tilesetShadow.src = "res/tilesetShadow.png";
            Game.objsetShadow = new Image();
            Game.objsetShadow.src = "res/objsetShadow.png";
            Game.mobsetShadow = new Image();
            Game.mobsetShadow.src = "res/mobsetShadow.png";
            Game.scale = 1;
            sound_1.Sound.loadSounds();
            sound_1.Sound.playMusic(); // loops forever
            _this.player = new player_1.Player(_this, 0, 0);
            _this.levels = Array();
            _this.levelgen = new levelGenerator_1.LevelGenerator();
            _this.levelgen.generate(_this, 0);
            _this.level = _this.levels[0];
            _this.level.enterLevel();
            _this.screenShakeX = 0;
            _this.screenShakeY = 0;
            _this.levelState = LevelState.IN_LEVEL;
            setInterval(_this.run, 1000.0 / gameConstants_1.GameConstants.FPS);
            _this.onResize();
            window.addEventListener("resize", _this.onResize);
            document.addEventListener("touchstart", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchend", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchmove", function (e) {
                if (e.target == canvas) {
                    e.preventDefault();
                }
            }, false);
            document.addEventListener("touchstart", input_1.Input.handleTouchStart, { passive: false });
            document.addEventListener("touchmove", input_1.Input.handleTouchMove, { passive: false });
            document.addEventListener("touchend", input_1.Input.handleTouchEnd, { passive: false });
        });
    }
    // [min, max] inclusive
    Game.rand = function (min, max) {
        if (max < min)
            return min;
        return Math.floor(Math.random() * (max - min + 1) + min);
    };
    Game.randTable = function (table) {
        return table[Game.rand(0, table.length - 1)];
    };
    Game.fillText = function (text, x, y, maxWidth) {
        Game.ctx.fillText(text, Math.round(x), Math.round(y), maxWidth);
    };
    Game.drawHelper = function (set, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        if (shadeOpacity > 0) {
            if (Game.shImg === undefined) {
                Game.shImg = document.createElement("canvas");
                Game.shCtx = Game.shImg.getContext("2d");
                Game.shImg.width = gameConstants_1.GameConstants.TILESIZE * 2;
                Game.shImg.height = gameConstants_1.GameConstants.TILESIZE * 2;
            }
            Game.shCtx.clearRect(0, 0, Game.shImg.width, Game.shImg.height);
            Game.shCtx.globalCompositeOperation = "source-over";
            Game.shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
            Game.shCtx.globalAlpha = shadeOpacity;
            Game.shCtx.fillStyle = shadeColor;
            Game.shCtx.fillRect(0, 0, Game.shImg.width, Game.shImg.height);
            Game.shCtx.globalAlpha = 1.0;
            Game.shCtx.globalCompositeOperation = "destination-in";
            Game.shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
            Game.ctx.drawImage(Game.shImg, Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE));
        }
        else {
            Game.ctx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
        }
    };
    Game.drawTile = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        //Game.drawHelper(Game.tileset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.ctx.drawImage(Game.tileset, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
        Game.ctx.globalAlpha = shadeOpacity;
        Game.ctx.fillStyle = shadeColor;
        Game.ctx.fillRect(Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
        Game.ctx.globalAlpha = 1.0;
    };
    Game.drawObj = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.objset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawMob = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.mobset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawShop = function (sX, sY, sW, sH, dX, dY, dW, dH) {
        Game.ctx.drawImage(Game.shopset, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
    };
    Game.drawItem = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.itemset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawFX = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.fxset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    return Game;
}());
exports.Game = Game;
var game = new Game();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var SkinType;
(function (SkinType) {
    SkinType[SkinType["DUNGEON"] = 0] = "DUNGEON";
    SkinType[SkinType["CAVE"] = 1] = "CAVE";
})(SkinType = exports.SkinType || (exports.SkinType = {}));
var Tile = /** @class */ (function () {
    function Tile(level, x, y) {
        var _this = this;
        this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        this.isSolid = function () {
            return false;
        };
        this.canCrushEnemy = function () {
            return false;
        };
        this.isOpaque = function () {
            return false;
        };
        this.onCollide = function (player) { };
        this.onCollideEnemy = function (enemy) { };
        this.tick = function () { };
        this.tickEnd = function () { };
        this.draw = function () { };
        this.drawUnderPlayer = function () { };
        this.drawAbovePlayer = function () { };
        this.drawAboveShading = function () { };
        this.skin = level.skin;
        this.level = level;
        this.x = x;
        this.y = y;
    }
    return Tile;
}());
exports.Tile = Tile;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var Sound = /** @class */ (function () {
    function Sound() {
    }
    Sound.loadSounds = function () {
        Sound.playerStoneFootsteps = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.playerStoneFootsteps.push(new Audio("res/SFX/footsteps/stone/footstep" + i + ".wav"));
        });
        for (var _i = 0, _a = Sound.playerStoneFootsteps; _i < _a.length; _i++) {
            var f = _a[_i];
            f.volume = 1.0;
        }
        Sound.enemyFootsteps = new Array();
        [1, 2, 3, 4, 5].forEach(function (i) {
            return Sound.enemyFootsteps.push(new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".wav"));
        });
        for (var _b = 0, _c = Sound.enemyFootsteps; _b < _c.length; _b++) {
            var f = _c[_b];
            f.volume = 1.0;
        }
        Sound.hitSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.hitSounds.push(new Audio("res/SFX/attacks/swing" + i + ".wav"));
        });
        for (var _d = 0, _e = Sound.hitSounds; _d < _e.length; _d++) {
            var f = _e[_d];
            f.volume = 1.0;
        }
        Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.wav");
        Sound.enemySpawnSound.volume = 1.0;
        Sound.chestSounds = new Array();
        [1, 2, 3].forEach(function (i) { return Sound.chestSounds.push(new Audio("res/SFX/items/chest" + i + ".wav")); });
        for (var _f = 0, _g = Sound.chestSounds; _f < _g.length; _f++) {
            var f = _g[_f];
            f.volume = 1.0;
        }
        Sound.coinPickupSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.coinPickupSounds.push(new Audio("res/SFX/items/coins" + i + ".wav"));
        });
        for (var _h = 0, _j = Sound.coinPickupSounds; _h < _j.length; _h++) {
            var f = _j[_h];
            f.volume = 1.0;
        }
        Sound.miningSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.miningSounds.push(new Audio("res/SFX/resources/Pickaxe" + i + ".wav"));
        });
        for (var _k = 0, _l = Sound.miningSounds; _k < _l.length; _k++) {
            var f = _l[_k];
            f.volume = 1.0;
        }
        Sound.hurtSounds = new Array();
        [1].forEach(function (i) { return Sound.hurtSounds.push(new Audio("res/SFX/attacks/hit.wav")); });
        for (var _m = 0, _o = Sound.hurtSounds; _m < _o.length; _m++) {
            var f = _o[_m];
            f.volume = 1.0;
        }
        Sound.genericPickupSound = new Audio("res/SFX/items/pickup.wav");
        Sound.genericPickupSound.volume = 1.0;
        Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.wav");
        Sound.breakRockSound.volume = 1.0;
        Sound.pushSounds = new Array();
        [1, 2].forEach(function (i) { return Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".wav")); });
        for (var _p = 0, _q = Sound.pushSounds; _p < _q.length; _p++) {
            var f = _q[_p];
            f.volume = 1.0;
        }
        Sound.powerupSound = new Audio("res/powerup.wav");
        Sound.powerupSound.volume = 0.5;
        Sound.healSound = new Audio("res/heal.wav");
        Sound.healSound.volume = 0.5;
        Sound.music = new Audio("res/bewitched.mp3");
    };
    Sound.playerStoneFootstep = function () {
        var f = game_1.Game.randTable(Sound.playerStoneFootsteps);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemyFootstep = function () {
        var f = game_1.Game.randTable(Sound.enemyFootsteps);
        f.play();
        f.currentTime = 0;
    };
    Sound.hit = function () {
        var f = game_1.Game.randTable(Sound.hitSounds);
        f.play();
        f.currentTime = 0;
        f = game_1.Game.randTable(Sound.hurtSounds);
        f.volume = 0.5;
        f.play();
        f.currentTime = 0;
        f.volume = 1.0;
    };
    Sound.hurt = function () {
        var f = game_1.Game.randTable(Sound.hurtSounds);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemySpawn = function () {
        Sound.enemySpawnSound.play();
        Sound.enemySpawnSound.currentTime = 0;
    };
    Sound.chest = function () {
        var f = game_1.Game.randTable(Sound.chestSounds);
        f.play();
        f.currentTime = 0;
    };
    Sound.pickupCoin = function () {
        var f = game_1.Game.randTable(Sound.coinPickupSounds);
        f.play();
        f.currentTime = 0;
    };
    Sound.mine = function () {
        var f = game_1.Game.randTable(Sound.miningSounds);
        f.play();
        f.currentTime = 0;
    };
    Sound.breakRock = function () {
        Sound.breakRockSound.play();
        Sound.breakRockSound.currentTime = 0;
    };
    Sound.powerup = function () {
        Sound.powerupSound.play();
        Sound.powerupSound.currentTime = 0;
    };
    Sound.heal = function () {
        Sound.healSound.play();
        Sound.healSound.currentTime = 0;
    };
    Sound.genericPickup = function () {
        Sound.genericPickupSound.play();
        Sound.genericPickupSound.currentTime = 0;
    };
    Sound.push = function () {
        var f = game_1.Game.randTable(Sound.pushSounds);
        f.play();
        f.currentTime = 0;
    };
    Sound.playMusic = function () {
        Sound.music.addEventListener("ended", function () {
            Sound.music.currentTime = 0;
            Sound.music.play();
        }, false);
        //Sound.music.play();
    };
    return Sound;
}());
exports.Sound = Sound;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var particle_1 = __webpack_require__(9);
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var GenericParticle = /** @class */ (function (_super) {
    __extends(GenericParticle, _super);
    function GenericParticle(level, x, y, z, s, dx, dy, dz, color, delay, expirationTimer, targetX, targetY, targetZ) {
        var _this = _super.call(this) || this;
        _this.render = function () {
            var scale = gameConstants_1.GameConstants.TILESIZE;
            var scaledS = _this.s * _this.alpha; // using alpha for scaling, not alpha
            var halfS = 0.5 * scaledS;
            var oldFillStyle = game_1.Game.ctx.fillStyle;
            game_1.Game.ctx.fillStyle = _this.color;
            /* Game.ctx.fillRect(
              Math.round((this.x - halfS) * scale),
              Math.round((this.y - this.z - halfS) * scale),
              Math.round(scaledS * scale),
              Math.round(scaledS * scale)
            ); */
            game_1.Game.ctx.beginPath();
            game_1.Game.ctx.arc(Math.round(_this.x * scale), Math.round((_this.y - _this.z) * scale), Math.round(halfS * scale), 0, 2 * Math.PI, false);
            game_1.Game.ctx.fill();
            game_1.Game.ctx.fillStyle = oldFillStyle;
        };
        _this.draw = function () {
            if (_this.targetX)
                _this.x += 0.1 * (_this.targetX - _this.x);
            else
                _this.x += _this.dx;
            if (_this.targetY)
                _this.y += 0.1 * (_this.targetY - _this.y);
            else
                _this.y += _this.dy;
            if (_this.targetZ)
                _this.z += 0.1 * (_this.targetZ - _this.z);
            else
                _this.z += _this.dz;
            _this.dx *= 0.97;
            _this.dy *= 0.97;
            if (_this.z <= 0) {
                _this.z = 0;
                _this.dz *= -0.8;
            }
            // apply gravity
            _this.dz -= 0.01;
            if (_this.alpha < 0.2)
                _this.alpha -= 0.007;
            else
                _this.alpha -= 0.02;
            if (_this.alpha <= 0.1)
                _this.dead = true;
            _this.expirationTimer--;
            if (_this.expirationTimer <= 0)
                _this.dead = true;
            if (_this.dead)
                return;
            if (_this.y >= _this.level.game.player.y) {
                _this.render();
            }
        };
        _this.drawBehind = function () {
            if (_this.dead)
                return;
            if (_this.y < _this.level.game.player.y) {
                _this.render();
            }
        };
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.z = z;
        _this.s = s;
        _this.dx = dx;
        _this.dy = dy;
        _this.dz = dz;
        _this.color = color;
        _this.alpha = 1.0;
        if (delay !== undefined)
            _this.delay = delay;
        _this.targetX = targetX;
        _this.targetY = targetY;
        _this.targetZ = targetZ;
        _this.expirationTimer = 1000000;
        if (expirationTimer !== undefined)
            _this.expirationTimer = expirationTimer;
        return _this;
    }
    GenericParticle.shotgun = function (level, cx, cy, tx, ty, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx, cy, 0, Math.random() * 0.5 + 0.3, 0, 0, 0, color, 0, 10000000, tx + Math.random() - 0.5, ty + Math.random() - 0.5, 0));
        }
    };
    GenericParticle.spawnCluster = function (level, cx, cy, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx + Math.random() * 0.05 - 0.025, cy + Math.random() * 0.05 - 0.025, Math.random() * 0.5, 0.0625 * (i + 8), 0.025 * (Math.random() * 2 - 1), 0.025 * (Math.random() * 2 - 1), 0.2 * (Math.random() - 1), color, 0));
        }
    };
    return GenericParticle;
}(particle_1.Particle));
exports.GenericParticle = GenericParticle;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var levelConstants_1 = __webpack_require__(7);
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.VERSION = "v0.4.5";
    GameConstants.FPS = 60;
    GameConstants.TILESIZE = 16;
    GameConstants.SCALE = 2;
    GameConstants.SWIPE_THRESH = Math.pow(50, 2); // (size of swipe threshold circle)^2
    GameConstants.KEY_REPEAT_TIME = 300; // millseconds
    GameConstants.DEFAULTWIDTH = 8.5 * GameConstants.TILESIZE;
    GameConstants.DEFAULTHEIGHT = 8.5 * GameConstants.TILESIZE;
    GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * GameConstants.TILESIZE;
    GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * GameConstants.TILESIZE;
    GameConstants.scrolling = true;
    GameConstants.SCRIPT_FONT_SIZE = 16;
    GameConstants.FONT_SIZE = 10;
    GameConstants.BIG_FONT_SIZE = 20;
    GameConstants.RED = "#ac3232";
    GameConstants.GREEN = "#6abe30";
    GameConstants.ARMOR_GREY = "#9badb7";
    GameConstants.OUTLINE = "#222034";
    GameConstants.HIT_ENEMY_TEXT_COLOR = "#76428a";
    GameConstants.HEALTH_BUFF_COLOR = "#d77bba";
    GameConstants.MISS_COLOR = "#639bff";
    return GameConstants;
}());
exports.GameConstants = GameConstants;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var bones_1 = __webpack_require__(25);
var deathParticle_1 = __webpack_require__(26);
var floor_1 = __webpack_require__(18);
var genericParticle_1 = __webpack_require__(3);
var healthbar_1 = __webpack_require__(27);
var EnemyDirection;
(function (EnemyDirection) {
    EnemyDirection[EnemyDirection["DOWN"] = 0] = "DOWN";
    EnemyDirection[EnemyDirection["UP"] = 1] = "UP";
    EnemyDirection[EnemyDirection["RIGHT"] = 2] = "RIGHT";
    EnemyDirection[EnemyDirection["LEFT"] = 3] = "LEFT";
})(EnemyDirection = exports.EnemyDirection || (exports.EnemyDirection = {}));
var Enemy = /** @class */ (function () {
    function Enemy(level, game, x, y) {
        var _this = this;
        this.tryMove = function (x, y) {
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && e.x === x && e.y === y) {
                    return;
                }
            }
            if (_this.game.player.x === x && _this.game.player.y === y) {
                return;
            }
            if (!_this.level.levelArray[x][y].isSolid()) {
                _this.level.levelArray[x][y].onCollideEnemy(_this);
                _this.x = x;
                _this.y = y;
            }
        };
        this.hit = function () {
            return 0;
        };
        this.hurtCallback = function () { };
        this.hurt = function (damage) {
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        this.interact = function () { };
        this.dropLoot = function () { };
        this.kill = function () {
            if (_this.level.levelArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.level, _this.x, _this.y);
                b.skin = _this.level.levelArray[_this.x][_this.y].skin;
                _this.level.levelArray[_this.x][_this.y] = b;
            }
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        this.killNoBones = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
        };
        this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        this.facePlayer = function () {
            var dx = _this.game.player.x - _this.x;
            var dy = _this.game.player.y - _this.y;
            if (Math.abs(dx) === Math.abs(dy)) {
                // just moved, already facing player
            }
            else if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0)
                    _this.direction = EnemyDirection.RIGHT;
                if (dx < 0)
                    _this.direction = EnemyDirection.LEFT;
            }
            else {
                if (dy > 0)
                    _this.direction = EnemyDirection.DOWN;
                if (dy < 0)
                    _this.direction = EnemyDirection.UP;
            }
        };
        this.draw = function () {
            if (!_this.dead) {
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        this.tick = function () { };
        this.drawTopLayer = function () {
            _this.healthBar.draw(_this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        this.level = level;
        this.x = x;
        this.y = y;
        this.w = 1;
        this.h = 1;
        this.game = game;
        this.drawX = 0;
        this.drawY = 0;
        this.health = 1;
        this.maxHealth = 1;
        this.tileX = 0;
        this.tileY = 0;
        this.hasShadow = true;
        this.skipNextTurns = 0;
        this.direction = EnemyDirection.DOWN;
        this.destroyable = true;
        this.pushable = false;
        this.chainPushable = true;
        this.interactable = false;
        this.deathParticleColor = "#ff00ff";
        this.healthBar = new healthbar_1.HealthBar();
    }
    return Enemy;
}());
exports.Enemy = Enemy;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var sound_1 = __webpack_require__(2);
var Item = /** @class */ (function () {
    function Item(level, x, y) {
        var _this = this;
        this.tick = function () { };
        this.tickInInventory = function () { }; // different tick behavior for when we have the item in our inventory
        this.getDescription = function () {
            return "";
        };
        this.pickupSound = function () {
            sound_1.Sound.genericPickup();
        };
        this.onPickup = function (player) {
            if (!_this.pickedUp && !player.inventory.isFull()) {
                _this.pickupSound();
                _this.pickedUp = true;
                player.inventory.addItem(_this);
            }
        };
        this.shadeAmount = function () {
            return _this.level.softVis[_this.x][_this.y];
        };
        this.draw = function () {
            if (!_this.pickedUp) {
                if (_this.scaleFactor < 1)
                    _this.scaleFactor += 0.04;
                else
                    _this.scaleFactor = 1;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (Math.PI * 2) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (_this.scaleFactor * -0.5 + 0.5), _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (_this.scaleFactor * -0.5 + 0.5), _this.w * _this.scaleFactor, _this.h * _this.scaleFactor, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        this.drawTopLayer = function () {
            if (_this.pickedUp) {
                _this.y -= 0.125;
                _this.alpha -= 0.03;
                if (_this.y < -1)
                    _this.level.items = _this.level.items.filter(function (x) { return x !== _this; }); // removes itself from the level
                game_1.Game.ctx.globalAlpha = Math.max(0, _this.alpha);
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x, _this.y - 1, _this.w, _this.h);
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        this.drawIcon = function (x, y, opacity) {
            if (opacity === void 0) { opacity = 1; }
            game_1.Game.ctx.globalAlpha = opacity;
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
            game_1.Game.ctx.globalAlpha = 1;
            var countText = _this.stackCount <= 1 ? "" : "" + _this.stackCount;
            var width = game_1.Game.ctx.measureText(countText).width;
            var countX = 17 - width;
            var countY = 4;
            game_1.Game.ctx.fillStyle = "black";
            for (var xx = -1; xx <= 1; xx++) {
                for (var yy = -1; yy <= 1; yy++) {
                    game_1.Game.ctx.fillStyle = gameConstants_1.GameConstants.OUTLINE;
                    game_1.Game.fillText(countText, x * gameConstants_1.GameConstants.TILESIZE + countX + xx, y * gameConstants_1.GameConstants.TILESIZE + countY + yy);
                }
            }
            game_1.Game.ctx.fillStyle = "white";
            game_1.Game.fillText(countText, x * gameConstants_1.GameConstants.TILESIZE + countX, y * gameConstants_1.GameConstants.TILESIZE + countY);
        };
        this.level = level;
        this.x = x;
        this.y = y;
        this.w = 1;
        this.h = 2;
        this.tileX = 0;
        this.tileY = 0;
        this.frame = 0;
        this.dead = false;
        this.stackable = false;
        this.stackCount = 1;
        this.pickedUp = false;
        this.alpha = 1;
        this.scaleFactor = 0.2;
        this.offsetY = -0.25;
    }
    return Item;
}());
exports.Item = Item;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var LevelConstants = /** @class */ (function () {
    function LevelConstants() {
    }
    LevelConstants.MIN_LEVEL_W = 5;
    LevelConstants.MIN_LEVEL_H = 5;
    LevelConstants.MAX_LEVEL_W = 13;
    LevelConstants.MAX_LEVEL_H = 13;
    LevelConstants.SCREEN_W = 1;
    LevelConstants.SCREEN_H = 1;
    LevelConstants.ROOM_W = 17;
    LevelConstants.ROOM_H = 17;
    LevelConstants.COMPUTER_TURN_DELAY = 250; // milliseconds
    LevelConstants.TURN_TIME = 1000; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME = 300; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME_LADDER = 1000; // milliseconds
    LevelConstants.ROOM_COUNT = 15;
    LevelConstants.HEALTH_BAR_FADEIN = 100;
    LevelConstants.HEALTH_BAR_FADEOUT = 100;
    LevelConstants.HEALTH_BAR_TOTALTIME = 2500;
    LevelConstants.SHADED_TILE_CUTOFF = 1;
    LevelConstants.SMOOTH_LIGHTING = false;
    LevelConstants.MIN_VISIBILITY = 2.0; // visibility level of places you've already seen
    LevelConstants.LIGHTING_ANGLE_STEP = 5; // how many degrees between each ray
    LevelConstants.LEVEL_TEXT_COLOR = "white"; // not actually a constant
    return LevelConstants;
}());
exports.LevelConstants = LevelConstants;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var Coin = /** @class */ (function (_super) {
    __extends(Coin, _super);
    function Coin(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tileX = 19;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Coin;
}(item_1.Item));
exports.Coin = Coin;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Particle = /** @class */ (function () {
    function Particle() {
        this.drawBehind = function () { }; // drawing behind player and such
        this.draw = function () { }; // drawing on top of player and such
    }
    return Particle;
}());
exports.Particle = Particle;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var BottomDoor = /** @class */ (function (_super) {
    __extends(BottomDoor, _super);
    function BottomDoor(level, game, x, y, linkedDoor) {
        var _this = _super.call(this, level, x, y) || this;
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.onCollide = function (player) {
            _this.game.changeLevelThroughDoor(_this.linkedDoor);
        };
        _this.drawAbovePlayer = function () {
            /*Game.drawTile(
              14,
              0,
              1,
              1,
              this.x,
              this.y - 1,
              1,
              1,
              "black",
              this.level.softVis[this.x][this.y - 1]
            ); */
        };
        _this.drawAboveShading = function () {
            game_1.Game.drawFX(2, 2, 1, 1, _this.x, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
        };
        _this.game = game;
        _this.linkedDoor = linkedDoor;
        return _this;
    }
    return BottomDoor;
}(tile_1.Tile));
exports.BottomDoor = BottomDoor;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var game_1 = __webpack_require__(0);
var Equippable = /** @class */ (function (_super) {
    __extends(Equippable, _super);
    function Equippable(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.coEquippable = function (other) {
            return true;
        };
        _this.drawEquipped = function (x, y) {
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
        };
        _this.equipped = false;
        return _this;
    }
    return Equippable;
}(item_1.Item));
exports.Equippable = Equippable;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var genericParticle_1 = __webpack_require__(3);
var Crate = /** @class */ (function (_super) {
    __extends(Crate, _super);
    function Crate(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#d9a066");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function () {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function () {
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.level = level;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        return _this;
    }
    return Crate;
}(enemy_1.Enemy));
exports.Crate = Crate;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var genericParticle_1 = __webpack_require__(3);
var Barrel = /** @class */ (function (_super) {
    __extends(Barrel, _super);
    function Barrel(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#9badb7");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function () {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function () {
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        _this.level = level;
        _this.health = 1;
        _this.tileX = 1;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        return _this;
    }
    return Barrel;
}(enemy_1.Enemy));
exports.Barrel = Barrel;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var projectile_1 = __webpack_require__(22);
var game_1 = __webpack_require__(0);
var HitWarning = /** @class */ (function (_super) {
    __extends(HitWarning, _super);
    function HitWarning(game, x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.tick = function () {
            _this.dead = true;
        };
        _this.draw = function () {
            if ((_this.x === _this.game.player.x && Math.abs(_this.y - _this.game.player.y) <= 1) ||
                (_this.y === _this.game.player.y && Math.abs(_this.x - _this.game.player.x) <= 1))
                game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 6, 1, 1, _this.x, _this.y, 1, 1);
        };
        _this.drawTopLayer = function () {
            if ((_this.x === _this.game.player.x && Math.abs(_this.y - _this.game.player.y) <= 1) ||
                (_this.y === _this.game.player.y && Math.abs(_this.x - _this.game.player.x) <= 1))
                game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 5, 1, 1, _this.x, _this.y, 1, 1);
        };
        _this.game = game;
        return _this;
    }
    HitWarning.frame = 0;
    HitWarning.updateFrame = function () {
        HitWarning.frame += 0.125;
        if (HitWarning.frame >= 4)
            HitWarning.frame = 0;
    };
    return HitWarning;
}(projectile_1.Projectile));
exports.HitWarning = HitWarning;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Door = /** @class */ (function (_super) {
    __extends(Door, _super);
    function Door(level, game, x, y, linkedDoor) {
        var _this = _super.call(this, level, x, y) || this;
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.onCollide = function (player) {
            _this.opened = true;
            _this.game.changeLevelThroughDoor(_this.linkedDoor);
        };
        _this.draw = function () {
            if (_this.opened)
                game_1.Game.drawTile(6, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function () {
            if (!_this.opened)
                game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAboveShading = function () {
            game_1.Game.drawFX(2, 2, 1, 1, _this.x, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
        };
        _this.game = game;
        _this.linkedDoor = linkedDoor;
        _this.opened = false;
        return _this;
    }
    return Door;
}(tile_1.Tile));
exports.Door = Door;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var levelConstants_1 = __webpack_require__(7);
var equippable_1 = __webpack_require__(11);
var Armor = /** @class */ (function (_super) {
    __extends(Armor, _super);
    function Armor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.RECHARGE_TURNS = 15;
        _this.coEquippable = function (other) {
            if (other instanceof Armor)
                return false;
            return true;
        };
        _this.getDescription = function () {
            return ("ENCHANTED ARMOR\nA magic suit of armor. Absorbs one hit and regenerates after " +
                _this.RECHARGE_TURNS +
                " turns.");
        };
        _this.tickInInventory = function () {
            if (_this.rechargeTurnCounter > 0) {
                _this.rechargeTurnCounter--;
                if (_this.rechargeTurnCounter === 0) {
                    _this.rechargeTurnCounter = -1;
                    _this.health = 1;
                }
            }
        };
        _this.hurt = function (damage) {
            if (_this.health <= 0)
                return;
            _this.health -= damage;
            _this.rechargeTurnCounter = _this.RECHARGE_TURNS + 1;
        };
        _this.drawGUI = function (playerHealth) {
            if (_this.rechargeTurnCounter === -1)
                game_1.Game.drawFX(5, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            else {
                var rechargeProportion = 1 - _this.rechargeTurnCounter / _this.RECHARGE_TURNS;
                if (rechargeProportion < 0.5)
                    game_1.Game.drawFX(7, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                else
                    game_1.Game.drawFX(8, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            }
        };
        _this.health = 1;
        _this.rechargeTurnCounter = -1;
        _this.tileX = 5;
        _this.tileY = 0;
        return _this;
    }
    return Armor;
}(equippable_1.Equippable));
exports.Armor = Armor;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var equippable_1 = __webpack_require__(11);
var Weapon = /** @class */ (function (_super) {
    __extends(Weapon, _super);
    function Weapon(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.coEquippable = function (other) {
            if (other instanceof Weapon)
                return false;
            return true;
        };
        _this.weaponMove = function (newX, newY) {
            return true;
        };
        if (level)
            _this.game = level.game;
        return _this;
    }
    return Weapon;
}(equippable_1.Equippable));
exports.Weapon = Weapon;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Floor = /** @class */ (function (_super) {
    __extends(Floor, _super);
    function Floor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function () {
            /*this.level.game.drawSoftVis1x1(
              Game.tileset,
              this.variation,
              this.skin,
              1,
              1,
              this.x,
              this.y,
              this.x,
              this.y
            );*/
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.variation = 1;
        if (_this.skin == tile_1.SkinType.DUNGEON)
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12]);
        if (_this.skin == tile_1.SkinType.CAVE)
            //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12]);
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12]);
        return _this;
    }
    return Floor;
}(tile_1.Tile));
exports.Floor = Floor;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var particle_1 = __webpack_require__(9);
var SlashParticle = /** @class */ (function (_super) {
    __extends(SlashParticle, _super);
    function SlashParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function () {
            game_1.Game.drawFX(Math.round(_this.frame), 13, 1, 1, _this.x, _this.y, 1, 1);
            _this.frame += 0.5;
            if (_this.frame > 9)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 0.25;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return SlashParticle;
}(particle_1.Particle));
exports.SlashParticle = SlashParticle;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var sound_1 = __webpack_require__(2);
var Heart = /** @class */ (function (_super) {
    __extends(Heart, _super);
    function Heart(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onPickup = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            sound_1.Sound.heal();
            _this.level.items = _this.level.items.filter(function (x) { return x !== _this; }); // removes itself from the level
        };
        _this.tileX = 8;
        _this.tileY = 0;
        _this.offsetY = 0;
        return _this;
    }
    return Heart;
}(item_1.Item));
exports.Heart = Heart;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var GreenGem = /** @class */ (function (_super) {
    __extends(GreenGem, _super);
    function GreenGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "EMERALD";
        };
        _this.tileX = 11;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return GreenGem;
}(item_1.Item));
exports.GreenGem = GreenGem;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Projectile = /** @class */ (function () {
    function Projectile(x, y) {
        this.hitPlayer = function (player) { };
        this.hitEnemy = function (enemy) { };
        this.tick = function () { };
        this.draw = function () { };
        this.drawTopLayer = function () { };
        this.x = x;
        this.y = y;
        this.dead = false;
    }
    return Projectile;
}());
exports.Projectile = Projectile;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var enemy_1 = __webpack_require__(5);
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function () {
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function () { };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 1;
        _this.chainPushable = false;
        return _this;
    }
    return Resource;
}(enemy_1.Enemy));
exports.Resource = Resource;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var gameConstants_1 = __webpack_require__(4);
var game_1 = __webpack_require__(0);
exports.Input = {
    _pressed: {},
    isTapHold: false,
    tapStartTime: null,
    IS_TAP_HOLD_THRESH: 100,
    iListener: function () { },
    iUpListener: function () { },
    mListener: function () { },
    mUpListener: function () { },
    leftListener: function () { },
    rightListener: function () { },
    upListener: function () { },
    downListener: function () { },
    spaceListener: function () { },
    leftSwipeListener: function () { },
    rightSwipeListener: function () { },
    upSwipeListener: function () { },
    downSwipeListener: function () { },
    tapListener: function () { },
    mouseLeftClickListeners: [],
    mouseLeftClickListener: function (x, y) {
        for (var i = 0; i < exports.Input.mouseLeftClickListeners.length; i++)
            exports.Input.mouseLeftClickListeners[i](x, y);
    },
    mouseX: 0,
    mouseY: 0,
    lastPressTime: 0,
    lastPressKeyCode: 0,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    M: 77,
    N: 78,
    I: 73,
    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },
    onKeydown: function (event) {
        if (event.repeat)
            return; // ignore repeat keypresses
        exports.Input.lastPressTime = Date.now();
        exports.Input.lastPressKeyCode = event.keyCode;
        exports.Input._pressed[event.keyCode] = true;
        switch (event.keyCode) {
            case exports.Input.A:
            case exports.Input.LEFT:
                exports.Input.leftListener();
                break;
            case exports.Input.D:
            case exports.Input.RIGHT:
                exports.Input.rightListener();
                break;
            case exports.Input.W:
            case exports.Input.UP:
                exports.Input.upListener();
                break;
            case exports.Input.S:
            case exports.Input.DOWN:
                exports.Input.downListener();
                break;
            case exports.Input.SPACE:
                exports.Input.spaceListener();
                break;
            case exports.Input.M:
                exports.Input.mListener();
                break;
            case exports.Input.I:
                exports.Input.iListener();
                break;
        }
    },
    onKeyup: function (event) {
        delete this._pressed[event.keyCode];
        if (event.keyCode === this.lastPressKeyCode) {
            this.lastPressTime = 0;
            this.lastPressKeyCode = 0;
        }
        if (event.keyCode === 77)
            exports.Input.mUpListener();
        if (event.keyCode === 73)
            exports.Input.iUpListener();
    },
    mouseClickListener: function (event) {
        if (event.button === 0) {
            var rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            exports.Input.mouseLeftClickListener(Math.floor(x / game_1.Game.scale), Math.floor(y / game_1.Game.scale));
        }
    },
    updateMousePos: function (event) {
        var rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        exports.Input.mouseX = Math.floor(x / game_1.Game.scale);
        exports.Input.mouseY = Math.floor(y / game_1.Game.scale);
    },
    getTouches: function (evt) {
        return (evt.touches || evt.originalEvent.touches // browser API
        ); // jQuery
    },
    xDown: null,
    yDown: null,
    currentX: 0,
    currentY: 0,
    swiped: false,
    handleTouchStart: function (evt) {
        evt.preventDefault();
        var firstTouch = exports.Input.getTouches(evt)[0];
        exports.Input.xDown = firstTouch.clientX;
        exports.Input.yDown = firstTouch.clientY;
        exports.Input.currentX = firstTouch.clientX;
        exports.Input.currentY = firstTouch.clientY;
        exports.Input.tapStartTime = Date.now();
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.swiped = false;
    },
    handleTouchMove: function (evt) {
        evt.preventDefault();
        exports.Input.currentX = evt.touches[0].clientX;
        exports.Input.currentY = evt.touches[0].clientY;
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        if (exports.Input.swiped)
            return;
        var xDiff = exports.Input.xDown - exports.Input.currentX;
        var yDiff = exports.Input.yDown - exports.Input.currentY;
        // we have not swiped yet
        // check if we've swiped
        if (Math.pow(xDiff, 2) + Math.pow(yDiff, 2) >= gameConstants_1.GameConstants.SWIPE_THRESH) {
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                /*most significant*/
                if (xDiff > 0) {
                    exports.Input.leftSwipeListener();
                }
                else {
                    exports.Input.rightSwipeListener();
                }
                exports.Input.swiped = true;
            }
            else {
                if (yDiff > 0) {
                    exports.Input.upSwipeListener();
                }
                else {
                    exports.Input.downSwipeListener();
                }
                exports.Input.swiped = true;
            }
        }
    },
    handleTouchEnd: function (evt) {
        evt.preventDefault();
        if (!exports.Input.isTapHold && !exports.Input.swiped)
            exports.Input.tapListener();
        exports.Input.isTapHold = false;
        exports.Input.tapStartTime = null;
        // we've already swiped, don't count the click
        if (exports.Input.swiped)
            return;
        exports.Input.mouseClickListener({
            button: 0,
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.updateMousePos({
            clientX: 0,
            clientY: 0,
        });
    },
    checkIsTapHold: function () {
        if (exports.Input.tapStartTime !== null && Date.now() >= exports.Input.tapStartTime + exports.Input.IS_TAP_HOLD_THRESH)
            exports.Input.isTapHold = true;
    },
};
window.addEventListener("keyup", function (event) {
    exports.Input.onKeyup(event);
}, false);
window.addEventListener("keydown", function (event) {
    exports.Input.onKeydown(event);
}, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("click", function (event) { return exports.Input.mouseClickListener(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("mousemove", function (event) { return exports.Input.updateMousePos(event); });


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var floor_1 = __webpack_require__(18);
var Bones = /** @class */ (function (_super) {
    __extends(Bones, _super);
    function Bones() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.draw = function () {
            game_1.Game.drawTile(7, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Bones;
}(floor_1.Floor));
exports.Bones = Bones;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var particle_1 = __webpack_require__(9);
var DeathParticle = /** @class */ (function (_super) {
    __extends(DeathParticle, _super);
    function DeathParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function () {
            var yOffset = Math.max(0, ((_this.frame - 3) * 3) / gameConstants_1.GameConstants.TILESIZE);
            var f = Math.round(_this.frame);
            if (f == 2 || f == 4 || f == 6)
                game_1.Game.drawMob(2, 0, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            else
                game_1.Game.drawFX(Math.round(_this.frame), 4, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            _this.frame += 0.3;
            if (_this.frame > 10)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 1.5;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return DeathParticle;
}(particle_1.Particle));
exports.DeathParticle = DeathParticle;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var levelConstants_1 = __webpack_require__(7);
var HealthBar = /** @class */ (function () {
    function HealthBar() {
        var _this = this;
        this.hurt = function () {
            _this.hurtTimer = Date.now();
        };
        this.draw = function (hearts, maxHearts, x, y, flashing) {
            var t = Date.now() - _this.hurtTimer;
            if (t <= levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME) {
                var fullHearts = Math.floor(hearts);
                var halfHearts = Math.ceil(hearts - fullHearts);
                var emptyHearts = maxHearts - fullHearts - halfHearts;
                // I wouldn't normally use magic numbers here, but these are hardcoded based on the tileset
                //   (which isn't really parameterizable)
                var drawWidth = Math.round(Math.min(9, Math.min(0.05 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.05 * t)));
                var drawHeight = Math.round(Math.min(0.5, Math.min(0.003 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.003 * t)) * 16) / 16.0;
                var width = (drawWidth * (maxHearts - 1) + 8) / 16.0;
                var xxStart = 0.5 + -width / 2;
                for (var i = 0; i < Math.ceil(0.5 * maxHearts); i++) {
                    var tileX = 0;
                    if (!flashing)
                        tileX = 1.5;
                    else if (i < fullHearts)
                        tileX = 0;
                    else if (i < fullHearts + halfHearts)
                        tileX = 0.5;
                    else
                        tileX = 1;
                    var xx = (drawWidth * i) / 16.0 + xxStart;
                    game_1.Game.drawFX(tileX, 8, 0.5, 0.5, x + xx, y - 1 - drawHeight / 2, 0.5, drawHeight);
                    xx += 9.0 / 16.0;
                    var j = maxHearts - i - 1;
                    if (j !== i) {
                        var tileX_1 = 0;
                        if (!flashing)
                            tileX_1 = 1.5;
                        else if (j < fullHearts)
                            tileX_1 = 0;
                        else if (j < fullHearts + halfHearts)
                            tileX_1 = 0.5;
                        else
                            tileX_1 = 1;
                        var xx_1 = (drawWidth * j) / 16.0 + xxStart;
                        game_1.Game.drawFX(tileX_1, 8, 0.5, 0.5, x + xx_1, y - 1 - drawHeight / 2, 0.5, drawHeight);
                        xx_1 += 9.0 / 16.0;
                    }
                }
            }
        };
        this.hurtTimer = 0;
    }
    return HealthBar;
}());
exports.HealthBar = HealthBar;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var equippable_1 = __webpack_require__(11);
var Key = /** @class */ (function (_super) {
    __extends(Key, _super);
    function Key(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "KEY\nAn iron key.";
        };
        _this.tileX = 1;
        _this.tileY = 0;
        return _this;
    }
    return Key;
}(equippable_1.Equippable));
exports.Key = Key;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var key_1 = __webpack_require__(28);
var heart_1 = __webpack_require__(20);
var armor_1 = __webpack_require__(16);
var enemy_1 = __webpack_require__(5);
var greengem_1 = __webpack_require__(21);
var genericParticle_1 = __webpack_require__(3);
var coin_1 = __webpack_require__(8);
var sound_1 = __webpack_require__(2);
var Chest = /** @class */ (function (_super) {
    __extends(Chest, _super);
    function Chest(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            sound_1.Sound.chest();
            _this.dead = true;
            // DROP TABLES!
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            var drop = game_1.Game.randTable([1, 1, 1, 2, 2, 3]);
            switch (drop) {
                case 1:
                    _this.game.level.items.push(new coin_1.Coin(_this.level, _this.x, _this.y));
                    break;
                case 2:
                    _this.game.level.items.push(new heart_1.Heart(_this.level, _this.x, _this.y));
                    break;
                case 3:
                    _this.game.level.items.push(new greengem_1.GreenGem(_this.level, _this.x, _this.y));
                    break;
                case 3:
                    _this.game.level.items.push(new key_1.Key(_this.level, _this.x, _this.y));
                    break;
                case 4:
                    _this.game.level.items.push(new armor_1.Armor(_this.level, _this.x, _this.y));
                    break;
            }
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function () {
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function () { };
        _this.tileX = 4;
        _this.tileY = 0;
        _this.health = 1;
        return _this;
    }
    return Chest;
}(enemy_1.Enemy));
exports.Chest = Chest;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var wall_1 = __webpack_require__(47);
var levelConstants_1 = __webpack_require__(7);
var floor_1 = __webpack_require__(18);
var game_1 = __webpack_require__(0);
var door_1 = __webpack_require__(15);
var bottomDoor_1 = __webpack_require__(10);
var wallSide_1 = __webpack_require__(48);
var tile_1 = __webpack_require__(1);
var knightEnemy_1 = __webpack_require__(49);
var chest_1 = __webpack_require__(29);
var goldenKey_1 = __webpack_require__(51);
var spawnfloor_1 = __webpack_require__(52);
var spike_1 = __webpack_require__(53);
var gameConstants_1 = __webpack_require__(4);
var wizardEnemy_1 = __webpack_require__(54);
var skullEnemy_1 = __webpack_require__(33);
var barrel_1 = __webpack_require__(13);
var crate_1 = __webpack_require__(12);
var armor_1 = __webpack_require__(16);
var spiketrap_1 = __webpack_require__(31);
var fountainTile_1 = __webpack_require__(58);
var coffinTile_1 = __webpack_require__(59);
var pottedPlant_1 = __webpack_require__(60);
var insideLevelDoor_1 = __webpack_require__(61);
var button_1 = __webpack_require__(62);
var hitWarning_1 = __webpack_require__(14);
var upLadder_1 = __webpack_require__(63);
var downLadder_1 = __webpack_require__(34);
var coalResource_1 = __webpack_require__(64);
var goldResource_1 = __webpack_require__(66);
var emeraldResource_1 = __webpack_require__(67);
var chasm_1 = __webpack_require__(68);
var spawner_1 = __webpack_require__(69);
var vendingMachine_1 = __webpack_require__(71);
var chargeEnemy_1 = __webpack_require__(72);
var shotgun_1 = __webpack_require__(36);
var heart_1 = __webpack_require__(20);
var spear_1 = __webpack_require__(37);
var RoomType;
(function (RoomType) {
    RoomType[RoomType["DUNGEON"] = 0] = "DUNGEON";
    RoomType[RoomType["BIGDUNGEON"] = 1] = "BIGDUNGEON";
    RoomType[RoomType["TREASURE"] = 2] = "TREASURE";
    RoomType[RoomType["FOUNTAIN"] = 3] = "FOUNTAIN";
    RoomType[RoomType["COFFIN"] = 4] = "COFFIN";
    RoomType[RoomType["GRASS"] = 5] = "GRASS";
    RoomType[RoomType["PUZZLE"] = 6] = "PUZZLE";
    RoomType[RoomType["KEYROOM"] = 7] = "KEYROOM";
    RoomType[RoomType["CHESSBOARD"] = 8] = "CHESSBOARD";
    RoomType[RoomType["MAZE"] = 9] = "MAZE";
    RoomType[RoomType["CORRIDOR"] = 10] = "CORRIDOR";
    RoomType[RoomType["SPIKECORRIDOR"] = 11] = "SPIKECORRIDOR";
    RoomType[RoomType["UPLADDER"] = 12] = "UPLADDER";
    RoomType[RoomType["DOWNLADDER"] = 13] = "DOWNLADDER";
    RoomType[RoomType["SHOP"] = 14] = "SHOP";
    RoomType[RoomType["CAVE"] = 15] = "CAVE";
    RoomType[RoomType["SPAWNER"] = 16] = "SPAWNER";
})(RoomType = exports.RoomType || (exports.RoomType = {}));
var TurnState;
(function (TurnState) {
    TurnState[TurnState["playerTurn"] = 0] = "playerTurn";
    TurnState[TurnState["computerTurn"] = 1] = "computerTurn";
})(TurnState = exports.TurnState || (exports.TurnState = {}));
// LevelGenerator -> Level()
// Level.generate()
var Level = /** @class */ (function () {
    function Level(game, x, y, w, h, type, difficulty) {
        var _this = this;
        this.shadeColor = "black";
        this.tileInside = function (tileX, tileY) {
            return _this.pointInside(tileX, tileY, _this.roomX, _this.roomY, _this.width, _this.height);
        };
        this.generateDungeon = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            var factor = game_1.Game.rand(1, 36);
            _this.buildEmptyRoom();
            if (factor < 30)
                _this.addWallBlocks();
            if (factor < 26)
                _this.addFingers();
            if (factor % 4 === 0)
                _this.addChasms();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            if (factor % 3 === 0)
                _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4]));
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5]));
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles * (_this.depth * 0.5 + 0.5) * game_1.Game.randTable([0, 0, 0.05, 0.05, 0.06, 0.07, 0.1]));
            _this.addEnemies(numEnemies);
            if (numEnemies > 0)
                _this.addObstacles(numEnemies / game_1.Game.rand(1, 2));
            else
                _this.addObstacles(game_1.Game.randTable([0, 0, 1, 1, 2, 3, 5]));
        };
        this.generateBigDungeon = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            if (game_1.Game.rand(1, 4) === 1)
                _this.addChasms();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            if (game_1.Game.rand(1, 4) === 1)
                _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4]));
            if (game_1.Game.rand(1, 3) === 1)
                _this.addSpikeTraps(game_1.Game.randTable([3, 5, 7, 8]));
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles * (_this.depth * 0.5 + 0.5) * game_1.Game.randTable([0.05, 0.05, 0.06, 0.07, 0.1]));
            _this.addEnemies(numEnemies);
            if (numEnemies > 0)
                _this.addObstacles(numEnemies / game_1.Game.rand(1, 2));
            else
                _this.addObstacles(game_1.Game.randTable([0, 0, 1, 1, 2, 3, 5]));
        };
        this.generateSpawner = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            _this.enemies.push(new spawner_1.Spawner(_this, _this.game, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2)));
        };
        this.generateKeyRoom = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            _this.items.push(new goldenKey_1.GoldenKey(_this, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2)));
        };
        this.generateFountain = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            var centerX = Math.floor(_this.roomX + _this.width / 2);
            var centerY = Math.floor(_this.roomY + _this.height / 2);
            for (var x = centerX - 1; x <= centerX + 1; x++) {
                for (var y = centerY - 1; y <= centerY + 1; y++) {
                    _this.levelArray[x][y] = new fountainTile_1.FountainTile(_this, x, y, x - (centerX - 1), y - (centerY - 1));
                }
            }
            _this.addPlants(game_1.Game.randTable([0, 0, 1, 2]));
        };
        this.placeCoffin = function (x, y) {
            _this.levelArray[x][y] = new coffinTile_1.CoffinTile(_this, x, y, 0);
            _this.levelArray[x][y + 1] = new coffinTile_1.CoffinTile(_this, x, y + 1, 1);
        };
        this.generateCoffin = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2 - 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2) + 2, Math.floor(_this.roomY + _this.height / 2));
        };
        this.generatePuzzle = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            var d;
            for (var x_1 = _this.roomX; x_1 < _this.roomX + _this.width; x_1++) {
                var y_1 = _this.roomY + Math.floor(_this.height / 2);
                if (x_1 === _this.roomX + Math.floor(_this.width / 2)) {
                    d = new insideLevelDoor_1.InsideLevelDoor(_this, _this.game, x_1, y_1 + 1);
                    _this.levelArray[x_1][y_1 + 1] = d;
                }
                else {
                    _this.levelArray[x_1][y_1] = new wall_1.Wall(_this, x_1, y_1, 0);
                }
            }
            var x = game_1.Game.rand(_this.roomX, _this.roomX + _this.width - 1);
            var y = game_1.Game.rand(_this.roomY + Math.floor(_this.height / 2) + 3, _this.roomY + _this.height - 2);
            _this.levelArray[x][y] = new button_1.Button(_this, x, y, d);
            var crateTiles = _this.getEmptyMiddleTiles().filter(function (t) {
                return t.x >= _this.roomX + 1 &&
                    t.x <= _this.roomX + _this.width - 2 &&
                    t.y >= _this.roomY + Math.floor(_this.height / 2) + 3 &&
                    t.y <= _this.roomY + _this.height - 2;
            });
            var numCrates = game_1.Game.randTable([1, 2, 2, 3, 4]);
            for (var i = 0; i < numCrates; i++) {
                var t = crateTiles.splice(game_1.Game.rand(0, crateTiles.length - 1), 1)[0];
                _this.enemies.push(new crate_1.Crate(_this, _this.game, t.x, t.y));
            }
            _this.fixWalls();
            _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4]));
        };
        this.generateSpikeCorridor = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height - 1; y++) {
                    _this.levelArray[x][y] = new spiketrap_1.SpikeTrap(_this, x, y, game_1.Game.rand(0, 3));
                }
            }
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
        };
        this.generateTreasure = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.addWallBlocks();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 1, 1, 2, 2, 3, 4]));
            _this.addChests(game_1.Game.randTable([3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 6]));
            _this.addPlants(game_1.Game.randTable([0, 1, 2, 4, 5, 6]));
        };
        this.generateChessboard = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
        };
        this.generateCave = function () {
            _this.skin = tile_1.SkinType.CAVE;
            var factor = game_1.Game.rand(1, 36);
            _this.buildEmptyRoom();
            if (factor < 30)
                _this.addWallBlocks();
            if (factor < 26)
                _this.addFingers();
            if (factor % 4 === 0)
                _this.addChasms();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2, 3, 4]));
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5]));
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles * (_this.depth * 0.5 + 0.5) * game_1.Game.randTable([0, 0.07, 0.08, 0.09, 0.1, 0.15]));
            //if (Game.rand(1, 100) > numEmptyTiles) numEnemies = 0;
            _this.addEnemies(numEnemies);
            _this.addResources(game_1.Game.randTable([1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 7, 8, 8, 9, 10, 11, 12]));
        };
        this.generateUpLadder = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2]));
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            _this.upLadder = new upLadder_1.UpLadder(_this, _this.game, cX, cY);
            _this.levelArray[cX][cY] = _this.upLadder;
        };
        this.generateDownLadder = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 2]));
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            _this.levelArray[cX][cY] = new downLadder_1.DownLadder(_this, _this.game, cX, cY);
        };
        this.generateShop = function () {
            _this.skin = tile_1.SkinType.DUNGEON;
            _this.buildEmptyRoom();
            _this.fixWalls();
            _this.addTorches(2);
            var cX = Math.floor(_this.roomX + _this.width / 2);
            var cY = Math.floor(_this.roomY + _this.height / 2);
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX - 2, cY - 1, new shotgun_1.Shotgun(_this, 0, 0)));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX + 2, cY - 1, new heart_1.Heart(_this, 0, 0)));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX - 2, cY + 2, new armor_1.Armor(_this, 0, 0)));
            _this.enemies.push(new vendingMachine_1.VendingMachine(_this, _this.game, cX + 2, cY + 2, new spear_1.Spear(_this, 0, 0)));
        };
        this.addDoor = function (location, link) {
            var d;
            switch (location) {
                case 0:
                    d = new door_1.Door(_this, _this.game, _this.roomX, _this.roomY, link);
                    break;
                case 1:
                    d = new door_1.Door(_this, _this.game, _this.roomX + Math.floor(_this.width / 2), _this.roomY, link);
                    break;
                case 2:
                    d = new door_1.Door(_this, _this.game, _this.roomX + _this.width - 1, _this.roomY, link);
                    break;
                case 3:
                    _this.levelArray[_this.roomX][_this.roomY + _this.height] = new floor_1.Floor(_this, _this.roomX, _this.roomY + _this.height);
                    d = new bottomDoor_1.BottomDoor(_this, _this.game, _this.roomX, _this.roomY + _this.height + 1, link);
                    break;
                case 4:
                    _this.levelArray[_this.roomX + Math.floor(_this.width / 2)][_this.roomY + _this.height] = new floor_1.Floor(_this, _this.roomX + Math.floor(_this.width / 2), _this.roomY + _this.height);
                    d = new bottomDoor_1.BottomDoor(_this, _this.game, _this.roomX + Math.floor(_this.width / 2), _this.roomY + _this.height + 1, link);
                    break;
                case 5:
                    _this.levelArray[_this.roomX + _this.width - 1][_this.roomY + _this.height] = new floor_1.Floor(_this, _this.roomX + _this.width - 1, _this.roomY + _this.height);
                    d = new bottomDoor_1.BottomDoor(_this, _this.game, _this.roomX + _this.width - 1, _this.roomY + _this.height + 1, link);
                    break;
            }
            _this.doors.push(d);
            _this.levelArray[d.x][d.y] = d;
            return d;
        };
        this.exitLevel = function () {
            _this.particles.splice(0, _this.particles.length);
        };
        this.updateLevelTextColor = function () {
            levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR = "white";
            // no more color backgrounds:
            // if (this.env === 3) LevelConstants.LEVEL_TEXT_COLOR = "black";
        };
        this.enterLevel = function () {
            _this.updateLevelTextColor();
            _this.game.player.moveSnap(_this.roomX + Math.floor(_this.width / 2), _this.roomY + _this.height - 1);
            _this.updateLighting();
            _this.entered = true;
        };
        this.enterLevelThroughDoor = function (door) {
            _this.updateLevelTextColor();
            if (door instanceof door_1.Door) {
                door.opened = true;
                _this.game.player.moveNoSmooth(door.x, door.y + 1);
            }
            else {
                _this.game.player.moveNoSmooth(door.x, door.y - 1);
            }
            _this.updateLighting();
            _this.entered = true;
        };
        this.enterLevelThroughLadder = function (ladder) {
            _this.updateLevelTextColor();
            _this.game.player.moveSnap(ladder.x, ladder.y + 1);
            _this.updateLighting();
            _this.entered = true;
        };
        // doesn't include top row or bottom row, as to not block doors
        this.getEmptyMiddleTiles = function () {
            var returnVal = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY + 2; y < _this.roomY + _this.height - 1; y++) {
                    if (!_this.levelArray[x][y].isSolid() && !(_this.levelArray[x][y] instanceof spiketrap_1.SpikeTrap)) {
                        returnVal.push(_this.levelArray[x][y]);
                    }
                }
            }
            var _loop_1 = function (e) {
                returnVal = returnVal.filter(function (t) { return t.x !== e.x || t.y !== e.y; });
            };
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                _loop_1(e);
            }
            return returnVal;
        };
        // includes top row and bottom row
        this.getEmptyTiles = function () {
            var returnVal = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height; y++) {
                    if (!_this.levelArray[x][y].isSolid() && !(_this.levelArray[x][y] instanceof spiketrap_1.SpikeTrap)) {
                        returnVal.push(_this.levelArray[x][y]);
                    }
                }
            }
            var _loop_2 = function (e) {
                returnVal = returnVal.filter(function (t) { return t.x !== e.x || t.y !== e.y; });
            };
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                _loop_2(e);
            }
            return returnVal;
        };
        this.getTile = function (x, y) {
            for (var _i = 0, _a = _this.levelArray; _i < _a.length; _i++) {
                var col = _a[_i];
                for (var _b = 0, col_1 = col; _b < col_1.length; _b++) {
                    var tile = col_1[_b];
                    if (tile !== null && tile.x === x && tile.y === y)
                        return tile;
                }
            }
            return null;
        };
        this.fadeLighting = function () {
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    if (Math.abs(_this.softVis[x][y] - _this.vis[x][y]) >= 0.02) {
                        if (_this.softVis[x][y] < _this.vis[x][y])
                            _this.softVis[x][y] += 0.02;
                        else if (_this.softVis[x][y] > _this.vis[x][y])
                            _this.softVis[x][y] -= 0.02;
                    }
                    //if (this.softVis[x][y] < 0.05) this.softVis[x][y] = 0;
                }
            }
        };
        this.updateLighting = function () {
            var oldVis = [];
            for (var x = 0; x < _this.levelArray.length; x++) {
                oldVis[x] = [];
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    oldVis[x][y] = _this.vis[x][y];
                    _this.vis[x][y] = 1;
                    //if (this.visibilityArray[x][y] > LevelConstants.MIN_VISIBILITY)
                    //  this.visibilityArray[x][y] = 0;
                }
            }
            for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                _this.castShadowsAtAngle(i, _this.game.player.x + 0.5, _this.game.player.y + 0.5, _this.game.player.sightRadius - _this.depth);
            }
            for (var _i = 0, _a = _this.lightSources; _i < _a.length; _i++) {
                var l = _a[_i];
                for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                    _this.castShadowsAtAngle(i, l.x, l.y, l.r);
                }
            }
            if (levelConstants_1.LevelConstants.SMOOTH_LIGHTING)
                _this.vis = _this.blur3x3(_this.vis, [[1, 2, 1], [2, 8, 2], [1, 2, 1]]);
            /*for (let x = 0; x < this.visibilityArray.length; x++) {
              for (let y = 0; y < this.visibilityArray[0].length; y++) {
                if (this.visibilityArray[x][y] < oldVisibilityArray[x][y]) {
                  this.visibilityArray[x][y] = Math.min(
                    oldVisibilityArray[x][y],
                    LevelConstants.MIN_VISIBILITY
                  );
                }
              }
            }*/
        };
        this.castShadowsAtAngle = function (angle, px, py, radius) {
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            for (var i = 0; i < radius; i++) {
                if (Math.floor(px) < 0 ||
                    Math.floor(px) >= _this.levelArray.length ||
                    Math.floor(py) < 0 ||
                    Math.floor(py) >= _this.levelArray[0].length)
                    return; // we're outside the level
                var tile = _this.levelArray[Math.floor(px)][Math.floor(py)];
                if (tile.isOpaque() || (tile instanceof wall_1.Wall && tile.type === 1)) {
                    return;
                }
                _this.vis[Math.floor(px)][Math.floor(py)] = Math.min(_this.vis[Math.floor(px)][Math.floor(py)], Math.min(i / radius, 1));
                px += dx;
                py += dy;
            }
        };
        this.blur3x3 = function (array, weights) {
            var blurredArray = [];
            for (var x = 0; x < array.length; x++) {
                blurredArray[x] = [];
                for (var y = 0; y < array[0].length; y++) {
                    if (array[x][y] === 0) {
                        blurredArray[x][y] = 0;
                        continue;
                    }
                    var total = 0;
                    var totalWeights = 0;
                    for (var xx = -1; xx <= 1; xx++) {
                        for (var yy = -1; yy <= 1; yy++) {
                            if (x + xx >= 0 && x + xx < array.length && y + yy >= 0 && y + yy < array[0].length) {
                                total += array[x + xx][y + yy] * weights[xx + 1][yy + 1];
                                totalWeights += weights[xx + 1][yy + 1];
                            }
                        }
                    }
                    blurredArray[x][y] = total / totalWeights;
                }
            }
            return blurredArray;
        };
        this.catchUp = function () {
            if (_this.turn === TurnState.computerTurn)
                _this.computerTurn(); // player skipped computer's turn, catch up
        };
        this.tick = function () {
            _this.enemies = _this.enemies.filter(function (e) { return !e.dead; });
            _this.updateLighting();
            for (var _i = 0, _a = _this.projectiles; _i < _a.length; _i++) {
                var p = _a[_i];
                p.tick();
            }
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    _this.levelArray[x][y].tick();
                }
            }
            _this.turn = TurnState.computerTurn;
            _this.playerTurnTime = Date.now();
        };
        this.update = function () {
            if (_this.turn == TurnState.computerTurn) {
                if (Date.now() - _this.playerTurnTime >= levelConstants_1.LevelConstants.COMPUTER_TURN_DELAY) {
                    _this.computerTurn();
                }
            }
        };
        this.computerTurn = function () {
            // take computer turn
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                e.tick();
            }
            for (var _b = 0, _c = _this.items; _b < _c.length; _b++) {
                var i = _c[_b];
                i.tick();
            }
            for (var _d = 0, _e = _this.projectiles; _d < _e.length; _d++) {
                var p = _e[_d];
                if (_this.levelArray[p.x][p.y].isSolid())
                    p.dead = true;
                if (p.x === _this.game.player.x && p.y === _this.game.player.y) {
                    p.hitPlayer(_this.game.player);
                }
                for (var _f = 0, _g = _this.enemies; _f < _g.length; _f++) {
                    var e = _g[_f];
                    if (p.x === e.x && p.y === e.y) {
                        p.hitEnemy(e);
                    }
                }
            }
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    _this.levelArray[x][y].tickEnd();
                }
            }
            _this.game.player.finishTick();
            _this.turn = TurnState.playerTurn;
        };
        /* TODO fix turn skipping bug
        
        computerTurnDelayed = () => {
          // take computer turn
          for (const p of this.projectiles) {
            p.tickDelayAnim();
          }
          for (const e of this.enemies) {
            e.tickDelayAnim();
          }
          for (const i of this.items) {
            i.tickDelayAnim();
          }
      
          this.turn = TurnState.playerTurn; // now it's the player's turn
        };*/
        this.draw = function () {
            hitWarning_1.HitWarning.updateFrame();
            _this.fadeLighting();
            for (var x = _this.roomX - 1; x < _this.roomX + _this.width + 1; x++) {
                for (var y = _this.roomY - 1; y < _this.roomY + _this.height + 1; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.levelArray[x][y].draw();
                }
            }
        };
        this.drawEntitiesBehindPlayer = function () {
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.levelArray[x][y].drawUnderPlayer();
                }
            }
            _this.enemies.sort(function (a, b) { return a.y - b.y; });
            _this.items.sort(function (a, b) { return a.y - b.y; });
            for (var _i = 0, _a = _this.particles; _i < _a.length; _i++) {
                var p = _a[_i];
                p.drawBehind();
            }
            _this.projectiles = _this.projectiles.filter(function (p) { return !p.dead; });
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.draw();
            }
            for (var _d = 0, _e = _this.items; _d < _e.length; _d++) {
                var i = _e[_d];
                if (i.y <= _this.game.player.y)
                    i.draw();
            }
            for (var _f = 0, _g = _this.enemies; _f < _g.length; _f++) {
                var e = _g[_f];
                if (e.y <= _this.game.player.y)
                    e.draw();
            }
        };
        this.drawEntitiesInFrontOfPlayer = function () {
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.levelArray[x][y].drawAbovePlayer();
                }
            }
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.y > _this.game.player.y)
                    i.draw();
            }
            for (var _b = 0, _c = _this.enemies; _b < _c.length; _b++) {
                var e = _c[_b];
                if (e.y > _this.game.player.y)
                    e.draw();
            }
            _this.particles = _this.particles.filter(function (x) { return !x.dead; });
            for (var _d = 0, _e = _this.particles; _d < _e.length; _d++) {
                var p = _e[_d];
                p.draw();
            }
            // D I T H E R E D     S H A D I N G
            /*for (let x = this.roomX - 1; x < this.roomX + this.width + 1; x++) {
              for (let y = this.roomY - 1; y < this.roomY + this.height + 1; y++) {
                let frame = Math.round(6 * (this.softVis[x][y] / LevelConstants.MIN_VISIBILITY));
                Game.drawFX(frame, 10, 1, 1, x, y, 1, 1);
              }
            }*/
            for (var _f = 0, _g = _this.items; _f < _g.length; _f++) {
                var i = _g[_f];
                if (i.y <= _this.game.player.y)
                    i.drawTopLayer();
            }
        };
        this.drawShade = function () {
            var shadingAlpha = Math.max(0, Math.min(0.8, (2 * _this.depth) / _this.game.player.sightRadius));
            game_1.Game.ctx.globalAlpha = shadingAlpha;
            //Game.ctx.fillStyle = "#400a0e";
            game_1.Game.ctx.fillStyle = _this.shadeColor;
            game_1.Game.ctx.fillRect((_this.roomX - levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.roomY - levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE, (_this.width + 2 * levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.height + 2 * levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE);
            game_1.Game.ctx.globalAlpha = 1.0;
            game_1.Game.ctx.globalCompositeOperation = "source-over";
        };
        this.drawOverShade = function () {
            for (var _i = 0, _a = _this.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                e.drawTopLayer(); // health bars
            }
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.drawTopLayer();
            }
            // draw over dithered shading
            for (var x = 0; x < _this.levelArray.length; x++) {
                for (var y = 0; y < _this.levelArray[0].length; y++) {
                    _this.levelArray[x][y].drawAboveShading();
                }
            }
        };
        // for stuff rendered on top of the player
        this.drawTopLayer = function () {
            // gui stuff
            // room name
            var old = game_1.Game.ctx.font;
            game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
            game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            game_1.Game.fillText(_this.name, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.ctx.measureText(_this.name).width / 2, 1);
            game_1.Game.ctx.font = old;
        };
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.depth = difficulty;
        this.entered = false;
        this.turn = TurnState.playerTurn;
        this.playerTurnTime = Date.now();
        this.items = Array();
        this.projectiles = Array();
        this.particles = Array();
        this.doors = Array();
        this.enemies = Array();
        this.lightSources = Array();
        this.levelArray = [];
        for (var x_2 = 0; x_2 < levelConstants_1.LevelConstants.ROOM_W; x_2++) {
            this.levelArray[x_2] = [];
        }
        this.vis = [];
        this.softVis = [];
        for (var x_3 = 0; x_3 < levelConstants_1.LevelConstants.ROOM_W; x_3++) {
            this.vis[x_3] = [];
            this.softVis[x_3] = [];
            for (var y_2 = 0; y_2 < levelConstants_1.LevelConstants.ROOM_H; y_2++) {
                this.vis[x_3][y_2] = 1;
                this.softVis[x_3][y_2] = 1;
            }
        }
        this.roomX = Math.floor(levelConstants_1.LevelConstants.ROOM_W / 2 - this.width / 2);
        this.roomY = Math.floor(levelConstants_1.LevelConstants.ROOM_H / 2 - this.height / 2);
        this.upLadder = null;
        this.name = "";
        switch (this.type) {
            case RoomType.DUNGEON:
                this.generateDungeon();
                break;
            case RoomType.BIGDUNGEON:
                this.generateBigDungeon();
                break;
            case RoomType.FOUNTAIN:
                this.generateFountain();
                break;
            case RoomType.COFFIN:
                this.generateCoffin();
                break;
            case RoomType.PUZZLE:
                this.generatePuzzle();
                break;
            case RoomType.SPIKECORRIDOR:
                this.generateSpikeCorridor();
                break;
            case RoomType.TREASURE:
                this.generateTreasure();
                break;
            case RoomType.CHESSBOARD: // TODO
                this.generateChessboard();
                break;
            case RoomType.KEYROOM:
                this.generateKeyRoom();
                break;
            case RoomType.GRASS:
                this.generateDungeon();
                break;
            case RoomType.CAVE:
                this.generateCave();
                break;
            case RoomType.UPLADDER:
                this.generateUpLadder();
                this.name = "FLOOR " + -this.depth;
                break;
            case RoomType.DOWNLADDER:
                this.generateDownLadder();
                this.name = "FLOOR " + -this.depth;
                break;
            case RoomType.SHOP:
                /* shop rates:
                 * 10 coal for an gold coin
                 * 1 gold for 10 coins
                 * 1 emerald for 100 coins
                 *
                 * shop items:
                 * 1 empty heart   4 ^ (maxHealth + maxHealth ^ 1.05 ^ maxHealth - 2.05) coins
                 * fill all hearts  1 coin
                 * better torch    5 ^ (torchLevel + 1.05 ^ torchLevel - 2.05) coins
                 * weapons
                 */
                this.generateShop();
                break;
            case RoomType.SPAWNER:
                this.generateSpawner();
        }
    }
    Level.prototype.pointInside = function (x, y, rX, rY, rW, rH) {
        if (x < rX || x >= rX + rW)
            return false;
        if (y < rY || y >= rY + rH)
            return false;
        return true;
    };
    Level.prototype.fixWalls = function () {
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            this.levelArray[x][this.roomY + 1] = new floor_1.Floor(this, x, this.roomY + 1);
            this.levelArray[x][this.roomY + this.height - 1] = new floor_1.Floor(this, x, this.roomY + this.height - 1);
        }
        // fixWalls performs these changes:
        // Wall     Wall
        // Floor -> WallSide
        // Floor    Floor
        // Wall     Wall
        // Wall  -> WallSide
        // Floor    Floor
        // Wall     Wall
        // Floor    Floor
        // Wall  -> Floor
        // Floor    Floor
        // Wall     Wall
        for (var x = 0; x < levelConstants_1.LevelConstants.ROOM_W; x++) {
            for (var y = 0; y < levelConstants_1.LevelConstants.ROOM_H; y++) {
                if (this.levelArray[x][y] instanceof wall_1.Wall) {
                    if (this.levelArray[x][y + 1] instanceof floor_1.Floor ||
                        this.levelArray[x][y + 1] instanceof spawnfloor_1.SpawnFloor) {
                        if (this.levelArray[x][y + 2] instanceof floor_1.Floor ||
                            this.levelArray[x][y + 2] instanceof spawnfloor_1.SpawnFloor)
                            this.levelArray[x][y + 1] = new wallSide_1.WallSide(this, x, y + 1);
                        else {
                            if (this.levelArray[x][y - 1] instanceof wall_1.Wall)
                                this.levelArray[x][y] = new wallSide_1.WallSide(this, x, y);
                            else
                                this.levelArray[x][y] = new floor_1.Floor(this, x, y);
                        }
                    }
                }
            }
        }
    };
    Level.prototype.buildEmptyRoom = function () {
        // fill in outside walls
        for (var x = 0; x < levelConstants_1.LevelConstants.ROOM_W; x++) {
            for (var y = 0; y < levelConstants_1.LevelConstants.ROOM_H; y++) {
                this.levelArray[x][y] = new wall_1.Wall(this, x, y, 1);
            }
        }
        // put in floors
        for (var x = 0; x < levelConstants_1.LevelConstants.ROOM_W; x++) {
            for (var y = 0; y < levelConstants_1.LevelConstants.ROOM_H; y++) {
                if (this.pointInside(x, y, this.roomX, this.roomY, this.width, this.height)) {
                    this.levelArray[x][y] = new floor_1.Floor(this, x, y);
                }
            }
        }
        // outer ring walls
        for (var x = 0; x < levelConstants_1.LevelConstants.ROOM_W; x++) {
            for (var y = 0; y < levelConstants_1.LevelConstants.ROOM_H; y++) {
                if (this.pointInside(x, y, this.roomX - 1, this.roomY - 1, this.width + 2, this.height + 2)) {
                    if (!this.pointInside(x, y, this.roomX, this.roomY, this.width, this.height)) {
                        this.levelArray[x][y] = new wall_1.Wall(this, x, y, 0);
                    }
                }
            }
        }
    };
    Level.prototype.addWallBlocks = function () {
        // put some random wall blocks in the room
        var numBlocks = game_1.Game.randTable([0, 1, 1, 2, 2, 2, 2, 3, 3]);
        for (var i = 0; i < numBlocks; i++) {
            var blockW = Math.min(game_1.Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5, 6, 7, 9]), this.width - 2);
            var blockH = Math.min(blockW + game_1.Game.rand(-1, 1), this.height - 3);
            var x = game_1.Game.rand(this.roomX + 1, this.roomX + this.width - blockW - 2);
            var y = game_1.Game.rand(this.roomY + 2, this.roomY + this.height - blockH - 2);
            for (var xx = x; xx < x + blockW; xx++) {
                for (var yy = y; yy < y + blockH; yy++) {
                    this.levelArray[xx][yy] = new wall_1.Wall(this, xx, yy, 0);
                }
            }
        }
    };
    Level.prototype.addFingers = function () {
        // add "finger" blocks extending from ring walls inward
        var numFingers = game_1.Game.randTable([0, 1, 1, 2, 2, 3, 4, 5]);
        if (game_1.Game.rand(1, 13) > this.width)
            numFingers += this.width * 0.3;
        for (var i = 0; i < numFingers; i++) {
            var x = 0;
            var y = 0;
            var blockW = 0;
            var blockH = 0;
            if (game_1.Game.rand(0, 1) === 0) {
                // horizontal
                blockW = game_1.Game.rand(1, this.width - 1);
                blockH = 1;
                if (game_1.Game.rand(0, 1) === 0) {
                    // left
                    x = this.roomX;
                    y = game_1.Game.rand(this.roomY + 2, this.roomY + this.height - blockH - 2);
                    for (var xx = x; xx < x + blockW + 1; xx++) {
                        for (var yy = y - 2; yy < y + blockH + 2; yy++) {
                            this.levelArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                        }
                    }
                    for (var xx = x; xx < x + blockW; xx++) {
                        for (var yy = y; yy < y + blockH; yy++) {
                            this.levelArray[xx][yy] = new wall_1.Wall(this, xx, yy, 0);
                        }
                    }
                }
                else {
                    x = this.roomX + this.width - blockW;
                    y = game_1.Game.rand(this.roomY + 2, this.roomY + this.height - blockH - 2);
                    for (var xx = x - 1; xx < x + blockW; xx++) {
                        for (var yy = y - 2; yy < y + blockH + 2; yy++) {
                            this.levelArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                        }
                    }
                    for (var xx = x; xx < x + blockW; xx++) {
                        for (var yy = y; yy < y + blockH; yy++) {
                            this.levelArray[xx][yy] = new wall_1.Wall(this, xx, yy, 0);
                        }
                    }
                }
            }
            else {
                blockW = 1;
                blockH = game_1.Game.rand(1, this.height - 4);
                if (game_1.Game.rand(0, 1) === 0) {
                    // top
                    y = this.roomY + 2;
                    x = game_1.Game.rand(this.roomX + 2, this.roomX + this.width - 3);
                    for (var xx = x - 1; xx < x + blockW + 1; xx++) {
                        for (var yy = y + 1; yy < y + blockH + 2; yy++) {
                            this.levelArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                        }
                    }
                    for (var xx = x; xx < x + blockW; xx++) {
                        for (var yy = y; yy < y + blockH; yy++) {
                            this.levelArray[xx][yy] = new wall_1.Wall(this, xx, yy, 0);
                        }
                    }
                }
                else {
                    y = this.roomY + this.height - blockH - 1;
                    x = game_1.Game.rand(this.roomX + 2, this.roomX + this.width - 3);
                    for (var xx = x - 1; xx < x + blockW + 1; xx++) {
                        for (var yy = y - 2; yy < y + blockH; yy++) {
                            this.levelArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                        }
                    }
                    for (var xx = x; xx < x + blockW; xx++) {
                        for (var yy = y; yy < y + blockH; yy++) {
                            this.levelArray[xx][yy] = new wall_1.Wall(this, xx, yy, 0);
                        }
                    }
                }
            }
        }
    };
    Level.prototype.addTorches = function (numTorches) {
        var walls = [];
        for (var xx = 0; xx < this.levelArray.length; xx++) {
            for (var yy = 0; yy < this.levelArray[0].length; yy++) {
                if (this.levelArray[xx][yy] instanceof wallSide_1.WallSide) {
                    walls.push(this.levelArray[xx][yy]);
                }
            }
        }
        for (var i = 0; i < numTorches; i++) {
            var t = void 0, x = void 0, y = void 0;
            if (walls.length == 0)
                return;
            t = walls.splice(game_1.Game.rand(0, walls.length - 1), 1)[0];
            x = t.x;
            y = t.y;
            //this.levelArray[x][y] = new WallSideTorch(this, x, y);
        }
    };
    Level.prototype.addChasms = function () {
        // add chasms
        var w = game_1.Game.rand(2, 4);
        var h = game_1.Game.rand(2, 4);
        var xmin = this.roomX + 1;
        var xmax = this.roomX + this.width - w - 1;
        var ymin = this.roomY + 2;
        var ymax = this.roomY + this.height - h - 1;
        if (xmax < xmin || ymax < ymin)
            return;
        var x = game_1.Game.rand(xmin, xmax);
        var y = game_1.Game.rand(ymin, ymax);
        for (var xx = x - 1; xx < x + w + 1; xx++) {
            for (var yy = y - 1; yy < y + h + 1; yy++) {
                // add a floor border
                if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h)
                    this.levelArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                else
                    this.levelArray[xx][yy] = new chasm_1.Chasm(this, xx, yy, xx === x, xx === x + w - 1, yy === y, yy === y + h - 1);
            }
        }
    };
    Level.prototype.addChests = function (numChests) {
        // add chests
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numChests; i++) {
            var t = void 0, x = void 0, y = void 0;
            if (tiles.length == 0)
                return;
            t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            x = t.x;
            y = t.y;
            this.enemies.push(new chest_1.Chest(this, this.game, x, y));
        }
    };
    Level.prototype.addSpikeTraps = function (numSpikes) {
        // add spikes
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numSpikes; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            this.levelArray[x][y] = new spiketrap_1.SpikeTrap(this, x, y);
        }
    };
    Level.prototype.addSpikes = function (numSpikes) {
        // add spikes
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numSpikes; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            this.levelArray[x][y] = new spike_1.Spike(this, x, y);
        }
    };
    Level.prototype.addEnemies = function (numEnemies) {
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numEnemies; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            if (this.depth !== 0) {
                var d = game_1.Game.rand(1, Math.min(3, this.depth));
                switch (d) {
                    case 1:
                        this.enemies.push(new knightEnemy_1.KnightEnemy(this, this.game, x, y));
                        break;
                    case 2:
                        this.enemies.push(new skullEnemy_1.SkullEnemy(this, this.game, x, y));
                        break;
                    case 3:
                        this.enemies.push(new wizardEnemy_1.WizardEnemy(this, this.game, x, y));
                        break;
                    case 4:
                        this.enemies.push(new chargeEnemy_1.ChargeEnemy(this, this.game, x, y));
                        break;
                }
            }
        }
    };
    Level.prototype.addObstacles = function (numObstacles) {
        // add crates/barrels
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numObstacles; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            switch (game_1.Game.rand(1, 2)) {
                case 1:
                    this.enemies.push(new crate_1.Crate(this, this.game, x, y));
                    break;
                case 2:
                    this.enemies.push(new barrel_1.Barrel(this, this.game, x, y));
                    break;
            }
        }
    };
    Level.prototype.addPlants = function (numPlants) {
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numPlants; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            this.enemies.push(new pottedPlant_1.PottedPlant(this, this.game, x, y));
        }
    };
    Level.prototype.addResources = function (numResources) {
        var tiles = this.getEmptyMiddleTiles();
        for (var i = 0; i < numResources; i++) {
            var t = tiles.splice(game_1.Game.rand(0, tiles.length - 1), 1)[0];
            if (tiles.length == 0)
                return;
            var x = t.x;
            var y = t.y;
            var r = game_1.Game.rand(0, 150);
            if (r <= 150 - Math.pow(this.depth, 3))
                this.enemies.push(new coalResource_1.CoalResource(this, this.game, x, y));
            else if (r <= 150 - Math.pow(Math.max(0, this.depth - 5), 3))
                this.enemies.push(new goldResource_1.GoldResource(this, this.game, x, y));
            else
                this.enemies.push(new emeraldResource_1.EmeraldResource(this, this.game, x, y));
        }
    };
    return Level;
}());
exports.Level = Level;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var crate_1 = __webpack_require__(12);
var barrel_1 = __webpack_require__(13);
var hitWarning_1 = __webpack_require__(14);
var SpikeTrap = /** @class */ (function (_super) {
    __extends(SpikeTrap, _super);
    function SpikeTrap(level, x, y, tickCount) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tick = function () {
            _this.tickCount++;
            if (_this.tickCount >= 4)
                _this.tickCount = 0;
            _this.on = _this.tickCount === 0;
            if (_this.on) {
                if (_this.level.game.player.x === _this.x && _this.level.game.player.y === _this.y)
                    _this.level.game.player.hurt(1);
            }
            if (_this.tickCount === 3)
                _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.level.game, _this.x, _this.y));
        };
        _this.tickEnd = function () {
            if (_this.on) {
                for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                    var e = _a[_i];
                    if (e.x === _this.x && e.y === _this.y) {
                        e.hurt(1);
                    }
                }
            }
        };
        _this.onCollideEnemy = function (enemy) {
            if (_this.on && !(enemy instanceof crate_1.Crate || enemy instanceof barrel_1.Barrel))
                enemy.hurt(1);
        };
        _this.draw = function () {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.t = 0;
        _this.drawUnderPlayer = function () {
            var rumbleOffsetX = 0;
            _this.t++;
            if (!_this.on && _this.tickCount === 3) {
                if (_this.t % 4 === 1)
                    rumbleOffsetX = 0.0325;
                if (_this.t % 4 === 3)
                    rumbleOffsetX = -0.0325;
            }
            var frames = [0, 1, 2, 3, 3, 4, 2, 0];
            var f = 6 + frames[Math.floor(_this.frame)];
            if (_this.tickCount === 1 || (_this.tickCount === 0 && frames[Math.floor(_this.frame)] === 0)) {
                f = 5;
            }
            game_1.Game.drawObj(f, 0, 1, 2, _this.x + rumbleOffsetX, _this.y - 1, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            if (_this.on && _this.frame < frames.length - 1) {
                if (frames[Math.floor(_this.frame)] < 3)
                    _this.frame += 0.4;
                else
                    _this.frame += 0.2;
            }
            if (!_this.on)
                _this.frame = 0;
        };
        if (tickCount)
            _this.tickCount = tickCount;
        else
            _this.tickCount = 0;
        _this.on = false;
        _this.frame = 0;
        return _this;
    }
    return SpikeTrap;
}(tile_1.Tile));
exports.SpikeTrap = SpikeTrap;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var BlueGem = /** @class */ (function (_super) {
    __extends(BlueGem, _super);
    function BlueGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "RUBY";
        };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return BlueGem;
}(item_1.Item));
exports.BlueGem = BlueGem;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var hitWarning_1 = __webpack_require__(14);
var genericParticle_1 = __webpack_require__(3);
var coin_1 = __webpack_require__(8);
var redgem_1 = __webpack_require__(57);
var SkullEnemy = /** @class */ (function (_super) {
    __extends(SkullEnemy, _super);
    function SkullEnemy(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.hit = function () {
            return 0.5;
        };
        _this.hurt = function (damage) {
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.tick = function () {
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health <= 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health = 2;
                    }
                }
                else {
                    if (_this.seenPlayer || _this.level.softVis[_this.x][_this.y] < 1) {
                        _this.seenPlayer = true;
                        var oldX = _this.x;
                        var oldY = _this.y;
                        if (_this.game.player.x > _this.x)
                            _this.dx++;
                        if (_this.game.player.x < _this.x)
                            _this.dx--;
                        if (_this.game.player.y > _this.y)
                            _this.dy++;
                        if (_this.game.player.y < _this.y)
                            _this.dy--;
                        var moveX = _this.x;
                        var moveY = _this.y;
                        if (Math.abs(_this.dx) > Math.abs(_this.dy) ||
                            (_this.dx === _this.dy &&
                                Math.abs(_this.game.player.x - _this.x) >= Math.abs(_this.game.player.y - _this.y))) {
                            if (_this.dx > 0) {
                                moveX++;
                                _this.dx--;
                            }
                            else if (_this.dx < 0) {
                                moveX--;
                                _this.dx++;
                            }
                        }
                        else {
                            if (_this.dy > 0) {
                                moveY++;
                                _this.dy--;
                            }
                            else if (_this.dy < 0) {
                                moveY--;
                                _this.dy++;
                            }
                        }
                        if (_this.game.player.x === moveX && _this.game.player.y === moveY) {
                            _this.game.player.hurt(_this.hit());
                            _this.dx = 0;
                            _this.dy = 0;
                            _this.drawX = 0.5 * (_this.x - _this.game.player.x);
                            _this.drawY = 0.5 * (_this.y - _this.game.player.y);
                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                        }
                        else {
                            _this.tryMove(moveX, moveY);
                            if (_this.x === oldX && _this.y === oldY) {
                                // didn't move
                                _this.dx = 0;
                                _this.dy = 0;
                            }
                            _this.drawX = _this.x - oldX;
                            _this.drawY = _this.y - oldY;
                            if (_this.x > oldX)
                                _this.direction = enemy_1.EnemyDirection.RIGHT;
                            else if (_this.x < oldX)
                                _this.direction = enemy_1.EnemyDirection.LEFT;
                            else if (_this.y > oldY)
                                _this.direction = enemy_1.EnemyDirection.DOWN;
                            else if (_this.y < oldY)
                                _this.direction = enemy_1.EnemyDirection.UP;
                        }
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                    }
                }
            }
        };
        _this.draw = function () {
            if (!_this.dead) {
                _this.tileX = 5;
                _this.tileY = 8;
                if (_this.health <= 1) {
                    _this.tileX = 3;
                    _this.tileY = 0;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileX = 2;
                        }
                    }
                }
                _this.frame += 0.1;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.health > 1 && _this.doneMoving() && _this.game.player.doneMoving())
                    _this.facePlayer();
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.dropLoot = function () {
            if (Math.random() < 0.02)
                _this.game.level.items.push(new redgem_1.RedGem(_this.level, _this.x, _this.y));
            else
                _this.game.level.items.push(new coin_1.Coin(_this.level, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 5;
        _this.tileY = 8;
        _this.seenPlayer = true;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.dx = 0;
        _this.dy = 0;
        _this.deathParticleColor = "#ffffff";
        return _this;
    }
    return SkullEnemy;
}(enemy_1.Enemy));
exports.SkullEnemy = SkullEnemy;


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var DownLadder = /** @class */ (function (_super) {
    __extends(DownLadder, _super);
    function DownLadder(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.generate = function () {
            // called by Game during transition
            if (!_this.linkedLadder) {
                _this.linkedLadder = _this.game.levelgen.generate(_this.game, _this.level.depth + 1);
                _this.linkedLadder.linkedLadder = _this;
            }
        };
        _this.onCollide = function (player) {
            _this.game.changeLevelThroughLadder(_this);
        };
        _this.draw = function () {
            game_1.Game.drawTile(4, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function () { };
        _this.game = game;
        _this.linkedLadder = null;
        return _this;
    }
    return DownLadder;
}(tile_1.Tile));
exports.DownLadder = DownLadder;


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var Gold = /** @class */ (function (_super) {
    __extends(Gold, _super);
    function Gold(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD\nA nugget of gold.";
        };
        _this.tileX = 18;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Gold;
}(item_1.Item));
exports.Gold = Gold;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var weapon_1 = __webpack_require__(17);
var sound_1 = __webpack_require__(2);
var crate_1 = __webpack_require__(12);
var barrel_1 = __webpack_require__(13);
var genericParticle_1 = __webpack_require__(3);
var Shotgun = /** @class */ (function (_super) {
    __extends(Shotgun, _super);
    function Shotgun(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.game.player.x;
            var newY2 = 2 * newY - _this.game.player.y;
            var newX3 = 3 * newX - 2 * _this.game.player.x;
            var newY3 = 3 * newY - 2 * _this.game.player.y;
            var flag = false;
            var range = 3;
            if (!_this.game.level.tileInside(newX, newY) || _this.game.level.levelArray[newX][newY].isSolid())
                return true;
            else if (!_this.game.level.tileInside(newX2, newY2) ||
                _this.game.level.levelArray[newX2][newY2].isSolid())
                range = 1;
            else if (!_this.game.level.tileInside(newX3, newY3) ||
                _this.game.level.levelArray[newX3][newY3].isSolid())
                range = 2;
            for (var _i = 0, _a = _this.game.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (!(e instanceof crate_1.Crate || e instanceof barrel_1.Barrel) && e.destroyable) {
                    if (e.x === newX && e.y === newY && range >= 1) {
                        e.hurt(1);
                        flag = true;
                    }
                    else if (e.x === newX2 && e.y === newY2 && range >= 2) {
                        e.hurt(1);
                        flag = true;
                    }
                    else if (e.x === newX3 && e.y === newY3 && range >= 3) {
                        e.hurt(0.5);
                        flag = true;
                    }
                }
            }
            var targetX = newX3;
            var targetY = newY3;
            if (flag) {
                sound_1.Sound.hit();
                _this.game.player.drawX = 0.5 * (_this.game.player.x - newX);
                _this.game.player.drawY = 0.5 * (_this.game.player.y - newY);
                genericParticle_1.GenericParticle.shotgun(_this.game.level, _this.game.player.x + 0.5, _this.game.player.y, targetX + 0.5, targetY, "black");
                genericParticle_1.GenericParticle.shotgun(_this.game.level, _this.game.player.x + 0.5, _this.game.player.y, targetX + 0.5, targetY, "#ffddff");
                var gp = new genericParticle_1.GenericParticle(_this.game.level, 0.5 * (newX + _this.game.player.x) + 0.5, 0.5 * (newY + _this.game.player.y), 0, 1, 0, 0, 0, "white", 0);
                gp.expirationTimer = 10;
                _this.game.level.particles.push(gp);
                //this.game.level.particles.push(new SlashParticle(newX, newY));
                //this.game.level.particles.push(new SlashParticle(newX2, newY2));
                //this.game.level.particles.push(new SlashParticle(newX3, newY3));
                _this.game.level.tick();
                _this.game.shakeScreen(10 * _this.game.player.drawX, 10 * _this.game.player.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "SHOTGUN\nRange 3, penetration";
        };
        _this.tileX = 26;
        _this.tileY = 0;
        return _this;
    }
    return Shotgun;
}(weapon_1.Weapon));
exports.Shotgun = Shotgun;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var weapon_1 = __webpack_require__(17);
var sound_1 = __webpack_require__(2);
var slashParticle_1 = __webpack_require__(19);
var crate_1 = __webpack_require__(12);
var barrel_1 = __webpack_require__(13);
var Spear = /** @class */ (function (_super) {
    __extends(Spear, _super);
    function Spear(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.game.player.x;
            var newY2 = 2 * newY - _this.game.player.y;
            var flag = false;
            var enemyHitCandidates = [];
            for (var _i = 0, _a = _this.game.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable) {
                    if (e.x === newX && e.y === newY) {
                        if (e instanceof crate_1.Crate || e instanceof barrel_1.Barrel)
                            return true;
                        else {
                            e.hurt(1);
                            flag = true;
                        }
                    }
                    if (e.x === newX2 && e.y === newY2 && !_this.game.level.levelArray[newX][newY].isSolid()) {
                        if (!(e instanceof crate_1.Crate || e instanceof barrel_1.Barrel))
                            enemyHitCandidates.push(e);
                    }
                }
            }
            if (!flag && enemyHitCandidates.length > 0) {
                for (var _b = 0, enemyHitCandidates_1 = enemyHitCandidates; _b < enemyHitCandidates_1.length; _b++) {
                    var e = enemyHitCandidates_1[_b];
                    e.hurt(1);
                }
                sound_1.Sound.hit();
                _this.game.player.drawX = 0.5 * (_this.game.player.x - newX);
                _this.game.player.drawY = 0.5 * (_this.game.player.y - newY);
                _this.game.level.particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.level.particles.push(new slashParticle_1.SlashParticle(newX2, newY2));
                _this.game.level.tick();
                _this.game.shakeScreen(10 * _this.game.player.drawX, 10 * _this.game.player.drawY);
                return false;
            }
            if (flag) {
                sound_1.Sound.hit();
                _this.game.player.drawX = 0.5 * (_this.game.player.x - newX);
                _this.game.player.drawY = 0.5 * (_this.game.player.y - newY);
                _this.game.level.particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.level.tick();
                _this.game.shakeScreen(10 * _this.game.player.drawX, 10 * _this.game.player.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "SPEAR\nRange 2";
        };
        _this.tileX = 24;
        _this.tileY = 0;
        return _this;
    }
    return Spear;
}(weapon_1.Weapon));
exports.Spear = Spear;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var input_1 = __webpack_require__(24);
var gameConstants_1 = __webpack_require__(4);
var game_1 = __webpack_require__(0);
var door_1 = __webpack_require__(15);
var bottomDoor_1 = __webpack_require__(10);
var trapdoor_1 = __webpack_require__(39);
var inventory_1 = __webpack_require__(40);
var lockedDoor_1 = __webpack_require__(43);
var sound_1 = __webpack_require__(2);
var textParticle_1 = __webpack_require__(44);
var dashParticle_1 = __webpack_require__(45);
var levelConstants_1 = __webpack_require__(7);
var chest_1 = __webpack_require__(29);
var map_1 = __webpack_require__(46);
var slashParticle_1 = __webpack_require__(19);
var healthbar_1 = __webpack_require__(27);
var PlayerDirection;
(function (PlayerDirection) {
    PlayerDirection[PlayerDirection["DOWN"] = 0] = "DOWN";
    PlayerDirection[PlayerDirection["UP"] = 1] = "UP";
    PlayerDirection[PlayerDirection["RIGHT"] = 2] = "RIGHT";
    PlayerDirection[PlayerDirection["LEFT"] = 3] = "LEFT";
})(PlayerDirection || (PlayerDirection = {}));
var Player = /** @class */ (function () {
    function Player(game, x, y) {
        var _this = this;
        this.tapListener = function () {
            _this.inventory.open();
        };
        this.iListener = function () {
            _this.inventory.open();
        };
        this.leftListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.left();
                return;
            }
            if (!_this.dead && _this.game.levelState === game_1.LevelState.IN_LEVEL) {
                /*if (Input.isDown(Input.SPACE)) {
                  GenericParticle.spawnCluster(this.game.level, this.x - 1 + 0.5, this.y + 0.5, "#ff00ff");
                  this.healthBar.hurt();
                  this.game.level.items.push(new Coal(this.game.level, this.x - 1, this.y));
                } else */
                _this.tryMove(_this.x - 1, _this.y);
                _this.direction = PlayerDirection.LEFT;
            }
        };
        this.rightListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.right();
                return;
            }
            if (!_this.dead && _this.game.levelState === game_1.LevelState.IN_LEVEL) {
                _this.tryMove(_this.x + 1, _this.y);
                _this.direction = PlayerDirection.RIGHT;
            }
        };
        this.upListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.up();
                return;
            }
            if (!_this.dead && _this.game.levelState === game_1.LevelState.IN_LEVEL) {
                _this.tryMove(_this.x, _this.y - 1);
                _this.direction = PlayerDirection.UP;
            }
        };
        this.downListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.down();
                return;
            }
            if (!_this.dead && _this.game.levelState === game_1.LevelState.IN_LEVEL) {
                _this.tryMove(_this.x, _this.y + 1);
                _this.direction = PlayerDirection.DOWN;
            }
        };
        this.spaceListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.space();
                return;
            }
            if (_this.openVendingMachine) {
                _this.openVendingMachine.space();
            }
        };
        this.hit = function () {
            return 1;
        };
        // dash length 2
        this.tryDash = function (dx, dy) {
            var startX = _this.x;
            var startY = _this.y;
            var x = _this.x;
            var y = _this.y;
            var particleFrameOffset = 4;
            while (x !== startX + 2 * dx || y !== startY + 2 * dy) {
                x += dx;
                y += dy;
                var other = _this.game.level.levelArray[x][y];
                if (other.isSolid())
                    break;
                if (other instanceof door_1.Door || other instanceof bottomDoor_1.BottomDoor) {
                    _this.move(x, y);
                    other.onCollide(_this);
                    return;
                }
                other.onCollide(_this);
                _this.game.level.particles.push(new dashParticle_1.DashParticle(_this.x, _this.y, particleFrameOffset));
                particleFrameOffset -= 2;
                var breakFlag = false;
                for (var _i = 0, _a = _this.game.level.enemies; _i < _a.length; _i++) {
                    var e = _a[_i];
                    if (e.x === x && e.y === y) {
                        var dmg = _this.hit();
                        e.hurt(dmg);
                        _this.game.level.particles.push(new textParticle_1.TextParticle("" + dmg, x + 0.5, y - 0.5, gameConstants_1.GameConstants.HIT_ENEMY_TEXT_COLOR, 5));
                        if (e instanceof chest_1.Chest) {
                            breakFlag = true;
                            _this.game.level.tick();
                            break;
                        }
                    }
                }
                if (breakFlag)
                    break;
                _this.dashMove(x, y);
            }
            _this.drawX = _this.x - startX;
            _this.drawY = _this.y - startY;
            if (_this.x !== startX || _this.y !== startY) {
                _this.game.level.tick();
                _this.game.level.particles.push(new dashParticle_1.DashParticle(_this.x, _this.y, particleFrameOffset));
            }
        };
        this.tryCollide = function (other, newX, newY) {
            if (newX >= other.x + other.w || newX + _this.w <= other.x)
                return false;
            if (newY >= other.y + other.h || newY + _this.h <= other.y)
                return false;
            return true;
        };
        this.tryMove = function (x, y) {
            // TODO don't move if hit by enemy
            _this.game.level.catchUp();
            if (_this.dead)
                return;
            if (_this.inventory.hasWeapon() && !_this.inventory.getWeapon().weaponMove(x, y)) {
                return;
            }
            for (var _i = 0, _a = _this.game.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (_this.tryCollide(e, x, y)) {
                    if (e.pushable) {
                        // pushing a crate or barrel
                        var oldEnemyX = e.x;
                        var oldEnemyY = e.y;
                        var dx = x - _this.x;
                        var dy = y - _this.y;
                        var nextX = x + dx;
                        var nextY = y + dy;
                        var foundEnd = false; // end of the train of whatever we're pushing
                        var enemyEnd = false; // end of the train is a solid enemy (i.e. potted plant)
                        var pushedEnemies = [];
                        while (true) {
                            foundEnd = true;
                            for (var _b = 0, _c = _this.game.level.enemies; _b < _c.length; _b++) {
                                var f = _c[_b];
                                if (f.x === nextX && f.y === nextY) {
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
                            if (foundEnd)
                                break;
                            nextX += dx;
                            nextY += dy;
                        }
                        /* if no enemies and there is a wall, no move
                        otherwise, push everything, killing last enemy if there is a wall */
                        // here, (nextX, nextY) is the position immediately after the end of the train
                        if (pushedEnemies.length === 0 &&
                            (_this.game.level.levelArray[nextX][nextY].canCrushEnemy() || enemyEnd)) {
                            if (e.destroyable) {
                                e.kill();
                                sound_1.Sound.hit();
                                _this.drawX = 0.5 * (_this.x - e.x);
                                _this.drawY = 0.5 * (_this.y - e.y);
                                _this.game.level.particles.push(new slashParticle_1.SlashParticle(e.x, e.y));
                                _this.game.level.tick();
                                _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                return;
                            }
                        }
                        else {
                            sound_1.Sound.push();
                            // here pushedEnemies may still be []
                            for (var _d = 0, pushedEnemies_1 = pushedEnemies; _d < pushedEnemies_1.length; _d++) {
                                var f = pushedEnemies_1[_d];
                                f.x += dx;
                                f.y += dy;
                                f.drawX = dx;
                                f.drawY = dy;
                                f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
                            }
                            if (_this.game.level.levelArray[nextX][nextY].canCrushEnemy() || enemyEnd)
                                pushedEnemies[pushedEnemies.length - 1].killNoBones();
                            e.x += dx;
                            e.y += dy;
                            e.drawX = dx;
                            e.drawY = dy;
                            _this.move(x, y);
                            _this.game.level.tick();
                            return;
                        }
                    }
                    else {
                        // if we're trying to hit an enemy, check if it's destroyable
                        if (!e.dead) {
                            if (e.interactable)
                                e.interact();
                            return;
                        }
                    }
                }
            }
            var other = _this.game.level.levelArray[x][y];
            if (!other.isSolid()) {
                _this.move(x, y);
                other.onCollide(_this);
                if (!(other instanceof door_1.Door || other instanceof bottomDoor_1.BottomDoor || other instanceof trapdoor_1.Trapdoor))
                    _this.game.level.tick();
            }
            else {
                if (other instanceof lockedDoor_1.LockedDoor) {
                    _this.drawX = (_this.x - x) * 0.5;
                    _this.drawY = (_this.y - y) * 0.5;
                    other.unlock(_this);
                    _this.game.level.tick();
                }
            }
        };
        this.hurt = function (damage) {
            sound_1.Sound.hurt();
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                _this.inventory.getArmor().hurt(damage);
            }
            else {
                _this.healthBar.hurt();
                _this.flashing = true;
                _this.health -= damage;
                if (_this.health <= 0) {
                    _this.health = 0;
                    _this.dead = true;
                }
            }
        };
        this.dashMove = function (x, y) {
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.level.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.level.updateLighting();
        };
        this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        this.move = function (x, y) {
            sound_1.Sound.playerStoneFootstep();
            if (_this.openVendingMachine)
                _this.openVendingMachine.close();
            _this.drawX = x - _this.x;
            _this.drawY = y - _this.y;
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.level.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.level.updateLighting();
        };
        this.moveNoSmooth = function (x, y) {
            // doesn't touch smoothing
            _this.x = x;
            _this.y = y;
        };
        this.moveSnap = function (x, y) {
            // no smoothing
            _this.x = x;
            _this.y = y;
            _this.drawX = 0;
            _this.drawY = 0;
        };
        this.update = function () { };
        this.finishTick = function () {
            _this.inventory.tick();
            _this.flashing = false;
            var totalHealthDiff = _this.health - _this.lastTickHealth;
            _this.lastTickHealth = _this.health; // update last tick health
            if (totalHealthDiff < 0) {
                _this.flashing = true;
            }
        };
        this.drawPlayerSprite = function () {
            _this.frame += 0.1;
            if (_this.frame >= 4)
                _this.frame = 0;
            game_1.Game.drawMob(1 + Math.floor(_this.frame), 8 + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2);
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                // TODO draw armor
            }
        };
        this.draw = function () {
            _this.flashingFrame += 12 / gameConstants_1.GameConstants.FPS;
            if (!_this.dead) {
                game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1);
                if (!_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0) {
                    _this.drawPlayerSprite();
                }
            }
        };
        this.heartbeat = function () {
            _this.guiHeartFrame = 1;
        };
        this.drawTopLayer = function () {
            _this.healthBar.draw(_this.health, _this.maxHealth, _this.x - _this.drawX, _this.y - _this.drawY, !_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0);
        };
        this.drawGUI = function () {
            if (!_this.dead) {
                _this.inventory.draw();
                if (_this.guiHeartFrame > 0)
                    _this.guiHeartFrame++;
                if (_this.guiHeartFrame > 5) {
                    _this.guiHeartFrame = 0;
                }
                for (var i = 0; i < _this.maxHealth; i++) {
                    var frame = _this.guiHeartFrame > 0 ? 1 : 0;
                    if (i >= Math.floor(_this.health)) {
                        if (i == Math.floor(_this.health) && (_this.health * 2) % 2 == 1) {
                            // draw half heart
                            game_1.Game.drawFX(4, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                        else {
                            game_1.Game.drawFX(3, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                    }
                    else
                        game_1.Game.drawFX(frame, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                }
                if (_this.inventory.getArmor())
                    _this.inventory.getArmor().drawGUI(_this.maxHealth);
            }
            else {
                game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
                var gameOverString = "Game Over.";
                game_1.Game.ctx.fillText(gameOverString, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.ctx.measureText(gameOverString).width / 2, gameConstants_1.GameConstants.HEIGHT / 2);
                var refreshString = "[refresh to restart]";
                game_1.Game.ctx.fillText(refreshString, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.ctx.measureText(refreshString).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 + gameConstants_1.GameConstants.FONT_SIZE);
            }
            if (input_1.Input.isDown(input_1.Input.M) || input_1.Input.isTapHold) {
                _this.map.draw();
            }
        };
        this.updateDrawXY = function () {
            _this.drawX += -0.5 * _this.drawX;
            _this.drawY += -0.5 * _this.drawY;
        };
        this.game = game;
        this.x = x;
        this.y = y;
        this.w = 1;
        this.h = 1;
        this.frame = 0;
        this.direction = PlayerDirection.UP;
        input_1.Input.iListener = this.iListener;
        input_1.Input.leftListener = this.leftListener;
        input_1.Input.rightListener = this.rightListener;
        input_1.Input.upListener = this.upListener;
        input_1.Input.downListener = this.downListener;
        input_1.Input.spaceListener = this.spaceListener;
        input_1.Input.leftSwipeListener = this.leftListener;
        input_1.Input.rightSwipeListener = this.rightListener;
        input_1.Input.upSwipeListener = this.upListener;
        input_1.Input.downSwipeListener = this.downListener;
        input_1.Input.tapListener = this.tapListener;
        this.health = 1;
        this.maxHealth = 1;
        this.healthBar = new healthbar_1.HealthBar();
        this.dead = false;
        this.flashing = false;
        this.flashingFrame = 0;
        this.lastTickHealth = this.health;
        this.guiHeartFrame = 0;
        this.inventory = new inventory_1.Inventory(game);
        this.missProb = 0.1;
        this.sightRadius = 8; // maybe can be manipulated by items? e.g. better torch
        this.map = new map_1.Map(this.game);
    }
    return Player;
}());
exports.Player = Player;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Trapdoor = /** @class */ (function (_super) {
    __extends(Trapdoor, _super);
    function Trapdoor(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function () {
            game_1.Game.drawTile(13, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.onCollide = function (player) {
            // TODO
        };
        _this.game = game;
        return _this;
    }
    return Trapdoor;
}(tile_1.Tile));
exports.Trapdoor = Trapdoor;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var levelConstants_1 = __webpack_require__(7);
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var equippable_1 = __webpack_require__(11);
var armor_1 = __webpack_require__(16);
var coin_1 = __webpack_require__(8);
var weapon_1 = __webpack_require__(17);
var dagger_1 = __webpack_require__(41);
var usable_1 = __webpack_require__(42);
var OPEN_TIME = 100; // milliseconds
var FILL_COLOR = "#5a595b";
var OUTLINE_COLOR = "#292c36";
var EQUIP_COLOR = "#85a8e6";
var FULL_OUTLINE = "white";
var Inventory = /** @class */ (function () {
    function Inventory(game) {
        var _this = this;
        this.rows = 2;
        this.cols = 4;
        this.selX = 0;
        this.selY = 0;
        this.open = function () {
            _this.isOpen = !_this.isOpen;
            if (_this.isOpen)
                _this.openTime = Date.now();
        };
        this.close = function () {
            _this.isOpen = false;
        };
        this.left = function () {
            _this.selX--;
            if (_this.selX < 0)
                _this.selX = 0;
        };
        this.right = function () {
            _this.selX++;
            if (_this.selX > _this.cols - 1)
                _this.selX = _this.cols - 1;
        };
        this.up = function () {
            _this.selY--;
            if (_this.selY < 0)
                _this.selY = 0;
        };
        this.down = function () {
            _this.selY++;
            if (_this.selY > _this.rows - 1)
                _this.selY = _this.rows - 1;
        };
        this.space = function () {
            var i = _this.selX + _this.selY * _this.cols;
            if (_this.items[i] instanceof usable_1.Usable) {
                _this.items[i].onUse(_this.game.player);
                _this.items.splice(i, 1);
            }
            if (_this.items[i] instanceof equippable_1.Equippable) {
                var e = _this.items[i];
                e.equipped = !e.equipped; // toggle
                if (e instanceof weapon_1.Weapon) {
                    if (e.equipped)
                        _this.weapon = e;
                    else
                        _this.weapon = null;
                }
                if (e.equipped) {
                    for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                        var i_1 = _a[_i];
                        if (i_1 instanceof equippable_1.Equippable && i_1 !== e && !e.coEquippable(i_1)) {
                            i_1.equipped = false; // prevent user from equipping two not coEquippable items
                        }
                    }
                }
                _this.equipped = _this.items.filter(function (x) { return x instanceof equippable_1.Equippable && x.equipped; });
            }
        };
        this.hasItem = function (itemType) {
            // itemType is class of Item we're looking for
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i instanceof itemType)
                    return i;
            }
            return null;
        };
        this.hasItemCount = function (item) {
            if (item instanceof coin_1.Coin)
                return _this.coinCount() >= item.stackCount;
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor && i.stackCount >= item.stackCount)
                    return true;
            }
            return false;
        };
        this.subtractItemCount = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.subtractCoins(item.stackCount);
                return;
            }
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor) {
                    i.stackCount -= item.stackCount;
                    if (i.stackCount <= 0)
                        _this.items.splice(_this.items.indexOf(i), 1);
                }
            }
        };
        this.coinCount = function () {
            return _this.coins;
        };
        this.subtractCoins = function (n) {
            _this.coins -= n;
            if (_this.coins < 0)
                _this.coins = 0;
        };
        this.addCoins = function (n) {
            _this.coins += n;
        };
        this.isFull = function () {
            return _this.items.length >= _this.rows * _this.cols;
        };
        this.addItem = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.coins += 1;
                return;
            }
            if (item.stackable) {
                for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (i.constructor === item.constructor) {
                        // we already have an item of the same type
                        i.stackCount++;
                        return;
                    }
                }
            }
            if (!_this.isFull()) {
                // item is either not stackable, or its stackable but we don't have one yet
                _this.items.push(item);
            }
        };
        this.removeItem = function (item) {
            var i = _this.items.indexOf(item);
            if (i !== -1) {
                _this.items.splice(i, 1);
            }
        };
        this.getArmor = function () {
            for (var _i = 0, _a = _this.equipped; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e instanceof armor_1.Armor)
                    return e;
            }
            return null;
        };
        this.hasWeapon = function () {
            return _this.weapon !== null;
        };
        this.getWeapon = function () {
            return _this.weapon;
        };
        this.tick = function () {
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                i.tickInInventory();
            }
        };
        this.textWrap = function (text, x, y, maxWidth) {
            // returns y value for next line
            var words = text.split(" ");
            var line = "";
            while (words.length > 0) {
                if (game_1.Game.ctx.measureText(line + words[0]).width > maxWidth) {
                    game_1.Game.fillText(line, x, y);
                    line = "";
                    y += 10;
                }
                else {
                    if (line !== "")
                        line += " ";
                    line += words[0];
                    words.splice(0, 1);
                }
            }
            if (line !== " ") {
                game_1.Game.fillText(line, x, y);
                y += 10;
            }
            return y;
        };
        this.drawCoins = function () {
            var coinX = levelConstants_1.LevelConstants.SCREEN_W - 1;
            var coinY = levelConstants_1.LevelConstants.SCREEN_H - 1;
            game_1.Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);
            var countText = "" + _this.coins;
            var width = game_1.Game.ctx.measureText(countText).width;
            var countX = 4 - width;
            var countY = -1;
            game_1.Game.ctx.fillStyle = "black";
            for (var xx = -1; xx <= 1; xx++) {
                for (var yy = -1; yy <= 1; yy++) {
                    game_1.Game.ctx.fillStyle = gameConstants_1.GameConstants.OUTLINE;
                    game_1.Game.fillText(countText, coinX * gameConstants_1.GameConstants.TILESIZE + countX + xx, coinY * gameConstants_1.GameConstants.TILESIZE + countY + yy);
                }
            }
            game_1.Game.ctx.fillStyle = "white";
            game_1.Game.fillText(countText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY);
        };
        this.draw = function () {
            _this.drawCoins();
            if (_this.isOpen) {
                for (var i_2 = 0; i_2 < _this.equipAnimAmount.length; i_2++) {
                    if (_this.items[i_2] instanceof equippable_1.Equippable) {
                        if (_this.items[i_2].equipped) {
                            _this.equipAnimAmount[i_2] += 0.2 * (1 - _this.equipAnimAmount[i_2]);
                        }
                        else {
                            _this.equipAnimAmount[i_2] += 0.2 * (0 - _this.equipAnimAmount[i_2]);
                        }
                    }
                }
                game_1.Game.ctx.fillStyle = "rgb(0, 0, 0, 0.8)";
                game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                // check equips too
                _this.items = _this.items.filter(function (x) { return !x.dead; });
                game_1.Game.ctx.globalAlpha = 1;
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3; // highlighted growth
                var ob = 1; // outer border
                var width = _this.cols * (s + 2 * b + g) - g;
                var height = _this.rows * (s + 2 * b + g) - g;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g)) - hg - ob, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + _this.selY * (s + 2 * b + g)) -
                    hg -
                    ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob);
                for (var x = 0; x < _this.cols; x++) {
                    for (var y = 0; y < _this.rows; y++) {
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g)), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g)), Math.round(s + 2 * b), Math.round(s + 2 * b));
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g) + b), Math.round(s), Math.round(s));
                        var i_3 = x + y * _this.cols;
                        game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                        var yOff = s * (1 - _this.equipAnimAmount[i_3]);
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + y * (s + 2 * b + g) + b + yOff), Math.round(s), Math.round(s - yOff));
                    }
                }
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i_4 = 0; i_4 < _this.items.length; i_4++) {
                        var x = i_4 % _this.cols;
                        var y = Math.floor(i_4 / _this.cols);
                        var drawX_1 = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            x * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY_1 = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled_1 = drawX_1 / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled_1 = drawY_1 / gameConstants_1.GameConstants.TILESIZE;
                        _this.items[i_4].drawIcon(drawXScaled_1, drawYScaled_1);
                        //if (this.items[i] instanceof Equippable && (this.items[i] as Equippable).equipped) {
                        //  Game.drawItem(0, 4, 2, 2, x - 0.5, y - 0.5, 2, 2);
                        //}
                    }
                    game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g)) - hg, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + _this.selY * (s + 2 * b + g)) - hg, Math.round(s + 2 * b + 2 * hg), Math.round(s + 2 * b + 2 * hg));
                    game_1.Game.ctx.fillStyle = FILL_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g) + b - hg), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + _this.selY * (s + 2 * b + g) + b - hg), Math.round(s + 2 * hg), Math.round(s + 2 * hg));
                    var i_5 = _this.selX + _this.selY * _this.cols;
                    game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                    var yOff = (s + 2 * hg) * (1 - _this.equipAnimAmount[i_5]);
                    game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g) + b - hg), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + _this.selY * (s + 2 * b + g) + b - hg + yOff), Math.round(s + 2 * hg), Math.round(s + 2 * hg - yOff));
                    var drawX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE);
                    var drawY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE);
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    if (i_5 < _this.items.length)
                        _this.items[i_5].drawIcon(drawXScaled, drawYScaled);
                }
                var i = _this.selX + _this.selY * _this.cols;
                if (i < _this.items.length) {
                    game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
                    game_1.Game.ctx.fillStyle = "white";
                    if (_this.items[i] instanceof equippable_1.Equippable) {
                        var e = _this.items[i];
                        var topPhrase = "[SPACE] to equip";
                        if (e.equipped)
                            topPhrase = "[SPACE] to de-equip";
                        game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
                        game_1.Game.ctx.fillStyle = "white";
                        var w = game_1.Game.ctx.measureText(topPhrase).width;
                        game_1.Game.fillText(topPhrase, 0.5 * (gameConstants_1.GameConstants.WIDTH - w), 5);
                    }
                    var lines = _this.items[i].getDescription().split("\n");
                    var nextY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + _this.rows * (s + 2 * b + g) + b + 2);
                    for (var j = 0; j < lines.length; j++) {
                        nextY = _this.textWrap(lines[j], 5, nextY, gameConstants_1.GameConstants.WIDTH - 5);
                    }
                    game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
                }
            }
        };
        this.game = game;
        this.items = new Array();
        this.equipped = new Array();
        this.equipAnimAmount = [];
        for (var i = 0; i < this.rows * this.cols; i++) {
            this.equipAnimAmount[i] = 0;
        }
        //Input.mouseLeftClickListeners.push(this.mouseLeftClickListener);
        this.coins = 0;
        this.openTime = Date.now();
        this.weapon = null;
        this.addItem(new dagger_1.Dagger({ game: this.game }, 0, 0));
    }
    return Inventory;
}());
exports.Inventory = Inventory;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var weapon_1 = __webpack_require__(17);
var sound_1 = __webpack_require__(2);
var slashParticle_1 = __webpack_require__(19);
var crate_1 = __webpack_require__(12);
var barrel_1 = __webpack_require__(13);
var Dagger = /** @class */ (function (_super) {
    __extends(Dagger, _super);
    function Dagger(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable &&
                    !(e instanceof crate_1.Crate || e instanceof barrel_1.Barrel) &&
                    e.x === newX &&
                    e.y === newY) {
                    e.hurt(1);
                    flag = true;
                }
            }
            if (flag) {
                sound_1.Sound.hit();
                _this.game.player.drawX = 0.5 * (_this.game.player.x - newX);
                _this.game.player.drawY = 0.5 * (_this.game.player.y - newY);
                _this.game.level.particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.level.tick();
                _this.game.shakeScreen(10 * _this.game.player.drawX, 10 * _this.game.player.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "DAGGER\nDamage 1";
        };
        _this.tileX = 22;
        _this.tileY = 0;
        return _this;
    }
    return Dagger;
}(weapon_1.Weapon));
exports.Dagger = Dagger;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var sound_1 = __webpack_require__(2);
var Usable = /** @class */ (function (_super) {
    __extends(Usable, _super);
    function Usable() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onUse = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            sound_1.Sound.heal();
        };
        return _this;
    }
    return Usable;
}(item_1.Item));
exports.Usable = Usable;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var key_1 = __webpack_require__(28);
var tile_1 = __webpack_require__(1);
var LockedDoor = /** @class */ (function (_super) {
    __extends(LockedDoor, _super);
    function LockedDoor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.unlock = function (player) {
            var k = player.inventory.hasItem(key_1.Key);
            if (k !== null) {
                // remove key
                player.inventory.items = player.inventory.items.filter(function (x) { return x !== k; });
                _this.level.levelArray[_this.x][_this.y] = _this.unlockedDoor; // replace this door in level
                _this.level.doors.push(_this.unlockedDoor); // add it to the door list so it can get rendered on the map
            }
        };
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            return true;
        };
        _this.draw = function () {
            game_1.Game.drawTile(17, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return LockedDoor;
}(tile_1.Tile));
exports.LockedDoor = LockedDoor;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var particle_1 = __webpack_require__(9);
var TextParticle = /** @class */ (function (_super) {
    __extends(TextParticle, _super);
    function TextParticle(text, x, y, color, delay) {
        var _this = _super.call(this) || this;
        _this.draw = function () {
            if (_this.delay > 0) {
                _this.delay--;
            }
            else {
                var GRAVITY = 0.2;
                var TIMEOUT = 1; // lasts for 1 second
                _this.z += _this.dz;
                if (_this.z < 0) {
                    _this.z = 0;
                    _this.dz *= -0.6;
                }
                _this.dz -= GRAVITY;
                _this.time++;
                if (_this.time > gameConstants_1.GameConstants.FPS * TIMEOUT)
                    _this.dead = true;
                var width = game_1.Game.ctx.measureText(_this.text).width;
                for (var xx = -1; xx <= 1; xx++) {
                    for (var yy = -1; yy <= 1; yy++) {
                        game_1.Game.ctx.fillStyle = gameConstants_1.GameConstants.OUTLINE;
                        game_1.Game.fillText(_this.text, _this.x - width / 2 + xx, _this.y - _this.z + yy);
                    }
                }
                game_1.Game.ctx.fillStyle = _this.color;
                game_1.Game.fillText(_this.text, _this.x - width / 2, _this.y - _this.z);
            }
        };
        _this.text = text;
        _this.x = x * gameConstants_1.GameConstants.TILESIZE;
        _this.y = y * gameConstants_1.GameConstants.TILESIZE;
        _this.z = gameConstants_1.GameConstants.TILESIZE;
        _this.dz = 1;
        _this.color = color;
        _this.dead = false;
        _this.time = 0;
        if (delay === undefined)
            _this.delay = game_1.Game.rand(0, 10);
        // up to a 10 tick delay
        else
            _this.delay = delay;
        return _this;
    }
    return TextParticle;
}(particle_1.Particle));
exports.TextParticle = TextParticle;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var particle_1 = __webpack_require__(9);
var DashParticle = /** @class */ (function (_super) {
    __extends(DashParticle, _super);
    function DashParticle(x, y, frameOffset) {
        var _this = _super.call(this) || this;
        _this.drawBehind = function () {
            game_1.Game.drawFX(Math.round(_this.frame), 0, 1, 2, _this.x, _this.y, 1, 2);
            _this.frame += 0.4;
            if (_this.frame > 7)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 1;
        _this.dead = false;
        _this.frame = frameOffset;
        return _this;
    }
    return DashParticle;
}(particle_1.Particle));
exports.DashParticle = DashParticle;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var gameConstants_1 = __webpack_require__(4);
var door_1 = __webpack_require__(15);
var bottomDoor_1 = __webpack_require__(10);
var level_1 = __webpack_require__(30);
// class MapRoom {
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   isCurrent: boolean;
//   constructor() {
//     this.parent = null;
//     this.children = Array<TreeNode>();
//     this.width = 0;
//     this.isCurrent = false;
//     this.unopened = false;
//   }
// }
var Map = /** @class */ (function () {
    function Map(game) {
        var _this = this;
        this.draw = function () {
            var SCALE = 1;
            var startLevel = _this.game.levels[0];
            game_1.Game.ctx.globalAlpha = 0.5;
            game_1.Game.ctx.fillStyle = "white";
            game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            game_1.Game.ctx.translate(0.5 * gameConstants_1.GameConstants.WIDTH, 0.5 * gameConstants_1.GameConstants.HEIGHT);
            /*Game.ctx.translate(
              startLevel.x + Math.floor(startLevel.width / 2),
              startLevel.y + Math.floor(startLevel.height / 2)
            );
            Game.ctx.scale(SCALE, SCALE);
            Game.ctx.translate(
              -(startLevel.x + Math.floor(startLevel.width / 2)),
              -(startLevel.y + Math.floor(startLevel.height / 2))
            );*/
            game_1.Game.ctx.globalAlpha = 1;
            for (var _i = 0, _a = _this.game.levels; _i < _a.length; _i++) {
                var level = _a[_i];
                if (_this.game.level.depth === level.depth) {
                    game_1.Game.ctx.fillStyle = "black";
                    if (level.type === level_1.RoomType.UPLADDER)
                        game_1.Game.ctx.fillStyle = "#101460";
                    if (level.type === level_1.RoomType.DOWNLADDER)
                        game_1.Game.ctx.fillStyle = "#601410";
                    if (!level.entered)
                        game_1.Game.ctx.fillStyle = "#606060";
                    game_1.Game.ctx.fillRect(level.x, level.y + 1, level.width, level.height - 1);
                    for (var _b = 0, _c = level.doors; _b < _c.length; _b++) {
                        var door = _c[_b];
                        game_1.Game.ctx.fillStyle = "black";
                        if (!level.entered)
                            game_1.Game.ctx.fillStyle = "#606060";
                        //Game.ctx.fillStyle = "#0085ff";
                        if (door instanceof door_1.Door)
                            game_1.Game.ctx.fillRect(level.x - level.roomX + door.x, level.y - level.roomY + door.y, 1, 1);
                        if (door instanceof bottomDoor_1.BottomDoor)
                            game_1.Game.ctx.fillRect(level.x - level.roomX + door.x, level.y - level.roomY + door.y - 1, 1, 1);
                    }
                }
            }
            game_1.Game.ctx.fillStyle = gameConstants_1.GameConstants.RED;
            game_1.Game.ctx.fillRect(_this.game.level.x - _this.game.level.roomX + _this.game.player.x, _this.game.level.y - _this.game.level.roomY + _this.game.player.y, 1, 1);
            game_1.Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        };
        this.game = game;
    }
    return Map;
}());
exports.Map = Map;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Wall = /** @class */ (function (_super) {
    __extends(Wall, _super);
    function Wall(level, x, y, type) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            return true;
        };
        _this.draw = function () {
            if (_this.type === 0) {
                game_1.Game.drawTile(2, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            else if (_this.type === 1) {
                game_1.Game.drawTile(5, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.type = type;
        return _this;
    }
    return Wall;
}(tile_1.Tile));
exports.Wall = Wall;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var WallSide = /** @class */ (function (_super) {
    __extends(WallSide, _super);
    function WallSide() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            return false;
        };
        _this.draw = function () {
            game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return WallSide;
}(tile_1.Tile));
exports.WallSide = WallSide;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var astarclass_1 = __webpack_require__(50);
var hitWarning_1 = __webpack_require__(14);
var spiketrap_1 = __webpack_require__(31);
var coin_1 = __webpack_require__(8);
var KnightEnemy = /** @class */ (function (_super) {
    __extends(KnightEnemy, _super);
    function KnightEnemy(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 0.5;
        };
        _this.tick = function () {
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                _this.tileX = 9;
                _this.tileY = 8;
                if (_this.seenPlayer || _this.level.softVis[_this.x][_this.y] < 1) {
                    if (_this.ticks % 2 === 0) {
                        _this.tileX = 4;
                        _this.tileY = 0;
                        // visible to player, chase them
                        // now that we've seen the player, we can keep chasing them even if we lose line of sight
                        _this.seenPlayer = true;
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.level.levelArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.level.levelArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        _this.moves = astarclass_1.astar.AStar.search(_this.level.levelArray, _this, _this.game.player, disablePositions);
                        if (_this.moves.length > 0) {
                            if (_this.game.player.x === _this.moves[0].pos.x &&
                                _this.game.player.y === _this.moves[0].pos.y) {
                                _this.game.player.hurt(_this.hit());
                                _this.drawX = 0.5 * (_this.x - _this.game.player.x);
                                _this.drawY = 0.5 * (_this.y - _this.game.player.y);
                                _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                            }
                            else {
                                _this.tryMove(_this.moves[0].pos.x, _this.moves[0].pos.y);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                                if (_this.x > oldX)
                                    _this.direction = enemy_1.EnemyDirection.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = enemy_1.EnemyDirection.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = enemy_1.EnemyDirection.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = enemy_1.EnemyDirection.UP;
                            }
                        }
                    }
                    else {
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1));
                        _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 1));
                    }
                }
            }
        };
        _this.draw = function () {
            if (!_this.dead) {
                _this.frame += 0.1;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.doneMoving() && _this.game.player.doneMoving())
                    _this.facePlayer();
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 4 ? 0 : Math.floor(_this.frame)), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY + (_this.tileX === 4 ? 0.1875 : 0), 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.dropLoot = function () {
            _this.game.level.items.push(new coin_1.Coin(_this.level, _this.x, _this.y));
        };
        _this.moves = new Array(); // empty move list
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 9;
        _this.tileY = 8;
        _this.seenPlayer = true;
        _this.deathParticleColor = "#ffffff";
        return _this;
    }
    return KnightEnemy;
}(enemy_1.Enemy));
exports.KnightEnemy = KnightEnemy;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var astar;
(function (astar_1) {
    //================== start graph js
    /*
      graph.js http://github.com/bgrins/javascript-astar
      MIT License
      Creates a Graph class used in the astar search algorithm.
      Includes Binary Heap (with modifications) from Marijn Haverbeke
          URL: http://eloquentjavascript.net/appendix2.html
          License: http://creativecommons.org/licenses/by/3.0/
      */
    var GraphNodeType;
    (function (GraphNodeType) {
        GraphNodeType[GraphNodeType["WALL"] = 0] = "WALL";
        GraphNodeType[GraphNodeType["OPEN"] = 1] = "OPEN";
    })(GraphNodeType = astar_1.GraphNodeType || (astar_1.GraphNodeType = {}));
    var getTileCost = function (tile) {
        return tile.isSolid() ? 99999999 : 1;
    };
    var Graph = /** @class */ (function () {
        function Graph(grid) {
            this.elements = grid;
            var nodes = [];
            var row, rowLength, len = grid.length;
            for (var x = 0; x < len; ++x) {
                row = grid[x];
                rowLength = row.length;
                nodes[x] = new Array(rowLength); // optimum array with size
                for (var y = 0; y < rowLength; ++y) {
                    nodes[x][y] = new GraphNode(x, y, row[y]);
                }
            }
            this.nodes = nodes;
        }
        Graph.prototype.toString = function () {
            var graphString = "\n";
            var nodes = this.nodes;
            var rowDebug, row, y, l;
            for (var x = 0, len = nodes.length; x < len;) {
                rowDebug = "";
                row = nodes[x++];
                for (y = 0, l = row.length; y < l;) {
                    rowDebug += row[y++].type + " ";
                }
                graphString = graphString + rowDebug + "\n";
            }
            return graphString;
        };
        return Graph;
    }());
    astar_1.Graph = Graph;
    var GraphNode = /** @class */ (function () {
        function GraphNode(x, y, type) {
            this.data = {};
            this.x = x;
            this.y = y;
            this.pos = { x: x, y: y };
            this.type = type;
        }
        GraphNode.prototype.toString = function () {
            return "[" + this.x + " " + this.y + "]";
        };
        GraphNode.prototype.isWall = function () {
            return this.type == GraphNodeType.WALL;
        };
        return GraphNode;
    }());
    astar_1.GraphNode = GraphNode;
    var BinaryHeap = /** @class */ (function () {
        function BinaryHeap(scoreFunction) {
            this.content = [];
            this.scoreFunction = scoreFunction;
        }
        BinaryHeap.prototype.push = function (node) {
            // Add the new node to the end of the array.
            this.content.push(node);
            // Allow it to sink down.
            this.sinkDown(this.content.length - 1);
        };
        BinaryHeap.prototype.pop = function () {
            // Store the first node so we can return it later.
            var result = this.content[0];
            // Get the node at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end node at the
            // start, and let it bubble up.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.bubbleUp(0);
            }
            return result;
        };
        BinaryHeap.prototype.remove = function (node) {
            var i = this.content.indexOf(node);
            // When it is found, the process seen in 'pop' is repeated
            // to fill up the hole.
            var end = this.content.pop();
            if (i !== this.content.length - 1) {
                this.content[i] = end;
                if (this.scoreFunction(end) < this.scoreFunction(node))
                    this.sinkDown(i);
                else
                    this.bubbleUp(i);
            }
        };
        BinaryHeap.prototype.size = function () {
            return this.content.length;
        };
        BinaryHeap.prototype.rescoreElement = function (node) {
            this.sinkDown(this.content.indexOf(node));
        };
        BinaryHeap.prototype.sinkDown = function (n) {
            // Fetch the element that has to be sunk.
            var element = this.content[n];
            // When at 0, an element can not sink any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];
                // Swap the elements if the parent is greater.
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    // Update 'n' to continue at the new position.
                    n = parentN;
                }
                else {
                    // Found a parent that is less, no need to sink any further.
                    break;
                }
            }
        };
        BinaryHeap.prototype.bubbleUp = function (n) {
            // Look up the target element and its score.
            var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) << 1, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap === null ? elemScore : child1Score))
                        swap = child2N;
                }
                // If the element needs to be moved, swap it, and continue.
                if (swap !== null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                else {
                    // Otherwise, we are done.
                    break;
                }
            }
        };
        return BinaryHeap;
    }());
    astar_1.BinaryHeap = BinaryHeap;
    var AStar = /** @class */ (function () {
        function AStar(grid, disablePoints, enableCost) {
            this.grid = [];
            for (var x = 0, xl = grid.length; x < xl; x++) {
                this.grid[x] = [];
                for (var y = 0, yl = grid[x].length; y < yl; y++) {
                    var cost = getTileCost(grid[x][y]);
                    this.grid[x][y] = {
                        org: grid[x][y],
                        f: 0,
                        g: 0,
                        h: 0,
                        cost: cost,
                        visited: false,
                        closed: false,
                        pos: {
                            x: x,
                            y: y,
                        },
                        parent: null,
                    };
                }
            }
            if (disablePoints !== undefined) {
                for (var i = 0; i < disablePoints.length; i++)
                    this.grid[disablePoints[i].x][disablePoints[i].y].cost = 99999999;
            }
        }
        AStar.prototype.heap = function () {
            return new BinaryHeap(function (node) {
                return node.f;
            });
        };
        AStar.prototype._find = function (org) {
            for (var x = 0; x < this.grid.length; x++)
                for (var y = 0; y < this.grid[x].length; y++)
                    if (this.grid[x][y].org == org)
                        return this.grid[x][y];
        };
        AStar.prototype._search = function (start, end, diagonal, heuristic) {
            heuristic = heuristic || this.manhattan;
            diagonal = !!diagonal;
            var openHeap = this.heap();
            var _start, _end;
            if (start.x !== undefined && start.y !== undefined)
                _start = this.grid[start.x][start.y];
            else
                _start = this._find(start);
            if (end.x !== undefined && end.y !== undefined)
                _end = this.grid[end.x][end.y];
            else
                _end = this._find(end);
            if (AStar.NO_CHECK_START_POINT == false && _start.cost <= 0)
                return [];
            openHeap.push(_start);
            while (openHeap.size() > 0) {
                // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
                var currentNode = openHeap.pop();
                // End case -- result has been found, return the traced path.
                if (currentNode === _end) {
                    var curr = currentNode;
                    var ret = [];
                    while (curr.parent) {
                        ret.push(curr);
                        curr = curr.parent;
                    }
                    return ret.reverse();
                }
                // Normal case -- move currentNode from open to closed, process each of its neighbors.
                currentNode.closed = true;
                // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
                var neighbors = this.neighbors(currentNode, diagonal);
                for (var i = 0, il = neighbors.length; i < il; i++) {
                    var neighbor = neighbors[i];
                    if (neighbor.closed || neighbor.cost <= 0) {
                        // Not a valid node to process, skip to next neighbor.
                        continue;
                    }
                    // The g score is the shortest distance from start to current node.
                    // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                    var gScore = currentNode.g + neighbor.cost;
                    var beenVisited = neighbor.visited;
                    if (!beenVisited || gScore < neighbor.g) {
                        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                        neighbor.visited = true;
                        neighbor.parent = currentNode;
                        neighbor.h = neighbor.h || heuristic(neighbor.pos, _end.pos);
                        neighbor.g = gScore;
                        neighbor.f = neighbor.g + neighbor.h;
                        if (!beenVisited) {
                            // Pushing to heap will put it in proper place based on the 'f' value.
                            openHeap.push(neighbor);
                        }
                        else {
                            // Already seen the node, but since it has been rescored we need to reorder it in the heap
                            openHeap.rescoreElement(neighbor);
                        }
                    }
                }
            }
            // No result was found - empty array signifies failure to find path.
            return [];
        };
        AStar.search = function (grid, start, end, disablePoints, diagonal, heuristic) {
            var astar = new AStar(grid, disablePoints);
            return astar._search(start, end, diagonal, heuristic);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };
        AStar.prototype.neighbors = function (node, diagonals) {
            var grid = this.grid;
            var ret = [];
            var x = node.pos.x;
            var y = node.pos.y;
            // West
            if (grid[x - 1] && grid[x - 1][y]) {
                ret.push(grid[x - 1][y]);
            }
            // East
            if (grid[x + 1] && grid[x + 1][y]) {
                ret.push(grid[x + 1][y]);
            }
            // South
            if (grid[x] && grid[x][y - 1]) {
                ret.push(grid[x][y - 1]);
            }
            // North
            if (grid[x] && grid[x][y + 1]) {
                ret.push(grid[x][y + 1]);
            }
            if (diagonals) {
                // Southwest
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }
                // Southeast
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }
                // Northwest
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }
                // Northeast
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }
            return ret;
        };
        AStar.NO_CHECK_START_POINT = false;
        return AStar;
    }());
    astar_1.AStar = AStar;
})(astar = exports.astar || (exports.astar = {}));


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var equippable_1 = __webpack_require__(11);
var GoldenKey = /** @class */ (function (_super) {
    __extends(GoldenKey, _super);
    function GoldenKey(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD KEY\nA heavy gold key.";
        };
        _this.tileX = 6;
        _this.tileY = 0;
        return _this;
    }
    return GoldenKey;
}(equippable_1.Equippable));
exports.GoldenKey = GoldenKey;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var SpawnFloor = /** @class */ (function (_super) {
    __extends(SpawnFloor, _super);
    function SpawnFloor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.draw = function () {
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.w = 1;
        _this.h = 1;
        _this.variation = 1;
        if (game_1.Game.rand(1, 20) == 1)
            _this.variation = game_1.Game.randTable([8, 9, 10, 12]);
        return _this;
    }
    return SpawnFloor;
}(tile_1.Tile));
exports.SpawnFloor = SpawnFloor;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Spike = /** @class */ (function (_super) {
    __extends(Spike, _super);
    function Spike() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onCollide = function (player) {
            player.hurt(1);
        };
        _this.draw = function () {
            game_1.Game.drawTile(11, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Spike;
}(tile_1.Tile));
exports.Spike = Spike;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var floor_1 = __webpack_require__(18);
var bones_1 = __webpack_require__(25);
var deathParticle_1 = __webpack_require__(26);
var wizardTeleportParticle_1 = __webpack_require__(55);
var wizardFireball_1 = __webpack_require__(56);
var coin_1 = __webpack_require__(8);
var bluegem_1 = __webpack_require__(32);
var WizardState;
(function (WizardState) {
    WizardState[WizardState["idle"] = 0] = "idle";
    WizardState[WizardState["attack"] = 1] = "attack";
    WizardState[WizardState["justAttacked"] = 2] = "justAttacked";
    WizardState[WizardState["teleport"] = 3] = "teleport";
})(WizardState || (WizardState = {}));
var WizardEnemy = /** @class */ (function (_super) {
    __extends(WizardEnemy, _super);
    function WizardEnemy(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.ATTACK_RADIUS = 5;
        _this.hit = function () {
            return 1;
        };
        _this.withinAttackingRangeOfPlayer = function () {
            return (Math.pow((_this.x - _this.game.player.x), 2) + Math.pow((_this.y - _this.game.player.y), 2) <=
                Math.pow(_this.ATTACK_RADIUS, 2));
        };
        _this.shuffle = function (a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };
        _this.tick = function () {
            if (!_this.dead) {
                //  && this.level.visibilityArray[this.x][this.y] > 0
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                switch (_this.state) {
                    case WizardState.attack:
                        _this.tileX = 7;
                        if (!_this.level.levelArray[_this.x - 1][_this.y].isSolid()) {
                            _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x - 1, _this.y));
                            if (!_this.level.levelArray[_this.x - 2][_this.y].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x - 2, _this.y));
                            }
                        }
                        if (!_this.level.levelArray[_this.x + 1][_this.y].isSolid()) {
                            _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x + 1, _this.y));
                            if (!_this.level.levelArray[_this.x + 2][_this.y].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x + 2, _this.y));
                            }
                        }
                        if (!_this.level.levelArray[_this.x][_this.y - 1].isSolid()) {
                            _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y - 1));
                            if (!_this.level.levelArray[_this.x][_this.y - 2].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y - 2));
                            }
                        }
                        if (!_this.level.levelArray[_this.x][_this.y + 1].isSolid()) {
                            _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y + 1));
                            if (!_this.level.levelArray[_this.x][_this.y + 2].isSolid()) {
                                _this.level.projectiles.push(new wizardFireball_1.WizardFireball(_this, _this.x, _this.y + 2));
                            }
                        }
                        _this.state = WizardState.justAttacked;
                        break;
                    case WizardState.justAttacked:
                        _this.tileX = 6;
                        _this.state = WizardState.idle;
                        break;
                    case WizardState.teleport:
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var min = 100000;
                        var bestPos = void 0;
                        var emptyTiles = _this.shuffle(_this.level.getEmptyTiles());
                        for (var _i = 0, emptyTiles_1 = emptyTiles; _i < emptyTiles_1.length; _i++) {
                            var t = emptyTiles_1[_i];
                            var newPos = t;
                            var dist = Math.abs(newPos.x - _this.game.player.x) + Math.abs(newPos.y - _this.game.player.y);
                            if (Math.abs(dist - 4) < Math.abs(min - 4)) {
                                min = dist;
                                bestPos = newPos;
                            }
                        }
                        _this.tryMove(bestPos.x, bestPos.y);
                        _this.drawX = _this.x - oldX;
                        _this.drawY = _this.y - oldY;
                        _this.frame = 0; // trigger teleport animation
                        _this.level.particles.push(new wizardTeleportParticle_1.WizardTeleportParticle(oldX, oldY));
                        if (_this.withinAttackingRangeOfPlayer()) {
                            _this.state = WizardState.attack;
                        }
                        else {
                            _this.state = WizardState.idle;
                        }
                        break;
                    case WizardState.idle:
                        _this.state = WizardState.teleport;
                        break;
                }
            }
        };
        _this.draw = function () {
            if (!_this.dead) {
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                if (_this.frame >= 0) {
                    game_1.Game.drawMob(Math.floor(_this.frame) + 6, 2, 1, 2, _this.x, _this.y - 1.5, 1, 2, _this.level.shadeColor, _this.shadeAmount());
                    _this.frame += 0.4;
                    if (_this.frame > 11)
                        _this.frame = -1;
                }
                else {
                    game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
                }
            }
        };
        _this.kill = function () {
            if (_this.level.levelArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.level, _this.x, _this.y);
                b.skin = _this.level.levelArray[_this.x][_this.y].skin;
                _this.level.levelArray[_this.x][_this.y] = b;
            }
            _this.dead = true;
            _this.level.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        _this.dropLoot = function () {
            if (Math.random() < 0.02)
                _this.game.level.items.push(new bluegem_1.BlueGem(_this.level, _this.x, _this.y));
            else
                _this.game.level.items.push(new coin_1.Coin(_this.level, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.health = 1;
        _this.tileX = 6;
        _this.tileY = 0;
        _this.frame = 0;
        _this.state = WizardState.attack;
        _this.deathParticleColor = "#ffffff";
        return _this;
    }
    return WizardEnemy;
}(enemy_1.Enemy));
exports.WizardEnemy = WizardEnemy;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var particle_1 = __webpack_require__(9);
var game_1 = __webpack_require__(0);
var WizardTeleportParticle = /** @class */ (function (_super) {
    __extends(WizardTeleportParticle, _super);
    function WizardTeleportParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function () {
            game_1.Game.drawFX(Math.floor(_this.frame), 3, 1, 1, _this.x, _this.y - _this.z, 1, 1);
            _this.z += _this.dz;
            _this.dz *= 0.9;
            _this.frame += 0.25;
            if (_this.frame > 6)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.frame = 0;
        _this.z = 0;
        _this.dz = 0.1;
        return _this;
    }
    return WizardTeleportParticle;
}(particle_1.Particle));
exports.WizardTeleportParticle = WizardTeleportParticle;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var projectile_1 = __webpack_require__(22);
var game_1 = __webpack_require__(0);
var WizardFireball = /** @class */ (function (_super) {
    __extends(WizardFireball, _super);
    function WizardFireball(parent, x, y) {
        var _this = _super.call(this, x, y) || this;
        _this.tick = function () {
            if (_this.parent.dead)
                _this.dead = true;
            _this.state++;
            if (_this.state === 2) {
                _this.frame = 0;
                _this.delay = game_1.Game.rand(0, 10);
            }
        };
        _this.hitPlayer = function (player) {
            if (_this.state === 2 && !_this.dead) {
                player.hurt(1);
            }
        };
        _this.draw = function () {
            if (_this.state === 0) {
                _this.frame += 0.25;
                if (_this.frame >= 4)
                    _this.frame = 0;
                game_1.Game.drawFX(22 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y, 1, 1);
            }
            else if (_this.state === 1) {
                _this.frame += 0.25;
                if (_this.frame >= 4)
                    _this.frame = 0;
                game_1.Game.drawFX(18 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y, 1, 1);
            }
            else {
                if (_this.delay > 0) {
                    _this.delay--;
                    return;
                }
                _this.frame += 0.3;
                if (_this.frame > 17)
                    _this.dead = true;
                game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
            }
        };
        _this.parent = parent;
        _this.state = 0;
        _this.frame = 0;
        return _this;
    }
    return WizardFireball;
}(projectile_1.Projectile));
exports.WizardFireball = WizardFireball;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var RedGem = /** @class */ (function (_super) {
    __extends(RedGem, _super);
    function RedGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "RUBY";
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return RedGem;
}(item_1.Item));
exports.RedGem = RedGem;


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var FountainTile = /** @class */ (function (_super) {
    __extends(FountainTile, _super);
    function FountainTile(level, x, y, subTileX, subTileY) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function () {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(_this.subTileX, 2 + _this.subTileY, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.subTileX = subTileX;
        _this.subTileY = subTileY;
        return _this;
    }
    return FountainTile;
}(tile_1.Tile));
exports.FountainTile = FountainTile;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var CoffinTile = /** @class */ (function (_super) {
    __extends(CoffinTile, _super);
    function CoffinTile(level, x, y, subTileY) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.drawUnderPlayer = function () {
            if (_this.subTileY === 0) {
                game_1.Game.drawTile(0, 5, 1, 1, _this.x - 1, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 5, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 5, 1, 1, _this.x + 1, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(0, 6, 1, 1, _this.x - 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 6, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 6, 1, 1, _this.x + 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
            else {
                game_1.Game.drawTile(0, 7, 1, 1, _this.x - 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 7, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 7, 1, 1, _this.x + 1, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.subTileY = subTileY;
        return _this;
    }
    return CoffinTile;
}(tile_1.Tile));
exports.CoffinTile = CoffinTile;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var genericParticle_1 = __webpack_require__(3);
var PottedPlant = /** @class */ (function (_super) {
    __extends(PottedPlant, _super);
    function PottedPlant(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ce736a");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function () {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.drawX += -0.5 * _this.drawX;
                _this.drawY += -0.5 * _this.drawY;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function () { };
        _this.level = level;
        _this.health = 1;
        _this.tileX = 3;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.chainPushable = false;
        return _this;
    }
    return PottedPlant;
}(enemy_1.Enemy));
exports.PottedPlant = PottedPlant;


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var InsideLevelDoor = /** @class */ (function (_super) {
    __extends(InsideLevelDoor, _super);
    function InsideLevelDoor(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return !_this.opened;
        };
        _this.canCrushEnemy = function () {
            return !_this.opened;
        };
        _this.isOpaque = function () {
            return !_this.opened;
        };
        _this.draw = function () {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            if (_this.opened)
                game_1.Game.drawTile(15, 1, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function () {
            if (!_this.opened)
                game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.game = game;
        _this.opened = false;
        return _this;
    }
    return InsideLevelDoor;
}(tile_1.Tile));
exports.InsideLevelDoor = InsideLevelDoor;


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button(level, x, y, linkedDoor) {
        var _this = _super.call(this, level, x, y) || this;
        _this.press = function () {
            _this.pressed = true;
            _this.linkedDoor.opened = true;
        };
        _this.unpress = function () {
            _this.pressed = false;
            _this.linkedDoor.opened = false;
        };
        /*onCollide = (player: Player) => {
          this.press();
        };
      
        onCollideEnemy = (enemy: Enemy) => {
          this.press();
        };*/
        _this.tickEnd = function () {
            _this.unpress();
            if (_this.level.game.player.x === _this.x && _this.level.game.player.y === _this.y)
                _this.press();
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.x === _this.x && e.y === _this.y)
                    _this.press();
            }
        };
        _this.draw = function () {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            if (_this.pressed)
                game_1.Game.drawTile(18, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.level.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(17, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.w = 1;
        _this.h = 1;
        _this.pressed = false;
        _this.turnsSincePressed = 1;
        _this.linkedDoor = linkedDoor;
        return _this;
    }
    return Button;
}(tile_1.Tile));
exports.Button = Button;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var UpLadder = /** @class */ (function (_super) {
    __extends(UpLadder, _super);
    function UpLadder(level, game, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onCollide = function (player) {
            _this.game.changeLevelThroughLadder(_this);
        };
        _this.draw = function () {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(29, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.level.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(29, 1, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function () { };
        _this.game = game;
        return _this;
    }
    return UpLadder;
}(tile_1.Tile));
exports.UpLadder = UpLadder;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var resource_1 = __webpack_require__(23);
var genericParticle_1 = __webpack_require__(3);
var coal_1 = __webpack_require__(65);
var sound_1 = __webpack_require__(2);
var CoalResource = /** @class */ (function (_super) {
    __extends(CoalResource, _super);
    function CoalResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            sound_1.Sound.mine();
        };
        _this.kill = function () {
            sound_1.Sound.breakRock();
            _this.dead = true;
            _this.game.level.items.push(new coal_1.Coal(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function () { };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 3;
        return _this;
    }
    return CoalResource;
}(resource_1.Resource));
exports.CoalResource = CoalResource;


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var item_1 = __webpack_require__(6);
var Coal = /** @class */ (function (_super) {
    __extends(Coal, _super);
    function Coal(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "COAL\nA lump of coal.";
        };
        _this.tileX = 17;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Coal;
}(item_1.Item));
exports.Coal = Coal;


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var resource_1 = __webpack_require__(23);
var genericParticle_1 = __webpack_require__(3);
var gold_1 = __webpack_require__(35);
var sound_1 = __webpack_require__(2);
var GoldResource = /** @class */ (function (_super) {
    __extends(GoldResource, _super);
    function GoldResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            sound_1.Sound.mine();
        };
        _this.kill = function () {
            sound_1.Sound.breakRock();
            _this.dead = true;
            _this.game.level.items.push(new gold_1.Gold(_this.level, _this.x, _this.y));
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function () { };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.health = 10;
        return _this;
    }
    return GoldResource;
}(resource_1.Resource));
exports.GoldResource = GoldResource;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var greengem_1 = __webpack_require__(21);
var resource_1 = __webpack_require__(23);
var genericParticle_1 = __webpack_require__(3);
var sound_1 = __webpack_require__(2);
var EmeraldResource = /** @class */ (function (_super) {
    __extends(EmeraldResource, _super);
    function EmeraldResource(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            sound_1.Sound.mine();
        };
        _this.kill = function () {
            sound_1.Sound.breakRock();
            _this.dead = true;
            _this.game.level.items.push(new greengem_1.GreenGem(_this.level, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function () { };
        _this.tileX = 14;
        _this.tileY = 0;
        _this.health = 30;
        return _this;
    }
    return EmeraldResource;
}(resource_1.Resource));
exports.EmeraldResource = EmeraldResource;


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var tile_1 = __webpack_require__(1);
var Chasm = /** @class */ (function (_super) {
    __extends(Chasm, _super);
    function Chasm(level, x, y, leftEdge, rightEdge, topEdge, bottomEdge) {
        var _this = _super.call(this, level, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function () {
            if (_this.topEdge)
                game_1.Game.drawTile(22, 0, 1, 2, _this.x, _this.y, 1, 2, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawUnderPlayer = function () {
            game_1.Game.drawTile(_this.tileX, _this.tileY, 1, 1, _this.x, _this.y, 1, 1, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.tileX = _this.skin === 1 ? 24 : 20;
        _this.tileY = 1;
        if (leftEdge)
            _this.tileX--;
        else if (rightEdge)
            _this.tileX++;
        if (topEdge)
            _this.tileY--;
        else if (bottomEdge)
            _this.tileY++;
        _this.topEdge = topEdge;
        return _this;
    }
    return Chasm;
}(tile_1.Tile));
exports.Chasm = Chasm;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var skullEnemy_1 = __webpack_require__(33);
var enemySpawnAnimation_1 = __webpack_require__(70);
var bluegem_1 = __webpack_require__(32);
var Spawner = /** @class */ (function (_super) {
    __extends(Spawner, _super);
    function Spawner(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.tick = function () {
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.tileX = 6;
                if (_this.seenPlayer || _this.level.softVis[_this.x][_this.y] > 0) {
                    if (_this.ticks % 4 === 0) {
                        _this.tileX = 7;
                        _this.seenPlayer = true;
                        var positions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
                        var position = game_1.Game.randTable(positions);
                        var spawnX = _this.x + position[0];
                        var spawnY = _this.y + position[1];
                        var knockbackX = _this.x + position[0] * 2;
                        var knockbackY = _this.y + position[1] * 2;
                        var skeleton = new skullEnemy_1.SkullEnemy(_this.level, _this.game, spawnX, spawnY);
                        _this.level.projectiles.push(new enemySpawnAnimation_1.EnemySpawnAnimation(_this.level, skeleton, spawnX, spawnY, knockbackX, knockbackY));
                    }
                }
                _this.ticks++;
            }
        };
        _this.dropLoot = function () {
            _this.game.level.items.push(new bluegem_1.BlueGem(_this.level, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.health = 6;
        _this.maxHealth = 6;
        _this.tileX = 6;
        _this.tileY = 4;
        _this.seenPlayer = true;
        _this.deathParticleColor = "#ffffff";
        return _this;
    }
    return Spawner;
}(enemy_1.Enemy));
exports.Spawner = Spawner;


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var projectile_1 = __webpack_require__(22);
var game_1 = __webpack_require__(0);
var genericParticle_1 = __webpack_require__(3);
var sound_1 = __webpack_require__(2);
var EnemySpawnAnimation = /** @class */ (function (_super) {
    __extends(EnemySpawnAnimation, _super);
    function EnemySpawnAnimation(level, enemy, x, y, knockbackX, knockbackY) {
        var _this = _super.call(this, x, y) || this;
        _this.ANIM_COUNT = 3;
        _this.tick = function () {
            sound_1.Sound.enemySpawn();
            _this.dead = true;
            _this.enemy.skipNextTurns = 1;
            _this.level.enemies.push(_this.enemy);
            if (_this.level.game.player.x === _this.x && _this.level.game.player.y === _this.y) {
                _this.level.game.player.hurt(0.5);
                _this.level.game.player.move(_this.knockbackX, _this.knockbackY);
            }
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x + 0.5, _this.y + 0.5, "#ffffff");
        };
        _this.drawTopLayer = function () {
            _this.frame += 0.25;
            if (_this.frame >= 8)
                _this.frame = 0;
            for (var i = 0; i < _this.ANIM_COUNT; i++) {
                var offsetX = 0; //4 * Math.sin(this.frame + this.xx[i]);
                game_1.Game.drawFX(Math.floor(_this.frame), 26, 1, 2, _this.x + Math.round(offsetX) / 16.0, _this.y - 1.5, // + Math.round(this.yy[i]) / 16.0,
                1, 2);
            }
            if (Math.floor(_this.frame * 4) % 2 == 0)
                _this.level.particles.push(new genericParticle_1.GenericParticle(_this.level, _this.x + 0.5 + Math.random() * 0.05 - 0.025, _this.y + Math.random() * 0.05 - 0.025, 0.25, Math.random() * 0.5, 0.025 * (Math.random() * 1 - 0.5), 0.025 * (Math.random() * 1 - 0.5), 0.2 * (Math.random() - 1), "#ffffff", 0));
            //Game.drawFX(18 + Math.floor(HitWarning.frame), 6, 1, 1, this.x, this.y, 1, 1);
        };
        _this.level = level;
        _this.enemy = enemy;
        _this.frame = 0;
        _this.f = [];
        _this.xx = [];
        _this.yy = [];
        for (var i = 0; i < _this.ANIM_COUNT; i++) {
            _this.f[i] = _this.xx[i] = Math.random() * 6.28;
            _this.yy[i] = Math.random() * 8 - 8;
        }
        _this.knockbackX = knockbackX;
        _this.knockbackY = knockbackY;
        return _this;
    }
    return EnemySpawnAnimation;
}(projectile_1.Projectile));
exports.EnemySpawnAnimation = EnemySpawnAnimation;


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var enemy_1 = __webpack_require__(5);
var coin_1 = __webpack_require__(8);
var greengem_1 = __webpack_require__(21);
var gameConstants_1 = __webpack_require__(4);
var shotgun_1 = __webpack_require__(36);
var armor_1 = __webpack_require__(16);
var heart_1 = __webpack_require__(20);
var spear_1 = __webpack_require__(37);
var gold_1 = __webpack_require__(35);
var OPEN_TIME = 150;
var FILL_COLOR = "#5a595b";
var OUTLINE_COLOR = "#292c36";
var FULL_OUTLINE = "white";
var VendingMachine = /** @class */ (function (_super) {
    __extends(VendingMachine, _super);
    function VendingMachine(level, game, x, y, item) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.open = false;
        _this.openTime = 0;
        _this.isInf = false;
        _this.quantity = 1;
        _this.buyAnimAmount = 0;
        _this.interact = function () {
            if (_this.isInf || _this.quantity > 0) {
                _this.open = true;
                _this.openTime = Date.now();
                if (_this.game.player.openVendingMachine)
                    _this.game.player.openVendingMachine.close();
                _this.game.player.openVendingMachine = _this;
            }
        };
        _this.close = function () {
            _this.open = false;
            _this.game.player.openVendingMachine = null;
        };
        _this.space = function () {
            if (_this.open) {
                // check if player can pay
                for (var _i = 0, _a = _this.costItems; _i < _a.length; _i++) {
                    var i_1 = _a[_i];
                    if (!_this.game.player.inventory.hasItemCount(i_1))
                        return;
                }
                for (var _b = 0, _c = _this.costItems; _b < _c.length; _b++) {
                    var i_2 = _c[_b];
                    _this.game.player.inventory.subtractItemCount(i_2);
                }
                var xs = [_this.x - 1, _this.x + 1, _this.x];
                var ys = [_this.y, _this.y, _this.y + 1];
                var i = 0;
                do {
                    i = game_1.Game.rand(0, xs.length - 1);
                } while (xs[i] === _this.game.player.x && ys[i] === _this.game.player.y);
                var newItem = new _this.item.constructor();
                newItem = newItem.constructor(_this.level, xs[i], ys[i]);
                _this.level.items.push(newItem);
                console.log(newItem);
                if (!_this.isInf) {
                    _this.quantity--;
                    if (_this.quantity <= 0)
                        _this.close();
                }
                _this.buyAnimAmount = 0.99;
                _this.game.shakeScreen(0, 4);
            }
        };
        _this.draw = function () {
            var tileX = 19;
            if (!_this.isInf && _this.quantity === 0)
                tileX = 20;
            game_1.Game.drawObj(tileX, 0, 1, 2, _this.x, _this.y - 1, 1, 2, _this.level.shadeColor, _this.shadeAmount());
        };
        _this.drawTopLayer = function () {
            if (_this.open) {
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3; // highlighted growth
                var ob = 1; // outer border
                var width = (_this.costItems.length + 2) * (s + 2 * b + g) - g;
                var height = s + 2 * b + g - g;
                var cx = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                var cy = (_this.y - 1.5) * gameConstants_1.GameConstants.TILESIZE;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                for (var x = 0; x < _this.costItems.length + 2; x++) {
                    game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g)), Math.round(cy - 0.5 * height), Math.round(s + 2 * b), Math.round(s + 2 * b));
                    if (x !== _this.costItems.length) {
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(cy - 0.5 * height + b), Math.round(s), Math.round(s));
                    }
                }
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i = 0; i < _this.costItems.length + 2; i++) {
                        var drawX = Math.round(cx -
                            0.5 * width +
                            i * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY = Math.round(cy - 0.5 * height + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        if (i < _this.costItems.length) {
                            var a = 1;
                            if (!_this.game.player.inventory.hasItemCount(_this.costItems[i]))
                                a = 0.15;
                            _this.costItems[i].drawIcon(drawXScaled, drawYScaled, a);
                        }
                        else if (i === _this.costItems.length) {
                            game_1.Game.drawFX(0, 1, 1, 1, drawXScaled, drawYScaled, 1, 1);
                        }
                        else if (i === _this.costItems.length + 1) {
                            _this.item.drawIcon(drawXScaled, drawYScaled);
                        }
                    }
                }
                _this.buyAnimAmount *= _this.buyAnimAmount;
                game_1.Game.ctx.globalAlpha = _this.buyAnimAmount;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        _this.destroyable = false;
        _this.pushable = false;
        _this.chainPushable = false;
        _this.interactable = true;
        _this.item = item;
        if (_this.item instanceof shotgun_1.Shotgun) {
            var g = new greengem_1.GreenGem(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7]);
            _this.costItems = [g];
        }
        else if (_this.item instanceof heart_1.Heart) {
            var c = new coin_1.Coin(level, 0, 0);
            c.stackCount = 10;
            _this.costItems = [c];
        }
        else if (_this.item instanceof spear_1.Spear) {
            var g = new greengem_1.GreenGem(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7]);
            _this.costItems = [g];
        }
        else if (_this.item instanceof armor_1.Armor) {
            var g = new gold_1.Gold(level, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7]);
            _this.costItems = [g];
        }
        return _this;
    }
    return VendingMachine;
}(enemy_1.Enemy));
exports.VendingMachine = VendingMachine;


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var enemy_1 = __webpack_require__(5);
var game_1 = __webpack_require__(0);
var hitWarning_1 = __webpack_require__(14);
var coin_1 = __webpack_require__(8);
var door_1 = __webpack_require__(15);
var bottomDoor_1 = __webpack_require__(10);
var genericParticle_1 = __webpack_require__(3);
var ChargeEnemyState;
(function (ChargeEnemyState) {
    ChargeEnemyState[ChargeEnemyState["IDLE"] = 0] = "IDLE";
    ChargeEnemyState[ChargeEnemyState["ALERTED"] = 1] = "ALERTED";
    ChargeEnemyState[ChargeEnemyState["CHARGING"] = 2] = "CHARGING";
})(ChargeEnemyState = exports.ChargeEnemyState || (exports.ChargeEnemyState = {}));
var ChargeEnemy = /** @class */ (function (_super) {
    __extends(ChargeEnemy, _super);
    function ChargeEnemy(level, game, x, y) {
        var _this = _super.call(this, level, game, x, y) || this;
        _this.hit = function () {
            return 0.5;
        };
        _this.canMoveOver = function (x, y) {
            for (var _i = 0, _a = _this.level.enemies; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && x === e.x && y === e.y)
                    return false;
            }
            var t = _this.level.levelArray[x][y];
            return !(t.isSolid() || (t instanceof door_1.Door || t instanceof bottomDoor_1.BottomDoor));
        };
        _this.tick = function () {
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (_this.seenPlayer || _this.level.softVis[_this.x][_this.y] < 1) {
                    _this.seenPlayer = true;
                    if (_this.state === ChargeEnemyState.IDLE) {
                        var blocked = false;
                        var dx = 0;
                        var dy = 0;
                        if (_this.x === _this.game.player.x) {
                            if (_this.y < _this.game.player.y)
                                dy = 1;
                            else
                                dy = -1;
                            for (var yy = _this.y; yy !== _this.game.player.y; yy += dy) {
                                if (!_this.canMoveOver(_this.x, yy))
                                    blocked = true;
                            }
                        }
                        else if (_this.y === _this.game.player.y) {
                            if (_this.x < _this.game.player.x)
                                dx = 1;
                            else
                                dx = -1;
                            for (var xx = _this.x; xx !== _this.game.player.x; xx += dx) {
                                if (!_this.canMoveOver(xx, _this.y))
                                    blocked = true;
                            }
                        }
                        if ((dx !== 0 || dy !== 0) && !blocked) {
                            _this.state = ChargeEnemyState.ALERTED;
                            _this.targetX = _this.x;
                            _this.targetY = _this.y;
                            while (_this.canMoveOver(_this.targetX + dx, _this.targetY + dy)) {
                                _this.targetX += dx;
                                _this.targetY += dy;
                                if ((_this.targetX === _this.game.player.x && _this.targetY === _this.game.player.y) ||
                                    (_this.targetX === _this.game.player.x - 1 && _this.targetY === _this.game.player.y) ||
                                    (_this.targetX === _this.game.player.x + 1 && _this.targetY === _this.game.player.y) ||
                                    (_this.targetX === _this.game.player.x && _this.targetY === _this.game.player.y - 1) ||
                                    (_this.targetX === _this.game.player.x && _this.targetY === _this.game.player.y + 1))
                                    _this.level.projectiles.push(new hitWarning_1.HitWarning(_this.game, _this.targetX, _this.targetY));
                            }
                        }
                    }
                    else if (_this.state === ChargeEnemyState.ALERTED) {
                        _this.state = ChargeEnemyState.CHARGING;
                        if ((_this.y === _this.game.player.y &&
                            ((_this.x < _this.game.player.x && _this.game.player.x <= _this.targetX) ||
                                (_this.targetX <= _this.game.player.x && _this.game.player.x < _this.x))) ||
                            (_this.x === _this.game.player.x &&
                                ((_this.y < _this.game.player.y && _this.game.player.y <= _this.targetY) ||
                                    (_this.targetY <= _this.game.player.y && _this.game.player.y < _this.y)))) {
                            _this.game.player.hurt(0.5);
                        }
                        _this.drawX = _this.targetX - _this.x;
                        _this.drawY = _this.targetY - _this.y;
                        _this.x = _this.targetX;
                        _this.y = _this.targetY;
                    }
                    else if (_this.state === ChargeEnemyState.CHARGING) {
                        _this.state = ChargeEnemyState.IDLE;
                    }
                }
            }
        };
        _this.draw = function () {
            if (!_this.dead) {
                _this.frame += 0.1;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if ((_this.state === ChargeEnemyState.CHARGING && Math.abs(_this.drawX) > 0.1) ||
                    Math.abs(_this.drawY) > 0.1) {
                    genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "black");
                    genericParticle_1.GenericParticle.spawnCluster(_this.level, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "white");
                }
                //if (this.doneMoving() && this.game.player.doneMoving()) this.facePlayer();
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.level.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY + (_this.tileX === 4 ? 0.1875 : 0), 1, 2, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.dropLoot = function () {
            _this.game.level.items.push(new coin_1.Coin(_this.level, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.seenPlayer = true;
        _this.deathParticleColor = "#ffffff";
        _this.state = ChargeEnemyState.IDLE;
        return _this;
    }
    return ChargeEnemy;
}(enemy_1.Enemy));
exports.ChargeEnemy = ChargeEnemy;


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var game_1 = __webpack_require__(0);
var level_1 = __webpack_require__(30);
var ROOM_SIZE = [5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 13];
var N = /** @class */ (function () {
    function N(type, difficulty, children) {
        this.type = type;
        this.difficulty = difficulty;
        this.children = children;
    }
    return N;
}());
var Room = /** @class */ (function () {
    function Room() {
        var _this = this;
        this.collides = function (r) {
            if (_this.x > r.x + r.w || _this.x + _this.w < r.x)
                return false;
            if (_this.y >= r.y + r.h || _this.y + _this.h <= r.y)
                return false;
            return true;
        };
        this.getPoints = function () {
            return [
                { x: _this.x, y: _this.y },
                { x: Math.floor(_this.x + _this.w / 2), y: _this.y },
                { x: _this.x + _this.w - 1, y: _this.y },
                { x: _this.x, y: _this.y + _this.h },
                { x: Math.floor(_this.x + _this.w / 2), y: _this.y + _this.h },
                { x: _this.x + _this.w - 1, y: _this.y + _this.h },
            ];
        };
        this.getDoors = function () {
            return _this.doors;
        };
        this.generateAroundPoint = function (p, dir, w, h) {
            _this.x = 0;
            _this.y = 0;
            if (w) {
                _this.w = w;
                _this.h = h;
            }
            else {
                _this.w = ROOM_SIZE[Math.floor(Math.random() * ROOM_SIZE.length)];
                _this.h = ROOM_SIZE[Math.floor(Math.random() * ROOM_SIZE.length)];
            }
            var ind = 1;
            if (dir === 0 || dir === 1 || dir === 2) {
                ind = 3 + Math.floor(Math.random() * 3);
            }
            else {
                ind = Math.floor(Math.random() * 3);
            }
            var point = _this.getPoints()[ind];
            _this.x += p.x - point.x;
            _this.y += p.y - point.y;
            return ind;
        };
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.doneAdding = false;
        this.doors = [null, null, null, null, null, null];
    }
    return Room;
}());
var LevelGenerator = /** @class */ (function () {
    function LevelGenerator() {
        var _this = this;
        this.rooms = [];
        this.levels = [];
        this.upLadder = null;
        this.noCollisions = function (r) {
            for (var _i = 0, _a = _this.rooms; _i < _a.length; _i++) {
                var room = _a[_i];
                if (r.collides(room)) {
                    return false;
                }
            }
            return true;
        };
        this.pickType = function (r) {
            var type = level_1.RoomType.DUNGEON;
            switch (game_1.Game.rand(1, 9)) {
                case 1:
                    type = level_1.RoomType.FOUNTAIN;
                    if (r.h <= 5 || (r.w > 9 && r.h > 9))
                        type = _this.pickType(r);
                    break;
                case 2:
                    type = level_1.RoomType.COFFIN;
                    if (r.w <= 5)
                        type = _this.pickType(r);
                    break;
                case 3:
                    type = level_1.RoomType.TREASURE;
                    break;
                case 4:
                case 5:
                    type = level_1.RoomType.GRASS;
                    break;
            }
            return type;
        };
        this.shuffle = function (a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };
        this.addRooms = function (thisNode, parent, parentLevel) {
            var order = _this.shuffle([0, 1, 2, 3, 4, 5]);
            //console.log(thisNode, parent);
            var points;
            if (parent)
                points = parent.getPoints();
            for (var i = 0; i < order.length; i++) {
                var ind = order[i];
                for (var j = 0; j < 20; j++) {
                    var r = new Room();
                    r.x = 0;
                    r.y = 0;
                    var newLevelDoorDir = game_1.Game.rand(1, 6);
                    if (parent) {
                        switch (thisNode.type) {
                            case level_1.RoomType.DUNGEON:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, game_1.Game.randTable([5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 9, 9, 10]), game_1.Game.randTable([5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 9, 9, 10]));
                                break;
                            case level_1.RoomType.BIGDUNGEON:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, game_1.Game.randTable([10, 11, 12, 13]), game_1.Game.randTable([10, 11, 12, 13]));
                                break;
                            case level_1.RoomType.UPLADDER:
                            case level_1.RoomType.DOWNLADDER:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, 5, 5);
                                break;
                            case level_1.RoomType.SPAWNER:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, game_1.Game.randTable([9, 10, 11]), game_1.Game.randTable([9, 10, 11]));
                                break;
                            case level_1.RoomType.PUZZLE:
                            case level_1.RoomType.COFFIN:
                            case level_1.RoomType.FOUNTAIN:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, 11, 11);
                                break;
                            case level_1.RoomType.SPIKECORRIDOR:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind, game_1.Game.randTable([3, 5]), game_1.Game.randTable([9, 10, 11]));
                                break;
                            default:
                                newLevelDoorDir = r.generateAroundPoint(points[ind], ind);
                                break;
                        }
                    }
                    else {
                        r.x = -2;
                        r.y = -2;
                        r.w = 7; //ROOM_SIZE[Math.floor(Math.random() * ROOM_SIZE.length)];
                        r.h = 7; //ROOM_SIZE[Math.floor(Math.random() * ROOM_SIZE.length)];
                    }
                    if (_this.noCollisions(r)) {
                        var level = new level_1.Level(_this.game, r.x, r.y, r.w, r.h, thisNode.type, thisNode.difficulty);
                        if (level.upLadder)
                            _this.upLadder = level.upLadder;
                        _this.levels.push(level);
                        if (parentLevel) {
                            var newDoor = level.addDoor(newLevelDoorDir, null);
                            parentLevel.doors[ind] = parentLevel.addDoor(ind, newDoor);
                            newDoor.linkedDoor = parentLevel.doors[ind];
                            r.doors[newLevelDoorDir] = newDoor;
                        }
                        _this.rooms.push(r);
                        for (var _i = 0, _a = thisNode.children; _i < _a.length; _i++) {
                            var child = _a[_i];
                            if (!_this.addRooms(child, r, level))
                                return false;
                        }
                        return true;
                    }
                }
            }
            return false;
        };
        this.generate = function (game, depth) {
            var d = depth;
            var node;
            if (d == 0) {
                node = new N(level_1.RoomType.SHOP, d, [new N(level_1.RoomType.DOWNLADDER, d, [])]);
            }
            else {
                switch (game_1.Game.rand(1, 10)) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                        node = new N(level_1.RoomType.UPLADDER, d, [
                            new N(level_1.RoomType.DUNGEON, d, [
                                new N(level_1.RoomType.SPAWNER, d, [
                                    new N(level_1.RoomType.DOWNLADDER, d, [
                                        new N(level_1.RoomType.CAVE, d, [
                                            new N(level_1.RoomType.CAVE, d, []),
                                            new N(level_1.RoomType.CAVE, d, []),
                                        ]),
                                    ]),
                                    new N(level_1.RoomType.CAVE, d, [new N(level_1.RoomType.CAVE, d, [new N(level_1.RoomType.CAVE, d, [])])]),
                                    new N(game_1.Game.rand(1, 3) === 1 ? level_1.RoomType.TREASURE : level_1.RoomType.DUNGEON, d, []),
                                    new N(level_1.RoomType.DUNGEON, d, [new N(level_1.RoomType.DOWNLADDER, d, [])]),
                                ]),
                            ]),
                            new N(level_1.RoomType.DUNGEON, d, [new N(level_1.RoomType.DUNGEON, d, [])]),
                        ]);
                        break;
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                        node = new N(level_1.RoomType.UPLADDER, d, [
                            new N(level_1.RoomType.DUNGEON, d, [
                                new N(level_1.RoomType.DUNGEON, d, [new N(level_1.RoomType.DOWNLADDER, d, [])]),
                                new N(level_1.RoomType.BIGDUNGEON, d, [
                                    new N(level_1.RoomType.SPIKECORRIDOR, d, [new N(level_1.RoomType.TREASURE, d, [])]),
                                    new N(level_1.RoomType.DUNGEON, d, [
                                        new N(level_1.RoomType.CAVE, d, []),
                                        new N(level_1.RoomType.CAVE, d, []),
                                    ]),
                                ]),
                                new N(level_1.RoomType.DUNGEON, d, [
                                    new N(level_1.RoomType.CAVE, d, [
                                        new N(level_1.RoomType.CAVE, d, [new N(level_1.RoomType.CAVE, d, [])]),
                                        new N(level_1.RoomType.CAVE, d, [new N(level_1.RoomType.CAVE, d, [])]),
                                        new N(level_1.RoomType.CAVE, d, []),
                                    ]),
                                ]),
                            ]),
                        ]);
                        break;
                }
            }
            /*  new N(RoomType.DUNGEON, d, [
                new N(RoomType.COFFIN, d, [])
              ]),
              new N(RoomType.PUZZLE, d, [
                new N(RoomType.SPIKECORRIDOR, d, [
                  new N(RoomType.TREASURE, d, [])
                ])
              ]),
              new N(RoomType.DUNGEON, d, [
                new N(RoomType.DUNGEON, d, [
                  new N(RoomType.DUNGEON, d, [
                    new N(RoomType.FOUNTAIN, d, [
                      new N(RoomType.DUNGEON, d, [
                        new N(RoomType.SPIKECORRIDOR, d, [
                          new N(RoomType.KEYROOM, d, [])
                        ]),
                      ]),
                      new N(RoomType.TREASURE, d, []),
                    ]),
                  ]),
                  new N(RoomType.GRASS, d, [
                    new N(RoomType.GRASS, d, [
                      new N(RoomType.TREASURE, d, [])
                    ])
                  ]),
                ]),
              ]),
            ]);*/
            _this.game = game;
            var success = false;
            do {
                _this.rooms.splice(0);
                _this.levels.splice(0);
                success = _this.addRooms(node, null, null);
            } while (!success);
            _this.game.levels = _this.game.levels.concat(_this.levels);
            if (d != 0) {
                return _this.upLadder;
            }
        };
    }
    return LevelGenerator;
}());
exports.LevelGenerator = LevelGenerator;


/***/ })
/******/ ]);