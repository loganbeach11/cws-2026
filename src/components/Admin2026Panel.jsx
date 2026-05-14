import React, { useEffect, useState } from "react";
import { useTournament2026 } from "../context/Tournament2026Context";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

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

  const [tiebreakerSettings, setTiebreakerSettings] = useState({
    active: false,
    testMode: true,
    predictionOpen: false,
    eligibleUsernamesText: "loganbeach13, log",
    eligibleUserIdsText: "",
    actualTotalRuns: "",
    bonusAmount: 0.5,
  });

  const [tiebreakerSaveStatus, setTiebreakerSaveStatus] = useState("");

  // Admin check — supports fake login email, real email, and Firebase UID
  const isAdmin =
    currentUser?.email === "loganbeach11@fake.com" ||
    currentUser?.email === "loganbeach11@gmail.com" ||
    currentUser?.uid === "YkazP10mdxXmQ2GrQkWyCfCeJHP2";

  useEffect(() => {
    const loadTiebreakerSettings = async () => {
      try {
        const settingsRef = doc(db, "tiebreaker2026", "settings");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data() || {};

          setTiebreakerSettings({
            active: data.active === true,
            testMode: data.testMode !== false,
            predictionOpen: data.predictionOpen === true,
            eligibleUsernamesText: Array.isArray(data.eligibleUsernames)
              ? data.eligibleUsernames.join(", ")
              : "loganbeach13, log",
            eligibleUserIdsText: Array.isArray(data.eligibleUserIds)
              ? data.eligibleUserIds.join(", ")
              : "",
            actualTotalRuns:
              data.actualTotalRuns === null || data.actualTotalRuns === undefined
                ? ""
                : String(data.actualTotalRuns),
            bonusAmount: Number(data.bonusAmount ?? 0.5),
          });
        } else {
          await setDoc(
            settingsRef,
            {
              active: false,
              testMode: true,
              predictionOpen: false,
              eligibleUsernames: ["loganbeach13", "log"],
              eligibleUserIds: [],
              actualTotalRuns: null,
              bonusAmount: 0.5,
              bonusWinnerUid: "",
              bonusWinnerUsername: "",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Error loading 2026 tiebreaker settings:", error);
      }
    };

    if (isAdmin) {
      loadTiebreakerSettings();
    }
  }, [isAdmin]);

  const cleanCommaSeparatedList = (value) => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleTiebreakerFieldChange = (field, value) => {
    setTiebreakerSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveTiebreakerSettings = async () => {
    const settingsRef = doc(db, "tiebreaker2026", "settings");

    const eligibleUsernames = cleanCommaSeparatedList(
      tiebreakerSettings.eligibleUsernamesText
    );

    const eligibleUserIds = cleanCommaSeparatedList(
      tiebreakerSettings.eligibleUserIdsText
    );

    const actualTotalRuns =
      tiebreakerSettings.actualTotalRuns === ""
        ? null
        : Number(tiebreakerSettings.actualTotalRuns);

    const bonusAmount = Number(tiebreakerSettings.bonusAmount || 0.5);

    try {
      await setDoc(
        settingsRef,
        {
          active: tiebreakerSettings.active,
          testMode: tiebreakerSettings.testMode,
          predictionOpen: tiebreakerSettings.predictionOpen,
          eligibleUsernames,
          eligibleUserIds,
          actualTotalRuns,
          bonusAmount,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setTiebreakerSaveStatus("✅ Tiebreaker settings saved");

      setTimeout(() => {
        setTiebreakerSaveStatus("");
      }, 2000);
    } catch (error) {
      console.error("Error saving 2026 tiebreaker settings:", error);
      setTiebreakerSaveStatus("❌ Could not save tiebreaker settings");
    }
  };

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
    const teamName = games?.[gameId]?.[teamKey] || "TBD";
    const currentWinner = games?.[gameId]?.winner;
    const newWinner = currentWinner === teamName ? "" : teamName;

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

    const oldTeamName = games?.[gameId]?.[field];
    const wasWinner = games?.[gameId]?.winner === oldTeamName;

    try {
      await setDoc(
        gamesDocRef,
        {
          [gameId]: {
            ...(games?.[gameId] || {}),
            [field]: value,
            ...(wasWinner ? { winner: "" } : {}),
          },
        },
        { merge: true }
      );

      setGames((prev) => ({
        ...prev,
        [gameId]: {
          ...(prev?.[gameId] || {}),
          [field]: value,
          ...(wasWinner ? { winner: "" } : {}),
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
          If there is a tiebreaker, use the tiebreaker settings below before
          turning this on.
        </p>
      </div>

      {/* Tiebreaker Settings */}
      <div className="border rounded p-4 mb-5 shadow-sm bg-yellow-50">
        <h3 className="font-bold text-lg mb-2">🏁 Final Series Tiebreaker</h3>

        <p className="text-sm text-gray-700 mb-4">
          Use this to test and later run the built-in tiebreaker. Test mode can
          allow specific users like <strong>loganbeach13</strong> and{" "}
          <strong>log</strong> to submit predictions before the real tournament.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={tiebreakerSettings.active}
              onChange={(e) =>
                handleTiebreakerFieldChange("active", e.target.checked)
              }
            />
            Tiebreaker Active
          </label>

          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={tiebreakerSettings.testMode}
              onChange={(e) =>
                handleTiebreakerFieldChange("testMode", e.target.checked)
              }
            />
            Test Mode
          </label>

          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={tiebreakerSettings.predictionOpen}
              onChange={(e) =>
                handleTiebreakerFieldChange("predictionOpen", e.target.checked)
              }
            />
            Prediction Open
          </label>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-bold mb-1">
            Eligible Usernames
          </label>
          <input
            className="w-full border rounded p-2"
            value={tiebreakerSettings.eligibleUsernamesText}
            onChange={(e) =>
              handleTiebreakerFieldChange(
                "eligibleUsernamesText",
                e.target.value
              )
            }
            placeholder="loganbeach13, log"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate usernames with commas. This is useful for test mode.
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-bold mb-1">
            Eligible User IDs
          </label>
          <input
            className="w-full border rounded p-2"
            value={tiebreakerSettings.eligibleUserIdsText}
            onChange={(e) =>
              handleTiebreakerFieldChange("eligibleUserIdsText", e.target.value)
            }
            placeholder="uid1, uid2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional. Firebase UIDs are safer than usernames for the real
            tiebreaker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-bold mb-1">
              Actual Total Runs
            </label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={tiebreakerSettings.actualTotalRuns}
              onChange={(e) =>
                handleTiebreakerFieldChange("actualTotalRuns", e.target.value)
              }
              placeholder="Example: 19"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total runs scored across the championship series.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Bonus Amount</label>
            <input
              type="number"
              step="0.5"
              className="w-full border rounded p-2"
              value={tiebreakerSettings.bonusAmount}
              onChange={(e) =>
                handleTiebreakerFieldChange("bonusAmount", e.target.value)
              }
              placeholder="0.5"
            />
            <p className="text-xs text-gray-500 mt-1">Usually 0.5 points.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveTiebreakerSettings}
          className="px-4 py-2 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-md"
        >
          Save Tiebreaker Settings
        </button>

        {tiebreakerSaveStatus && (
          <p className="text-sm font-semibold mt-3">{tiebreakerSaveStatus}</p>
        )}

        <div className="text-xs text-gray-600 mt-4 border-t pt-3">
          Next step: add the user-facing prediction box that appears only for
          eligible users when Prediction Open is turned on.
        </div>
      </div>

      {Object.entries(games || {}).map(([gameId, game]) => (
        <div key={gameId} className="border rounded p-3 mb-4 shadow-sm">
          <h3 className="font-semibold mb-2">Game {gameId}</h3>

          <div className="flex gap-4 mb-3">
            {/* Team 1 */}
            <div className="flex flex-col w-full">
              <input
                className={`p-1 rounded border ${
                  game?.winner === game?.team1
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300"
                }`}
                value={game?.team1 || ""}
                onChange={(e) => handleTeamUpdate(gameId, 0, e.target.value)}
                placeholder="Team 1"
              />

              <button
                className={`mt-1 text-sm rounded py-1 px-2 border ${
                  game?.winner === game?.team1
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
                  game?.winner === game?.team2
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300"
                }`}
                value={game?.team2 || ""}
                onChange={(e) => handleTeamUpdate(gameId, 1, e.target.value)}
                placeholder="Team 2"
              />

              <button
                className={`mt-1 text-sm rounded py-1 px-2 border ${
                  game?.winner === game?.team2
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