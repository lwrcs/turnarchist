import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler";
import { feedbackLogsDal, FeedbackLogType, FeedbackSortField } from "db/dal/feedback-logs";
import { getClientIp } from "request-ip";
import HttpStatus from "http-status-codes";
import { z } from "zod";

const logRequestSchema = z.object({
  type: z.enum(["bug", "idea"]),
  text: z.string().min(1).max(2000),
  userId: z.string().uuid().nullable().optional(),
});

const fetchLogsQuerySchema = z.object({
  type: z.enum(["bug", "idea"]).optional(),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(["createdAt", "userId"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const logRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => getClientIp(req) ?? req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many log submissions. Please slow down." },
});

const appendLog = async (req: Request, res: Response) => {
  const parsed = logRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const { type, text, userId } = parsed.data;
  const entry = await feedbackLogsDal.createFeedbackLog({
    type: type as FeedbackLogType,
    text,
    userId: userId ?? null,
    ipAddress: getClientIp(req),
  });

  return res.status(HttpStatus.CREATED).json({ id: entry.id });
};

const fetchLogs = async (req: Request, res: Response) => {
  const parsed = fetchLogsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Invalid query", errors: parsed.error.errors });
  }

  const { type, userId, sortBy, sortDir, limit, offset } = parsed.data;
  const result = await feedbackLogsDal.getFeedbackLogs({
    type: type as FeedbackLogType | undefined,
    userId,
    sortBy: sortBy as FeedbackSortField,
    sortDir,
    limit,
    offset,
  });

  return res.status(HttpStatus.OK).json(result);
};

export const getLogRouter = () => {
  const logRouter = express.Router();
  logRouter.post("/", logRateLimit, asyncHandler(appendLog));
  logRouter.get("/", asyncHandler(fetchLogs));
  return logRouter;
};
