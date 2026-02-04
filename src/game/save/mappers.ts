import { Direction } from "../../game";
import { EnvType } from "../../constants/environmentTypes";
import type { DirectionKind, EnvKind } from "./schema";

export const envTypeToEnvKind = (env: EnvType): EnvKind => {
  switch (env) {
    case EnvType.DUNGEON:
      return "dungeon";
    case EnvType.CAVE:
      return "cave";
    case EnvType.FOREST:
      return "forest";
    case EnvType.CASTLE:
      return "castle";
    case EnvType.GLACIER:
      return "glacier";
    case EnvType.DARK_CASTLE:
      return "dark_castle";
    case EnvType.PLACEHOLDER:
      return "placeholder";
    case EnvType.DESERT:
      return "desert";
    case EnvType.MAGMA_CAVE:
      return "magma_cave";
    case EnvType.DARK_DUNGEON:
      return "dark_dungeon";
    case EnvType.TUTORIAL:
      return "tutorial";
    case EnvType.FLOODED_CAVE:
      return "flooded_cave";
  }
};

export const directionToDirectionKind = (d: Direction): DirectionKind => {
  switch (d) {
    case Direction.DOWN:
      return "down";
    case Direction.UP:
      return "up";
    case Direction.RIGHT:
      return "right";
    case Direction.LEFT:
      return "left";
    case Direction.DOWN_RIGHT:
      return "down_right";
    case Direction.UP_LEFT:
      return "up_left";
    case Direction.UP_RIGHT:
      return "up_right";
    case Direction.DOWN_LEFT:
      return "down_left";
    case Direction.CENTER:
      return "center";
  }
};

export const envKindToEnvType = (env: EnvKind): EnvType => {
  switch (env) {
    case "dungeon":
      return EnvType.DUNGEON;
    case "cave":
      return EnvType.CAVE;
    case "forest":
      return EnvType.FOREST;
    case "castle":
      return EnvType.CASTLE;
    case "glacier":
      return EnvType.GLACIER;
    case "dark_castle":
      return EnvType.DARK_CASTLE;
    case "placeholder":
      return EnvType.PLACEHOLDER;
    case "desert":
      return EnvType.DESERT;
    case "magma_cave":
      return EnvType.MAGMA_CAVE;
    case "dark_dungeon":
      return EnvType.DARK_DUNGEON;
    case "tutorial":
      return EnvType.TUTORIAL;
    case "flooded_cave":
      return EnvType.FLOODED_CAVE;
  }
};

export const directionKindToDirection = (d: DirectionKind): Direction => {
  switch (d) {
    case "down":
      return Direction.DOWN;
    case "up":
      return Direction.UP;
    case "right":
      return Direction.RIGHT;
    case "left":
      return Direction.LEFT;
    case "down_right":
      return Direction.DOWN_RIGHT;
    case "up_left":
      return Direction.UP_LEFT;
    case "up_right":
      return Direction.UP_RIGHT;
    case "down_left":
      return Direction.DOWN_LEFT;
    case "center":
      return Direction.CENTER;
  }
};


