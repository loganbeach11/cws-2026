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

import { getDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
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
    const configRef = doc(db, "config", "tournament");

    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setTournamentComplete(docSnap.data().complete);
      }
    });

    return () => unsubscribe();
  }, []);

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

    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserScore(data.score || 0);
        setUsernameDisplay(data.username || user.email || "");
      }
    });

    return () => unsubscribe();
  }, [user]);

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
            path="/tournament2025/brandon"
            element={<Brandon2025BracketPage />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;