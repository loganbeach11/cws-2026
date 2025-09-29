import React, { useEffect, useState } from "react";
import { Tournament2026Provider } from "../context/Tournament2026Context";
import Bracket2026 from "../components/Bracket2026";
import Leaderboard2026 from "../components/Leaderboard2026";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./Tournament2026Page.css";
import { useNavigate } from "react-router-dom";

function Tournament2026Page({ isAdmin = false }) {
    const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [usernameDisplay, setUsernameDisplay] = useState("");
  const [userScore, setUserScore] = useState(0);

  // Mirror 2025 header behavior; ensure a users2026 doc exists for leaderboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);

      if (firebaseUser) {
        // Prefer username from 2026 doc; fall back to old users doc or auth values
          const user2026Ref = doc(db, "users2026", firebaseUser.uid);
	  const user2026Snap = await getDoc(user2026Ref);
        const u2026 = user2026Snap.exists() ? user2026Snap.data() : null;

        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const u = userSnap.exists() ? userSnap.data() : {};

        const username = (
          u2026?.username ||
          u.username ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          ""
        ).toString();

        const score = Number(u2026?.score ?? 0);

        // ✅ Ensure users2026 doc exists so the 2026 leaderboard has a row to show
        if (!user2026Snap.exists()) {
          await setDoc(
            user2026Ref,
            { username, score: 0 },
              { merge: true }
	      );
        }

        setUsernameDisplay(username);
        setUserScore(score);
      } else {
        setUsernameDisplay("");
        setUserScore(0);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "navy" }}>
      {/* Header - identical classes/markup to preserve look */}
      <div className="header">
          <h1 className="header-title">🏟️ 2026 CWS Bracket ⚾</h1>
	  {user && (
          <div className="header-score">
            {usernameDisplay} - {userScore} {userScore === 1 ? "point" : "points"}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div style={{ flex: 1 }}>
<Tournament2026Provider>
  {/* Bracket first (full width) */}
  <Bracket2026 isAdmin={isAdmin} />

  {/* Grid: [ left area | leaderboard | right area ] */}
  <div className="tourny-2026-grid">
    {/* Past Bracket (left; centered between left edge and leaderboard) */}
    <div className="tourny-2026-panel past-bracket">
      <h3>Past Brackets</h3>
      <button
          onClick={() => navigate("/tournament")}
        className="game-button past-year-btn"
      >
        2025
      </button>
    </div>
      {/* Leaderboard (center; fixed-ish width, stays centered) */}
    <div className="leaderboard-2026-wrap">
      <Leaderboard2026 currentUsername={usernameDisplay} />
    </div>

    {/* Past Winners (right; centered between leaderboard and right edge) */}
    <div className="tourny-2026-panel past-winners">
      <h3>Past Winners</h3>
      <div className="winner-line">2025 - <span
  className="winner-link"
					      onClick={() => navigate("/tournament2025/brandon")}
>
  Brandon_Beach_FTW
</span></div>
    </div>
  </div>
</Tournament2026Provider>
	  
      </div>
    </div>
  );
}

export default Tournament2026Page;
