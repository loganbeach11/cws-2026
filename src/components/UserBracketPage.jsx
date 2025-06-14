import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Bracket from "./Bracket";
import Leaderboard from "./Leaderboard"; // optional, if you want to show it here

function UserBracketPage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null); // { uid, username, score }
  const [userPicks, setUserPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user by username from "users" collection
  useEffect(() => {
    async function fetchUser() {
      try {
          setLoading(true);
	  // Query users collection to find the user with this username
        const usersCol = collection(db, "users");
        const usersSnap = await getDocs(usersCol);

        let matchedUser = null;
        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.username?.toLowerCase() === username.toLowerCase()
          ) {
            matchedUser = { uid: docSnap.id, ...data };
          }
        });

        if (!matchedUser) {
          setError("User not found");
          setLoading(false);
          return;
        }

          setUserData(matchedUser);
	  // Fetch picks for matched user
        const picksDoc = await getDoc(doc(db, "userPicks", matchedUser.uid));
        setUserPicks(picksDoc.exists() ? picksDoc.data() : {});

        setLoading(false);
      } catch (err) {
        setError("Failed to load user data");
        setLoading(false);
        console.error(err);
      }
    }

    fetchUser();
  }, [username]);
    if (loading) return <div>Loading user bracket...</div>;
  if (error) return <div>{error}</div>;

  // We want to pass the userPicks and userData.username & userData.score to the Bracket and header

  return (
    <div className="user-bracket-page" style={{ backgroundColor: "navy", minHeight: "100vh", color: "white" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid white",
          position: "sticky",
          top: 0,
          backgroundColor: "navy",
          zIndex: 100,
          }}
	   >
        <button
          style={{
            color: "white",
            background: "none",
            border: "1px solid white",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/tournament")}
        >
          Back
        </button>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>🏟️ 2025 CWS Bracket ⚾</h1>
        <div style={{ color: "darkorange" }}>
          {userData.username} - {userData.score} {userData.score === 1 ? "point" : "points"}
        </div>
      </header>
	<main style={{ padding: "20px" }}>
        {/* 
          Pass the userPicks and a prop to Bracket so it loads the picks for this user.
          You will likely need to update your Bracket component to accept props for picks and username to display properly.
        */}
        <Bracket userPicks={userPicks} viewedUsername={userData.username} />
      </main>
    </div>
  );
}

export default UserBracketPage;
