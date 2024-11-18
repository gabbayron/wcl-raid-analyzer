// async function generateRaidSummary(
//     logId: string,
//     dmgTakenFilterExpression: string,
//   ) {
//     const {
//       fights,
//       title,
//       startTime: raidStartTime,
//     }: { fights: Fight[]; title: string; startTime: number } = await fetchFights(
//       logId,
//     );
//     if (!fights || fights.length === 0) {
//       return { raidSummary: "No fights found for this log." };
//     }

//     let totalDamage = 0;
//     let totalDamageTaken = 0;
//     let totalDeaths = 0;
//     let totalWipes = 0;
//     let playerDamage: { [key: string]: number } = {};
//     let playerDamageTaken: { [key: string]: number } = {};
//     let playerDeaths: { [key: string]: number } = {};
//     const playerMap: any = await fetchPlayerInfo(logId); // Fetches player names and classes

//     // Iterate through each fight and accumulate data
//     for (const fight of fights) {
//       const { startTime, endTime, kill, id: fightId } = fight;

//       // Fetch Damage Data
//       const {
//         data: { entries: dmgDone },
//       } = await fetchDamageData(logId, startTime, endTime);
//       if (dmgDone) {
//         dmgDone.forEach((entry: any) => {
//           const playerName = `${entry.name}_${entry.type}`;
//           playerDamage[playerName] =
//             (playerDamage[playerName] || 0) + entry.total;
//           totalDamage += entry.total;
//         });
//       }

//       // Fetch Damage Taken Data with spell name filtering
//       const {
//         data: { entries: dmgTaken },
//       } = await fetchDamageTakenData(logId, fightId, dmgTakenFilterExpression);
//       if (dmgTaken) {
//         dmgTaken.forEach((entry: any) => {
//           const playerName = `${entry.name}_${entry.type}`;
//           playerDamageTaken[playerName] =
//             (playerDamageTaken[playerName] || 0) + entry.total;
//           totalDamageTaken += entry.total;
//         });
//       }

//       // Fetch Death and Wipe Data
//       const deathAndWipeData = await fetchDeathsAndWipes(
//         logId,
//         startTime,
//         endTime,
//       );
//       if (deathAndWipeData?.events?.data) {
//         totalDeaths += deathAndWipeData.events.data.length;
//         deathAndWipeData.events.data.forEach((event: any) => {
//           const playerName = playerMap[event.targetID];
//           if (playerName) {
//             playerDeaths[playerName] = (playerDeaths[playerName] || 0) + 1;
//           }
//         });
//       }

//       if (kill === false) {
//         totalWipes += 1;
//       }
//     }

//     const raidDuration =
//       (fights[fights.length - 1].endTime - fights[0].startTime) / 1000;

//     const sortedDamageTaken = sortByValueDescending(playerDamageTaken);
//     const sortedDamageDealers = sortByValueDescending(playerDamage);

//     // Group players by class using playerMap
//     const groupedByClass: { [classType: string]: string[] } = {};
//     sortedDamageTaken.forEach((player) => {
//       const [playerName, playerClass] = player.split("_");
//       if (!groupedByClass[playerClass]) {
//         groupedByClass[playerClass] = [];
//       }
//       groupedByClass[playerClass].push(playerName);
//     });

//     // Format the roster with each class in a separate row, including class name and icon
//     const raidRoster = Object.entries(groupedByClass)
//       .map(
//         ([playerClass, players]) =>
//           `${classIcons[playerClass]} ${playerClass}: ${players.join(", ")}`,
//       )
//       .join("\n");

//     const dmgDealersSummary = sortedDamageDealers
//       .slice(0, 10)
//       .map((player) => {
//         const [playerName, playerClass] = player.split("_");
//         return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamage[player])}`;
//       })
//       .join("\n");

//     const dmgTakenSummary = sortedDamageTaken
//       .slice(0, 10)
//       .map((player) => {
//         const [playerName, playerClass] = player.split("_");
//         return `${classIcons[playerClass] || ""} ${playerName}: ${numberWithCommas(playerDamageTaken[player])}`;
//       })
//       .join("\n");

//     const sortedDeaths = sortByValueDescending(playerDeaths);
//     const deathsSummary = sortedDeaths
//       .slice(0, 5)
//       .map((player) => {
//         const [playerName] = player.split("_");
//         return `${playerName}: ${playerDeaths[player]}`;
//       })
//       .join("\n");

//     const formattedDate = new Date(raidStartTime).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });

//     const fightsList = fights
//       .filter((fight) => fight.kill)
//       .map(
//         (fight) =>
//           `**${fight.name}** https://classic.warcraftlogs.com/reports/${logId}#fight=${fight.id}&type=damage-done`,
//       )
//       .join("\n");

//     const raidSummary = `**${title} - ${formattedDate} - https://classic.warcraftlogs.com/reports/${logId}\n**\n**Roster** \n${raidRoster}\n\n**Raid Duration**: ${formatDuration(raidDuration)}\n**Total Damage Done**: ${numberWithCommas(totalDamage)}\n**Total Avoidable Damage Taken**: ${numberWithCommas(totalDamageTaken)}\n**Total Deaths**: ${totalDeaths}\n**Total Wipes**: ${totalWipes}\n
//     \n**Top 10 DPS**:\n${dmgDealersSummary}
//     \n**Top 10 Avoidable Damage Taken**:\n${dmgTakenSummary}
//     \n**Deaths by Player (top 5)**:\n${deathsSummary}\n\n**Damage Taken Log breakdown** ${generateWarcraftLogsUrl(logId, dmgTakenFilterExpression)}\n\n`;
//     return { raidSummary, fightsList };
//   }
