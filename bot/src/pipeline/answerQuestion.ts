import Anthropic from "@anthropic-ai/sdk";

const UNSURE_SENTINEL = "I_AM_UNSURE";

const buildSystemPrompt = (sectionContent: string): string =>
  `You are a Turnarchist gameplay assistant. Answer the player's question using only the guide sections provided below. Be direct and factual — 1 to 3 short sentences. No flavor text, no greetings, no sign-offs.

If the provided sections do not contain enough information to answer the question confidently, respond with exactly: ${UNSURE_SENTINEL}

Do not guess or speculate beyond what the guide says.

GUIDE SECTIONS:
${sectionContent}`;

export const answerQuestion = async (
  client: Anthropic,
  question: string,
  sectionContent: string
): Promise<string | null> => {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: buildSystemPrompt(sectionContent),
    messages: [{ role: "user", content: question }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (text === UNSURE_SENTINEL || text.includes(UNSURE_SENTINEL)) {
    return null;
  }

  return text;
};
