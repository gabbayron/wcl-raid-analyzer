"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const warcraftLogs_1 = require("./warcraftLogs");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
const randomFact_1 = require("./randomFact");
// Load environment variables
dotenv_1.default.config();
(0, warcraftLogs_1.authenticateWarcraftLogs)();
// Create a new Discord client instance
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
// Track the user interaction states
const userStates = {};
client.once("ready", () => {
    console.log("Raid Analyzer Bot is online!");
});
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.author.bot)
        return;
    const userId = message.author.id;
    const content = message.content.trim();
    if (content.startsWith("!raidSummary")) {
        // Start the sequence for weekly summary
        userStates[userId] = { step: 1, logIds: [] };
        return message.reply("Please provide the log URLs or log IDs separated by spaces:");
    }
    if (content.startsWith("!raid")) {
        // Start the sequence for individual raid analysis
        userStates[userId] = { step: 1 };
        return message.reply("Please provide the log URL or log ID:");
    }
    // Check if the user is in the middle of a sequence
    if (userStates[userId]) {
        const userState = userStates[userId];
        if (userState.step === 1) {
            if (userState.logIds) {
                // Step 1 for weekly summary: Receive multiple log IDs
                const logIds = content.split(" ").map(utils_1.extractLogId).filter(Boolean);
                if (logIds.length === 0) {
                    return message.reply("Invalid input. Please provide valid log IDs or URLs.");
                }
                userState.logIds = logIds;
                userState.step = 2;
                message.reply(`Received ${logIds.length} log IDs. Generating weekly summary...`);
                const weeklySummary = yield generateWeeklyRaidSummary(logIds);
                const targetChannel = client.channels.cache.get(constants_1.WEEKLY_SUMMARY_CHANNEL_ID);
                yield targetChannel.send(weeklySummary);
                delete userStates[userId];
            }
            else {
                // Step 1 for individual raid: Receive single log ID
                const logId = (0, utils_1.extractLogId)(content);
                if (!logId) {
                    return message.reply("Invalid log input. Please provide log ID or full log URL.");
                }
                userState.logId = logId;
                userState.step = 2;
                return message.reply("Got the log ID. Now, please specify the damage taken filter (or type '1' for default filter):");
            }
        }
        else if (userState.step === 2) {
            // Step 2 for individual raid: Receive the damage taken filter
            const dmgTakenFilterExpression = content.toLowerCase() === "1" ? constants_1.DEFAULT_FILTER : content;
            userState.dmgTakenFilterExpression = dmgTakenFilterExpression;
            const randomJoke = yield (0, randomFact_1.fetchRandomFact)();
            const userName = message.author.globalName;
            message.reply(`Analyzing request ${userName}, Did you know, ${randomJoke}`);
            // Generate and send the individual raid summary
            const raidSummary = yield generateRaidSummary(userState.logId, dmgTakenFilterExpression);
            const targetChannel = client.channels.cache.get(constants_1.TARGET_CHANNEL_ID);
            yield targetChannel.send(raidSummary);
            // Clear the user state after sending the summary
            delete userStates[userId];
        }
    }
}));
// Generate the summary message content for the individual raid analysis
function generateRaidSummary(logId, dmgTakenFilterExpression) {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch raid info and player info in parallel
        const [raidData, playerMap] = yield Promise.all([
            (0, warcraftLogs_1.fetchFights)(logId),
            (0, warcraftLogs_1.fetchPlayerInfo)(logId),
        ]);
        const { fights, title, startTime: raidStartTime, } = raidData;
        if (!fights || fights.length === 0) {
            return { raidSummary: "No fights found for this log." };
        }
        let totalDamage = 0;
        let totalDamageTaken = 0;
        let totalDeaths = 0;
        let totalWipes = 0;
        const playerDamage = {};
        const playerDamageTaken = {};
        const playerDeaths = {};
        // Filter out invalid fights in advance
        const validFights = fights.filter((fight) => !(fight.startTime === 0 && fight.endTime === 0));
        const raidDuration = (validFights[validFights.length - 1].endTime - validFights[0].startTime) /
            1000;
        // Fetch all data for each fight concurrently
        yield Promise.all(validFights.map((fight) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { startTime, endTime, kill, id: fightId } = fight;
            // Fetch damage done, damage taken, and death/wipe data concurrently
            const [dmgDoneData, dmgTakenData, deathAndWipeData] = yield Promise.all([
                (0, warcraftLogs_1.fetchDamageData)(logId, startTime, endTime),
                (0, warcraftLogs_1.fetchDamageTakenData)(logId, fightId, dmgTakenFilterExpression),
                (0, warcraftLogs_1.fetchDeathsAndWipes)(logId, startTime, endTime),
            ]);
            // Process damage done
            (_a = dmgDoneData === null || dmgDoneData === void 0 ? void 0 : dmgDoneData.data) === null || _a === void 0 ? void 0 : _a.entries.forEach((entry) => {
                const playerName = `${entry.name}_${entry.type}`;
                playerDamage[playerName] =
                    (playerDamage[playerName] || 0) + entry.total;
                totalDamage += entry.total;
            });
            // Process damage taken
            (_b = dmgTakenData === null || dmgTakenData === void 0 ? void 0 : dmgTakenData.data) === null || _b === void 0 ? void 0 : _b.entries.forEach((entry) => {
                const playerName = `${entry.name}_${entry.type}`;
                playerDamageTaken[playerName] =
                    (playerDamageTaken[playerName] || 0) + entry.total;
                totalDamageTaken += entry.total;
            });
            // Process deaths
            deathAndWipeData.events.data.forEach((event) => {
                const playerName = playerMap[event.targetID];
                if (playerName) {
                    playerDeaths[playerName] = (playerDeaths[playerName] || 0) + 1;
                    totalDeaths++;
                }
            });
            // Increment total wipes if fight was not a kill
            if (kill === false)
                totalWipes++;
        })));
        // Sorting and grouping
        const sortedDamageTaken = (0, utils_1.sortByValueDescending)(playerDamageTaken);
        const sortedDamageDealers = (0, utils_1.sortByValueDescending)(playerDamage);
        const groupedByClass = {};
        sortedDamageTaken.forEach((player) => {
            const [playerName, playerClass] = player.split("_");
            if (!groupedByClass[playerClass])
                groupedByClass[playerClass] = [];
            groupedByClass[playerClass].push(playerName);
        });
        // Summaries
        const raidRoster = Object.entries(groupedByClass)
            .map(([playerClass, players]) => `${constants_1.classIcons[playerClass]} ${playerClass}: ${players.join(", ")}`)
            .join("\n");
        const dmgDealersSummary = sortedDamageDealers
            .slice(0, 10)
            .map((player) => {
            const [playerName, playerClass] = player.split("_");
            return `${constants_1.classIcons[playerClass] || ""} ${playerName}: ${(0, utils_1.numberWithCommas)(playerDamage[player])}`;
        })
            .join("\n");
        const dmgTakenSummary = sortedDamageTaken
            .slice(0, 10)
            .map((player) => {
            const [playerName, playerClass] = player.split("_");
            return `${constants_1.classIcons[playerClass] || ""} ${playerName}: ${(0, utils_1.numberWithCommas)(playerDamageTaken[player])}`;
        })
            .join("\n");
        const sortedDeaths = (0, utils_1.sortByValueDescending)(playerDeaths);
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
        const WclUrl = yield (0, warcraftLogs_1.generateWarcraftLogsUrl)(logId, dmgTakenFilterExpression);
        return `**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logId}\n**\n**Roster**\n${raidRoster}\n\n**Raid Duration**: ${(0, utils_1.formatDuration)(raidDuration)}\n**Total Damage Done**: ${(0, utils_1.numberWithCommas)(totalDamage)}\n**Total Avoidable Damage Taken**: ${(0, utils_1.numberWithCommas)(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}\n\n**Top 10 DPS**:\n${dmgDealersSummary}\n\n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}\n\n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${WclUrl}\n\n`;
    });
}
// Generate the weekly summary
function generateWeeklyRaidSummary(logIds) {
    return __awaiter(this, void 0, void 0, function* () {
        let totalDuration = 0;
        let totalDeaths = 0;
        let totalWipes = 0;
        const raidSummaries = [];
        let playersMap = {};
        const deathsByPlayer = {};
        const raidsPerPlayer = {};
        const raidsData = yield Promise.all(logIds.map((logId) => (0, warcraftLogs_1.fetchFights)(logId)));
        const playersPerLog = {};
        yield Promise.all(logIds.map((logId) => __awaiter(this, void 0, void 0, function* () {
            const data = yield (0, warcraftLogs_1.fetchPlayerInfo)(logId);
            playersPerLog[logId] = data;
        })));
        for (let i = 0; i < raidsData.length; i++) {
            const { fights, title, startTime: raidStartTime, code } = raidsData[i];
            if (!fights || fights.length === 0)
                continue;
            let raidDuration = 0;
            let deaths = 0;
            let wipes = 0;
            // Filter out invalid fights where startTime and endTime are both 0
            const validFights = fights.filter((fight) => !(fight.startTime === 0 && fight.endTime === 0));
            if (validFights.length > 0) {
                // Calculate raid duration based on valid fights
                raidDuration =
                    (validFights[validFights.length - 1].endTime -
                        validFights[0].startTime) /
                        1000;
                // Fetch deaths and wipes data for all valid fights in parallel
                const eventsData = yield Promise.all(validFights.map((fight) => __awaiter(this, void 0, void 0, function* () {
                    if (fight.kill === false)
                        wipes += 1;
                    return (0, warcraftLogs_1.fetchDeathsAndWipes)(logIds[i], fight.startTime, fight.endTime);
                })));
                // Process each fight's death events
                for (const { events } of eventsData) {
                    deaths += (events === null || events === void 0 ? void 0 : events.data.length) || 0;
                    if (events.data.length) {
                        events.data.forEach((deathEvent) => {
                            const playerName = playersPerLog[code][deathEvent.targetID];
                            const absoluteCharName = (0, utils_1.getKeyByCharacterName)(playerName);
                            if (deathsByPlayer[absoluteCharName]) {
                                deathsByPlayer[absoluteCharName]++;
                            }
                            else {
                                deathsByPlayer[absoluteCharName] = 1;
                            }
                        });
                    }
                }
            }
            totalDuration += raidDuration;
            totalDeaths += deaths;
            totalWipes += wipes;
            const formattedDate = new Date(raidStartTime).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            raidSummaries.push(`**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logIds[i]}**\nRaid Duration: ${(0, utils_1.formatDuration)(raidDuration)}\nWipes: ${wipes}\nDeaths: ${deaths}\n`);
        }
        const allPlayersParticipated = Object.values(playersPerLog).flatMap((players) => Object.values(players));
        const allPlayersParticipatedSet = new Set(allPlayersParticipated);
        allPlayersParticipatedSet.forEach((player) => {
            const playerName = (0, utils_1.getKeyByCharacterName)(player);
            if (raidsPerPlayer[playerName]) {
                raidsPerPlayer[playerName]++;
            }
            else {
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
        return `**Weekly Raid Summary**\n${raidSummaries.join("\n")}\n**Average Raid Duration**: ${(0, utils_1.formatDuration)(averageDuration)}\n**Average Deaths per Raid**: ${averageDeaths.toFixed(2)}\n**Total amount of raids:** ${raidSummaries.length}\n\n**Top 10 deaths by player**:\n${sortedDeathsByPlayersString}`;
    });
}
// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map