import React from "react";
import { useTournament2026 } from "../context/Tournament2026Context";
import "./Game.css";
import "./SuperRegionals2026.css";

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

  const {
    superRegionals,
    updateSuperRegional,
    user,
    superRegionalPicks,
    saveSuperRegionalPick,
  } = tournamentContext || {};

  /*
    Use Firebase/context data once available.
    Use defaultSuperRegionals as fallback so the visual section never disappears.
  */
  const displayedSuperRegionals =
    superRegionals && Object.keys(superRegionals).length > 0
      ? superRegionals
      : defaultSuperRegionals;

  const handleTeamUpdate = async (regionId, teamKey, value) => {
    if (!isAdmin || !updateSuperRegional) return;

    await updateSuperRegional(regionId, {
      [teamKey]: value,
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
    const isTBD = actualName.trim().toUpperCase() === "TBD";

    if (
      isAdmin ||
      region?.locked ||
      isTBD ||
      !user ||
      !saveSuperRegionalPick
    ) {
      return;
    }

    const currentPick = superRegionalPicks?.[regionId];
    const newPick = currentPick === actualName ? null : actualName;

    await saveSuperRegionalPick(user.uid, regionId, newPick);
  };

  const renderTeam = (regionId, teamKey) => {
    const region = displayedSuperRegionals[regionId];
    const actualName = region?.[teamKey] || "TBD";
    const isTBD = actualName.trim().toUpperCase() === "TBD";

    const userCurrentPick = superRegionalPicks?.[regionId];
    const isPicked = userCurrentPick === actualName;

    const winnerName = region?.winner?.trim();
    const isCorrect = isPicked && winnerName && actualName === winnerName;
    const isIncorrect = isPicked && winnerName && actualName !== winnerName;
    const isNeutral = isPicked && !winnerName;

    const shouldDisableHover = region?.locked && !isAdmin;

    return (
      <div
        key={teamKey}
        className={`team super-regional-team
          ${isCorrect ? "correct" : ""}
          ${isIncorrect ? "incorrect" : ""}
          ${isNeutral ? "picked" : ""}
          ${isTBD && !isAdmin ? "disabled" : ""}
          ${shouldDisableHover ? "locked" : ""}
        `}
        onClick={() => handleUserPick(regionId, actualName)}
      >
        {isAdmin ? (
          <input
            className={`admin-input ${
              region?.winner === actualName ? "winner-highlight" : ""
            }`}
            value={actualName}
            onChange={(e) => handleTeamUpdate(regionId, teamKey, e.target.value)}
            placeholder={teamKey === "team1" ? "Team 1" : "Team 2"}
          />
        ) : (
          <span
            className={`team-label ${
              region?.winner === actualName ? "winner-highlight" : ""
            }`}
          >
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
          correct pick will be worth 1 point. All super regional picks will be locked 
          on June 5th at x:xx pm.
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
    </section>
  );
}

export default SuperRegionals2026;