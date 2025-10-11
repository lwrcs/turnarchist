import { Request, Response } from "express";
import {
  FetchGameStatsParams,
  fetchGameStatsRequestSchema,
  GameStats,
  recordGameStatsRequestSchema,
} from "../schema";
import { validateRequest } from "zod-express-middleware";
import express from "express";
import { logger } from "../../logger";
import { gameStatsDal } from "db/dal/game-stats";
import HttpStatus from "http-status-codes";
import { getClientIp } from "request-ip";
import { asyncHandler } from "../middleware/asyncHandler";

const recordGameStats = async (
  req: Request<{}, {}, GameStats>,
  res: Response,
) => {
  const gameStats = req.body;
  logger.info(
    "Recording game stats: " +
      JSON.stringify({ ...gameStats, gameState: "omitted" }),
  );
  await gameStatsDal.createGameStats({
    ...gameStats,
    ipAddress: getClientIp(req),
  });
  return res
    .status(HttpStatus.CREATED)
    .json({ message: "Game stats recorded successfully" });
};

const fetchGameStats = async (
  req: Request<{}, {}, {}, FetchGameStatsParams>,
  res: Response,
) => {
  const { limit, cursor } = req.query;
  const gameStats = await gameStatsDal.getGameStats({
    limit,
    cursor,
  });
  return res.status(HttpStatus.OK).json(gameStats);
};

const fetchGameStatsCount = async (req: Request, res: Response) => {
  const count = await gameStatsDal.getGameStatsCount();
  return res.status(HttpStatus.OK).json({ count });
};

export const getGameRouter = () => {
  const gameRouter = express.Router();

  gameRouter.post(
    "/stats",
    validateRequest(recordGameStatsRequestSchema),
    asyncHandler<{}, {}, GameStats, {}>(recordGameStats),
  );
  gameRouter.get(
    "/stats",
    validateRequest(fetchGameStatsRequestSchema),
    asyncHandler<{}, {}, {}, FetchGameStatsParams>(fetchGameStats),
  );
  gameRouter.get(
    "/stats/count",
    asyncHandler<{}, {}, {}, {}>(fetchGameStatsCount),
  );

  return gameRouter;
};
