import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, getDocs, onSnapshot, setDoc, collection } from "firebase/firestore";
import "./Leaderboard.css";

function Leaderboard2026({ currentUsername }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const userCollection = collection(db, "users2026");

    const unsubscribe = onSnapshot(userCollection, async (snapshot) => {
      // Recalculate scores for all users (2026)
      const gamesSnap = await getDoc(doc(db, "tournament2026", "games"));
	const games = gamesSnap.exists() ? gamesSnap.data() : {};
	const picksSnapshot = await getDocs(collection(db, "userPicks2026"));
      const picksData = {};
      picksSnapshot.forEach((doc) => {
        picksData[doc.id] = doc.data();
      });

      for (const userDoc of snapshot.docs) {
        const uid = userDoc.id;
        const userPicks = picksData[uid] || {};
        let score = 0;

        Object.entries(userPicks).forEach(([gameId, pick]) => {
          const game = games[gameId];
          if (game?.winner && game.winner === pick) {
            score += 1;
          }
        });
	  const userRef = doc(db, "users2026", uid);
        const current = userDoc.data();
        if (current.score !== score) {
          await setDoc(userRef, { username: current.username || uid, score }, { merge: true });
        }
      }

      // After scores are updated, rebuild the leaderboard list (2026)
      const userList = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const username = data.username || (data.email?.split("@")[0]) || doc.id;
          let points = data.score || 0;

          // Display-only tweak preserved from last year
          if (username === "Brandon_Beach_FTW") {
            points += 0.5;
          }

          return { username, points };
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
      let tieCount = 1; //
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
        tieCount = 1; // reset
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
                {user.username} - {user.points} {user.points === 1 ? "point" : "points"}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default Leaderboard2026;
