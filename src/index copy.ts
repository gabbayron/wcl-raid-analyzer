import { Client, GatewayIntentBits } from "discord.js";
import {
  authenticateWarcraftLogs,
  fetchFights,
  fetchDamageData,
  fetchDamageTakenData,
  fetchDeathsAndWipes,
  fetchPlayerInfo,
  generateWarcraftLogsUrl,
} from "./warcraftLogs";
import {
  classIcons,
  DEFAULT_FILTER,
  Fight,
  TARGET_CHANNEL_ID,
} from "./constants";
import {
  numberWithCommas,
  formatDuration,
  sortByValueDescending,
  extractLogId,
} from "./utils";
import dotenv from "dotenv";
import { fetchRandomFact } from "./randomFact";

// Load environment variables
dotenv.config();
authenticateWarcraftLogs();

// Create a new Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Track the user interaction states
const userStates: {
  [userId: string]: {
    step: number;
    logId?: string;
    dmgTakenFilterExpression?: string;
  };
} = {};

client.once("ready", () => {
  console.log("Raid Analyzer Bot is online!");
});

client.on("messageCreate", async (message: any) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const content = message.content.trim();

  if (content.startsWith("!raid")) {
    // Start the sequence and prompt for log ID
    userStates[userId] = { step: 1 };
    return message.reply("Please provide the log URL or log ID:");
  }

  // Check if the user is in the middle of a sequence
  if (userStates[userId]) {
    const userState = userStates[userId];

    if (userState.step === 1) {
      // Step 1: Receive the log ID
      const logId = extractLogId(content)

      if(!logId){
        return message.reply(
          "Invalid log input. Please provide log id or full log url",
        );
      }

      userState.logId = logId;
      userState.step = 2;
      return message.reply(
        "Got the log ID. Now, please specify the damage taken filter (or type '1' for default filter):",
      );
    } else if (userState.step === 2) {
      // Step 2: Receive the damage taken filter
      const dmgTakenFilterExpression =
        content.toLowerCase() === "1" ? DEFAULT_FILTER : content;
      userState.dmgTakenFilterExpression = dmgTakenFilterExpression;
      userState.step = 3;

      const randomJoke = await fetchRandomFact()
      const userName = message.author.globalName;
      message.reply(
        `Analyzing request ${userName}, Did you know, ${randomJoke}`,
      );

      // Step 3: Generate the raid summary
      const raidSummary= await generateRaidSummary(
        userState.logId!,
        dmgTakenFilterExpression,
      );

      const targetChannel: any = client.channels.cache.get(TARGET_CHANNEL_ID);
      await targetChannel.send(raidSummary);

      // Clear the user state after sending the summary
      delete userStates[userId];
    }
  }
});

// Generate the summary message content for the raid analysis

async function generateRaidSummary(
  logId: string,
  dmgTakenFilterExpression: string,
) {
  const {
    fights,
    title,
    startTime: raidStartTime,
  }: { fights: Fight[]; title: string; startTime: number } = await fetchFights(
    logId,
  );
  if (!fights || fights.length === 0) {
    return { raidSummary: "No fights found for this log." };
  }

  let totalDamage = 0;
  let totalDamageTaken = 0;
  let totalDeaths = 0;
  let totalWipes = 0;
  let playerDamage: { [key: string]: number } = {};
  let playerDamageTaken: { [key: string]: number } = {};
  let playerDeaths: { [key: string]: number } = {};
  const playerMap: any = await fetchPlayerInfo(logId); // Fetches player names and classes

  // Iterate through each fight and accumulate data
  for (const fight of fights) {
    const { startTime, endTime, kill, id: fightId } = fight;

    // Fetch data in parallel for each fight
    const [dmgDoneData, dmgTakenData, deathAndWipeData] = await Promise.all([
      fetchDamageData(logId, startTime, endTime),
      fetchDamageTakenData(logId, fightId, dmgTakenFilterExpression),
      fetchDeathsAndWipes(logId, startTime, endTime),
    ]);

    // Process Damage Data
    const dmgDone = dmgDoneData?.data?.entries;
    if (dmgDone) {
      dmgDone.forEach((entry: any) => {
        const playerName = `${entry.name}_${entry.type}`;
        playerDamage[playerName] =
          (playerDamage[playerName] || 0) + entry.total;
        totalDamage += entry.total;
      });
    }

    // Process Damage Taken Data with spell name filtering
    const dmgTaken = dmgTakenData?.data?.entries;
    if (dmgTaken) {
      dmgTaken.forEach((entry: any) => {
        const playerName = `${entry.name}_${entry.type}`;
        playerDamageTaken[playerName] =
          (playerDamageTaken[playerName] || 0) + entry.total;
        totalDamageTaken += entry.total;
      });
    }

    // Process Death and Wipe Data
    if (deathAndWipeData?.events?.data) {
      totalDeaths += deathAndWipeData.events.data.length;
      deathAndWipeData.events.data.forEach((event: any) => {
        const playerName = playerMap[event.targetID];
        if (playerName) {
          playerDeaths[playerName] = (playerDeaths[playerName] || 0) + 1;
        }
      });
    }

    if (kill === false) {
      totalWipes += 1;
    }
  }

  const raidDuration =
    (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;

  const sortedDamageTaken = sortByValueDescending(playerDamageTaken);
  const sortedDamageDealers = sortByValueDescending(playerDamage);

  // Group players by class using playerMap
  const groupedByClass: { [classType: string]: string[] } = {};
  sortedDamageTaken.forEach((player) => {
    const [playerName, playerClass] = player.split("_");
    if (!groupedByClass[playerClass]) {
      groupedByClass[playerClass] = [];
    }
    groupedByClass[playerClass].push(playerName);
  });

  // Format the roster with each class in a separate row, including class name and icon
  const raidRoster = Object.entries(groupedByClass)
    .map(
      ([playerClass, players]) =>
        `${classIcons[playerClass]} ${playerClass}: ${players.join(", ")}`,
    )
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

  const formattedDate = new Date(raidStartTime).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const WclUrl = await generateWarcraftLogsUrl(logId, dmgTakenFilterExpression)

  const raidSummary = `**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logId}\n**\n**Roster** \n${raidRoster}\n\n**Raid Duration**: ${formatDuration(raidDuration)}\n**Total Damage Done**: ${numberWithCommas(totalDamage)}\n**Total Avoidable Damage Taken**: ${numberWithCommas(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}
  \n**Top 10 DPS**:\n${dmgDealersSummary}
  \n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}
  \n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${WclUrl}\n\n`;

  return raidSummary 
}

client.login(process.env.BOT_TOKEN);
