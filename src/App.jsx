import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Bracket from './components/Bracket';
import Leaderboard from './components/Leaderboard';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null); // This can be user.uid
  const [userScore, setUserScore] = useState(0);
  const [usernameDisplay, setUsernameDisplay] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const loginAsAdmin = () => setIsAdmin(true);

  const handleLogin = (firebaseUser) => {
    setUser(firebaseUser); // full Firebase user object
    navigate('/tournament');
  };
   useEffect(() => {
    document.body.style.overflowY = user ? 'auto' : 'hidden';
  }, [user]);

  // Fetch user score + display name from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserScore(data.score || 0);
        setUsernameDisplay(data.username || user.email || ""); // fallback
      }
    });

    return () => unsubscribe();
  }, [user]);

     return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "navy" }}>
      {/* Header */}
      <div style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        position: "relative",
        padding: "20px 0",
      }}>
        <h1 style={{ margin: 0, textAlign: "center", fontSize: "1.8rem" }}>
          2025 CWS Bracket
        </h1>

        {user && location.pathname === "/tournament" && (
		<div
	    style={{
              position: "absolute",
              right: "40px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "darkorange",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {usernameDisplay} - {userScore} {userScore === 1 ? "point" : "points"}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div style={{ flex: 1 }}>
        <Routes>
            <Route
	    path="/"
            element={
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: "0px",
              }}>
                <AuthForm setUser={handleLogin} onAdminLogin={loginAsAdmin} />
              </div>
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
        </Routes>
      </div>
    </div>
  );
}

export default App;
