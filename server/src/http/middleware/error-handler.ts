import { Request, Response, NextFunction } from "express";
import { logger } from "../../logger";
import HttpStatus from "http-status-codes";

export const errorHandler = (error: Error, _req: Request, res: Response) => {
  logger.error(`Error: ${error.message}`);

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
  });
};
