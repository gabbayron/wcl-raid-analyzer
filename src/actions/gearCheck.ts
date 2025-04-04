import {
  Fight,
  ITEM_SLOTS,
  WEAPONS_SLOTS,
  PlayerDetails,
  GENERAL_GEAR_SLOT_TO_CHECK,
  WEAPONS_SLOTS_STRING,
  PHYSICAL_GEAR_SLOT_TO_CHECK,
  POSSIBLE_ENCHANTS,
  WRIST_POSSIBLE_ENCHANT,
  CHEST_3_STATS,
} from "../constants";
import { sortByValueDescending } from "../utils";
import { fetchCasts, fetchDispels, fetchFights, fetchTotalCasts, getValidFights } from "../warcraftLogs";

const NONE_ENCHANT = "**None ❌**";

interface PlayerData {
  [slot: string]: {
    enchant?: string;
    sharpeningStone?: string;
    class?: string;
  };
}

export async function generateGearCheck(logId: string, expansion: string, strictCheck: boolean): Promise<string> {
  const playersData: { [name: string]: PlayerData } = {};
  const sundersByPlayer: { [key: string]: number } = {};
  const dispelsByPlayer: { [key: string]: number } = {};
  const warriors: Set<string> = new Set();

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
    if (entry.type === "Warrior") {
      warriors.add(entry.name);
    }
    if (entry.type === "Warrior" || entry.type === "Rogue") {
      entry.gear.forEach((item) => {
        const isWeaponSlot = WEAPONS_SLOTS.includes(item.slot);
        if (isWeaponSlot) {
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
    entry.gear.forEach((item) => {
      const shouldCheckSlot = GENERAL_GEAR_SLOT_TO_CHECK.includes(item.slot);
      const noEnchant = !item.permanentEnchantName;
      if (shouldCheckSlot && noEnchant) {
        playersData[entry.name] = {
          ...playersData[entry.name],
          [ITEM_SLOTS[item.slot]]: {
            enchant: NONE_ENCHANT,
          },
        };
      }
    });

    if (strictCheck) {
      entry.gear.forEach((item) => {
        const isChest = 4 === item.slot;
        const noEnchant = !item.permanentEnchantName;
        const badEnchant = CHEST_3_STATS === item.permanentEnchantName;
        if (isChest && (noEnchant || badEnchant)) {
          playersData[entry.name] = {
            ...playersData[entry.name],
            [ITEM_SLOTS[item.slot]]: {
              enchant: badEnchant ? item.permanentEnchantName : NONE_ENCHANT,
            },
          };
        }
      });
    }

    if (entry.type === "Warrior" && strictCheck) {
      entry.gear.forEach((item) => {
        const isWrist = 8 === item.slot;
        const noEnchant = !item.permanentEnchantName;
        const badEnchant = !WRIST_POSSIBLE_ENCHANT.includes(item.permanentEnchantName!);
        if (isWrist && (noEnchant || badEnchant)) {
          playersData[entry.name] = {
            ...playersData[entry.name],
            [ITEM_SLOTS[item.slot]]: {
              enchant: badEnchant ? item.permanentEnchantName : NONE_ENCHANT,
            },
          };
        }
      });
    }

    if (entry.type === "Warrior" || entry.type === "Rogue" || entry.type === "Hunter") {
      entry.gear.forEach((item) => {
        const shouldCheckSlot = PHYSICAL_GEAR_SLOT_TO_CHECK.includes(item.slot);
        const noEnchant = !item.permanentEnchantName;
        if (shouldCheckSlot && noEnchant) {
          playersData[entry.name] = {
            ...playersData[entry.name],
            [ITEM_SLOTS[item.slot]]: {
              enchant: NONE_ENCHANT,
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
      const castsData = await fetchCasts(logId, startTime, endTime);
      castsData.forEach((entry: any) => {
        const playerName = `${entry.name}`;
        sundersByPlayer[playerName] = (sundersByPlayer[playerName] || 0) + entry.total;
      });
    }),
  );

  const formattedPlayerData = processPlayerData(playersData, strictCheck, warriors);

  const sortedSunders = sortByValueDescending(sundersByPlayer);
  const sortedDispels = sortByValueDescending(dispelsByPlayer);

  const sundersSummary = sortedSunders
    .map((playerName) => {
      if (warriors.has(playerName)) {
        warriors.delete(playerName);
        return `${playerName}: ${sundersByPlayer[playerName]}`;
      }
    })
    .join("\n");
  const noWarriorsSunders: string[] = [];
  warriors.forEach((warriorName) => {
    noWarriorsSunders.push(`${warriorName}: :Starege:  **0** :Starege: `);
  });

  const dispelsSummary: string[] = [];

  sortedDispels.forEach(
    (playerName) =>
      dispelsByPlayer[playerName] > 2 && dispelsSummary.push(`${playerName}: ${dispelsByPlayer[playerName]}`),
  );

  return `${formattedPlayerData} \n\n**__Effective Sunders__**:\n${sundersSummary}\n${noWarriorsSunders.join("\n")}\n\n**__Dispels__**:\n${dispelsSummary.join("\n")}`;
}

function formatItemSlot(slot: string, data: { enchant?: string; sharpeningStone?: string }): string {
  const isCrusader = data.enchant === "Crusader";
  const isNoneEnchant = data.enchant === NONE_ENCHANT;
  const enchantDisplayName = isCrusader || isNoneEnchant ? data.enchant : `:Starege:  **${data.enchant}**`;
  let formatted = `${isCrusader ? "" : `${slot.charAt(0).toUpperCase() + slot.slice(1)} : Enchant - ${enchantDisplayName}`}`;

  // Include sharpening stone/poison check for off-hand weapon slots
  if (slot === ITEM_SLOTS[16] && data.sharpeningStone === NONE_ENCHANT) {
    formatted += `${isCrusader ? `${slot.charAt(0).toUpperCase() + slot.slice(1)}: Sharpening Stone/Poison - ${data.sharpeningStone}` : `\nSharpening Stone/Poison - ${data.sharpeningStone}`}`;
  }

  return formatted;
}

function formatHeadOrLegSlot(slot: string, data: { enchant?: string; sharpeningStone?: string }) {
  const isNoneEnchant = data.enchant === NONE_ENCHANT;
  if (isNoneEnchant) {
    return `${slot.charAt(0).toUpperCase() + slot.slice(1)} enchant :${NONE_ENCHANT}\n`;
  }
  if (!POSSIBLE_ENCHANTS.includes(data.enchant!)) {
    return `${slot.charAt(0).toUpperCase() + slot.slice(1)} : Enchant - ${data.enchant!}\n`;
  }
}

function processPlayerData(
  players: { [name: string]: PlayerData },
  strictCheck: boolean,
  warriors: Set<string>,
): string {
  let result = "";

  for (const playerName in players) {
    const player = players[playerName];
    let playerResult = `**${playerName}:**\n`;

    for (const slot in player) {
      const slotData = player[slot];
      const isCrusader = slotData.enchant === "Crusader";
      const isWeaponSlot = WEAPONS_SLOTS_STRING.includes(slot); // Check if the slot is for weapons
      const isMissingEnchant = slotData.enchant === NONE_ENCHANT;
      const isOffHand = slot === ITEM_SLOTS[16];
      const isMissingStoneOrPoison = isOffHand && slotData.sharpeningStone === NONE_ENCHANT;
      const isLegOrHead = slot === ITEM_SLOTS[0] || slot === ITEM_SLOTS[6];

      // For weapon slots: only show if enchant is missing, sharpening stone/poison is missing, or enchant isn't Crusader
      if (isWeaponSlot && (isMissingEnchant || isMissingStoneOrPoison || !isCrusader)) {
        playerResult += `${formatItemSlot(slot, slotData)}\n`;
      }
      // For non-weapon slots: always display the slot
      else if (!isWeaponSlot && !isLegOrHead) {
        playerResult += `${formatItemSlot(slot, slotData)}\n`;
      }
      if (isLegOrHead && strictCheck) {
        playerResult += formatHeadOrLegSlot(slot, slotData);
      }
    }

    if (playerResult !== `**${playerName}:**\n`) {
      result += playerResult + "\n"; // Add player details for all slots
    }
  }

  return result.trim();
}
