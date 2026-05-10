import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a query routing assistant for a game strategy guide. Given a player's question and a section index with keywords, return ONLY a JSON array of section names that are likely to contain the answer.

Rules:
- Return at most 3 section names.
- Use exactly the names shown between brackets in the index (e.g. "ENEMIES: HOW TO FIGHT THEM").
- Return [] if no section is relevant.
- No explanation. No markdown. Return only valid JSON.`;

export const analyzeQuestion = async (
  client: Anthropic,
  question: string,
  guideMapString: string
): Promise<string[]> => {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `GUIDE INDEX:\n${guideMapString}\n\nPLAYER QUESTION:\n${question}`,
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  console.log("[analyzeQuestion] raw:", raw);
  console.log("[analyzeQuestion] cleaned:", cleaned);

  try {
    const parsed = JSON.parse(cleaned);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }
  } catch (e) {
    console.log("[analyzeQuestion] JSON parse failed:", e);
  }

  return [];
};
