import express from "express";
import { getGameRouter } from "./routes/game";
import { loggingMiddleware } from "./middleware/logging";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";

const API_BASE_PATH = `/api/v1`;

const initializeMiddleware = (app: express.Application) => {
  app.use(express.json());
  app.use(loggingMiddleware);
  app.use(corsMiddleware);
};

const initializeRoutes = (app: express.Application) => {
  const apiRouter = express.Router();
  apiRouter.use("/game", getGameRouter());
  app.use(API_BASE_PATH, apiRouter);
};

export const initializeHttpServer = () => {
  const app = express();
  app.set("trust proxy", true);

  initializeMiddleware(app);
  initializeRoutes(app);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};
