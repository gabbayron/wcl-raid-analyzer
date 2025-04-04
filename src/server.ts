import express from "express";
import dotenv from "dotenv";
import { updateTokens } from "./warcraftLogs";

dotenv.config();

export const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get("/", (req: any, res: any) => {
  return res.send("Hello!");
});

app.get("/oauth", (req, res) => {
  const authURL = `https://www.warcraftlogs.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI!)}`;
  res.redirect(authURL);
});

app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code as string;

  try {
    const response = await fetch("https://www.warcraftlogs.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI!,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error: ${response.status} - ${errorData.error_description}`);
    }

    const data = await response.json();

    const { access_token, refresh_token } = data;

    updateTokens(access_token, refresh_token);

    // Save tokens securely (e.g., in a database)
    console.log("Access Token:", access_token);
    console.log("Refresh Token:", refresh_token);

    res.send("Authentication successful! You can now access private logs.");
  } catch (error: any) {
    console.error("Error exchanging code for tokens:", error.response?.data || error.message);
    res.status(500).send("Authentication failed.");
  }
});
