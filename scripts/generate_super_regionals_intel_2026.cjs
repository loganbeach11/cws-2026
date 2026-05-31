// scripts/generate_super_regionals_intel_2026.cjs
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const regionalsIntelData = require("../src/data/regionalsIntel2026.json");

const outputPath = path.join(
  __dirname,
  "../src/data/superRegionalsIntel2026.json"
);

const matchupKeysById = {
  "1": "los-angeles-morgantown",
  "2": "gainesville-hattiesburg",
  "3": "chapel-hill-college-station",
  "4": "auburn-lincoln",
  "5": "atlanta-lawrence",
  "6": "tuscaloosa-tallahassee",
  "7": "austin-eugene",
  "8": "athens-starkville",
};
const TEAM_NAME_ALIASES = {
    "long island": "liu",
    "long island university": "liu",
    "long island university sharks": "liu",
    "st johns": "saint john's",
    "st john's": "saint john's",
    "southern miss.": "southern miss",
    "mississippi st": "mississippi state",
    "mississippi st.": "mississippi state",
  };

const stripSeed = (value) => {
  return String(value || "")
    .replace(/^\(\d+\)\s*/, "")
    .trim();
};

const normalizeTeamName = (value) => {
    const cleaned = stripSeed(value)
      .replace(/&amp;/g, "&")
      .replace(/’/g, "'")
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  
    return TEAM_NAME_ALIASES[cleaned] || cleaned;
  };

const isPlaceholderTeam = (value) => {
  const cleaned = String(value || "").trim().toLowerCase();

  return (
    !cleaned ||
    cleaned === "tbd" ||
    cleaned.includes("regional winner") ||
    cleaned.includes("winner")
  );
};

const buildTeamIntelLookup = () => {
  const lookup = new Map();

  const regionals = regionalsIntelData.regionals || [];

  regionals.forEach((regional) => {
    (regional.teams || []).forEach((team) => {
      const key = normalizeTeamName(team.team);

      if (!key) return;

      lookup.set(key, team);
    });
  });

  return lookup;
};

const makeEmptyTeamIntel = (teamName) => {
  return {
    team: teamName || "TBD",
    record: "",
    conference: "",
    conferenceRecord: "",
    rpi: "",
    sosRank: "",
    battingAvg: "",
    battingAvgRank: "",
    homeRuns: "",
    homeRunsRank: "",
    era: "",
    eraRank: "",
    fieldingPct: "",
    fieldingPctRank: "",
  };
};

const makeTeamIntel = (teamName, lookup) => {
  if (isPlaceholderTeam(teamName)) {
    return makeEmptyTeamIntel("TBD");
  }

  const key = normalizeTeamName(teamName);
  const found = lookup.get(key);

  if (!found) {
    console.warn(`⚠️ No stats found for: ${teamName}`);
    return makeEmptyTeamIntel(teamName);
  }

  return {
    ...found,

    // Keep the exact Super Regional display name.
    // Example: "(1) UCLA" if that is what is in Firestore.
    team: teamName,
  };
};

const main = async () => {
  console.log("Fetching Super Regionals from Firestore...");

  const superRegionalsRef = db
    .collection("superRegionals2026")
    .doc("regions");

  const snapshot = await superRegionalsRef.get();

  if (!snapshot.exists) {
    throw new Error("superRegionals2026/regions does not exist.");
  }

  const superRegionals = snapshot.data() || {};
  const teamIntelLookup = buildTeamIntelLookup();

  const output = {
    superRegionals: Object.entries(superRegionals)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([superRegionalId, region]) => {
        const team1 = region?.team1 || "TBD";
        const team2 = region?.team2 || "TBD";

        const superRegionalName = region?.name || "TBD Super Regional";

        return {
          superRegionalName,
          matchupKey:
            matchupKeysById[String(superRegionalId)] ||
            `super-regional-${superRegionalId}`,
          teams: [
            makeTeamIntel(team1, teamIntelLookup),
            makeTeamIntel(team2, teamIntelLookup),
          ],
        };
      }),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`✅ Wrote Super Regional intel data to: ${outputPath}`);
  console.log("");
  console.log("Next steps:");
  console.log("npm run build");
  console.log("firebase deploy --only hosting");
};

main().catch((error) => {
  console.error("❌ Failed to generate Super Regional intel data:");
  console.error(error);
  process.exit(1);
});

/*
  Command:

  node scripts/generate_super_regionals_intel_2026.cjs

  Then deploy updated data:

  npm run build
  firebase deploy --only hosting
*/