import axios from "axios";
import {
  buffsQuery,
  castsQuery,
  debuffsQuery,
  dispelsQuery,
  eventsQuery,
  fightsQuery,
  guildLogs,
  playerInfoQuery,
  tableQuery,
  tableQueryDamageTaken,
  totalCastsQuery,
} from "./queries";
import {
  BuffEvent,
  EFFECTIVE_SUNDERS_FILTER,
  Fight,
  PlayerMap,
  SUB_DOMAINS_TO_EXPANSION,
  WIPES_CUT_OFF,
} from "./constants";
import { RaidData } from "./types";

let accessToken: string | null = process.env.ACCESS_TOKEN!;
let refreshToken: string | null = null;

// Function to update tokens
export function updateTokens(newAccessToken: string, newRefreshToken?: string) {
  accessToken = newAccessToken;
  if (newRefreshToken) {
    refreshToken = newRefreshToken;
  }
}

export async function authenticateWarcraftLogs() {
  try {
    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");

    const response = await axios.post("https://www.warcraftlogs.com/oauth/token", data, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (!accessToken) {
      updateTokens(response.data.access_token);
    }
    console.log("Authenticated with Warcraft Logs API");
  } catch (error) {
    console.error("Failed to authenticate with Warcraft Logs:", error);
  }
}

// Reusable function for sending fetch requests to Warcraft Logs API
async function fetchWarcraftLogsData(query: string, variables: any) {
  // https://classic.warcraftlogs.com/api/v2/user
  // https://www.warcraftlogs.com/api/v2/client
  try {
    const response = await axios.post(
      "https://classic.warcraftlogs.com/api/v2/user",
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );
    response.data.errors && console.log(response.data.errors);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return null;
  }
}

export async function fetchFights(logId: string): Promise<any> {
  const data = await fetchWarcraftLogsData(fightsQuery, { logId });
  return data?.reportData.report || null;
}

export async function fetchDamageData(
  logId: string,
  startTime: number,
  endTime: number,
  filterExpression: string = "",
): Promise<any> {
  const data = await fetchWarcraftLogsData(tableQuery, {
    logId,
    startTime,
    endTime,
    filterExpression,
  });
  return data?.reportData.report.table || null;
}

export async function fetchDebuffs(logId: string, startTime: number, endTime: number): Promise<any> {
  const data = await fetchWarcraftLogsData(debuffsQuery, {
    logId,
    startTime,
    endTime,
  });
  return data?.reportData.report.table || null;
}

export async function fetchDamageTakenData(logId: string, fightID: number, filterExpression?: string): Promise<any> {
  const data = await fetchWarcraftLogsData(tableQueryDamageTaken, {
    logId,
    fightID,
    filterExpression,
  });

  if (data?.reportData.report.table) {
    const allEntries = data.reportData.report.table.data.entries;
    allEntries.map((entry: any) => {
      entry.total = 0;
      entry.abilities.forEach((ability: any) => {
        const totalReducedExists = ability.totalReduced || ability.totalReduced === 0;
        return {
          ...entry,
          total: (entry.total += totalReducedExists ? ability.totalReduced : ability.total),
        };
      });
    });
    return { data: { entries: allEntries } };
  }

  return { data: { entries: [] } };
}

export async function fetchCasts(
  logId: string,
  startTime: number,
  endTime: number,
  filterExpression = EFFECTIVE_SUNDERS_FILTER,
) {
  const data = await fetchWarcraftLogsData(castsQuery, {
    logId,
    startTime,
    endTime,
    filterExpression,
  });

  return data.reportData.report.table.data.entries;
}

export async function fetchDeathsAndWipes(logId: string, startTime: number, endTime: number): Promise<any> {
  const data = await fetchWarcraftLogsData(eventsQuery, {
    logId,
    startTime,
    endTime,
  });
  return data?.reportData.report || null;
}

export async function fetchPlayerInfo(logId: string): Promise<PlayerMap> {
  const data = await fetchWarcraftLogsData(playerInfoQuery, { logId });
  const players = data.reportData.report.masterData.actors.filter(
    (player: { icon: string }) => player.icon !== "Unknown",
  );
  const playerMap: { [id: number]: string } = {};
  players.forEach((player: any) => {
    playerMap[player.id] = player.name;
  });
  return playerMap;
}

export async function generateWarcraftLogsUrl(logId: string, filter: string, options = 38, expansion: string) {
  const subdomain = SUB_DOMAINS_TO_EXPANSION[expansion];

  const baseUrl = !subdomain ? `https://warcraftlogs.com/reports/` : `https://${subdomain}.warcraftlogs.com/reports/`;

  // Create the URL with the provided expression and options
  const url = `${baseUrl}${logId}#boss=-3&difficulty=0&type=damage-taken&pins=2%24Off%24%23244F4B%${filter ? `24expression%24${encodeURIComponent(filter)}` : ""}&options=${options}&cutoff=${WIPES_CUT_OFF}`;
  const { data: shortenedUrl } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);

  return shortenedUrl;
}

export async function createDmgDoneUrl(logId: string, filter: string, expansion: string): Promise<string> {
  const subdomain = SUB_DOMAINS_TO_EXPANSION[expansion];
  const baseUrl = !subdomain ? `https://warcraftlogs.com/reports/` : `https://${subdomain}.warcraftlogs.com/reports/`;

  const encodedExpression = encodeURIComponent(filter);
  const url = `${baseUrl}${logId}#boss=-3&difficulty=0&cutoff=${WIPES_CUT_OFF}&pins=2%24Off%24%23244F4B%${filter ? `24expression%24${encodedExpression}` : ""}`;

  const { data: shortenedUrl } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);

  return shortenedUrl;
}

export function getValidFights(fights: Fight[]): Fight[] {
  return fights.filter((fight) => !(fight.startTime === 0 && fight.endTime === 0));
}

export function calculateRaidDuration(fights: Fight[]): number {
  if (fights.length === 0) return 0;
  return (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;
}

export async function fetchTotalCasts(logId: string, startTime: number, endTime: number) {
  const data = await fetchWarcraftLogsData(totalCastsQuery, {
    logId,
    startTime,
    endTime,
  });

  return data.reportData.report.table.data.entries;
}

export async function fetchDispels(logId: string, startTime: number, endTime: number) {
  const data = await fetchWarcraftLogsData(dispelsQuery, {
    logId,
    startTime,
    endTime,
  });

  return data.reportData.report.table.data.entries[0].entries[0];
}

export async function fetchBuffsData(logId: string, startTime: number, endTime: number, filterExpression: string) {
  const data = await fetchWarcraftLogsData(buffsQuery, {
    logId,
    startTime,
    endTime,
    filterExpression,
  });

  return data.reportData.report.events.data as BuffEvent[];
}

export async function getGuildLogs(guildID = 475769, startTime = 1731024000000, endTime = new Date().getTime()) {
  const allReports: RaidData[] = [];
  let currentPage = 1;

  while (true) {
    const variables = {
      guildID,
      page: currentPage,
      startTime,
      endTime,
    };

    const data = await fetchWarcraftLogsData(guildLogs, {
      ...variables,
    });
    const reports = data.reportData.reports.data;
    allReports.push(...reports);

    if (!data.reportData.reports.has_more_pages) {
      break;
    }

    currentPage++;
  }
  return allReports;
}
