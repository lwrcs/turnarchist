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
import { QuarterStaff } from "../item/weapon/quarterStaff";
import { Slingshot } from "../item/weapon/slingshot";
import { CrossbowBolt } from "../item/weapon/crossbowBolt";
import { Crossbow } from "../item/weapon/crossbow";
import { GlowStick } from "../item/light/glowStick";
import { DivingHelmet } from "../item/divingHelmet";
import { Backplate } from "../item/backplate";
import { Gauntlets } from "../item/gauntlets";
import { ShoulderPlates } from "../item/shoulderPlates";
import { ChestPlate } from "../item/chestPlate";
import { IronBar } from "../item/resource/ironBar";
import { WeaponCurse } from "../item/usable/weaponCurse";

export class GameConstants {
  static readonly VERSION = "Alpha v0.3.1"; //"v0.6.3";
  static DEVELOPER_MODE = false;
  /**
   * Debug mode for stacked z-layer testing. When enabled, the room populator
   * will generate simple "upper floors" (z=1) over inner walls and place
   * z-only stairs to traverse between z=0 and z=1.
   */
  static Z_DEBUG_MODE = false;
  static isMobile = false;
  static isIOS = false;
  static MOBILE_KEYBOARD_SUPPORT = false;
  static CAMERA_SPEED = 1; // 1 is instant 0.1 is slow
  static SAVING_ENABLED = false;

  static readonly FPS = 120;
  static readonly ALPHA_ENABLED = true;
  static SHADE_LEVELS = 50; //25
  static ENTITY_SHADE_LEVELS = 40; //10

  /**
   * Hard cap on the number of cached shaded sprite canvases in `Game.shade_canvases`.
   * Prevents unbounded growth (which can lead to “sprites disappear / screen goes black” failures).
   */
  static SHADE_CANVAS_CACHE_MAX = 12000;
  /**
   * Quantization levels for shadeColor when generating shade cache keys.
   * Lower = fewer unique colors = smaller cache, at the cost of slightly less smooth color tinting.
   */
  static SHADE_COLOR_LEVELS = 16;

  /**
   * Hard cap on cached text canvases in `Game.text_rendering_canvases`.
   */
  static TEXT_CANVAS_CACHE_MAX = 8000;

  /**
   * Debug: poison the shade cache by building cached shaded sprites from a transparent source.
   * This reproduces the "game runs but all sprites disappear" symptom without console errors.
   */
  static DEBUG_POISON_SHADE_CACHE = false;
  /**
   * When DEBUG_POISON_SHADE_CACHE is enabled via command, keep it active for this many frames.
   */
  static DEBUG_POISON_SHADE_CACHE_FRAMES = 0;

  /**
   * Auto-recovery: detect when the shaded sprite cache has been poisoned (all sprites disappear)
   * and clear/rebuild caches automatically.
   */
  static AUTO_RECOVER_POISONED_SHADE_CACHE = true;
  /**
   * Throttle for the auto-recovery canary, in milliseconds.
   */
  static AUTO_RECOVER_POISONED_SHADE_CACHE_INTERVAL_MS = 200;

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
  // When pushing entities, block movement inputs until pushed objects have visually progressed this far (0..1).
  static readonly PUSH_VISUAL_INPUT_UNLOCK_PROGRESS = 0.9;

  /**
   * Draw smoothing factors (exponential decay bases).
   * Higher values => slower animation (takes longer for drawX/drawY to decay to 0).
   */
  static readonly PLAYER_DRAW_MOVE_SPEED = 0.85;
  // Push moves use an "ease-in" profile: start slow (base close to 1) then accelerate (base decreases).
  static readonly PLAYER_PUSH_DRAW_MOVE_SPEED_START = 0.95;
  static readonly PLAYER_PUSH_DRAW_MOVE_SPEED_END = 0.87;
  static readonly ENTITY_PUSH_DRAW_MOVE_SPEED_START = 0.97;
  static readonly ENTITY_PUSH_DRAW_MOVE_SPEED_END = 0.9;
  static SLOW_INPUTS_NEAR_ENEMIES = false;
  static SCREEN_SHAKE_ENABLED = true;

  static readonly CHAT_APPEAR_TIME = 1000;
  static readonly CHAT_FADE_TIME = 2000;
  // Center-screen alert system
  static readonly ALERT_HOLD_TIME = 1000; // ms fully visible
  static readonly ALERT_FADE_TIME = 600; // ms fade-out
  static readonly ALERT_MAX_WIDTH_RATIO = 0.8; // of canvas width
  static readonly ALERT_TEXT_COLOR = "white";
  static readonly ALERT_OUTLINE_COLOR = "black";
  // When replacing an active alert, fade the old one while floating up
  static readonly ALERT_REPLACE_FLOAT_TIME = 600; // ms
  static readonly ALERT_REPLACE_FLOAT_PX = 12; // pixels to float up over time
  // Pointer defaults
  static readonly POINTER_MAX_WIDTH_RATIO = 0.6;
  static readonly POINTER_TEXT_COLOR = "white";
  static readonly POINTER_OUTLINE_COLOR = "black";
  static readonly POINTER_ARROW_COLOR = "white";
  static readonly POINTER_ARROW_SIZE = 4; // px
  static readonly POINTER_BOB_PX = 1; // px
  static readonly POINTER_BOB_PERIOD_MS = 1200; // ms
  static readonly POINTER_FADE_TIME = 500; // ms fade-out for dismissed pointers
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
  static readonly OUTLINE_SHIELD_COLOR = "#7642ff";
  static readonly OUTLINE_BUFF_COLOR = "cyan";
  static readonly PLAYER_SHIELD_COLOR = "#5b6ee1";
  static readonly PLAYER_DAMAGE_BUFF_COLOR = "#ff0000";
  // Map toggle - when false, skip all minimap calculations unless map is open
  static MAP_ENABLED = true;

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
  static NARROWED_LIGHTING_FOV = true;

  static readonly DEFAULT_LIGHTING_FOV_DEGREES = 360;
  static readonly UNDERWATER_LIGHTING_FOV_DEGREES = 120;

  static CUSTOM_SHADER_COLOR_ENABLED = false;
  static get SHADE_ENABLED() {
    return GameConstants.SMOOTH_LIGHTING;
  }
  static COLOR_LAYER_COMPOSITE_OPERATION = "soft-light"; //"soft-light";
  static SHADE_LAYER_COMPOSITE_OPERATION = "source-over"; //"soft-light";
  // When true, draw shade as sliced tiles inline within drawEntities instead of a single layer
  static SHADE_INLINE_IN_ENTITY_LAYER = true;
  /**
   * Cache the *result* of fade-tile masking for inline shade slicing.
   * Fade tiles (doors / below-door walls) are expensive because they require destination-in compositing.
   * This cache only stays valid while `Room.lastLightingUpdate` is unchanged.
   */
  static INLINE_SHADE_FADE_TILE_CACHE = true;
  /**
   * Max cached fade tiles per room (FIFO eviction). Each entry is a TILESIZE x TILESIZE canvas.
   */
  static INLINE_SHADE_FADE_TILE_CACHE_MAX = 128;
  static USE_OPTIMIZED_SHADING = false;
  static SMOOTH_LIGHTING = true;
  // Diagnostics / repro toggles (off by default)
  /**
   * If true, skip shadeOpacity quantization in `Game.drawHelper`.
   * This will rapidly increase `Game.shade_canvases` size if shadeOpacity varies continuously.
   */
  static DEBUG_DISABLE_SHADE_CACHE_QUANTIZATION = false;
  /**
   * If true, do not clear global canvas caches in `Room.exitLevel()`.
   * Useful to test cache accumulation vs. per-room canvas memory.
   */
  static DEBUG_PRESERVE_GLOBAL_CANVAS_CACHES = false;
  /**
   * If true, periodically logs cache stats to the console.
   */
  static DEBUG_LOG_CANVAS_CACHE_STATS = false;
  /**
   * If true, forces `Game.shade_canvases` growth by salting the cache key so entries
   * cannot be reused. Use with caution: this can explode memory quickly.
   */
  static DEBUG_FORCE_SHADE_CACHE_GROWTH = false;
  /**
   * Controls how often we salt the shade cache key. Lower = more aggressive growth.
   * Example: 1 salts every `drawHelper` call; 10 salts ~every 10 calls.
   */
  static DEBUG_FORCE_SHADE_CACHE_GROWTH_STRIDE = 1;
  /**
   * If true, forces WebGL blur result canvas cache growth by salting the cache key in
   * `WebGLBlurRenderer.getCachedCanvas()`. This can quickly increase memory usage.
   */
  static DEBUG_FORCE_WEBGL_BLUR_CACHE_GROWTH = false;
  /**
   * Controls how often we salt the WebGL blur result canvas cache key. Lower = more aggressive growth.
   */
  static DEBUG_FORCE_WEBGL_BLUR_CACHE_GROWTH_STRIDE = 1;
  /**
   * Max size for WebGL blur result canvas cache. Higher can reproduce memory pressure faster.
   */
  static DEBUG_WEBGL_BLUR_RESULT_CACHE_MAX_SIZE = 10;
  /**
   * Default extra padding (in tiles) for per-room offscreen canvases:
   * `colorOffscreenCanvas`, `shadeOffscreenCanvas`, `bloomOffscreenCanvas`.
   * Increasing this makes memory pressure happen sooner (useful for repro).
   */
  static DEBUG_ROOM_OFFSCREEN_PAD_TILES = 10;
  /**
   * If true, periodically reallocate the Canvas2D shade blur temp canvas used by
   * inline sliced shading (when WebGL blur is off). Useful to reproduce canvas/memory bugs.
   */
  static DEBUG_THRASH_SHADE_BLUR_TEMP_CANVAS = false;
  /**
   * Controls how often we reallocate the shade blur temp canvas when thrashing is enabled.
   * 1 = every call (very aggressive).
   */
  static DEBUG_THRASH_SHADE_BLUR_TEMP_CANVAS_STRIDE = 1;
  static ctxBlurEnabled = true;
  static BLUR_ENABLED = true;
  static USE_WEBGL_BLUR = false;
  static USE_WEBGL_WATER_OVERLAY = true;
  static HIGH_QUALITY_BLUR = false; // true = 49 samples, false = 13 samples for performance
  static BLUR_DOWNSAMPLE_FACTOR = 8; // Blur at 1/4 size for performance (1 = full size, 4 = quarter size)
  static ENEMIES_BLOCK_LIGHT = true;
  static SHADING_DISABLED = false;

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

  static readonly TOGGLE_NARROWED_LIGHTING_FOV = () => {
    GameConstants.NARROWED_LIGHTING_FOV = !GameConstants.NARROWED_LIGHTING_FOV;
    console.log(
      `Narrowed lighting FoV is now ${GameConstants.NARROWED_LIGHTING_FOV ? "enabled" : "disabled"}`,
    );
  };

  static readonly TOGGLE_USE_WEBGL_BLUR = () => {
    GameConstants.USE_WEBGL_BLUR = !GameConstants.USE_WEBGL_BLUR;
    console.log(
      `WebGL blur is now ${GameConstants.USE_WEBGL_BLUR ? "enabled" : "disabled"}`,
    );
  };

  static readonly TOGGLE_WEBGL_WATER_OVERLAY = () => {
    GameConstants.USE_WEBGL_WATER_OVERLAY =
      !GameConstants.USE_WEBGL_WATER_OVERLAY;
    console.log(
      `WebGL water overlay is now ${
        GameConstants.USE_WEBGL_WATER_OVERLAY ? "enabled" : "disabled"
      }`,
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
    QuarterStaff,
    GlowStick,
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
    CrossbowBolt,
    Spear,
    Pickaxe,
    Lantern,
    DivingHelmet,
    WeaponBlood,
    Backplate,
    Gauntlets,
    ShoulderPlates,
    ChestPlate,
    IronBar,
    IronBar,
    IronBar,
    IronBar,
    IronOre,
    IronOre,
    IronOre,
    Scythe,
    Sword,
    DualDagger,
    WeaponCurse,

    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
    Coal,
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
