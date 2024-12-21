import { google } from "googleapis";
import moment from "moment";
import path from "path";

// Path to your service account key file
const KEY_FILE = path.join(__dirname, "google-auth.json");

export const RAID_ROSTER: Record<string, Set<string>> = {};

// Google Sheets API setup
const SPREADSHEET_ID = "1iZjAe1yLa6_8PsjYkZv7usnXE2wtN7vxFuvNfDAf2SI";
const RANGE = "Raid Roster!G6:H500";
const RANGE_DATABASE_USER = "User_database!A1:C200";
const RAID_ROSTER_TAB_NAME = "Raid Roster";
const SHEET_ID = "1iZjAe1yLa6_8PsjYkZv7usnXE2wtN7vxFuvNfDAf2SI";
const LOOT_SHEET_ID = "14ucGZODYwpXw4dxhMm7SUQc4daGr0HmL7RefFaZdEh4";
const PHYSICAL_LOOT_TAB = "Physical Loot";
const Caster_LOOT_TAB = "Caster Loot";

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

export async function fetchRaidRoster() {
  try {
    // Authenticate with the service account
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Fetch data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
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

    const range = `${RAID_ROSTER_TAB_NAME}!P2:AB200`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const data = response.data.values;
    if (!data) {
      throw new Error("No data found.");
    }

    const splitMapping: { [key: string]: string[] } = {};

    // Loop through each column in the splits row (starting from index 2 to skip header and time)
    for (let colIndex = 2; colIndex < data[2].length; colIndex++) {
      const split = data[2][colIndex];
      if (split) {
        const day = data[0][colIndex].trim(); // Day (from row 0)
        const time = data[1][colIndex]; // Time (from row 1)

        // Build the key using day, time, and split name
        const key = `${day} ${time} ${split}`;

        // Initialize an empty array for the split in the mapping
        splitMapping[key] = [];

        // Loop through the character rows
        for (let i = 4; i < data.length; i++) {
          const charName = data[i][0]; // Get the character name (key column)
          const cellValue = data[i][colIndex]; // Get the value in the current split's column

          // If the cell is non-empty, add the character to the split's array
          if (cellValue && charName) {
            splitMapping[key].push(charName);
          }
        }
      }
    }

    // Return the array for the specific split name requested
    return splitMapping[splitName];
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw new Error("Failed to fetch data from Google Sheets.");
  }
}
