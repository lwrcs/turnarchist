import express, { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../middleware/asyncHandler";
import { config } from "../../config";
import HttpStatus from "http-status-codes";
import { z } from "zod";

const askRequestSchema = z.object({
  question: z.string().min(1).max(500),
  gameContext: z.string().max(24000),
  dynamicContext: z.string().max(500),
});

const claudeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a moment." },
});

const askClaude = async (req: Request, res: Response) => {
  if (!config.anthropic.apiKey) {
    return res
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .json({ message: "Oracle is not configured." });
  }

  const parsed = askRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const { question, gameContext, dynamicContext } = parsed.data;

  const systemPrompt = `You are a Turnarchist gameplay assistant. Answer questions about enemies, items, spells, strategies, tiles, and biomes. Be brief and direct — 1 to 3 short sentences. No flavor text, no greetings, no sign-offs. If asked about anything unrelated to Turnarchist gameplay, say only "I only answer questions about Turnarchist."

${gameContext}

${dynamicContext}`;

  const client = new Anthropic({ apiKey: config.anthropic.apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: question }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .trim();

  return res.status(HttpStatus.OK).json({ answer: text });
};

export const getClaudeRouter = () => {
  const claudeRouter = express.Router();
  claudeRouter.post("/ask", claudeRateLimit, asyncHandler(askClaude));
  return claudeRouter;
};
