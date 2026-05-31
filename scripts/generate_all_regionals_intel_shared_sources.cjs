// scripts/generate_all_regionals_intel_shared_sources.cjs

const fs = require("fs");
const path = require("path");
const outputPath = path.join(process.cwd(), "src", "data", "regionalsIntel2026.json");

const loadExistingIntelData = () => {
  if (!fs.existsSync(outputPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch (error) {
    console.warn("⚠️ Could not read existing regionalsIntel2026.json. Continuing without fallback.");
    return null;
  }
};

const buildExistingTeamLookup = (existingData) => {
  const lookup = new Map();

  (existingData?.regionals || []).forEach((regional) => {
    (regional?.teams || []).forEach((team) => {
      if (!team?.team) return;

      lookup.set(normalizeName(team.team), team);
    });
  });

  return lookup;
};

const useNewOrOld = (newValue, oldValue) => {
  return newValue !== null && newValue !== undefined && newValue !== ""
    ? newValue
    : oldValue ?? null;
};

const REGIONALS = [
    {
      id: "losAngeles",
      name: "Los Angeles Regional",
      teams: [
        {
          seed: 1,
          team: "UCLA",
          aliases: ["UCLA"],
          conference: "Big Ten",
        },
        {
          seed: 2,
          team: "Virginia Tech",
          aliases: ["Virginia Tech"],
          conference: "ACC",
        },
        {
          seed: 3,
          team: "Cal Poly",
          aliases: ["Cal Poly"],
          conference: "Big West",
        },
        {
          seed: 4,
          team: "Saint Mary's",
          aliases: ["Saint Mary's College", "Saint Mary's (CA)", "Saint Mary's"],
          conference: "West Coast",
        },
      ],
    },
    {
      id: "morgantown",
      name: "Morgantown Regional",
      teams: [
        {
          seed: 1,
          team: "West Virginia",
          aliases: ["West Virginia"],
          conference: "Big 12",
        },
        {
          seed: 2,
          team: "Wake Forest",
          aliases: ["Wake Forest"],
          conference: "ACC",
        },
        {
          seed: 3,
          team: "Kentucky",
          aliases: ["Kentucky"],
          conference: "SEC",
        },
        {
          seed: 4,
          team: "Binghamton",
          aliases: ["Binghamton"],
          conference: "America East",
        },
      ],
    },
    {
      id: "gainesville",
      name: "Gainesville Regional",
      teams: [
        {
          seed: 1,
          team: "Florida",
          aliases: ["Florida"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "Miami",
          aliases: ["Miami (FL)", "Miami"],
          conference: "ACC",
        },
        {
          seed: 3,
          team: "Troy",
          aliases: ["Troy"],
          conference: "Sun Belt",
        },
        {
          seed: 4,
          team: "Rider",
          aliases: ["Rider"],
          conference: "MAAC",
        },
      ],
    },
    {
      id: "hattiesburg",
      name: "Hattiesburg Regional",
      teams: [
        {
          seed: 1,
          team: "Southern Miss",
          aliases: ["Southern Miss", "Southern Miss.", "Southern Mississippi"],
          conference: "Sun Belt",
        },
        {
          seed: 2,
          team: "Virginia",
          aliases: ["Virginia"],
          conference: "ACC",
        },
        {
          seed: 3,
          team: "Jacksonville State",
          aliases: ["Jacksonville State", "Jacksonville St."],
          conference: "Conference USA",
        },
        {
          seed: 4,
          team: "Little Rock",
          aliases: ["Little Rock"],
          conference: "Ohio Valley",
        },
      ],
    },
    {
      id: "chapelHill",
      name: "Chapel Hill Regional",
      teams: [
        {
          seed: 1,
          team: "North Carolina",
          aliases: ["North Carolina"],
          conference: "ACC",
        },
        {
          seed: 2,
          team: "Tennessee",
          aliases: ["Tennessee"],
          conference: "SEC",
        },
        {
          seed: 3,
          team: "East Carolina",
          aliases: ["East Carolina"],
          conference: "American",
        },
        {
          seed: 4,
          team: "VCU",
          aliases: ["VCU"],
          conference: "Atlantic 10",
        },
      ],
    },
    {
      id: "collegeStation",
      name: "College Station Regional",
      teams: [
        {
          seed: 1,
          team: "Texas A&M",
          aliases: ["Texas A&M"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "USC",
          aliases: ["USC", "Southern California"],
          conference: "Big Ten",
        },
        {
          seed: 3,
          team: "Texas State",
          aliases: ["Texas State", "Texas St."],
          conference: "Sun Belt",
        },
        {
          seed: 4,
          team: "Lamar",
          aliases: ["Lamar", "Lamar University"],
          conference: "Southland",
        },
      ],
    },
    {
      id: "auburn",
      name: "Auburn Regional",
      teams: [
        {
          seed: 1,
          team: "Auburn",
          aliases: ["Auburn"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "UCF",
          aliases: ["UCF"],
          conference: "Big 12",
        },
        {
          seed: 3,
          team: "NC State",
          aliases: ["North Carolina State", "NC State", "NC State"],
          conference: "ACC",
        },
        {
          seed: 4,
          team: "Milwaukee",
          aliases: ["Milwaukee"],
          conference: "Horizon League",
        },
      ],
    },
    {
      id: "lincoln",
      name: "Lincoln Regional",
      teams: [
        {
          seed: 1,
          team: "Nebraska",
          aliases: ["Nebraska"],
          conference: "Big Ten",
        },
        {
          seed: 2,
          team: "Ole Miss",
          aliases: ["Ole Miss"],
          conference: "SEC",
        },
        {
          seed: 3,
          team: "Arizona State",
          aliases: ["Arizona State", "Arizona St."],
          conference: "Big 12",
        },
        {
          seed: 4,
          team: "South Dakota State",
          aliases: ["South Dakota State", "South Dakota St."],
          conference: "The Summit League",
        },
      ],
    },
    {
      id: "atlanta",
      name: "Atlanta Regional",
      teams: [
        {
          seed: 1,
          team: "Georgia Tech",
          aliases: ["Georgia Tech"],
          conference: "ACC",
        },
        {
          seed: 2,
          team: "Oklahoma",
          aliases: ["Oklahoma"],
          conference: "SEC",
        },
        {
          seed: 3,
          team: "The Citadel",
          aliases: ["The Citadel"],
          conference: "Southern",
        },
        {
          seed: 4,
          team: "UIC",
          aliases: ["UIC"],
          conference: "Missouri Valley",
        },
      ],
    },
    {
      id: "lawrence",
      name: "Lawrence Regional",
      teams: [
        {
          seed: 1,
          team: "Kansas",
          aliases: ["Kansas"],
          conference: "Big 12",
        },
        {
          seed: 2,
          team: "Arkansas",
          aliases: ["Arkansas"],
          conference: "SEC",
        },
        {
          seed: 3,
          team: "Missouri State",
          aliases: ["Missouri State", "Missouri St."],
          conference: "Conference USA",
        },
        {
          seed: 4,
          team: "Northeastern",
          aliases: ["Northeastern"],
          conference: "Coastal Athletic",
        },
      ],
    },
    {
      id: "tuscaloosa",
      name: "Tuscaloosa Regional",
      teams: [
        {
          seed: 1,
          team: "Alabama",
          aliases: ["Alabama"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "Oklahoma State",
          aliases: ["Oklahoma State", "Oklahoma St."],
          conference: "Big 12",
        },
        {
          seed: 3,
          team: "USC Upstate",
          aliases: ["South Carolina Upstate", "USC Upstate"],
          conference: "Big South",
        },
        {
          seed: 4,
          team: "Alabama State",
          aliases: ["Alabama State", "Alabama St."],
          conference: "SWAC",
        },
      ],
    },
    {
      id: "tallahassee",
      name: "Tallahassee Regional",
      teams: [
        {
          seed: 1,
          team: "Florida State",
          aliases: ["Florida State", "Florida St."],
          conference: "ACC",
        },
        {
          seed: 2,
          team: "Coastal Carolina",
          aliases: ["Coastal Carolina"],
          conference: "Sun Belt",
        },
        {
          seed: 3,
          team: "NIU",
          aliases: ["Northern Illinois", "NIU"],
          conference: "Mid-American",
        },
        {
          seed: 4,
          team: "Saint John's",
          aliases: ["Saint John's", "St. John's", "St. John's (NY)"],
          conference: "Big East",
        },
      ],
    },
    {
      id: "austin",
      name: "Austin Regional",
      teams: [
        {
          seed: 1,
          team: "Texas",
          aliases: ["Texas"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "UC Santa Barbara",
          aliases: ["UC Santa Barbara"],
          conference: "Big West",
        },
        {
          seed: 3,
          team: "Tarleton State",
          aliases: ["Tarleton State", "Tarleton St."],
          conference: "Western Athletic",
        },
        {
          seed: 4,
          team: "Holy Cross",
          aliases: ["Holy Cross"],
          conference: "Patriot League",
        },
      ],
    },
    {
      id: "eugene",
      name: "Eugene Regional",
      teams: [
        {
          seed: 1,
          team: "Oregon",
          aliases: ["Oregon"],
          conference: "Big Ten",
        },
        {
          seed: 2,
          team: "Oregon State",
          aliases: ["Oregon State", "Oregon St."],
          conference: "Independent",
        },
        {
          seed: 3,
          team: "Washington State",
          aliases: ["Washington State", "Washington St."],
          conference: "Mountain West",
        },
        {
          seed: 4,
          team: "Yale",
          aliases: ["Yale"],
          conference: "Ivy League",
        },
      ],
    },
    {
      id: "athens",
      name: "Athens Regional",
      teams: [
        {
          seed: 1,
          team: "Georgia",
          aliases: ["Georgia"],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "Boston College",
          aliases: ["Boston College"],
          conference: "ACC",
        },
        {
          seed: 3,
          team: "Liberty",
          aliases: ["Liberty"],
          conference: "Conference USA",
        },
        {
          seed: 4,
          team: "LIU",
          aliases: ["Long Island", "LIU"],
          conference: "NEC",
        },
      ],
    },
    {
      id: "starkville",
      name: "Starkville Regional",
      teams: [
        {
          seed: 1,
          team: "Mississippi State",
          aliases: ["Mississippi State", "Mississippi St."],
          conference: "SEC",
        },
        {
          seed: 2,
          team: "Cincinnati",
          aliases: ["Cincinnati"],
          conference: "Big 12",
        },
        {
          seed: 3,
          team: "Louisiana",
          aliases: ["Louisiana"],
          conference: "Sun Belt",
        },
        {
          seed: 4,
          team: "Lipscomb",
          aliases: ["Lipscomb"],
          conference: "ASUN",
        },
      ],
    },
  ];

const NCAA_STATS_BASE = "https://www.ncaa.com/stats/baseball/d1";

const NCAA_CATEGORY_URLS = {
  battingAvg: `${NCAA_STATS_BASE}/current/team/210`,
  era: `${NCAA_STATS_BASE}/current/team/211`,
  homeRuns: `${NCAA_STATS_BASE}/current/team/513`,
  fieldingPct: `${NCAA_STATS_BASE}/current/team/212`,
};

const WARREN_NOLAN_RPI_URL =
  "https://www.warrennolan.com/baseball/2026/rpi-live";

const WARREN_NOLAN_SOS_URL =
  "https://www.warrennolan.com/baseball/2026/sos-rpi";

const cleanText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const normalizeName = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesTeam = (pageTeamName, targetTeam) => {
  const normalizedPageName = normalizeName(pageTeamName);

  return targetTeam.aliases.some(
    (alias) => normalizedPageName === normalizeName(alias)
  );
};

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });

  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);

  return cleanText(await response.text());
}

const buildNcaaPageUrls = (baseUrl, pageCount = 7) =>
  Array.from({ length: pageCount }, (_, index) =>
    index === 0 ? baseUrl : `${baseUrl}/p${index + 1}`
  );

const getNcaaTableSection = (text, categoryKey) => {
  const tableHeaders = {
    battingAvg: "Rank Team G AB H BA",
    era: "Rank Team G IP R ER ERA",
    homeRuns: "Rank Team G HR",
    fieldingPct: "Rank Team G PO A E PCT",
  };

  const header = tableHeaders[categoryKey];
  const headerIndex = text.indexOf(header);

  if (headerIndex === -1) return text;

  const footerIndex = text.indexOf("NCAA Footer", headerIndex);

  return footerIndex === -1
    ? text.slice(headerIndex)
    : text.slice(headerIndex, footerIndex);
};

const getCategoryConfig = (categoryKey) => {
  if (categoryKey === "battingAvg") {
    return {
      rowRegex:
        /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([.\d]+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        value: match[6],
      }),
    };
  }

  if (categoryKey === "era") {
    return {
      rowRegex:
        /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+([\d.]+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        value: match[7],
      }),
    };
  }

  if (categoryKey === "homeRuns") {
    return {
      rowRegex: /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        value: match[4],
      }),
    };
  }

  if (categoryKey === "fieldingPct") {
    return {
      rowRegex:
        /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([.\d]+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        value: match[7],
      }),
    };
  }

  return null;
};

const parseNcaaCategoryPage = (text, categoryKey) => {
  const config = getCategoryConfig(categoryKey);
  if (!config) return [];

  const tableText = getNcaaTableSection(text, categoryKey);
  const rows = [];
  let match;
  let lastRank = null;

  while ((match = config.rowRegex.exec(tableText)) !== null) {
    const row = config.buildRow(match);

    if (row.rank === null && lastRank !== null) row.rank = lastRank;
    if (Number.isFinite(row.rank)) lastRank = row.rank;

    if (row.team && row.value !== undefined && row.value !== null) {
      rows.push(row);
    }
  }

  return rows;
};

const findWarrenNolanRpiInfo = (text, team) => {
  for (const alias of team.aliases) {
    const escapedAlias = escapeRegExp(alias);
    const escapedConference = escapeRegExp(team.conference);

    const regex = new RegExp(
      `(\\d{1,3})\\s+${escapedAlias}\\s+${escapedConference}\\s+\\((\\d+-\\d+(?:-\\d+)?)\\)\\s+(\\d+-\\d+(?:-\\d+)?)\\s+(\\d{1,3})\\s+-->\\s+(\\d{1,3})`,
      "i"
    );

    const match = text.match(regex);

    if (match) {
      return {
        rpi: Number(match[1]),
        conference: team.conference,
        conferenceRecord: match[2],
        record: match[3],
        sosRankFromRpiPage: Number(match[5]),
      };
    }
  }

  return {
    rpi: null,
    conference: team.conference || null,
    conferenceRecord: null,
    record: null,
    sosRankFromRpiPage: null,
  };
};

const findWarrenNolanSosInfo = (text, team) => {
  for (const alias of team.aliases) {
    const escapedAlias = escapeRegExp(alias);

    const regex = new RegExp(
      `${escapedAlias}\\s+([0-9.]+)\\s+(\\d{1,3})\\s+(\\d+-\\d+)\\s+([0-9.]+)`,
      "i"
    );

    const match = text.match(regex);

    if (match) {
      return {
        sos: match[1],
        sosRank: Number(match[2]),
        opponentRecord: match[3],
        opponentWinPct: match[4],
      };
    }
  }

  return {
    sos: null,
    sosRank: null,
    opponentRecord: null,
    opponentWinPct: null,
  };
};

const mergeNcaaStatsForTeam = (categoryRowsByKey, team) => {
  const output = {};

  Object.entries(categoryRowsByKey).forEach(([key, rows]) => {
    const row = rows.find((candidate) => matchesTeam(candidate.team, team));

    output[key] = row?.value ?? null;
    output[`${key}Rank`] = row?.rank ?? null;
  });

  return output;
};

async function main() {
  const existingIntelData = loadExistingIntelData();
  const existingTeamLookup = buildExistingTeamLookup(existingIntelData);
  console.log("Fetching NCAA stat category pages...");

  const categoryRowsByKey = {};

  for (const [key, url] of Object.entries(NCAA_CATEGORY_URLS)) {
    const allRows = [];

    for (const pageUrl of buildNcaaPageUrls(url, 7)) {
      try {
        const text = await fetchText(pageUrl);
        const rows = parseNcaaCategoryPage(text, key);
        allRows.push(...rows);
      } catch (error) {
        console.warn(`⚠️ ${key}: ${error.message}`);
      }
    }

    categoryRowsByKey[key] = allRows;
    console.log(`✅ ${key}: parsed ${allRows.length} rows`);
  }

  console.log("\nFetching WarrenNolan RPI/SOS pages...");

  const rpiText = await fetchText(WARREN_NOLAN_RPI_URL);
  const sosText = await fetchText(WARREN_NOLAN_SOS_URL);

  console.log("✅ WarrenNolan pages fetched");

  const output = {
    sources: {
      ncaaStatsBase: NCAA_STATS_BASE,
      ncaaCategoryUrls: NCAA_CATEGORY_URLS,
      warrenNolanRpi: WARREN_NOLAN_RPI_URL,
      warrenNolanSos: WARREN_NOLAN_SOS_URL,
    },
    regionals: REGIONALS.map((regional) => ({
      regionalId: regional.id,
      regionalName: regional.name,
      teams: regional.teams.map((team) => {
        const ncaaStats = mergeNcaaStatsForTeam(categoryRowsByKey, team);
        const rpiInfo = findWarrenNolanRpiInfo(rpiText, team);
        const sosInfo = findWarrenNolanSosInfo(sosText, team);
        const oldTeam = existingTeamLookup.get(normalizeName(team.team)) || {};

        return {
          seed: team.seed,
          team: team.team,
          regionalName: regional.name,
        
          record: useNewOrOld(rpiInfo.record, oldTeam.record),
          conference: useNewOrOld(rpiInfo.conference, oldTeam.conference),
          conferenceRecord: useNewOrOld(
            rpiInfo.conferenceRecord,
            oldTeam.conferenceRecord
          ),
        
          rpi: useNewOrOld(rpiInfo.rpi, oldTeam.rpi),
          sos: useNewOrOld(sosInfo.sos, oldTeam.sos),
          sosRank: useNewOrOld(
            sosInfo.sosRank ?? rpiInfo.sosRankFromRpiPage,
            oldTeam.sosRank
          ),
        
          battingAvg: useNewOrOld(ncaaStats.battingAvg, oldTeam.battingAvg),
          battingAvgRank: useNewOrOld(
            ncaaStats.battingAvgRank,
            oldTeam.battingAvgRank
          ),
        
          homeRuns: useNewOrOld(
            ncaaStats.homeRuns ? Number(ncaaStats.homeRuns) : null,
            oldTeam.homeRuns
          ),
          homeRunsRank: useNewOrOld(ncaaStats.homeRunsRank, oldTeam.homeRunsRank),
        
          era: useNewOrOld(ncaaStats.era, oldTeam.era),
          eraRank: useNewOrOld(ncaaStats.eraRank, oldTeam.eraRank),
        
          fieldingPct: useNewOrOld(ncaaStats.fieldingPct, oldTeam.fieldingPct),
          fieldingPctRank: useNewOrOld(
            ncaaStats.fieldingPctRank,
            oldTeam.fieldingPctRank
          ),
        
          opponentRecord: useNewOrOld(sosInfo.opponentRecord, oldTeam.opponentRecord),
          opponentWinPct: useNewOrOld(sosInfo.opponentWinPct, oldTeam.opponentWinPct),
        };
      }),
    })),
    generatedAt: new Date().toISOString(),
  };

  const outputDir = path.join(process.cwd(), "src", "data");
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\n✅ All Regionals Intel generated");
  console.log(`Saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});