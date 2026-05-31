// scripts/update_regional_records_from_scores_2026.cjs
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const args = process.argv.slice(2);

const getArg = (name, fallback = "") => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split("=").slice(1).join("=") : fallback;
};

const SHOULD_WRITE = args.includes("--write");
const SHOW_DEBUG = !args.includes("--no-debug");

const FROM_DATE = getArg("from", "2026-05-29");
const TO_DATE = getArg("to", FROM_DATE);

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard";

/*
  These aliases normalize ESPN names/mascots to your Firestore team names.

  Firestore examples:
  "(12) Texas A&M"
  "(3) Georgia"
  "Long Island"
  "Saint John's"

  ESPN examples:
  "Texas A&M Aggies"
  "Georgia Bulldogs"
  "LIU Sharks"
  "St. John's Red Storm"
*/
const TEAM_ALIASES = {
  // Los Angeles Regional
  "UCLA": "UCLA",
  "UCLA Bruins": "UCLA",
  "Saint Mary's": "Saint Mary's",
  "Saint Mary's Gaels": "Saint Mary's",
  "St Mary's": "Saint Mary's",
  "St. Mary's": "Saint Mary's",
  "Virginia Tech": "Virginia Tech",
  "Virginia Tech Hokies": "Virginia Tech",
  "Cal Poly": "Cal Poly",
  "Cal Poly Mustangs": "Cal Poly",

  // Atlanta Regional
  "Georgia Tech": "Georgia Tech",
  "Georgia Tech Yellow Jackets": "Georgia Tech",
  "UIC": "UIC",
  "UIC Flames": "UIC",
  "Oklahoma": "Oklahoma",
  "Oklahoma Sooners": "Oklahoma",
  "The Citadel": "The Citadel",
  "The Citadel Bulldogs": "The Citadel",

  // Athens Regional
  "Georgia": "Georgia",
  "Georgia Bulldogs": "Georgia",
  "Long Island University": "Long Island",
"Long Island University Sharks": "Long Island",
  "Boston College": "Boston College",
  "Boston College Eagles": "Boston College",
  "Liberty": "Liberty",
  "Liberty Flames": "Liberty",
  "Long Island": "Long Island",
  "LIU": "Long Island",
  "LIU Sharks": "Long Island",

  // Auburn Regional
  "Auburn": "Auburn",
  "Auburn Tigers": "Auburn",
  "Milwaukee": "Milwaukee",
  "Milwaukee Panthers": "Milwaukee",
  "UCF": "UCF",
  "UCF Knights": "UCF",
  "Central Florida": "UCF",
  "NC State": "NC State",
  "NC State Wolfpack": "NC State",
  "N.C. State": "NC State",

  // Chapel Hill Regional
  "North Carolina": "North Carolina",
  "North Carolina Tar Heels": "North Carolina",
  "Tennessee": "Tennessee",
  "Tennessee Volunteers": "Tennessee",
  "East Carolina": "East Carolina",
  "East Carolina Pirates": "East Carolina",
  "VCU": "VCU",
  "VCU Rams": "VCU",

  // Austin Regional
  "Texas": "Texas",
  "Texas Longhorns": "Texas",
  "Holy Cross": "Holy Cross",
  "Holy Cross Crusaders": "Holy Cross",
  "UC Santa Barbara": "UC Santa Barbara",
  "UC Santa Barbara Gauchos": "UC Santa Barbara",
  "UCSB": "UC Santa Barbara",
  "Tarleton State": "Tarleton State",
  "Tarleton State Texans": "Tarleton State",
  "Tarleton St": "Tarleton State",

  // Tuscaloosa Regional
  "Alabama": "Alabama",
  "Alabama Crimson Tide": "Alabama",
  "Alabama State": "Alabama State",
  "Alabama State Hornets": "Alabama State",
  "Oklahoma State": "Oklahoma State",
  "Oklahoma State Cowboys": "Oklahoma State",
  "Oklahoma St": "Oklahoma State",
  "South Carolina Upstate": "USC Upstate",
    "South Carolina Upstate Spartans": "USC Upstate",
    "SC Upstate": "USC Upstate",
    "USC Upstate": "USC Upstate",
    "USC Upstate Spartans": "USC Upstate",
  "USC Upstate": "USC Upstate",
  "USC Upstate Spartans": "USC Upstate",

  // Gainesville Regional
  "Florida": "Florida",
  "Florida Gators": "Florida",
  "Rider": "Rider",
  "Rider Broncs": "Rider",
  "Miami": "Miami",
  "Miami Hurricanes": "Miami",
  "Miami FL": "Miami",
  "Miami (FL)": "Miami",
  "Troy": "Troy",
  "Troy Trojans": "Troy",

  // Hattiesburg Regional
  "Southern Miss": "Southern Miss",
  "Southern Miss.": "Southern Miss",
  "Southern Miss Golden Eagles": "Southern Miss",
  "Southern Mississippi": "Southern Miss",
  "Little Rock": "Little Rock",
  "Little Rock Trojans": "Little Rock",
  "Virginia": "Virginia",
  "Virginia Cavaliers": "Virginia",
  "Jacksonville State": "Jacksonville State",
  "Jacksonville State Gamecocks": "Jacksonville State",
  "Jacksonville St": "Jacksonville State",

  // Tallahassee Regional
  "Florida State": "Florida State",
  "Florida State Seminoles": "Florida State",
  "Florida St": "Florida State",
  "Florida St.": "Florida State",
  "St. John's": "Saint John's",
  "St. John's Red Storm": "Saint John's",
  "St Johns": "Saint John's",
  "Saint John's": "Saint John's",
  "Coastal Carolina": "Coastal Carolina",
  "Coastal Carolina Chanticleers": "Coastal Carolina",
  "NIU": "NIU",
  "Northern Illinois": "NIU",
  "Northern Illinois Huskies": "NIU",

  // Eugene Regional
  "Oregon": "Oregon",
  "Oregon Ducks": "Oregon",
  "Oregon State": "Oregon State",
  "Oregon State Beavers": "Oregon State",
  "Oregon St": "Oregon State",
  "Washington State": "Washington State",
  "Washington State Cougars": "Washington State",
  "Washington St": "Washington State",
  "Yale": "Yale",
  "Yale Bulldogs": "Yale",

  // College Station Regional
  "Texas A&M": "Texas A&M",
  "Texas A&M Aggies": "Texas A&M",
  "Texas A&amp;M": "Texas A&M",
  "Texas State": "Texas State",
  "Texas State Bobcats": "Texas State",
  "Texas St": "Texas State",
  "USC": "USC",
  "USC Trojans": "USC",
  "Southern California": "USC",
  "Southern California Trojans": "USC",
  "Lamar": "Lamar",
  "Lamar Cardinals": "Lamar",
  "Lamar University": "Lamar",

  // Lincoln Regional
  "Nebraska": "Nebraska",
  "Nebraska Cornhuskers": "Nebraska",
  "South Dakota State": "South Dakota State",
  "South Dakota State Jackrabbits": "South Dakota State",
  "South Dakota St": "South Dakota State",
  "Ole Miss": "Ole Miss",
  "Ole Miss Rebels": "Ole Miss",
  "Mississippi": "Ole Miss",
  "Arizona State": "Arizona State",
  "Arizona State Sun Devils": "Arizona State",
  "Arizona St": "Arizona State",

  // Starkville Regional
  "Mississippi State": "Mississippi State",
  "Mississippi State Bulldogs": "Mississippi State",
  "Mississippi St": "Mississippi State",
  "Mississippi St.": "Mississippi State",
  "Lipscomb": "Lipscomb",
  "Lipscomb Bisons": "Lipscomb",
  "Cincinnati": "Cincinnati",
  "Cincinnati Bearcats": "Cincinnati",
  "Louisiana": "Louisiana",
  "Louisiana Ragin' Cajuns": "Louisiana",
  "Louisiana Ragin Cajuns": "Louisiana",

  // Lawrence Regional
  "Kansas": "Kansas",
  "Kansas Jayhawks": "Kansas",
  "Northeastern": "Northeastern",
  "Northeastern Huskies": "Northeastern",
  "Arkansas": "Arkansas",
  "Arkansas Razorbacks": "Arkansas",
  "Missouri State": "Missouri State",
  "Missouri State Bears": "Missouri State",
  "Missouri St": "Missouri State",

  // Morgantown Regional
  "West Virginia": "West Virginia",
  "West Virginia Mountaineers": "West Virginia",
  "Binghamton": "Binghamton",
  "Binghamton Bearcats": "Binghamton",
  "Wake Forest": "Wake Forest",
  "Wake Forest Demon Deacons": "Wake Forest",
  "Kentucky": "Kentucky",
  "Kentucky Wildcats": "Kentucky",
};

const stripSeedOrRank = (value) => {
  return String(value || "")
    // Strip national seed prefixes like "(12) Texas A&M"
    .replace(/^\(\d+\)\s*/, "")
    // Strip poll/rank prefixes like "#12 Texas A&M"
    .replace(/^#\d+\s*/, "")
    .trim();
};

const cleanTeamString = (value) => {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeTeamName = (value) => {
  const raw = stripSeedOrRank(cleanTeamString(value));

  const aliasMatch = TEAM_ALIASES[raw] || raw;

  return String(aliasMatch)
    .replace(/&amp;/g, "&")
    .replace(/’/g, "'")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const displayDateToEspnDate = (dateString) => {
  return dateString.replaceAll("-", "");
};

const addDays = (dateString, daysToAdd) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
};

const getDateRange = (fromDate, toDate) => {
  const dates = [];
  let current = fromDate;

  while (current <= toDate) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
};

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }

  return response.json();
};

const getCompetitorTeamName = (competitor) => {
  return (
    competitor?.team?.displayName ||
    competitor?.team?.shortDisplayName ||
    competitor?.team?.name ||
    competitor?.team?.location ||
    ""
  );
};

const getGameStatus = (event) => {
  return (
    event?.status?.type?.description ||
    event?.status?.type?.name ||
    event?.status?.type?.state ||
    ""
  );
};

const isCompletedGame = (event) => {
  const status = getGameStatus(event).toLowerCase();

  return (
    event?.status?.type?.completed === true ||
    status.includes("final") ||
    status.includes("post")
  );
};

const getWinnerAndLoser = (event) => {
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors || [];

  if (competitors.length < 2) return null;

  const [a, b] = competitors;

  const aName = getCompetitorTeamName(a);
  const bName = getCompetitorTeamName(b);

  const aScore = Number(a?.score ?? 0);
  const bScore = Number(b?.score ?? 0);

  const aWinner = a?.winner === true;
  const bWinner = b?.winner === true;

  if (aWinner && !bWinner) {
    return {
      winner: aName,
      loser: bName,
      winnerScore: aScore,
      loserScore: bScore,
    };
  }

  if (bWinner && !aWinner) {
    return {
      winner: bName,
      loser: aName,
      winnerScore: bScore,
      loserScore: aScore,
    };
  }

  if (aScore > bScore) {
    return {
      winner: aName,
      loser: bName,
      winnerScore: aScore,
      loserScore: bScore,
    };
  }

  if (bScore > aScore) {
    return {
      winner: bName,
      loser: aName,
      winnerScore: bScore,
      loserScore: aScore,
    };
  }

  return null;
};

const buildRegionalLookup = (regionals) => {
  const teamToRegional = new Map();

  Object.entries(regionals || {}).forEach(([regionalId, regional]) => {
    ["team1", "team2", "team3", "team4"].forEach((teamKey) => {
      const teamName = regional?.[teamKey];

      if (!teamName || normalizeTeamName(teamName) === "tbd") return;

      teamToRegional.set(normalizeTeamName(teamName), {
        regionalId,
        teamKey,
        teamName,
        regionalName: regional?.name || `Regional ${regionalId}`,
      });
    });
  });

  return teamToRegional;
};

const makeEmptyRecords = (regionals) => {
  const records = {};

  Object.entries(regionals || {}).forEach(([regionalId, regional]) => {
    records[regionalId] = {};

    ["team1", "team2", "team3", "team4"].forEach((teamKey) => {
      const teamName = regional?.[teamKey];

      if (!teamName || normalizeTeamName(teamName) === "tbd") return;

      records[regionalId][teamKey] = {
        teamName,
        wins: 0,
        losses: 0,
      };
    });
  });

  return records;
};

const getRecordUpdates = (records) => {
  const updates = {};

  Object.entries(records).forEach(([regionalId, regionalRecords]) => {
    Object.entries(regionalRecords).forEach(([teamKey, record]) => {
      updates[`${regionalId}.${teamKey}Record`] = `${record.wins}-${record.losses}`;
    });
  });

  return updates;
};

const main = async () => {
  console.log("Fetching regionals from Firestore...");

  const regionalsRef = db.collection("regionals2026").doc("regions");
  const regionalsSnapshot = await regionalsRef.get();

  if (!regionalsSnapshot.exists) {
    throw new Error("regionals2026/regions does not exist.");
  }

  const regionals = regionalsSnapshot.data() || {};
  const teamToRegional = buildRegionalLookup(regionals);
  const records = makeEmptyRecords(regionals);

  const dates = getDateRange(FROM_DATE, TO_DATE);

  console.log(`Fetching ESPN scoreboard dates: ${FROM_DATE} to ${TO_DATE}`);
  console.log(SHOULD_WRITE ? "Mode: WRITE to Firestore" : "Mode: DRY RUN only");

  const matchedGames = [];
  const skippedTournamentTeamGames = [];
  const completedUnmatchedTournamentGames = [];
  const countedGameKeys = new Set();

  for (const date of dates) {
    const espnDate = displayDateToEspnDate(date);
    const url = `${ESPN_SCOREBOARD_URL}?dates=${espnDate}&limit=500`;

    console.log(`\nFetching ${date}...`);

    const data = await fetchJson(url);
    const events = data?.events || [];

    console.log(`Found ${events.length} ESPN events`);

    if (SHOW_DEBUG) {
      events.slice(0, 10).forEach((event) => {
        const competitors = event?.competitions?.[0]?.competitors || [];
        const names = competitors.map(getCompetitorTeamName).join(" vs ");
        const status = getGameStatus(event);

        console.log(`  ${names} | ${status}`);
      });
    }

    events.forEach((event) => {
      if (!isCompletedGame(event)) return;

      const result = getWinnerAndLoser(event);
      if (!result) return;

      const winnerNormalized = normalizeTeamName(result.winner);
      const loserNormalized = normalizeTeamName(result.loser);

      const winnerRegional = teamToRegional.get(winnerNormalized);
      const loserRegional = teamToRegional.get(loserNormalized);

      if (!winnerRegional && !loserRegional) {
        completedUnmatchedTournamentGames.push({
          date,
          game: `${result.winner} ${result.winnerScore}, ${result.loser} ${result.loserScore}`,
        });
        return;
      }

      if (!winnerRegional || !loserRegional) {
        skippedTournamentTeamGames.push({
          date,
          game: `${result.winner} ${result.winnerScore}, ${result.loser} ${result.loserScore}`,
          reason: "Only one team matched a tournament team",
        });
        return;
      }

      if (winnerRegional.regionalId !== loserRegional.regionalId) {
        skippedTournamentTeamGames.push({
          date,
          game: `${result.winner} ${result.winnerScore}, ${result.loser} ${result.loserScore}`,
          reason: "Teams matched different regionals",
        });
        return;
      }

      const regionalId = winnerRegional.regionalId;

    const normalizedTeamsForKey = [winnerNormalized, loserNormalized]
        .sort()
        .join("__");

    const gameKey = `${regionalId}__${normalizedTeamsForKey}__${result.winnerScore}-${result.loserScore}`;

    if (countedGameKeys.has(gameKey)) {
        return;
    }

    countedGameKeys.add(gameKey);

    records[regionalId][winnerRegional.teamKey].wins += 1;
    records[regionalId][loserRegional.teamKey].losses += 1;

      matchedGames.push({
        date,
        regionalName: winnerRegional.regionalName,
        game: `${result.winner} ${result.winnerScore}, ${result.loser} ${result.loserScore}`,
      });
    });
  }

  console.log("\n✅ Matched Regional Games:");

  if (matchedGames.length === 0) {
    console.log("None matched.");
  } else {
    matchedGames.forEach((item) => {
      console.log(`- ${item.date} | ${item.regionalName} | ${item.game}`);
    });
  }

  if (skippedTournamentTeamGames.length > 0) {
    console.log("\n⚠️ Skipped games involving at least one tournament team:");
    skippedTournamentTeamGames.forEach((item) => {
      console.log(`- ${item.date} | ${item.game} | ${item.reason}`);
    });
  }

  if (SHOW_DEBUG && completedUnmatchedTournamentGames.length > 0) {
    console.log("\nℹ️ Completed games that did not match your regional teams:");
    completedUnmatchedTournamentGames.slice(0, 25).forEach((item) => {
      console.log(`- ${item.date} | ${item.game}`);
    });
  }

  const updates = getRecordUpdates(records);

  console.log("\n📌 Record updates preview:");

  Object.entries(regionals).forEach(([regionalId, regional]) => {
    console.log(`\n${regional?.name || `Regional ${regionalId}`}`);

    ["team1", "team2", "team3", "team4"].forEach((teamKey) => {
      if (!regional?.[teamKey] || normalizeTeamName(regional?.[teamKey]) === "tbd") {
        return;
      }

      const value = updates[`${regionalId}.${teamKey}Record`] || "0-0";
      console.log(`  ${regional[teamKey]}: ${value}`);
    });
  });

  if (!SHOULD_WRITE) {
    console.log("\nDry run complete. Nothing was written.");
    console.log("To write to Firestore, rerun with --write.");
    return;
  }

  await regionalsRef.update(updates);

  console.log("\n✅ Firestore updated: regionals2026/regions team records.");
};

main().catch((error) => {
  console.error("\n❌ Failed to update regional records:");
  console.error(error);
  process.exit(1);
});