import axios from "axios";
import type { GameStats as GameStatsType } from "@server/http/schema";
import { getEnvironmentApiUrl } from "./utils";
import { v4 as uuidv4 } from "uuid";
import { GAME_CONTEXT } from "./claudeGameContext";
import { GAME_STRATEGY_GUIDE } from "./gameStrategyGuide";

export const apiClient = axios.create({
  baseURL: getEnvironmentApiUrl(),
});

// The `GameStats` type exported by the server has optional fields by default, because the parent
// project doesnt have `strictNullChecks` enabled. We wrap it in `Required` to make fields non-optional.
type GameStats = Required<GameStatsType>;

export const recordGameStats = async (gameStats: GameStats) => {
  const response = await apiClient.post("/game/stats", gameStats);
  return response.data;
};

// Create a unique user id. This id is per device per browser,
// so users may have multiple ids if they have multiple devices or browsers.
export const getOrCreateUserId = () => {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    const newUserId = uuidv4();
    localStorage.setItem("userId", newUserId);
    return newUserId;
  }
  return userId;
};

export const safeRecordGameStats = async (gameStats: GameStats) => {
  try {
    return await recordGameStats(gameStats);
  } catch (error) {
    console.error("API request failed:", error);
  }
};

export const fetchGameStats = async () => {
  const response = await apiClient.get("/game/stats");
  return response.data;
};

export const askClaude = async (
  question: string,
  dynamicContext: string,
): Promise<string> => {
  const response = await apiClient.post("/claude/ask", {
    question,
    gameContext: GAME_CONTEXT + "\n\n" + GAME_STRATEGY_GUIDE,
    dynamicContext,
  });
  return response.data.answer as string;
};
