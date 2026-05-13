import React from "react";
import { useTournament2026 } from "../context/Tournament2026Context";
import "./Game.css";
import "./Regionals2026.css";

const defaultRegionals = {};

for (let i = 1; i <= 16; i++) {
  defaultRegionals[String(i)] = {
    name: "TBD Regional",
    team1: "TBD",
    team2: "TBD",
    team3: "TBD",
    team4: "TBD",
    winner: "",
    locked: false,
  };
}

function Regionals2026({ isAdmin }) {
  const {
    regionals,
    updateRegional,
    user,
    regionalPicks,
    saveRegionalPick,
  } = useTournament2026();

  /*
    Use Firebase/context data once available.
    Use defaultRegionals as fallback so the visual section never disappears.
  */
  const displayedRegionals =
    regionals && Object.keys(regionals).length > 0 ? regionals : defaultRegionals;

  const handleNameUpdate = async (regionalId, value) => {
    if (!isAdmin || !updateRegional) return;

    await updateRegional(regionalId, {
      name: value,
    });
  };

  const handleTeamUpdate = async (regionalId, teamKey, value) => {
    if (!isAdmin || !updateRegional) return;

    await updateRegional(regionalId, {
      [teamKey]: value,
    });
  };

  const handleSetWinner = async (regionalId, teamKey) => {
    if (!isAdmin || !updateRegional) return;

    const regional = displayedRegionals[regionalId];
    const teamName = regional?.[teamKey] || "TBD";
    const newWinner = regional?.winner === teamName ? "" : teamName;

    await updateRegional(regionalId, {
      winner: newWinner,
    });
  };

  const handleLockToggle = async (regionalId) => {
    if (!isAdmin || !updateRegional) return;

    const regional = displayedRegionals[regionalId];

    await updateRegional(regionalId, {
      locked: !regional?.locked,
    });
  };

  const handleUserPick = async (regionalId, actualName) => {
    const regional = displayedRegionals[regionalId];
    const isTBD = actualName.trim().toUpperCase() === "TBD";

    if (
      isAdmin ||
      regional?.locked ||
      isTBD ||
      !user ||
      !saveRegionalPick
    ) {
      return;
    }

    const currentPick = regionalPicks?.[regionalId];
    const newPick = currentPick === actualName ? null : actualName;

    await saveRegionalPick(user.uid, regionalId, newPick);
  };

  const renderTeam = (regionalId, teamKey) => {
    const regional = displayedRegionals[regionalId];
    const actualName = regional?.[teamKey] || "TBD";
    const isTBD = actualName.trim().toUpperCase() === "TBD";

    const userCurrentPick = regionalPicks?.[regionalId];
    const isPicked = userCurrentPick === actualName;

    const winnerName = regional?.winner?.trim();
    const isCorrect = isPicked && winnerName && actualName === winnerName;
    const isIncorrect = isPicked && winnerName && actualName !== winnerName;
    const isNeutral = isPicked && !winnerName;

    const shouldDisableHover = regional?.locked && !isAdmin;

    return (
      <div
        key={teamKey}
        className={`team regional-team
          ${isCorrect ? "correct" : ""}
          ${isIncorrect ? "incorrect" : ""}
          ${isNeutral ? "picked" : ""}
          ${isTBD && !isAdmin ? "disabled" : ""}
          ${shouldDisableHover ? "locked" : ""}
        `}
        onClick={() => handleUserPick(regionalId, actualName)}
      >
        {isAdmin ? (
          <input
            className={`admin-input ${
              regional?.winner === actualName ? "winner-highlight" : ""
            }`}
            value={actualName}
            onChange={(e) =>
              handleTeamUpdate(regionalId, teamKey, e.target.value)
            }
            placeholder={
              teamKey === "team1"
                ? "Team 1"
                : teamKey === "team2"
                ? "Team 2"
                : teamKey === "team3"
                ? "Team 3"
                : "Team 4"
            }
          />
        ) : (
          <span
            className={`team-label ${
              regional?.winner === actualName ? "winner-highlight" : ""
            }`}
          >
            {actualName}
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="regionals-section">
      <div className="regionals-header">
        <h2>Road to Omaha: Regional Picks</h2>
        <p>
          Pick the 16 teams you think will advance to Super Regionals. Each
          correct pick will be worth 1 point. All Regional picks will lock on May
          29th at x:xx pm.
        </p>
      </div>

      <div className="regionals-grid">
        {Object.entries(displayedRegionals).map(([regionalId, regional]) => (
          <div key={regionalId} className="regional-card">
            <div className="regional-card-header">
              {isAdmin ? (
                <input
                  className="regional-name-input"
                  value={regional?.name || "TBD Regional"}
                  onChange={(e) => handleNameUpdate(regionalId, e.target.value)}
                  placeholder="TBD Regional"
                />
              ) : (
                <h3>{regional?.name || "TBD Regional"}</h3>
              )}

              <span
                className={`regional-status ${
                  regional?.locked ? "locked-status" : "open-status"
                }`}
              >
                {regional?.locked ? "🔒 Locked" : "🔓 Open"}
              </span>
            </div>

            <div className="regional-teams">
              {renderTeam(regionalId, "team1")}
              {renderTeam(regionalId, "team2")}
              {renderTeam(regionalId, "team3")}
              {renderTeam(regionalId, "team4")}
            </div>

            {isAdmin && (
              <div className="regional-admin-controls">
                <div className="regional-winner-buttons">
                  <button onClick={() => handleSetWinner(regionalId, "team1")}>
                    Set Team 1 Winner
                  </button>
                  <button onClick={() => handleSetWinner(regionalId, "team2")}>
                    Set Team 2 Winner
                  </button>
                  <button onClick={() => handleSetWinner(regionalId, "team3")}>
                    Set Team 3 Winner
                  </button>
                  <button onClick={() => handleSetWinner(regionalId, "team4")}>
                    Set Team 4 Winner
                  </button>
                </div>

                <button
                  className={`regional-lock-button ${
                    regional?.locked ? "locked-button" : "unlocked-button"
                  }`}
                  onClick={() => handleLockToggle(regionalId)}
                >
                  {regional?.locked ? "🔒 Locked" : "🔓 Unlocked"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Regionals2026;