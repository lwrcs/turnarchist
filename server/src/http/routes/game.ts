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

const recordGameStats = async (
  req: Request<{}, {}, GameStats>,
  res: Response,
) => {
  const gameStats = req.body;
  logger.info("Recording game stats:", gameStats);
  await gameStatsDal.createGameStats(gameStats);
  return res
    .status(HttpStatus.CREATED)
    .json({ message: "Game stats recorded successfully" });
};

const fetchGameStats = async (
  req: Request<{}, {}, {}, FetchGameStatsParams>,
  res: Response,
) => {
  const { limit, createdBefore } = req.query;
  const gameStats = await gameStatsDal.getGameStats({
    limit,
    createdBefore,
  });
  return res.status(HttpStatus.OK).json(gameStats);
};

export const getGameRouter = () => {
  const gameRouter = express.Router();

  gameRouter.post(
    "/stats",
    validateRequest(recordGameStatsRequestSchema),
    recordGameStats,
  );
  gameRouter.get(
    "/stats",
    validateRequest(fetchGameStatsRequestSchema),
    fetchGameStats,
  );

  return gameRouter;
};
