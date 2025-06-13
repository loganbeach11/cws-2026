import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Bracket from './components/Bracket';
import Leaderboard from './components/Leaderboard';
import { getDoc, getDocs, collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import WinnerScreen from "./components/WinnerScreen";
import LoserScreen from "./components/LoserScreen";


function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [userScore, setUserScore] = useState(0);
  const [usernameDisplay, setUsernameDisplay] = useState("");
const [tournamentComplete, setTournamentComplete] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const loginAsAdmin = () => setIsAdmin(true);

  const handleLogin = async (firebaseUser) => {
      setUser(firebaseUser);
      const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const username = userData.username || firebaseUser.displayName || firebaseUser.email;
      if (username === "lo") {
    console.log("🧪 Logging in as 'lo' — redirecting to WinnerScreen immediately");
    navigate("/winner");
    return;
  }      
     const completedDoc = await getDoc(doc(db, "config", "tournament"));
const isCompleted = completedDoc.exists() && completedDoc.data().complete;

      
     if (isCompleted) {
    // Get current user score
    const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    const currentScore = userSnap.exists() ? userSnap.data().score || 0 : 0;

    // Get max score among all users
    const allUsersSnap = await getDocs(collection(db, "users"));
    let maxScore = -1;
    allUsersSnap.forEach(doc => {
      const score = doc.data().score || 0;
      if (score > maxScore) maxScore = score;
    });

    if (currentScore === maxScore) {
      navigate("/winner");
    } else {
      navigate("/loser");
    }
  } else {
    navigate("/tournament");
  }
};


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
    await updateDoc(doc(db, "config", "tournament"), {
      complete: newValue,
    });
    // You don't need to call setTournamentComplete manually—
    // onSnapshot will update it reactively.
  } catch (error) {
    console.error("Failed to update tournament complete status:", error);
  }
};

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "navy" }}>
      {/* Header */}
	<div className="header">
	    {isAdmin && location.pathname === "/tournament" && (
    <div style={{ position: "absolute", top: 10, left: 10, color: "black" }}>
      <label>
        <input
          type="checkbox"
          checked={tournamentComplete}
          onChange={toggleComplete}
            style={{ marginRight: "6px"}}
        />
        Tournament Complete
      </label>
    </div>
  )}
        <h1 className="header-title">🏟️ 2025 CWS Bracket ⚾</h1>
        {user && location.pathname === "/tournament" && (
          <div className="header-score">
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

        </Routes>
      </div>
    </div>
  );
}

export default App;
