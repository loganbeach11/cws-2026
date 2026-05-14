import React from "react";
import { useTournament } from "../context/TournamentContext";
import "./Game.css";

function Game({ gameId, isAdmin }) {
  const { games, updateGame, user, saveUserPick, userPicks } = useTournament();
  const game = games?.[gameId];

  if (!game || Object.keys(game).length === 0) {
    return <div className="game-box">Invalid game</div>;
  }

  const normalizePick = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  const updateTeam = (teamKey, value) => {
    if (!isAdmin) return;

    const wasWinner =
      normalizePick(game.winner) === normalizePick(game[teamKey]);

    updateGame(gameId, {
      [teamKey]: value,
      ...(wasWinner ? { winner: "" } : {}),
    });
  };

  const setWinner = (teamKey) => {
    if (isAdmin) {
      const teamName = game[teamKey] || "TBD";
      const currentWinner = game.winner;
      const newWinner = currentWinner === teamName ? "" : teamName;

      updateGame(gameId, { winner: newWinner });
    }
  };

  const toggleLock = () => {
    if (isAdmin) {
      updateGame(gameId, { locked: !game.locked });
    }
  };

  const renderTeam = (teamKey) => {
    const actualName = game[teamKey] || "TBD";
    const isTBD = actualName.trim().toUpperCase() === "TBD";

    const userCurrentPick = userPicks?.[gameId];
    const isPicked =
      normalizePick(userCurrentPick) === normalizePick(actualName);

    const winnerName = game.winner?.trim() || "";
    const normalizedWinner = normalizePick(winnerName);

    const currentTeamNames = [game.team1, game.team2].map((team) =>
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

    // For 2025 past brackets:
    // Show the actual winner in gold even if this user made no pick.
    const isWinnerNotPicked = hasWinner && isActualWinner && !isPicked;

    const shouldDisableHover = game.locked && !isAdmin;

    const isLoserGame11or12 =
      actualName.includes("Loser Game 11 (if first loss)") ||
      actualName.includes("Loser Game 12 (if first loss)");

    const isLongTeamName = actualName.length >= 16;
    const isVeryLongTeamName = actualName.length >= 20;

    const getResultIcon = () => {
      if (isCorrect) return "✅";
      if (isIncorrect) return "❌";
      if (isWinnerNotPicked) return "🏆";
      return "";
    };

    const handleClick = () => {
      if (isAdmin || game.locked || isTBD || !user) return;

      const newPick = isPicked ? null : actualName;
      saveUserPick(user.uid, gameId, newPick);
    };

    return (
      <div
        className={`team
          ${isCorrect ? "correct" : ""}
          ${isIncorrect ? "incorrect" : ""}
          ${isWinnerNotPicked ? "winner-not-picked" : ""}
          ${isNeutral ? "picked" : ""}
          ${isTBD && !isAdmin ? "disabled" : ""}
          ${shouldDisableHover ? "locked" : ""}
        `}
        onClick={handleClick}
      >
        {isAdmin ? (
          <input
            className={`admin-input ${
              hasWinner &&
              normalizePick(game.winner) === normalizePick(actualName)
                ? "winner-highlight"
                : ""
            }`}
            value={actualName}
            onChange={(e) => updateTeam(teamKey, e.target.value)}
          />
        ) : (
          <span
            className={`team-label 
              ${
                hasWinner &&
                normalizePick(game.winner) === normalizePick(actualName)
                  ? "winner-highlight"
                  : ""
              }
              ${isLoserGame11or12 ? "small-text" : ""}
              ${isLongTeamName ? "long-team-name" : ""}
              ${isVeryLongTeamName ? "very-long-team-name" : ""}
            `}
          >
            {getResultIcon() && (
              <span className="result-icon">{getResultIcon()}</span>
            )}
            {actualName}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="game-box">
      {renderTeam("team1")}
      <span className="vs">vs</span>
      {renderTeam("team2")}

      {isAdmin && (
        <div className="admin-controls">
          <button onClick={() => setWinner("team1")}>
            Set {game.team1 || "Team 1"} Winner
          </button>

          <button onClick={() => setWinner("team2")}>
            Set {game.team2 || "Team 2"} Winner
          </button>

          <label>
            Lock:{" "}
            <input
              type="checkbox"
              checked={game.locked}
              onChange={toggleLock}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default Game;