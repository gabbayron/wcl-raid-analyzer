import { RAID_ROSTER } from "./constants";

// Helper function to add commas to numbers (e.g., 1000 -> 1,000)
export function numberWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  // Helper function to format duration from seconds to hh:mm:ss
  export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }
  
  // Sort the keys of an object in descending order based on their values
  export function sortByValueDescending<T>(obj: { [key: string]: T }): string[] {
    return Object.keys(obj).sort((a, b) => (obj[b] as any) - (obj[a] as any));
  }
  
  export function extractLogId(input:string) {
    if (/^[a-zA-Z0-9]+$/.test(input)) {
      return input;
    }
  
    // Otherwise, try to extract from URL
    const match = input.match(/reports\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  export function getKeyByCharacterName(name: string): string  {
    for (const [key, nameSet] of Object.entries(RAID_ROSTER)) {
      if (nameSet.has(name)) {
        return key;
      }
    }
    return `add_me_to_database_${name}`
  }