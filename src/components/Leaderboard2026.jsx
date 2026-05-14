import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { onSnapshot, collection } from "firebase/firestore";
import "./Leaderboard.css";

function Leaderboard2026({ currentUsername }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const userCollection = collection(db, "users2026");

    const unsubscribe = onSnapshot(userCollection, (snapshot) => {
      const userList = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const username = data.username || data.email?.split("@")[0] || doc.id;
          const points = Number(data.score ?? 0);

          return {
            uid: doc.id,
            username,
            points,
          };
        })
        .filter(
          (user) =>
            user.username !== "loganbeach11" &&
            user.username !== "loganbeach11@fake.com" &&
            user.username !== "lo" &&
            user.username !== "log" &&
            user.uid !== "bf5dgOYciTR4pfgAZ3nTFvQUPFs1"
        );

      userList.sort((a, b) => b.points - a.points);
      setUsers(userList);
    });

    return () => unsubscribe();
  }, []);

  const getRankedUsers = () => {
    const ranked = [];
    let currentRank = 1;
    let tieCount = 1;

    for (let i = 0; i < users.length; i++) {
      const current = users[i];
      const prev = users[i - 1];
      const next = users[i + 1];

      const sameAsPrev = i > 0 && current.points === prev?.points;
      const sameAsNext = i < users.length - 1 && current.points === next?.points;
      const isTied = sameAsPrev || sameAsNext;

      const rank = sameAsPrev ? ranked[ranked.length - 1].rank : currentRank;

      ranked.push({
        ...current,
        rank,
        isTied,
      });

      if (!sameAsNext) {
        currentRank += tieCount;
        tieCount = 1;
      } else {
        tieCount++;
      }
    }

    return ranked;
  };

  const getOrdinal = (rank) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const value = rank % 100;
    return `${rank}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`;
  };

  const renderRankLabel = (rank, isTied) => {
    return isTied ? `T-${getOrdinal(rank)}` : getOrdinal(rank);
  };

  const renderMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const rankedUsers = getRankedUsers();

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard 🏆</h2>

      <ol className="leaderboard-list">
        {rankedUsers.map((user) => {
          const isCurrentUser =
            currentUsername &&
            user.username.toLowerCase() === currentUsername.toLowerCase();

          return (
            <li
              key={user.uid || user.username}
              className={`leaderboard-row rank-${user.rank} ${
                isCurrentUser ? "current-user-row" : ""
              }`}
            >
              <div className="leaderboard-left">
                <span className="leaderboard-rank">
                  {renderRankLabel(user.rank, user.isTied)}
                </span>

                <span className="leaderboard-medal">
                  {renderMedal(user.rank)}
                </span>

                <span
                  className={`leaderboard-name ${
                    isCurrentUser ? "highlight-user" : ""
                  }`}
                >
                  {user.username}
                </span>

                {isCurrentUser && <span className="you-badge">YOU</span>}
              </div>

              <div className="leaderboard-points">
                {user.points} {user.points === 1 ? "pt" : "pts"}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default Leaderboard2026;