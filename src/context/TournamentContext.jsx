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

const TournamentContext = createContext();

export const TournamentProvider = ({ children, viewUserId = null }) => {
  const [games, setGames] = useState({});
  const [user, setUser] = useState(null);
  const [userPicks, setUserPicks] = useState({});

    const saveUserPick = async (userId, gameId, teamName) => {
    const userDocRef = doc(db, "userPicks", userId);
    if (teamName === null) {
      await updateDoc(userDocRef, { [gameId]: deleteField() }).catch(async () => {
        // If missing, ensure the doc exists so later updates don't fail silently
        await setDoc(userDocRef, {});
      });
    } else {
      await setDoc(userDocRef, { [gameId]: teamName }, { merge: true });
    }
  };

  const defaultGames = {};
  for (let i = 1; i <= 15; i++) {
    defaultGames[String(i)] = {
      team1: "",
      team2: "",
      winner: "",
      locked: false,
      ...(i === 15 && { champion: "TBD" }),
    };
  }


    // Load/seed games (2025)
  useEffect(() => {
    const gamesDocRef = doc(db, "tournament", "games");
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

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      console.log("Auth user set:", firebaseUser?.uid || "no user");
    });
    return () => unsubscribe();
  }, []);

    useEffect(() => {
    const uidToUse = viewUserId ?? user?.uid;
    if (!uidToUse) {
      setUserPicks({});
      return;
    }

    const userDocRef = doc(db, "userPicks", uidToUse);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => setUserPicks(docSnap.exists() ? docSnap.data() : {}),
      (err) => {
        console.error("userPicks onSnapshot error:", err);
        setUserPicks({});
      }
    );
    return () => unsubscribe();
    }, [viewUserId, user?.uid]);
    // Admin/general update to a specific game field(s)
  const updateGame = async (id, updatedData) => {
    const gamesDocRef = doc(db, "tournament", "games");
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

  // Batch: recompute & persist everyone’s scores (runs when games change)
  useEffect(() => {
    const updateAllUserScores = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const picksSnapshot = await getDocs(collection(db, "userPicks"));

      const picksByUid = {};
      picksSnapshot.forEach((d) => {
        picksByUid[d.id] = d.data() || {};
      });
	
      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        const udata = userDoc.data() || {};
        const username = (udata.username || uid).toString().trim();

        let raw = 0;
        const userPicks = picksByUid[uid] || {};
        Object.entries(userPicks).forEach(([gid, pick]) => {
          const g = games[gid];
          if (g?.winner && pick === g.winner) raw += 1;
        });

        let adjusted = raw;

        // ---- If you want Firestore to store Brandon’s +0.5, UNCOMMENT below ----
        // const unameLower = username.toLowerCase();
        // const emailLower = (udata.email || "").toString().trim().toLowerCase();
        // const isBrandon =
        //   unameLower === "brandon_beach_ftw" || emailLower === "brandon_beach_ftw@fake.com";
          // if (isBrandon) adjusted += 0.5;
	  // -------------------------------------------------------------------------

        if (udata.score !== adjusted) {
          const userRef = doc(db, "users", uid);
          try {
            await updateDoc(userRef, { score: adjusted });
          } catch {
            await setDoc(userRef, { username, score: adjusted }, { merge: true });
          }
        }
      }
    };

    if (Object.keys(games).length > 0) updateAllUserScores();
  }, [games]);

  // Keep this user’s score synced (optional; OK to leave if you want the same behavior as before)
  useEffect(() => {
    if (!user || !games || Object.keys(games).length === 0) return;
      if (user.email === "loganbeach11@fake.com") return;
      const syncMyScore = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const current = userSnap.exists() ? userSnap.data() : {};
      const username = current.username || user.uid;

      let raw = 0;
      Object.entries(userPicks || {}).forEach(([gid, pick]) => {
        const g = games[gid];
        if (g?.winner && pick === g.winner) raw += 1;
      });

      let adjusted = raw;

      // ---- If you also want Brandon’s +0.5 applied here, UNCOMMENT below ----
      // const uNameLower = (username || "").toString().trim().toLowerCase();
      // const uEmailLower = (current.email || user.email || "")
	  //   .toString()
	  //   .trim()
      //   .toLowerCase();
      // const isBrandon =
      //   uNameLower === "brandon_beach_ftw" || uEmailLower === "brandon_beach_ftw@fake.com";
      // if (isBrandon) adjusted += 0.5;
      // -----------------------------------------------------------------------

      if (current.score !== adjusted) {
        await setDoc(userRef, { username, score: adjusted }, { merge: true });
      }
    };

    syncMyScore();
  }, [games, userPicks, user]);

  return (
    <TournamentContext.Provider
      value={{
        games,
            updateGame,
	    user,
        setUser,
        saveUserPick,
        userPicks,
        // ⛔️ removed setViewUserId (it didn’t exist)
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => useContext(TournamentContext);
