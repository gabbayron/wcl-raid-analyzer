import { classIcons, EXPLOSIVES_FILTER, Fight, PlayerMap } from "../constants";
import { fetchRaidRoster } from "../google-auth/google-api-";
import {
  formatDuration,
  formatRaidDate,
  numberWithCommas,
  sortByValueAscending,
  sortByValueDescending,
} from "../utils";
import { fetchBuffsData, fetchDamageData, fetchFights, fetchPlayerInfo, getValidFights } from "../warcraftLogs";
import { calculateStackTimes } from "./raidSummary";

export async function generateWeeklyEssentialsRaidSummary(logIds: string[]) {
  const raidSummaries = [];

  await fetchRaidRoster();

  const raidsData: {
    code: string;
    fights: Fight[];
    title: string;
    startTime: number;
    endTime: number;
  }[] = await Promise.all(logIds.map((logId) => fetchFights(logId)));

  const playersPerLog: { [logId: string]: PlayerMap } = {};

  await Promise.all(
    logIds.map(async (logId) => {
      const data = await fetchPlayerInfo(logId);
      playersPerLog[logId] = data;
    }),
  );

  for (let i = 0; i < raidsData.length; i++) {
    const playerDamage: { [key: string]: number } = {};

    const { fights, title, startTime: raidStartTime, endTime: raidEndTime, code } = raidsData[i];
    let alysrazorBuffSummary = "";

    if (!fights || fights.length === 0) continue;

    // Filter out invalid fights where startTime and endTime are both 0
    const validFights = getValidFights(fights);

    if (validFights.length > 0) {
      const alysrazorFight = validFights.find((fight) => fight.name === "Alysrazor" && fight.kill === true);
      const alysrazorBuffs = await fetchBuffsData(
        code,
        alysrazorFight?.startTime!,
        alysrazorFight?.endTime!,
        "ability.id IN(99461)",
      );

      const alyszrazorStacksData = calculateStackTimes(alysrazorBuffs, playersPerLog[code], alysrazorFight?.startTime!);
      const sortedAlysrazorsortByValueDescending = sortByValueAscending(alyszrazorStacksData);

      sortedAlysrazorsortByValueDescending.forEach((playerName, i) => {
        const top3Index = [0, 1, 2];
        alysrazorBuffSummary += top3Index.includes(i)
          ? `${i + 1}) ${playerName} : ${formatDuration(alyszrazorStacksData[playerName])} \n`
          : `${playerName} : ${formatDuration(alyszrazorStacksData[playerName])} \n`;
      });

      await Promise.all(
        validFights.map(async (fight) => {
          const { startTime, endTime, kill, id: fightId } = fight;
          if (kill === false) {
            return;
          }
          const dmgDoneData = await fetchDamageData(code, startTime, endTime, EXPLOSIVES_FILTER);
          dmgDoneData?.data?.entries.forEach((entry: any) => {
            const playerName = `${entry.name}_${entry.type}`;
            playerDamage[playerName] = (playerDamage[playerName] || 0) + entry.total;
          });
        }),
      );
    }
    const sortedDamageDealers = sortByValueDescending(playerDamage);
    const dmgDealersSummary = sortedDamageDealers
      .map((player) => {
        const [playerName, playerClass] = player.split("_");

        return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamage[player])}`;
      })
      .join("\n");
    const formattedDate = formatRaidDate(raidStartTime);

    raidSummaries.push(
      `**${title} - ${formattedDate}**\n\n**Alysrazor 25 stacks timer** : \n${alysrazorBuffSummary}\n\n**Explosives Damage**:\n${dmgDealersSummary}\n`,
    );
  }

  return `${raidSummaries.join("\n")}`;
}
