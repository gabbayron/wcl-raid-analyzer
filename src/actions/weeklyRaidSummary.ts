import { Fight, PlayerMap } from "../constants";
import { formatDuration, formatRaidDate, getKeyByCharacterName } from "../utils";
import {
  calculateRaidDuration,
  fetchDeathsAndWipes,
  fetchFights,
  fetchPlayerInfo,
  getValidFights,
} from "../warcraftLogs";

export async function generateWeeklyRaidSummary(logIds: string[]) {
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

  const sortedPlayersByRatio = Object.keys(deathsByPlayer)
    .map((key) => ({
      player: key,
      deaths: deathsByPlayer[key],
      splits: raidsPerPlayer[key] || 1, // Avoid division by zero
      ratio: deathsByPlayer[key] / (raidsPerPlayer[key] || 1),
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const sortedDeathsByPlayersString = sortedPlayersByRatio
    .map(
      ({ player, deaths, splits, ratio }) =>
        `**${player}**: ${deaths} Deaths, ${splits} Splits, **Ratio: ${ratio.toFixed(2)}**`,
    )
    .join("\n");

  return `**Weekly Raid Summary**\n${raidSummaries.join("\n")}\n**Average Raid Duration**: ${formatDuration(averageDuration)}\n**Average Deaths per Raid**: ${averageDeaths.toFixed(0)}\n**Total amount of raids:** ${raidSummaries.length}\n\n**Deaths/Splits Ratio**:\n${sortedDeathsByPlayersString}`;
}
