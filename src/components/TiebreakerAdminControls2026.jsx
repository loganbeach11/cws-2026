import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

function TiebreakerAdminControls2026() {
  const [settings, setSettings] = useState({
    active: false,
    testMode: true,
    predictionOpen: false,
    eligibleUsernamesText: "loganbeach13, log",
    eligibleUserIdsText: "",
    actualTotalRuns: "",
    bonusAmount: 0.5,
    bonusWinnerUsername: "",
    bonusWinnerUid: "",
  });

  const [setupSaveStatus, setSetupSaveStatus] = useState("");
  const [finalRunsSaveStatus, setFinalRunsSaveStatus] = useState("");

  useEffect(() => {
    const settingsRef = doc(db, "tiebreaker2026", "settings");

    const unsubscribe = onSnapshot(settingsRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};

        setSettings({
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
          bonusWinnerUsername: data.bonusWinnerUsername || "",
          bonusWinnerUid: data.bonusWinnerUid || "",
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
    });

    return () => unsubscribe();
  }, []);

  const cleanCommaSeparatedList = (value) => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSetup = async () => {
    const settingsRef = doc(db, "tiebreaker2026", "settings");

    const eligibleUsernames = cleanCommaSeparatedList(
      settings.eligibleUsernamesText
    );

    const eligibleUserIds = cleanCommaSeparatedList(settings.eligibleUserIdsText);

    try {
      await setDoc(
        settingsRef,
        {
          active: settings.active,
          testMode: settings.testMode,
          predictionOpen: settings.predictionOpen,
          eligibleUsernames,
          eligibleUserIds,
          bonusAmount: Number(settings.bonusAmount || 0.5),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSetupSaveStatus("✅ Tiebreaker setup saved");

      setTimeout(() => {
        setSetupSaveStatus("");
      }, 2000);
    } catch (error) {
      console.error("Error saving tiebreaker setup:", error);
      setSetupSaveStatus("❌ Could not save setup");
    }
  };

  const handleSaveFinalRuns = async () => {
    const settingsRef = doc(db, "tiebreaker2026", "settings");

    if (settings.actualTotalRuns === "") {
      setFinalRunsSaveStatus("Enter the actual total runs first.");
      return;
    }

    const actualTotalRuns = Number(settings.actualTotalRuns);

    if (!Number.isFinite(actualTotalRuns) || actualTotalRuns < 0) {
      setFinalRunsSaveStatus("Actual total runs must be a valid number.");
      return;
    }

    try {
      await setDoc(
        settingsRef,
        {
          actualTotalRuns,
          bonusAmount: Number(settings.bonusAmount || 0.5),
          finalRunsSavedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setFinalRunsSaveStatus("✅ Final runs saved — bonus will calculate");

      setTimeout(() => {
        setFinalRunsSaveStatus("");
      }, 2500);
    } catch (error) {
      console.error("Error saving final runs:", error);
      setFinalRunsSaveStatus("❌ Could not save final runs");
    }
  };

  return (
    <div className="tiebreaker-admin-box">
      <div className="tiebreaker-admin-header">
        <div>
          <h3>🏁 Final Series Tiebreaker</h3>
          <p>
            Admin-only controls. Set up the tiebreaker before the final game,
            then enter actual total runs after the championship series ends.
          </p>
        </div>

        {settings.bonusWinnerUsername && (
          <div className="tiebreaker-current-winner">
            Bonus Winner: <strong>{settings.bonusWinnerUsername}</strong>
          </div>
        )}
      </div>

      <div className="tiebreaker-admin-subsection">
        <h4>Setup Before Final Game</h4>
        <p className="tiebreaker-admin-note">
          Turn on the tiebreaker and open predictions. Users can change their
          prediction until the final game is locked.
        </p>

        <div className="tiebreaker-admin-toggles">
          <label>
            <input
              type="checkbox"
              checked={settings.active}
              onChange={(e) => handleChange("active", e.target.checked)}
            />
            Tiebreaker Active
          </label>

          <label>
            <input
              type="checkbox"
              checked={settings.testMode}
              onChange={(e) => handleChange("testMode", e.target.checked)}
            />
            Test Mode
          </label>

          <label>
            <input
              type="checkbox"
              checked={settings.predictionOpen}
              onChange={(e) => handleChange("predictionOpen", e.target.checked)}
            />
            Prediction Open
          </label>
        </div>

        <div className="tiebreaker-admin-grid">
          <div className="tiebreaker-field full-width">
            <label>Eligible Usernames</label>
            <input
              value={settings.eligibleUsernamesText}
              onChange={(e) =>
                handleChange("eligibleUsernamesText", e.target.value)
              }
              placeholder="loganbeach13, log"
            />
            <small>
              Comma-separated usernames. Good for testing with loganbeach13 and
              log.
            </small>
          </div>

          <div className="tiebreaker-field full-width">
            <label>Eligible User IDs</label>
            <input
              value={settings.eligibleUserIdsText}
              onChange={(e) =>
                handleChange("eligibleUserIdsText", e.target.value)
              }
              placeholder="uid1, uid2"
            />
            <small>Optional, but safer for the real version.</small>
          </div>

          <div className="tiebreaker-field">
            <label>Bonus Amount</label>
            <input
              type="number"
              step="0.5"
              value={settings.bonusAmount}
              onChange={(e) => handleChange("bonusAmount", e.target.value)}
              placeholder="0.5"
            />
          </div>
        </div>

        <button className="tiebreaker-save-btn" onClick={handleSaveSetup}>
          Save Tiebreaker Setup
        </button>

        {setupSaveStatus && (
          <div className="tiebreaker-save-status">{setupSaveStatus}</div>
        )}
      </div>

      <div className="tiebreaker-admin-subsection final-results-section">
        <h4>Final Results After Series</h4>
        <p className="tiebreaker-admin-note">
          After the championship series is complete, enter the actual total runs.
          The system will award +{settings.bonusAmount || 0.5} to the closest
          eligible prediction that also picked the correct final winner.
        </p>

        <div className="tiebreaker-admin-grid">
          <div className="tiebreaker-field">
            <label>Actual Total Runs</label>
            <input
              type="number"
              value={settings.actualTotalRuns}
              onChange={(e) => handleChange("actualTotalRuns", e.target.value)}
              placeholder="Example: 19"
            />
          </div>

          <div className="tiebreaker-field">
            <label>Calculated Bonus Winner</label>
            <input
              value={
                settings.bonusWinnerUsername
                  ? settings.bonusWinnerUsername
                  : "Not calculated yet"
              }
              disabled
              readOnly
            />
          </div>
        </div>

        <button className="tiebreaker-save-btn" onClick={handleSaveFinalRuns}>
          Save Final Runs / Calculate Bonus
        </button>

        {finalRunsSaveStatus && (
          <div className="tiebreaker-save-status">{finalRunsSaveStatus}</div>
        )}
      </div>
    </div>
  );
}

export default TiebreakerAdminControls2026;