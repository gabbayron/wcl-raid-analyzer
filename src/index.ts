import { CacheType, Client, GatewayIntentBits, Interaction, REST, Routes } from "discord.js";
import { authenticateWarcraftLogs } from "./warcraftLogs";
import { DEFAULT_FILTER, TARGET_CHANNEL_ID, WEEKLY_SUMMARY_CHANNEL_ID } from "./constants";
import { extractLogId, sendLongMessage } from "./utils";
import dotenv from "dotenv";
import { fetchRandomFact } from "./randomFact";
import { RAID_COMMAND, RAID_SUMMARY_COMMAND } from "./commands/raid-command";
import { generateRaidSummary } from "./actions/raidSummary";
import { generateWeeklyRaidSummary } from "./actions/weeklyRaidSummary";

// Load environment variables
dotenv.config();
authenticateWarcraftLogs();

// Create a new Discord client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const commands = [RAID_COMMAND, RAID_SUMMARY_COMMAND].map((command) => command.data.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(`1304544325840928788`), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  await interaction.deferReply({ ephemeral: true });

  if (interaction.commandName === "raid") {
    await handleSingleRaidSummary(interaction);
  }

  if (interaction.commandName === "weekly_raids_summary") {
    await handleWeeklyRaidsSummary(interaction);
  }
});

const handleWeeklyRaidsSummary = async (interaction: Interaction<CacheType>) => {
  if (!interaction.isCommand()) return;

  const providedLogIds = interaction.options.get("log_ids")?.value as string;
  const username = interaction.user.globalName;

  const logIdsArray = providedLogIds.split(" ").map(extractLogId).filter(Boolean) as string[];

  await interaction.followUp({
    content: `Analyzing request ${username}.Received ${logIdsArray.length} log IDs. Generating weekly summary...`,
  });

  const weeklySummary = await generateWeeklyRaidSummary(logIdsArray);
  const weeklySummaryChannel: any = client.channels.cache.get(WEEKLY_SUMMARY_CHANNEL_ID);
  await sendLongMessage(weeklySummaryChannel, weeklySummary);
  await interaction.followUp({
    content: `Details have been sent to the specified channel: ${weeklySummaryChannel}`,
    ephemeral: true,
  });
};
const handleSingleRaidSummary = async (interaction: Interaction<CacheType>) => {
  if (!interaction.isCommand()) return;

  const raidSummaryChannel: any = client.channels.cache.get(TARGET_CHANNEL_ID);

  const providedLogId = interaction.options.get("log_id")?.value as string;
  const logId = extractLogId(providedLogId) as string;
  const filter = interaction.options.get("filter")?.value as string;
  const username = interaction.user.globalName;

  const dmgTakenFilterExpression = filter || DEFAULT_FILTER;

  const randomJoke = await fetchRandomFact();

  await interaction.followUp({
    content: `Analyzing request ${username}, Did you know, ${randomJoke}`,
  });

  const { string, charts } = await generateRaidSummary(logId, dmgTakenFilterExpression);

  await raidSummaryChannel.send({ content: string, split: true });

  charts?.forEach(async (chart) => {
    await raidSummaryChannel.send({ embeds: [chart] });
  });

  await interaction.followUp({
    content: `Details have been sent to the specified channel: ${raidSummaryChannel}`,
    ephemeral: true,
  });
};

client.login(process.env.DISCORD_TOKEN);
