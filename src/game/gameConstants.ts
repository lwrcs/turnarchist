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
import { Shotgun } from "../item/weapon/shotgun";
import { Scythe } from "../item/weapon/scythe";
import { Hourglass } from "../item/usable/hourglass";
import { GoldOre } from "../item/resource/goldOre";
import { Sword } from "../item/weapon/sword";
import { Apple } from "../item/usable/apple";
import { WebGLBlurRenderer } from "../gui/webglBlurRenderer";
import { ScytheBlade } from "../item/weapon/scytheBlade";
import { ScytheHandle } from "../item/weapon/scytheHandle";
import { OrangeGem } from "../item/resource/orangegem";
import { GoldRing } from "../item/jewelry/goldRing";
import { FishingRod } from "../item/tool/fishingRod";
import { Coin } from "../item/coin";
import { Fish } from "../item/usable/fish";
import { IronOre } from "../item/resource/ironOre";
import { GarnetRing } from "../item/jewelry/garnetRing";
import { WoodenShield } from "../item/woodenShield";

export class GameConstants {
  static readonly VERSION = "Alpha v0.3.0"; //"v0.6.3";
  static DEVELOPER_MODE = false;
  static isMobile = false;
  static isIOS = false;
  static MOBILE_KEYBOARD_SUPPORT = false;
  static CAMERA_SPEED = 1; // 1 is instant 0.1 is slow
  static SAVING_ENABLED = false;

  static readonly FPS = 120;
  static readonly ALPHA_ENABLED = true;
  static SHADE_LEVELS = 50; //25
  static ENTITY_SHADE_LEVELS = 40; //10

  static readonly TILESIZE = 16;
  static SCALE = null;
  static SOFT_SCALE = 6;
  static readonly MAX_SCALE = 16;
  static readonly MIN_SCALE = 1;
  static smoothScaling = false;

  static readonly SWIPE_THRESH = 25 ** 2; // (size of swipe threshold circle)^2
  static readonly HOLD_THRESH = 250; // milliseconds

  static KEY_REPEAT_TIME = 250; // millseconds
  static SWIPE_HOLD_REPEAT_TIME = 200;
  static SWIPE_HOLD_INITIAL_DELAY = 10;
  static MOVEMENT_COOLDOWN = 50; // milliseconds
  static MOVEMENT_QUEUE_COOLDOWN = 25; // milliseconds
  static readonly MOVE_WITH_MOUSE = true;
  static SLOW_INPUTS_NEAR_ENEMIES = false;
  static SCREEN_SHAKE_ENABLED = true;

  static readonly CHAT_APPEAR_TIME = 1000;
  static readonly CHAT_FADE_TIME = 2000;
  static ANIMATION_SPEED = 1;
  static readonly REPLAY_STEP_MS = 10; // base time between replayed inputs
  static readonly REPLAY_COMPUTER_TURN_DELAY = 10; // extra wait after computer turn completes during replay
  static REPLAY_DEBUG = false; // enable verbose replay logging

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
  static readonly XP_POPUP_ENABLED = true;

  static readonly COIN_ANIMATION = true;
  static readonly COIN_AUTO_PICKUP = true;
  static readonly ITEM_AUTO_PICKUP = true;

  static readonly AUTO_PICKUP_ITEMS = [
    Coal,
    GoldOre,
    IronOre,
    RedGem,
    BlueGem,
    GreenGem,
    OrangeGem,
    Coin,
    Fish,
  ];

  static readonly PERSISTENT_HEALTH_BAR = false; //not implemented

  static HOVER_TEXT_ENABLED = true;
  static readonly INVENTORY_HOVER_TEXT_ENABLED = true;
  static readonly IN_GAME_HOVER_TEXT_ENABLED = false;
  static readonly VENDING_MACHINE_HOVER_TEXT_ENABLED = true;
  static readonly HOVER_TEXT_FOLLOWS_MOUSE = true;
  static readonly INVENTORY_HOVER_TEXT_FOLLOWS_MOUSE = true;
  static readonly IN_GAME_HOVER_TEXT_FOLLOWS_MOUSE = true;
  static readonly VENDING_MACHINE_HOVER_TEXT_FOLLOWS_MOUSE = true;

  static CUSTOM_SHADER_COLOR_ENABLED = false;
  static get SHADE_ENABLED() {
    return GameConstants.SMOOTH_LIGHTING;
  }
  static COLOR_LAYER_COMPOSITE_OPERATION = "soft-light"; //"soft-light";
  static SHADE_LAYER_COMPOSITE_OPERATION = "source-over"; //"soft-light";
  // When true, draw shade as sliced tiles inline within drawEntities instead of a single layer
  static SHADE_INLINE_IN_ENTITY_LAYER = true;
  static USE_OPTIMIZED_SHADING = false;
  static SMOOTH_LIGHTING = false;
  static ctxBlurEnabled = true;
  static BLUR_ENABLED = true;
  static USE_WEBGL_BLUR = false;
  static HIGH_QUALITY_BLUR = false; // true = 49 samples, false = 13 samples for performance
  static BLUR_DOWNSAMPLE_FACTOR = 8; // Blur at 1/4 size for performance (1 = full size, 4 = quarter size)
  static ENEMIES_BLOCK_LIGHT = true;

  static USE_PNG_LEVELS = true;

  static readonly SHADE_LAYER_COMPOSITE_OPERATIONS = [
    "source-over",
    "screen",
    "multiply",
    "overlay",
    "darken",
    "lighten",
  ];

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
    back: boolean = false,
  ) => {
    const currentIndex = GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS.indexOf(
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATION,
    );
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

    GameConstants.COLOR_LAYER_COMPOSITE_OPERATION =
      GameConstants.COLOR_LAYER_COMPOSITE_OPERATIONS[nextIndex];

    console.log(
      `Color layer composite operation set to ${GameConstants.COLOR_LAYER_COMPOSITE_OPERATION}`,
    );
  };

  static readonly SET_SHADE_LAYER_COMPOSITE_OPERATION = (
    back: boolean = false,
  ) => {
    const currentIndex = GameConstants.SHADE_LAYER_COMPOSITE_OPERATIONS.indexOf(
      GameConstants.SHADE_LAYER_COMPOSITE_OPERATION,
    );
    let nextIndex;

    if (back) {
      // Decrement the index to move backward in the operations array
      nextIndex =
        (currentIndex -
          1 +
          GameConstants.SHADE_LAYER_COMPOSITE_OPERATIONS.length) %
        GameConstants.SHADE_LAYER_COMPOSITE_OPERATIONS.length;
    } else {
      // Increment the index to move forward in the operations array
      nextIndex =
        (currentIndex + 1) %
        GameConstants.SHADE_LAYER_COMPOSITE_OPERATIONS.length;
    }

    GameConstants.SHADE_LAYER_COMPOSITE_OPERATION =
      GameConstants.SHADE_LAYER_COMPOSITE_OPERATIONS[nextIndex];

    console.log(
      `Shade layer composite operation set to ${GameConstants.SHADE_LAYER_COMPOSITE_OPERATION}`,
    );
  };

  static readonly TOGGLE_USE_OPTIMIZED_SHADING = () => {
    GameConstants.USE_OPTIMIZED_SHADING = !GameConstants.USE_OPTIMIZED_SHADING;
  };

  static readonly TOGGLE_ENEMIES_BLOCK_LIGHT = () => {
    GameConstants.ENEMIES_BLOCK_LIGHT = !GameConstants.ENEMIES_BLOCK_LIGHT;
  };

  static readonly TOGGLE_USE_WEBGL_BLUR = () => {
    GameConstants.USE_WEBGL_BLUR = !GameConstants.USE_WEBGL_BLUR;
    console.log(
      `WebGL blur is now ${GameConstants.USE_WEBGL_BLUR ? "enabled" : "disabled"}`,
    );
  };

  static readonly TOGGLE_HIGH_QUALITY_BLUR = () => {
    GameConstants.HIGH_QUALITY_BLUR = !GameConstants.HIGH_QUALITY_BLUR;
    console.log(
      `High quality blur: ${GameConstants.HIGH_QUALITY_BLUR ? "ON (49 samples)" : "OFF (13 samples)"}`,
    );
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
    Torch,
    Sword,
    Spear,
    GodStone,
    Spellbook,
    FishingRod,
    Armor,
    Backpack,
    Hammer,
    Spellbook,
    WoodenShield,
    BlueGem,
    OrangeGem,
    RedGem,
    GarnetRing,
    BombItem,
    BombItem,
    BombItem,
    IronOre,
    GoldOre,
    GoldOre,
    GoldOre,
    GoldOre,
    GoldOre,
    GoldOre,
    GoldOre,
  ];
}
