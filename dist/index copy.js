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
// Event listener when the bot is ready
client.once("ready", () => {
    console.log("Raid Analyzer Bot is online!");
});
// Event listener when a message is received
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (message.content.startsWith("!raid")) {
        const logId = message.content.split(" ")[1];
        if (!logId) {
            return message.reply("Please provide a log ID. Usage: `!raid <logId>`");
        }
        const { fights, title } = yield (0, warcraftLogs_1.fetchFights)(logId);
        if (!fights || fights.length === 0) {
            return message.reply("No fights found for this log.");
        }
        let totalDamage = 0;
        let totalDamageTaken = 0;
        let totalDeaths = 0;
        let totalWipes = 0;
        let playerDamage = {};
        let playerDamageTaken = {};
        let playerDeaths = {};
        for (const fight of fights) {
            const { startTime, endTime, kill } = fight;
            const { data: { entries: dmgDone }, } = yield (0, warcraftLogs_1.fetchDamageData)(logId, startTime, endTime);
            if (dmgDone) {
                dmgDone.forEach((entry) => {
                    const playerName = `${entry.name}_${entry.type}`;
                    playerDamage[playerName] =
                        (playerDamage[playerName] || 0) + entry.total;
                    totalDamage += entry.total;
                });
            }
            const { data: { entries: dmgTaken }, } = yield (0, warcraftLogs_1.fetchDamageTakenData)(logId, startTime, endTime);
            if (dmgTaken) {
                dmgTaken.forEach((entry) => {
                    const playerName = `${entry.name}_${entry.type}`;
                    playerDamageTaken[playerName] =
                        (playerDamageTaken[playerName] || 0) + entry.total;
                    totalDamageTaken += entry.total;
                });
            }
            const playerMap = yield (0, warcraftLogs_1.fetchPlayerInfo)(logId);
            const deathAndWipeData = yield (0, warcraftLogs_1.fetchDeathsAndWipes)(logId, startTime, endTime);
            if ((_a = deathAndWipeData === null || deathAndWipeData === void 0 ? void 0 : deathAndWipeData.events) === null || _a === void 0 ? void 0 : _a.data) {
                totalDeaths += deathAndWipeData.events.data.length;
                deathAndWipeData.events.data.forEach((event) => {
                    const playerName = playerMap[event.targetID];
                    if (playerName) {
                        playerDeaths[playerName] = (playerDeaths[playerName] || 0) + 1;
                    }
                });
            }
            if (!kill) {
                totalWipes += 1;
            }
        }
        const raidDuration = (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;
        const sortedDamageDealers = (0, utils_1.sortByValueDescending)(playerDamage);
        const dmgDealersSummary = sortedDamageDealers
            .slice(0, 10)
            .map((player) => {
            const [playerName, playerClass] = player.split("_");
            return `${constants_1.classIcons[playerClass]} ${playerName}: ${(0, utils_1.numberWithCommas)(playerDamage[player])}`;
        })
            .join("\n");
        const sortedDamageTaken = (0, utils_1.sortByValueDescending)(playerDamageTaken);
        const dmgTakenSummary = sortedDamageTaken
            .slice(0, 10)
            .map((player) => {
            const [playerName, playerClass] = player.split("_");
            return `${constants_1.classIcons[playerClass]} ${playerName}: ${(0, utils_1.numberWithCommas)(playerDamageTaken[player])}`;
        })
            .join("\n");
        const sortedDeaths = (0, utils_1.sortByValueDescending)(playerDeaths);
        const deathsSummary = sortedDeaths
            .map((player) => {
            const [playerName] = player.split("_");
            return `${playerName}: ${playerDeaths[player]}`;
        })
            .join("\n");
        const messageContent = `**${title}\n**Raid Duration**: ${(0, utils_1.formatDuration)(raidDuration)}\n**Total Damage Done**: ${(0, utils_1.numberWithCommas)(totalDamage)}\n**Total Damage Taken**: ${(0, utils_1.numberWithCommas)(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}\n
    \n**Top 10 Damage Dealers**:\n${dmgDealersSummary}
    \n**Top 10 Damage Taken**:\n${dmgTakenSummary}
    \n**Deaths by Player**:\n${deathsSummary}
    `;
        yield message.reply(messageContent);
    }
}));
client.login(process.env.BOT_TOKEN);
