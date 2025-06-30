import { Armor } from "../item/armor";
import { Backpack } from "../item/backpack";
import { Candle } from "../item/light/candle";
import { Coal } from "../item/resource/coal";
import { EntitySpawner } from "../item/entitySpawner";
import { GodStone } from "../item/godStone";
import { Heart } from "../item/usable/heart";
import { Key } from "../item/key";
import { Lantern } from "../item/light/lantern";
import { Torch } from "../item/light/torch";
import { WeaponBlood } from "../item/usable/weaponBlood";
import { WeaponFragments } from "../item/usable/weaponFragments";
import { WeaponPoison } from "../item/usable/weaponPoison";
import { LevelConstants } from "../level/levelConstants";
import { Dagger } from "../item/weapon/dagger";
import { DualDagger } from "../item/weapon/dualdagger";
import { Spear } from "../item/weapon/spear";
import { Spellbook } from "../item/weapon/spellbook";
import { Warhammer } from "../item/weapon/warhammer";
import { Hammer } from "../item/tool/hammer";
import { SpellbookPage } from "../item/usable/spellbookPage";
import { BombItem } from "../item/bombItem";
import { BestiaryBook } from "../item/bestiaryBook";
import { Greataxe } from "../item/weapon/greataxe";
import { BlueGem } from "../item/resource/bluegem";
import { RedGem } from "../item/resource/redgem";
import { GreenGem } from "../item/resource/greengem";
import { Pickaxe } from "../item/tool/pickaxe";
import { Geode } from "../item/resource/geode";
import { GlowBugs } from "../item/light/glowBugs";

export class GameConstants {
  static readonly VERSION = "v1.0.9"; //"v0.6.3";
  static DEVELOPER_MODE = false;
  static isMobile = false;
  static isIOS = false;
  static CAMERA_SPEED = 1; // 1 is instant 0.1 is slow

  static readonly FPS = 120;
  static readonly ALPHA_ENABLED = true;
  static SHADE_LEVELS = 50; //25
  static ENTITY_SHADE_LEVELS = 25; //10

  static readonly TILESIZE = 16;
  static SCALE = null;
  static SOFT_SCALE = 6;
  static readonly MAX_SCALE = 16;
  static readonly MIN_SCALE = 1;
  static smoothScaling = false;

  static readonly SWIPE_THRESH = 25 ** 2; // (size of swipe threshold circle)^2
  static readonly HOLD_THRESH = 250; // milliseconds

  static KEY_REPEAT_TIME = 300; // millseconds
  static SWIPE_HOLD_REPEAT_TIME = 300;
  static SWIPE_HOLD_INITIAL_DELAY = 150;
  static MOVEMENT_COOLDOWN = 200; // milliseconds
  static MOVEMENT_QUEUE_COOLDOWN = 100; // milliseconds
  static readonly MOVE_WITH_MOUSE = true;

  static readonly CHAT_APPEAR_TIME = 2500;
  static readonly CHAT_FADE_TIME = 500;
  static ANIMATION_SPEED = 1;

  static readonly DEFAULTWIDTH = GameConstants.TILESIZE;
  static readonly DEFAULTHEIGHT = GameConstants.TILESIZE;
  static WIDTH = LevelConstants.SCREEN_W * GameConstants.TILESIZE;
  static HEIGHT = LevelConstants.SCREEN_H * GameConstants.TILESIZE;

  static drawOtherRooms = true;

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

  static CUSTOM_SHADER_COLOR_ENABLED = false;

  static COLOR_LAYER_COMPOSITE_OPERATION = "soft-light"; //"soft-light";
  static SHADE_LAYER_COMPOSITE_OPERATION = "screen"; //"soft-light";
  static USE_OPTIMIZED_SHADING = false;
  static SMOOTH_LIGHTING = false;
  static ctxBlurEnabled = true;
  static BLUR_ENABLED = true;
  static ENEMIES_BLOCK_LIGHT = false;

  static readonly COLOR_LAYER_COMPOSITE_OPERATIONS = [
    "soft-light",
    //"addition",
    //"darken",
    "overlay",
    //"hue",
    //"source-over",
    //"screen",
    "multiply",
    //"difference",
    //"exclusion",
    //"luminosity",
    //"color-dodge",
    //"color-burn",
    //"hard-light",
    //"soft-light",
    //"lighten",
  ];

  static readonly SET_COLOR_LAYER_COMPOSITE_OPERATION = (
    shade?: boolean,
    back: boolean = false,
  ) => {
    let operation = shade
      ? GameConstants.SHADE_LAYER_COMPOSITE_OPERATION
      : GameConstants.COLOR_LAYER_COMPOSITE_OPERATION;
    const currentIndex =
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS.indexOf(operation);
    let nextIndex;

    if (back) {
      // Decrement the index to move backward in the operations array
      nextIndex =
        (currentIndex -
          1 +
          GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS.length) %
        GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS.length;
    } else {
      // Increment the index to move forward in the operations array
      nextIndex =
        (currentIndex + 1) %
        GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS.length;
    }

    operation = GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS[nextIndex];

    if (shade) {
      GameConstants.SHADE_LAYER_COMPOSITE_OPERATION = operation;
    } else {
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATION = operation;
    }

    console.log(`Color layer composite operation set to ${operation}`);
  };

  static readonly TOGGLE_USE_OPTIMIZED_SHADING = () => {
    GameConstants.USE_OPTIMIZED_SHADING = !GameConstants.USE_OPTIMIZED_SHADING;
  };

  static readonly TOGGLE_ENEMIES_BLOCK_LIGHT = () => {
    GameConstants.ENEMIES_BLOCK_LIGHT = !GameConstants.ENEMIES_BLOCK_LIGHT;
  };

  static readonly SET_SCALE = () => {
    GameConstants.SCALE++;
    if (GameConstants.SCALE > GameConstants.MAX_SCALE) {
      GameConstants.SCALE = GameConstants.MAX_SCALE;
    }
  };

  static readonly INCREASE_SCALE = () => {
    if (GameConstants.SCALE < GameConstants.MAX_SCALE) {
      GameConstants.SCALE++;
      if (GameConstants.SCALE > GameConstants.MAX_SCALE) {
        GameConstants.SCALE = GameConstants.MAX_SCALE;
      }
    }
  };

  static readonly DECREASE_SCALE = () => {
    if (GameConstants.SCALE > GameConstants.MIN_SCALE) {
      GameConstants.SCALE--;
      if (GameConstants.SCALE < GameConstants.MIN_SCALE) {
        GameConstants.SCALE = GameConstants.MIN_SCALE;
      }
    }
  };

  static readonly FIND_SCALE = (isMobile: boolean) => {
    let bestScale = GameConstants.MIN_SCALE;
    let bestDifference = Infinity;
    const measure =
      !isMobile || screen.orientation.type === "landscape-primary"
        ? window.innerHeight
        : window.innerWidth;
    const dimension = measure * window.devicePixelRatio;
    const tileMeasure = isMobile ? 8 : 12;

    for (let i = GameConstants.MIN_SCALE; i <= GameConstants.MAX_SCALE; i++) {
      const tiles = dimension / (i * GameConstants.TILESIZE);
      const difference = Math.abs(tiles - tileMeasure);

      if (difference < bestDifference) {
        bestDifference = difference;
        bestScale = i;
      }
    }

    return bestScale;
  };

  static readonly STARTING_INVENTORY = [Dagger, Candle];
  static readonly STARTING_DEV_INVENTORY = [
    Dagger,
    Candle,
    Torch,
    Lantern,
    GodStone,
    Spear,
    WeaponPoison,
    WeaponBlood,
    Armor,
    Backpack,
    Hammer,
    Pickaxe,
    Coal,
    Geode,
    Geode,
    Geode,

    WeaponFragments,
    WeaponFragments,
    WeaponFragments,
  ];
}
