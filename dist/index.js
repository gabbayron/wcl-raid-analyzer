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
    if (content.startsWith("!raid")) {
        // Start the sequence and prompt for log ID
        userStates[userId] = { step: 1 };
        return message.reply("Please provide the log ID:");
    }
    // Check if the user is in the middle of a sequence
    if (userStates[userId]) {
        const userState = userStates[userId];
        if (userState.step === 1) {
            // Step 1: Receive the log ID
            userState.logId = content;
            userState.step = 2;
            return message.reply("Got the log ID. Now, please specify the damage taken filter (or type '1' for default filter):");
        }
        else if (userState.step === 2) {
            // Step 2: Receive the damage taken filter
            const dmgTakenFilterExpression = content.toLowerCase() === "1" ? constants_1.DEFAULT_FILTER : content;
            userState.dmgTakenFilterExpression = dmgTakenFilterExpression;
            userState.step = 3;
            const randomJoke = yield (0, randomFact_1.fetchRandomFact)();
            const userName = message.author.globalName;
            message.reply(`Analyzing request ${userName}, Did you know, ${randomJoke}`);
            // Step 3: Generate the raid summary
            const raidSummary = yield generateRaidSummary(userState.logId, dmgTakenFilterExpression);
            const targetChannel = client.channels.cache.get(constants_1.TARGET_CHANNEL_ID);
            yield targetChannel.send(raidSummary);
            // Clear the user state after sending the summary
            delete userStates[userId];
        }
    }
}));
// Generate the summary message content for the raid analysis
function generateRaidSummary(logId, dmgTakenFilterExpression) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const { fights, title, startTime: raidStartTime, } = yield (0, warcraftLogs_1.fetchFights)(logId);
        if (!fights || fights.length === 0) {
            return { raidSummary: "No fights found for this log." };
        }
        let totalDamage = 0;
        let totalDamageTaken = 0;
        let totalDeaths = 0;
        let totalWipes = 0;
        let playerDamage = {};
        let playerDamageTaken = {};
        let playerDeaths = {};
        const playerMap = yield (0, warcraftLogs_1.fetchPlayerInfo)(logId); // Fetches player names and classes
        // Iterate through each fight and accumulate data
        for (const fight of fights) {
            const { startTime, endTime, kill, id: fightId } = fight;
            // Fetch data in parallel for each fight
            const [dmgDoneData, dmgTakenData, deathAndWipeData] = yield Promise.all([
                (0, warcraftLogs_1.fetchDamageData)(logId, startTime, endTime),
                (0, warcraftLogs_1.fetchDamageTakenData)(logId, fightId, dmgTakenFilterExpression),
                (0, warcraftLogs_1.fetchDeathsAndWipes)(logId, startTime, endTime),
            ]);
            // Process Damage Data
            const dmgDone = (_a = dmgDoneData === null || dmgDoneData === void 0 ? void 0 : dmgDoneData.data) === null || _a === void 0 ? void 0 : _a.entries;
            if (dmgDone) {
                dmgDone.forEach((entry) => {
                    const playerName = `${entry.name}_${entry.type}`;
                    playerDamage[playerName] =
                        (playerDamage[playerName] || 0) + entry.total;
                    totalDamage += entry.total;
                });
            }
            // Process Damage Taken Data with spell name filtering
            const dmgTaken = (_b = dmgTakenData === null || dmgTakenData === void 0 ? void 0 : dmgTakenData.data) === null || _b === void 0 ? void 0 : _b.entries;
            if (dmgTaken) {
                dmgTaken.forEach((entry) => {
                    const playerName = `${entry.name}_${entry.type}`;
                    playerDamageTaken[playerName] =
                        (playerDamageTaken[playerName] || 0) + entry.total;
                    totalDamageTaken += entry.total;
                });
            }
            // Process Death and Wipe Data
            if ((_c = deathAndWipeData === null || deathAndWipeData === void 0 ? void 0 : deathAndWipeData.events) === null || _c === void 0 ? void 0 : _c.data) {
                totalDeaths += deathAndWipeData.events.data.length;
                deathAndWipeData.events.data.forEach((event) => {
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
        const raidDuration = (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;
        const sortedDamageTaken = (0, utils_1.sortByValueDescending)(playerDamageTaken);
        const sortedDamageDealers = (0, utils_1.sortByValueDescending)(playerDamage);
        // Group players by class using playerMap
        const groupedByClass = {};
        sortedDamageTaken.forEach((player) => {
            const [playerName, playerClass] = player.split("_");
            if (!groupedByClass[playerClass]) {
                groupedByClass[playerClass] = [];
            }
            groupedByClass[playerClass].push(playerName);
        });
        // Format the roster with each class in a separate row, including class name and icon
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
        const raidSummary = `**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logId}\n**\n**Roster** \n${raidRoster}\n\n**Raid Duration**: ${(0, utils_1.formatDuration)(raidDuration)}\n**Total Damage Done**: ${(0, utils_1.numberWithCommas)(totalDamage)}\n**Total Avoidable Damage Taken**: ${(0, utils_1.numberWithCommas)(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}
  \n**Top 10 DPS**:\n${dmgDealersSummary}
  \n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}
  \n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${WclUrl}\n\n`;
        return raidSummary;
    });
}
client.login(process.env.BOT_TOKEN);
//# sourceMappingURL=index.js.map