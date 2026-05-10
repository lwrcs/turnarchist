import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { buildGuideMapString } from "../strategyGuideMap";
import { getSectionContent } from "../sectionParser";
import { analyzeQuestion } from "../pipeline/analyzeQuestion";
import { answerQuestion } from "../pipeline/answerQuestion";

const FALLBACK_MESSAGE =
  "I'm not sure — that information might not be in the guide yet.";

const client = new Anthropic({ apiKey: config.anthropic.apiKey });
const guideMapString = buildGuideMapString();

export const askCommand = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask a question about Turnarchist")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Your question about the game")
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const question = interaction.options.getString("question", true);

    await interaction.deferReply();

    try {
      const relevantSections = await analyzeQuestion(
        client,
        question,
        guideMapString
      );

      console.log("[ask] haiku sections:", JSON.stringify(relevantSections));

      if (relevantSections.length === 0) {
        console.log("[ask] gate 1: no relevant sections");
        await interaction.editReply(FALLBACK_MESSAGE);
        return;
      }

      const sectionContent = getSectionContent(relevantSections);

      console.log("[ask] section content length:", sectionContent.length);

      if (sectionContent.length === 0) {
        console.log("[ask] gate 2: sections empty");
        await interaction.editReply(FALLBACK_MESSAGE);
        return;
      }

      const answer = await answerQuestion(client, question, sectionContent);

      console.log("[ask] answer:", answer);

      await interaction.editReply(answer ?? FALLBACK_MESSAGE);
    } catch (err) {
      console.error("[ask] pipeline error:", err);
      await interaction.editReply(
        "Something went wrong while looking that up. Try again in a moment."
      );
    }
  },
};
