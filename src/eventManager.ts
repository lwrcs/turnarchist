import { EventEmitter } from "./eventEmitter";

export enum GameEvent {
  PLAYER_MOVE = "PLAYER_MOVE",
  ROOM_CHANGE = "ROOM_CHANGE",
  ENTITY_INTERACT = "ENTITY_INTERACT",
  // Add more events as needed
}

export interface PlayerMoveData {
  playerId: string;
  newX: number;
  newY: number;
}

export interface RoomChangeData {
  playerId: string;
  oldRoomId: string;
  newRoomId: string;
}

export interface EntityInteractData {
  playerId: string;
  entityId: string;
}

class EventManager extends EventEmitter {
  // You can add game-specific methods here if needed
}

export const gameEvents = new EventManager();
