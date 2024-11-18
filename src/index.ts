import { CacheType, Client, GatewayIntentBits, Interaction, REST, Routes } from "discord.js";
import {
  authenticateWarcraftLogs,
  fetchFights,
  fetchDamageData,
  fetchDamageTakenData,
  fetchDeathsAndWipes,
  fetchPlayerInfo,
  generateWarcraftLogsUrl,
  createDmgDoneUrl,
} from "./warcraftLogs";
import {
  classIcons,
  DEFAULT_FILTER,
  DMG_DONE_FILTER,
  Fight,
  PlayerMap,
  TARGET_CHANNEL_ID,
  WEEKLY_SUMMARY_CHANNEL_ID,
} from "./constants";
import {
  numberWithCommas,
  formatDuration,
  sortByValueDescending,
  extractLogId,
  getKeyByCharacterName,
  formatRaidDate,
} from "./utils";
import dotenv from "dotenv";
import { fetchRandomFact } from "./randomFact";
import { RAID_COMMAND, RAID_SUMMARY_COMMAND } from "./commands/raid-command";

// Load environment variables
dotenv.config();
authenticateWarcraftLogs();

// Create a new Discord client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Track the user interaction states
const userStates: {
  [userId: string]: {
    step: number;
    logId?: string;
    dmgTakenFilterExpression?: string;
    logIds?: string[];
  };
} = {};

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
  await weeklySummaryChannel.send(weeklySummary);

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

  const dmgTakenFilterExpression = filter.toLowerCase() === "1" ? DEFAULT_FILTER : filter;

  const randomJoke = await fetchRandomFact();

  await interaction.followUp({
    content: `Analyzing request ${username}, Did you know, ${randomJoke}`,
  });

  const raidSummary = await generateRaidSummary(logId, dmgTakenFilterExpression);

  await raidSummaryChannel.send(raidSummary);

  await interaction.followUp({
    content: `Details have been sent to the specified channel: ${raidSummaryChannel}`,
    ephemeral: true,
  });
};

// Generate the summary message content for the individual raid analysis
async function generateRaidSummary(logId: string, dmgTakenFilterExpression: string) {
  // Fetch raid info and player info in parallel
  const [raidData, playerMap] = await Promise.all([fetchFights(logId), fetchPlayerInfo(logId)]);

  const { fights, title, startTime: raidStartTime } = raidData as { fights: Fight[]; title: string; startTime: number };
  if (!fights || fights.length === 0) {
    return { raidSummary: "No fights found for this log." };
  }

  let totalDamage = 0;
  let totalDamageTaken = 0;
  let totalDeaths = 0;
  let totalWipes = 0;
  const playerDamage: { [key: string]: number } = {};
  const playerDamageTaken: { [key: string]: number } = {};
  const playerDeaths: { [key: string]: number } = {};

  // Filter out invalid fights in advance
  const validFights = getValidFights(fights);
  const raidDuration = calculateRaidDuration(validFights);

  // Fetch all data for each fight concurrently
  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime, kill, id: fightId } = fight;

      // Fetch damage done, damage taken, and death/wipe data concurrently
      const [dmgDoneData, dmgTakenData, deathAndWipeData] = await Promise.all([
        fetchDamageData(logId, startTime, endTime, DMG_DONE_FILTER),
        fetchDamageTakenData(logId, fightId, dmgTakenFilterExpression),
        fetchDeathsAndWipes(logId, startTime, endTime),
      ]);

      // Process damage done
      dmgDoneData?.data?.entries.forEach((entry: any) => {
        const playerName = `${entry.name}_${entry.type}`;
        playerDamage[playerName] = (playerDamage[playerName] || 0) + entry.total;
        totalDamage += entry.total;
      });

      // Process damage taken
      dmgTakenData?.data?.entries.forEach((entry: any) => {
        const playerName = `${entry.name}_${entry.type}`;
        playerDamageTaken[playerName] = (playerDamageTaken[playerName] || 0) + entry.total;
        totalDamageTaken += entry.total;
      });

      // Process deaths
      deathAndWipeData.events.data.forEach((event: any) => {
        const playerName = playerMap[event.targetID];
        if (playerName) {
          playerDeaths[playerName] = (playerDeaths[playerName] || 0) + 1;
          totalDeaths++;
        }
      });

      // Increment total wipes if fight was not a kill
      if (kill === false) totalWipes++;
    }),
  );

  // Sorting and grouping
  const sortedDamageTaken = sortByValueDescending(playerDamageTaken);
  const sortedDamageDealers = sortByValueDescending(playerDamage);
  const groupedByClass: { [classType: string]: string[] } = {};

  sortedDamageTaken.forEach((player) => {
    const [playerName, playerClass] = player.split("_");
    if (!groupedByClass[playerClass]) groupedByClass[playerClass] = [];
    groupedByClass[playerClass].push(playerName);
  });

  // Summaries
  const raidRoster = Object.entries(groupedByClass)
    .map(([playerClass, players]) => `${classIcons[playerClass]} ${playerClass}: ${players.join(", ")}`)
    .join("\n");

  const dmgDealersSummary = sortedDamageDealers
    .slice(0, 10)
    .map((player) => {
      const [playerName, playerClass] = player.split("_");
      return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamage[player])}`;
    })
    .join("\n");

  const dmgTakenSummary = sortedDamageTaken
    .slice(0, 10)
    .map((player) => {
      const [playerName, playerClass] = player.split("_");
      return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamageTaken[player])}`;
    })
    .join("\n");

  const sortedDeaths = sortByValueDescending(playerDeaths);
  const deathsSummary = sortedDeaths
    .slice(0, 5)
    .map((player) => {
      const [playerName] = player.split("_");
      return `${playerName}: ${playerDeaths[player]}`;
    })
    .join("\n");

  const formattedDate = formatRaidDate(raidStartTime);

  const WclUrl = await generateWarcraftLogsUrl(logId, dmgTakenFilterExpression);
  const dmgDoneUrl = await createDmgDoneUrl(logId, DMG_DONE_FILTER);
  return `**${title} - ${formattedDate} - ${dmgDoneUrl}\n**\n**Roster**\n${raidRoster}\n\n**Raid Duration**: ${formatDuration(raidDuration)}\n**Total Damage Done**: ${numberWithCommas(totalDamage)}\n**Total Avoidable Damage Taken**: ${numberWithCommas(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}\n\n**Top 10 DPS**:\n${dmgDealersSummary}\n\n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}\n\n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${WclUrl}\n\n`;
}

// Generate the weekly summary
async function generateWeeklyRaidSummary(logIds: string[]) {
  let totalDuration = 0;
  let totalDeaths = 0;
  let totalWipes = 0;
  const raidSummaries = [];
  const deathsByPlayer: Record<string, number> = {};
  const raidsPerPlayer: Record<string, number> = {};

  const raidsData: {
    code: string;
    fights: Fight[];
    title: string;
    startTime: number;
  }[] = await Promise.all(logIds.map((logId) => fetchFights(logId)));

  const playersPerLog: { [logId: string]: PlayerMap } = {};

  await Promise.all(
    logIds.map(async (logId) => {
      const data = await fetchPlayerInfo(logId);
      playersPerLog[logId] = data;
    }),
  );

  for (let i = 0; i < raidsData.length; i++) {
    const { fights, title, startTime: raidStartTime, code } = raidsData[i];
    if (!fights || fights.length === 0) continue;

    let raidDuration = 0;
    let deaths = 0;
    let wipes = 0;

    // Filter out invalid fights where startTime and endTime are both 0
    const validFights = getValidFights(fights);

    if (validFights.length > 0) {
      // Calculate raid duration based on valid fights
      raidDuration = calculateRaidDuration(validFights);

      // Fetch deaths and wipes data for all valid fights in parallel
      const eventsData = await Promise.all(
        validFights.map(async (fight) => {
          if (fight.kill === false) wipes += 1;
          return fetchDeathsAndWipes(logIds[i], fight.startTime, fight.endTime);
        }),
      );

      // Process each fight's death events
      for (const { events } of eventsData) {
        deaths += events?.data.length || 0;
        if (events.data.length) {
          events.data.forEach((deathEvent: any) => {
            const playerName = playersPerLog[code][deathEvent.targetID];
            const absoluteCharName = getKeyByCharacterName(playerName);
            if (deathsByPlayer[absoluteCharName]) {
              deathsByPlayer[absoluteCharName]++;
            } else {
              deathsByPlayer[absoluteCharName] = 1;
            }
          });
        }
      }
    }

    totalDuration += raidDuration;
    totalDeaths += deaths;
    totalWipes += wipes;

    const formattedDate = formatRaidDate(raidStartTime);

    raidSummaries.push(
      `**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logIds[i]}**\nRaid Duration: ${formatDuration(raidDuration)}\nWipes: ${wipes}\nDeaths: ${deaths}\n`,
    );
  }

  const allPlayersParticipated = Object.values(playersPerLog).flatMap((players) => Object.values(players));

  const allPlayersParticipatedSet = new Set(allPlayersParticipated);

  allPlayersParticipatedSet.forEach((player) => {
    const playerName = getKeyByCharacterName(player);
    if (raidsPerPlayer[playerName]) {
      raidsPerPlayer[playerName]++;
    } else {
      raidsPerPlayer[playerName] = 1;
    }
  });

  const averageDuration = totalDuration / logIds.length;
  const averageDeaths = totalDeaths / logIds.length;

  const sortedDeathsByPlayersObj = Object.entries(deathsByPlayer)
    .slice(0, 15)
    .sort(([, valueA], [, valueB]) => valueB - valueA);

  const sortedDeathsByPlayersString = sortedDeathsByPlayersObj
    .map(([key, value]) => `${key}: ${value} - Splits : ${raidsPerPlayer[key]}`)
    .join("\n");

  return `**Weekly Raid Summary**\n${raidSummaries.join("\n")}\n**Average Raid Duration**: ${formatDuration(averageDuration)}\n**Average Deaths per Raid**: ${averageDeaths.toFixed(0)}\n**Total amount of raids:** ${raidSummaries.length}\n\n**Top 10 deaths by player**:\n${sortedDeathsByPlayersString}`;
}
// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

function getValidFights(fights: Fight[]): Fight[] {
  return fights.filter((fight) => !(fight.startTime === 0 && fight.endTime === 0));
}

function calculateRaidDuration(fights: Fight[]): number {
  if (fights.length === 0) return 0;
  return (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;
}
