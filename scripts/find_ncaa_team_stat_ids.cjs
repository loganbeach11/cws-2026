// scripts/find_ncaa_team_stat_ids.cjs

const NCAA_STATS_BASE = "https://www.ncaa.com/stats/baseball/d1/current/team";

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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  return cleanText(html);
}

async function main() {
  console.log("Searching NCAA team stat category IDs...");

  for (let id = 200; id <= 540; id++) {
    const url = `${NCAA_STATS_BASE}/${id}`;

    try {
      const text = await fetchText(url);
      if (!text) continue;

      const tableStart = text.indexOf("Rank Team");
      if (tableStart === -1) continue;

      const section = text.slice(tableStart, tableStart + 1200);

      const isTeamStatsPage = section.includes("Rank Team");
      const hasGeorgia = section.includes("Georgia");
      const hasAvgHeader =
        section.includes("AVG") ||
        section.includes("BA") ||
        section.includes("Batting Average");

      const hasBattingAverageTitle =
        text.includes("TEAM STATISTICS") &&
        text.includes("Batting Average") &&
        section.match(/Rank Team G/i);

      if (isTeamStatsPage && hasGeorgia && (hasAvgHeader || hasBattingAverageTitle)) {
        console.log("\nPossible match:");
        console.log(`ID: ${id}`);
        console.log(`URL: ${url}`);
        console.log(section.slice(0, 800));
      }
    } catch (error) {
      // Ignore bad IDs
    }
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});