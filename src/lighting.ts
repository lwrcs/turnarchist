import { LightSource } from "./lightSource";
import { Room } from "./room";

export class Lighting {
  static momentaryLight = (
    room: Room,
    x: number,
    y: number,
    radius: number,
    color: [number, number, number],
    duration: number,
    brightness: number,
    delay: number
  ) => {
    const lightSource = Lighting.newLightSource(
      x,
      y,
      color,
      radius,
      brightness
    );
    setTimeout(() => {
      Lighting.addLightSource(room, lightSource);
      room.updateLighting();

      setTimeout(() => {
        Lighting.removeLightSource(room, lightSource);

        room.updateLighting();
      }, duration);
    }, delay);
  };

  static newLightSource = (
    x: number,
    y: number,
    color: [number, number, number],
    radius: number,
    brightness: number
  ) => {
    return new LightSource(x, y, radius, color, brightness);
  };

  static addLightSource = (room: Room, lightSource: LightSource) => {
    room.lightSources.push(lightSource);
  };

  static removeLightSource = (room: Room, lightSource: LightSource) => {
    room.lightSources = room.lightSources.filter((ls) => ls !== lightSource);
  };
}
