import { CacheType, Client, Interaction } from "discord.js";
import {
  calculateRaidDuration,
  fetchCasts,
  fetchFights,
  fetchPlayerInfo,
  getGuildLogs,
  getValidFights,
} from "../warcraftLogs";
import { fetchRaidRoster } from "../google-auth/google-api-";
import { Fight } from "../constants";
import { formatDuration, getKeyByCharacterName } from "../utils";
import { Character } from "../types";

const POTIONS = ["Tol'vir Agility", "Golem's Strength", "Volcanic Power"];

export async function handleLongSummary(interaction: Interaction<CacheType>, client: Client<boolean>) {
  if (!interaction.isCommand()) return;
  const raidsPerPlayer: Record<string, number> = {};
  let totalDuration = 0;
  let totalExplosiveShots = 0;
  let totalGarryCasts = 0;
  let totalBackstabCasts = 0;
  let totalPotionsUsed = 0;
  let totalBladestorms = 0;
  let totalCombustion = 0;
  let totalPI = 0;
  let totalWolvesSummoned = 0;
  let totalMushrooms = 0;
  let totalGloves = 0;
  let totalCrusader = 0;
  let totalDivinePlea = 0;
  let totalDeathStrikes = 0;
  let totalCL = 0;
  let totalIbf = 0;

  const [allGuildLogs] = await Promise.all([getGuildLogs(), fetchRaidRoster()]);
  const allLogIds = allGuildLogs.map((log) => log.code);
  let wipes = 0;
  const splitsAmount = allLogIds.length;
  const raidsData: {
    code: string;
    fights: Fight[];
    title: string;
    startTime: number;
    endTime: number;
  }[] = await Promise.all(allLogIds.map((logId) => fetchFights(logId)));

  const allRaidsPlayersInfo = await Promise.all(allLogIds.map((logId) => fetchPlayerInfo(logId)));

  allRaidsPlayersInfo.forEach((playersInfo) => {
    const charWasInRaid: Record<string, boolean> = {};
    Object.values(playersInfo).forEach((player: string) => {
      const playerName = getKeyByCharacterName(player);
      if (charWasInRaid[playerName]) {
        return;
      }
      if (raidsPerPlayer[playerName]) {
        raidsPerPlayer[playerName]++;
      } else {
        raidsPerPlayer[playerName] = 1;
      }
      charWasInRaid[playerName] = true;
    });
  });

  await Promise.all(
    raidsData.map(async (raid) => {
      const { code: logId, fights } = raid;
      const validFights = getValidFights(fights);
      const raidDuration = calculateRaidDuration(validFights);
      totalDuration += raidDuration;
      if (!fights.length) {
        return;
      }

      const firstFightStartTime = validFights[0].startTime;
      const lastFightEndTime = validFights[fights.length - 1].endTime;

      const casts: Character[] = await fetchCasts(
        logId,
        firstFightStartTime,
        lastFightEndTime,
        `ability.name IN ("Backstab", "Summon Gargoyle","Explosive Shot","Tol'vir Agility", "Golem's Strength", "Volcanic Power", "Bladestorm","Combustion","Feral Spirit","Wild Mushroom","Synapse Springs","Crusader Strike","Divine Plea","Death Strike","Chain Lightning","Icebound Fortitude")`,
      );

      const PiCasts: Character[] = await fetchCasts(
        logId,
        firstFightStartTime,
        lastFightEndTime,
        `ability.name = "Power infusion"`,
      );

      casts.forEach((cast) => {
        cast.abilities.forEach((ability) => {
          if (ability.name === "Explosive Shot") {
            totalExplosiveShots += ability.total;
          } else if (ability.name === "Summon Gargoyle") {
            totalGarryCasts += ability.total;
          } else if (ability.name === "Backstab") {
            totalBackstabCasts += ability.total;
          } else if (ability.name === "Bladestorm") {
            totalBladestorms += ability.total;
          } else if (ability.name === "Combustion") {
            totalCombustion += ability.total;
          } else if (ability.name === "Power infusion") {
            totalPI += ability.total;
          } else if (ability.name === "Wild Mushroom") {
            totalMushrooms += ability.total;
          } else if (ability.name === "Feral Spirit") {
            totalWolvesSummoned += ability.total * 2;
          } else if (POTIONS.includes(ability.name)) {
            totalPotionsUsed += ability.total * 1.3;
          } else if (ability.name === "Synapse Springs") {
            totalGloves += ability.total;
          } else if (ability.name === "Crusader Strike") {
            totalCrusader += ability.total;
          } else if (ability.name === "Divine Plea") {
            totalDivinePlea += ability.total;
          } else if (ability.name === "Death Strike") {
            totalDeathStrikes += ability.total;
          } else if (ability.name === "Chain Lightning") {
            totalCL += ability.total;
          } else if (ability.name === "Icebound Fortitude") {
            totalIbf += ability.total;
          }
        });
      });

      PiCasts.forEach((cast) => {
        cast.abilities.forEach((ability) => {
          totalPI += ability.total;
        });
      });

      // Count wipes
      validFights.forEach((fight) => {
        if (fight.kill === false) {
          wipes += 1;
        }
      });
    }),
  );

  const sortedRaidsPerPlay = Object.entries(raidsPerPlayer)
    .filter(([key]) => !key.startsWith("add_me_to_database_"))
    .sort(([, a], [, b]) => b - a)
    .map(([name, amount]) => ({ name, amount }))
    .slice(0, 10);

  const todoChannel: any = client.channels.cache.get("1323385159365558334");

  const totalPotionsFixed = +totalPotionsUsed.toFixed(0);
  const ibfUptime = totalIbf * 12;
  const PIUptime = totalPI * 15;
  const glovesUptime = totalGloves * 10;

  const totalMsgs = 163378;
  const devilMsgs = 16399;
  const doogiMsgs = 12480;
  const altecksMsgs = 7915;

  // **Total splits in 2024** :${splitsSince2024}
  const content = `
**Firelands splits** :${splitsAmount} 
**Wipes** : ${wipes}
**Total time spent in raids** : ${formatDuration(totalDuration)} - *Equivalent to watching the entire The Lord of the Rings trilogy (extended editions) 8.5 times*
**Top 10 most played characters**
${sortedRaidsPerPlay.map(({ name, amount }, i) => (i === 0 || i === 1 ? `${i + 1}) ${name}: ${amount} raids :Gigachad: :Gigachad: :Gigachad:` : `${i + 1}) ${name}: ${amount} raids`)).join("\n")}\n
**Gloves Used** : ${totalGloves.toLocaleString()} :COGGERS:
**Gloves Uptime** : ${glovesUptime.toLocaleString()} seconds - *Equivalent to play Taylor Swift's entire discography 9 times*
**Potions Used** : ${totalPotionsFixed.toLocaleString()} :Batlex: 
**Flasks Used** :2,825 :gemt: 
**Explosive Shots fired** : ${totalExplosiveShots.toLocaleString()} :hunter: 
**Garry's Summoned** : ${totalGarryCasts.toLocaleString()} :DeathKnight: 
**Wolves Summoned** : ${totalWolvesSummoned.toLocaleString()} :wolf: 
**Backstabs** : ${totalBackstabCasts.toLocaleString()} :Rogue: 
**Bladestorm** : ${totalBladestorms.toLocaleString()} :pepoWarr: 
**Combustions** : ${totalCombustion.toLocaleString()} :mageyep:  
**Power Infusion Uptime** : ${PIUptime.toLocaleString()} seconds :pi: - *Could cook and eat 87 servings of instant ramen (5 minutes each). 🍜*
**Mushrooms** : ${totalMushrooms.toLocaleString()} :mushroom: 
**Crusader Strikes** : ${totalCrusader.toLocaleString()} :pepoPala: 
**Divine Plea** : ${totalDivinePlea.toLocaleString()} :HPALA: 
**Anfall deaths on Ryolith ramp** : 9,453:noprogress: 
**Death Strikes** : ${totalDeathStrikes.toLocaleString()} :BDK: 
**Chain Lightnings** : ${totalCL.toLocaleString()} :ELEMENTAL: 
**IBF Uptime** : ${ibfUptime.toLocaleString()} seconds - *Could complete a speedrun of The Legend of Zelda: Ocarina of Time*
**N times Thaylash complained on random topic** : 3,986 :glorp:  

Total messages sent on Progress discord in 2024 - ${totalMsgs.toLocaleString()} ( Avg of ${(163378 / 365).toFixed(2)} msgs per day )
:yapping: **Biggest yappers of 2024** :yapping: :
<@250944928245350400> - ${devilMsgs} messages - ${((devilMsgs / totalMsgs) * 100).toFixed(2)}% of all msgs sent
<@231452783725903872> - ${doogiMsgs} messages - ${((doogiMsgs / totalMsgs) * 100).toFixed(2)}% of all msgs sent
<@86742373249343488> - ${altecksMsgs} messages - ${((altecksMsgs / totalMsgs) * 100).toFixed(2)}% of all msgs sent
`;
  await todoChannel.send(content);

  await interaction.followUp({ content: "sent!", ephemeral: true });
}
