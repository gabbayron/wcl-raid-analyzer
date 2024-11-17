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
exports.authenticateWarcraftLogs = authenticateWarcraftLogs;
exports.getAccessToken = getAccessToken;
exports.fetchFights = fetchFights;
exports.fetchDamageData = fetchDamageData;
exports.fetchDamageTakenData = fetchDamageTakenData;
exports.fetchDeathsAndWipes = fetchDeathsAndWipes;
exports.fetchPlayerInfo = fetchPlayerInfo;
exports.generateWarcraftLogsUrl = generateWarcraftLogsUrl;
const axios_1 = __importDefault(require("axios"));
const queries_1 = require("./queries");
const CLIENT_ID = "9d715d63-aa2d-44ea-a813-c08222dceefd";
const CLIENT_SECRET = "f5wrbS5EPb9FClSq7VCDoE5ewGeJxyx4TLJ4rW88";
let accessToken = null;
function authenticateWarcraftLogs() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = new URLSearchParams();
            data.append("grant_type", "client_credentials");
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/oauth/token", data, {
                headers: {
                    Authorization: "Basic " +
                        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            accessToken = response.data.access_token;
            console.log("Authenticated with Warcraft Logs API");
        }
        catch (error) {
            console.error("Failed to authenticate with Warcraft Logs:", error);
        }
    });
}
// Function to get the access token (you might already have this from before)
function getAccessToken() {
    if (!accessToken) {
        console.error("Access token is missing.");
        return null;
    }
    return accessToken;
}
// Reusable function for sending fetch requests to Warcraft Logs API
function fetchWarcraftLogsData(query, variables) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!accessToken) {
            console.error("Access token is missing.");
            return null;
        }
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", { query, variables }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            response.data.errors && console.log(response.data.errors);
            return response.data.data;
        }
        catch (error) {
            console.error("Failed to fetch data:", error);
            return null;
        }
    });
}
// Refactor fetch methods to use the reusable function
function fetchFights(logId) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchWarcraftLogsData(queries_1.fightsQuery, { logId });
        return (data === null || data === void 0 ? void 0 : data.reportData.report) || null;
    });
}
function fetchDamageData(logId, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchWarcraftLogsData(queries_1.tableQuery, {
            logId,
            startTime,
            endTime,
        });
        return (data === null || data === void 0 ? void 0 : data.reportData.report.table) || null;
    });
}
function fetchDamageTakenData(logId, fightID, filterExpression) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchWarcraftLogsData(queries_1.tableQueryDamageTaken, {
            logId,
            fightID,
            filterExpression,
        });
        if (data === null || data === void 0 ? void 0 : data.reportData.report.table) {
            const allEntries = data.reportData.report.table.data.entries;
            allEntries.map((entry) => {
                entry.total = 0;
                entry.abilities.forEach((ability) => {
                    const totalReducedExists = ability.totalReduced || ability.totalReduced === 0;
                    return Object.assign(Object.assign({}, entry), { total: (entry.total += totalReducedExists
                            ? ability.totalReduced
                            : ability.total) });
                });
            });
            return { data: { entries: allEntries } };
        }
        return { data: { entries: [] } };
    });
}
function fetchDeathsAndWipes(logId, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchWarcraftLogsData(queries_1.eventsQuery, {
            logId,
            startTime,
            endTime,
        });
        return (data === null || data === void 0 ? void 0 : data.reportData.report) || null;
    });
}
function fetchPlayerInfo(logId) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetchWarcraftLogsData(queries_1.playerInfoQuery, { logId });
        const players = data.reportData.report.masterData.actors;
        const playerMap = {};
        players.forEach((player) => {
            playerMap[player.id] = player.name;
        });
        return playerMap;
    });
}
function generateWarcraftLogsUrl(logId_1, filter_1) {
    return __awaiter(this, arguments, void 0, function* (logId, filter, options = 38) {
        const baseUrl = "https://classic.warcraftlogs.com/reports/";
        // Create the URL with the provided expression and options
        const url = `${baseUrl}${logId}#boss=-3&difficulty=0&type=damage-taken&pins=2%24Off%24%23244F4B%24expression%24${encodeURIComponent(filter)}&options=${options}&cutoff=6`;
        const { data: shortenedUrl } = yield axios_1.default.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
        return shortenedUrl;
    });
}
//# sourceMappingURL=warcraftLogs.js.map