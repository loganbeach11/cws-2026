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
            username,
            points,
          };
        })
        .filter(
          (user) =>
            user.username !== "loganbeach11" &&
            user.username !== "loganbeach11@fake.com" &&
            user.username !== "lo"
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

  const renderRank = (rank, isTied) => {
    const prefix = isTied ? "(Tie) " : "";

    if (rank === 1) return `${prefix}🥇`;
    if (rank === 2) return `${prefix}🥈`;
    if (rank === 3) return `${prefix}🥉`;

    return `${prefix}${rank}.`;
  };

  const rankedUsers = getRankedUsers();

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard 🏆</h2>

      <ol>
        {rankedUsers.map((user) => (
          <li key={user.username}>
            <span>
              {renderRank(user.rank, user.isTied)}{" "}
              <span
                className={
                  currentUsername &&
                  user.username.toLowerCase() === currentUsername.toLowerCase()
                    ? "highlight-user"
                    : ""
                }
              >
                {user.username} - {user.points}{" "}
                {user.points === 1 ? "point" : "points"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Leaderboard2026;