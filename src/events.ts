export const EVENTS = {
  KEY_DOWN: "KEY_DOWN",
  KEY_UP: "KEY_UP",
  MOUSE_LEFT_CLICK: "MOUSE_LEFT_CLICK",
  MOUSE_RIGHT_CLICK: "MOUSE_RIGHT_CLICK",
  MOUSE_MOVE: "MOUSE_MOVE",
  TOUCH_START: "TOUCH_START",
  TOUCH_MOVE: "TOUCH_MOVE",
  TOUCH_END: "TOUCH_END",
  TAP: "TAP",
  TAP_HOLD: "TAP_HOLD",
  MOUSE_DOWN: "MOUSE_DOWN",
  MOUSE_UP: "MOUSE_UP",

  // **Additional Custom Events:**
  CHAT_MESSAGE: "ChatMessage",
  ENEMY_SEEN_PLAYER: "EnemySeenPlayer",
  // Add other custom events as needed
} as const;

// **TypeScript Interfaces for Event Payloads:**

export interface MouseClickEvent {
  x: number;
  y: number;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
}

export interface KeyEvent {
  key: string;
}

export interface TouchEventData {
  x: number;
  y: number;
}

export interface ChatMessageEvent {
  message: string;
}

export interface EnemySeenPlayerEvent {
  enemyId: string;
  playerId: string;
  // Add other relevant properties
}

// **Union Type for Events:**
export type AppEvents =
  | typeof EVENTS.KEY_DOWN
  | typeof EVENTS.KEY_UP
  | typeof EVENTS.MOUSE_LEFT_CLICK
  | typeof EVENTS.MOUSE_RIGHT_CLICK
  | typeof EVENTS.MOUSE_MOVE
  | typeof EVENTS.TOUCH_START
  | typeof EVENTS.TOUCH_MOVE
  | typeof EVENTS.TOUCH_END
  | typeof EVENTS.TAP
  | typeof EVENTS.TAP_HOLD
  | typeof EVENTS.MOUSE_DOWN
  | typeof EVENTS.MOUSE_UP
  | typeof EVENTS.CHAT_MESSAGE
  | typeof EVENTS.ENEMY_SEEN_PLAYER;
// | Add other events as needed

// **Type Mapping for Event Payloads:**
export type EventPayloads = {
  [EVENTS.KEY_DOWN]: string; // key identifier
  [EVENTS.KEY_UP]: string;
  [EVENTS.MOUSE_LEFT_CLICK]: MouseClickEvent;
  [EVENTS.MOUSE_RIGHT_CLICK]: MouseClickEvent;
  [EVENTS.MOUSE_MOVE]: MouseMoveEvent;
  [EVENTS.TOUCH_START]: TouchEventData;
  [EVENTS.TOUCH_MOVE]: TouchEventData;
  [EVENTS.TOUCH_END]: TouchEventData;
  [EVENTS.TAP]: MouseClickEvent;
  [EVENTS.TAP_HOLD]: MouseClickEvent;
  [EVENTS.MOUSE_DOWN]: MouseClickEvent;
  [EVENTS.MOUSE_UP]: MouseClickEvent;

  [EVENTS.CHAT_MESSAGE]: ChatMessageEvent;
  [EVENTS.ENEMY_SEEN_PLAYER]: EnemySeenPlayerEvent;
  // | Add other event payloads as needed
};
