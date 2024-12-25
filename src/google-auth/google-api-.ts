import { google } from "googleapis";
import moment from "moment";
import path from "path";
import { extractRaidName } from "../utils";
import { EXPANSIONS } from "../constants";

// Path to your service account key file
const KEY_FILE = path.join(__dirname, "google-auth.json");

export const RAID_ROSTER: Record<string, Set<string>> = {};

// Google Sheets API setup
export const SPREADSHEET_ID = "1iZjAe1yLa6_8PsjYkZv7usnXE2wtN7vxFuvNfDAf2SI";
export const FRESH_SPREADSHEET_ID = "10B_uHPuzKr42wOefdLRRNQWscDDbuvry1DGX_SWuMC4";

export const EXPANSION_TO_SHEET = {
  [EXPANSIONS.CATA]: SPREADSHEET_ID,
  [EXPANSIONS.FRESH]: FRESH_SPREADSHEET_ID,
};

const RANGE = "Raid Roster!G6:H500";
const RANGE_DATABASE_USER = "User_database!A1:C200";
const RAID_ROSTER_TAB_NAME = "Raid Roster";
const SHEET_ID = "1iZjAe1yLa6_8PsjYkZv7usnXE2wtN7vxFuvNfDAf2SI";
const LOOT_SHEET_ID = "14ucGZODYwpXw4dxhMm7SUQc4daGr0HmL7RefFaZdEh4";
const PHYSICAL_LOOT_TAB = "Physical Loot";
const Caster_LOOT_TAB = "Caster Loot";
const PERSONAL_MRT_OUTPUT_TAB = "Personal_MRT_Output";

async function updateRaidRosterSheet(existingCharacterName: string, newCharacterName: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${RAID_ROSTER_TAB_NAME}!G6:H500`, // Adjusted range
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return;
  }

  // Find the row index for the character
  const rowIndex = rows.findIndex(([_, character]) => character === existingCharacterName);

  if (rowIndex === -1) {
    console.log(`Character ${existingCharacterName} not found.`);
    return;
  }

  const actualRow = rowIndex + 6;

  const rangeToUpdate = `${RAID_ROSTER_TAB_NAME}!H${actualRow}:H${actualRow}`;

  const updateBody = {
    range: rangeToUpdate,
    values: [[newCharacterName]],
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeToUpdate,
    valueInputOption: "RAW",
    requestBody: updateBody,
  });

  console.log(`SheetId: ${SPREADSHEET_ID} - Updated row ${actualRow} with new data:`, newCharacterName);
}

export async function updatePhysicalLootSheet(existingCharacterName: string, newCharacterName: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  try {
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: LOOT_SHEET_ID,
      range: `${PHYSICAL_LOOT_TAB}!A7:A1000`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return { updated: false };
    }

    // Find the row index for the character
    const rowIndex = rows.findIndex(([character]) => character === existingCharacterName);

    if (rowIndex === -1) {
      console.log(`Character ${existingCharacterName} not found.`);
      return { updated: false };
    }

    const actualRow = rowIndex + 7;

    const rangeToUpdate = `${PHYSICAL_LOOT_TAB}!A${actualRow}:A${actualRow}`;

    const updateBody = {
      range: rangeToUpdate,
      values: [[newCharacterName]],
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId: LOOT_SHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      requestBody: updateBody,
    });

    console.log(`SheetId: ${LOOT_SHEET_ID} - Updated row ${actualRow} with new data:`, newCharacterName);
    return { updated: true };
  } catch (error) {
    console.log("Error updating physical loot sheet", { error });
    return { updated: false };
  }
}

export async function updateCasterLootSheet(existingCharacterName: string, newCharacterName: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  try {
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: LOOT_SHEET_ID,
      range: `${Caster_LOOT_TAB}!A7:A1000`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return;
    }

    // Find the row index for the character
    const rowIndex = rows.findIndex(([character]) => character === existingCharacterName);

    if (rowIndex === -1) {
      console.log(`Character ${existingCharacterName} not found.`);
      return;
    }

    const actualRow = rowIndex + 7;

    const rangeToUpdate = `${Caster_LOOT_TAB}!A${actualRow}:A${actualRow}`;

    const updateBody = {
      range: rangeToUpdate,
      values: [[newCharacterName]],
    };

    await sheets.spreadsheets.values.update({
      spreadsheetId: LOOT_SHEET_ID,
      range: rangeToUpdate,
      valueInputOption: "RAW",
      requestBody: updateBody,
    });

    console.log(`SheetId: ${LOOT_SHEET_ID} - Updated row ${actualRow} with new data:`, newCharacterName);
  } catch (error) {
    console.log("Error updating physical loot sheet", { error });
  }
}

export async function findRowAndUpdateCharacterName(existingCharacterName: string, newCharacterName: string) {
  try {
    await updateRaidRosterSheet(existingCharacterName, newCharacterName);
    const { updated } = await updatePhysicalLootSheet(existingCharacterName, newCharacterName);
    if (!updated) {
      await updateCasterLootSheet(existingCharacterName, newCharacterName);
    }
  } catch (error) {
    console.error("Error updating character row:", error);
  }
}

export async function fetchRaidRoster(spreadsheetId = SHEET_ID) {
  try {
    // Authenticate with the service account
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Fetch data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found.");
      return {};
    }

    rows.forEach(([player, character]) => {
      if (!RAID_ROSTER[player]) RAID_ROSTER[player] = new Set();
      RAID_ROSTER[player].add(character);
    });
    console.log("Raid roster fetched");
    return RAID_ROSTER;
  } catch (error) {
    console.error("Error fetching raid roster:", error);
    return {};
  }
}

export async function fetchCharacterNames() {
  const charNames: { discordId: string; playerName: string; userId: string }[] = [];
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // Fetch data from the Google Sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE_DATABASE_USER,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return [];
  }

  rows.forEach(([playerName, discordId, userId]) => {
    charNames.push({ discordId, playerName, userId });
  });

  return charNames;
}

export async function getRaidNames(spreadsheetId = SHEET_ID) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE, // Path to your service account key file
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${RAID_ROSTER_TAB_NAME}!Q2:AB4`,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 3) {
    console.log("Insufficient data found in the range.");
    return [];
  }

  const [days, times, splits] = rows;

  const filteredRaids = days
    .map((day, index) => {
      const time = times[index];
      const split = splits[index];

      // Combine date and time into a single string and parse it
      const raidDateTime = moment(`${day.trim()} ${time}`, "ddd DD MMM HH:mm");

      // Filter raids that are older than 2 days
      if (raidDateTime.isAfter(moment().subtract(2, "days"))) {
        return `${day.trim()} ${time} ${split}`;
      }

      return null; // Exclude older raids
    })
    .filter((raid) => raid !== null); // Remove null values

  return filteredRaids;
}

export async function fetchUserData(splitName: string, spreadsheetId = SHEET_ID) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const range = `${RAID_ROSTER_TAB_NAME}!P1:AB200`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const data = response.data.values;
    if (!data) {
      throw new Error("No data found.");
    }

    const splitMapping: { [key: string]: string[] } = {};
    const splitMapToRaidName: { [key: string]: string } = {}; // Maps split keys to first row (e.g., Raid_1, Raid_2, etc.)
    const splitToCharacterName: any = {};

    // Loop through each column in the splits row (row 4, adjusted from previous logic)
    for (let colIndex = 1; colIndex < data[3].length; colIndex++) {
      const split = data[3][colIndex]; // Get the split name from row 4
      if (split) {
        const day = data[1][colIndex].trim(); // Day from row 2
        const time = data[2][colIndex]; // Time from row 3
        const raidName = data[0][colIndex]; // Raid name from row 1 (e.g., Raid_1)

        const key = `${day} ${time} ${split}`; // Create the split mapping key
        splitMapping[key] = [];
        splitMapToRaidName[key] = raidName; // Map the split key to the raid name

        console.log(extractRaidName(key));
        // Loop through the rows starting from row 5 for characters
        for (let rowIndex = 4; rowIndex < data.length; rowIndex++) {
          const charName = data[rowIndex][0]; // Get the character name from the first column
          const cellValue = data[rowIndex][colIndex]; // Value in the split's column

          if (cellValue && charName) {
            splitMapping[key].push(charName);
            splitToCharacterName[key]
              ? (splitToCharacterName[key][charName] = cellValue)
              : (splitToCharacterName[key] = { [charName]: cellValue });
          }
        }
      }
    }

    if (!splitMapping[splitName]) {
      throw new Error(`Split "${splitName}" not found.`);
    }
    return {
      splitData: splitMapping[splitName], // Characters in the split
      raidName: splitMapToRaidName[splitName], // Corresponding raid name (from the first row)
      splitCharacterNames: splitToCharacterName[splitName],
    };
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw new Error("Failed to fetch data from Google Sheets.");
  }
}

export async function reassignRaidAssignments(raidName: string) {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const rangeToUpdate = "Assignments!B5:B5";

  const updateBody = {
    range: rangeToUpdate,
    values: [[raidName]],
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: rangeToUpdate,
    valueInputOption: "RAW",
    requestBody: updateBody,
  });
}

export async function fetchPersonalMrtNotes() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // Fetch data from the Google Sheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${PERSONAL_MRT_OUTPUT_TAB}!B1:Z2`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    console.log("No data found.");
    return [];
  }

  const assignments = rows[0];
  const players = rows[1];

  const result: Record<string, string> = {};

  // Map players to their respective assignments
  players.forEach((player, index) => {
    const assignment = assignments[index] || "No Assignment"; // Handle missing assignments
    result[player] = assignment;
  });

  return result;
}
