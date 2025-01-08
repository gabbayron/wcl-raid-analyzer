import { CacheType, Interaction } from "discord.js";
import { fetchAbsencesForDate, getAllCharacters } from "../google-auth/google-api-";
import { RAID_ROLES } from "../constants";

export async function handleCreateRaid(interaction: Interaction<CacheType>) {
  if (!interaction.isCommand()) return;

  const raidDate = interaction.options.get("raid_date")?.value as string;

  try {
    const availableCharacters = await getAllCharacters();
    const absenceData = await fetchAbsencesForDate(raidDate);

    // Flatten all characters into a single list with absolute names included
    const allCharacters = Object.entries(availableCharacters).flatMap(([absoluteName, characters]) =>
      characters.map((character) => ({
        ...character,
        absoluteName, // Add the absolute name from the key
      })),
    );

    // Create a set of absent or late players for quick lookup
    const absentPlayers = new Set(
      absenceData
        .filter((absence) => absence.status === "absent" || absence.status === "late")
        .map((absence) => absence.playerName),
    );

    // Filter characters to exclude absent/late players
    const filteredPool = allCharacters.filter((player) => !absentPlayers.has(player.absoluteName));

    const roster = assignRaidRoster(filteredPool);

    return interaction.followUp("Raid setup is being processed. Good luck!");
  } catch (error) {
    console.error("Error handling raid creation:", error);
    return interaction.followUp("An error occurred while creating the raid. Please try again.");
  }
}

export async function assignRaidRoster(
  filteredPool: { name: string; spec: string; rank: string; absoluteName: string }[],
) {
  const raidRoster: { role: string; name: string; spec: string }[] = [];
  const assignedAbsoluteNames = new Set<string>(); // To track assigned absolute names

  // Split the pool into roles
  const tanks = filteredPool.filter((player) => RAID_ROLES.Tanks.includes(player.spec));
  const healers = filteredPool.filter((player) => RAID_ROLES.Healers.includes(player.spec));
  const dps = filteredPool.filter((player) => RAID_ROLES.DPS.includes(player.spec));

  // Helper to prioritize players by rank
  const prioritizeByRank = (players: { name: string; spec: string; rank: string; absoluteName: string }[]) => {
    return players.sort((a, b) => {
      const rankOrder = ["main", "clone 1", "clone 2", "alt"];
      return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    });
  };

  // Assign tanks
  const prioritizedTanks = prioritizeByRank(tanks);
  for (const spec of ["Feral", "Blood"]) {
    const candidate = prioritizedTanks.find(
      (player) => player.spec === spec && !assignedAbsoluteNames.has(player.absoluteName),
    );
    if (candidate) {
      raidRoster.push({ role: "Tank", name: candidate.name, spec: candidate.spec });
      assignedAbsoluteNames.add(candidate.absoluteName);
    }
  }

  // Assign healers
  const prioritizedHealers = prioritizeByRank(healers);
  for (const spec of ["Holy-Paladin", "Holy-Paladin", "Discipline", "Restoration-Druid", "Restoration-Shaman"]) {
    const candidate = prioritizedHealers.find(
      (player) => player.spec === spec && !assignedAbsoluteNames.has(player.absoluteName),
    );
    if (candidate) {
      raidRoster.push({ role: "Healer", name: candidate.name, spec: candidate.spec });
      assignedAbsoluteNames.add(candidate.absoluteName);
    }
  }

  // Assign DPS
  const prioritizedDPS = prioritizeByRank(dps);
  const dpsOrder = ["Hunter", "Mage", "Unholy", "Warrior", "Rogue", "Warlock", "Balance", "Elemental"];

  for (const spec of dpsOrder) {
    const candidates = prioritizedDPS.filter(
      (player) => player.spec.includes(spec) && !assignedAbsoluteNames.has(player.absoluteName),
    );
    for (const candidate of candidates) {
      if (raidRoster.filter((entry) => entry.spec === candidate.spec).length < getMaxPerSpec(candidate.spec)) {
        raidRoster.push({ role: "DPS", name: candidate.name, spec: candidate.spec });
        assignedAbsoluteNames.add(candidate.absoluteName);
      }
    }
  }

  return raidRoster;
}

// Helper to get max allowed per spec
function getMaxPerSpec(spec: string): number {
  const limits: Record<string, number> = {
    Hunter: 2,
    Mage: 7,
    Unholy: 4,
    Warrior: 1,
    Rogue: 1,
    Warlock: 1,
    Balance: 1,
    Elemental: 1,
  };
  return limits[spec] || Infinity;
}
