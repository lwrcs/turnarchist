import { GameConstants } from "./gameConstants";
import { Game } from "./game";
import { MouseCursor } from "./mouseCursor";

export enum InputEnum {
  I,
  M,
  M_UP,
  Q,
  LEFT,
  RIGHT,
  UP,
  DOWN,
  SPACE,
  COMMA,
  PERIOD,
  LEFT_CLICK,
  RIGHT_CLICK,
  MOUSE_MOVE,
  NUMBER_1,
  NUMBER_2,
  NUMBER_3,
  NUMBER_4,
  NUMBER_5,
  NUMBER_6,
  NUMBER_7,
  NUMBER_8,
  NUMBER_9,
  MINUS,
  EQUALS,
  ESCAPE,
}

export const Input = {
  _pressed: {},

  isTapHold: false,
  tapStartTime: null,
  IS_TAP_HOLD_THRESH: 300,
  keyDownListener: function (key: string) {},
  iListener: function () {},
  mListener: function () {},
  mUpListener: function () {},
  qListener: function () {},
  leftListener: function () {},
  rightListener: function () {},
  upListener: function () {},
  downListener: function () {},
  aListener: function () {
    Input.leftListener();
  },
  dListener: function () {
    Input.rightListener();
  },
  wListener: function () {
    Input.upListener();
  },
  sListener: function () {
    Input.downListener();
  },
  spaceListener: function () {},
  leftSwipeListener: function () {},
  rightSwipeListener: function () {},
  upSwipeListener: function () {},
  downSwipeListener: function () {},
  tapListener: function () {},
  commaListener: function () {},
  periodListener: function () {},
  numKeyListener: function (num: number) {},
  equalsListener: function () {},
  minusListener: function () {},
  escapeListener: function () {},
  mouseLeftClickListeners: [],
  mouseRightClickListeners: [],
  mouseMoveListeners: [],
  mouseDownListeners: [],
  mouseUpListeners: [],

  touchStartListeners: [],
  touchEndListeners: [],

  mouseX: 0,
  mouseY: 0,
  mouseDown: false,

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
  NUMBER_1: "Digit1",
  NUMBER_2: "Digit2",
  NUMBER_3: "Digit3",
  NUMBER_4: "Digit4",
  NUMBER_5: "Digit5",
  NUMBER_6: "Digit6",
  NUMBER_7: "Digit7",
  NUMBER_8: "Digit8",
  NUMBER_9: "Digit9",
  COMMA: "Comma",
  PERIOD: "Period",
  MINUS: "Minus",
  EQUALS: "Equal",
  ESCAPE: "Escape",

  isDown: function (keyCode: string) {
    return this._pressed[keyCode];
  },

  onKeydown: (event: KeyboardEvent) => {
    if (event.repeat) return; // ignore repeat keypresses
    if (event.key) Input.keyDownListener(event.key);
    if (event.cancelable && event.key != "F12" && event.key != "F5")
      event.preventDefault();
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
      case Input.COMMA:
        Input.commaListener();
        break;
      case Input.PERIOD:
        Input.periodListener();
        break;
      case Input.NUMBER_1:
      case Input.NUMBER_2:
      case Input.NUMBER_3:
      case Input.NUMBER_4:
      case Input.NUMBER_5:
      case Input.NUMBER_6:
      case Input.NUMBER_7:
      case Input.NUMBER_8:
      case Input.NUMBER_9:
        Input.numKeyListener(parseInt(event.code.slice(-1)));
        break;
      case Input.EQUALS:
        Input.equalsListener();
        break;
      case Input.MINUS:
        Input.minusListener();
        break;
      case Input.ESCAPE:
        Input.escapeListener();
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

  mouseLeftClickListener: function (x: number, y: number) {
    for (let i = 0; i < Input.mouseLeftClickListeners.length; i++)
      Input.mouseLeftClickListeners[i](x, y);
  },

  mouseRightClickListener: function (x: number, y: number) {
    for (let i = 0; i < Input.mouseRightClickListeners.length; i++)
      Input.mouseRightClickListeners[i](x, y);
  },

  mouseMoveListener: function (x: number, y: number) {
    for (let i = 0; i < Input.mouseMoveListeners.length; i++)
      Input.mouseMoveListeners[i](x, y);
  },

  mouseDownListener: function (x: number, y: number, button: number) {
    for (let i = 0; i < Input.mouseDownListeners.length; i++)
      Input.mouseDownListeners[i](x, y, button);
  },

  mouseUpListener: function (x: number, y: number, button: number) {
    for (let i = 0; i < Input.mouseUpListeners.length; i++)
      Input.mouseUpListeners[i](x, y, button);
  },

  mouseClickListener: function (event: MouseEvent) {
    if (event.button === 0 || event.button === 2) {
      let rect = window.document
        .getElementById("gameCanvas")
        .getBoundingClientRect();
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;
      let scaledX = Math.floor(x / Game.scale);
      let scaledY = Math.floor(y / Game.scale);

      if (event.button === 0) {
        Input.mouseLeftClickListener(scaledX, scaledY);
      } else if (event.button === 2) {
        Input.mouseRightClickListener(scaledX, scaledY);
      }
    }
  },

  updateMousePos: function (event: MouseEvent) {
    Game.inputReceived = true;

    let rect = window.document
      .getElementById("gameCanvas")
      .getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    Input.mouseX = Math.floor(x / Game.scale);
    Input.mouseY = Math.floor(y / Game.scale);

    Input.mouseMoveListener(Input.mouseX, Input.mouseY);
  },

  handleMouseDown: function (event: MouseEvent) {
    if (Input.mouseDown) return; // Prevent multiple triggers
    MouseCursor.getInstance().startClickAnim();
    Input.mouseDown = true;
    Input.mouseDownStartTime = Date.now();
    Input.isMouseHold = false;
    Input.mouseDownListener(Input.mouseX, Input.mouseY, event.button);

    // Start checking for hold
    if (!Input._holdCheckInterval) {
      Input._holdCheckInterval = setInterval(Input.checkIsMouseHold, 16); // Check every frame
    }
  },

  handleMouseUp: function (event: MouseEvent) {
    Input.mouseDown = false;
    Input.mouseDownStartTime = null;
    Input.mouseUpListener(Input.mouseX, Input.mouseY, event.button);

    // Clear hold check interval
    if (Input._holdCheckInterval) {
      clearInterval(Input._holdCheckInterval);
      Input._holdCheckInterval = null;
    }

    // Clear isMouseHold after a short delay to ensure click handler sees it
    setTimeout(() => {
      Input.isMouseHold = false;
    }, 50);
  },

  _holdCheckInterval: null,

  checkIsMouseHold: function () {
    if (!Input.mouseDown || Input.mouseDownStartTime === null) return;

    if (Date.now() >= Input.mouseDownStartTime + Input.HOLD_THRESH) {
      if (!Input.isMouseHold) {
        Input.isMouseHold = true;
        // Call the hold callback if one is registered
        if (Input.holdCallback) {
          Input.holdCallback();
        }
      }
    }
  },

  getTouches: function (evt) {
    Game.inputReceived = true;

    return (
      evt.touches || evt.originalEvent.touches // browser API
    ); // jQuery
  },

  xDown: null,
  yDown: null,
  currentX: 0,
  currentY: 0,
  swiped: false,

  handleTouchStart: function (evt: TouchEvent) {
    //console.log("handleTouchStart triggered");
    Game.inputReceived = true;

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

    // Unify with mouseDown logic, but force button=0 (left-click equivalent)
    Input.mouseDown = true;
    Input.mouseDownStartTime = Date.now();
    Input.isMouseHold = false;
    Input.mouseDownListener(Input.mouseX, Input.mouseY, 0);

    if (!Input._holdCheckInterval) {
      Input._holdCheckInterval = setInterval(Input.checkIsMouseHold, 16);
      // console.log("_holdCheckInterval started");
    }
  },

  handleTouchMove: function (evt) {
    //console.log("handleTouchMove triggered");
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

  handleTouchEnd: function (evt: TouchEvent) {
    //console.log("handleTouchEnd triggered");
    evt.preventDefault();

    if (!Input.isTapHold && !Input.swiped) Input.tapListener();
    Input.isTapHold = false;
    Input.tapStartTime = null;

    //if (Input.swiped) return;

    // Also unify with mouseUp logic, again forcing button=0
    Input.mouseDown = false;
    Input.mouseDownStartTime = null;
    Input.mouseUpListener(Input.mouseX, Input.mouseY, 0);

    if (Input._holdCheckInterval) {
      clearInterval(Input._holdCheckInterval);
      Input._holdCheckInterval = null;
      //console.log("_holdCheckInterval cleared");
    }
    setTimeout(() => {
      Input.isMouseHold = false;
      //console.log("isMouseHold reset");
    }, 50);
  },

  checkIsTapHold: function () {
    if (
      Input.tapStartTime !== null &&
      Date.now() >= Input.tapStartTime + Input.IS_TAP_HOLD_THRESH
    )
      Input.isTapHold = true;
  },

  set isMouseHold(value: boolean) {
    //console.log(`isMouseHold set to: ${value}`);
    this._isMouseHold = value;
  },

  get isMouseHold() {
    return this._isMouseHold;
  },

  _isMouseHold: false,

  mouseDownStartTime: null,
  HOLD_THRESH: 200, // Adjust this value as needed

  holdCallback: null as (() => void) | null,
};
window.addEventListener(
  "keyup",
  function (event) {
    Input.onKeyup(event);
  },
  false,
);
window.addEventListener(
  "keydown",
  function (event) {
    Input.onKeydown(event);
  },
  false,
);

/** 

window.addEventListener(
  "touchstart",
  function (event) {
    Input.handleTouchStart(event);
  },
  false,
);

window.addEventListener(
  "touchend",
  function (event) {
    Input.handleTouchEnd(event);
  },
  false,
);
*/

window.document
  .getElementById("gameCanvas")
  .addEventListener("click", (event) => Input.mouseClickListener(event), false);
window.document
  .getElementById("gameCanvas")
  .addEventListener("mousemove", (event) => Input.updateMousePos(event), false);
window.document
  .getElementById("gameCanvas")
  .addEventListener(
    "mousedown",
    (event) => Input.handleMouseDown(event),
    false,
  );
window.document
  .getElementById("gameCanvas")
  .addEventListener("mouseup", (event) => Input.handleMouseUp(event), false);
window.document
  .getElementById("gameCanvas")
  .addEventListener("contextmenu", (event) => event.preventDefault(), false);
/** 
window.document
  .getElementById("gameCanvas")
  .addEventListener(
    "touchstart",
    (event) => Input.handleTouchStart(event),
    false,
  );
window.document
  .getElementById("gameCanvas")
  .addEventListener("touchend", (event) => Input.handleTouchEnd(event), false);
  */
