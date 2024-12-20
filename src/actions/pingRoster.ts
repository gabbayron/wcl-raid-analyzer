import { CacheType, Interaction } from "discord.js";
import { fetchCharacterNames, fetchUserData } from "../google-auth/google-api-";

const APPROVED_PING_ROLES = ["Officer", "Leadership", "Class Leader", "Fresh Leadership"];

interface PlayerToUserId {
  [playerName: string]: string;
}

export async function handlePingRoster(interaction: Interaction<CacheType>) {
  if (!interaction.isCommand()) return;
  const member: any = interaction.member;
  if (!member) {
    return;
  }

  const roleNames = member.roles.cache.map((role: any) => role.name);
  const hasApprovedRole = member.roles.cache.some((role: any) => APPROVED_PING_ROLES.includes(role.name));

  const splitName = interaction.options.get("split_name")?.value as string;
  const raidLead = interaction.options.get("raid_lead")?.value as string;
  const keyWord = interaction.options.get("whisper_key_word")?.value as string;

  const splitRoster = (await fetchUserData(splitName)) || [];
  const discordData = await fetchCharacterNames();

  const playerToUserId = splitRoster.reduce((acc: any, playerName: any) => {
    const user = discordData.find((user) => user.playerName === playerName);
    if (user) {
      acc[playerName] = user.userId;
    } else {
      acc[playerName] = null; // Set to null if no match is found
    }
    return acc;
  }, {});
  const mentions = generateMentions(playerToUserId);

  // Send a message with the generated mentions
  return await interaction.reply(`**${splitName}**\n${mentions}\n\`\`\`/W ${raidLead} ${keyWord}\`\`\``);
}

const generateMentions = (playerToUserId: PlayerToUserId): string => {
  return Object.values(playerToUserId)
    .filter((userId) => userId !== null) // Exclude null values
    .map((userId) => `<@${userId}>`) // Format as Discord mentions
    .join(" ");
};
