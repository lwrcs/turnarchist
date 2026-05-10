import { Client, GatewayIntentBits, Events } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { config } from "./config";
import { askCommand } from "./commands/ask";

const commands = [askCommand];

const registerCommands = async (): Promise<void> => {
  const rest = new REST({ version: "10" }).setToken(config.discord.token);
  await rest.put(Routes.applicationCommands(config.discord.clientId), {
    body: commands.map((c) => c.data.toJSON()),
  });
  console.log("Slash commands registered.");
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ask") {
    await askCommand.execute(interaction);
  }
});

client.login(config.discord.token);
