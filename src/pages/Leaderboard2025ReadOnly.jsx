import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

// Reuse your existing leaderboard styles
import "../components/Leaderboard.css";

const CACHE_KEY = "leaderboard2025Cache";

const sortLeaderboardUsers = (list) => {
  return [...list].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.username.localeCompare(b.username);
  });
};

export default function Leaderboard2025ReadOnly({ currentUsername = "" }) {
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? sortLeaderboardUsers(JSON.parse(cached)) : [];
    } catch {
      return [];
    }
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return !cached;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user || null);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Do NOT clear users here.
    // This keeps the cached leaderboard visible while auth/Firestore refreshes.
    if (!authReady || !firebaseUser) {
      return;
    }

    const userCollection = collection(db, "users");

    const unsubscribe = onSnapshot(
      userCollection,
      (snapshot) => {
        const list = snapshot.docs
          .map((d) => {
            const data = d.data() || {};
            const username = data.username || d.id;
            let points = Number(data.score ?? 0);

            if (username === "Brandon_Beach_FTW") {
              points += 0.5;
            }

            return {
              username,
              points,
              eligible2025: data.eligible2025,
            };
          })
          .filter(
            (u) =>
              u.eligible2025 !== false &&
              u.username !== "loganbeach11" &&
              u.username !== "loganbeach11@fake.com" &&
              u.username !== "lo"
          );

        const sortedList = sortLeaderboardUsers(list);

        setUsers((currentUsers) => {
          // If cached users are already visible, keep the visible leaderboard stable.
          // Firestore still updates the cache below for next time.
          if (currentUsers.length > 0) {
            return currentUsers;
          }

          // If there was no cached leaderboard yet, show the fresh sorted list.
          return sortedList;
        });

        setLoading(false);

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedList));
        } catch {
          // Ignore cache write errors
        }
      },
      (error) => {
        console.error("2025 read-only leaderboard snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, firebaseUser]);

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

  const normalizeUsername = (value) => {
    return (value || "").toString().trim().toLowerCase();
  };

  const rankedUsers = getRankedUsers();
  const normalizedCurrentUsername = normalizeUsername(currentUsername);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard 🏆</h2>

      {loading && rankedUsers.length === 0 ? (
        <p style={{ textAlign: "center", fontWeight: 800 }}>
          Loading leaderboard...
        </p>
      ) : (
        <ol>
          {rankedUsers.map((u) => (
            <li key={u.username}>
              <span>
                {renderRank(u.rank, u.isTied)}{" "}
                <span
                  className={
                    normalizedCurrentUsername &&
                    normalizeUsername(u.username) === normalizedCurrentUsername
                      ? "highlight-user"
                      : ""
                  }
                >
                  {u.username} - {u.points}{" "}
                  {u.points === 1 ? "point" : "points"}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}