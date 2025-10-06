export enum EnvType {
  DUNGEON = 0,
  CAVE = 1,
  FOREST = 2,
  CASTLE = 3,
  GLACIER = 4,
  DARK_CASTLE = 5,
  PLACEHOLDER = 6,
  DESERT = 7,
  MAGMA_CAVE = 8,
  DARK_DUNGEON = 9,
}

export const getEnvTypeName = (envType: EnvType): string => {
  switch (envType) {
    case EnvType.DUNGEON:
      return "DUNGEON";
    case EnvType.CAVE:
      return "CAVE";
    case EnvType.FOREST:
      return "FOREST";
    case EnvType.CASTLE:
      return "CASTLE";
    case EnvType.GLACIER:
      return "GLACIER";
    case EnvType.DARK_CASTLE:
      return "DARK_CASTLE";
    case EnvType.PLACEHOLDER:
      return "PLACEHOLDER";
    case EnvType.DESERT:
      return "DESERT";
    case EnvType.MAGMA_CAVE:
      return "MAGMA_CAVE";
    case EnvType.DARK_DUNGEON:
      return "DARK_DUNGEON";
  }
};
