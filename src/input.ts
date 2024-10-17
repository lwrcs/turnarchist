import { GameConstants } from "./gameConstants";
import { Game } from "./game";

export enum InputEnum {
  I,
  M,
  M_UP,
  Q,
  LEFT,
  RIGHT,
  UP,
  DOWN,
  SPACE
}

export const Input = {
  _pressed: {},

  isTapHold: false,
  tapStartTime: null,
  IS_TAP_HOLD_THRESH: 300,
  keyDownListener: function (key: string) { },
  iListener: function () { },
  mListener: function () { },
  mUpListener: function () { },
  qListener: function () { },
  leftListener: function () { },
  rightListener: function () { },
  upListener: function () { },
  downListener: function () { },
  aListener: function () { Input.leftListener(); },
  dListener: function () { Input.rightListener(); },
  wListener: function () { Input.upListener(); },
  sListener: function () { Input.downListener(); },
  spaceListener: function () { },
  leftSwipeListener: function () { },
  rightSwipeListener: function () { },
  upSwipeListener: function () { },
  downSwipeListener: function () { },
  tapListener: function () { },

  mouseLeftClickListeners: [],

  mouseLeftClickListener: function (x: number, y: number) {
    for (let i = 0; i < Input.mouseLeftClickListeners.length; i++)
      Input.mouseLeftClickListeners[i](x, y);
  },

  mouseX: 0,
  mouseY: 0,

  lastPressTime: 0,
  lastPressKey: "",

  SPACE: "Space",
  LEFT: "ArrowLeft",
  UP: "ArrowUp",
  RIGHT: "ArrowRight",
  DOWN: "ArrowDown",
  W: "KeyW",
  A: "KeyA",
  S: "KeyS",
  D: "KeyD",
  M: "KeyM",
  N: "KeyN",
  I: "KeyI",
  Q: "KeyQ",

  isDown: function (keyCode: string) {
    return this._pressed[keyCode];
  },

  onKeydown: (event: KeyboardEvent) => {
    if (event.repeat) return; // ignore repeat keypresses
    if (event.key) Input.keyDownListener(event.key);
    if (event.cancelable && event.key != "F12" && event.key != "F5") event.preventDefault();
    Input.lastPressTime = Date.now();
    Input.lastPressKey = event.key;
    Input._pressed[event.code] = true;
    switch (event.code) {
      case Input.LEFT:
        Input.leftListener();
        break;
      case Input.A:
        Input.aListener();
        break;
      case Input.RIGHT:
        Input.rightListener();
        break;
      case Input.D:
        Input.dListener();
        break;
      case Input.UP:
        Input.upListener();
        break;
      case Input.W:
        Input.wListener();
        break;
      case Input.DOWN:
        Input.downListener();
        break;
      case Input.S:
        Input.sListener();
        break;
      case Input.SPACE:
        Input.spaceListener();
        break;
      case Input.M:
        Input.mListener();
        break;
      case Input.I:
        Input.iListener();
        break;
      case Input.Q:
        Input.qListener();
        break;
    }
  },

  onKeyup: function (event: KeyboardEvent) {
    delete this._pressed[event.code];
    if (event.key === this.lastPressKey) {
      this.lastPressTime = 0;
      this.lastPressKey = 0;
    }
    if (event.code === Input.M) Input.mUpListener();
  },

  mouseClickListener: function (event: MouseEvent) {
    if (event.button === 0) {
      let rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      Input.mouseLeftClickListener(Math.floor(x / Game.scale), Math.floor(y / Game.scale));
    }
  },

  updateMousePos: function (event: MouseEvent) {
    let rect = window.document.getElementById("gameCanvas").getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    Input.mouseX = Math.floor(x / Game.scale);
    Input.mouseY = Math.floor(y / Game.scale);
  },

  getTouches: function (evt) {
    return (
      evt.touches || evt.originalEvent.touches // browser API
    ); // jQuery
  },

  xDown: null,
  yDown: null,
  currentX: 0,
  currentY: 0,
  swiped: false,

  handleTouchStart: function (evt) {
    evt.preventDefault();

    const firstTouch = Input.getTouches(evt)[0];
    Input.xDown = firstTouch.clientX;
    Input.yDown = firstTouch.clientY;
    Input.currentX = firstTouch.clientX;
    Input.currentY = firstTouch.clientY;

    Input.tapStartTime = Date.now();

    Input.updateMousePos({
      clientX: Input.currentX,
      clientY: Input.currentY,
    } as MouseEvent);

    Input.swiped = false;
  },

  handleTouchMove: function (evt) {
    evt.preventDefault();

    Input.currentX = evt.touches[0].clientX;
    Input.currentY = evt.touches[0].clientY;

    Input.updateMousePos({
      clientX: Input.currentX,
      clientY: Input.currentY,
    } as MouseEvent);

    if (Input.swiped) return;

    var xDiff = Input.xDown - Input.currentX;
    var yDiff = Input.yDown - Input.currentY;

    // we have not swiped yet
    // check if we've swiped
    if (xDiff ** 2 + yDiff ** 2 >= GameConstants.SWIPE_THRESH) {
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        /*most significant*/
        if (xDiff > 0) {
          Input.leftSwipeListener();
        } else {
          Input.rightSwipeListener();
        }
        Input.swiped = true;
      } else {
        if (yDiff > 0) {
          Input.upSwipeListener();
        } else {
          Input.downSwipeListener();
        }
        Input.swiped = true;
      }
    }
  },

  handleTouchEnd: function (evt) {
    evt.preventDefault();

    if (!Input.isTapHold && !Input.swiped) Input.tapListener();
    Input.isTapHold = false;
    Input.tapStartTime = null;

    // we've already swiped, don't count the click
    if (Input.swiped) return;
    Input.mouseClickListener({
      button: 0,
      clientX: Input.currentX,
      clientY: Input.currentY,
    } as MouseEvent);

    Input.updateMousePos({
      clientX: 0,
      clientY: 0,
    } as MouseEvent);
  },

  checkIsTapHold: function () {
    if (Input.tapStartTime !== null && Date.now() >= Input.tapStartTime + Input.IS_TAP_HOLD_THRESH)
      Input.isTapHold = true;
  },
};
window.addEventListener(
  "keyup",
  function (event) {
    Input.onKeyup(event);
  },
  false
);
window.addEventListener(
  "keydown",
  function (event) {
    Input.onKeydown(event);
  },
  false
);
window.document
  .getElementById("gameCanvas")
  .addEventListener("click", event => Input.mouseClickListener(event), false);
window.document
  .getElementById("gameCanvas")
  .addEventListener("mousemove", event => Input.updateMousePos(event));
