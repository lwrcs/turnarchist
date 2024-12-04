import { Armor } from "./item/armor";
import { Backpack } from "./item/backpack";
import { Candle } from "./item/candle";
import { Coal } from "./item/coal";
import { EntitySpawner } from "./item/entitySpawner";
import { GodStone } from "./item/godStone";
import { Heart } from "./item/heart";
import { Key } from "./item/key";
import { Lantern } from "./item/lantern";
import { Torch } from "./item/torch";
import { WeaponBlood } from "./item/weaponBlood";
import { WeaponPoison } from "./item/weaponPoision";
import { LevelConstants } from "./levelConstants";
import { Dagger } from "./weapon/dagger";
import { DualDagger } from "./weapon/dualdagger";
import { Spear } from "./weapon/spear";
import { Spellbook } from "./weapon/spellbook";
import { Warhammer } from "./weapon/warhammer";

export class GameConstants {
  static readonly VERSION = "v1.0.0"; //"v0.6.3";
  static DEVELOPER_MODE = false;

  static readonly FPS = 120;
  static readonly ALPHA_ENABLED = true;
  static readonly SHADE_LEVELS = 25;

  static readonly TILESIZE = 16;
  static readonly SCALE = 3;

  static readonly SWIPE_THRESH = 25 ** 2; // (size of swipe threshold circle)^2
  static readonly HOLD_THRESH = 250; // milliseconds

  static readonly KEY_REPEAT_TIME = 250; // millseconds
  static readonly MOVEMENT_COOLDOWN = 100; // milliseconds

  static readonly CHAT_APPEAR_TIME = 5000;
  static readonly CHAT_FADE_TIME = 1000;
  static ANIMATION_SPEED = 1;

  static readonly DEFAULTWIDTH = 6 * GameConstants.TILESIZE;
  static readonly DEFAULTHEIGHT = 12 * GameConstants.TILESIZE;
  static WIDTH = LevelConstants.SCREEN_W * GameConstants.TILESIZE;
  static HEIGHT = LevelConstants.SCREEN_H * GameConstants.TILESIZE;
  static scrolling = true;

  static readonly SCRIPT_FONT_SIZE = 16;
  static readonly FONT_SIZE = 7;
  static readonly BIG_FONT_SIZE = 15;

  static readonly RED = "#ac3232";
  static readonly WARNING_RED = "#ff0000";
  static readonly GREEN = "#6abe30";
  static readonly ARMOR_GREY = "#9badb7";
  static readonly OUTLINE = "#222034";
  static readonly HIT_ENEMY_TEXT_COLOR = "#76428a";
  static readonly HEALTH_BUFF_COLOR = "#d77bba";
  static readonly MISS_COLOR = "#639bff";

  static readonly STARTING_INVENTORY = [Dagger, Candle];
  static readonly STARTING_DEV_INVENTORY = [
    Dagger,
    DualDagger,
    WeaponPoison,
    WeaponBlood,
    EntitySpawner,
    Candle,
    GodStone,
    Warhammer,
    Spear,
    Spellbook,
    Armor,
    Heart,
    Backpack,
    Torch,
    Lantern,
    Coal,
  ];
}
