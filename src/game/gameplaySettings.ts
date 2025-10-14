export class GameplaySettings {
  // === MAP ===
  static LEGACY_MINIMAP = true; // when true, use pre-existing minimap behavior and layout

  static readonly LIMIT_ENEMY_TYPES = true;
  static readonly MEDIAN_ROOM_DENSITY = 0.25;
  static readonly UNLIMITED_SPAWNERS = true;
  static readonly THROTTLE_SPAWNERS = true;
  static NO_ENEMIES = false;
  static EQUIP_USES_TURN = false;
  static UNBREAKABLE_ITEMGROUP_LOOT = false;
  static readonly PRESET_BOSSES = false;
  static readonly PNG_LEVEL_PROBABILITY = 0.1;
  static readonly TUTORIAL_ENABLED = false;
  static readonly MAXIMUM_ENEMY_INTERACTION_DISTANCE = 30;

  // === ORGANIC TUNNELS DEBUG/FEATURE FLAGS ===
  static ORGANIC_TUNNELS_ENABLED = true; // allow populator to use organic tunnels when appropriate
  static ORGANIC_TUNNELS_FORCE = false; // force usage regardless of environment/type gating
  static ORGANIC_TUNNELS_DEBUG = true; // verbose console logging for organic tunnel generation
  static ORGANIC_TUNNELS_SPOOF_ENABLED = true; // add synthetic entries on walls without doors
  static ORGANIC_TUNNELS_SPOOF_PER_WALL_MIN = 1; // min synthetic entries per doorless wall
  static ORGANIC_TUNNELS_SPOOF_PER_WALL_MAX = 2; // max synthetic entries per doorless wall
  static ORGANIC_TUNNELS_SPOOF_EDGE_MARGIN = 2; // keep synthetic entries away from corners

  // === DEBUG ===
  static LIGHTING_DEBUG = true; // log visible tile bounds and counts

  static readonly MAIN_PATH_BRANCHING = 0.1;
  static readonly MAIN_PATH_LOOPINESS = 0.05;

  static readonly BASE_ENEMY_ALERT_RANGE = 4;
  static readonly BASE_ENEMY_ALERT_NEARBY_RANGE = 2;

  // === ENEMY POOL SETTINGS ===

  // Enemy Type Progression
  static readonly NEW_ENEMIES_PER_LEVEL = 2; // How many new enemy types to add per level when LIMIT_ENEMY_TYPES is true
  static readonly ENEMY_TYPES_BASE_COUNT = 4; // Base number added to sqrt formula for enemy type calculation
  static readonly DEPTH_ZERO_ENEMY_TYPES = 3; // Number of enemy types available at depth 0

  // Special Enemy Depth Requirements
  static readonly SPAWNER_MIN_DEPTH = 0; // Minimum depth before spawners can appear (depth > this value)
  static readonly OCCULTIST_MIN_DEPTH = 1; // Minimum depth before occultists can appear (depth > this value)

  // Special Enemy Spawn Probabilities
  static readonly SPAWNER_SPAWN_CHANCE = 0.1; // Probability per attempt to spawn a spawner (10%)
  static readonly OCCULTIST_SPAWN_CHANCE = 0.1; // Probability per attempt to spawn an occultist (10%)

  // Special Enemy Area Thresholds
  static readonly SPAWNER_AREA_THRESHOLD = 50; // Room area divided by this = max possible spawners
  static readonly OCCULTIST_AREA_THRESHOLD = 200; // Room area divided by this = max possible occultists

  // Enemy Density Settings
  static readonly ENEMY_DENSITY_DEPTH_MULTIPLIER = 0.04; // Multiplied by (depth + 2) for base density
  static readonly ENEMY_DENSITY_DEPTH_OFFSET = 2; // Added to depth before multiplying
  static readonly MAX_ENEMY_DENSITY = 0.25; // Maximum enemy density cap
  static readonly FOREST_ENEMY_REDUCTION = 0.25; // Multiplier for enemy count in forest environments

  static readonly MAX_OCCULTIST_SHIELDS = 7; // Maximum number of shields an occultist can have
  static readonly MAX_EXALTER_BUFFS = 7; // Maximum number of buffs an exalter can have
}
