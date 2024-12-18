import { Fight, FRESH_SELECTED_DEBUFFS } from "../constants";
import { fetchDebuffs, fetchFights, getValidFights } from "../warcraftLogs";

export async function generateDebuffsSummary(logId: string): Promise<string> {
  const encountersDebuffsUptime: { [key: string]: { totalTime: number; totalUptime: number } } = {};
  const trashDebuffsUptime: { [key: string]: { totalTime: number; totalUptime: number } } = {};

  const raidData = await fetchFights(logId);

  const { fights } = raidData as { fights: Fight[]; title: string; startTime: number };
  if (!fights || fights.length === 0) {
    return "No fights found for this log.";
  }
  let fightsTotalTime = 0;

  const validFights = getValidFights(fights);

  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime, kill } = fight;
      const debuffsEvents = await fetchDebuffs(logId, startTime, endTime);
      const isTrash = kill === null;
      const auras = debuffsEvents.data.auras;

      // Calculate uptime percentage for each debuff
      auras.forEach((aura: any) => {
        const debuffName = aura.name;
        const dataToUpdate = isTrash ? trashDebuffsUptime : encountersDebuffsUptime;

        const totalTime = debuffsEvents.data.totalTime;
        if (!isTrash) {
          fightsTotalTime += debuffsEvents.data.totalTime;
        }
        if (dataToUpdate[debuffName]) {
          dataToUpdate[debuffName].totalTime += totalTime;
          dataToUpdate[debuffName].totalUptime += aura.totalUptime;
        } else {
          dataToUpdate[debuffName] = { totalTime: 0, totalUptime: 0 };
          dataToUpdate[debuffName].totalTime = totalTime;
          dataToUpdate[debuffName].totalUptime += aura.totalUptime;
        }
      });
    }),
  );

  const encounters = calculateUptimePercentages(
    encountersDebuffsUptime,
    encountersDebuffsUptime["Faerie Fire"].totalTime,
  );
  const trash = calculateUptimePercentages(trashDebuffsUptime, trashDebuffsUptime["Faerie Fire"].totalTime);

  return `**__Debuffs uptime %__**\n\n**Encounters**:\n${encounters}\n\n**Trash**\n${trash}`;
}

const calculateUptimePercentages = (
  debuffs: Record<string, { totalTime: number; totalUptime: number }>,
  totalRaidTime: number,
) => {
  return Object.entries(debuffs)
    .filter(([name]) => FRESH_SELECTED_DEBUFFS.includes(name)) // Include only selected debuffs
    .map(([name, { totalTime, totalUptime }]) => ({
      name,
      percentage: (totalUptime / totalRaidTime) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage) // Sort by highest percentage
    .map(({ name, percentage }) => `${name}: ${percentage.toFixed(2)}%`)
    .join("\n");
};
