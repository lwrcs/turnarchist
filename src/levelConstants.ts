import { GameConstants } from "./gameConstants";

export class LevelConstants {
  static SCREEN_W = 1;
  static SCREEN_H = 1;

  static readonly COMPUTER_TURN_DELAY = 300; // milliseconds
  static readonly TURN_TIME = 3000; // milliseconds
  static readonly LEVEL_TRANSITION_TIME = 300; // milliseconds
  static readonly LEVEL_TRANSITION_TIME_LADDER = 1000; // milliseconds
  static readonly ROOM_COUNT = 50;

  static readonly HEALTH_BAR_FADEIN = 100;
  static readonly HEALTH_BAR_FADEOUT = 350;
  static readonly HEALTH_BAR_TOTALTIME = 2000;

  static readonly SHADED_TILE_CUTOFF = 1;
  static SMOOTH_LIGHTING = false; //doesn't work
  static readonly MIN_VISIBILITY = 0; // visibility level of places you've already seen
  static readonly LIGHTING_ANGLE_STEP = 1; // how many degrees between each ray, previously 5
  static readonly LIGHTING_MAX_DISTANCE = 7;
  static readonly LIGHT_RESOLUTION = 1; //1 is default

  static readonly LEVEL_TEXT_COLOR = "yellow";
  static readonly AMBIENT_LIGHT_COLOR: [number, number, number] = [10, 10, 10];
  static readonly TORCH_LIGHT_COLOR: [number, number, number] = [200, 25, 5];
}
