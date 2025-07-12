import { Door } from "./door";
import { Key } from "../item/key";

export class KeyManager {
  static setKey(door: Door, key: Key) {
    if (door.keyID !== 0) return;
    door.keyID = KeyManager.generateID();
    key.doorID = door.keyID;
  }

  static getKey(door: Door) {
    return door.keyID;
  }

  static checkKey(door: Door, key: Key) {
    if (door.keyID !== key.doorID) return false;
    return true;
  }

  static generateID() {
    return Math.floor(Math.random() * 1000000);
  }
}
