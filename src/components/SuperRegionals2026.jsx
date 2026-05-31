import React from "react";
import { useTournament2026 } from "../context/Tournament2026Context";
import "./Game.css";
import "./SuperRegionals2026.css";
import { useState } from "react";
import SuperRegionalIntelModal2026 from "../components/SuperRegionalIntelModal2026";
import superRegionalsIntelData from "../data/superRegionalsIntel2026.json";

const defaultSuperRegionals = {
  "1": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "2": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "3": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "4": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "5": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "6": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "7": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
  "8": {
    name: "TBD Super Regional",
    team1: "TBD",
    team2: "TBD",
    winner: "",
    locked: false,
  },
};

function SuperRegionals2026({ isAdmin }) {
  const tournamentContext = useTournament2026();
  const [selectedSuperRegionalIntel, setSelectedSuperRegionalIntel] =
    useState(null);

  const {
    superRegionals,
    updateSuperRegional,
    user,
    superRegionalPicks,
    saveSuperRegionalPick,
  } = tournamentContext || {};

  const displayedSuperRegionals =
    superRegionals && Object.keys(superRegionals).length > 0
      ? superRegionals
      : defaultSuperRegionals;

  const normalizePick = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  const isPlaceholderTeam = (value) => {
    const cleanValue = (value || "").toString().trim();

    return (
      cleanValue.toUpperCase() === "TBD" ||
      cleanValue.toLowerCase().endsWith("winner")
    );
  };
  const normalizeName = (value) => {
    return (value || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };
  
  const getSuperRegionalIntel = (superRegional, superRegionalId) => {
    const name = normalizeName(superRegional?.name);
  
    const byName = superRegionalsIntelData.superRegionals.find(
      (item) => normalizeName(item.superRegionalName) === name
    );
  
    if (byName) return byName;
  
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
  
    return superRegionalsIntelData.superRegionals.find(
      (item) => item.matchupKey === matchupKeysById[String(superRegionalId)]
    );
  };

  const handleTeamUpdate = async (regionId, teamKey, value) => {
    if (!isAdmin || !updateSuperRegional) return;

    const region = displayedSuperRegionals[regionId];
    const wasWinner =
      normalizePick(region?.winner) === normalizePick(region?.[teamKey]);

    await updateSuperRegional(regionId, {
      [teamKey]: value,
      ...(wasWinner ? { winner: "" } : {}),
    });
  };

  const handleNameUpdate = async (regionId, value) => {
    if (!isAdmin || !updateSuperRegional) return;

    await updateSuperRegional(regionId, {
      name: value,
    });
  };

  const handleSetWinner = async (regionId, teamKey) => {
    if (!isAdmin || !updateSuperRegional) return;

    const region = displayedSuperRegionals[regionId];
    const teamName = region?.[teamKey] || "TBD";

    if (isPlaceholderTeam(teamName)) return;

    const newWinner = region?.winner === teamName ? "" : teamName;

    await updateSuperRegional(regionId, {
      winner: newWinner,
    });
  };

  const handleLockToggle = async (regionId) => {
    if (!isAdmin || !updateSuperRegional) return;

    const region = displayedSuperRegionals[regionId];

    await updateSuperRegional(regionId, {
      locked: !region?.locked,
    });
  };

  const handleUserPick = async (regionId, actualName) => {
    const region = displayedSuperRegionals[regionId];
    const isPlaceholder = isPlaceholderTeam(actualName);

    if (
      isAdmin ||
      region?.locked ||
      isPlaceholder ||
      !user ||
      !saveSuperRegionalPick
    ) {
      return;
    }

    const currentPick = superRegionalPicks?.[regionId];
    const newPick =
      normalizePick(currentPick) === normalizePick(actualName)
        ? null
        : actualName;

    await saveSuperRegionalPick(user.uid, regionId, newPick);
  };

  const renderTeam = (regionId, teamKey) => {
    const region = displayedSuperRegionals[regionId];
    const actualName = region?.[teamKey] || "TBD";
    const isPlaceholder = isPlaceholderTeam(actualName);

    const userCurrentPick = superRegionalPicks?.[regionId];
    const isPicked =
      normalizePick(userCurrentPick) === normalizePick(actualName);

    const winnerName = region?.winner?.trim() || "";
    const normalizedWinner = normalizePick(winnerName);

    const currentTeamNames = [region?.team1, region?.team2].map((team) =>
      normalizePick(team)
    );

    const hasWinner =
      Boolean(winnerName) &&
      normalizedWinner !== "tbd" &&
      currentTeamNames.includes(normalizedWinner);

    const isActualWinner =
      hasWinner && normalizePick(actualName) === normalizedWinner;

    const isCorrect = isPicked && isActualWinner;
    const isIncorrect = isPicked && hasWinner && !isActualWinner;
    const isNeutral = isPicked && !hasWinner;

    const isWinnerNotPicked = hasWinner && isActualWinner && !isPicked;

    const shouldDisableHover = region?.locked && !isAdmin;

    const getResultIcon = () => {
      if (isCorrect) return "✅";
      if (isIncorrect) return "❌";
      if (isWinnerNotPicked) return "🏆";
      return "";
    };

    const resultIcon = getResultIcon();
    const isLongResultName = resultIcon && actualName.length >= 16;
    const isVeryLongResultName = resultIcon && actualName.length >= 20;

    return (
      <div
        key={teamKey}
        className={`team super-regional-team
          ${isCorrect ? "correct" : ""}
          ${isIncorrect ? "incorrect" : ""}
          ${isWinnerNotPicked ? "winner-not-picked" : ""}
          ${isNeutral ? "picked" : ""}
          ${isPlaceholder && !isAdmin ? "disabled placeholder-team" : ""}
          ${shouldDisableHover ? "locked" : ""}
        `}
        onClick={() => handleUserPick(regionId, actualName)}
      >
        {isAdmin ? (
          <input
            className={`admin-input ${
              hasWinner &&
              normalizePick(region?.winner) === normalizePick(actualName)
                ? "winner-highlight"
                : ""
            }`}
            value={actualName}
            onChange={(e) => handleTeamUpdate(regionId, teamKey, e.target.value)}
            placeholder={teamKey === "team1" ? "Team 1" : "Team 2"}
          />
        ) : (
          <span
            className={`team-label
              ${
                hasWinner &&
                normalizePick(region?.winner) === normalizePick(actualName)
                  ? "winner-highlight"
                  : ""
              }
              ${isPlaceholder ? "placeholder-team-label" : ""}
            ${actualName.trim().toUpperCase() === "TBD" ? "tbd-placeholder-label" : ""}
              ${isLongResultName ? "long-team-name" : ""}
              ${isVeryLongResultName ? "very-long-team-name" : ""}
            `}
          >
            {resultIcon && <span className="result-icon">{resultIcon}</span>}
            {actualName}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="super-regionals-section">
      <div className="super-regionals-header">
        <h2>Road to Omaha: Super Regional Picks</h2>
        <p>
          Pick the 8 teams you think will punch their ticket to Omaha. Each
          correct pick will be worth 15 points. All Super Regional picks will be
          locked on June 5th at x:xx pm.
        </p>
      </div>

      <div className="super-regionals-grid">
        {Object.entries(displayedSuperRegionals).map(([regionId, region]) => (
          <div key={regionId} className="super-regional-card">
            <div className="super-regional-card-header">
              {isAdmin ? (
                <input
                  className="super-regional-name-input"
                  value={region?.name || "TBD Super Regional"}
                  onChange={(e) => handleNameUpdate(regionId, e.target.value)}
                  placeholder="TBD Super Regional"
                />
              ) : (
                <h3>{region?.name || "TBD Super Regional"}</h3>
              )}

              <span
                className={`super-regional-status ${
                  region?.locked ? "locked-status" : "open-status"
                }`}
              >
                {region?.locked ? "🔒 Locked" : "🔓 Open"}
              </span>
            </div>

            <div className="super-regional-teams">
              {renderTeam(regionId, "team1")}

              <span className="super-regional-vs">vs</span>

              {renderTeam(regionId, "team2")}
            </div>

            {getSuperRegionalIntel(region, regionId) && (
              <button
                type="button"
                className="super-regional-intel-button"
                onClick={(event) => {
                  event.stopPropagation();
                      setSelectedSuperRegionalIntel(getSuperRegionalIntel(region, regionId));
                  }}
              >
            📊 Matchup Intel
            </button>
              )}

            {isAdmin && (
              <div className="super-regional-admin-controls">
                <div className="super-regional-winner-buttons">
                  <button onClick={() => handleSetWinner(regionId, "team1")}>
                    Set Team 1 Winner
                  </button>
                  <button onClick={() => handleSetWinner(regionId, "team2")}>
                    Set Team 2 Winner
                  </button>
                </div>

                <button
                  className={`super-regional-lock-button ${
                    region?.locked ? "locked-button" : "unlocked-button"
                  }`}
                  onClick={() => handleLockToggle(regionId)}
                >
                  {region?.locked ? "🔒 Locked" : "🔓 Unlocked"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <SuperRegionalIntelModal2026
        isOpen={Boolean(selectedSuperRegionalIntel)}
        superRegionalIntel={selectedSuperRegionalIntel}
        onClose={() => setSelectedSuperRegionalIntel(null)}
      />
    </section>
  );
}

export default SuperRegionals2026;