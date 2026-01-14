import { GameConstants } from "./gameConstants";
import { Game } from "../game";
import { MouseCursor } from "../gui/mouseCursor";
import { Direction } from "../game";

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
  F,
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
  fListener: function () {},
  wheelListener: function (deltaY: number) {},
  mouseLeftClickListeners: [],
  mouseRightClickListeners: [],
  mouseMoveListeners: [],
  mouseDownListeners: [],
  mouseUpListeners: [],

  touchStartListeners: [],
  touchEndListeners: [],
  touchMoveListeners: [],

  mouseX: 0,
  mouseY: 0,
  mouseDown: false,

  lastPressTime: 0,
  lastPressKey: "",

  // Add mouse repeat tracking
  lastMouseDownTime: 0,
  lastMouseDownX: 0,
  lastMouseDownY: 0,
  mouseDownHandled: false,
  // Tracks whether a registered hold action actually fired (e.g. inventory drag).
  // This lets us emulate mobile right-click without being blocked by the generic hold timer.
  holdCallbackFired: false,

  // Touch gesture state
  touchStartedInUI: false,
  touchDragging: false,
  touchLongPressFired: false,
  touchLongPressTimerId: null as ReturnType<typeof setTimeout> | null,
  // Many browsers (and devtools emulation) generate synthetic mouse events after touch.
  // Track touch activity so we can suppress those mouse events and avoid double-processing taps.
  lastTouchEventTimeMs: 0,
  debugTouch: false,

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
  F: "KeyF",

  rawMouseX: 0,
  rawMouseY: 0,

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
      case Input.F:
        Input.fListener();
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

  touchStartListener: function (x: number, y: number) {
    let inUI = false;
    for (let i = 0; i < Input.touchStartListeners.length; i++) {
      try {
        const res = Input.touchStartListeners[i](x, y);
        if (res === true) inUI = true;
      } catch {}
    }
    Input.touchStartedInUI = inUI;
  },

  touchMoveListener: function (x: number, y: number) {
    for (let i = 0; i < Input.touchMoveListeners.length; i++) {
      try {
        Input.touchMoveListeners[i](x, y);
      } catch {}
    }
  },

  touchEndListener: function (x: number, y: number) {
    for (let i = 0; i < Input.touchEndListeners.length; i++) {
      try {
        Input.touchEndListeners[i](x, y);
      } catch {}
    }
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

      console.log(
        `Input.mouseClickListener: raw x: ${x}, y: ${y}, scale: ${Game.scale}, scaledX: ${scaledX}, scaledY: ${scaledY}`,
      );

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

    // Store raw coordinates
    Input.rawMouseX = x;
    Input.rawMouseY = y;

    // Calculate scaled coordinates
    Input.mouseX = Math.floor(x / Game.scale);
    Input.mouseY = Math.floor(y / Game.scale);

    Input.mouseMoveListener(Input.mouseX, Input.mouseY);
  },

  recalculateMousePosition: function () {
    if (Input.rawMouseX !== undefined && Input.rawMouseY !== undefined) {
      Input.mouseX = Math.floor(Input.rawMouseX / Game.scale);
      Input.mouseY = Math.floor(Input.rawMouseY / Game.scale);

      // Also recalculate click animation position
      MouseCursor.getInstance().recalculateClickPosition();
    }
  },

  handleMouseDown: function (event: MouseEvent) {
    // Suppress synthetic mouse events generated immediately after touch interactions.
    if (Date.now() - Input.lastTouchEventTimeMs < 800) {
      if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
        console.log("[Input] suppress mouseDown after touch", {
          button: event.button,
          x: Input.mouseX,
          y: Input.mouseY,
          dtMs: Date.now() - Input.lastTouchEventTimeMs,
        });
      }
      return;
    }
    if (Input.mouseDown) return; // Prevent multiple triggers
    MouseCursor.getInstance().startClickAnim();
    Input.mouseDown = true;
    Input.mouseDownStartTime = Date.now();
    Input.isMouseHold = false;
    Input.holdCallbackFired = false;
    Input.mouseDownListener(Input.mouseX, Input.mouseY, event.button);

    // Start checking for hold
    if (!Input._holdCheckInterval) {
      Input._holdCheckInterval = setInterval(Input.checkIsMouseHold, 16); // Check every frame
    }
  },

  handleMouseUp: function (event: MouseEvent) {
    // Suppress synthetic mouse events generated immediately after touch interactions.
    if (Date.now() - Input.lastTouchEventTimeMs < 800) {
      if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
        console.log("[Input] suppress mouseUp after touch", {
          button: event.button,
          x: Input.mouseX,
          y: Input.mouseY,
          dtMs: Date.now() - Input.lastTouchEventTimeMs,
        });
      }
      return;
    }
    Input.mouseDown = false;
    Input.mouseDownStartTime = null;
    Input.mouseUpListener(Input.mouseX, Input.mouseY, event.button);

    // Reset mouse repeat tracking
    Input.lastMouseDownTime = 0;
    Input.mouseDownHandled = false;

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
          Input.holdCallbackFired = true;
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
    Input.lastTouchEventTimeMs = Date.now();

    const firstTouch = Input.getTouches(evt)[0];
    Input.xDown = firstTouch.clientX;
    Input.yDown = firstTouch.clientY;
    Input.currentX = firstTouch.clientX;
    Input.currentY = firstTouch.clientY;

    Input.tapStartTime = Date.now();
    Input.touchDragging = false;
    Input.touchLongPressFired = false;
    Input.touchStartedInUI = false;
    if (Input.touchLongPressTimerId) {
      clearTimeout(Input.touchLongPressTimerId);
      Input.touchLongPressTimerId = null;
    }

    Input.updateMousePos({
      clientX: Input.currentX,
      clientY: Input.currentY,
    } as MouseEvent);

    Input.swiped = false;

    // Allow UI systems to prep (e.g. inventory drag candidate) without committing an action yet.
    // Default tap actions are processed on touch end.
    Input.touchStartListener(Input.mouseX, Input.mouseY);
    if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
      console.log("[Input] touchStart", {
        raw: { x: Input.currentX, y: Input.currentY },
        scaled: { x: Input.mouseX, y: Input.mouseY },
        touchStartedInUI: Input.touchStartedInUI,
      });
    }

    // Start long-press timer for right-click/context menu.
    const LONG_PRESS_MS = 450;
    Input.touchLongPressTimerId = setTimeout(() => {
      if (Input.touchDragging || Input.swiped) return;
      Input.touchLongPressFired = true;
      if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
        console.log("[Input] longPress fired -> RIGHT_CLICK", {
          scaled: { x: Input.mouseX, y: Input.mouseY },
          touchStartedInUI: Input.touchStartedInUI,
        });
      }
      Input.mouseRightClickListener(Input.mouseX, Input.mouseY);
    }, LONG_PRESS_MS);
  },

  handleTouchMove: function (evt) {
    evt.preventDefault();
    Input.lastTouchEventTimeMs = Date.now();

    Input.currentX = evt.touches[0].clientX;
    Input.currentY = evt.touches[0].clientY;

    Input.updateMousePos({
      clientX: Input.currentX,
      clientY: Input.currentY,
    } as MouseEvent);

    Input.touchMoveListener(Input.mouseX, Input.mouseY);

    if (Input.swiped) return;

    var xDiff = Input.xDown - Input.currentX;
    var yDiff = Input.yDown - Input.currentY;

    // Any meaningful movement cancels a pending long press (right click requires staying put).
    const MOVE_CANCEL_PX = 8;
    if (Input.touchLongPressTimerId) {
      if (xDiff ** 2 + yDiff ** 2 >= MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        clearTimeout(Input.touchLongPressTimerId);
        Input.touchLongPressTimerId = null;
        if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
          console.log("[Input] cancel longPress due to movement", {
            movedPx: Math.sqrt(xDiff ** 2 + yDiff ** 2),
            touchStartedInUI: Input.touchStartedInUI,
          });
        }
      }
    }

    // If the finger has moved significantly, cancel long press and consider it a drag gesture
    // (primarily for UI dragging). Do not enter drag mode for minor jitter.
    const DRAG_CANCEL_PX = 14;
    if (
      !Input.touchDragging &&
      Input.touchStartedInUI &&
      xDiff ** 2 + yDiff ** 2 >= DRAG_CANCEL_PX * DRAG_CANCEL_PX
    ) {
      Input.touchDragging = true;
      if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
        console.log("[Input] touch entered drag mode", {
          movedPx: Math.sqrt(xDiff ** 2 + yDiff ** 2),
        });
      }
    }

    // If a touch started in UI, do not treat it as a world swipe gesture.
    // UI (inventory/bestiary/etc) owns the gesture and can implement its own behavior.
    if (Input.touchStartedInUI) return;

    // Check if we've swiped
    if (xDiff ** 2 + yDiff ** 2 >= GameConstants.SWIPE_THRESH) {
      // Any real swipe cancels long press.
      if (Input.touchLongPressTimerId) {
        clearTimeout(Input.touchLongPressTimerId);
        Input.touchLongPressTimerId = null;
      }
      if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
        console.log("[Input] swipe detected (movement)", {
          movedPx: Math.sqrt(xDiff ** 2 + yDiff ** 2),
        });
      }
      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
          Input.leftSwipeListener();
          Input.lastSwipeDirection = Direction.LEFT;
        } else {
          Input.rightSwipeListener();
          Input.lastSwipeDirection = Direction.RIGHT;
        }
        Input.swiped = true;
        Input.lastSwipeTime = Date.now();
        Input.swipeHoldActive = true;
        Input.swipeHoldRepeating = false; // Start in non-repeating state
      } else {
        if (yDiff > 0) {
          Input.upSwipeListener();
          Input.lastSwipeDirection = Direction.UP;
        } else {
          Input.downSwipeListener();
          Input.lastSwipeDirection = Direction.DOWN;
        }
        Input.swiped = true;
        Input.lastSwipeTime = Date.now();
        Input.swipeHoldActive = true;
        Input.swipeHoldRepeating = false; // Start in non-repeating state
      }
    }
  },

  handleTouchEnd: function (evt: TouchEvent) {
    evt.preventDefault();
    Input.lastTouchEventTimeMs = Date.now();

    // Update mouse position from the final touch location so UI taps use release coords.
    try {
      const t = (evt.changedTouches && evt.changedTouches[0]) || null;
      if (t) {
        Input.currentX = t.clientX;
        Input.currentY = t.clientY;
        Input.updateMousePos({
          clientX: Input.currentX,
          clientY: Input.currentY,
        } as MouseEvent);
      }
    } catch {}

    if (Input.touchLongPressTimerId) {
      clearTimeout(Input.touchLongPressTimerId);
      Input.touchLongPressTimerId = null;
    }

    // Touch "tap" actions are executed on release, but some code paths (notably `handleTap`)
    // treat `mouseDownHandled` as "already consumed by mousedown". Since touch no longer
    // drives the mouseDown pipeline, ensure we clear these flags so taps can take effect.
    Input.lastMouseDownTime = 0;
    Input.mouseDownHandled = false;

    // Let UI systems finalize (e.g. inventory drop) before deciding tap action.
    Input.touchEndListener(Input.mouseX, Input.mouseY);

    const shouldTap =
      !Input.touchLongPressFired && !Input.swiped && !Input.touchDragging;
    if (GameConstants.DEVELOPER_MODE && Input.debugTouch) {
      console.log("[Input] touchEnd", {
        scaled: { x: Input.mouseX, y: Input.mouseY },
        touchStartedInUI: Input.touchStartedInUI,
        touchDragging: Input.touchDragging,
        swiped: Input.swiped,
        touchLongPressFired: Input.touchLongPressFired,
        shouldTap,
      });
    }

    // If the long press already opened a context menu, don't also perform the default action.
    if (shouldTap) {
      Input.tapListener();
    }
    Input.isTapHold = false;
    Input.tapStartTime = null;

    // Reset swipe hold tracking
    Input.swipeHoldActive = false;
    Input.swipeHoldRepeating = false;
    Input.lastSwipeTime = 0;
    Input.lastSwipeDirection = null;

    // Reset gesture state
    Input.touchDragging = false;
    Input.touchLongPressFired = false;
    Input.touchStartedInUI = false;
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

  // Swipe hold tracking
  lastSwipeTime: 0,
  lastSwipeDirection: null as Direction | null,
  swipeHoldActive: false,
  swipeHoldRepeating: false, // Track if we're in repeat mode yet
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
window.document.getElementById("gameCanvas").addEventListener(
  "contextmenu",
  (event) => {
    // Use contextmenu as our canonical desktop right-click signal (click does not always fire for button=2).
    event.preventDefault();

    // Update mouse position from this event (same scaling logic as mousemove).
    const canvas = window.document.getElementById("gameCanvas");
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    Input.rawMouseX = x;
    Input.rawMouseY = y;
    Input.mouseX = Math.floor(x / Game.scale);
    Input.mouseY = Math.floor(y / Game.scale);

    Input.mouseRightClickListener(Input.mouseX, Input.mouseY);
  },
  false,
);
window.document.getElementById("gameCanvas").addEventListener(
  "wheel",
  (event) => {
    (event as WheelEvent).preventDefault();
    Input.wheelListener((event as WheelEvent).deltaY);
  },
  { passive: false } as any,
);
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
