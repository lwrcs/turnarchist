import { GameConstants } from "../game/gameConstants";

export class LevelConstants {
  static SCREEN_W = 1;
  static SCREEN_H = 1;

  static readonly COMPUTER_TURN_DELAY = 250; // milliseconds (was 300)
  static readonly TURN_TIME = 3000; // milliseconds
  static readonly LEVEL_TRANSITION_TIME = 300; // milliseconds
  static readonly LEVEL_TRANSITION_TIME_LADDER = 1000; // milliseconds
  static readonly ROOM_COUNT = 50;

  static readonly HEALTH_BAR_FADEIN = 100;
  static readonly HEALTH_BAR_FADEOUT = 350;
  static readonly HEALTH_BAR_TOTALTIME = 2000;

  static readonly SHADED_TILE_CUTOFF = 1;
  static readonly MIN_VISIBILITY = 0; // visibility level of places you've already seen
  static LIGHTING_ANGLE_STEP = 2; // how many degrees between each ray, previously 5
  static get LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION() {
    return LevelConstants.LIGHTING_ANGLE_STEP / 2;
  }
  static LIGHTING_MAX_DISTANCE = 7;
  //static readonly LIGHT_RESOLUTION = 0.1; //1 is default

  static readonly LEVEL_TEXT_COLOR = "yellow";
  static readonly AMBIENT_LIGHT_COLOR: [number, number, number] = [12, 15, 12];
  static readonly TORCH_LIGHT_COLOR: [number, number, number] = [120, 35, 10];
}
