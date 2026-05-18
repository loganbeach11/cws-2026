import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { TournamentProvider } from "../context/TournamentContext";
import Bracket from "../components/Bracket";
import Leaderboard2025ReadOnly from "./Leaderboard2025ReadOnly";

const BRANDON_UID = "kv7CcPdRQMUS9KXhSImCMzMR76z2";

function Brandon2025BracketPage() {
  const [username, setUsername] = useState("Brandon_Beach_FTW");
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const userSnap = await getDoc(doc(db, "users", BRANDON_UID)); // ← 2025 users
	if (userSnap.exists()) {
	    const data = userSnap.data() || {};
        setUsername(data.username || "Brandon_Beach_FTW");
        // If you’ve persisted +0.5 in Firestore, this will already include it:
        setScore(Number(data.score ?? 0));
        // If you only want visual +0.5 and not persist it, use:
        // setScore(Number(data.score ?? 0) + 0.5);
      }
    };
    loadUser();
  }, []);

  return (
    <div style={{ backgroundColor: "navy", minHeight: "100vh" }}>
      <div className="header">
        <h1 className="header-title">🏟️ 2025 CWS Bracket ⚾</h1>
        <div className="header-score">{username} - 10.5 points</div>
      </div>
  
      <div style={{ flex: 1 }}>
        {/* Load Brandon’s picks by forcing viewUserId */}
        <TournamentProvider viewUserId={BRANDON_UID}>
          {/* Horizontally scrollable bracket wrapper for mobile */}
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
              WebkitOverflowScrolling: "touch",
              boxSizing: "border-box",
              paddingBottom: "18px",
            }}
          >
            <div
              style={{
                minWidth: "1750px",
                pointerEvents: "none",
              }}
            >
              <Bracket isAdmin={false} />
            </div>
          </div>
  
          {/* Read-only leaderboard that only reads from 2025 `users` */}
          <Leaderboard2025ReadOnly currentUsername={username} />
        </TournamentProvider>
      </div>
    </div>
  );
}

export default Brandon2025BracketPage;
