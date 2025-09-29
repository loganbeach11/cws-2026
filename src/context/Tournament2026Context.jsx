// src/context/Tournament2026Context.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  collection,
  getDocs,
} from "firebase/firestore";

const Tournament2026Context = createContext();

export const Tournament2026Provider = ({ children }) => {
  const [games, setGames] = useState({});
  const [user, setUser] = useState(null);
  const [userPicks, setUserPicks] = useState({});
    const [lockStatus, setLockStatus] = useState({});
    
  const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks2026", userId);
    if (teamName === null) {
      await updateDoc(userDocRef, { [gameId]: deleteField() }).catch(async () => {
        // If doc doesn't exist yet, nothing to delete — ensure doc exists to avoid future errors
        await setDoc(userDocRef, {});
      });
    } else {
      await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });
    }
  };

  const defaultGames = {};
  for (let i = 1; i <= 15; i++) {
    defaultGames[String(i)] = {
      team1: "TBD",
      team2: "TBD",
      winner: "",
      locked: false,
      ...(i === 15 && { champion: "TBD" }),
    };
  }
    // Subscribe to 2026 games doc; seed if missing
  useEffect(() => {
    const gamesDocRef = doc(db, "tournament2026", "games");
    const unsubscribe = onSnapshot(gamesDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setGames(docSnap.data());
      } else {
        await setDoc(gamesDocRef, defaultGames);
        setGames(defaultGames);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to this user's 2026 picks
    useEffect(() => {
	if (!user) return;
    const userDocRef = doc(db, "userPicks2026", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      setUserPicks(docSnap.exists() ? docSnap.data() : {});
    });
    return () => unsubscribe();
  }, [user]);

  // Admin/general update to a specific game field(s) in 2026 doc
  const updateGame = async (id, updatedData) => {
    const gamesDocRef = doc(db, "tournament2026", "games");
    await setDoc(
      gamesDocRef,
      {
        [id]: {
          ...games[id],
          ...updatedData,
        },
      },
      { merge: true }
    );
  };

  // Recalculate & persist 2026 scores (mirrors your 2025 logic)
  useEffect(() => {
      const updateAllUserScores = async () => {
	  const usersSnapshot = await getDocs(collection(db, "users2026"));
      const picksSnapshot = await getDocs(collection(db, "userPicks2026"));

      const picksData = {};
      picksSnapshot.forEach((d) => (picksData[d.id] = d.data()));

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const userPicks = picksData[uid] || {};
        let rawScore = 0;

        const current = userDoc.data();
        const currentUsername = current.username || uid;

        Object.entries(userPicks).forEach(([gameId, pick]) => {
          const game = games[gameId];
          if (game?.winner && game.winner === pick) rawScore += 1;
        });

        let adjustedScore = rawScore;

        // The special “Brandon_Beach_FTW” half-point logic (copied as-is)

        const userRef = doc(db, "users2026", uid);
        if (current.score !== adjustedScore) {
          try {
            await updateDoc(userRef, { score: adjustedScore });
          } catch {
            await setDoc(userRef, { username: currentUsername, score: adjustedScore }, { merge: true });
          }
        }
      }
      };
      if (Object.keys(games).length > 0) updateAllUserScores();
  }, [games]);

  // Keep this user’s 2026 score updated on their doc (0 initially)
  useEffect(() => {
    const syncMyScore = async () => {
      if (!user || !games || Object.keys(games).length === 0 || Object.keys(userPicks).length === 0) return;

      const userRef = doc(db, "users2026", user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      const currentUsername = currentData.username || user.uid;

      let score = 0;
      Object.entries(userPicks).forEach(([gameId, pick]) => {
        const g = games[gameId];
        if (g?.winner && pick === g.winner) score += 1;
      });

      // special user half-point case
	if (currentData.score !== adjustedScore) {
        await setDoc(
          userRef,
          { username: currentUsername, score: adjustedScore },
          { merge: true }
        );
      }
    };

    syncMyScore();
  }, [games, userPicks, user]);

    useEffect(() => {
  const gamesDocRef = doc(db, "tournament2026", "games");

  const unsubscribe = onSnapshot(
    gamesDocRef,
    async (docSnap) => {
      const data = docSnap.exists() ? (docSnap.data() || {}) : null;

      // Seed if the doc is missing OR exists but has no fields
      const isMissingOrEmpty = !data || Object.keys(data).length === 0;

      if (isMissingOrEmpty) {
        try {
          await setDoc(gamesDocRef, defaultGames);
          setGames(defaultGames);
        } catch (e) {
          console.error("Failed to seed 2026 games:", e);
          setGames({}); // keep safe default
        }
      } else {
        setGames(data);
      }
    },
    (err) => {
      console.error("2026 games snapshot error:", err);
    }
  );

  return () => unsubscribe();
}, []);

    

  return (
    <Tournament2026Context.Provider
      value={{
            games,
	    setGames,
            updateGame,
	    user,
	    currentUser: user,
        setUser,
        saveUserPick,
            userPicks,
	    lockStatus,
	    setLockStatus,
      }}
    >
      {children}
    </Tournament2026Context.Provider>
  );
};

export const useTournament2026 = () => useContext(Tournament2026Context);
