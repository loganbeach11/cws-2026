// scripts/generate_athens_intel_shared_sources.cjs

const fs = require("fs");
const path = require("path");

const ATHENS_TEAMS = [
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
      aliases: ["LIU", "Long Island"],
      conference: "NEC",
    },
  ];

const NCAA_STATS_BASE = "https://www.ncaa.com/stats/baseball/d1";

const WARREN_NOLAN_RPI_URL =
  "https://www.warrennolan.com/baseball/2026/rpi-live";

const WARREN_NOLAN_SOS_URL =
  "https://www.warrennolan.com/baseball/2026/sos-rpi";

/*
  Known working/partially working category URLs from testing:
  - ERA page: /team/211
  - Home Runs page: /team/513
  - Fielding Percentage page: /team/212

  Batting average URL still needs to be confirmed, so we leave it out for now
  instead of accidentally parsing the wrong table.
*/
const NCAA_CATEGORY_URLS = {
    battingAvg: `${NCAA_STATS_BASE}/current/team/210`,
    era: `${NCAA_STATS_BASE}/current/team/211`,
    homeRuns: `${NCAA_STATS_BASE}/current/team/513`,
    fieldingPct: `${NCAA_STATS_BASE}/current/team/212`,
  };

const cleanText = (html) => {
  return html
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
};

const normalizeName = (value) => {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
};

const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const matchesTeam = (pageTeamName, targetTeam) => {
    const normalizedPageName = normalizeName(pageTeamName);
  
    return targetTeam.aliases.some((alias) => {
      const normalizedAlias = normalizeName(alias);
      return normalizedPageName === normalizedAlias;
    });
  };

  const buildNcaaPageUrls = (baseUrl, pageCount = 7) => {
    return Array.from({ length: pageCount }, (_, index) => {
      if (index === 0) return baseUrl;
      return `${baseUrl}/p${index + 1}`;
    });
  };
async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  return cleanText(html);
}

const saveDebugText = (name, text) => {
  const debugDir = path.join(process.cwd(), "debug");
  fs.mkdirSync(debugDir, { recursive: true });

  const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const outputPath = path.join(debugDir, `${safeName}.txt`);

  fs.writeFileSync(outputPath, text.slice(0, 50000));
};

const getCategoryConfig = (categoryKey) => {
  if (categoryKey === "era") {
    return {
      valueField: "era",
      rowRegex:
        /(\d{1,3})\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+([\d.]+)/g,
      buildRow: (match) => ({
        rank: Number(match[1]),
        team: match[2].trim(),
        games: Number(match[3]),
        inningsPitched: match[4],
        runs: Number(match[5]),
        earnedRuns: Number(match[6]),
        value: match[7],
      }),
    };
  }
  if (categoryKey === "battingAvg") {
    return {
      valueField: "battingAvg",
      rowRegex:
        /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([.\d]+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        games: Number(match[3]),
        atBats: Number(match[4]),
        hits: Number(match[5]),
        value: match[6],
      }),
    };
  }
  if (categoryKey === "homeRuns") {
    return {
      valueField: "homeRuns",
      rowRegex:
        /(\d{1,3}|-)\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)/g,
      buildRow: (match) => ({
        rank: match[1] === "-" ? null : Number(match[1]),
        team: match[2].trim(),
        games: Number(match[3]),
        value: match[4],
      }),
    };
  }

  if (categoryKey === "fieldingPct") {
    return {
      valueField: "fieldingPct",
      rowRegex:
        /(\d{1,3})\s+([A-Za-z0-9 .&'()\-]+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([.\d]+)/g,
      buildRow: (match) => ({
        rank: Number(match[1]),
        team: match[2].trim(),
        games: Number(match[3]),
        putouts: Number(match[4]),
        assists: Number(match[5]),
        errors: Number(match[6]),
        value: match[7],
      }),
    };
  }

  return null;
};

const getNcaaTableSection = (text, categoryKey) => {
    const tableHeaders = {
        battingAvg: "Rank Team G AVG",
        era: "Rank Team G IP R ER ERA",
        homeRuns: "Rank Team G HR",
        fieldingPct: "Rank Team G PO A E FLD PCT",
      };
    const header = tableHeaders[categoryKey];
    const headerIndex = text.indexOf(header);
  
    if (headerIndex === -1) {
      return text;
    }
  
    const footerIndex = text.indexOf("NCAA Footer", headerIndex);
  
    return footerIndex === -1
      ? text.slice(headerIndex)
      : text.slice(headerIndex, footerIndex);
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
      if (row.rank === null && lastRank !== null) {
        row.rank = lastRank;
      }
      
      if (Number.isFinite(row.rank)) {
        lastRank = row.rank;
      }

      if (
        (row.rank === null || (Number.isFinite(row.rank) && row.rank > 0 && row.rank < 400)) &&
        row.team &&
        row.value !== undefined &&
        row.value !== null
      ) {
        rows.push(row);
      }
    }
  
    return rows;
  };

const findWarrenNolanRpiInfo = (text, team) => {
    for (const alias of team.aliases) {
      const escapedAlias = escapeRegExp(alias);
      const escapedConference = team.conference
        ? escapeRegExp(team.conference)
        : "(.+?)";
  
      /*
        WarrenNolan RPI row format:
        7 Georgia SEC (23-7) 46-12 7 --> 24
        34 Boston College ACC (17-13) 36-21 34 --> 52
        199 Long Island NEC (26-7) 30-20 199 --> 297
      */
      const regex = new RegExp(
        `(\\d{1,3})\\s+${escapedAlias}\\s+${escapedConference}\\s+\\((\\d+-\\d+(?:-\\d+)?)\\)\\s+(\\d+-\\d+(?:-\\d+)?)\\s+(\\d{1,3})\\s+-->\\s+(\\d{1,3})`,
        "i"
      );
  
      const match = text.match(regex);
  
      if (match) {
        return {
          rpi: Number(match[1]),
          conference: team.conference || match[2].trim(),
          conferenceRecord: match[2],
          record: match[3],
          rpiRepeated: Number(match[4]),
          sosRankFromRpiPage: Number(match[5]),
        };
      }
    }
  
    return {
      rpi: null,
      conference: null,
      conferenceRecord: null,
      record: null,
      rpiRepeated: null,
      sosRankFromRpiPage: null,
    };
  };

const findWarrenNolanSosInfo = (text, team) => {
  for (const alias of team.aliases) {
    const escapedAlias = escapeRegExp(alias);

    /*
      WarrenNolan SOS row format from debug:
      Georgia 0.5587 24 1741-1359 0.5616
      Boston College 0.5429 52 1628-1298 0.5563
      Liberty 0.5364 64 1688-1417 0.5436
      Long Island 0.4256 297 1016-1338 0.4318
    */
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

    if (row) {
      output[key] = row.value;
      output[`${key}Rank`] = row.rank;
    } else {
      output[key] = null;
      output[`${key}Rank`] = null;
    }
  });

  return output;
};

async function main() {
  console.log("Fetching NCAA stat category pages...");

  const categoryRowsByKey = {};

  for (const [key, url] of Object.entries(NCAA_CATEGORY_URLS)) {
    try {
      const pageUrls = buildNcaaPageUrls(url, 7);
      const allRows = [];
  
      for (let i = 0; i < pageUrls.length; i++) {
        const pageUrl = pageUrls[i];
  
        try {
          const text = await fetchText(pageUrl);
          saveDebugText(`ncaa_${key}_p${i + 1}`, text);
  
          const rows = parseNcaaCategoryPage(text, key);
          allRows.push(...rows);
  
          console.log(
            `✅ ${key} page ${i + 1}: parsed ${rows.length} rows from ${pageUrl}`
          );
        } catch (pageError) {
          console.warn(`⚠️ ${key} page ${i + 1}: ${pageError.message}`);
        }
      }
  
      categoryRowsByKey[key] = allRows;
  
      console.log(`✅ ${key}: parsed ${allRows.length} total rows`);
    } catch (error) {
      console.warn(`⚠️ ${key}: ${error.message}`);
      categoryRowsByKey[key] = [];
    }
  }

  console.log("\nFetching WarrenNolan RPI/SOS pages...");

  let rpiText = "";
  let sosText = "";

  try {
    rpiText = await fetchText(WARREN_NOLAN_RPI_URL);
    saveDebugText("warren_nolan_rpi", rpiText);
    console.log("✅ WarrenNolan RPI page fetched");
  } catch (error) {
    console.warn(`⚠️ WarrenNolan RPI fetch failed: ${error.message}`);
  }

  try {
    sosText = await fetchText(WARREN_NOLAN_SOS_URL);
    saveDebugText("warren_nolan_sos", sosText);
    console.log("✅ WarrenNolan SOS page fetched");
  } catch (error) {
    console.warn(`⚠️ WarrenNolan SOS fetch failed: ${error.message}`);
  }

  const teams = ATHENS_TEAMS.map((team) => {
    const ncaaStats = mergeNcaaStatsForTeam(categoryRowsByKey, team);
    const rpiInfo = findWarrenNolanRpiInfo(rpiText, team);
    const sosInfo = findWarrenNolanSosInfo(sosText, team);

    return {
      seed: team.seed,
      team: team.team,
      regionalName: "Athens Regional",

      record: rpiInfo.record,
      conference: rpiInfo.conference,
      conferenceRecord: rpiInfo.conferenceRecord,

      rpi: rpiInfo.rpi,
      sos: sosInfo.sos,
      sosRank: sosInfo.sosRank ?? rpiInfo.sosRankFromRpiPage,

      battingAvg: ncaaStats.battingAvg,
battingAvgRank: ncaaStats.battingAvgRank,

      homeRuns: ncaaStats.homeRuns ? Number(ncaaStats.homeRuns) : null,
      homeRunsRank: ncaaStats.homeRunsRank,

      era: ncaaStats.era,
      eraRank: ncaaStats.eraRank,

      fieldingPct: ncaaStats.fieldingPct,
      fieldingPctRank: ncaaStats.fieldingPctRank,

      opponentRecord: sosInfo.opponentRecord,
      opponentWinPct: sosInfo.opponentWinPct,
    };
  });

  const output = {
    regionalId: "athens",
    regionalName: "Athens Regional",
    sources: {
      ncaaStatsBase: NCAA_STATS_BASE,
      ncaaCategoryUrls: NCAA_CATEGORY_URLS,
      warrenNolanRpi: WARREN_NOLAN_RPI_URL,
      warrenNolanSos: WARREN_NOLAN_SOS_URL,
    },
    teams,
    generatedAt: new Date().toISOString(),
  };

  const outputDir = path.join(process.cwd(), "src", "data");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "athensRegionalIntelShared2026.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\n✅ Athens Regional Intel Preview:\n");
  console.log(JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outputPath}`);
  console.log("\nDebug text saved in /debug if a parser needs tweaking.");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});