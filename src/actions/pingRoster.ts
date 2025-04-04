import { CacheType, Interaction } from "discord.js";
import {
  fetchCharacterNames,
  fetchPersonalMrtNotes,
  fetchUserData,
  reassignRaidAssignments,
} from "../google-auth/google-api-";

const APPROVED_PING_ROLES = ["Officer", "Leadership", "Class Leader", "Fresh Leadership"];

interface PlayerToUserId {
  [playerName: string]: string;
}

export async function handlePingRoster(interaction: Interaction<CacheType>, client: any) {
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

  const { splitData, raidName, splitCharacterNames } = (await fetchUserData(splitName)) || [];

  const discordData = await fetchCharacterNames();

  const playerToUserId = splitData.reduce((acc: any, playerName: any) => {
    const user = discordData.find((user) => user.playerName === playerName);
    if (user) {
      acc[playerName] = user.userId;
    } else {
      acc[playerName] = null; // Set to null if no match is found
    }
    return acc;
  }, {});

  const mentions = generateMentions(playerToUserId);

  const testChannel = client.channels.cache.get("1306740983148318751");

  await interaction.followUp(`Pinged ${splitName} on ${testChannel}`);

  await testChannel.send(`**${splitName}**\n${mentions}\n\`\`\`/W ${raidLead} ${keyWord}\`\`\``);

  await reassignRaidAssignments(raidName);

  const personalMrtNotes: any = await fetchPersonalMrtNotes();

  const sendMessages = Object.entries(playerToUserId).map(async ([playerName, userId]) => {
    if (!userId) {
      console.log(`No Discord user found for player: ${playerName}`);
      return;
    }

    const assignment = personalMrtNotes[playerName];
    if (!assignment) {
      console.log(`No assignment found for player: ${playerName}`);
      return;
    }

    try {
      const raidingCharacterName = splitCharacterNames[playerName];
      const discordUser = await interaction.client.users.fetch(userId as any);
      await discordUser.send(`Hello ${raidingCharacterName},\n\nHere is your assignment:\n${assignment}`);
      console.log(`Assignment sent to ${playerName}`);
    } catch (error) {
      console.error(`Failed to send assignment to ${playerName}:`, error);
    }
  });

  await Promise.all(sendMessages);
}

export const generateMentions = (playerToUserId: PlayerToUserId): string => {
  return Object.values(playerToUserId)
    .filter((userId) => userId !== null) // Exclude null values
    .map((userId) => `<@${userId}>`) // Format as Discord mentions
    .join(" ");
};

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
