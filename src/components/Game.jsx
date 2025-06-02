import React from "react";
import { useTournament } from "../context/TournamentContext";
import "./Game.css";

function Game({ gameId, isAdmin }) {
  const { games, updateGame, user, saveUserPick, userPicks } = useTournament();
  const game = games?.[gameId];

  if (!game || Object.keys(game).length === 0) {
    return <div className="game-box">Invalid game</div>;
  }

  const updateTeam = (teamKey, value) => {
    if (isAdmin) {
      updateGame(gameId, { [teamKey]: value });
    }
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
    const isPicked = userCurrentPick === actualName;

    const winnerName = game.winner?.trim();
    const isCorrect = isPicked && actualName === winnerName;
    const isIncorrect = isPicked && winnerName && actualName !== winnerName;
    const isNeutral = isPicked && !winnerName;

    // Disable hover if the game is locked, user isn't admin, and team isn't their pick
    const shouldDisableHover = game.locked && !isPicked && !isAdmin;

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
          ${isNeutral ? "picked" : ""}
          ${isTBD && !isAdmin ? "disabled" : ""}
          ${shouldDisableHover ? "locked" : ""}
        `}
        onClick={handleClick}
      >
        {isAdmin ? (
          <input
            className={`admin-input ${game.winner === actualName ? "winner-highlight" : ""}`}
            value={actualName}
            onChange={(e) => updateTeam(teamKey, e.target.value)}
          />
        ) : (
          <span
            className={`team-label ${game.winner === actualName ? "winner-highlight" : ""}`}
          >
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
          <button onClick={() => setWinner("team1")}>Set {game.team1 || "Team 1"} Winner</button>
          <button onClick={() => setWinner("team2")}>Set {game.team2 || "Team 2"} Winner</button>
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
