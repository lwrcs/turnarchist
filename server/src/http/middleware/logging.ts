import { Request, Response, NextFunction } from "express";
import { logger } from "../../logger";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.ip} - ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    logger.info(message);
  });

  next();
};
