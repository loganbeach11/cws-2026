import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useTournament2026 } from "../context/Tournament2026Context";
import "./MyPicksSummary2026.css";

function MyPicksSummary2026() {
  const {
    games,
    regionals,
    superRegionals,
    userPicks,
    regionalPicks,
    superRegionalPicks,
    user,
  } = useTournament2026();

  const [users2026, setUsers2026] = useState([]);

  useEffect(() => {
    const usersRef = collection(db, "users2026");

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...(doc.data() || {}),
      }));

      setUsers2026(usersList);
    });

    return () => unsubscribe();
  }, []);

  const normalizePick = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };
  
  const isPlaceholderTeam = (value) => {
    const cleanValue = (value || "").toString().trim();
    const normalized = cleanValue.toLowerCase();
  
    return (
      normalized === "" ||
      normalized === "tbd" ||
      /^g\d+\s+(winner|loser)$/i.test(cleanValue) ||
      normalized.endsWith("winner") ||
      normalized.endsWith("loser")
    );
  };
  
  const isFilledTeam = (value) => {
    return !isPlaceholderTeam(value);
  };

  const regionalIsAvailable = (regional) => {
    return (
      regional &&
      isFilledTeam(regional.team1) &&
      isFilledTeam(regional.team2) &&
      isFilledTeam(regional.team3) &&
      isFilledTeam(regional.team4) &&
      regional.locked !== true
    );
  };

  const twoTeamGameIsAvailable = (game) => {
    return (
      game &&
      isFilledTeam(game.team1) &&
      isFilledTeam(game.team2) &&
      game.locked !== true
    );
  };

  const getOrdinal = (rank) => {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${rank}th`;
    if (lastDigit === 1) return `${rank}st`;
    if (lastDigit === 2) return `${rank}nd`;
    if (lastDigit === 3) return `${rank}rd`;

    return `${rank}th`;
  };

  const getRankLabel = () => {
    if (!user || users2026.length === 0) return "—";

    const rankedUsers = [...users2026]
      .filter(
        (u) =>
          u.uid !== "bf5dgOYciTR4pfgAZ3nTFvQUPFs1" &&
          u.username !== "log" &&
          u.username !== "loganbeach11" &&
          u.username !== "loganbeach11@fake.com" &&
          u.username !== "lo"
      )
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));

    const currentUser = rankedUsers.find((u) => u.uid === user.uid);

    if (!currentUser) return "—";

    const currentScore = Number(currentUser.score ?? 0);
    const rank =
      rankedUsers.filter((u) => Number(u.score ?? 0) > currentScore).length + 1;

    const tiedCount = rankedUsers.filter(
      (u) => Number(u.score ?? 0) === currentScore
    ).length;

    return tiedCount > 1 ? `T-${getOrdinal(rank)}` : getOrdinal(rank);
  };

  const getRankPillClass = (rankLabel) => {
    if (!rankLabel || rankLabel === "—") return "";
  
    const normalizedRank = rankLabel.toLowerCase();
  
    if (normalizedRank.includes("1st")) return "summary-rank-gold";
    if (normalizedRank.includes("2nd")) return "summary-rank-silver";
    if (normalizedRank.includes("3rd")) return "summary-rank-bronze";
  
    return "";
  };

  const getSectionRecord = (items, picks) => {
    let correct = 0;
    let scored = 0;
  
    Object.entries(items || {}).forEach(([id, item]) => {
      if (!item?.locked) return;
  
      const winner = item?.winner;
  
      // Only count in the denominator if a real winner has been set.
      if (!isFilledTeam(winner)) return;
  
      scored += 1;
  
      const pick = picks?.[id];
  
      if (normalizePick(pick) === normalizePick(winner)) {
        correct += 1;
      }
    });
  
    return { correct, locked: scored };
  };

  const getMissingPicksCount = (items, picks, isAvailableFn) => {
    let missing = 0;

    Object.entries(items || {}).forEach(([id, item]) => {
      if (!isAvailableFn(item)) return;

      const pick = picks?.[id];

      if (!isFilledTeam(pick)) {
        missing += 1;
      }
    });

    return missing;
  };

  const summary = useMemo(() => {
    const regionalRecord = getSectionRecord(regionals, regionalPicks);
    const superRegionalRecord = getSectionRecord(
      superRegionals,
      superRegionalPicks
    );
    const cwsRecord = getSectionRecord(games, userPicks);

    const missingRegionals = getMissingPicksCount(
      regionals,
      regionalPicks,
      regionalIsAvailable
    );

    const missingSuperRegionals = getMissingPicksCount(
      superRegionals,
      superRegionalPicks,
      twoTeamGameIsAvailable
    );

    const missingCws = getMissingPicksCount(
      games,
      userPicks,
      twoTeamGameIsAvailable
    );

    const totalMissing = missingRegionals + missingSuperRegionals + missingCws;

    const totalCorrect =
      regionalRecord.correct +
      superRegionalRecord.correct +
      cwsRecord.correct;

    const totalLocked =
      regionalRecord.locked + superRegionalRecord.locked + cwsRecord.locked;

    const currentUserData = users2026.find((u) => u.uid === user?.uid);
    const score = Number(currentUserData?.score ?? 0);

    return {
      score,
      rank: getRankLabel(),
      regionalRecord,
      superRegionalRecord,
      cwsRecord,
      totalCorrect,
      totalLocked,
      missingRegionals,
      missingSuperRegionals,
      missingCws,
      totalMissing,
    };
  }, [
    games,
    regionals,
    superRegionals,
    userPicks,
    regionalPicks,
    superRegionalPicks,
    users2026,
    user,
  ]);

  return (
    <section className="my-picks-summary">
      <h2>My Picks Summary</h2>

      <div className="summary-pill-row">
        <div className="summary-pill summary-score-pill">
          <span className="summary-pill-label">Score</span>
          <span className="summary-pill-value">
            {summary.score} {summary.score === 1 ? "Point" : "Points"}
          </span>
        </div>

        <div className={`summary-pill ${getRankPillClass(summary.rank)}`}>
            <span className="summary-pill-label">Rank</span>
            <span className="summary-pill-value">{summary.rank}</span>
        </div>

        <div className="summary-pill">
          <span className="summary-pill-label">Regionals</span>
          <span className="summary-pill-value">
            {summary.regionalRecord.correct}/{summary.regionalRecord.locked}
          </span>
        </div>

        <div className="summary-pill">
          <span className="summary-pill-label">Super Regionals</span>
          <span className="summary-pill-value">
            {summary.superRegionalRecord.correct}/
            {summary.superRegionalRecord.locked}
          </span>
        </div>

        <div className="summary-pill">
          <span className="summary-pill-label">CWS</span>
          <span className="summary-pill-value">
            {summary.cwsRecord.correct}/{summary.cwsRecord.locked}
          </span>
        </div>

        <div className="summary-pill summary-total-pill">
          <span className="summary-pill-label">Total</span>
          <span className="summary-pill-value">
            {summary.totalCorrect}/{summary.totalLocked}
          </span>
        </div>
      </div>

      <div
        className={`missing-picks-strip ${
          summary.totalMissing === 0 ? "all-picks-complete" : "has-missing-picks"
        }`}
      >
        {summary.totalMissing === 0 ? (
          <span>✅ All available picks completed</span>
        ) : (
          <span>
            ⚠️ Missing Picks: <strong>{summary.totalMissing}</strong>
            <span className="missing-picks-breakdown">
              Regionals {summary.missingRegionals} · Super Regionals{" "}
              {summary.missingSuperRegionals} · CWS {summary.missingCws}
            </span>
          </span>
        )}
      </div>
    </section>
  );
}

export default MyPicksSummary2026;