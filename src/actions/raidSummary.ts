import { generateChart } from "../charts/chart";
import {
  CLASS_COLORS,
  classIcons,
  DAMAGE_SCHOOL_COLORS,
  Fight,
  TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
  TOP_DMG_TAKEN_CHART_DESCRIPTION,
  TOP_DMG_TAKEN_CHART_TITLE,
  TOP_DPS_CHART_DESCRIPTION,
  TOP_DPS_CHART_TITLE,
} from "../constants";
import {
  formatDuration,
  formatRaidDate,
  numberWithCommas,
  sortByValueDescending,
  sortObjectByValueDesc,
} from "../utils";
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

export async function generateRaidSummary(
  logId: string,
  dmgTakenFilterExpression: string,
  dmgDoneFilterExpression: string,
  expansion: string,
) {
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
  const dmgTakenByAbility: { [key: string]: number } = {};

  // Filter out invalid fights in advance
  const validFights = getValidFights(fights);
  const raidDuration = calculateRaidDuration(validFights);

  // const data = await fetchGear(logId);

  // Fetch all data for each fight concurrently
  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime, kill, id: fightId } = fight;

      const [dmgDoneData, dmgTakenData, deathAndWipeData] = await Promise.all([
        fetchDamageData(logId, startTime, endTime, dmgDoneFilterExpression),
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
        entry.abilities.forEach(
          ({
            name,
            total,
            totalReduced,
            type,
          }: {
            name: string;
            total: number;
            totalReduced: number;
            type: number;
          }) => {
            const indexedName = `${name}_${type}`;
            if (dmgTakenByAbility[indexedName]) {
              dmgTakenByAbility[indexedName] += totalReduced || total;
            } else {
              dmgTakenByAbility[indexedName] = totalReduced || total;
            }
          },
        );
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

  const dmgDealtToChart: { name: string; total: number; color: string }[] = [];
  const dmgTakenDataToChart: { name: string; total: number; color: string }[] = [];
  const dmgTakenByAbilityChartData: { name: string; total: number; color: string }[] = [];

  const sortedDmgTakenByAbility = sortObjectByValueDesc(dmgTakenByAbility);

  for (const [key, value] of Object.entries(sortedDmgTakenByAbility)) {
    const [name, type] = key.split("_");
    dmgTakenByAbilityChartData.push({
      name,
      total: value,
      color: DAMAGE_SCHOOL_COLORS[type] || "red",
    });
  }

  // Summaries
  const raidRoster = Object.entries(groupedByClass)
    .map(([playerClass, players]) => `${classIcons[playerClass]} ${playerClass}: ${players.join(", ")}`)
    .join("\n");

  const dmgDealersSummary = sortedDamageDealers
    .slice(0, 10)
    .map((player) => {
      const [playerName, playerClass] = player.split("_");

      dmgDealtToChart.push({
        name: `${playerName}`,
        total: playerDamage[player],
        color: CLASS_COLORS[playerClass],
      });

      return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamage[player])}`;
    })
    .join("\n");

  const dmgTakenSummary = sortedDamageTaken
    .slice(0, 10)
    .map((player) => {
      const [playerName, playerClass] = player.split("_");
      dmgTakenDataToChart.push({
        name: `${playerName}`,
        total: playerDamageTaken[player],
        color: CLASS_COLORS[playerClass],
      });

      return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamageTaken[player])}`;
    })
    .join("\n");

  const dmgChart = await generateChart(dmgDealtToChart, TOP_DPS_CHART_TITLE, TOP_DPS_CHART_DESCRIPTION);

  const dmgTakenChart = await generateChart(
    dmgTakenDataToChart,
    TOP_DMG_TAKEN_CHART_TITLE,
    TOP_DMG_TAKEN_CHART_DESCRIPTION,
  );

  const dmgTakenByAbilityChart = await generateChart(
    dmgTakenByAbilityChartData,
    TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
    TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
  );

  const sortedDeaths = sortByValueDescending(playerDeaths);
  const deathsSummary = sortedDeaths
    .slice(0, 5)
    .map((player) => {
      const [playerName] = player.split("_");
      return `${playerName}: ${playerDeaths[player]}`;
    })
    .join("\n");

  const formattedDate = formatRaidDate(raidStartTime);

  const WclUrl = await generateWarcraftLogsUrl(logId, dmgTakenFilterExpression, 38, expansion);
  const dmgDoneUrl = await createDmgDoneUrl(logId, dmgDoneFilterExpression, expansion);
  const string = `**${title} - ${formattedDate} - ${dmgDoneUrl}\n**\n**Roster**\n${raidRoster}\n\n**Raid Duration**: ${formatDuration(raidDuration)}\n**Total Damage Done**: ${numberWithCommas(totalDamage)}\n**Total Avoidable Damage Taken**: ${numberWithCommas(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}\n\n**Top 10 DPS**:\n${dmgDealersSummary}\n\n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}\n\n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${WclUrl}\n\n`;
  return { string, charts: [dmgChart, dmgTakenChart, dmgTakenByAbilityChart] };
}
