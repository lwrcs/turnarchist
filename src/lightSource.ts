import { Room } from "./room";

export class LightSource {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  constructor(x: number, y: number, r: number, c: [number, number, number] = [255, 130, 5]) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
  }

  static add = (room: Room, lightSource: LightSource) => {
    room.lightSources.push(lightSource);
  }

  static remove = (room: Room, lightSource: LightSource) => {
    room.lightSources = room.lightSources.filter(ls => ls !== lightSource);
  }

  updatePosition = (x: number, y: number) => {
    this.x = x;
    this.y = y;
  }
}
