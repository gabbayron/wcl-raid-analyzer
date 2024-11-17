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
// Updated table query for Damage Taken
function fetchFights(logId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!accessToken) {
            console.error("Access token is missing.");
            return null;
        }
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", { query: queries_1.fightsQuery, variables: { logId } }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.data.reportData.report.fights;
        }
        catch (error) {
            console.error(`Failed to fetch fights for log ${logId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
            return null;
        }
    });
}
function fetchDamageData(logId, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!accessToken) {
            console.error("Access token is missing.");
            return null;
        }
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", { query: queries_1.tableQuery, variables: { logId, startTime, endTime } }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.data.reportData.report.table;
        }
        catch (error) {
            console.error(`Failed to fetch damage data for log ${logId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
            return null;
        }
    });
}
function fetchDamageTakenData(logId, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", {
                query: queries_1.tableQueryDamageTaken,
                variables: { logId, startTime, endTime },
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.data.reportData.report.table;
        }
        catch (error) {
            console.error(`Failed to fetch damage taken data for log ${logId}:`, error);
            return null;
        }
    });
}
function fetchDeathsAndWipes(logId, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", { query: queries_1.eventsQuery, variables: { logId, startTime, endTime } }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.data.reportData.report;
        }
        catch (error) {
            console.error(`Failed to fetch deaths and wipes for log ${logId}:`, error);
            return null;
        }
    });
}
// Function to fetch player information
function fetchPlayerInfo(logId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.post("https://www.warcraftlogs.com/api/v2/client", { query: queries_1.playerInfoQuery, variables: { logId } }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            // Map player IDs to their names for easy lookup
            const players = response.data.data.reportData.report.masterData.actors;
            const playerMap = {};
            players.forEach((player) => {
                playerMap[player.id] = player.name;
            });
            return playerMap;
        }
        catch (error) {
            console.error(`Failed to fetch player info for log ${logId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error);
            return;
        }
    });
}
