import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./Leaderboard.css";

function Leaderboard({ currentUsername }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
  const fetchLeaderboard = async () => {
    const userCollection = collection(db, "users");
    const snapshot = await getDocs(userCollection);

    const userList = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          username: data.username || (data.email?.split("@")[0]) || doc.id,
          points: data.score || 0,
        };
      })
      .filter(user => user.username !== "loganbeach11" && user.username !== "loganbeach11@fake.com");
    userList.sort((a, b) => b.points - a.points);
    setUsers(userList);
  };

  fetchLeaderboard();
}, []);


  const getRankedUsers = () => {
    const ranked = [];
    let currentRank = 1;

    for (let i = 0; i < users.length; i++) {
      const current = users[i];
	const prev = users[i - 1];
	let isTied = false;
      if (i > 0 && current.points === prev.points) {
        isTied = true;
      }

      // Special case: check if current is tied with next
      if (i === 0 && users.length > 1 && current.points === users[1].points) {
        isTied = true;
      }

      ranked.push({
        ...current,
        rank: currentRank,
        isTied,
      });
      if (i + 1 < users.length && current.points !== users[i + 1].points) {
        currentRank = ranked.length + 1;
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
              <span style={user.username === currentUsername ? { color: 'navy', fontWeight: 'bold' } : {}}>
                {user.username} - {user.points} {user.points === 1 ? "point" : "points"}
              </span>
            </span>
          </li>
        ))}
	</ol>
    </div>
  );
}

export default Leaderboard;
