import { generateChart } from "../charts/chart";
import {
  BuffEvent,
  CATA_GLOVES_USAGE,
  CLASS_COLORS,
  classIcons,
  DAMAGE_SCHOOL_COLORS,
  EXPANSIONS,
  Fight,
  PlayerMap,
  POTIONS_QUERY_BY_EXPANSION,
  TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
  TOP_DMG_TAKEN_CHART_DESCRIPTION,
  TOP_DMG_TAKEN_CHART_TITLE,
  TOP_DPS_CHART_DESCRIPTION,
  TOP_DPS_CHART_TITLE,
} from "../constants";
import {
  extractNameFromTricks,
  formatDuration,
  formatRaidDate,
  numberWithCommas,
  sortByValueAscending,
  sortByValueDescending,
  sortObjectByValueDesc,
} from "../utils";
import {
  calculateRaidDuration,
  createDmgDoneUrl,
  fetchBuffsData,
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
  expansion: EXPANSIONS,
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
  const potionsUsage: { [key: string]: number } = {};
  const glovesUsage: { [key: string]: number } = {};
  const potionFilter = POTIONS_QUERY_BY_EXPANSION[expansion];

  // Filter out invalid fights in advance
  const validFights = getValidFights(fights);
  const raidDuration = calculateRaidDuration(validFights);

  const alysrazorFight = validFights.find(
    (fight) => fight.name === "Alysrazor" && (fight.kill === true || fight.kill === null),
  );

  const alysrazorBuffs =
    expansion === EXPANSIONS.CATA && alysrazorFight
      ? await fetchBuffsData(logId, alysrazorFight?.startTime!, alysrazorFight?.endTime!, "ability.id IN(99461)")
      : [];

  const alyszrazorStacksData = calculateStackTimes(alysrazorBuffs, playerMap, alysrazorFight?.startTime!);
  const sortedAlysrazorsortByValueDescending = sortByValueAscending(alyszrazorStacksData);

  let alysrazorBuffSummary = "";

  sortedAlysrazorsortByValueDescending.forEach((playerName, i) => {
    const top3Index = [0, 1, 2];
    alysrazorBuffSummary += top3Index.includes(i)
      ? `${i + 1}) ${playerName} : ${formatDuration(alyszrazorStacksData[playerName])} \n`
      : `${playerName} : ${formatDuration(alyszrazorStacksData[playerName])} \n`;
  });

  // Fetch all data for each fight concurrently
  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime, kill, id: fightId } = fight;

      const [dmgDoneData, dmgTakenData, deathAndWipeData, potionsUsageData] = await Promise.all([
        fetchDamageData(logId, startTime, endTime, dmgDoneFilterExpression),
        fetchDamageTakenData(logId, fightId, dmgTakenFilterExpression),
        fetchDeathsAndWipes(logId, startTime, endTime),
        fetchBuffsData(logId, startTime, endTime, potionFilter),
      ]);

      // Process damage done
      dmgDoneData?.data?.entries.forEach((entry: any) => {
        const playerName = `${entry.name}_${entry.type}`;
        if (entry.name === "Kalecgos") {
          return;
        }
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

      const markedBuffsEvents: Record<string, boolean> = {};

      processBuffUsage(Object.values(potionsUsageData), potionsUsage, markedBuffsEvents, playerMap);

      const glovesUsageData =
        expansion === EXPANSIONS.CATA ? await fetchBuffsData(logId, startTime, endTime, CATA_GLOVES_USAGE) : [];

      processBuffUsage(Object.values(glovesUsageData), glovesUsage, markedBuffsEvents, playerMap);

      // Increment total wipes if fight was not a kill
      if (kill === false) {
        totalWipes++;
      }
    }),
  );

  // Sorting and grouping
  const sortedDamageTaken = sortByValueDescending(playerDamageTaken);
  const sortedDamageDealers = sortByValueDescending(playerDamage);
  const sortedPotionsUsage = sortByValueDescending(potionsUsage);
  const sortedGlovesUsage = sortByValueDescending(glovesUsage);

  const groupedByClass: { [classType: string]: string[] } = {};

  sortedDamageTaken.forEach((player) => {
    const [playerName, playerClass] = player.split("_");
    if (!groupedByClass[playerClass]) groupedByClass[playerClass] = [];
    groupedByClass[playerClass].push(playerName);
  });

  const dmgDealtToChart: { name: string; total: number; color: string }[] = [];
  const dmgTakenDataToChart: { name: string; total: number; color: string }[] = [];
  const dmgTakenByAbilityChartData: { name: string; total: number; color: string }[] = [];
  const potionsUsageChartData: { name: string; total: number; color: string }[] = [];
  const glovesUsageChartData: { name: string; total: number; color: string }[] = [];
  const tricksDmgChartData: { name: string; total: number; color: string }[] = [];

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

  sortedDamageDealers
    .filter((char) => char.includes("_TricksOfTheTrade"))
    .map((tricksDamage) => {
      const playerName = `${extractNameFromTricks(tricksDamage)}`;

      tricksDmgChartData.push({
        name: `${playerName}`,
        total: playerDamage[tricksDamage],
        color: CLASS_COLORS["Rogue"],
      });
    });

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

  sortedPotionsUsage.forEach((player) => {
    let playerNameWithClass: string;
    playerNameWithClass = Object.keys(playerDamage).find(
      (name) => name.includes(player) && !name.includes("_TricksOfTheTrade"),
    )!;
    if (!playerNameWithClass) {
      playerNameWithClass = Object.keys(playerDamageTaken).find((name) => name.includes(player))!;
    }
    if (!playerNameWithClass) {
      return;
    }
    const [, playerClass] = playerNameWithClass.split("_");

    potionsUsageChartData.push({
      name: `${player}`,
      total: potionsUsage[player],
      color: CLASS_COLORS[playerClass],
    });
  });

  sortedGlovesUsage.forEach((player) => {
    let playerNameWithClass: string;
    playerNameWithClass = Object.keys(playerDamage).find(
      (name) => name.includes(player) && !name.includes("_TricksOfTheTrade"),
    )!;

    if (!playerNameWithClass) {
      playerNameWithClass = Object.keys(playerDamageTaken).find((name) => name.includes(player))!;
    }

    if (!playerNameWithClass) {
      return;
    }

    const [, playerClass] = playerNameWithClass.split("_");

    glovesUsageChartData.push({
      name: `${player}`,
      total: glovesUsage[player],
      color: CLASS_COLORS[playerClass],
    });
  });

  const potionUsageChart = await generateChart(potionsUsageChartData, "Potions usage", "Potions usage");
  const glovesUsageChart = await generateChart(glovesUsageChartData, "Gloves usage", "Gloves usage");
  const tricksDmgChart = await generateChart(tricksDmgChartData, "Tricks damage", "Tricks damage");

  const dmgChart = await generateChart(dmgDealtToChart, TOP_DPS_CHART_TITLE, TOP_DPS_CHART_DESCRIPTION);

  const dmgTakenChart = await generateChart(
    dmgTakenDataToChart,
    TOP_DMG_TAKEN_CHART_TITLE,
    TOP_DMG_TAKEN_CHART_DESCRIPTION,
  );

  const dmgTakenByAbilityChart =
    expansion !== EXPANSIONS.RETAIL &&
    (await generateChart(
      dmgTakenByAbilityChartData,
      TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
      TOP_DMG_TAKEN_BY_ABILITY_CHART_TITLE,
    ));

  const sortedDeaths = sortByValueDescending(playerDeaths);
  const deathsSummary = sortedDeaths
    .slice(0, 5)
    .map((player) => {
      const [playerName] = player.split("_");
      return `${playerName}: ${playerDeaths[player]}`;
    })
    .join("\n");

  const formattedDate = formatRaidDate(raidStartTime);
  // **\n**Roster**\n${raidRoster}\n
  const WclUrl = await generateWarcraftLogsUrl(logId, dmgTakenFilterExpression, 38, expansion);
  const dmgDoneUrl = await createDmgDoneUrl(logId, dmgDoneFilterExpression, expansion);
  const string = `
**${title}** - ${formattedDate} - ${dmgDoneUrl}

**Raid Duration**: ${formatDuration(raidDuration)}
**Total Damage Done**: ${numberWithCommas(totalDamage)}
**Total Avoidable Damage Taken**: ${numberWithCommas(totalDamageTaken)}
**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}

**Top 10 DPS**:\n${dmgDealersSummary}

**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}

**Deaths by Player (top 5)**:
${deathsSummary}

**Damage Taken Log breakdown** ${WclUrl}`;
  return {
    string,
    charts: [
      dmgChart,
      dmgTakenChart,
      dmgTakenByAbilityChart,
      potionUsageChart,
      ...(expansion === EXPANSIONS.CATA ? [glovesUsageChart, tricksDmgChart] : []),
    ],
  };
}

const processBuffUsage = (
  data: BuffEvent[],
  usageMap: { [key: string]: number },
  markedEvents: Record<string, boolean>,
  playerMap: Record<number, string>,
) => {
  data.forEach((entry) => {
    const playerName = playerMap[entry.targetID];
    const playerKey = `${playerName}_${entry.abilityGameID}`;

    if (!usageMap[playerName]) {
      usageMap[playerName] = 0;
    }

    if (entry.type === "applybuff") {
      if (!markedEvents[playerKey]) {
        usageMap[playerName]++;
        markedEvents[playerKey] = true;
      }
    } else if (entry.type === "removebuff") {
      if (markedEvents[playerKey]) {
        markedEvents[playerKey] = false;
      } else {
        usageMap[playerName]++;
      }
    }
  });
};

export const calculateStackTimes = (events: BuffEvent[], playerMap: PlayerMap, startTimestamp: number) => {
  const stackEndTimes: { [key: number]: number } = {}; // Stores the end timestamp when reaching 25 stacks of 99461
  const stackTimes: { [key: string]: number } = {}; // Stores the stack times per player

  events.forEach((event) => {
    const { targetID, abilityGameID, timestamp, stack } = event;

    if (abilityGameID === 99461) {
      if (stack === 25 && !(targetID in stackEndTimes)) {
        stackEndTimes[targetID] = timestamp; // Record end time when reaching 25 stacks
      }
    }
  });

  // Calculate time taken for each player to reach from 3 stacks of 97128 to 25 stacks of 99461
  Object.keys(stackEndTimes).forEach((targetID) => {
    const endTimestamp = stackEndTimes[Number(targetID)];

    if (startTimestamp && endTimestamp) {
      const timeToStack = endTimestamp - startTimestamp;
      const playerName = playerMap[Number(targetID)] || "Unknown";
      stackTimes[playerName] = timeToStack / 1000;
    }
  });

  return stackTimes;
};
