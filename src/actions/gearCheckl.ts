import { Fight, ITEM_SLOTS, ITEM_SLOTS_TO_CHECK, PlayerDetails } from "../constants";
import { sortByValueDescending } from "../utils";
import { fetchCasts, fetchDispels, fetchFights, fetchTotalCasts, getValidFights } from "../warcraftLogs";

const NONE_ENCHANT = "**None ❌**";

interface PlayerData {
  [slot: string]: {
    enchant: string;
    sharpeningStone?: string;
  };
}

export async function generateGearCheck(logId: string, expansion: string): Promise<string> {
  const playersData: { [key: string]: PlayerData } = {};
  const sundersByPlayer: { [key: string]: number } = {};
  const dispelsByPlayer: { [key: string]: number } = {};

  const raidData = await fetchFights(logId);

  const { fights } = raidData as { fights: Fight[]; title: string; startTime: number };
  if (!fights || fights.length === 0) {
    return "No fights found for this log.";
  }

  const validFights = getValidFights(fights);
  const firstFight = validFights.find((fight) => fight.kill === true || fight.kill === false);

  if (!firstFight) {
    return "No fight match";
  }

  const { startTime, endTime } = firstFight;
  const generalCastsData = await fetchTotalCasts(logId, startTime, endTime);
  generalCastsData.forEach((entry: PlayerDetails) => {
    if (entry.type === "Warrior" || entry.type === "Rogue") {
      entry.gear.forEach((item) => {
        const shouldCheckSlot = ITEM_SLOTS_TO_CHECK.includes(item.slot);
        if (shouldCheckSlot) {
          const isOffHand = item.slot === 16;
          playersData[entry.name] = {
            ...playersData[entry.name],
            [ITEM_SLOTS[item.slot]]: {
              enchant: item.permanentEnchantName || NONE_ENCHANT,
              ...(isOffHand && { sharpeningStone: item.temporaryEnchantName || NONE_ENCHANT }),
            },
          };
        }
      });
    }
  });

  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime } = fight;

      const dispelsData = await fetchDispels(logId, startTime, endTime);
      if (dispelsData?.details) {
        dispelsData.details.forEach((entry: any) => {
          const playerName = `${entry.name}`;
          dispelsByPlayer[playerName] = (dispelsByPlayer[playerName] || 0) + entry.total;
        });
      }
    }),
  );

  await Promise.all(
    validFights.map(async (fight) => {
      const { startTime, endTime } = fight;
      const castsData = await fetchCasts(logId, startTime, endTime, expansion);
      castsData.forEach((entry: any) => {
        const playerName = `${entry.name}`;
        sundersByPlayer[playerName] = (sundersByPlayer[playerName] || 0) + entry.total;
      });
    }),
  );

  const formattedPlayerData = processPlayerData(playersData);

  const sortedSunders = sortByValueDescending(sundersByPlayer);
  const sortedDispels = sortByValueDescending(dispelsByPlayer);

  const sundersSummary = sortedSunders.map((playerName) => `${playerName}: ${sundersByPlayer[playerName]}`).join("\n");
  const dispelsSummary = sortedDispels.map((playerName) => `${playerName}: ${dispelsByPlayer[playerName]}`).join("\n");

  return `${formattedPlayerData} \n\n**__Effective Sunders__**:\n${sundersSummary}\n\n**__Dispels__**:\n${dispelsSummary}`;
}

function formatItemSlot(slot: string, data: { enchant: string; sharpeningStone?: string }): string {
  const isCrusader = data.enchant === "Crusader";
  const isNoneEnchant = data.enchant === NONE_ENCHANT;
  const enchantDisplayName = isCrusader || isNoneEnchant ? data.enchant : `👀 **${data.enchant}**`;
  let formatted = `${slot.charAt(0).toUpperCase() + slot.slice(1)}: Enchant - ${enchantDisplayName}`;

  if (slot === ITEM_SLOTS[16]) {
    formatted += `\nSharpening Stone/Poison - ${data.sharpeningStone}`;
  }

  return formatted;
}

function processPlayerData(players: { [name: string]: PlayerData }): string {
  let result = "";

  for (const playerName in players) {
    const player = players[playerName];
    result += `**${playerName}:**\n`;
    for (const slot in player) {
      result += `${formatItemSlot(slot, player[slot])}\n`;
    }
    result += "\n";
  }

  return result.trim();
}
