import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import AuthForm from "./components/AuthForm";
import Bracket from "./components/Bracket";
import Leaderboard from "./components/Leaderboard";
import Tournament2026Page from "./pages/Tournament2026Page";
import WinnerScreen from "./components/WinnerScreen";
import LoserScreen from "./components/LoserScreen";
import Brandon2025BracketPage from "./pages/Brandon2025BracketPage";
import Analytics2025Page from "./pages/Analytics2025Page";

import {
  getDoc,
  updateDoc,
  doc,
  onSnapshot,
  collection,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [usernameDisplay, setUsernameDisplay] = useState("");
  const [tournamentComplete, setTournamentComplete] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminUser = (firebaseUser) => {
    return (
      firebaseUser?.email === "loganbeach11@fake.com" ||
      firebaseUser?.email === "loganbeach11@gmail.com" ||
      firebaseUser?.uid === "YkazP10mdxXmQ2GrQkWyCfCeJHP2"
    );
  };

  const loginAsAdmin = () => setIsAdmin(true);

  const handleLogin = async (firebaseUser) => {
    setUser(firebaseUser);

    // keep username synced for 2025 header
    const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};
    userData.username || firebaseUser.displayName || firebaseUser.email;

    const adminLogin = isAdminUser(firebaseUser);

    if (adminLogin) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    // Everyone, including admin, goes to the 2026 bracket page.
    // Admin gets editing controls through isAdmin={true}.
    navigate("/tournament2026");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setIsAdmin(isAdminUser(firebaseUser));
      setAuthChecked(true);

      if (!firebaseUser) {
        setUserScore(0);
        setUsernameDisplay("");
      }
    });

    return () => unsubscribe();
  }, []);

  // Lock scroll on login page
  useEffect(() => {
    const isLoginPage = location.pathname === "/";
    const isMobile = window.innerWidth <= 600;

    if (isLoginPage) {
      document.body.classList.add("login-lock");
      document.documentElement.classList.add("login-lock");
      document.body.style.overflowY = isMobile ? "auto" : "hidden";
    } else {
      document.body.classList.remove("login-lock");
      document.documentElement.classList.remove("login-lock");
      document.body.style.overflowY = "auto";
    }
  }, [location.pathname]);

  // Subscribe to 2025 tournament complete flag
  useEffect(() => {
    if (!user?.uid) return;

    const configRef = doc(db, "config", "tournament");

    const unsubscribe = onSnapshot(
      configRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTournamentComplete(docSnap.data().complete);
        }
      },
      (error) => {
        console.error("2025 tournament config snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const toggleComplete = async () => {
    try {
      const newValue = !tournamentComplete;
      await updateDoc(doc(db, "config", "tournament"), { complete: newValue });
    } catch (error) {
      console.error("Failed to update tournament complete status:", error);
    }
  };

  // Subscribe to current user's 2025 header score/name
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserScore(data.score || 0);
          setUsernameDisplay(data.username || user.email || "");
        }
      },
      (error) => {
        console.error("2025 current user snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.email]);

  // Preload leaderboard caches so page transitions feel instant
  useEffect(() => {
    if (!user?.uid) return;

    const users2025Ref = collection(db, "users");
    const users2026Ref = collection(db, "users2026");

    const unsubscribe2025 = onSnapshot(
      users2025Ref,
      (snapshot) => {
        const leaderboard2025 = snapshot.docs
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
  )
  .sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.username.localeCompare(b.username);
  });

        try {
          localStorage.setItem(
            "leaderboard2025Cache",
            JSON.stringify(leaderboard2025)
          );
        } catch {
          // Ignore cache write errors
        }
      },
      (error) => {
        console.error("2025 leaderboard cache preload error:", error);
      }
    );

    const unsubscribe2026 = onSnapshot(
      users2026Ref,
      (snapshot) => {
        const leaderboard2026 = snapshot.docs
          .map((d) => {
            const data = d.data() || {};
            const username = data.username || data.email?.split("@")[0] || d.id;

            return {
              uid: d.id,
              username,
              points: Number(data.score ?? 0),
            };
          })
          .filter(
            (u) =>
              u.username !== "loganbeach11" &&
              u.username !== "loganbeach11@fake.com" &&
              u.username !== "lo" &&
              u.username !== "log" &&
              u.uid !== "bf5dgOYciTR4pfgAZ3nTFvQUPFs1"
          )
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.username.localeCompare(b.username);
          });

        try {
          localStorage.setItem(
            "leaderboard2026Cache",
            JSON.stringify(leaderboard2026)
          );
        } catch {
          // Ignore cache write errors
        }
      },
      (error) => {
        console.error("2026 leaderboard cache preload error:", error);
      }
    );

    return () => {
      unsubscribe2025();
      unsubscribe2026();
    };
  }, [user?.uid]);

  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "navy",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "navy",
      }}
    >
      {/* Show 2026 Header ONLY on the login page */}
      {location.pathname === "/" && (
        <div className="header">
          <h1 className="header-title">⚾ 2026 CWS Bracket ⚾</h1>
        </div>
      )}

      {/* Show 2025 Header ONLY on /tournament */}
      {location.pathname === "/tournament" && (
        <div className="header">
          {isAdmin && (
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                color: "black",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={tournamentComplete}
                  onChange={toggleComplete}
                  style={{ marginRight: "6px" }}
                />
                Tournament Complete
              </label>
            </div>
          )}

          <h1 className="header-title">⚾ 2025 CWS Bracket ⚾</h1>

          {user && (
            <div className="header-score">
              {usernameDisplay} - {userScore}{" "}
              {userScore === 1 ? "point" : "points"}
            </div>
          )}
        </div>
      )}

      {/* Page Content */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <AuthForm setUser={handleLogin} onAdminLogin={loginAsAdmin} />
            }
          />

          <Route
            path="/tournament"
            element={
              user ? (
                <>
                  <Bracket isAdmin={isAdmin} />
                  <Leaderboard currentUsername={usernameDisplay} />
                </>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/winner"
            element={user ? <WinnerScreen /> : <Navigate to="/" />}
          />

          <Route
            path="/loser"
            element={user ? <LoserScreen /> : <Navigate to="/" />}
          />

          <Route
            path="/LoserScreen"
            element={<Navigate to="/loser" replace />}
          />

          <Route
            path="/tournament2026"
            element={
              user ? (
                <Tournament2026Page isAdmin={isAdmin} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/admin2026"
            element={
              user ? (
                <Navigate to="/tournament2026" replace />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/analytics2025"
            element={user ? <Analytics2025Page /> : <Navigate to="/" />}
          />

          <Route
            path="/tournament2025/brandon"
            element={user ? <Brandon2025BracketPage /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;