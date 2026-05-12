import React from "react";
import { useTournament2026 } from "../context/Tournament2026Context";
import { db } from "../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export default function Admin2026Panel() {
  console.log("✅ Admin2026Panel is rendering");
  const {
    currentUser,
    lockStatus,
    setLockStatus,
    games,
    setGames,
    tournamentComplete,
    updateTournamentComplete,
  } = useTournament2026?.() || {};

  // Admin email check
  const isAdmin = currentUser?.email === "loganbeach11@gmail.com";

  const handleTournamentCompleteToggle = async () => {
    const newCompleteStatus = !tournamentComplete;

    try {
      await updateTournamentComplete(newCompleteStatus);
    } catch (error) {
      console.error("Error updating 2026 tournament complete status:", error);
      alert("Could not update tournament complete status. Check the console.");
    }
  };

  const handleSetWinner = async (gameId, teamKey) => {
    const currentWinner = games?.[gameId]?.winner;
    const newWinner = currentWinner === teamKey ? "" : teamKey;

    const gamesDocRef = doc(db, "tournament2026", "games");

    try {
      await setDoc(
        gamesDocRef,
        {
          [gameId]: {
            ...(games?.[gameId] || {}),
            winner: newWinner,
          },
        },
        { merge: true }
      );

      setGames((prev) => ({
        ...prev,
        [gameId]: {
          ...(prev?.[gameId] || {}),
          winner: newWinner,
        },
      }));
    } catch (error) {
      console.error(`Error setting winner for 2026 game ${gameId}:`, error);
      alert("Could not update winner. Check the console.");
    }
  };

  const handleLockToggle = async (gameId) => {
    const newLocked = !lockStatus?.[gameId];
    const lockDocRef = doc(db, "lockStatus2026", gameId);

    try {
      await updateDoc(lockDocRef, { locked: newLocked }).catch(async () => {
        await setDoc(lockDocRef, { locked: newLocked });
      });

      setLockStatus((prev) => ({
        ...prev,
        [gameId]: newLocked,
      }));
    } catch (error) {
      console.error(`Error updating lock status for 2026 game ${gameId}:`, error);
      alert("Could not update lock status. Check the console.");
    }
  };

  const handleTeamUpdate = async (gameId, teamIndex, value) => {
    const field = teamIndex === 0 ? "team1" : "team2";
    const gamesDocRef = doc(db, "tournament2026", "games");

    try {
      await setDoc(
        gamesDocRef,
        {
          [gameId]: {
            ...(games?.[gameId] || {}),
            [field]: value,
          },
        },
        { merge: true }
      );

      setGames((prev) => ({
        ...prev,
        [gameId]: {
          ...(prev?.[gameId] || {}),
          [field]: value,
        },
      }));
    } catch (error) {
      console.error(`Error updating team for 2026 game ${gameId}:`, error);
      alert("Could not update team name. Check the console.");
    }
  };

  if (!isAdmin) {
    return (
      <p className="text-center mt-4 text-red-600 font-semibold">
        Admin access only.
      </p>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4 text-center">
        🛠️ Admin Panel — 2026
      </h2>

      {/* Tournament Complete Switch */}
      <div className="border rounded p-4 mb-5 shadow-sm bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Tournament Complete</h3>
            <p className="text-sm text-gray-600">
              Turn this on when the 2026 tournament is finished. Users will be
              sent to the winner or loser screen based on the highest leaderboard
              score.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTournamentCompleteToggle}
            className={`px-4 py-2 rounded text-white font-semibold shadow-md transition-colors duration-200 whitespace-nowrap ${
              tournamentComplete
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {tournamentComplete ? "Complete: ON" : "Complete: OFF"}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          If there is a tiebreaker, add the +0.5 adjustment in
          Tournament2026Context.jsx before turning this on.
        </p>
      </div>

      {Object.entries(games || {}).map(([gameId, game]) => (
        <div key={gameId} className="border rounded p-3 mb-4 shadow-sm">
          <h3 className="font-semibold mb-2">Game {gameId}</h3>

          <div className="flex gap-4 mb-3">
            {/* Team 1 */}
            <div className="flex flex-col w-full">
              <input
                className={`p-1 rounded border ${
                  game?.winner === "team1"
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300"
                }`}
                value={game?.team1 || ""}
                onChange={(e) => handleTeamUpdate(gameId, 0, e.target.value)}
                placeholder="Team 1"
              />

              <button
                className={`mt-1 text-sm rounded py-1 px-2 border ${
                  game?.winner === "team1"
                    ? "bg-blue-200 border-blue-500 font-semibold"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handleSetWinner(gameId, "team1")}
              >
                Set Team 1 Winner
              </button>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col w-full">
              <input
                className={`p-1 rounded border ${
                  game?.winner === "team2"
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300"
                }`}
                value={game?.team2 || ""}
                onChange={(e) => handleTeamUpdate(gameId, 1, e.target.value)}
                placeholder="Team 2"
              />

              <button
                className={`mt-1 text-sm rounded py-1 px-2 border ${
                  game?.winner === "team2"
                    ? "bg-blue-200 border-blue-500 font-semibold"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => handleSetWinner(gameId, "team2")}
              >
                Set Team 2 Winner
              </button>
            </div>
          </div>

          <button
            className={`px-4 py-2 rounded text-white font-semibold shadow-md transition-colors duration-200 ${
              lockStatus?.[gameId]
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            onClick={() => handleLockToggle(gameId)}
          >
            {lockStatus?.[gameId] ? "🔒 Locked" : "🔓 Unlocked"}
          </button>
        </div>
      ))}
    </div>
  );
}