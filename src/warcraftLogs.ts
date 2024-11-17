import axios from "axios";
import {
  eventsQuery,
  fightsQuery,
  playerInfoQuery,
  tableQuery,
  tableQueryDamageTaken,
} from "./queries";
import { PlayerMap } from "./constants";

let accessToken: string | null = null;

export async function authenticateWarcraftLogs() {
  try {
    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");

    const response = await axios.post(
      "https://www.warcraftlogs.com/oauth/token",
      data,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`,
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    accessToken = response.data.access_token;
    console.log("Authenticated with Warcraft Logs API");
  } catch (error) {
    console.error("Failed to authenticate with Warcraft Logs:", error);
  }
}

// Function to get the access token (you might already have this from before)
export function getAccessToken(): string | null {
  if (!accessToken) {
    console.error("Access token is missing.");
    return null;
  }
  return accessToken;
}

// Reusable function for sending fetch requests to Warcraft Logs API
async function fetchWarcraftLogsData(query: string, variables: any) {
  if (!accessToken) {
    console.error("Access token is missing.");
    return null;
  }

  try {
    const response = await axios.post(
      "https://www.warcraftlogs.com/api/v2/client",
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

// Refactor fetch methods to use the reusable function

export async function fetchFights(logId: string): Promise<any> {
  const data = await fetchWarcraftLogsData(fightsQuery, { logId });
  return data?.reportData.report || null;
}

export async function fetchDamageData(
  logId: string,
  startTime: number,
  endTime: number,
): Promise<any> {
  const data = await fetchWarcraftLogsData(tableQuery, {
    logId,
    startTime,
    endTime,
  });
  return data?.reportData.report.table || null;
}

export async function fetchDamageTakenData(
  logId: string,
  fightID: number,
  filterExpression?: string,
): Promise<any> {
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
        const totalReducedExists =
          ability.totalReduced || ability.totalReduced === 0;
        return {
          ...entry,
          total: (entry.total += totalReducedExists
            ? ability.totalReduced
            : ability.total),
        };
      });
    });
    return { data: { entries: allEntries } };
  }

  return { data: { entries: [] } };
}

export async function fetchDeathsAndWipes(
  logId: string,
  startTime: number,
  endTime: number,
): Promise<any> {
  const data = await fetchWarcraftLogsData(eventsQuery, {
    logId,
    startTime,
    endTime,
  });
  return data?.reportData.report || null;
}

export async function fetchPlayerInfo(logId: string): Promise<PlayerMap> {
  const data = await fetchWarcraftLogsData(playerInfoQuery, { logId });
  const players = data.reportData.report.masterData.actors;
  const playerMap: { [id: number]: string } = {};
  players.forEach((player: any) => {
    playerMap[player.id] = player.name;
  });
  return playerMap;
}

export async function generateWarcraftLogsUrl(
  logId: string,
  filter: string,
  options = 38,
) {
  const baseUrl = "https://classic.warcraftlogs.com/reports/";

  // Create the URL with the provided expression and options
  const url = `${baseUrl}${logId}#boss=-3&difficulty=0&type=damage-taken&pins=2%24Off%24%23244F4B%24expression%24${encodeURIComponent(filter)}&options=${options}&cutoff=6`;
  const { data: shortenedUrl } = await axios.get(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
  );

  return shortenedUrl;
}
