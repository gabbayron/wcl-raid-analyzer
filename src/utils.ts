import { TextChannel } from "discord.js";
import { RAID_ROSTER } from "./google-auth/google-api-";

// Helper function to add commas to numbers (e.g., 1000 -> 1,000)
export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to format duration from seconds to hh:mm:ss
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return hours === 0 ? `${minutes}m ${secs}s` : `${hours}h ${minutes}m ${secs}s`;
}
// Sort the keys of an object in descending order based on their values
export function sortByValueDescending<T>(obj: { [key: string]: T }): string[] {
  return Object.keys(obj).sort((a, b) => (obj[b] as any) - (obj[a] as any));
}

export function sortByValueAscending<T>(obj: { [key: string]: T }): string[] {
  return Object.keys(obj).sort((a, b) => (obj[a] as any) - (obj[b] as any));
}

export function extractLogId(input: string) {
  if (/^[a-zA-Z0-9]+$/.test(input)) {
    return input;
  }

  // Otherwise, try to extract from URL
  const match = input.match(/reports\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function getKeyByCharacterName(name: string): string {
  for (const [key, nameSet] of Object.entries(RAID_ROSTER)) {
    if (nameSet.has(name)) {
      return key;
    }
  }
  return `add_me_to_database_${name}`;
}

export function formatRaidDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export async function sendLongMessage(channel: TextChannel, message: string) {
  const chunkSize = 2000;
  for (let i = 0; i < message.length; i += chunkSize) {
    await channel.send(message.slice(i, i + chunkSize));
  }
}

export function sortObjectByValueDesc<T>(obj: Record<string, T>): Record<string, T> {
  const entries = Object.entries(obj);

  entries.sort(([, valueA], [, valueB]) => {
    if (valueA < valueB) return 1;
    if (valueA > valueB) return -1;
    return 0;
  });

  return Object.fromEntries(entries);
}

export function extractRaidName(input: string): string {
  // Match the part of the string after the last date-time pattern
  const regex = /(?:\d{2}:\d{2}\s)(.+)$/;
  const match = input.match(regex);
  return match ? match[1].trim() : "";
}

export function extractNameFromTricks(input: string) {
  const match = input.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}
