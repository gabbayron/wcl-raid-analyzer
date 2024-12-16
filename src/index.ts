import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  Client,
  GatewayIntentBits,
  Interaction,
  REST,
  Routes,
  StringSelectMenuBuilder,
} from "discord.js";

import { authenticateWarcraftLogs } from "./warcraftLogs";
import {
  DMG_DONE_FILTER,
  DMG_TAKEN_FILTER_TO_EXPANSION,
  EXPANSIONS,
  GEAR_CHECK_CHANNEL_ID,
  TARGET_CHANNEL_ID,
  WEEKLY_SUMMARY_CHANNEL_ID,
} from "./constants";
import { extractLogId, sendLongMessage } from "./utils";
import dotenv from "dotenv";
import { fetchRandomFact } from "./randomFact";
import {
  ADD_COMMAND,
  GEAR_CHECK,
  RAID_COMMAND,
  RAID_OPTIONS,
  RAID_SUMMARY_COMMAND,
  RENAME_NAME_COMMAND,
} from "./commands/raid-command";
import { generateRaidSummary } from "./actions/raidSummary";
import { generateWeeklyRaidSummary } from "./actions/weeklyRaidSummary";
import { fetchCharacterNames, fetchRaidRoster, findRowAndUpdateCharacterName } from "./google-auth/google-api-";
import { generateGearCheck } from "./actions/gearCheckl";

dotenv.config();
authenticateWarcraftLogs();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const commands = [RAID_COMMAND, RAID_SUMMARY_COMMAND, ADD_COMMAND, RAID_OPTIONS, RENAME_NAME_COMMAND, GEAR_CHECK].map(
  (command) => command.data.toJSON(),
);

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

let currentPage = 0;
const userSelections = new Map<string, { absenceType?: string; startDate?: string; endDate?: string }>();
const raidRosterCharactersMap = new Map<string, { name: string; value: string }[]>();

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete() && interaction.commandName === "rename_character") {
    const userName = interaction.user.username;
    const { playerName } = await getCharNameByDiscordUsername(userName);

    if (!playerName) {
      return await interaction.respond([]);
    }
    const playerCachedCharacters = raidRosterCharactersMap.get(playerName);
    if (playerCachedCharacters) {
      console.log(`${playerName} characters cached, returning cached values`);
      return await interaction.respond(playerCachedCharacters);
    }

    const raidRoster = await fetchRaidRoster();
    const charactersResponse: { name: string; value: string }[] = [];
    raidRoster[playerName].forEach((char) => charactersResponse.push({ name: char, value: char }));
    raidRosterCharactersMap.set(playerName, charactersResponse);
    return await interaction.respond(charactersResponse);
  }

  if (interaction.isCommand()) {
    await interaction.deferReply({ ephemeral: true });

    if (interaction.commandName === "raid") {
      await handleSingleRaidSummary(interaction);
    }

    if (interaction.commandName === "weekly_raids_summary") {
      await handleWeeklyRaidsSummary(interaction);
    }

    if (interaction.commandName === "gear_check") {
      await handleGearCheck(interaction);
    }

    if (interaction.commandName === "add") {
      const userName = interaction.user.username;
      const { discordId, playerName } = await getCharNameByDiscordUsername(userName);

      if (!playerName) {
        return await interaction.followUp({
          content: `Character name for ${discordId} not found. Please contact leadership`,
        });
      }

      await interaction.followUp({ content: playerName, ephemeral: true });
    }

    if (interaction.commandName === "rename_character") {
      const userName = interaction.user.username;
      const existingCharacterName = interaction.options.get("existing_character_name")?.value as string;
      const newCharacterName = interaction.options.get("new_character_name")?.value as string;

      const { discordId, playerName } = await getCharNameByDiscordUsername(userName);

      if (!playerName) {
        return await interaction.followUp({
          content: `Character name for ${discordId} not found. Please contact leadership`,
        });
      }

      const playerCachedCharacterNames = raidRosterCharactersMap.get(playerName)?.map(({ name }) => name);
      if (!playerCachedCharacterNames?.includes(existingCharacterName)) {
        return await interaction.followUp({
          content: `Existing character names not included in list`,
          ephemeral: true,
        });
      }

      await findRowAndUpdateCharacterName(existingCharacterName, newCharacterName);
      return await interaction.followUp({
        content: `Updated character name from ${existingCharacterName} to ${newCharacterName}`,
        ephemeral: true,
      });
    }

    if (interaction.commandName === "absence") {
      const absenceType = interaction.options.get("absence_type")?.value as string;
      const userId = interaction.user.id;

      userSelections.set(userId, { absenceType });

      const { startDateMenu, buttons } = getPaginatedMenu(0);
      currentPage = 0;

      await interaction.followUp({
        content: "Please select a start date:",
        components: [startDateMenu, buttons],
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === "prev") currentPage--;
    if (interaction.customId === "next") currentPage++;

    const userId = interaction.user.id;
    const prevUserSelection = userSelections.get(userId);

    const { startDateMenu, endDateMenu, buttons } = getPaginatedMenu(currentPage); // Get updated menu options

    if (!prevUserSelection?.startDate) {
      await interaction.update({
        content: "Please select a start date:",
        components: [startDateMenu, buttons],
      });
    } else {
      const content = `You selected start date: ${prevUserSelection?.startDate}. Now select an end date:`;

      await interaction.update({
        content,
        components: [endDateMenu, buttons],
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "startDate") {
      if (interaction.values.length < 1) {
        await interaction.update({
          content: "Please select a start date.",
          components: [],
        });
        return;
      }

      const { endDateMenu, buttons } = getPaginatedMenu(0);
      const userId = interaction.user.id;
      const prevUserSelection = userSelections.get(userId);

      const startDateSelection = interaction.values[0];
      userSelections.set(userId, { ...prevUserSelection, startDate: startDateSelection });
      currentPage = 0;
      await interaction.update({
        content: `You selected start date: ${interaction.values[0]}. Now select an end date:`,
        components: [endDateMenu, buttons],
      });
    }

    // Handle the end date selection
    if (interaction.customId === "endDate") {
      if (interaction.values.length < 1) {
        await interaction.update({
          content: "Please select an end date.",
        });
        return;
      }

      const userId = interaction.user.id;
      const endDateSelection = interaction.values[0];
      const prevUserSelection = userSelections.get(userId);
      userSelections.set(userId, { ...prevUserSelection, endDate: endDateSelection });

      const { startDate, endDate, absenceType } = userSelections.get(userId) || {};

      const isEndDateEarlierThanStartDate = new Date(extractDate(endDate!)) < new Date(extractDate(startDate!));

      if (isEndDateEarlierThanStartDate) {
        return await interaction.update({
          content: `End date later than start date`,
          components: [],
        });
      }

      await interaction.update({
        content: `You selected start date: ${startDate} and end date: ${endDate}. ${absenceType}`,
        components: [],
      });
      userSelections.delete(userId);
    }
  }
});

function getPaginatedMenu(page: number) {
  const pageSize = 25;
  const startIndex = page * pageSize;

  const { dates, maxData } = getDatesArray(startIndex);

  const startDateMultiSelect = new StringSelectMenuBuilder()
    .setCustomId(`startDate`)
    .setPlaceholder("Select start date")
    .addOptions(
      dates.map((option) => ({
        label: option,
        value: option,
      })),
    );

  const endDateMultiSelect = new StringSelectMenuBuilder()
    .setCustomId(`endDate`)
    .setPlaceholder("Select end date")
    .addOptions(
      dates.map((option) => ({
        label: option,
        value: option,
      })),
    );

  const prevButton = new ButtonBuilder()
    .setCustomId("prev")
    .setLabel("Get previous dates")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(!page);

  const nextButton = new ButtonBuilder()
    .setCustomId("next")
    .setLabel("Get future dates")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(maxData);

  const startDateMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(startDateMultiSelect);
  const endDateMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(endDateMultiSelect);
  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

  return { startDateMenu, endDateMenu, buttons };
}

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
  const dmgTakenFilter = interaction.options.get("dmg_taken_filter")?.value as string;
  const dmgDoneFilter = interaction.options.get("dmg_done_filter")?.value as string;
  const expansion = interaction.options.get("expansion")?.value as EXPANSIONS;
  const username = interaction.user.globalName;
  const isCata = expansion === "cata";
  const dmgTakenFilterByExpansion = DMG_TAKEN_FILTER_TO_EXPANSION[expansion];

  const dmgTakenFilterExpression = dmgTakenFilter || dmgTakenFilterByExpansion;
  const dmgDoneFilterExpression = isCata ? dmgDoneFilter || DMG_DONE_FILTER : "";

  const randomJoke = await fetchRandomFact();

  await interaction.followUp({
    content: `Analyzing request ${username}, Did you know, ${randomJoke}`,
  });

  const { string, charts } = await generateRaidSummary(
    logId,
    dmgTakenFilterExpression,
    dmgDoneFilterExpression,
    expansion,
  );

  await raidSummaryChannel.send({ content: string, split: true });

  charts?.forEach(async (chart) => {
    await raidSummaryChannel.send({ embeds: [chart] });
  });

  await interaction.followUp({
    content: `Details have been sent to the specified channel: ${raidSummaryChannel}`,
    ephemeral: true,
  });
};

const handleGearCheck = async (interaction: Interaction<CacheType>) => {
  if (!interaction.isCommand()) return;

  const gearCheckChannel: any = client.channels.cache.get(GEAR_CHECK_CHANNEL_ID);

  const providedLogId = interaction.options.get("log_id")?.value as string;
  const logId = extractLogId(providedLogId) as string;
  const expansion = interaction.options.get("expansion")?.value as string;

  const content = await generateGearCheck(logId, expansion);

  await sendLongMessage(gearCheckChannel, content);

  await interaction.followUp({
    content: `Details have been sent to the specified channel: ${gearCheckChannel}`,
    ephemeral: true,
  });
};

client.login(process.env.DISCORD_TOKEN);

function getDatesArray(offset: number) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() + offset);

  // Calculate the date 52 days ahead of today's date
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 51);

  for (let i = 0; i < 25; i++) {
    // Check if the current date is beyond 52 days ahead
    if (date > maxDate) {
      break;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const weekday = date.toLocaleString("default", { weekday: "long" });

    dates.push(`${weekday}-${year}-${month}-${day}`);
    date.setDate(date.getDate() + 1);
  }

  return { dates, maxData: date > maxDate };
}

function extractDate(input: string) {
  const date = input.split("-").slice(1).join("-");
  return date;
}

async function getCharNameByDiscordUsername(username: string) {
  const data = await fetchCharacterNames();

  const { discordId, playerName } = data.find(({ discordId }) => discordId === username) || {};

  return { discordId, playerName };
}
