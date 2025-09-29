import React, { useEffect, useState } from "react";
import { db } from "../firebase";
// Reads 2025 scores ONLY from the `users` collection
import { collection, onSnapshot } from "firebase/firestore";

// Reuse your existing leaderboard styles (adjust the path if your CSS lives elsewhere)
import "../components/Leaderboard.css";

export default function Leaderboard2025ReadOnly({ currentUsername = "" }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // 2025 users collection
    const userCollection = collection(db, "users");

    const unsubscribe = onSnapshot(userCollection, (snapshot) => {
      const list = snapshot.docs
        .map((d) => {
          const data = d.data() || {};
            const username = data.username || d.id;
	    let points = Number(data.score ?? 0);
           if (username === "Brandon_Beach_FTW") {
             points += 0.5;
           }

          return { username, points };
        })
        // Keep your original filters
        .filter(
          (u) =>
            u.username !== "loganbeach11" &&
            u.username !== "loganbeach11@fake.com" &&
            u.username !== "lo"
        )
        .sort((a, b) => b.points - a.points);

      setUsers(list);
    });
      return () => unsubscribe();
  }, []);

  // Tie-handling exactly like your original
  const getRankedUsers = () => {
    const ranked = [];
    let currentRank = 1;
    let tieCount = 1;

    for (let i = 0; i < users.length; i++) {
      const cur = users[i];
      const prev = users[i - 1];
      const next = users[i + 1];

      const sameAsPrev = i > 0 && cur.points === prev.points;
      const sameAsNext = i < users.length - 1 && cur.points === next.points;
      const isTied = sameAsPrev || sameAsNext;
      const rank = sameAsPrev ? ranked[ranked.length - 1].rank : currentRank;

	ranked.push({ ...cur, rank, isTied });
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
      <h2>🏅 Leaderboard</h2>
      <ol>
        {rankedUsers.map((u) => (
          <li key={u.username}>
            <span>
              {renderRank(u.rank, u.isTied)}{" "}
              <span
                className={
                  u.username.toLowerCase() === currentUsername.toLowerCase()
                    ? "highlight-user"
                    : ""
                }
              >
		  {u.username} - {u.points} {u.points === 1 ? "point" : "points"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
