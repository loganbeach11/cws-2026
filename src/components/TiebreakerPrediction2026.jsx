import React, { useEffect, useState } from "react";
import { useTournament2026 } from "../context/Tournament2026Context";

function TiebreakerPrediction2026({ currentUsername = "" }) {
  const {
    user,
    games,
    tiebreakerSettings,
    currentUserDataForTiebreaker,
    saveTiebreakerPrediction,
    userIsTiebreakerEligible,
  } = useTournament2026();

  const [predictedRuns, setPredictedRuns] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const existingPrediction =
    currentUserDataForTiebreaker?.prediction?.predictedRuns;

  const hasExistingPrediction =
    existingPrediction !== undefined && existingPrediction !== null;

  const finalGameLocked = games?.["15"]?.locked === true;

  useEffect(() => {
    if (hasExistingPrediction) {
      setPredictedRuns(String(existingPrediction));
    }
  }, [existingPrediction, hasExistingPrediction]);

  if (!user || !tiebreakerSettings?.active) {
    return null;
  }

  const username =
    currentUsername ||
    user.displayName ||
    user.email?.split("@")[0] ||
    user.email ||
    user.uid;

  const isEligible = userIsTiebreakerEligible(
    user.uid,
    username,
    tiebreakerSettings
  );

  if (!isEligible) {
    return null;
  }

  /*
    Show the box when:
    - predictionOpen is true, OR
    - the user already submitted a prediction and the final game is locked

    This lets users see their final locked prediction even after editing closes.
  */
  const shouldShowBox =
    tiebreakerSettings?.predictionOpen || (finalGameLocked && hasExistingPrediction);

  if (!shouldShowBox) {
    return null;
  }

  const predictionEditingLocked =
    finalGameLocked || !tiebreakerSettings?.predictionOpen;

  const handleSave = async () => {
    try {
      setSaveStatus("");

      if (predictionEditingLocked) {
        setSaveStatus("Predictions are locked.");
        return;
      }

      if (predictedRuns === "") {
        setSaveStatus("Enter a total runs prediction first.");
        return;
      }

      await saveTiebreakerPrediction(user.uid, username, predictedRuns);

      setSaveStatus("✅ Prediction saved");

      setTimeout(() => {
        setSaveStatus("");
      }, 2000);
    } catch (error) {
      console.error("Failed to save tiebreaker prediction:", error);
      setSaveStatus("❌ Could not save prediction");
    }
  };

  return (
    <div className="tiebreaker-prediction-box">
      <div className="tiebreaker-prediction-header">
        <h3>🏁 Final Series Tiebreaker</h3>

        <p>
          Predict the{" "}
          <strong>total runs scored across the championship series</strong>. You
          can change this prediction until the final game is locked.
        </p>
      </div>

      {!predictionEditingLocked ? (
        <>
          <div className="tiebreaker-prediction-form">
            <input
              type="number"
              min="0"
              value={predictedRuns}
              onChange={(e) => setPredictedRuns(e.target.value)}
              placeholder="Total runs"
            />

            <button type="button" onClick={handleSave}>
              Save Prediction
            </button>
          </div>

          {hasExistingPrediction && (
            <p className="tiebreaker-existing-pick">
              Current Prediction: <strong>{existingPrediction} runs</strong>
            </p>
          )}
        </>
      ) : (
        <p className="tiebreaker-final-pick">
          Final Prediction:{" "}
          <strong>
            {hasExistingPrediction ? `${existingPrediction} runs` : "No prediction saved"}
          </strong>
        </p>
      )}

      {saveStatus && (
        <p className="tiebreaker-prediction-status">{saveStatus}</p>
      )}
    </div>
  );
}

export default TiebreakerPrediction2026;