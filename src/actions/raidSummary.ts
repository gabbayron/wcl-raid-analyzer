import { classIcons, DMG_DONE_FILTER, Fight } from "../constants";
import { formatDuration, formatRaidDate, numberWithCommas, sortByValueDescending } from "../utils";
import {
  calculateRaidDuration,
  createDmgDoneUrl,
  fetchDamageData,
  fetchDamageTakenData,
  fetchDeathsAndWipes,
  fetchFights,
  fetchPlayerInfo,
  generateWarcraftLogsUrl,
  getValidFights,
} from "../warcraftLogs";

export async function generateRaidSummary(logId: string, dmgTakenFilterExpression: string) {
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
