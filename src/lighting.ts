import { LightSource } from "./lightSource";
import { Room } from "./room";

export class Lighting {
  static momentaryLight = (
    room: Room,
    x: number,
    y: number,
    color: [number, number, number],
    duration: number,
    brightness: number
  ) => {
    const lightSource = Lighting.newLightSource(
      x,
      y,
      color,
      duration,
      brightness
    );
    Lighting.addLightSource(room, lightSource);

    setTimeout(() => {
      Lighting.removeLightSource(room, lightSource);
      room.updateLighting();
    }, duration);
  };

  static newLightSource = (
    x: number,
    y: number,
    color: [number, number, number],
    duration: number,
    brightness: number
  ) => {
    return new LightSource(x, y, brightness, color, duration);
  };

  static addLightSource = (room: Room, lightSource: LightSource) => {
    room.lightSources.push(lightSource);
  };

  static removeLightSource = (room: Room, lightSource: LightSource) => {
    room.lightSources = room.lightSources.filter((ls) => ls !== lightSource);
  };
}
