import React, { useEffect, useState } from "react";
import { Tournament2026Provider } from "../context/Tournament2026Context";
import Bracket2026 from "../components/Bracket2026";
import Leaderboard2026 from "../components/Leaderboard2026";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Tournament2026Page.css";
import { useNavigate } from "react-router-dom";
import SuperRegionals2026 from "../components/SuperRegionals2026";
import Regionals2026 from "../components/Regionals2026";
import MyPicksSummary2026 from "../components/MyPicksSummary2026";

function Tournament2026Page({ isAdmin = false }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [usernameDisplay, setUsernameDisplay] = useState("");
  const [userScore, setUserScore] = useState(0);
  const [tournamentComplete, setTournamentComplete] = useState(false);

  const [showRegionals, setShowRegionals] = useState(true);
  const [showSuperRegionals, setShowSuperRegionals] = useState(true);

  // Mirror 2025 header behavior; ensure a users2026 doc exists for leaderboard
  // Then live-listen to users2026/{uid} so the header score updates immediately.
  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (firebaseUser) {
        const user2026Ref = doc(db, "users2026", firebaseUser.uid);
        const user2026Snap = await getDoc(user2026Ref);

        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const oldUserData = userSnap.exists() ? userSnap.data() : {};

        const current2026Data = user2026Snap.exists()
          ? user2026Snap.data()
          : {};

        const username = (
          current2026Data.username ||
          oldUserData.username ||
          firebaseUser.displayName ||
          firebaseUser.email ||
          ""
        ).toString();

        if (!user2026Snap.exists()) {
          await setDoc(
            user2026Ref,
            {
              username,
              score: 0,
            },
            { merge: true }
          );
        }

        unsubscribeUserDoc = onSnapshot(user2026Ref, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() || {};
            setUsernameDisplay(data.username || username);
            setUserScore(Number(data.score ?? 0));
          } else {
            setUsernameDisplay(username);
            setUserScore(0);
          }
        });
      } else {
        setUsernameDisplay("");
        setUserScore(0);
      }
    });

    return () => {
      unsubAuth();

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  // Subscribe to 2026 tournament complete flag
  useEffect(() => {
    const configRef = doc(db, "config", "tournament2026");

    const unsubscribe = onSnapshot(configRef, async (docSnap) => {
      if (docSnap.exists()) {
        setTournamentComplete(docSnap.data().complete === true);
      } else {
        await setDoc(configRef, { complete: false }, { merge: true });
        setTournamentComplete(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTournamentCompleteToggle = async () => {
    const configRef = doc(db, "config", "tournament2026");
    const newValue = !tournamentComplete;

    try {
      await setDoc(configRef, { complete: newValue }, { merge: true });
      setTournamentComplete(newValue);
    } catch (error) {
      console.error("Failed to update 2026 tournament complete status:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "navy",
      }}
    >
      {/* Header - identical classes/markup to preserve look */}
      <div className="header">
        {isAdmin && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              color: "black",
              fontSize: "20px",
              zIndex: 10,
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={tournamentComplete}
                onChange={handleTournamentCompleteToggle}
                style={{
                  marginRight: "6px",
                  transform: "scale(1.2)",
                }}
              />
              Tournament Complete
            </label>
          </div>
        )}

        <h1 className="header-title">🏟️ 2026 CWS Bracket ⚾</h1>

        {user && (
          <div className="header-score">
            {usernameDisplay} - {userScore}{" "}
            {userScore === 1 ? "point" : "points"}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div style={{ flex: 1 }}>
        <Tournament2026Provider>
          <MyPicksSummary2026 />
          {/* Regionals separator */}
          <button
            type="button"
            className="omaha-final-eight-divider collapsible-divider"
            onClick={() => setShowRegionals((prev) => !prev)}
            aria-expanded={showRegionals}
          >
            <div className="omaha-divider-line"></div>
            <div className="omaha-divider-text collapsible-divider-text">
              <span className="omaha-divider-main">
                Regionals{" "}
                <span className="collapse-arrow">
                  {showRegionals ? "▲" : "▼"}
                </span>
              </span>
            </div>
            <div className="omaha-divider-line"></div>
          </button>

          {showRegionals && <Regionals2026 isAdmin={isAdmin} />}

          {/* Super Regionals separator */}
          <button
            type="button"
            className="omaha-final-eight-divider collapsible-divider"
            onClick={() => setShowSuperRegionals((prev) => !prev)}
            aria-expanded={showSuperRegionals}
          >
            <div className="omaha-divider-line"></div>
            <div className="omaha-divider-text collapsible-divider-text">
              <span className="omaha-divider-main">
                Super Regionals{" "}
                <span className="collapse-arrow">
                  {showSuperRegionals ? "▲" : "▼"}
                </span>
              </span>
            </div>
            <div className="omaha-divider-line"></div>
          </button>

          {showSuperRegionals && <SuperRegionals2026 isAdmin={isAdmin} />}

          {/* Omaha bracket separator - not collapsible */}
          <div className="omaha-final-eight-divider">
            <div className="omaha-divider-line"></div>
            <div className="omaha-divider-text">
              <span className="omaha-divider-main">Omaha: Final 8</span>
              <span className="omaha-divider-sub">
                Men&apos;s College World Series Bracket
              </span>
            </div>
            <div className="omaha-divider-line"></div>
          </div>

          <Bracket2026 isAdmin={isAdmin} />

          {/* Grid: left panel, leaderboard, right panel */}
          <div className="tourny-2026-grid">
            {/* Past Bracket */}
            <div className="tourny-2026-panel past-bracket">
              <h3>My Past Brackets</h3>
              <button
                onClick={() => navigate("/tournament")}
                className="game-button past-year-btn"
              >
                2025
              </button>
            </div>

            {/* Leaderboard */}
            <div className="leaderboard-2026-wrap">
              <Leaderboard2026 currentUsername={usernameDisplay} />
            </div>

            {/* Past Winners */}
            <div className="tourny-2026-panel past-winners">
              <h3>Past Winners</h3>
              <div className="winner-line">
                2025 -{" "}
                <span
                  className="winner-link"
                  onClick={() => navigate("/tournament2025/brandon")}
                >
                  Brandon_Beach_FTW
                </span>
              </div>
            </div>
          </div>
        </Tournament2026Provider>
      </div>
    </div>
  );
}

export default Tournament2026Page;